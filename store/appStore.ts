import { ChatMessage, RemotePeer } from '../types';
import { create } from 'zustand';

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

  // Actions
  setPeerId: (peerId: string) => void;
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
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  peerId: '',
  remoteIds: [],
  remotePeers: [],
  connectedPeersCount: 0,
  isCalling: false,

  messages: [],
  chatInput: '',
  copyFeedback: false,
  duration: 0,

  // Actions
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
    set({ remoteIds: remoteIds.filter(peerId => peerId !== id) });
  },

  setRemotePeers: (remotePeers) => set({ remotePeers }),

  addRemotePeer: (peer) => {
    const { remotePeers } = get();
    if (!remotePeers.find(p => p.id === peer.id)) {
      set({ remotePeers: [...remotePeers, peer] });
    }
  },

  removeRemotePeer: (id) => {
    const { remotePeers } = get();
    set({ remotePeers: remotePeers.filter(peer => peer.id !== id) });
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
}));