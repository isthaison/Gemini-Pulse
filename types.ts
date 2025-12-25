import { DataConnection, MediaConnection } from "peerjs";

export interface RemotePeer {
  id: string;
  stream: MediaStream | null;
  isConnected: boolean;
  call: MediaConnection | null;
  dataConnection: DataConnection | null;
}

export interface MeetingState {
  peerId: string | null;
  remotePeers: RemotePeer[];
  isCalling: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'peer';
  senderId?: string; // For identifying which peer sent the message
  content: string;
  timestamp: Date;
}

export interface CallLog {
  timestamp: Date;
  sender: 'User' | 'Peer';
  senderId?: string;
  content: string;
}
