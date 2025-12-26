
import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, Clock, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import { useMessageStore } from '../store/useMessageStore';
import { useChatStore } from '../store/useChatStore';

const ChatPanel: React.FC = () => {
  const { messages } = useMessageStore();
  const { chatInput, setChatInput, sendMessageToPeers } = useChatStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (chatInput.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: chatInput,
        sender: "self",
        timestamp: new Date(),
      };
      // Add message to local store
      const { addMessage } = useMessageStore.getState();
      addMessage(message);
      // Send to peers
      sendMessageToPeers(chatInput);
      // Clear input
      setChatInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-5 border-b border-white/5 bg-white/[0.03]">
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Sparkles size={12} className="md:w-4 md:h-4 text-blue-400" />
          </div>
          <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-white/90">Interaction</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <Bot size={36} className="md:w-12 md:h-12 mb-3 md:mb-4 stroke-[1px]" />
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Signal Terminal Ready</p>
            <p className="text-[9px] md:text-[10px] mt-1 md:mt-2 max-w-[160px] md:max-w-[180px]">Start chatting with peers to coordinate your video call.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender === 'self';
            const isSystem = msg.sender === 'system';
            const label = isSelf ? 'You' : isSystem ? 'System' : (msg.senderId ? `Peer ${msg.senderId.slice(-4)}` : 'Peer');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                <div className="max-w-[90%] md:max-w-[85%]">
                  <div className={`flex items-center gap-1 md:gap-2 mb-1 md:mb-1.5 px-1 md:px-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-white/30">
                      {label}
                    </span>
                    <span className="text-[7px] md:text-[8px] text-white/10">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-[1.5rem] text-xs md:text-sm leading-relaxed ${
                    isSelf
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/20'
                      : isSystem
                        ? 'bg-white/[0.06] text-zinc-200 italic'
                        : 'bg-white/[0.05] border border-white/5 text-zinc-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-white/[0.01] border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Broadcast a message..."
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-5 py-2.5 md:py-3.5 text-xs md:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2.5 md:p-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl md:rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-90"
          >
            <Send size={16} className="md:w-5 md:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
