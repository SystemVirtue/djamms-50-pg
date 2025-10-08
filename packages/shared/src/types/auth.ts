// Authentication types
export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  venueId?: string;
  autoplay: boolean;
  createdAt: string;
  updatedAt?: string;
  avatar_url?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface MagicLinkCallback {
  secret: string;
  userId: string;
}
