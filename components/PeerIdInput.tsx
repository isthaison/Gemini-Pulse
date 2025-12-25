import React, { useState } from 'react';
import { Plus, X, Copy } from 'lucide-react';

interface PeerIdInputProps {
  remoteIds: string[];
  onRemoteIdsChange: (ids: string[]) => void;
  peerId: string;
  copyFeedback: boolean;
  onCopyId: () => void;
}

const PeerIdInput: React.FC<PeerIdInputProps> = ({
  remoteIds,
  onRemoteIdsChange,
  peerId,
  copyFeedback,
  onCopyId
}) => {
  const [newPeerId, setNewPeerId] = useState('');

  const addPeerId = () => {
    if (newPeerId.trim() && !remoteIds.includes(newPeerId.trim())) {
      onRemoteIdsChange([...remoteIds, newPeerId.trim()]);
      setNewPeerId('');
    }
  };

  const removePeerId = (idToRemove: string) => {
    onRemoteIdsChange(remoteIds.filter(id => id !== idToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPeerId();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Your ID */}
      <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-white/10">
        <span className="text-xs text-white/50 font-medium uppercase tracking-tighter">Your ID</span>
        <code className="text-sm text-blue-400 font-mono">{peerId || '...'}</code>
        <button
          onClick={onCopyId}
          className="p-1 hover:bg-white/20 rounded-md transition-all active:scale-90"
          title="Copy ID"
        >
          {copyFeedback ? <span className="text-[10px] text-green-400 font-bold uppercase">Copied</span> : <Copy size={14} />}
        </button>
      </div>

      {/* Add Peer IDs */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPeerId}
          onChange={(e) => setNewPeerId(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter peer ID..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
        />
        <button
          onClick={addPeerId}
          disabled={!newPeerId.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Peer ID List */}
      {remoteIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/50 uppercase tracking-wider">Connected Peers ({remoteIds.length})</p>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {remoteIds.map((id) => (
              <div key={id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <code className="text-sm text-blue-400 font-mono">{id}</code>
                <button
                  onClick={() => removePeerId(id)}
                  className="p-1 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded transition-all"
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