import React from "react";
import { X, RefreshCw, Mic, MicOff, Activity } from "lucide-react";
import { useCameraStore } from "../store/useCameraStore";
import { useMicrophoneStore } from "../store/useMicrophoneStore";
import { useModalStore } from "../store/useModalStore";
import CustomSelect from "./CustomSelect";

const DeviceSettingsModal: React.FC = () => {
  const { closeModal } = useModalStore();
  const {
    availableVideoDevices,
    selectedVideoDevice,
    setSelectedVideoDevice,
    refreshVideoDevices,
  } = useCameraStore();

  const {
    availableAudioDevices,
    selectedAudioDevice,
    setSelectedAudioDevice,
    refreshAudioDevices,
    isTestingMic,
    micLevel,
    micLevelSmoothed,
    audioQuality,
    startMicTest,
    stopMicTest,
  } = useMicrophoneStore();

  const handleRefreshDevices = async () => {
    await Promise.all([refreshVideoDevices(), refreshAudioDevices()]);
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Device Settings</h3>
        <button
          onClick={closeModal}
          className="p-1.5 hover:bg-white/10 rounded-full"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Microphone</label>
          <CustomSelect
            options={availableAudioDevices.map((device) => ({
              value: device.deviceId,
              label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
            }))}
            value={selectedAudioDevice}
            onChange={setSelectedAudioDevice}
            placeholder="Select microphone"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Camera</label>
          <CustomSelect
            options={availableVideoDevices.map((device) => ({
              value: device.deviceId,
              label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
            }))}
            value={selectedVideoDevice}
            onChange={setSelectedVideoDevice}
            placeholder="Select camera"
          />
        </div>

        {/* Microphone Test Section */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium">Test Microphone</label>
            <button
              onClick={isTestingMic ? stopMicTest : startMicTest}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isTestingMic
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isTestingMic ? <MicOff size={12} /> : <Activity size={12} />}
              {isTestingMic ? "Stop" : "Start"}
            </button>
          </div>

          {/* Mic Level Visualization */}
          <div className="space-y-2">
            {/* Waveform bars */}
            <div className="flex items-end gap-0.5 h-6">
              {[0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2].map(
                (multiplier, index) => {
                  const height = Math.min(micLevelSmoothed * multiplier * 100, 100);
                  return (
                    <div
                      key={index}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isTestingMic
                          ? "bg-linear-to-t from-green-500 to-green-300"
                          : "bg-gray-500"
                      }`}
                      style={{
                        height: `${Math.max(height, 2)}%`,
                        opacity: height > 10 ? 1 : 0.3,
                      }}
                    />
                  );
                }
              )}
            </div>

            {/* Status and Quality Info */}
            <div className="flex items-center justify-between text-[10px]">
              <div className={`font-mono ${
                isTestingMic
                  ? "text-green-400"
                  : "text-gray-400"
              }`}>
                {isTestingMic ? "TESTING" : "READY"}
              </div>
              <div className="text-white/60 font-mono">
                {Math.round(micLevelSmoothed * 100)}%
              </div>
            </div>

            {/* Quality Indicators */}
            {isTestingMic && (
              <div className="flex items-center gap-2">
                {audioQuality.voiceActivityDetected && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Activity size={10} />
                    <span className="text-[10px]">VOICE</span>
                  </div>
                )}
                {audioQuality.clippingDetected && (
                  <div className="flex items-center gap-1 text-red-400">
                    <MicOff size={10} />
                    <span className="text-[10px]">CLIP</span>
                  </div>
                )}
                {audioQuality.lowLevelDetected && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Mic size={10} />
                    <span className="text-[10px]">LOW</span>
                  </div>
                )}
              </div>
            )}

            {/* SNR Display */}
            {isTestingMic && (
              <div className="text-[10px] font-mono text-white/40">
                SNR: {audioQuality.signalToNoiseRatio.toFixed(1)}dB
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            onClick={handleRefreshDevices}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-sm"
          >
            Refresh Devices
          </button>
          <button
            onClick={closeModal}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettingsModal;
