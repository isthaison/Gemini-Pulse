import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, Clock } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-96 flex flex-col gap-4">
      <div className="flex-1 glass rounded-2xl border border-white/5 flex flex-col shadow-xl overflow-hidden">
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Interaction Hub</h3>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
              <div className="w-12 h-12 rounded-full border border-dashed border-white/50 mb-3 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <p className="text-xs uppercase font-bold tracking-widest">No messages yet</p>
              <p className="text-[10px] mt-1 max-w-37.5">Start typing to chat with your peers.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'self' ? 'items-end' : 'items-start'}`}
              >
                <div className="max-w-[85%] group">
                  <div className={`flex items-center gap-1.5 mb-1 px-1 ${msg.sender === 'self' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[9px] font-bold text-white/30 uppercase">
                      {msg.sender === 'self' ? 'You' : `Peer ${msg.senderId ? msg.senderId.slice(-4) : ''}`}
                    </span>
                    <span className="text-[8px] text-white/10">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    msg.sender === 'self'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10'
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Area */}
        <form onSubmit={onSendMessage} className="p-4 border-t border-white/5 bg-white/5 flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;