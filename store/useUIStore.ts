import { create } from "zustand";

interface UIState {
  duration: number;

  setDuration: (duration: number) => void;
  incrementDuration: () => void;
  resetDuration: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  duration: 0,

  setDuration: (duration) => set({ duration }),
  incrementDuration: () => {
    const { duration } = get();
    set({ duration: duration + 1 });
  },
  resetDuration: () => set({ duration: 0 }),
}));