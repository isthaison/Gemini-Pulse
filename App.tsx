
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, MediaConnection, DataConnection } from 'peerjs';
import VideoView from './components/VideoView';
import { getMeetingAssistantAdvice } from './services/geminiService';
import { ChatMessage } from './types';
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
  Clock,
  Monitor,
  MonitorOff,
  Send,
  User,
  Bot,
  Volume2,
  VolumeX
} from 'lucide-react';

const App: React.FC = () => {
  // Connection State
  const [peerId, setPeerId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteVolume, setRemoteVolume] = useState(1);
  
  // Chat & AI State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [duration, setDuration] = useState(0);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer Effect
  useEffect(() => {
    if (isConnected) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Helper: Format Duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  };

  // Setup Data Connection Listeners
  const setupDataConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      dataConnRef.current = conn;
    });
    conn.on('data', (data: any) => {
      if (typeof data === 'string') {
        const newMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'peer',
          content: data,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    });
    conn.on('close', () => {
      dataConnRef.current = null;
    });
  };

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

      // Handle incoming Calls
      peer.on('call', (call) => {
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

      // Handle incoming Data Connections (Chat)
      peer.on('connection', (conn) => {
        setupDataConnection(conn);
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

  const endCall = useCallback(() => {
    callRef.current?.close();
    dataConnRef.current?.close();
    setRemoteStream(null);
    setIsConnected(false);
    setIsCalling(false);
    setRemoteId('');
    setDuration(0);
    
    if (isScreenSharing) {
      stopScreenShare();
    }
  }, [isScreenSharing]);

  const startCall = useCallback(() => {
    const streamToUse = localStream || cameraStreamRef.current;
    if (!remoteId || !peerRef.current || !streamToUse) return;

    setIsCalling(true);
    
    // Start Video Call
    const call = peerRef.current.call(remoteId, streamToUse);
    callRef.current = call;
    call.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      setIsConnected(true);
    });
    call.on('close', () => endCall());

    // Start Data Connection
    const conn = peerRef.current.connect(remoteId);
    setupDataConnection(conn);
  }, [remoteId, localStream, endCall]);

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
      let camStream = cameraStreamRef.current;
      if (!camStream || camStream.getTracks().every(t => t.readyState === 'ended')) {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = camStream;
      }
      const camVideoTrack = camStream.getVideoTracks()[0];
      if (callRef.current?.peerConnection) {
        const senders = callRef.current.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) await videoSender.replaceTrack(camVideoTrack);
      }
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
        screenTrack.onended = () => stopScreenShare();
        if (callRef.current?.peerConnection) {
          const senders = callRef.current.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) await videoSender.replaceTrack(screenTrack);
        }
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

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'self',
      content: chatInput,
      timestamp: new Date()
    };

    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send(chatInput);
    }

    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  const generateAiInsight = async () => {
    const context = messages.length > 0 
      ? `Recent chat: ${messages.slice(-3).map(m => m.content).join(". ")}` 
      : "Start of a new session.";
    
    const advice = await getMeetingAssistantAdvice(context);
    if (advice) {
      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        content: advice,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const btnBaseClass = "p-4 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 glass z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GEMINI <span className="text-blue-500">PULSE</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-white/10">
            <span className="text-xs text-white/50 font-medium uppercase tracking-tighter">ID</span>
            <code className="text-sm text-blue-400 font-mono">{peerId || '...'}</code>
            <button 
              onClick={copyId}
              className="p-1 hover:bg-white/20 rounded-md transition-all active:scale-90"
              title="Copy ID"
            >
              {copyFeedback ? <span className="text-[10px] text-green-400 font-bold uppercase">Copied</span> : <Copy size={14} />}
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
            <VideoView stream={remoteStream} volume={remoteVolume} className="remote-video" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center animate-pulse">
                <Phone size={40} className="text-blue-500" />
              </div>
              <div className="text-center space-y-2 px-6">
                <h2 className="text-2xl font-semibold">Start Collaborative Session</h2>
                <p className="text-white/40 max-w-xs mx-auto leading-relaxed">Connect via Peer ID for end-to-end encrypted video and real-time chat.</p>
              </div>
              {!isCalling && (
                <div className="flex flex-col gap-3 w-72">
                  <input 
                    type="text" 
                    placeholder="Remote Peer ID" 
                    value={remoteId}
                    onChange={(e) => setRemoteId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-center font-mono placeholder:text-white/20"
                  />
                  <button 
                    onClick={startCall}
                    disabled={!remoteId}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Connect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Local Video Overlay */}
          <div className="local-video overflow-hidden border border-white/20 bg-black group">
            {localStream ? (
              <VideoView stream={localStream} isLocal className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <CameraOff className="text-white/20" size={32} />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-bold tracking-wider backdrop-blur-md flex items-center gap-1.5 border border-white/10">
              {isScreenSharing && <Monitor size={10} className="text-blue-400" />}
              <span>{isScreenSharing ? 'SHARING SCREEN' : 'LOCAL'}</span>
            </div>
          </div>

          {/* Call Status Indicator */}
          {isConnected && (
            <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-full glass border border-green-500/30 text-green-400 text-xs font-bold tracking-widest shadow-lg">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <div className="flex items-center gap-2">
                <span>LIVE</span>
                <span className="text-white/40">|</span>
                <span className="font-mono text-white tracking-normal">{formatDuration(duration)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interaction Hub (Sidebar) */}
        <div className="w-96 flex flex-col gap-4">
          <div className="flex-1 glass rounded-2xl border border-white/5 flex flex-col shadow-xl overflow-hidden">
            {/* Sidebar Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Interaction Hub</h3>
              </div>
              <button 
                onClick={generateAiInsight}
                title="Get AI Insight"
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-blue-400 transition-all"
              >
                <Bot size={18} />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                  <div className="w-12 h-12 rounded-full border border-dashed border-white/50 mb-3 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <p className="text-xs uppercase font-bold tracking-widest">No messages yet</p>
                  <p className="text-[10px] mt-1 max-w-[150px]">Start typing or ask Gemini for a meeting insight.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'self' ? 'items-end' : msg.sender === 'ai' ? 'items-center' : 'items-start'}`}
                  >
                    {msg.sender === 'ai' ? (
                      <div className="w-full bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                          <Sparkles size={40} className="text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Gemini Insight</span>
                        </div>
                        <p className="text-sm text-blue-100/90 leading-relaxed italic">"{msg.content}"</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%] group">
                        <div className={`flex items-center gap-1.5 mb-1 px-1 ${msg.sender === 'self' ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] font-bold text-white/30 uppercase">
                            {msg.sender === 'self' ? 'You' : 'Peer'}
                          </span>
                          <span className="text-[8px] text-white/10">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-sm ${
                          msg.sender === 'self' 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10' 
                            : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-white/5 flex items-center gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 rounded-xl transition-all active:scale-90"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Quick Stats Block */}
          <div className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h4 className="text-[10px] font-black text-white/30 uppercase mb-4 tracking-[0.2em]">Live Session Metrics</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Connectivity</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/20'}`}>
                  {isConnected ? 'ENCRYPTED P2P' : 'WAITING'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Messages</span>
                <span className="text-xs font-mono font-bold text-blue-400">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Controls Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-[2rem] glass border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] transition-transform hover:-translate-y-1">
        <button 
          title={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          className={`${btnBaseClass} ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-lg shadow-red-500/10' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          onClick={toggleCamera}
          className={`${btnBaseClass} ${isCameraOff ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-lg shadow-red-500/10' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
        </button>

        <button 
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          onClick={toggleScreenShare}
          className={`${btnBaseClass} ${isScreenSharing ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 group transition-all hover:bg-white/10">
          <button 
            onClick={() => setRemoteVolume(remoteVolume === 0 ? 1 : 0)}
            className="text-white/50 hover:text-white transition-colors"
          >
            {remoteVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={remoteVolume}
            onChange={(e) => setRemoteVolume(parseFloat(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer"
            title="Remote Audio Volume"
          />
        </div>

        <div className="w-[1px] h-10 bg-white/10 mx-1" />

        {isConnected || isCalling ? (
          <button 
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-600/30 transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-3 px-8 group"
          >
            <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold tracking-tight">Leave</span>
          </button>
        ) : (
          <button 
            disabled={!remoteId}
            onClick={startCall}
            className="p-4 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-3 px-10 group"
          >
            <Phone size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold tracking-tight">Connect</span>
          </button>
        )}
      </div>

      {/* Style Overrides */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        input[type=range] {
          height: 4px;
          -webkit-appearance: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;
