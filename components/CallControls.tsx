import React from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteVolume: number;
  connectedPeersCount: number;
  isCalling: boolean;
  remoteIds: string[];
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onVolumeChange: (volume: number) => void;
  onEndCall: () => void;
  onStartCall: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  remoteVolume,
  connectedPeersCount,
  isCalling,
  remoteIds,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onVolumeChange,
  onEndCall,
  onStartCall,
}) => {
  const btnBaseClass =
    "p-4 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-4xl glass border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-100 transition-transform hover:-translate-y-1">
      <button
        title={isMuted ? "Unmute" : "Mute"}
        onClick={onToggleMute}
        className={`${btnBaseClass} ${
          isMuted
            ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-lg shadow-red-500/10"
            : "bg-white/5 hover:bg-white/10 text-white"
        }`}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      <button
        title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        onClick={onToggleCamera}
        className={`${btnBaseClass} ${
          isCameraOff
            ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-lg shadow-red-500/10"
            : "bg-white/5 hover:bg-white/10 text-white"
        }`}
      >
        {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
      </button>

      <button
        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        onClick={onToggleScreenShare}
        className={`${btnBaseClass} ${
          isScreenSharing
            ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)]"
            : "bg-white/5 hover:bg-white/10 text-white"
        }`}
      >
        {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
      </button>

      {/* Volume Control */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 group transition-all hover:bg-white/10">
        <button
          onClick={() => onVolumeChange(remoteVolume === 0 ? 1 : 0)}
          className="text-white/50 hover:text-white transition-colors"
        >
          {remoteVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={remoteVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24 accent-blue-500 cursor-pointer"
          title="Remote Audio Volume"
        />
      </div>

      <div className="w-px h-10 bg-white/10 mx-1" />

      {connectedPeersCount > 0 || isCalling ? (
        <button
          onClick={onEndCall}
          className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-600/30 transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-3 px-8 group"
        >
          <PhoneOff
            size={24}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="font-bold tracking-tight">Leave</span>
        </button>
      ) : (
        <button
          disabled={remoteIds.length === 0}
          onClick={onStartCall}
          className="p-4 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-3 px-10 group"
        >
          <Phone
            size={24}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="font-bold tracking-tight">Connect</span>
        </button>
      )}
    </div>
  );
};

export default CallControls;
