import React, { useState, useEffect } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Activity,
  Settings,
} from "lucide-react";
import { useMediaStore } from "../store/useMediaStore";
import { useCallStore } from "../store/useCallStore";
import { usePeerStore } from "../store/usePeerStore";

const CallControls: React.FC = () => {
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  const {
    localStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteVolume,
    isTestingMic,
    micLevel,
    availableDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setRemoteVolumeAction,
    startMicTest,
    stopMicTest,
    startMicMonitoring,
    stopMicMonitoring,
    refreshDevices,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
  } = useMediaStore();

  const { connectedPeersCount, isCalling, remoteIds, callPeers, endAllCalls } =
    useCallStore();

  const { signalingState, reconnectPeer, callRefs } = usePeerStore();

  // Monitor mic levels during calls
  useEffect(() => {
    if (isCalling && !isMuted && !isTestingMic) {
      startMicMonitoring();
    } else if (!isCalling || isMuted) {
      stopMicMonitoring();
    }
  }, [isCalling, isMuted, isTestingMic, startMicMonitoring, stopMicMonitoring]);
  const handleCall = () => {
    callPeers(remoteIds, localStream);
  };

  const handleEndCall = () => {
    endAllCalls();
  };

  const handleToggleScreenShare = () => {
    toggleScreenShare(callRefs);
  };

  const btnBaseClass =
    "p-2 md:p-4 rounded-lg md:rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <>
      <div className="fixed bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 md:gap-4 px-2 md:px-8 py-1.5 md:py-5 rounded-lg md:rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-[100] transition-transform hover:scale-[1.02] max-w-[85vw] overflow-x-auto">
      <div className="flex flex-col items-center gap-1">
        <button
          title={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          className={`${btnBaseClass} ${
            isMuted
              ? "bg-red-500/10 text-red-500 border border-red-500/20"
              : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
          }`}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          {isMuted && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-zinc-900"></span>
          )}
        </button>

        {/* Muted indicator */}
        {isMuted && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-400 font-medium">MUTED</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          title={isTestingMic ? "Stop Mic Test" : "Test Microphone"}
          onClick={isTestingMic ? stopMicTest : startMicTest}
          className={`${btnBaseClass} ${isTestingMic
            ? "bg-green-500/10 text-green-500 border border-green-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
          } relative`}
        >
          <Activity size={16} />
          {isTestingMic && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </button>

        {/* Enhanced mic level visualization - show during testing or when in call and not muted */}
        {(isTestingMic || (isCalling && !isMuted)) && (
          <div className="flex flex-col items-center gap-2">
            {/* Waveform bars */}
            <div className="flex items-end gap-0.5 h-8">
              {[0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2].map((multiplier, index) => {
                const height = Math.min(micLevel * multiplier * 100, 100);
                const isActive = isTestingMic || (isCalling && !isMuted);
                return (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isActive
                        ? 'bg-gradient-to-t from-green-500 to-green-300'
                        : 'bg-gray-500'
                    }`}
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      opacity: height > 10 ? 1 : 0.3
                    }}
                  />
                );
              })}
            </div>

            {/* Level percentage and status */}
            <div className="flex items-center gap-2">
              <div className={`text-xs font-mono ${
                isTestingMic ? 'text-green-400' :
                (isCalling && !isMuted) ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {isTestingMic ? 'TESTING' : isCalling && !isMuted ? 'LIVE' : 'OFF'}
              </div>
              <div className="text-xs font-mono text-white/60">
                {Math.round(micLevel * 100)}%
              </div>
              <div className="w-8 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    isTestingMic ? 'bg-green-500' :
                    (isCalling && !isMuted) ? 'bg-blue-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          onClick={toggleCamera}
          className={`${btnBaseClass} ${
            isCameraOff
              ? "bg-red-500/10 text-red-500 border border-red-500/20"
              : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
          }`}
        >
          {isCameraOff ? <CameraOff size={16} /> : <Camera size={16} />}
        </button>

        {/* Camera off indicator */}
        {isCameraOff && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-400 font-medium">CAM OFF</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          onClick={handleToggleScreenShare}
          className={`${btnBaseClass} ${
            isScreenSharing
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/50"
              : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
          }`}
        >
          {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
        </button>

        {/* Screen sharing indicator */}
        {isScreenSharing && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400 font-medium">SHARING</span>
          </div>
        )}
      </div>

      {/* Modern Volume Slider */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5 pointer-events-auto group">
        <button
          onClick={() => setRemoteVolumeAction(remoteVolume === 0 ? 1 : 0)}
          className="text-white/40 group-hover:text-white/80 transition-colors"
        >
          {remoteVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={remoteVolume}
          onChange={(e) => setRemoteVolumeAction(parseFloat(e.target.value))}
          className="w-16 md:w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:bg-white/20 transition-all"
          title="Remote Audio Volume"
        />
      </div>

      <button
        title="Device Settings"
        onClick={() => {
          setShowDeviceSettings(true);
          refreshDevices();
        }}
        className={`${btnBaseClass} bg-white/5 hover:bg-white/10 text-white/80 border border-white/5`}
      >
        <Settings size={16} />
      </button>

      <div className="w-px h-3 md:h-10 bg-white/10 mx-0.5 md:mx-2" />

      {/* Signaling status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
        <span
          className={`w-2 h-2 rounded-full ${
            signalingState === "ready"
              ? "bg-green-400"
              : signalingState === "disconnected"
              ? "bg-yellow-400"
              : signalingState === "closed"
              ? "bg-red-500"
              : "bg-zinc-500"
          }`}
          title={`Signaling: ${signalingState}`}
        ></span>
        <span className="text-[10px] text-white/70 uppercase tracking-wide">
          {signalingState}
        </span>
        <button
          onClick={reconnectPeer}
          title="Reconnect"
          className="p-1 ml-1 bg-white/5 rounded-md hover:bg-white/10"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {connectedPeersCount > 0 || isCalling ? (
        <button
          onClick={handleEndCall}
          className="p-2 md:p-4 bg-red-600 hover:bg-red-500 text-white rounded-lg md:rounded-[1.25rem] shadow-xl shadow-red-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-1 md:gap-4 px-3 md:px-10 group pointer-events-auto"
        >
          <PhoneOff size={16} className="md:w-5 md:h-5" />
          <span className="font-black text-xs md:text-sm uppercase tracking-widest">
            End Call
          </span>
        </button>
      ) : (
        <button
          disabled={remoteIds.length === 0}
          onClick={handleCall}
          className="p-2 md:p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg md:rounded-[1.25rem] shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-1 md:gap-4 px-6 md:px-12 group pointer-events-auto"
        >
          <Phone size={16} className="md:w-5 md:h-5" />
          <span className="font-black text-xs md:text-sm uppercase tracking-widest">
            Initiate
          </span>
        </button>
      )}
    </div>

    {/* Device Settings Modal */}
    {showDeviceSettings && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Device Settings</h3>
            <button
              onClick={() => setShowDeviceSettings(false)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <RefreshCw size={20} className="rotate-45" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Microphone</label>
              <select
                value={selectedAudioDevice || ""}
                onChange={(e) => setSelectedAudioDevice(e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {availableDevices
                  .filter(device => device.kind === 'audioinput')
                  .map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Camera</label>
              <select
                value={selectedVideoDevice || ""}
                onChange={(e) => setSelectedVideoDevice(e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {availableDevices
                  .filter(device => device.kind === 'videoinput')
                  .map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  refreshDevices();
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium"
              >
                Refresh Devices
              </button>
              <button
                onClick={() => setShowDeviceSettings(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CallControls;
