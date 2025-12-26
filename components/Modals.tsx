import React from "react";
import { Sparkles, X } from "lucide-react";
import { usePeerStore } from "../store/usePeerStore";
import { useCallStore } from "../store/useCallStore";
import { useMessageStore } from "../store/useMessageStore";
import { useMediaStore } from "../store/useMediaStore";

interface InfoModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full shadow-2xl">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 tracking-tight">
          Meeting Intelligence
        </h3>
        <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
          Video Pulse leverages P2P WebRTC technology for ultra-low latency
          communication and Google Gemini for real-time meeting insights.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
            <div className="text-white font-bold">Privacy</div>
            <div className="text-zinc-500 text-sm">Peer-to-peer data</div>
          </div>
          <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
            <div className="text-white font-bold">AI Driven</div>
            <div className="text-zinc-500 text-sm">Gemini 3.0 Flash</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 md:py-4 bg-white text-black font-bold rounded-xl md:rounded-2xl hover:bg-zinc-200 transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};

interface DiagnosticsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { peerId, signalingState } = usePeerStore();
  const { connectedPeersCount, isCalling } = useCallStore();
  const { messages } = useMessageStore();
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
            Diagnostics
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold mb-2">Connection Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-sm text-zinc-400">Peer ID</div>
                <div className="font-mono text-xs">
                  {peerId || "Not connected"}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-sm text-zinc-400">Signaling State</div>
                <div
                  className={`font-mono text-xs ${
                    signalingState === "ready"
                      ? "text-green-400"
                      : signalingState === "disconnected"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {signalingState}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-sm text-zinc-400">Connected Peers</div>
                <div className="font-mono text-xs">{connectedPeersCount}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-sm text-zinc-400">Is Calling</div>
                <div className="font-mono text-xs">
                  {isCalling ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-2">Recent System Messages</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {messages
                .filter((m) => m.sender === "system")
                .slice(-10)
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-zinc-400 bg-white/5 p-2 rounded"
                  >
                    {msg.content}
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-2">ICE Servers Config</h4>
            <div className="text-xs text-zinc-400 bg-white/5 p-3 rounded font-mono">
              {JSON.stringify(
                {
                  iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                    { urls: "stun:stun3.l.google.com:19302" },
                    { urls: "stun:stun4.l.google.com:19302" },
                    { urls: "stun:stun.ekiga.net" },
                    { urls: "stun:stun.ideasip.com" },
                    { urls: "stun:stun.schlund.de" },
                    { urls: "stun:stun.stunprotocol.org" },
                    { urls: "stun:stun.voiparound.com" },
                    { urls: "stun:stun.voipbuster.com" },
                    { urls: "stun:stun.voipstunt.com" },
                    { urls: "stun:stun.voxgratia.org" },
                    {
                      urls: "turn:turn.anyfirewall.com:443?transport=tcp",
                      username: "webrtc",
                      credential: "webrtc",
                    },
                    {
                      urls: "turn:openrelay.metered.ca:80",
                      username: "openrelayproject",
                      credential: "openrelayproject",
                    },
                  ],
                },
                null,
                2
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface IncomingCallModalProps {
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  onAccept,
  onReject,
}) => {
  const { pendingIncomingCall, acceptIncomingCall, rejectIncomingCall } =
    useCallStore();
  const { localStream } = useMediaStore();

  const handleAccept = async () => {
    if (!pendingIncomingCall) return;
    if (!localStream) {
      console.warn("No local stream to accept call");
      return;
    }
    try {
      await acceptIncomingCall(pendingIncomingCall, localStream);
      onAccept();
    } catch (err) {
      console.error("Error accepting incoming call", err);
    }
  };

  const handleReject = () => {
    if (!pendingIncomingCall) return;
    rejectIncomingCall(pendingIncomingCall);
    onReject();
  };
  if (!pendingIncomingCall) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h4 className="text-lg font-bold mb-2">Incoming Call</h4>
        <p className="text-sm text-zinc-400 mb-4">
          You have an incoming call from{" "}
          <code className="font-mono text-xs">{pendingIncomingCall}</code>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export { InfoModal, DiagnosticsModal, IncomingCallModal };
