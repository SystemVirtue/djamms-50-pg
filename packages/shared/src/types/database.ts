// Database types matching AppWrite schema
import type { Track } from './player';

export interface User {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  venueId?: string;
  autoplay: boolean;
  createdAt: string;
  updatedAt?: string;
  avatar_url?: string;
}

export interface Venue {
  venueId: string;
  name: string;
  slug: string;
  ownerId: string;
  activePlayerInstanceId?: string;
  createdAt: string;
}

export interface Playlist {
  playlistId: string;
  name: string;
  description?: string;
  ownerId: string;
  venueId?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt?: string;
}

export interface Queue {
  venueId: string;
  nowPlaying?: Track & { startTime: number; remaining: number };
  mainQueue: (Track & { position: number })[];
  priorityQueue: (Track & { requesterId: string; paidCredit: number; position: number })[];
  createdAt: string;
  updatedAt?: string;
}

export interface Request {
  requestId: string;
  venueId: string;
  song: Track;
  status: 'pending' | 'played' | 'cancelled';
  paymentId: string;
  timestamp: string;
}

export interface Payment {
  paymentId: string;
  venueId: string;
  amount: number;
  status: 'paid' | 'refunded';
}

export interface PlayerInstance {
  playerId: string;
  venueId: string;
  deviceId: string;
  status: 'active' | 'idle' | 'offline';
  lastHeartbeat: number;
  expiresAt: number;
  userAgent: string;
  createdAt: string;
}

export interface State {
  stateId: string;
  venueId: string;
  state: any;
  createdAt: string;
}

export interface Video {
  videoId: string;
  title: string;
  duration?: number;
  createdAt: string;
}

export interface MagicLink {
  email: string;
  token: string;
  redirectUrl: string;
  expiresAt: number;
  used: boolean;
}
