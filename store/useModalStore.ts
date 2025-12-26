import { create } from "zustand";

export type ModalType =
  | "info"
  | "diagnostics"
  | "device-settings"
  | "incoming-call"
  | null;

interface ModalState {
  activeModal: ModalType;
  modalData: Record<string, any>;

  // Actions
  openModal: (type: ModalType, data?: Record<string, any>) => void;
  closeModal: () => void;
  setModalData: (data: Record<string, any>) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  activeModal: null,
  modalData: {},

  openModal: (type, data = {}) => {
    set({
      activeModal: type,
      modalData: data,
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      modalData: {},
    });
  },

  setModalData: (data) => {
    set((state) => ({
      modalData: { ...state.modalData, ...data },
    }));
  },
}));