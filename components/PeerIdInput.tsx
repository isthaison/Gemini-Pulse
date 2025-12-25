
import React, { useState } from 'react';
import { Plus, X, Copy, Users, UserPlus } from 'lucide-react';

interface PeerIdInputProps {
  remoteIds: string[];
  onRemoteIdsChange: (ids: string[]) => void;
  peerId: string;
  copyFeedback: boolean;
  onCopyPeerId: () => void;
  onAddPeerId: (id: string) => void;
  onRemovePeerId: (id: string) => void;
}

const PeerIdInput: React.FC<PeerIdInputProps> = ({
  remoteIds,
  onRemoteIdsChange,
  peerId,
  copyFeedback,
  onCopyPeerId,
  onAddPeerId,
  onRemovePeerId
}) => {
  const [newPeerId, setNewPeerId] = useState('');

  const handleAdd = () => {
    if (newPeerId.trim()) {
      onAddPeerId(newPeerId.trim());
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
    <div className="flex flex-col gap-6">
      {/* Your ID Display */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Users size={14} className="text-white/30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Your Identity</span>
        </div>
        <div className="flex items-center justify-between bg-white/[0.04] border border-white/5 px-5 py-4 rounded-[1.25rem] group hover:bg-white/[0.06] transition-all">
          <code className="text-sm text-blue-400 font-mono font-bold tracking-tight">{peerId || 'Generating...'}</code>
          <button
            onClick={onCopyPeerId}
            className={`p-2 rounded-lg transition-all active:scale-90 ${copyFeedback ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/40 hover:text-white'}`}
            title="Copy your ID"
          >
            {copyFeedback ? <span className="text-[10px] font-bold px-1">COPIED</span> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Add Participants */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <UserPlus size={14} className="text-white/30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Connect Peers</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPeerId}
            onChange={(e) => setNewPeerId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Remote peer identity code..."
            className="flex-1 bg-white/[0.04] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newPeerId.trim()}
            className="p-3.5 bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 text-blue-400 rounded-2xl transition-all active:scale-90"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Target Peer List */}
      {remoteIds.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Target Queue</p>
            <span className="text-[10px] font-bold text-blue-400/60">{remoteIds.length} READY</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {remoteIds.map((id) => (
              <div key={id} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 rounded-xl border border-white/5 group transition-colors">
                <code className="text-xs text-zinc-400 font-mono group-hover:text-blue-400/80 transition-colors">{id}</code>
                <button
                  onClick={() => onRemovePeerId(id)}
                  className="p-1.5 hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all rounded-lg"
                >
                  <X size={14} />
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
