import React from 'react';
import VideoView from './VideoView';
import { RemotePeer } from '../types';

interface VideoGridProps {
  localStream: MediaStream | null;
  remotePeers: RemotePeer[];
  isScreenSharing: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ localStream, remotePeers = [], isScreenSharing }) => {
  const totalParticipants = (remotePeers?.length || 0) + 1; // +1 for local

  // Calculate grid layout
  const getGridClass = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 h-full`}>
      {/* Local video */}
      <div className="relative rounded-2xl overflow-hidden glass border border-white/5 bg-black/40 shadow-xl">
        {localStream && (
          <VideoView
            stream={localStream}
            isLocal={true}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-bold tracking-wider backdrop-blur-md">
          YOU {isScreenSharing && '(SCREEN)'}
        </div>
      </div>

      {/* Remote videos */}
      {remotePeers.map((peer) => (
        <div key={peer.id} className="relative rounded-2xl overflow-hidden glass border border-white/5 bg-black/40 shadow-xl">
          {peer.stream && (
            <VideoView
              stream={peer.stream}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-bold tracking-wider backdrop-blur-md">
            PEER {peer.id.slice(-4)}
          </div>
          {!peer.isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-white/70">Connecting...</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;