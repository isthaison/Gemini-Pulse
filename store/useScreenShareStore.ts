import { create } from "zustand";
import { useMessageStore } from "./useMessageStore";

interface ScreenShareState {
  isScreenSharing: boolean;
  screenStream: MediaStream | null;

  setIsScreenSharing: (sharing: boolean) => void;
  setScreenStream: (stream: MediaStream | null) => void;

  toggleScreenShare: (
    callRefs: React.MutableRefObject<Map<string, any>>
  ) => Promise<void>;
  stopScreenShare: () => void;
  cleanupScreenShare: () => void;
}

export const useScreenShareStore = create<ScreenShareState>((set, get) => ({
  isScreenSharing: false,
  screenStream: null,

  setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setScreenStream: (stream) => set({ screenStream: stream }),

  toggleScreenShare: async (callRefs) => {
    const { isScreenSharing, screenStream } = get();
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Get camera stream back
        let camStream;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err) {
          console.error("Failed to get camera stream:", err);
          throw new Error("Camera access denied");
        }
        const camVideoTrack = camStream.getVideoTracks()[0];

        // Replace video track for all active calls with camera
        for (const [peerId, call] of callRefs.current) {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) await videoSender.replaceTrack(camVideoTrack);
          }
        }

        set({ screenStream: null, isScreenSharing: false });
      } else {
        // Start screen sharing
        let screenStream;
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            }
          });
        } catch (err) {
          console.error("Screen sharing failed:", err);
          throw new Error("Screen sharing was denied or not supported");
        }

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        
        // Handle screen stream ending
        screenVideoTrack.onended = () => {
          console.log("Screen sharing ended by user");
          set({ isScreenSharing: false, screenStream: null });
        };

        // Replace video track for all active calls with screen
        for (const [peerId, call] of callRefs.current) {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) await videoSender.replaceTrack(screenVideoTrack);
          }
        }

        set({ screenStream, isScreenSharing: true });
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content: `Screen sharing error: ${err.message || 'Unknown error'}`,
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    }
  },

  stopScreenShare: () => {
    const { screenStream, isScreenSharing } = get();
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      set({ screenStream: null, isScreenSharing: false });
    }
  },

  cleanupScreenShare: () => {
    const { screenStream } = get();
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    set({
      screenStream: null,
      isScreenSharing: false,
    });
  },
}));