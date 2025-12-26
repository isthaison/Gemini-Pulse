import React from "react";
import { Sparkles, X, Activity, Phone, PhoneOff } from "lucide-react";
import { useModalStore } from "../store/useModalStore";
import { usePeerStore } from "../store/usePeerStore";
import { useCallStore } from "../store/useCallStore";
import { useMessageStore } from "../store/useMessageStore";
import { useCameraStore } from "../store/useCameraStore";
import { useMicrophoneStore } from "../store/useMicrophoneStore";
import DeviceSettingsModal from "./DeviceSettingsModal";

const Modal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useModalStore();

  const { peerId, signalingState } = usePeerStore();
  const { connectedPeersCount, isCalling, pendingIncomingCall, acceptIncomingCall, rejectIncomingCall } = useCallStore();
  const { messages } = useMessageStore();
  const { localVideoStream } = useCameraStore();
  const { localAudioStream } = useMicrophoneStore();

  if (!activeModal) return null;

  const renderModalContent = () => {
    switch (activeModal) {
      case "info":
        return (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 max-w-lg w-full shadow-xl">
            <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">
              Meeting Intelligence
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Video Pulse leverages P2P WebRTC technology for ultra-low latency
              communication and Google Gemini for real-time meeting insights.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <div className="text-white font-bold text-xs">Privacy</div>
                <div className="text-zinc-500 text-xs">Peer-to-peer data</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <div className="text-white font-bold text-xs">AI Driven</div>
                <div className="text-zinc-500 text-xs">Gemini 3.0 Flash</div>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        );

      case "diagnostics":
        return (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">
                Diagnostics
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-white/10 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-bold mb-2 text-sm">Connection Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Peer ID</div>
                    <div className="text-zinc-500 text-xs font-mono">{peerId}</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Signaling</div>
                    <div className="text-zinc-500 text-xs">{signalingState}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-sm">Media Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Camera</div>
                    <div className="text-zinc-500 text-xs">
                      {localVideoStream ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Microphone</div>
                    <div className="text-zinc-500 text-xs">
                      {localAudioStream ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-sm">Call Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Connected Peers</div>
                    <div className="text-zinc-500 text-xs">{connectedPeersCount}</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-white font-bold text-xs">Call State</div>
                    <div className="text-zinc-500 text-xs">{isCalling ? "Active" : "Inactive"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-sm">Recent Messages</h4>
                <div className="bg-white/5 rounded-lg border border-white/5 p-2 max-h-24 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.slice(-5).map((msg, index) => (
                      <div key={index} className="text-xs text-zinc-400 mb-1">
                        {msg.content}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-500">No messages yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "device-settings":
        return <DeviceSettingsModal />;

      case "incoming-call":
        if (!pendingIncomingCall) return null;

        const handleAccept = async () => {
          try {
            await acceptIncomingCall(pendingIncomingCall);
            closeModal();
          } catch (err) {
            console.error("Error accepting incoming call", err);
          }
        };

        const handleReject = () => {
          rejectIncomingCall(pendingIncomingCall);
          closeModal();
        };

        return (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <h4 className="text-base font-bold mb-2 text-center">Incoming Call</h4>
            <p className="text-xs text-zinc-400 mb-3 text-center">
              You have an incoming call from{" "}
              <code className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
                {pendingIncomingCall}
              </code>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              >
                <PhoneOff size={16} />
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Accept
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-200 flex items-center justify-center p-3 animate-in fade-in duration-300">
      {renderModalContent()}
    </div>
  );
};

export default Modal;