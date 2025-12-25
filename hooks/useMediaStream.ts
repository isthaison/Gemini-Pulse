import  React, { useState, useRef, useCallback } from 'react';

export const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteVolume, setRemoteVolume] = useState(1);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  }, [localStream, isCameraOff]);

  const stopScreenShare = useCallback(async (callRefs: React.MutableRefObject<Map<string, any>>) => {
    try {
      let camStream = cameraStreamRef.current;
      if (!camStream || camStream.getTracks().every(t => t.readyState === 'ended')) {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = camStream;
      }
      const camVideoTrack = camStream.getVideoTracks()[0];

      // Replace video track for all active calls
      for (const [peerId, call] of callRefs.current) {
        if (call.peerConnection) {
          const senders = call.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) await videoSender.replaceTrack(camVideoTrack);
        }
      }

      setLocalStream(camStream);
      setIsScreenSharing(false);
    } catch (err) {
      console.error("Error reverting to camera:", err);
    }
  }, []);

  const toggleScreenShare = useCallback(async (callRefs: React.MutableRefObject<Map<string, any>>) => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => stopScreenShare(callRefs);

        // Replace video track for all active calls
        for (const [peerId, call] of callRefs.current) {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) await videoSender.replaceTrack(screenTrack);
          }
        }

        const audioTrack = localStream?.getAudioTracks()[0] || cameraStreamRef.current?.getAudioTracks()[0];
        const newLocalStream = new MediaStream([screenTrack]);
        if (audioTrack) newLocalStream.addTrack(audioTrack);
        setLocalStream(newLocalStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    } else {
      stopScreenShare(callRefs);
    }
  }, [isScreenSharing, localStream, stopScreenShare]);

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [localStream]);

  return {
    localStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteVolume,
    initMedia,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setRemoteVolume,
    cleanup
  };
};