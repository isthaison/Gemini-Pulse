
export interface MeetingState {
  peerId: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  isCalling: boolean;
  error: string | null;
}

export interface CallLog {
  timestamp: Date;
  sender: 'User' | 'AI';
  content: string;
}
