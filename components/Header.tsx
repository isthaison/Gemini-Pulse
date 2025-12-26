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
import { usePeerStore } from "../store/usePeerStore";
import { useUIStore } from "../store/useUIStore";
import { useRoomStore } from "../store/useRoomStore";
import { useMessageStore } from "../store/useMessageStore";

interface HeaderProps {
  onToggleSidebar: () => void;
  onShowInfo: () => void;
  onShowDiagnostics: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onShowInfo,
  onShowDiagnostics,
}) => {
  const { peerId } = usePeerStore();
  const { duration } = useUIStore();
  const { createRoom } = useRoomStore();
  const { addMessage } = useMessageStore();
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
    <header className="relative z-50 px-3 py-3 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-linear-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg shadow-blue-500/20">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">
            GEMINI <span className="text-blue-500">PULSE</span>
          </h1>
          <div className="flex items-center gap-1 text-[8px] text-white/40 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-2 h-2 text-green-500/60" />
            End-to-End Encrypted
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {duration > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 bg-white/10 border border-white/20 rounded-full">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-mono font-medium tabular-nums">
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
          className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
          title="Create Room & Copy Invite"
        >
          <Sparkles size={18} />
        </button>

        <button
          onClick={onShowDiagnostics}
          className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
          title="Diagnostics"
        >
          <Activity size={18} />
        </button>
        <button
          onClick={onShowInfo}
          className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
        >
          <Info size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
