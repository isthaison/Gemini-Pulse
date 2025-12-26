import React from "react";
import { Mic, MicOff, Activity, Volume2, AlertTriangle, Zap } from "lucide-react";
import { useMicrophoneStore } from "../store/useMicrophoneStore";
import { useCallStore } from "../store/useCallStore";

const MicrophoneControls: React.FC = () => {
  const {
    isMuted,
    isTestingMic,
    micLevel,
    micLevelSmoothed,
    audioQuality,
    audioSettings,
    toggleMute,
    startMicTest,
    stopMicTest,
    startMicMonitoring,
    stopMicMonitoring,
    calibrateNoiseFloor,
    resetAudioProcessing,
  } = useMicrophoneStore();

  const { isCalling } = useCallStore();

  const btnBaseClass =
    "p-2 md:p-4 rounded-lg md:rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 active:scale-90 flex items-center justify-center relative group pointer-events-auto";

  return (
    <>
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
          className={`${btnBaseClass} ${
            isTestingMic
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
              {[0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2].map(
                (multiplier, index) => {
                  const height = Math.min(micLevelSmoothed * multiplier * 100, 100);
                  const isActive = isTestingMic || (isCalling && !isMuted);
                  return (
                    <div
                      key={index}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isActive
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

            {/* Audio quality indicators */}
            <div className="flex items-center gap-1">
              {audioQuality.voiceActivityDetected && (
                <div className="flex items-center gap-1 text-green-400">
                  <Volume2 size={10} />
                  <span className="text-xs">VOICE</span>
                </div>
              )}
              {audioQuality.clippingDetected && (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle size={10} />
                  <span className="text-xs">CLIP</span>
                </div>
              )}
              {audioQuality.lowLevelDetected && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Zap size={10} />
                  <span className="text-xs">LOW</span>
                </div>
              )}
            </div>

            {/* Level percentage and status */}
            <div className="flex items-center gap-2">
              <div
                className={`text-xs font-mono ${
                  isTestingMic
                    ? "text-green-400"
                    : isCalling && !isMuted
                    ? "text-blue-400"
                    : "text-gray-400"
                }`}
              >
                {isTestingMic
                  ? "TESTING"
                  : isCalling && !isMuted
                  ? "LIVE"
                  : "OFF"}
              </div>
              <div className="text-xs font-mono text-white/60">
                {Math.round(micLevelSmoothed * 100)}%
              </div>
              <div className="w-8 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    isTestingMic
                      ? "bg-green-500"
                      : isCalling && !isMuted
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                  style={{ width: `${Math.min(micLevelSmoothed * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* SNR display */}
            <div className="text-xs font-mono text-white/40">
              SNR: {audioQuality.signalToNoiseRatio.toFixed(1)}dB
            </div>
          </div>
        )}
      </div>

      {/* Advanced audio controls */}
      <div className="flex flex-col items-center gap-1">
        <button
          title="Calibrate Noise Floor"
          onClick={calibrateNoiseFloor}
          className={`${btnBaseClass} bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20`}
        >
          <Zap size={14} />
        </button>
        <button
          title="Reset Audio Processing"
          onClick={resetAudioProcessing}
          className={`${btnBaseClass} bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20`}
        >
          <AlertTriangle size={14} />
        </button>
      </div>
    </>
  );
};

export default MicrophoneControls;