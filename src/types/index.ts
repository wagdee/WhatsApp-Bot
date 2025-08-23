export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}

export interface ScheduledMessage {
  id: string;
  userId: string;
  phoneNumber: string;
  message: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

export interface AutoReply {
  id: string;
  userId: string;
  trigger: string;
  response: string;
  isActive: boolean;
  createdAt: string;
}

export interface BotStatus {
  isConnected: boolean;
  phoneNumber?: string;
  qrCode?: string;
  lastActivity?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}