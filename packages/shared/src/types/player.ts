// Player types
export interface Track {
  videoId: string;
  title: string;
  duration: number;
  realEndOffset?: number;
  artist: string;
  isRequest: boolean;
  requesterId?: string;
  paidCredit?: number;
  position?: number;
}

export interface NowPlaying extends Track {
  startTime: number;
  remaining: number;
}

export interface MasterPlayer {
  playerId: string;
  venueId: string;
  deviceId: string;
  status: 'active' | 'idle' | 'offline';
  lastHeartbeat: number;
  expiresAt: number;
  userAgent: string;
  createdAt: string;
}

export interface PlayerState {
  venueId: string;
  nowPlaying?: NowPlaying;
  mainQueue: (Track & { position: number })[];
  priorityQueue: (Track & { requesterId: string; paidCredit: number; position: number })[];
  isMaster: boolean;
}

export interface PlayerRegistrationResult {
  success: boolean;
  reason?: string;
  currentMaster?: {
    deviceId: string;
    lastHeartbeat: number;
  };
  playerId?: string;
  status?: 'registered' | 'reconnected' | 'conflict';
}
