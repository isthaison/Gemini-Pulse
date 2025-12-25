
import React, { useEffect, useRef } from 'react';

interface VideoViewProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
  muted?: boolean;
}

const VideoView: React.FC<VideoViewProps> = ({ stream, isLocal, className, muted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted || isLocal}
      className={className}
    />
  );
};

export default VideoView;
