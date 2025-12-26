import React from "react";
import { Monitor, MonitorOff } from "lucide-react";
import { useCameraStore } from "../store/useCameraStore";
import { usePeerStore } from "../store/usePeerStore";

const ScreenShareControls: React.FC = () => {
  const { isScreenSharing, toggleScreenShare } = useCameraStore();
  const { callRefs } = usePeerStore();

  const btnBaseClass =
    "p-2 md:p-4 rounded-lg md:rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  const handleToggleScreenShare = () => {
    toggleScreenShare(callRefs);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        onClick={handleToggleScreenShare}
        className={`${btnBaseClass} ${
          isScreenSharing
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/50"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
      </button>

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-400 font-medium">SHARING</span>
        </div>
      )}
    </div>
  );
};

export default ScreenShareControls;