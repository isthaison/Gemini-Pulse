import React, { useState, useEffect, useCallback } from "react";
import VideoGrid from "./components/VideoGrid";
import CallControls from "./components/CallControls";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";
import { useCameraStore } from "./store/useCameraStore";
import { useMicrophoneStore } from "./store/useMicrophoneStore";
import { useModalStore } from "./store/useModalStore";
import { ChatMessage } from "./types";
import { formatDuration, copyToClipboard } from "./utils/helpers";
import { usePeerStore } from "./store/usePeerStore";
import { useCallStore } from "./store/useCallStore";
import { useChatStore } from "./store/useChatStore";
import { useRoomStore } from "./store/useRoomStore";
import { useUIStore } from "./store/useUIStore";
import { useMessageStore } from "./store/useMessageStore";
import {
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Activity,
  Menu,
  X,
} from "lucide-react";

const App: React.FC = () => {
  const { peerId, signalingState, initPeer, reconnectPeer, callRefs } =
    usePeerStore();

  const {
    remoteIds,
    remotePeers,
    connectedPeersCount,
    isCalling,
    pendingIncomingCall,
    setRemoteIds,
    addRemoteId,
    removeRemoteId,
    callPeers,
    endAllCalls,
    acceptIncomingCall,
    rejectIncomingCall,
    setIsCalling,
  } = useCallStore();

  const { messages, addMessage } = useMessageStore();

  const {
    chatInput,
    copyFeedback,
    setChatInput,
    setCopyFeedback,
    sendMessageToPeers,
  } = useChatStore();

  const { createRoom } = useRoomStore();

  const { duration, incrementDuration, resetDuration } = useUIStore();

  const { openModal } = useModalStore();

  const [showSidebar, setShowSidebar] = useState(false);

  const { initCamera, cleanupCamera, localVideoStream } = useCameraStore();
  const { initMicrophone, cleanupMicrophone, localAudioStream } =
    useMicrophoneStore();

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([initCamera(), initMicrophone()]);
    };
    initialize();
    return () => {
      cleanupCamera();
      cleanupMicrophone();
    };
  }, []);

  useEffect(() => {
    if (!peerId) {
      initPeer();
    }
  }, [initPeer, peerId]);

  // Incoming call modal
  useEffect(() => {
    if (pendingIncomingCall) {
      // flash sidebar for visibility
      setShowSidebar(true);
      // Open incoming call modal
      openModal("incoming-call");
    } else {
      // Close modal if no pending call
      // Note: Modal will auto-close via closeModal() in accept/reject handlers
    }
  }, [pendingIncomingCall, openModal]);

  // Auto-join room if `?room=` present in URL after peer is ready
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room && peerId && room !== peerId) {
      setRemoteIds([room]);
      if (localVideoStream || localAudioStream) {
        setIsCalling(true);
        try {
          // Create combined stream for call
          const combinedStream = new MediaStream([
            ...(localVideoStream?.getVideoTracks() || []),
            ...(localAudioStream?.getAudioTracks() || []),
          ]);
          callPeers([room], combinedStream);
        } catch (err) {
          console.error("Auto call error", err);
        }
      }
    }
  }, [
    peerId,
    localVideoStream,
    localAudioStream,
    setRemoteIds,
    callPeers,
    setIsCalling,
  ]);

  useEffect(() => {
    let interval: any;
    if (connectedPeersCount > 0) {
      interval = setInterval(() => incrementDuration(), 1000);
    }
    return () => clearInterval(interval);
  }, [connectedPeersCount]);

  // No nickname required — use default/random peer id

  const handleCall = async () => {
    if (remoteIds.length > 0 && localStream) {
      setIsCalling(true);
      await callPeers(remoteIds, localStream);
    }
  };

  const handleAcceptIncoming = async () => {
    if (!pendingIncomingCall) return;
    if (!localStream) {
      console.warn("No local stream to accept call");
      return;
    }
    try {
      await acceptIncomingCall(pendingIncomingCall, localStream);
    } catch (err) {
      console.error("Error accepting incoming call", err);
    }
  };

  const handleRejectIncoming = () => {
    if (!pendingIncomingCall) return;
    rejectIncomingCall(pendingIncomingCall);
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
      <Header
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onShowInfo={() => openModal("info")}
        onShowDiagnostics={() => openModal("diagnostics")}
      />

      {/* Main Grid Layout */}
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-hidden relative z-10">
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 h-full min-h-0">
          <VideoGrid />
        </div>

        {/* Right: Sidebar Interaction - Desktop */}
        <div className="hidden md:flex w-100">
          <Sidebar />
        </div>
      </main>

      {/* Mobile Bottom Sheet */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 bg-black/90 backdrop-blur-xl z-40 transform transition-transform duration-300 rounded-t-3xl ${
          showSidebar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-4 pb-4">
          <Sidebar />
        </div>
      </div>

      {/* Universal Controls Bar */}
      <footer className="relative z-50 py-4 md:py-8 px-4 md:px-0 pointer-events-none">
        <CallControls />
      </footer>

      {/* Nickname removed: using default/random peer id */}

      <Modal />
    </div>
  );
};

export default App;
