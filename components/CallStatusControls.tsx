import React from "react";
import { PhoneOff, Phone, RefreshCw, Settings } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { usePeerStore } from "../store/usePeerStore";
import { useCameraStore } from "../store/useCameraStore";
import { useMicrophoneStore } from "../store/useMicrophoneStore";
import { useModalStore } from "../store/useModalStore";

const CallStatusControls: React.FC = () => {
  const { openModal } = useModalStore();
  const { connectedPeersCount, isCalling, remoteIds, callPeers, endAllCalls } =
    useCallStore();

  const { signalingState, reconnectPeer } = usePeerStore();

  const { localVideoStream, refreshVideoDevices } = useCameraStore();
  const { localAudioStream, refreshAudioDevices } = useMicrophoneStore();

  const handleCall = () => {
    // Create combined stream for call
    const combinedStream = new MediaStream([
      ...(localVideoStream?.getVideoTracks() || []),
      ...(localAudioStream?.getAudioTracks() || []),
    ]);
    callPeers(remoteIds, combinedStream);
  };

  const handleEndCall = () => {
    endAllCalls();
  };

  const handleRefreshDevices = async () => {
    await Promise.all([
      refreshVideoDevices(),
      refreshAudioDevices(),
    ]);
  };

  const btnBaseClass =
    "p-2 md:p-4 rounded-lg md:rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <>
      <button
        title="Device Settings"
        onClick={() => {
          openModal("device-settings");
          handleRefreshDevices();
        }}
        className={`${btnBaseClass} bg-white/5 hover:bg-white/10 text-white/80 border border-white/5`}
      >
        <Settings size={16} />
      </button>

      <div className="w-px h-3 md:h-10 bg-white/10 mx-0.5 md:mx-2" />

      {/* Signaling status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
        <span
          className={`w-2 h-2 rounded-full ${
            signalingState === "ready"
              ? "bg-green-400"
              : signalingState === "disconnected"
              ? "bg-yellow-400"
              : signalingState === "closed"
              ? "bg-red-500"
              : "bg-zinc-500"
          }`}
          title={`Signaling: ${signalingState}`}
        ></span>
        <span className="text-[10px] text-white/70 uppercase tracking-wide">
          {signalingState}
        </span>
        <button
          onClick={reconnectPeer}
          title="Reconnect"
          className="p-1 ml-1 bg-white/5 rounded-md hover:bg-white/10"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {connectedPeersCount > 0 || isCalling ? (
        <button
          onClick={handleEndCall}
          className="p-2 md:p-4 bg-red-600 hover:bg-red-500 text-white rounded-lg md:rounded-[1.25rem] shadow-xl shadow-red-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-1 md:gap-4 px-3 md:px-10 group pointer-events-auto"
        >
          <PhoneOff size={16} className="md:w-5 md:h-5" />
          <span className="font-black text-xs md:text-sm uppercase tracking-widest">
            End Call
          </span>
        </button>
      ) : (
        <button
          disabled={remoteIds.length === 0}
          onClick={handleCall}
          className="p-2 md:p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg md:rounded-[1.25rem] shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-1 md:gap-4 px-6 md:px-12 group pointer-events-auto"
        >
          <Phone size={16} className="md:w-5 md:h-5" />
          <span className="font-black text-xs md:text-sm uppercase tracking-widest">
            Initiate
          </span>
        </button>
      )}
    </>
  );
};

export default CallStatusControls;