import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useUIStore } from "../store/useUIStore";

const VolumeControls: React.FC = () => {
  const { remoteVolume, setRemoteVolumeAction } = useUIStore();

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5 pointer-events-auto group">
      <button
        onClick={() => setRemoteVolumeAction(remoteVolume === 0 ? 1 : 0)}
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
        onChange={(e) => setRemoteVolumeAction(parseFloat(e.target.value))}
        className="w-16 md:w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:bg-white/20 transition-all"
        title="Remote Audio Volume"
      />
    </div>
  );
};

export default VolumeControls;