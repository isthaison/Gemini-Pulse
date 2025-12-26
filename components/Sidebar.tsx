import React from "react";
import PeerIdInput from "./PeerIdInput";
import ChatPanel from "./ChatPanel";

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full min-h-0">
      <div className="p-4 md:p-6 bg-white/2 border border-white/5 rounded-2xl md:rounded-3xl backdrop-blur-md">
        <PeerIdInput />
      </div>
      <div className="flex-1 min-h-0 flex flex-col bg-white/2 border border-white/5 rounded-2xl md:rounded-3xl backdrop-blur-md overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
};

export default Sidebar;
