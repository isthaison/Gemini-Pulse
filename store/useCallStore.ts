import { create } from "zustand";
import { MediaConnection, DataConnection } from "peerjs";
import { RemotePeer } from "../types";
import { usePeerStore } from "./usePeerStore";
import { useMessageStore } from "./useMessageStore";

interface CallState {
  remoteIds: string[];
  remotePeers: RemotePeer[];
  connectedPeersCount: number;
  isCalling: boolean;
  pendingIncomingCall: string | null;

  setRemoteIds: (remoteIds: string[]) => void;
  addRemoteId: (id: string) => void;
  removeRemoteId: (id: string) => void;
  setRemotePeers: (remotePeers: RemotePeer[]) => void;
  addRemotePeer: (peer: RemotePeer) => void;
  removeRemotePeer: (id: string) => void;
  setConnectedPeersCount: (count: number) => void;
  setIsCalling: (isCalling: boolean) => void;

  callPeers: (remoteIds: string[], localStream: MediaStream) => void;
  endAllCalls: () => void;
  acceptIncomingCall: (callerId: string, localStream: MediaStream) => Promise<void>;
  rejectIncomingCall: (callerId: string) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  remoteIds: [],
  remotePeers: [],
  connectedPeersCount: 0,
  isCalling: false,
  pendingIncomingCall: null,

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

  callPeers: (remoteIds: string[], localStream: MediaStream) => {
    const peer = usePeerStore.getState().peerRef.current;
    if (!peer || !localStream) return;

    console.info("callPeers -> connecting to:", remoteIds);

    // Expose local stream globally for incoming-call answer in store
    (window as any)._localStream = localStream;

    remoteIds.forEach((remoteId) => {
      let call: MediaConnection | null = null;
      try {
        call = peer.call(remoteId, localStream);
        console.info("Outgoing call initiated to", remoteId);
      } catch (err) {
        console.error("Failed to start call to", remoteId, err);
        useMessageStore.getState().addMessage({
          id: Date.now().toString(),
          content: `Failed to start call to ${remoteId}`,
          sender: "system",
          senderId: "system",
          timestamp: new Date(),
        });
        return;
      }
      usePeerStore.getState().callRefs.current.set(remoteId, call);

      // If no remote stream arrives within X ms, surface a system warning
      const streamTimeout = setTimeout(() => {
        console.warn(`No remote stream from ${remoteId} after timeout`);
        // increment retry count
        const retries = usePeerStore.getState().callRetryCounts.current.get(remoteId) || 0;
        if (retries < 2) {
          usePeerStore.getState().callRetryCounts.current.set(remoteId, retries + 1);
          useMessageStore.getState().addMessage({
            id: Date.now().toString(),
            content: `Awaiting Signal: no media from ${remoteId} yet. Retrying (${retries + 1}/2)...`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
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
          useMessageStore.getState().addMessage({
            id: Date.now().toString(),
            content: `Awaiting Signal: no media from ${remoteId} after retries. Network / ICE may be blocked.`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          });
        }
      }, 10000);

      call.on("stream", (remoteStream: MediaStream) => {
        clearTimeout(streamTimeout);
        // successful stream — clear retry counter
        usePeerStore.getState().callRetryCounts.current.delete(remoteId);
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
        usePeerStore.getState().callRefs.current.delete(remoteId);
        set({
          remotePeers: get().remotePeers.filter((p) => p.id !== remoteId),
        });
        set({
          connectedPeersCount: Math.max(0, get().connectedPeersCount - 1),
        });
      });

      call.on("error", (err) => {
        console.error("Outgoing call error (store):", err);
        useMessageStore.getState().addMessage({
          id: Date.now().toString(),
          content: `Call error with ${remoteId}`,
          sender: "system",
          senderId: "system",
          timestamp: new Date(),
        });
      });

      // Data connection
      let conn: DataConnection | null = null;
      try {
        conn = peer.connect(remoteId);
        usePeerStore.getState().dataConnRefs.current.set(remoteId, conn);
        console.info("Data connection initiated to", remoteId);
      } catch (err) {
        console.error("Failed to create data connection to", remoteId, err);
        useMessageStore.getState().addMessage({
          id: Date.now().toString(),
          content: `Failed to connect data channel to ${remoteId}`,
          sender: "system",
          senderId: "system",
          timestamp: new Date(),
        });
      }
      if (conn) {
        conn.on("open", () => {
          // data channel open
        });
        conn.on("data", (data: any) => {
          useMessageStore.getState().addMessage({
            id: Date.now().toString(),
            content: data,
            sender: "peer",
            senderId: remoteId,
            timestamp: new Date(),
          });
        });
        conn.on("error", (err) => {
          console.error("Data connection error (store) with", remoteId, err);
          useMessageStore.getState().addMessage({
            id: Date.now().toString(),
            content: `Data channel error with ${remoteId}`,
            sender: "system",
            senderId: "system",
            timestamp: new Date(),
          });
        });
      }
    });
  },

  endAllCalls: () => {
    usePeerStore.getState().callRefs.current.forEach((call) => call.close());
    usePeerStore.getState().dataConnRefs.current.forEach((conn) => conn.close());
    usePeerStore.getState().callRefs.current.clear();
    usePeerStore.getState().dataConnRefs.current.clear();
  },

  acceptIncomingCall: async (callerId: string, localStream: MediaStream): Promise<void> => {
    const call = usePeerStore.getState().callRefs.current.get(callerId);
    if (!call) {
      console.warn('acceptIncomingCall: no call object for', callerId);
      return;
    }
    try {
      call.answer(localStream);
      set({ pendingIncomingCall: null, isCalling: true });
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Accepted call from ${callerId}`,
        sender: 'system',
        senderId: 'system',
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Error answering incoming call', err);
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Failed to accept call from ${callerId}`,
        sender: 'system',
        senderId: 'system',
        timestamp: new Date(),
      });
    }
  },

  rejectIncomingCall: (callerId: string) => {
    const call = usePeerStore.getState().callRefs.current.get(callerId);
    if (!call) return;
    try {
      call.close();
    } catch (err) {
      console.warn('Error closing rejected call', err);
    }
    usePeerStore.getState().callRefs.current.delete(callerId);
    set({ pendingIncomingCall: null });
    useMessageStore.getState().addMessage({
      id: Date.now().toString(),
      content: `Rejected call from ${callerId}`,
      sender: 'system',
      senderId: 'system',
      timestamp: new Date(),
    });
  },
}));