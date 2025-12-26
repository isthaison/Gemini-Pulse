import React from "react";
import VideoView from "./VideoView";
import { RemotePeer } from "../types";
import { User, MicOff, Monitor } from "lucide-react";

interface VideoGridProps {
  localStream: MediaStream | null;
  remotePeers: RemotePeer[];
  isScreenSharing: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remotePeers = [],
  isScreenSharing,
}) => {
  const participants = [
    { id: "local", stream: localStream, isLocal: true, label: "You" },
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
      className={`grid ${getGridStyles()} gap-2 md:gap-4 p-2 md:p-4 h-full w-full`}
    >
      {participants.map((participant, index) => (
        <div
          key={participant.id + index}
          className="relative rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl group transition-transform duration-500"
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
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg md:rounded-xl">
            <div
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                participant.stream ? "bg-green-500" : "bg-red-500"
              } shadow-[0_0_8px_rgba(34,197,94,0.4)]`}
            ></div>
            <span className="text-[10px] md:text-xs font-bold tracking-wide">
              {participant.label}
            </span>
            {participant.isLocal && isScreenSharing && (
              <Monitor size={10} className="md:w-4 md:h-4 text-blue-400" />
            )}
          </div>

          {/* Connection Overlay */}
          {!participant.isLocal && !participant.stream && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest">
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
