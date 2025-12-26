import React from "react";
import PeerIdInput from "./PeerIdInput";
import ChatPanel from "./ChatPanel";

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="p-3 bg-white/15 border border-white/20 rounded-xl backdrop-blur-sm">
        <PeerIdInput />
      </div>
      <div className="flex-1 min-h-0 flex flex-col bg-white/15 border border-white/20 rounded-xl backdrop-blur-sm overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
};

export default Sidebar;
