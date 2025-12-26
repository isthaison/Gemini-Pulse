import { create } from "zustand";
import React from "react";

interface MicrophoneState {
  localAudioStream: MediaStream | null;
  isMuted: boolean;
  isTestingMic: boolean;
  micLevel: number;
  micLevelSmoothed: number;
  availableAudioDevices: MediaDeviceInfo[];
  selectedAudioDevice: string | null;

  // Advanced audio processing
  audioQuality: {
    signalToNoiseRatio: number;
    clippingDetected: boolean;
    lowLevelDetected: boolean;
    voiceActivityDetected: boolean;
  };

  // Audio processing settings
  audioSettings: {
    noiseGateThreshold: number;
    autoGainControl: boolean;
    smoothingFactor: number;
    voiceActivityThreshold: number;
  };

  setLocalAudioStream: (stream: MediaStream | null) => void;
  setIsMuted: (muted: boolean) => void;
  setIsTestingMic: (testing: boolean) => void;
  setMicLevel: (level: number) => void;
  setMicLevelSmoothed: (level: number) => void;
  setAvailableAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedAudioDevice: (deviceId: string | null) => void;
  setAudioQuality: (quality: Partial<MicrophoneState['audioQuality']>) => void;
  setAudioSettings: (settings: Partial<MicrophoneState['audioSettings']>) => void;

  initMicrophone: () => Promise<MediaStream | null>;
  toggleMute: () => void;
  startMicTest: () => void;
  stopMicTest: () => void;
  startMicMonitoring: () => void;
  stopMicMonitoring: () => void;
  refreshAudioDevices: () => Promise<void>;
  cleanupMicrophone: () => void;

  // Advanced methods
  calibrateNoiseFloor: () => Promise<void>;
  resetAudioProcessing: () => void;
}

export const useMicrophoneStore = create<MicrophoneState>((set, get) => {
  const audioContextRef = React.createRef<AudioContext | null>();
  const analyserRef = React.createRef<AnalyserNode | null>();
  const animationFrameRef = React.createRef<number | null>();
  const isInitializedRef = React.createRef<boolean>();
  const micTestStreamRef = React.createRef<MediaStream | null>();

  // Initialize refs
  if (!audioContextRef.current) audioContextRef.current = null;
  if (!analyserRef.current) analyserRef.current = null;
  if (!animationFrameRef.current) animationFrameRef.current = null;
  if (!isInitializedRef.current) isInitializedRef.current = false;
  if (!micTestStreamRef.current) micTestStreamRef.current = null;

  const refreshAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("enumerateDevices not supported");
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      set({ availableAudioDevices: audioDevices });

      // Auto-select device if not already selected
      const { selectedAudioDevice } = get();
      if (!selectedAudioDevice && audioDevices.length > 0) {
        set({ selectedAudioDevice: audioDevices[0].deviceId });
      }
    } catch (err) {
      console.error("Error enumerating audio devices:", err);
    }
  };

  return {
    localAudioStream: null,
    isMuted: false,
    isTestingMic: false,
    micLevel: 0,
    micLevelSmoothed: 0,
    availableAudioDevices: [],
    selectedAudioDevice: null,

    audioQuality: {
      signalToNoiseRatio: 0,
      clippingDetected: false,
      lowLevelDetected: false,
      voiceActivityDetected: false,
    },

    audioSettings: {
      noiseGateThreshold: -50, // dB
      autoGainControl: true,
      smoothingFactor: 0.8,
      voiceActivityThreshold: -30, // dB
    },

    setLocalAudioStream: (stream) => set({ localAudioStream: stream }),
    setIsMuted: (muted) => set({ isMuted: muted }),
    setIsTestingMic: (testing) => set({ isTestingMic: testing }),
    setMicLevel: (level) => set({ micLevel: level }),
    setMicLevelSmoothed: (level) => set({ micLevelSmoothed: level }),
    setAvailableAudioDevices: (devices) => set({ availableAudioDevices: devices }),
    setSelectedAudioDevice: (deviceId) => set({ selectedAudioDevice: deviceId }),
    setAudioQuality: (quality) => set((state) => ({ audioQuality: { ...state.audioQuality, ...quality } })),
    setAudioSettings: (settings) => set((state) => ({ audioSettings: { ...state.audioSettings, ...settings } })),

    initMicrophone: async () => {
      try {
        // Prevent multiple initializations
        if (isInitializedRef.current) {
          return get().localAudioStream;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Media devices not supported. Please use a modern browser.");
        }

        // Refresh available devices first
        await refreshAudioDevices();

        const { selectedAudioDevice } = get();

        const constraints: MediaStreamConstraints = {
          audio: selectedAudioDevice
            ? {
                deviceId: selectedAudioDevice,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              },
        };

        let stream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('Microphone stream created:', {
          audioTracks: stream.getAudioTracks().length,
          audioTrackEnabled: stream.getAudioTracks()[0]?.enabled,
          audioTrackLabel: stream.getAudioTracks()[0]?.label
        });

        // Ensure audio track is enabled
        stream.getAudioTracks().forEach((track) => {
          if (!track.enabled) {
            track.enabled = true;
          }
        });

        set({ localAudioStream: stream });
        isInitializedRef.current = true;
        return stream;
      } catch (err) {
        console.error("Failed to get microphone stream:", err);
        return null;
      }
    },

    toggleMute: () => {
      const { localAudioStream, isMuted } = get();
      if (localAudioStream) {
        localAudioStream.getAudioTracks().forEach((track) => {
          track.enabled = !track.enabled;
        });
        set({ isMuted: !isMuted });
      }
    },

    startMicTest: async () => {
      try {
        // Stop any existing mic monitoring
        get().stopMicTest();

        const { selectedAudioDevice, localAudioStream } = get();

        let audioStream: MediaStream;

        // If we already have a local audio stream, use it; otherwise get a separate audio stream
        if (localAudioStream && localAudioStream.getAudioTracks().length > 0) {
          audioStream = localAudioStream;
        } else {
          // Create a separate audio stream for testing
          const audioConstraints = selectedAudioDevice
            ? {
                deviceId: selectedAudioDevice,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              };

          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });
          micTestStreamRef.current = audioStream;

          console.log('Mic test stream created:', {
            audioTracks: audioStream.getAudioTracks().length,
            audioTrackEnabled: audioStream.getAudioTracks()[0]?.enabled,
            audioTrackLabel: audioStream.getAudioTracks()[0]?.label
          });
        }

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Resume audio context if suspended (required in some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(audioStream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateMicLevel = () => {
          if (analyserRef.current) {
            const { audioSettings, micLevelSmoothed } = get();

            // Use time domain data for accurate volume calculation
            const timeDataArray = new Float32Array(analyser.frequencyBinCount);
            analyserRef.current.getFloatTimeDomainData(timeDataArray);

            // Calculate RMS from time domain data
            let sum = 0;
            for (let i = 0; i < timeDataArray.length; i++) {
              sum += timeDataArray[i] * timeDataArray[i];
            }
            const rms = Math.sqrt(sum / timeDataArray.length);

            // Convert RMS to dB
            const db = rms > 0.00001 ? 20 * Math.log10(rms) : -60;

            // Apply noise gate
            const gatedDb = db < audioSettings.noiseGateThreshold ? -60 : db;

            // Apply auto-gain control (simple compression)
            let processedDb = gatedDb;
            if (audioSettings.autoGainControl) {
              const targetLevel = -20; // Target level in dB
              const gain = Math.min(20, Math.max(0, targetLevel - gatedDb));
              processedDb = gatedDb + gain;
            }

            // Map dB range from -60dB (silent) to 0dB (loud) to 0-1 scale
            const rawLevel = Math.max(0, Math.min(1, (processedDb + 60) / 60));

            // Apply smoothing
            const smoothedLevel = micLevelSmoothed +
              audioSettings.smoothingFactor * (rawLevel - micLevelSmoothed);

            // Voice activity detection
            const voiceActivityDetected = smoothedLevel > audioSettings.voiceActivityThreshold;

            // Quality metrics
            const signalToNoiseRatio = db > -60 ? db - audioSettings.noiseFloor : 0;
            const clippingDetected = Math.max(...timeDataArray) > 0.95;
            const lowLevelDetected = smoothedLevel < 0.01;

            set({
              micLevel: rawLevel,
              micLevelSmoothed: smoothedLevel,
              audioQuality: {
                signalToNoiseRatio,
                clippingDetected,
                lowLevelDetected,
                voiceActivityDetected,
              },
            });

            // Debug logging - show more info
            console.log('Mic level:', rawLevel.toFixed(3), 'Smoothed:', smoothedLevel.toFixed(3),
              'RMS:', rms.toFixed(6), 'dB:', db.toFixed(1), 'SNR:', signalToNoiseRatio.toFixed(1),
              'Voice:', voiceActivityDetected ? 'YES' : 'NO');
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
      set({
        isTestingMic: false,
        micLevel: 0,
        micLevelSmoothed: 0,
        audioQuality: {
          signalToNoiseRatio: 0,
          clippingDetected: false,
          lowLevelDetected: false,
          voiceActivityDetected: false,
        },
      });
    },

    startMicMonitoring: async () => {
      const { localAudioStream, isTestingMic } = get();

      // Don't start monitoring if already testing or no stream
      if (
        isTestingMic ||
        !localAudioStream ||
        localAudioStream.getAudioTracks().length === 0
      ) {
        return;
      }

      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Resume audio context if suspended (required in some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(localAudioStream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateMicLevel = () => {
          if (analyserRef.current) {
            // Use time domain data for accurate volume calculation
            const timeDataArray = new Float32Array(analyser.frequencyBinCount);
            analyserRef.current.getFloatTimeDomainData(timeDataArray);

            // Calculate RMS from time domain data
            let sum = 0;
            for (let i = 0; i < timeDataArray.length; i++) {
              sum += timeDataArray[i] * timeDataArray[i];
            }
            const rms = Math.sqrt(sum / timeDataArray.length);

            // Convert RMS to dB, then to 0-1 scale
            const db = rms > 0.00001 ? 20 * Math.log10(rms) : -60;
            const level = Math.max(0, Math.min(1, (db + 60) / 60));

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

    refreshAudioDevices,

    cleanupMicrophone: () => {
      const { localAudioStream } = get();
      get().stopMicTest();
      if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => track.stop());
      }
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach(track => track.stop());
      }
      set({
        localAudioStream: null,
        isMuted: false,
        isTestingMic: false,
        micLevel: 0,
        micLevelSmoothed: 0,
        availableAudioDevices: [],
        selectedAudioDevice: null,
        audioQuality: {
          signalToNoiseRatio: 0,
          clippingDetected: false,
          lowLevelDetected: false,
          voiceActivityDetected: false,
        },
      });
      isInitializedRef.current = false;
    },

    // Advanced methods
    calibrateNoiseFloor: async () => {
      try {
        console.log('Starting noise floor calibration...');

        // Get current audio stream
        const { localAudioStream, selectedAudioDevice } = get();
        let audioStream: MediaStream;

        if (localAudioStream && localAudioStream.getAudioTracks().length > 0) {
          audioStream = localAudioStream;
        } else {
          // Create temporary stream for calibration
          const audioConstraints = selectedAudioDevice
            ? { deviceId: selectedAudioDevice, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            : { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

          audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(audioStream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        microphone.connect(analyser);

        // Collect samples for 2 seconds
        const samples: number[] = [];
        const calibrationDuration = 2000; // 2 seconds
        const sampleInterval = 100; // Sample every 100ms
        const numSamples = calibrationDuration / sampleInterval;

        for (let i = 0; i < numSamples; i++) {
          await new Promise(resolve => setTimeout(resolve, sampleInterval));

          const timeDataArray = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatTimeDomainData(timeDataArray);

          let sum = 0;
          for (let j = 0; j < timeDataArray.length; j++) {
            sum += timeDataArray[j] * timeDataArray[j];
          }
          const rms = Math.sqrt(sum / timeDataArray.length);
          const db = rms > 0.00001 ? 20 * Math.log10(rms) : -60;
          samples.push(db);
        }

        // Calculate noise floor as the 90th percentile of samples
        samples.sort((a, b) => a - b);
        const noiseFloorIndex = Math.floor(samples.length * 0.9);
        const noiseFloor = samples[noiseFloorIndex];

        // Set noise gate threshold slightly above noise floor
        const noiseGateThreshold = noiseFloor + 3; // 3dB above noise floor

        console.log('Noise floor calibration complete:', {
          noiseFloor: noiseFloor.toFixed(1) + 'dB',
          noiseGateThreshold: noiseGateThreshold.toFixed(1) + 'dB',
          samplesCollected: samples.length
        });

        // Update audio settings
        set(state => ({
          audioSettings: {
            ...state.audioSettings,
            noiseFloor,
            noiseGateThreshold,
          },
        }));

        // Clean up temporary resources
        audioContext.close();
        if (!localAudioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }

      } catch (err) {
        console.error('Error during noise floor calibration:', err);
      }
    },

    resetAudioProcessing: () => {
      set({
        micLevel: 0,
        micLevelSmoothed: 0,
        audioQuality: {
          signalToNoiseRatio: 0,
          clippingDetected: false,
          lowLevelDetected: false,
          voiceActivityDetected: false,
        },
      });
    },
  };
});