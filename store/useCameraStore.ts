import { create } from "zustand";
import React from "react";
import { useMessageStore } from "./useMessageStore";

interface CameraState {
  localVideoStream: MediaStream | null;
  isCameraOff: boolean;
  availableVideoDevices: MediaDeviceInfo[];
  selectedVideoDevice: string | null;

  setLocalVideoStream: (stream: MediaStream | null) => void;
  setIsCameraOff: (off: boolean) => void;
  setAvailableVideoDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedVideoDevice: (deviceId: string | null) => void;

  initCamera: () => Promise<MediaStream | null>;
  toggleCamera: () => void;
  refreshVideoDevices: () => Promise<void>;
  cleanupCamera: () => void;
}

export const useCameraStore = create<CameraState>((set, get) => {
  const cameraStreamRef = React.createRef<MediaStream | null>();
  const isInitializedRef = React.createRef<boolean>();

  // Initialize refs
  if (!cameraStreamRef.current) cameraStreamRef.current = null;
  if (!isInitializedRef.current) isInitializedRef.current = false;

  const refreshVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("enumerateDevices not supported");
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      set({ availableVideoDevices: videoDevices });

      // Auto-select device if not already selected
      const { selectedVideoDevice } = get();
      if (!selectedVideoDevice && videoDevices.length > 0) {
        set({ selectedVideoDevice: videoDevices[0].deviceId });
      }
    } catch (err) {
      console.error("Error enumerating video devices:", err);
    }
  };

  return {
    localVideoStream: null,
    isCameraOff: false,
    availableVideoDevices: [],
    selectedVideoDevice: null,

    setLocalVideoStream: (stream) => set({ localVideoStream: stream }),
    setIsCameraOff: (off) => set({ isCameraOff: off }),
    setAvailableVideoDevices: (devices) => set({ availableVideoDevices: devices }),
    setSelectedVideoDevice: (deviceId) => set({ selectedVideoDevice: deviceId }),

    initCamera: async () => {
      try {
        // Prevent multiple initializations
        if (isInitializedRef.current) {
          return get().localVideoStream;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Media devices not supported. Please use a modern browser.");
        }

        // Refresh available devices first
        await refreshVideoDevices();

        const { selectedVideoDevice } = get();

        const constraints: MediaStreamConstraints = {
          video: selectedVideoDevice
            ? {
                deviceId: { exact: selectedVideoDevice },
                width: 1280,
                height: 720,
              }
            : { width: 1280, height: 720 },
        };

        let stream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('Camera stream created:', {
          videoTracks: stream.getVideoTracks().length,
          videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
          videoTrackLabel: stream.getVideoTracks()[0]?.label
        });

        // Ensure video track is enabled
        stream.getVideoTracks().forEach((track) => {
          if (!track.enabled) {
            track.enabled = true;
          }
        });

        cameraStreamRef.current = stream;
        set({ localVideoStream: stream });
        isInitializedRef.current = true;
        return stream;
      } catch (err) {
        console.error("Failed to get camera stream:", err);
        return null;
      }
    },

    toggleCamera: () => {
      const { localVideoStream, isCameraOff } = get();
      if (localVideoStream) {
        localVideoStream.getVideoTracks().forEach((track) => {
          track.enabled = !track.enabled;
        });
        set({ isCameraOff: !isCameraOff });
      }
    },

    

    refreshVideoDevices,

    cleanupCamera: () => {
      const { localVideoStream } = get();
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      set({
        localVideoStream: null,
        isCameraOff: false,
        availableVideoDevices: [],
        selectedVideoDevice: null,
      });
      isInitializedRef.current = false;
    },
  };
});