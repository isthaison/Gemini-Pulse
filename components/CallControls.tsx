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
      <div className="fixed bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 md:gap-4 px-2 md:px-8 py-1.5 md:py-5 rounded-lg md:rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-100 transition-transform hover:scale-[1.02] max-w-[85vw] overflow-x-auto">
        <MicrophoneControls />
        <CameraControls />
        <ScreenShareControls />
        <VolumeControls />
        <CallStatusControls />
      </div>
    </>
  );
};

export default CallControls;
