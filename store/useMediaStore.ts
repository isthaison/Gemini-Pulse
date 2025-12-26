import { create } from "zustand";
import React from "react";

interface MediaState {
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteVolume: number;
  isTestingMic: boolean;
  micLevel: number;
  availableDevices: MediaDeviceInfo[];
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;

  setLocalStream: (stream: MediaStream | null) => void;
  setIsMuted: (muted: boolean) => void;
  setIsCameraOff: (off: boolean) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setRemoteVolume: (volume: number) => void;
  setIsTestingMic: (testing: boolean) => void;
  setMicLevel: (level: number) => void;
  setAvailableDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedAudioDevice: (deviceId: string | null) => void;
  setSelectedVideoDevice: (deviceId: string | null) => void;

  initMedia: () => Promise<MediaStream | null>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: (
    callRefs: React.MutableRefObject<Map<string, any>>
  ) => Promise<void>;
  setRemoteVolumeAction: (volume: number) => void;
  startMicTest: () => void;
  stopMicTest: () => void;
  startMicMonitoring: () => void;
  stopMicMonitoring: () => void;
  refreshDevices: () => Promise<void>;
  cleanup: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => {
  const cameraStreamRef = React.createRef<MediaStream | null>();
  const audioContextRef = React.createRef<AudioContext | null>();
  const analyserRef = React.createRef<AnalyserNode | null>();
  const animationFrameRef = React.createRef<number | null>();
  const isInitializedRef = React.createRef<boolean>();
  const micTestStreamRef = React.createRef<MediaStream | null>();

  // Initialize refs
  if (!cameraStreamRef.current) cameraStreamRef.current = null;
  if (!audioContextRef.current) audioContextRef.current = null;
  if (!analyserRef.current) analyserRef.current = null;
  if (!animationFrameRef.current) animationFrameRef.current = null;
  if (!isInitializedRef.current) isInitializedRef.current = false;
  if (!micTestStreamRef.current) micTestStreamRef.current = null;

  const refreshDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("enumerateDevices not supported");
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      set({ availableDevices: devices });

      // Auto-select devices if not already selected
      const { selectedAudioDevice, selectedVideoDevice } = get();
      if (!selectedAudioDevice) {
        const defaultAudio = devices.find(d => d.kind === 'audioinput');
        if (defaultAudio) {
          set({ selectedAudioDevice: defaultAudio.deviceId });
        }
      }
      if (!selectedVideoDevice) {
        const defaultVideo = devices.find(d => d.kind === 'videoinput');
        if (defaultVideo) {
          set({ selectedVideoDevice: defaultVideo.deviceId });
        }
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  return {
    localStream: null,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    remoteVolume: 1,
    isTestingMic: false,
    micLevel: 0,
    availableDevices: [],
    selectedAudioDevice: null,
    selectedVideoDevice: null,

    setLocalStream: (stream) => set({ localStream: stream }),
    setIsMuted: (muted) => set({ isMuted: muted }),
    setIsCameraOff: (off) => set({ isCameraOff: off }),
    setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
    setRemoteVolume: (volume) => set({ remoteVolume: volume }),
    setIsTestingMic: (testing) => set({ isTestingMic: testing }),
    setMicLevel: (level) => set({ micLevel: level }),
    setAvailableDevices: (devices) => set({ availableDevices: devices }),
    setSelectedAudioDevice: (deviceId) =>
      set({ selectedAudioDevice: deviceId }),
    setSelectedVideoDevice: (deviceId) =>
      set({ selectedVideoDevice: deviceId }),

    initMedia: async () => {
      try {
        // Prevent multiple initializations
        if (isInitializedRef.current) {
          return get().localStream;
        }

        // Check if we have permission
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Media devices not supported. Please use a modern browser."
          );
        }

        // Refresh available devices first
        await refreshDevices();

        const { selectedAudioDevice, selectedVideoDevice } = get();

        const constraints: MediaStreamConstraints = {
          video: selectedVideoDevice
            ? {
                deviceId: { exact: selectedVideoDevice },
                width: 1280,
                height: 720,
              }
            : { width: 1280, height: 720 },
          audio: selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice } }
            : true,
        };

        let stream: MediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        // Ensure tracks are enabled
        stream.getVideoTracks().forEach((track) => {
          if (!track.enabled) {
            track.enabled = true;
          }
        });

        stream.getAudioTracks().forEach((track) => {
          if (!track.enabled) {
            track.enabled = true;
          }
        });

        cameraStreamRef.current = stream;
        set({ localStream: stream });
        isInitializedRef.current = true;
        return stream;
      } catch (err) {
        console.error("Failed to get local stream:", err);
        // Try without video as fallback
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          cameraStreamRef.current = audioStream;
          set({ localStream: audioStream });
          isInitializedRef.current = true;
          return audioStream;
        } catch (audioErr) {
          console.error("Failed to get audio stream:", audioErr);
          return null;
        }
      }
    },

    toggleMute: () => {
      const { localStream, isMuted } = get();
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !track.enabled;
        });
        set({ isMuted: !isMuted });
      }
    },

    toggleCamera: () => {
      const { localStream, isCameraOff } = get();
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !track.enabled;
        });
        set({ isCameraOff: !isCameraOff });
      }
    },

    toggleScreenShare: async (callRefs) => {
      const { localStream } = get();
      try {
        if (!localStream) return;

        let camStream = cameraStreamRef.current;
        if (
          !camStream ||
          camStream.getTracks().every((t) => t.readyState === "ended")
        ) {
          camStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          cameraStreamRef.current = camStream;
        }
        const camVideoTrack = camStream.getVideoTracks()[0];

        // Replace video track for all active calls
        for (const [peerId, call] of callRefs.current) {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === "video");
            if (videoSender) await videoSender.replaceTrack(camVideoTrack);
          }
        }

        set({ localStream: camStream, isScreenSharing: true });
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    },

    setRemoteVolumeAction: (volume) => set({ remoteVolume: volume }),

    startMicTest: async () => {
      try {
        // Stop any existing mic monitoring
        get().stopMicTest();

        const { selectedAudioDevice, localStream } = get();

        let audioStream: MediaStream;

        // If we already have a local stream with audio, use it; otherwise get a separate audio stream
        if (localStream && localStream.getAudioTracks().length > 0) {
          audioStream = localStream;
        } else {
          // Create a separate audio stream for testing
          const audioConstraints = selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice } }
            : true;

          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });
          micTestStreamRef.current = audioStream;
        }

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Resume audio context if suspended (required in some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(audioStream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateMicLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = average / 255; // Normalize to 0-1
            set({ micLevel: level });
          }
          animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        };

        set({ isTestingMic: true });
        updateMicLevel();
      } catch (err) {
        console.error("Error starting mic monitoring:", err);
      }
    },

    stopMicTest: () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach((track) => track.stop());
        micTestStreamRef.current = null;
      }
      analyserRef.current = null;
      set({ isTestingMic: false, micLevel: 0 });
    },

    startMicMonitoring: () => {
      const { localStream, isTestingMic } = get();

      // Don't start monitoring if already testing or no stream
      if (
        isTestingMic ||
        !localStream ||
        localStream.getAudioTracks().length === 0
      ) {
        return;
      }

      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(localStream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.fftSize = 256;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateMicLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = average / 255; // Normalize to 0-1
            set({ micLevel: level });
          }
          animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        };

        updateMicLevel();
      } catch (err) {
        console.error("Error starting mic monitoring:", err);
      }
    },

    stopMicMonitoring: () => {
      // Only stop if not actively testing
      if (!get().isTestingMic) {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        analyserRef.current = null;
        set({ micLevel: 0 });
      }
    },

    refreshDevices,

    cleanup: () => {
      const { localStream } = get();
      get().stopMicTest();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      set({
        localStream: null,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        remoteVolume: 1,
        isTestingMic: false,
        micLevel: 0,
        availableDevices: [],
        selectedAudioDevice: null,
        selectedVideoDevice: null,
      });
      isInitializedRef.current = false;
    },
  };
});
