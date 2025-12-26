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
              onClick={closeModal}
              className="w-full py-3 md:py-4 bg-white text-black font-bold rounded-xl md:rounded-2xl hover:bg-zinc-200 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        );

      case "diagnostics":
        return (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                Diagnostics
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Connection Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Peer ID</div>
                    <div className="text-zinc-500 text-sm font-mono">{peerId}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Signaling</div>
                    <div className="text-zinc-500 text-sm">{signalingState}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Media Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Camera</div>
                    <div className="text-zinc-500 text-sm">
                      {localVideoStream ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Microphone</div>
                    <div className="text-zinc-500 text-sm">
                      {localAudioStream ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Call Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Connected Peers</div>
                    <div className="text-zinc-500 text-sm">{connectedPeersCount}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-white font-bold">Call State</div>
                    <div className="text-zinc-500 text-sm">{isCalling ? "Active" : "Inactive"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Recent Messages</h4>
                <div className="bg-white/5 rounded-xl border border-white/5 p-3 max-h-32 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.slice(-5).map((msg, index) => (
                      <div key={index} className="text-sm text-zinc-400 mb-1">
                        {msg.content}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-500">No messages yet</div>
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
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <h4 className="text-lg font-bold mb-2 text-center">Incoming Call</h4>
            <p className="text-sm text-zinc-400 mb-4 text-center">
              You have an incoming call from{" "}
              <code className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
                {pendingIncomingCall}
              </code>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium flex items-center justify-center gap-2"
              >
                <PhoneOff size={16} />
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-200 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      {renderModalContent()}
    </div>
  );
};

export default Modal;