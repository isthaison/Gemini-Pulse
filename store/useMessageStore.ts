import { create } from "zustand";
import { ChatMessage } from "../types";

interface MessageState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },
}));