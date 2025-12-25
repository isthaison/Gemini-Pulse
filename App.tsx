import React, { useState, useEffect } from "react";
import VideoGrid from "./components/VideoGrid";
import CallControls from "./components/CallControls";
import ChatPanel from "./components/ChatPanel";
import PeerIdInput from "./components/PeerIdInput";
import { usePeerConnection } from "./hooks/usePeerConnection";
import { useMediaStream } from "./hooks/useMediaStream";
import { ChatMessage } from "./types";
import { formatDuration } from "./utils/helpers";
import { useAppStore } from "./store/appStore";
import { Sparkles, Info, Clock, User } from "lucide-react";

const App: React.FC = () => {
  // Zustand store
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

  // Custom hooks
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

  const {
    initPeer,
    callPeers,
    endAllCalls,
    sendMessageToPeers,
  } = usePeerConnection({
    onPeerIdGenerated: setPeerId,
    onRemotePeersUpdate: (peers) => {
      // Update remote IDs from peers
      setRemoteIds(peers.map((peer) => peer.id));
      setRemotePeers(peers);
    },
    onConnectedPeersCountChange: setConnectedPeersCount,
    onMessageReceived: (message, senderId) => {
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: senderId,
        timestamp: new Date()
      };
      addMessage(chatMessage);
    },
  });

  // Initialize media and peer connection on mount
  useEffect(() => {
    const initialize = async () => {
      await initMedia();
      initPeer();
    };
    initialize();

    return () => {
      cleanupMedia();
    };
  }, [initMedia, initPeer, cleanupMedia]);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectedPeersCount > 0) {
      interval = setInterval(() => {
        incrementDuration();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectedPeersCount, incrementDuration]);

  // Handle call initiation
  const handleCall = async () => {
    if (remoteIds.length > 0 && localStream) {
      setIsCalling(true);
      await callPeers(remoteIds, localStream);
    }
  };

  // Handle call ending
  const handleEndCall = () => {
    endAllCalls();
    setIsCalling(false);
    resetDuration();
  };

  // Handle chat message sending
  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: peerId || "You",
        timestamp: new Date(),
      };
      addMessage(message);
      sendMessageToPeers(chatInput);
      setChatInput("");
    }
  };

  // Handle peer ID addition
  const handleAddPeerId = (id: string) => {
    addRemoteId(id);
  };

  // Handle peer ID removal
  const handleRemovePeerId = (id: string) => {
    removeRemoteId(id);
  };

  // Handle copy peer ID
  const handleCopyPeerId = async () => {
    if (peerId) {
      await navigator.clipboard.writeText(peerId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Video Pulse</h1>
            </div>

            <div className="flex items-center space-x-4">
              {connectedPeersCount > 0 && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    Connected ({connectedPeersCount})
                  </span>
                </div>
              )}

              {duration > 0 && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}

              <button
                onClick={() =>
                  document
                    .getElementById("info-modal")
                    ?.classList.remove("hidden")
                }
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Video Grid - Takes up 3 columns on large screens */}
          <div className="lg:col-span-3">
            <VideoGrid
              localStream={localStream}
              remotePeers={remotePeers}
              isScreenSharing={isScreenSharing}
            />
          </div>

          {/* Sidebar - Chat Panel */}
          <div className="lg:col-span-1">
            <ChatPanel
              messages={messages}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        {/* Call Controls - Fixed at bottom */}
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
          onToggleScreenShare={toggleScreenShare}
          onVolumeChange={setRemoteVolume}
        />

        {/* Peer ID Input - Modal/Overlay */}
        <PeerIdInput
          peerId={peerId}
          remoteIds={remoteIds}
          copyFeedback={copyFeedback}
          onAddPeerId={handleAddPeerId}
          onRemovePeerId={handleRemovePeerId}
          onCopyPeerId={handleCopyPeerId}
        />
      </div>

      {/* Info Modal */}
      <div
        id="info-modal"
        className="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="bg-slate-800 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">About Video Pulse</h3>
          <p className="text-slate-300 mb-4">
            A peer-to-peer video calling application built with React,
            TypeScript, and PeerJS. Connect with multiple participants
            simultaneously with real-time video, audio, and chat.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() =>
                document.getElementById("info-modal")?.classList.add("hidden")
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
        input[type="range"] {
          height: 4px;
          -webkit-appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
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
