import { ChatMessage, RemotePeer } from "../types";
import { create } from "zustand";
import { Peer, MediaConnection, DataConnection } from "peerjs";

interface AppState {
  // Connection State
  peerId: string;
  remoteIds: string[];
  remotePeers: RemotePeer[];
  connectedPeersCount: number;
  isCalling: boolean;

  // Chat State
  messages: ChatMessage[];
  chatInput: string;
  copyFeedback: boolean;
  duration: number;
  // Room / Host
  roomId: string | null;
  isHost: boolean;

  // Incoming calls
  pendingIncomingCall: string | null;

  // Actions
  setPeerId: (peerId: string) => void;
  // Peer manager
  initPeer: () => void;
  callPeers: (remoteIds: string[], localStream: MediaStream) => void;
  endAllCalls: () => void;
  sendMessageToPeers: (message: string) => void;
  reconnectPeer: () => void;
  peerRef: { current: Peer | null };
  callRefs: { current: Map<string, MediaConnection> };
  dataConnRefs: { current: Map<string, DataConnection> };
  callRetryCounts: { current: Map<string, number> };

  // Signaling state API
  signalingState: "unknown" | "ready" | "disconnected" | "closed";
  setSignalingState: (
    state: "unknown" | "ready" | "disconnected" | "closed"
  ) => void;

  // Room actions
  createRoom: () => string | null;
  joinRoom: (roomId: string, localStream?: MediaStream) => void;
  leaveRoom: () => void;
  setRemoteIds: (remoteIds: string[]) => void;
  addRemoteId: (id: string) => void;
  removeRemoteId: (id: string) => void;
  setRemotePeers: (remotePeers: RemotePeer[]) => void;
  addRemotePeer: (peer: RemotePeer) => void;
  removeRemotePeer: (id: string) => void;
  setConnectedPeersCount: (count: number) => void;
  setIsCalling: (isCalling: boolean) => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setChatInput: (chatInput: string) => void;
  setCopyFeedback: (copyFeedback: boolean) => void;
  setDuration: (duration: number) => void;
  incrementDuration: () => void;
  resetDuration: () => void;

  // Incoming call actions
  acceptIncomingCall: (callerId: string, localStream: MediaStream) => Promise<void>;
  rejectIncomingCall: (callerId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  peerId: "",
  remoteIds: [],
  remotePeers: [],
  connectedPeersCount: 0,
  isCalling: false,

  messages: [],
  chatInput: "",
  copyFeedback: false,
  duration: 0,
  roomId: null,
  isHost: false,

  // Incoming calls
  pendingIncomingCall: null,

  // Signaling
  signalingState: "unknown",

  setSignalingState: (state) => set({ signalingState: state }),
  setPeerId: (peerId) => set({ peerId }),

  setRemoteIds: (remoteIds) => set({ remoteIds }),

  addRemoteId: (id) => {
    const { remoteIds } = get();
    if (id && !remoteIds.includes(id)) {
      set({ remoteIds: [...remoteIds, id] });
    }
  },

  removeRemoteId: (id) => {
    const { remoteIds } = get();
    set({ remoteIds: remoteIds.filter((peerId) => peerId !== id) });
  },

  setRemotePeers: (remotePeers) => set({ remotePeers }),

  addRemotePeer: (peer) => {
    const { remotePeers } = get();
    if (!remotePeers.find((p) => p.id === peer.id)) {
      set({ remotePeers: [...remotePeers, peer] });
    }
  },

  removeRemotePeer: (id) => {
    const { remotePeers } = get();
    set({ remotePeers: remotePeers.filter((peer) => peer.id !== id) });
  },

  setConnectedPeersCount: (count) => set({ connectedPeersCount: count }),

  setIsCalling: (isCalling) => set({ isCalling }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  setChatInput: (chatInput) => set({ chatInput }),

  setCopyFeedback: (copyFeedback) => set({ copyFeedback }),

  setDuration: (duration) => set({ duration }),

  incrementDuration: () => {
    const { duration } = get();
    set({ duration: duration + 1 });
  },

  resetDuration: () => set({ duration: 0 }),




  // Room actions
  createRoom: () => {
    const id = get().peerId || null;
    if (!id) return null;
    set({ roomId: id, isHost: true });
    return id;
  },

  joinRoom: (roomId: string, localStream?: MediaStream) => {
    if (!roomId) return;
    set({ roomId, isHost: false });
    // add host to remoteIds so App can call
    set({ remoteIds: [roomId] });
    // if local stream provided, attempt to call immediately
    if (localStream && get().callPeers) {
      try {
        get().callPeers([roomId], localStream);
      } catch (err) {
        console.error("Error calling host on joinRoom", err);
      }
    }
  },

  leaveRoom: () => {
    set({ roomId: null, isHost: false, remoteIds: [] });
    // close calls/data
    try {
      get().endAllCalls();
    } catch (err) {
      console.error("Error leaving room", err);
    }
  },

  // Peer manager internals
  peerRef: { current: null },
  callRefs: { current: new Map() },
  dataConnRefs: { current: new Map() },
  callRetryCounts: { current: new Map() },

  acceptIncomingCall: async (callerId: string, localStream: MediaStream): Promise<void> => {
    const call = get().callRefs.current.get(callerId);
    if (!call) {
      console.warn('acceptIncomingCall: no call object for', callerId);
      return;
    }
    try {
      call.answer(localStream);
      set({ pendingIncomingCall: null, isCalling: true });
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: `Accepted call from ${callerId}`,
            sender: 'system',
            senderId: 'system',
            timestamp: new Date(),
          },
        ],
      });
    } catch (err) {
      console.error('Error answering incoming call', err);
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: `Failed to accept call from ${callerId}`,
            sender: 'system',
            senderId: 'system',
            timestamp: new Date(),
          },
        ],
      });
    }
  },

  rejectIncomingCall: (callerId: string) => {
    const call = get().callRefs.current.get(callerId);
    if (!call) return;
    try {
      call.close();
    } catch (err) {
      console.warn('Error closing rejected call', err);
    }
    get().callRefs.current.delete(callerId);
    set({ pendingIncomingCall: null });
    set({
      messages: [
        ...get().messages,
        {
          id: Date.now().toString(),
          content: `Rejected call from ${callerId}`,
          sender: 'system',
          senderId: 'system',
          timestamp: new Date(),
        },
      ],
    });
  },

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
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: `Peer ready: ${id}`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          },
        ],
      });
    });

    // connection lifecycle / signaling feedback
    peer.on("disconnected", () => {
      get().setSignalingState("disconnected");
      console.warn("PeerJS: disconnected from signalling server");
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content:
              "Signaling disconnected (Awaiting Signal). Check network or PeerServer.",
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          },
        ],
      });
    });

    peer.on("close", () => {
      get().setSignalingState("closed");
      console.warn("PeerJS: connection closed");
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: "Peer connection closed. Re-initialize peer to reconnect.",
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          },
        ],
      });
    });



    const setupDataConnection = (peerId: string, conn: DataConnection) => {
      conn.on("open", () => {
        get().dataConnRefs.current.set(peerId, conn);
      });

      conn.on("data", (data: any) => {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          content: data,
          sender: "peer",
          senderId: peerId,
          timestamp: new Date(),
        };
        set({ messages: [...get().messages, chatMessage] });
      });

      conn.on("close", () => {
        get().dataConnRefs.current.delete(peerId);
      });

      conn.on("error", (err) => {
        console.error("Data connection error (store) with", peerId, err);
      });
    };

    peer.on("connection", (conn: DataConnection) => {
      setupDataConnection(conn.peer, conn);
      const existing = get().remotePeers.find((p) => p.id === conn.peer);
      if (existing) {
        set({
          remotePeers: get().remotePeers.map((p) =>
            p.id === conn.peer ? { ...p, dataConnection: conn } : p
          ),
        });
      } else {
        set({
          remotePeers: [
            ...get().remotePeers,
            {
              id: conn.peer,
              stream: null,
              isConnected: false,
              call: null,
              dataConnection: conn,
            },
          ],
        });
      }
    });

    peer.on("call", (call: MediaConnection) => {
      console.log("Incoming call from peer (store):", call.peer);

      // Ignore duplicate incoming calls for same peer
      if (get().callRefs.current.has(call.peer) || get().pendingIncomingCall === call.peer) {
        console.warn("Duplicate incoming call ignored from", call.peer);
        return;
      }

      // store call object and surface a pending incoming call for user to accept/reject
      get().callRefs.current.set(call.peer, call);
      set({ pendingIncomingCall: call.peer });
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: `Incoming call from ${call.peer}`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          },
        ],
      });

      // Attach handlers so stream/close are handled after acceptance
      call.on("stream", (remoteStream: MediaStream) => {
        const existing = get().remotePeers.find((p) => p.id === call.peer);
        if (existing) {
          set({
            remotePeers: get().remotePeers.map((p) =>
              p.id === call.peer
                ? { ...p, stream: remoteStream, isConnected: true }
                : p
            ),
          });
        } else {
          set({
            remotePeers: [
              ...get().remotePeers,
              {
                id: call.peer,
                stream: remoteStream,
                isConnected: true,
                call,
                dataConnection: null,
              },
            ],
          });
        }
        set({ connectedPeersCount: get().connectedPeersCount + 1 });
        // clear pending state on successful connection
        if (get().pendingIncomingCall === call.peer) {
          set({ pendingIncomingCall: null });
        }
      });

      call.on("close", () => {
        get().callRefs.current.delete(call.peer);
        set({ pendingIncomingCall: null });
        set({
          remotePeers: get().remotePeers.filter((p) => p.id !== call.peer),
        });
        set({
          connectedPeersCount: Math.max(0, get().connectedPeersCount - 1),
        });
      });
    });

    peer.on("error", (err) => {
      console.error("Peer error (store):", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.type || err?.message || JSON.stringify(err);
      set({
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            content: `Peer error: ${msg}`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          },
        ],
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

  callPeers: (remoteIds: string[], localStream: MediaStream) => {
    const peer = get().peerRef.current;
    if (!peer || !localStream) return;

    console.info("callPeers -> connecting to:", remoteIds);
    console.debug("peerRef:", get().peerRef.current);

    // Expose local stream globally for incoming-call answer in store
    (window as any)._localStream = localStream;

    remoteIds.forEach((remoteId) => {
      let call: MediaConnection | null = null;
      try {
        call = peer.call(remoteId, localStream);
        console.info("Outgoing call initiated to", remoteId);
      } catch (err) {
        console.error("Failed to start call to", remoteId, err);
        set({
          messages: [
            ...get().messages,
            {
              id: Date.now().toString(),
              content: `Failed to start call to ${remoteId}`,
              sender: "system",
              senderId: "system",
              timestamp: new Date(),
            },
          ],
        });
        return;
      }
      get().callRefs.current.set(remoteId, call);

      // If no remote stream arrives within X ms, surface a system warning
      const streamTimeout = setTimeout(() => {
        console.warn(`No remote stream from ${remoteId} after timeout`);
        // increment retry count
        const retries = get().callRetryCounts.current.get(remoteId) || 0;
        if (retries < 2) {
          get().callRetryCounts.current.set(remoteId, retries + 1);
          set({
            messages: [
              ...get().messages,
              {
                id: Date.now().toString(),
                content: `Awaiting Signal: no media from ${remoteId} yet. Retrying (${
                  retries + 1
                }/2)...`,
                sender: "system",
                senderId: "system",
                timestamp: new Date(),
              },
            ],
          });
          // attempt retry after brief delay
          setTimeout(() => {
            try {
              get().callPeers([remoteId], localStream);
            } catch (err) {
              console.error("Retry callPeers failed", err);
            }
          }, 800);
        } else {
          set({
            messages: [
              ...get().messages,
              {
                id: Date.now().toString(),
                content: `Awaiting Signal: no media from ${remoteId} after retries. Network / ICE may be blocked.`,
                sender: "system",
                senderId: "system",
                timestamp: new Date(),
              },
            ],
          });
        }
      }, 10000);

      call.on("stream", (remoteStream: MediaStream) => {
        clearTimeout(streamTimeout);
        // successful stream — clear retry counter
        get().callRetryCounts.current.delete(remoteId);
        // reset any retry state messaging
        const existing = get().remotePeers.find((p) => p.id === remoteId);
        if (existing) {
          set({
            remotePeers: get().remotePeers.map((p) =>
              p.id === remoteId
                ? { ...p, stream: remoteStream, isConnected: true }
                : p
            ),
          });
        } else {
          set({
            remotePeers: [
              ...get().remotePeers,
              {
                id: remoteId,
                stream: remoteStream,
                isConnected: true,
                call,
                dataConnection: null,
              },
            ],
          });
        }
        set({ connectedPeersCount: get().connectedPeersCount + 1 });
      });

      call.on("close", () => {
        get().callRefs.current.delete(remoteId);
        set({
          remotePeers: get().remotePeers.filter((p) => p.id !== remoteId),
        });
        set({
          connectedPeersCount: Math.max(0, get().connectedPeersCount - 1),
        });
      });

      call.on("error", (err) => {
        console.error("Outgoing call error (store):", err);
        set({
          messages: [
            ...get().messages,
            {
              id: Date.now().toString(),
              content: `Call error with ${remoteId}`,
              sender: "system",
              senderId: "system",
              timestamp: new Date(),
            },
          ],
        });
      });

      // Data connection
      let conn: DataConnection | null = null;
      try {
        conn = peer.connect(remoteId);
        get().dataConnRefs.current.set(remoteId, conn);
        console.info("Data connection initiated to", remoteId);
      } catch (err) {
        console.error("Failed to create data connection to", remoteId, err);
        set({
          messages: [
            ...get().messages,
            {
              id: Date.now().toString(),
              content: `Failed to connect data channel to ${remoteId}`,
              sender: "system",
              senderId: "system",
              timestamp: new Date(),
            },
          ],
        });
      }
      if (conn) {
        conn.on("open", () => {
          // data channel open
        });
        conn.on("data", (data: any) => {
          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            content: data,
            sender: "peer",
            senderId: remoteId,
            timestamp: new Date(),
          };
          set({ messages: [...get().messages, chatMessage] });
        });
        conn.on("error", (err) => {
          console.error("Data connection error (store) with", remoteId, err);
          set({
            messages: [
              ...get().messages,
              {
                id: Date.now().toString(),
                content: `Data channel error with ${remoteId}`,
                sender: "system",
                senderId: "system",
                timestamp: new Date(),
              },
            ],
          });
        });
      }
    });
  },

  endAllCalls: () => {
    get().callRefs.current.forEach((call) => call.close());
    get().dataConnRefs.current.forEach((conn) => conn.close());
    get().callRefs.current.clear();
    get().dataConnRefs.current.clear();
  },

  sendMessageToPeers: (message: string) => {
    get().dataConnRefs.current.forEach((conn) => {
      if (conn && conn.open) conn.send(message);
    });
  },
}));
