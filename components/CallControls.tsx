
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
  onCall: () => void;
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
  onCall,
}) => {
  const btnBaseClass =
    "p-4 rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-5 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-[100] transition-transform hover:scale-[1.02]">
      <button
        title={isMuted ? "Unmute" : "Mute"}
        onClick={onToggleMute}
        className={`${btnBaseClass} ${
          isMuted
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        {isMuted && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-zinc-900"></span>}
      </button>

      <button
        title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        onClick={onToggleCamera}
        className={`${btnBaseClass} ${
          isCameraOff
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isCameraOff ? <CameraOff size={22} /> : <Camera size={22} />}
      </button>

      <button
        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        onClick={onToggleScreenShare}
        className={`${btnBaseClass} ${
          isScreenSharing
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/50"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
      </button>

      {/* Modern Volume Slider */}
      <div className="flex items-center gap-4 px-6 py-2.5 bg-white/5 rounded-[1.25rem] border border-white/5 pointer-events-auto group">
        <button
          onClick={() => onVolumeChange(remoteVolume === 0 ? 1 : 0)}
          className="text-white/40 group-hover:text-white/80 transition-colors"
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
          className="w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:bg-white/20 transition-all"
          title="Remote Audio Volume"
        />
      </div>

      <div className="w-px h-10 bg-white/10 mx-2" />

      {connectedPeersCount > 0 || isCalling ? (
        <button
          onClick={onEndCall}
          className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-[1.25rem] shadow-xl shadow-red-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-4 px-10 group pointer-events-auto"
        >
          <PhoneOff
            size={22}
            className="group-hover:rotate-[20deg] transition-transform"
          />
          <span className="font-black text-sm uppercase tracking-widest">End Call</span>
        </button>
      ) : (
        <button
          disabled={remoteIds.length === 0}
          onClick={onCall}
          className="p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-[1.25rem] shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-4 px-12 group pointer-events-auto"
        >
          <Phone
            size={22}
            className="group-hover:rotate-[20deg] transition-transform"
          />
          <span className="font-black text-sm uppercase tracking-widest">Initiate</span>
        </button>
      )}
    </div>
  );
};

export default CallControls;
