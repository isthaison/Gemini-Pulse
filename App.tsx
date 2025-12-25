import React, { useState, useEffect, useCallback } from "react";
import VideoGrid from "./components/VideoGrid";
import CallControls from "./components/CallControls";
import ChatPanel from "./components/ChatPanel";
import PeerIdInput from "./components/PeerIdInput";
import { usePeerConnection } from "./hooks/usePeerConnection";
import { useMediaStream } from "./hooks/useMediaStream";
import { ChatMessage, RemotePeer } from "./types";
import { formatDuration, copyToClipboard } from "./utils/helpers";
import { useAppStore } from "./store/appStore";
import { Sparkles, Info, Clock, ShieldCheck, Activity } from "lucide-react";

const App: React.FC = () => {
  const {
    peerId,
    remoteIds,
    remotePeers,
    connectedPeersCount,
    isCalling,
    messages,
    chatInput,
    copyFeedback,
    duration,
    setPeerId,
    setRemoteIds,
    addRemoteId,
    removeRemoteId,
    setRemotePeers,
    addRemotePeer,
    removeRemotePeer,
    setConnectedPeersCount,
    setIsCalling,
    addMessage,
    setChatInput,
    setCopyFeedback,
    incrementDuration,
    resetDuration,
  } = useAppStore();

  const {
    localStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteVolume,
    initMedia,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setRemoteVolume,
    cleanup: cleanupMedia,
  } = useMediaStream();

  // Fix: Implement missing handleCopyPeerId
  const handleCopyPeerId = async () => {
    const success = await copyToClipboard(peerId);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const { initPeer, callPeers, endAllCalls, sendMessageToPeers, callRefs } =
    usePeerConnection({
      onPeerIdGenerated: setPeerId,
      // Fix: Correctly handle functional updates from hook to interact with Zustand store
      onRemotePeersUpdate: useCallback(
        (updater: (prev: RemotePeer[]) => RemotePeer[]) => {
          const currentPeers = useAppStore.getState().remotePeers;
          const nextPeers = updater(currentPeers);
          setRemoteIds(nextPeers.map((peer) => peer.id));
          setRemotePeers(nextPeers);
        },
        [setRemoteIds, setRemotePeers]
      ),
      onConnectedPeersCountChange: useCallback(
        (updater: (prev: number) => number) => {
          const currentCount = useAppStore.getState().connectedPeersCount;
          setConnectedPeersCount(updater(currentCount));
        },
        [setConnectedPeersCount]
      ),
      onMessageReceived: useCallback(
        (message, senderId) => {
          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            content: message,
            sender: "peer",
            senderId: senderId,
            timestamp: new Date(),
          };
          addMessage(chatMessage);
        },
        [addMessage]
      ),
      localStream
    });

  useEffect(() => {
    const initialize = async () => {
      await initMedia();
      initPeer();
    };
    initialize();
    return () => cleanupMedia();
  }, []);

  useEffect(() => {
    let interval: any;
    if (connectedPeersCount > 0) {
      interval = setInterval(() => incrementDuration(), 1000);
    }
    return () => clearInterval(interval);
  }, [connectedPeersCount]);

  const handleCall = async () => {
    if (remoteIds.length > 0 && localStream) {
      setIsCalling(true);
      await callPeers(remoteIds, localStream);
    }
  };

  const handleEndCall = () => {
    endAllCalls();
    setIsCalling(false);
    resetDuration();
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (chatInput.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: chatInput,
        sender: "self",
        timestamp: new Date(),
      };
      addMessage(message);
      sendMessageToPeers(chatInput);
      setChatInput("");
    }
  };

  const handleGetAiInsight = async () => {
    const transcript = messages
      .slice(-5)
      .map((m) => m.content)
      .join(". ");
  };

  return (
    <div className="h-screen w-full bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      {/* Modern Header */}
      <header className="relative z-50 px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              GEMINI <span className="text-blue-500">PULSE</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-green-500/60" />
              End-to-End Encrypted
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {duration > 0 && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono font-medium tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          )}

          <button
            onClick={() =>
              document.getElementById("info-modal")?.classList.remove("hidden")
            }
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 flex p-6 gap-6 overflow-hidden relative z-10">
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col gap-6 h-full">
          <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden relative group">
            <VideoGrid
              localStream={localStream}
              remotePeers={remotePeers}
              isScreenSharing={isScreenSharing}
            />
          </div>
        </div>

        {/* Right: Sidebar Interaction */}
        <div className="w-[400px] flex flex-col gap-6 h-full">
          {/* Peer Management Area */}
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md">
            <PeerIdInput
              peerId={peerId}
              remoteIds={remoteIds}
              copyFeedback={copyFeedback}
              onAddPeerId={addRemoteId}
              onRemovePeerId={removeRemoteId}
              onCopyPeerId={handleCopyPeerId}
              onRemoteIdsChange={setRemoteIds}
            />
          </div>

          {/* Chat & AI Hub */}
          <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
            <ChatPanel
              messages={messages}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </main>

      {/* Universal Controls Bar */}
      <footer className="relative z-50 py-8 pointer-events-none">
        <CallControls
          isCalling={isCalling}
          connectedPeersCount={connectedPeersCount}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          remoteVolume={remoteVolume}
          remoteIds={remoteIds}
          onCall={handleCall}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={() => toggleScreenShare(callRefs)}
          onVolumeChange={setRemoteVolume}
        />
      </footer>

      {/* Improved Info Modal */}
      <div
        id="info-modal"
        className="hidden fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
      >
        <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-3xl font-bold mb-4 tracking-tight">
            Meeting Intelligence
          </h3>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Video Pulse leverages P2P WebRTC technology for ultra-low latency
            communication and Google Gemini for real-time meeting insights.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-white font-bold">Privacy</div>
              <div className="text-zinc-500 text-sm">Peer-to-peer data</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-white font-bold">AI Driven</div>
              <div className="text-zinc-500 text-sm">Gemini 3.0 Flash</div>
            </div>
          </div>
          <button
            onClick={() =>
              document.getElementById("info-modal")?.classList.add("hidden")
            }
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
