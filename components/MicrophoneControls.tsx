import React from "react";
import { Mic, MicOff } from "lucide-react";
import { useMicrophoneStore } from "../store/useMicrophoneStore";

const MicrophoneControls: React.FC = () => {
  const { isMuted, toggleMute } = useMicrophoneStore();

  const btnBaseClass =
    "p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        title={isMuted ? "Unmute" : "Mute"}
        onClick={toggleMute}
        className={`${btnBaseClass} ${
          isMuted
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        {isMuted && (
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-zinc-900"></span>
        )}
      </button>

      {/* Muted indicator */}
      {isMuted && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-red-400 font-medium">MUTED</span>
        </div>
      )}
    </div>
  );
};

export default MicrophoneControls;