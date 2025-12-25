
import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, Clock, Bot } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onGetAiInsight: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onGetAiInsight
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Interaction</h3>
        </div>
        
        <button 
          onClick={onGetAiInsight}
          className="group flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full hover:bg-blue-600/20 transition-all active:scale-95"
          title="Analyze call with Gemini"
        >
          <Bot size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-blue-400">ASK AI</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <Bot size={48} className="mb-4 stroke-[1px]" />
            <p className="text-xs font-bold uppercase tracking-widest">Signal Terminal Ready</p>
            <p className="text-[10px] mt-2 max-w-[180px]">Ask Gemini AI for a summary or start chatting with peers.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAi = msg.senderId === 'GEMINI-AI';
            const isSelf = msg.sender === 'self';

            if (isAi) {
              return (
                <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] opacity-10">
                      <Sparkles size={80} className="text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1 bg-blue-500 rounded-md">
                        <Bot size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Gemini Assistant</span>
                    </div>
                    <p className="text-sm text-blue-100/80 leading-relaxed font-medium italic">"{msg.content}"</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                <div className="max-w-[85%]">
                  <div className={`flex items-center gap-2 mb-1.5 px-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30">
                      {isSelf ? 'You' : `Peer ${msg.senderId?.slice(-4)}`}
                    </span>
                    <span className="text-[8px] text-white/10">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed ${
                    isSelf
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/20'
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
      <div className="p-6 bg-white/[0.01] border-t border-white/5">
        <form onSubmit={onSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            placeholder="Broadcast a message..."
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-90"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
