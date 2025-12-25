
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import VideoView from './components/VideoView';
import { getMeetingAssistantAdvice } from './services/geminiService';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Phone, 
  Copy, 
  Sparkles,
  Info,
  XCircle,
  Clock,
  Monitor,
  MonitorOff
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [peerId, setPeerId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('Welcome to Gemini Pulse. Connect with someone to get started.');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Initialize Media and Peer
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    };

    const initPeer = () => {
      const peer = new Peer();
      
      peer.on('open', (id) => {
        setPeerId(id);
      });

      peer.on('call', (call) => {
        // Answer incoming call with current local stream (camera or screen)
        const currentStream = localStream || cameraStreamRef.current;
        if (currentStream) {
          call.answer(currentStream);
          callRef.current = call;
          setIsCalling(true);
          
          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setIsConnected(true);
          });
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
      });

      peerRef.current = peer;
    };

    initMedia();
    initPeer();

    return () => {
      peerRef.current?.destroy();
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Handlers
  const startCall = useCallback(() => {
    const streamToUse = localStream || cameraStreamRef.current;
    if (!remoteId || !peerRef.current || !streamToUse) return;

    setIsCalling(true);
    const call = peerRef.current.call(remoteId, streamToUse);
    callRef.current = call;

    call.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      setIsConnected(true);
    });

    call.on('close', () => {
      endCall();
    });
  }, [remoteId, localStream]);

  const endCall = useCallback(() => {
    callRef.current?.close();
    setRemoteStream(null);
    setIsConnected(false);
    setIsCalling(false);
    setRemoteId('');
    setAiInsight('Call ended. Hope it was productive!');
    
    // If we were screen sharing, stop it
    if (isScreenSharing) {
      stopScreenShare();
    }
  }, [isScreenSharing]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const stopScreenShare = async () => {
    try {
      // Re-get camera stream if it was stopped or just use the ref
      let camStream = cameraStreamRef.current;
      if (!camStream || camStream.getTracks().every(t => t.readyState === 'ended')) {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = camStream;
      }

      const camVideoTrack = camStream.getVideoTracks()[0];

      // Update the active call's video track
      if (callRef.current?.peerConnection) {
        const senders = callRef.current.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(camVideoTrack);
        }
      }

      // Restore local stream with camera video and original audio
      setLocalStream(camStream);
      setIsScreenSharing(false);
    } catch (err) {
      console.error("Error reverting to camera:", err);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Handle user clicking "Stop sharing" in browser UI
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Update the active call's video track if connected
        if (callRef.current?.peerConnection) {
          const senders = callRef.current.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        // Keep existing audio track in the local preview
        const audioTrack = localStream?.getAudioTracks()[0] || cameraStreamRef.current?.getAudioTracks()[0];
        const newLocalStream = new MediaStream([screenTrack]);
        if (audioTrack) newLocalStream.addTrack(audioTrack);

        setLocalStream(newLocalStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const generateAiInsight = async () => {
    setAiInsight('Analyzing context with Gemini...');
    const context = isScreenSharing 
      ? "User is currently sharing their screen to present information."
      : isConnected 
        ? "Two participants are in a video call discussing topics."
        : "The user is waiting to connect.";
    const advice = await getMeetingAssistantAdvice(context);
    setAiInsight(advice || 'Unable to generate insight at this time.');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 glass z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GEMINI <span className="text-blue-500">PULSE</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs text-white/50 font-medium">YOUR ID</span>
            <code className="text-sm text-blue-400 font-mono">{peerId || 'Initializing...'}</code>
            <button 
              onClick={copyId}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              title="Copy ID"
            >
              {copyFeedback ? <span className="text-[10px] text-green-400">COPIED</span> : <Copy size={14} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock size={12} />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative p-4 gap-4">
        {/* Main Video Stage */}
        <div className="flex-1 relative rounded-2xl overflow-hidden glass border border-white/5 bg-black/40 shadow-2xl">
          {isConnected && remoteStream ? (
            <VideoView stream={remoteStream} className="remote-video" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center animate-pulse">
                <Phone size={40} className="text-blue-500" />
              </div>
              <div className="text-center space-y-2 px-6">
                <h2 className="text-2xl font-semibold">Ready to Connect</h2>
                <p className="text-white/40 max-w-xs mx-auto">Share your ID with a peer or enter their ID below to start a high-definition P2P meeting.</p>
              </div>
              
              {!isCalling && (
                <div className="flex flex-col gap-3 w-72">
                  <input 
                    type="text" 
                    placeholder="Enter Peer ID" 
                    value={remoteId}
                    onChange={(e) => setRemoteId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-center font-mono"
                  />
                  <button 
                    onClick={startCall}
                    disabled={!remoteId}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Start Call
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Local Video Overlay */}
          <div className="local-video overflow-hidden border border-white/20 bg-black">
            {localStream ? (
              <VideoView stream={localStream} isLocal className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <CameraOff className="text-white/20" size={32} />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-medium backdrop-blur-md flex items-center gap-1">
              {isScreenSharing && <Monitor size={10} className="text-blue-400" />}
              <span>{isScreenSharing ? 'SHARING SCREEN' : 'YOU'}</span>
            </div>
          </div>

          {/* Call Status Indicator */}
          {isConnected && (
            <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/30 text-green-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        {/* AI Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <div className="flex-1 glass rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Gemini Insight</h3>
              </div>
              <Info size={16} className="text-white/20 cursor-help" />
            </div>
            
            <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 overflow-y-auto">
              <p className="text-sm leading-relaxed text-white/70 italic">
                {aiInsight}
              </p>
            </div>

            <button 
              onClick={generateAiInsight}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-blue-400" />
              Ask Assistant
            </button>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <h4 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest">Meeting Stats</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Encryption</span>
                <span className="text-xs font-mono text-green-400">End-to-End</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Source</span>
                <span className="text-xs font-mono">{isScreenSharing ? 'Screen' : 'Camera'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Controls Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-3xl glass border border-white/10 shadow-2xl z-[100]">
        <button 
          title={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          onClick={toggleCamera}
          className={`p-4 rounded-2xl transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
        </button>

        <button 
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          onClick={toggleScreenShare}
          className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
        </button>

        <div className="w-[1px] h-10 bg-white/10 mx-2" />

        {isConnected || isCalling ? (
          <button 
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-3 px-8"
          >
            <PhoneOff size={24} />
            <span className="font-bold">Leave</span>
          </button>
        ) : (
          <button 
            disabled={!remoteId}
            onClick={startCall}
            className="p-4 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl shadow-lg transition-all flex items-center gap-3 px-8"
          >
            <Phone size={24} />
            <span className="font-bold">Join</span>
          </button>
        )}
      </div>

      {/* Connection Helper */}
      {!isConnected && !isCalling && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-bounce">
          <Info size={18} className="text-blue-400" />
          <p className="text-sm text-blue-100">Ready for collaboration. Share your ID to start.</p>
        </div>
      )}
    </div>
  );
};

export default App;
