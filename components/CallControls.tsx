import React, { useState, useEffect } from "react";
import MicrophoneControls from "./MicrophoneControls";
import CameraControls from "./CameraControls";
import ScreenShareControls from "./ScreenShareControls";
import VolumeControls from "./VolumeControls";
import CallStatusControls from "./CallStatusControls";
import { useMicrophoneStore } from "../store/useMicrophoneStore";
import { useCallStore } from "../store/useCallStore";
import { useModalStore } from "../store/useModalStore";

const CallControls: React.FC = () => {
  const { openModal } = useModalStore();

  const { isMuted, isTestingMic, startMicMonitoring, stopMicMonitoring } =
    useMicrophoneStore();

  const { isCalling } = useCallStore();

  // Monitor mic levels during calls
  useEffect(() => {
    const handleMicMonitoring = async () => {
      if (isCalling && !isMuted && !isTestingMic) {
        await startMicMonitoring();
      } else if (!isCalling || isMuted) {
        stopMicMonitoring();
      }
    };

    handleMicMonitoring();
  }, [isCalling, isMuted, isTestingMic, startMicMonitoring, stopMicMonitoring]);

  return (
    <>
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-2.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)] z-100 max-w-[95vw] overflow-x-auto">
        <MicrophoneControls />
        <CameraControls />
        <ScreenShareControls />
        <div className="hidden md:block w-px h-8 bg-white/10 mx-1" />
        <VolumeControls />
        <div className="hidden md:block w-px h-8 bg-white/10 mx-1" />
        <CallStatusControls />
      </div>
    </>
  );
};

export default CallControls;
