import { create } from "zustand";
import { ChatMessage } from "../types";
import { usePeerStore } from "./usePeerStore";
import { useMessageStore } from "./useMessageStore";

interface ChatState {
  chatInput: string;
  copyFeedback: boolean;

  setChatInput: (chatInput: string) => void;
  setCopyFeedback: (copyFeedback: boolean) => void;
  sendMessageToPeers: (message: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatInput: "",
  copyFeedback: false,

  setChatInput: (chatInput) => set({ chatInput }),
  setCopyFeedback: (copyFeedback) => set({ copyFeedback }),

  sendMessageToPeers: (message: string) => {
    usePeerStore.getState().dataConnRefs.current.forEach((conn) => {
      if (conn && conn.open) conn.send(message);
    });
  },
}));