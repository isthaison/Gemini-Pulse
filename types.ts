
export interface MeetingState {
  peerId: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  isCalling: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'peer' | 'ai';
  content: string;
  timestamp: Date;
}

export interface CallLog {
  timestamp: Date;
  sender: 'User' | 'AI';
  content: string;
}
