import React from "react";
import VideoView from "./VideoView";
import { RemotePeer } from "../types";
import { User, MicOff, Monitor } from "lucide-react";
import { useCameraStore } from "../store/useCameraStore";
import { useCallStore } from "../store/useCallStore";

const VideoGrid: React.FC = () => {
  const { localVideoStream, isScreenSharing } = useCameraStore();
  const { remotePeers } = useCallStore();

  const participants = [
    { id: "local", stream: localVideoStream, isLocal: true, label: "You" },
    ...remotePeers.map((p) => ({
      ...p,
      isLocal: false,
      label: `Peer ${p.id.slice(-4)}`,
    })),
  ];

  const count = participants.length;

  const getGridStyles = () => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2 md:grid-cols-3";
  };

  return (
    <div
      className={`grid ${getGridStyles()} gap-2 p-2 h-full w-full`}
    >
      {participants.map((participant, index) => (
        <div
          key={participant.id + index}
          className="relative rounded-2xl overflow-hidden bg-zinc-900 shadow-xl group transition-transform duration-300"
        >
          {participant.stream ? (
            <VideoView
              stream={participant.stream}
              isLocal={participant.isLocal}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800">
              <User size={80} strokeWidth={1} />
            </div>
          )}

          {/* Participant Label */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                participant.stream ? "bg-green-500" : "bg-red-500"
              } shadow-[0_0_6px_rgba(34,197,94,0.4)]`}
            ></div>
            <span className="text-[10px] font-bold tracking-wide">
              {participant.label}
            </span>
            {participant.isLocal && isScreenSharing && (
              <Monitor size={10} className="w-3 h-3 text-blue-400" />
            )}
          </div>

          {/* Connection Overlay */}
          {!participant.isLocal && !participant.stream && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Awaiting Signal
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
