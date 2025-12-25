import { useRef, useCallback } from "react";
import { Peer, MediaConnection, DataConnection } from "peerjs";
import { RemotePeer } from "../types";

interface UsePeerConnectionProps {
  onPeerIdGenerated: (id: string) => void;
  onRemotePeersUpdate: (peers: RemotePeer[]) => void;
  onConnectedPeersCountChange: (count: number) => void;
  onMessageReceived: (message: any, senderId: string) => void;
}

export const usePeerConnection = ({
  onPeerIdGenerated,
  onRemotePeersUpdate,
  onConnectedPeersCountChange,
  onMessageReceived,
}: UsePeerConnectionProps) => {
  const peerRef = useRef<Peer | null>(null);
  const callRefs = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnRefs = useRef<Map<string, DataConnection>>(new Map());

  const setupDataConnection = useCallback(
    (peerId: string, conn: DataConnection) => {
      conn.on("open", () => {
        dataConnRefs.current.set(peerId, conn);
      });
      conn.on("data", (data: any) => {
        onMessageReceived(data, peerId);
      });
      conn.on("close", () => {
        dataConnRefs.current.delete(peerId);
      });
    },
    [onMessageReceived]
  );

  const initPeer = useCallback(() => {
    // Configure PeerJS with public STUN/TURN servers for better connectivity
    const peer = new Peer({
      config: {
        iceServers: [
          // STUN servers - Help with NAT traversal
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.ekiga.net" },
          { urls: "stun:stun.ideasip.com" },
          { urls: "stun:stun.schlund.de" },
          { urls: "stun:stun.stunprotocol.org" },
          { urls: "stun:stun.voiparound.com" },
          { urls: "stun:stun.voipbuster.com" },
          { urls: "stun:stun.voipstunt.com" },
          { urls: "stun:stun.voxgratia.org" },
          // TURN servers - Provide relay when direct connection fails
          {
            urls: "turn:turn.anyfirewall.com:443?transport=tcp",
            username: "webrtc",
            credential: "webrtc",
          },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    peer.on("open", (id) => {
      onPeerIdGenerated(id);
    });

    // Handle incoming Calls
    peer.on("call", (call) => {
      console.log("Incoming call from peer:", call.peer);
      callRefs.current.set(call.peer, call);

      call.on("stream", (remoteStream) => {
        console.log("Remote stream received from:", call.peer);
        onRemotePeersUpdate((prev) => {
          const existingPeer = prev.find((p) => p.id === call.peer);
          if (existingPeer) {
            return prev.map((p) =>
              p.id === call.peer
                ? { ...p, stream: remoteStream, isConnected: true }
                : p
            );
          } else {
            return [
              ...prev,
              {
                id: call.peer,
                stream: remoteStream,
                isConnected: true,
                call: call,
                dataConnection: null,
              },
            ];
          }
        });
        onConnectedPeersCountChange((prev) => prev + 1);
      });

      call.on("close", () => {
        console.log("Call closed with peer:", call.peer);
        callRefs.current.delete(call.peer);
        onRemotePeersUpdate((prev) => prev.filter((p) => p.id !== call.peer));
        onConnectedPeersCountChange((prev) => Math.max(0, prev - 1));
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
      });
    });

    // Handle incoming Data Connections (Chat)
    peer.on("connection", (conn) => {
      console.log("Data connection established with peer:", conn.peer);
      setupDataConnection(conn.peer, conn);

      // Update the remote peer's data connection
      onRemotePeersUpdate((prev) => {
        const existingPeer = prev.find((p) => p.id === conn.peer);
        if (existingPeer) {
          return prev.map((p) =>
            p.id === conn.peer ? { ...p, dataConnection: conn } : p
          );
        } else {
          return [
            ...prev,
            {
              id: conn.peer,
              stream: null,
              isConnected: false,
              call: null,
              dataConnection: conn,
            },
          ];
        }
      });
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.on("disconnected", () => {
      console.log("Peer disconnected, attempting reconnection...");
      peer.reconnect();
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [
    onPeerIdGenerated,
    onRemotePeersUpdate,
    onConnectedPeersCountChange,
    setupDataConnection,
  ]);

  const callPeers = useCallback(
    (remoteIds: string[], localStream: MediaStream) => {
      if (!peerRef.current || !localStream) return;

      remoteIds.forEach((remoteId) => {
        // Start Video Call
        const call = peerRef.current!.call(remoteId, localStream);
        callRefs.current.set(remoteId, call);

        call.on("stream", (remoteStream) => {
          console.log("Remote stream received from:", remoteId);
          onRemotePeersUpdate((prev) => {
            const existingPeer = prev.find((p) => p.id === remoteId);
            if (existingPeer) {
              return prev.map((p) =>
                p.id === remoteId
                  ? { ...p, stream: remoteStream, isConnected: true }
                  : p
              );
            } else {
              return [
                ...prev,
                {
                  id: remoteId,
                  stream: remoteStream,
                  isConnected: true,
                  call: call,
                  dataConnection: null,
                },
              ];
            }
          });
          onConnectedPeersCountChange((prev) => prev + 1);
        });

        call.on("close", () => {
          console.log("Call closed with peer:", remoteId);
          callRefs.current.delete(remoteId);
          onRemotePeersUpdate((prev) => prev.filter((p) => p.id !== remoteId));
          onConnectedPeersCountChange((prev) => Math.max(0, prev - 1));
        });

        call.on("error", (err) => {
          console.error("Outgoing call error:", err);
        });

        // Start Data Connection
        const conn = peerRef.current!.connect(remoteId);
        setupDataConnection(remoteId, conn);
      });
    },
    [onRemotePeersUpdate, onConnectedPeersCountChange, setupDataConnection]
  );

  const endAllCalls = useCallback(() => {
    // Close all calls and data connections
    callRefs.current.forEach((call) => call.close());
    dataConnRefs.current.forEach((conn) => conn.close());

    // Clear all refs
    callRefs.current.clear();
    dataConnRefs.current.clear();
  }, []);

  const sendMessageToPeers = useCallback((message: string) => {
    // Send message to all connected peers
    dataConnRefs.current.forEach((conn) => {
      if (conn && conn.open) {
        conn.send(message);
      }
    });
  }, []);

  return {
    initPeer,
    callPeers,
    endAllCalls,
    sendMessageToPeers,
    callRefs,
    dataConnRefs,
  };
};
