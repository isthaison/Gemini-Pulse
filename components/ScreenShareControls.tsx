import React from "react";
import { Monitor, MonitorOff } from "lucide-react";
import { useScreenShareStore } from "../store/useScreenShareStore";
import { usePeerStore } from "../store/usePeerStore";
import { useCallStore } from "../store/useCallStore";
import { useMessageStore } from "../store/useMessageStore";

const ScreenShareControls: React.FC = () => {
  const { isScreenSharing, toggleScreenShare } = useScreenShareStore();
  const { callRefs } = usePeerStore();
  const { remotePeers } = useCallStore();

  const btnBaseClass =
    "p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  const handleToggleScreenShare = () => {
    // Check if there are any active calls
    const hasActiveCalls = remotePeers.length > 0;

    if (!hasActiveCalls) {
      useMessageStore.getState().addMessage({
        id: Date.now().toString(),
        content:
          "Cannot share screen: No active calls. Connect to a peer first.",
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
      return;
    }

    toggleScreenShare(callRefs);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        onClick={handleToggleScreenShare}
        disabled={remotePeers.length === 0}
        className={`${btnBaseClass} ${
          isScreenSharing
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/50"
            : remotePeers.length === 0
            ? "bg-gray-500 text-gray-300 cursor-not-allowed border border-gray-400/30"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
      </button>

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-blue-400 font-medium">SHARING</span>
        </div>
      )}
    </div>
  );
};

export default ScreenShareControls;
