import { create } from "zustand";

interface UIState {
  duration: number;
  remoteVolume: number;

  setDuration: (duration: number) => void;
  incrementDuration: () => void;
  resetDuration: () => void;
  setRemoteVolume: (volume: number) => void;
  setRemoteVolumeAction: (volume: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  duration: 0,
  remoteVolume: 1,

  setDuration: (duration) => set({ duration }),
  incrementDuration: () => {
    const { duration } = get();
    set({ duration: duration + 1 });
  },
  resetDuration: () => set({ duration: 0 }),
  setRemoteVolume: (volume) => set({ remoteVolume: volume }),
  setRemoteVolumeAction: (volume) => set({ remoteVolume: volume }),
}));