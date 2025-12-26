import React from "react";
import { Camera, CameraOff } from "lucide-react";
import { useCameraStore } from "../store/useCameraStore";

const CameraControls: React.FC = () => {
  const { isCameraOff, toggleCamera } = useCameraStore();

  const btnBaseClass =
    "p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        onClick={toggleCamera}
        className={`${btnBaseClass} ${
          isCameraOff
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
        }`}
      >
        {isCameraOff ? <CameraOff size={16} /> : <Camera size={16} />}
      </button>

      {/* Camera off indicator */}
      {isCameraOff && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-red-400 font-medium">CAM OFF</span>
        </div>
      )}
    </div>
  );
};

export default CameraControls;