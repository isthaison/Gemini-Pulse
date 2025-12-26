import { create } from "zustand";
import { usePeerStore } from "./usePeerStore";
import { useCallStore } from "./useCallStore";
import { useChatStore } from "./useChatStore";

interface RoomState {
  roomId: string | null;
  isHost: boolean;

  createRoom: () => string | null;
  joinRoom: (roomId: string, localStream?: MediaStream) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomId: null,
  isHost: false,

  createRoom: () => {
    const id = usePeerStore.getState().peerId || null;
    if (!id) return null;
    set({ roomId: id, isHost: true });
    return id;
  },

  joinRoom: (roomId: string, localStream?: MediaStream) => {
    if (!roomId) return;
    set({ roomId, isHost: false });
    // add host to remoteIds so App can call
    useCallStore.getState().setRemoteIds([roomId]);
    // if local stream provided, attempt to call immediately
    if (localStream && useCallStore.getState().callPeers) {
      try {
        useCallStore.getState().callPeers([roomId], localStream);
      } catch (err) {
        console.error("Error calling host on joinRoom", err);
      }
    }
  },

  leaveRoom: () => {
    set({ roomId: null, isHost: false });
    useCallStore.getState().setRemoteIds([]);
    // close calls/data
    try {
      useCallStore.getState().endAllCalls();
    } catch (err) {
      console.error("Error leaving room", err);
    }
  },
}));