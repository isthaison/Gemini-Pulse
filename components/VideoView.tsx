
import React, { useEffect, useRef } from 'react';

interface VideoViewProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
  muted?: boolean;
  volume?: number; // 0 to 1
}

const VideoView: React.FC<VideoViewProps> = ({ stream, isLocal, className, muted, volume = 1 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('VideoView: Setting stream', stream.id, stream.getTracks());
      videoRef.current.srcObject = stream;
    } else {
      console.log('VideoView: No stream or video element', { stream, videoRef: videoRef.current });
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

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
