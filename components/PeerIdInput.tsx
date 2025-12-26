
import React, { useState } from 'react';
import { Plus, X, Copy, UserPlus } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { usePeerStore } from '../store/usePeerStore';
import { useChatStore } from '../store/useChatStore';
import { copyToClipboard } from '../utils/helpers';

const PeerIdInput: React.FC = () => {
  const { remoteIds, addRemoteId, removeRemoteId } = useCallStore();
  const { peerId } = usePeerStore();
  const { copyFeedback, setCopyFeedback } = useChatStore();
  const [newPeerId, setNewPeerId] = useState('');

  const handleCopyPeerId = async () => {
    const success = await copyToClipboard(peerId);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleAdd = () => {
    if (newPeerId.trim()) {
      addRemoteId(newPeerId.trim());
      setNewPeerId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Peer ID */}
      <div>
        <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3 px-1">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/30">Your Peer ID</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[10px] md:text-xs text-zinc-400 font-mono">{peerId || '...'}</code>
          <button onClick={handleCopyPeerId} className="p-2 bg-white/5 rounded-lg">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Add Participants */}
      <div>
        <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3 px-1">
          <UserPlus size={12} className="md:w-3.5 md:h-3.5 text-white/30" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/30">Connect Peers</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPeerId}
            onChange={(e) => setNewPeerId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter peer ID..."
            className="flex-1 bg-white/4 border border-white/5 rounded-xl md:rounded-2xl px-3 md:px-5 py-2.5 md:py-3.5 text-xs md:text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newPeerId.trim()}
            className="p-2.5 md:p-3.5 bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 text-blue-400 rounded-xl md:rounded-2xl transition-all active:scale-90"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Target Peer List */}
      {remoteIds.length > 0 && (
        <div className="space-y-2 md:space-y-3 pt-1 md:pt-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">Target Queue</p>
            <span className="text-[9px] md:text-[10px] font-bold text-blue-400/60">{remoteIds.length} READY</span>
          </div>
          <div className="space-y-1 md:space-y-2 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
            {remoteIds.map((id) => (
              <div key={id} className="flex items-center justify-between bg-white/2 hover:bg-white/4 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-white/5 group transition-colors">
                <code className="text-[10px] md:text-xs text-zinc-400 font-mono group-hover:text-blue-400/80 transition-colors">{id}</code>
                <button
                  onClick={() => removeRemoteId(id)}
                  className="p-1 hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all rounded-lg"
                >
                  <X size={12} className="md:w-3.5 md:h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerIdInput;
