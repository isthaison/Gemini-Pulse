import React from 'react';
import PeerIdInput from './PeerIdInput';
import ChatPanel from './ChatPanel';

interface SidebarProps {
  peerId: string;
  remoteIds: string[];
  messages: any[];
  chatInput: string;
  copyFeedback: boolean;
  onRemoteIdsChange: (ids: string[]) => void;
  onAddPeerId: (id: string) => void;
  onRemovePeerId: (id: string) => void;
  onCopyPeerId: () => void;
  onChatInputChange: (input: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  peerId,
  remoteIds,
  messages,
  chatInput,
  copyFeedback,
  onRemoteIdsChange,
  onAddPeerId,
  onRemovePeerId,
  onCopyPeerId,
  onChatInputChange,
  onSendMessage,
}) => {
  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full min-h-0">
      <div className="p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl backdrop-blur-md">
        <PeerIdInput
          remoteIds={remoteIds}
          onRemoteIdsChange={onRemoteIdsChange}
          peerId={peerId}
          copyFeedback={copyFeedback}
          onCopyPeerId={onCopyPeerId}
          onAddPeerId={onAddPeerId}
          onRemovePeerId={onRemovePeerId}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl backdrop-blur-md overflow-hidden">
        <ChatPanel
          messages={messages}
          chatInput={chatInput}
          onChatInputChange={onChatInputChange}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
};

export default Sidebar;