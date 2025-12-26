import React from "react";
import {
  Info,
  Activity,
  Menu,
  Sparkles,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatDuration } from "../utils/helpers";

interface HeaderProps {
  onToggleSidebar: () => void;
  onShowInfo: () => void;
  onShowDiagnostics: () => void;
  duration: number;
  peerId: string;
  createRoom: () => string | null;
  addMessage: (msg: any) => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onShowInfo,
  onShowDiagnostics,
  duration,
  peerId,
  createRoom,
  addMessage,
}) => {
  const handleCreateRoom = async () => {
    if (!peerId) {
      addMessage({
        id: Date.now().toString(),
        content: "Peer not ready yet",
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
      return;
    }
    const roomId = createRoom();
    if (roomId) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      await navigator.clipboard.writeText(inviteUrl);
      addMessage({
        id: Date.now().toString(),
        content: `Room created! Invite link copied: ${inviteUrl}`,
        sender: "system",
        senderId: "system",
        timestamp: new Date(),
      });
    }
  };

  return (
    <header className="relative z-50 px-4 md:px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 md:p-2.5">
          <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            GEMINI <span className="text-blue-500">PULSE</span>
          </h1>
          <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500/60" />
            End-to-End Encrypted
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {duration > 0 && (
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1 bg-white/5 border border-white/10 rounded-full">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
            <span className="text-xs md:text-sm font-mono font-medium tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={handleCreateRoom}
          className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
          title="Create Room & Copy Invite"
        >
          <Sparkles size={18} />
        </button>

        <button
          onClick={onShowDiagnostics}
          className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
          title="Diagnostics"
        >
          <Activity size={18} />
        </button>
        <button
          onClick={onShowInfo}
          className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
        >
          <Info size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
