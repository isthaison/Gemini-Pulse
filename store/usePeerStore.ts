import { create } from "zustand";
import { Peer, MediaConnection, DataConnection } from "peerjs";
import { useMessageStore } from "./useMessageStore";
import { useCallStore } from "./useCallStore";

interface PeerState {
  peerId: string;
  signalingState: "unknown" | "ready" | "disconnected" | "closed";
  peerRef: { current: Peer | null };
  callRefs: { current: Map<string, MediaConnection> };
  dataConnRefs: { current: Map<string, DataConnection> };
  callRetryCounts: { current: Map<string, number> };

  setPeerId: (peerId: string) => void;
  setSignalingState: (state: "unknown" | "ready" | "disconnected" | "closed") => void;
  initPeer: () => void;
  reconnectPeer: () => void;
}

export const usePeerStore = create<PeerState>((set, get) => ({
  peerId: "",
  signalingState: "unknown",
  peerRef: { current: null },
  callRefs: { current: new Map() },
  dataConnRefs: { current: new Map() },
  callRetryCounts: { current: new Map() },

  setPeerId: (peerId) => set({ peerId }),
  setSignalingState: (state) => set({ signalingState: state }),

  initPeer: () => {
    // Avoid double initialization
    if (get().peerRef.current) return;

    const peer = new Peer(undefined, {
      config: {
        iceServers: [
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

    peer.on("open", (id: string) => {
      set({ peerId: id });
      get().setSignalingState("ready");
      console.info("PeerJS: open ->", id);
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Peer ready: ${id}`,
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    });

    peer.on("disconnected", () => {
      get().setSignalingState("disconnected");
      console.warn("PeerJS: disconnected from signalling server");
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: "Signaling disconnected (Awaiting Signal). Check network or PeerServer.",
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    });

    peer.on("close", () => {
      get().setSignalingState("closed");
      console.warn("PeerJS: connection closed");
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: "Peer connection closed. Re-initialize peer to reconnect.",
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    });

    const setupDataConnection = (peerId: string, conn: DataConnection) => {
      conn.on("open", () => {
        get().dataConnRefs.current.set(peerId, conn);
      });

      conn.on("data", (data: any) => {
        useMessageStore.getState().addMessage({
          id: Date.now().toString(),
          content: data,
          sender: "peer",
          senderId: peerId,
          timestamp: new Date(),
        });
      });

      conn.on("close", () => {
        get().dataConnRefs.current.delete(peerId);
      });

      conn.on("error", (err) => {
        console.error("Data connection error (store) with", peerId, err);
        useMessageStore.getState().addMessage({
          id: Date.now().toString(),
          content: `Data channel error with ${peerId}`,
          sender: "system",
          senderId: "system",
          timestamp: new Date(),
        });
      });
    };

    peer.on("connection", (conn: DataConnection) => {
      setupDataConnection(conn.peer, conn);
      const existing = useCallStore.getState().remotePeers.find((p) => p.id === conn.peer);
      if (existing) {
        useCallStore.getState().setRemotePeers(
          useCallStore.getState().remotePeers.map((p) =>
            p.id === conn.peer ? { ...p, dataConnection: conn } : p
          )
        );
      } else {
        useCallStore.getState().setRemotePeers([
          ...useCallStore.getState().remotePeers,
          {
            id: conn.peer,
            stream: null,
            isConnected: false,
            call: null,
            dataConnection: conn,
          },
        ]);
      }
    });

    peer.on("call", (call: MediaConnection) => {
      console.log("Incoming call from peer (store):", call.peer);

      // Ignore duplicate incoming calls for same peer
      if (get().callRefs.current.has(call.peer) || useCallStore.getState().pendingIncomingCall === call.peer) {
        console.warn("Duplicate incoming call ignored from", call.peer);
        return;
      }

      // store call object and surface a pending incoming call for user to accept/reject
      get().callRefs.current.set(call.peer, call);
      useCallStore.getState().setRemoteIds([...useCallStore.getState().remoteIds, call.peer]); // add to remoteIds if not present
      useCallStore.setState({ pendingIncomingCall: call.peer });
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Incoming call from ${call.peer}`,
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });

      // Attach handlers so stream/close are handled after acceptance
      call.on("stream", (remoteStream: MediaStream) => {
        const existing = useCallStore.getState().remotePeers.find((p) => p.id === call.peer);
        if (existing) {
          useCallStore.getState().setRemotePeers(
            useCallStore.getState().remotePeers.map((p) =>
              p.id === call.peer
                ? { ...p, stream: remoteStream, isConnected: true }
                : p
            )
          );
        } else {
          useCallStore.getState().setRemotePeers([
            ...useCallStore.getState().remotePeers,
            {
              id: call.peer,
              stream: remoteStream,
              isConnected: true,
              call,
              dataConnection: null,
            },
          ]);
        }
        useCallStore.getState().setConnectedPeersCount(useCallStore.getState().connectedPeersCount + 1);
        // clear pending state on successful connection
        if (useCallStore.getState().pendingIncomingCall === call.peer) {
          useCallStore.setState({ pendingIncomingCall: null });
        }
      });

      call.on("close", () => {
        get().callRefs.current.delete(call.peer);
        useCallStore.setState({ pendingIncomingCall: null });
        useCallStore.getState().setRemotePeers(
          useCallStore.getState().remotePeers.filter((p) => p.id !== call.peer)
        );
        useCallStore.getState().setConnectedPeersCount(
          Math.max(0, useCallStore.getState().connectedPeersCount - 1)
        );
      });
    });

    peer.on("error", (err) => {
      console.error("Peer error (store):", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.type || err?.message || JSON.stringify(err);
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Peer error: ${msg}`,
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    });

    get().peerRef.current = peer;
  },

  reconnectPeer: () => {
    const p = get().peerRef.current;
    if (p) {
      try {
        p.destroy();
      } catch (e) {
        console.warn("Error destroying peer during reconnect", e);
      }
      get().peerRef.current = null;
    }
    set({ peerId: "" });
    setTimeout(() => {
      try {
        get().initPeer();
      } catch (err) {
        console.error("reconnectPeer -> initPeer failed", err);
      }
    }, 500);
  },
}));