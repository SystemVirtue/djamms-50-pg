/**
 * Custom hook for venue access and permissions
 * Handles venue-centric schema with users[] array
 */

import { useQuery } from '@tanstack/react-query';
import { useAppwrite } from '@djamms/appwrite-client';

interface VenueUser {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  addedAt: string;
  addedBy: string;
}

interface Venue {
  $id: string;
  venueId: string;
  name: string;
  ownerId: string;
  users: VenueUser[];
  playerConfig: any;
  queueConfig: any;
  isActive: boolean;
  settings: any;
  $createdAt: string;
  $updatedAt: string;
}

export interface VenueAccessResult {
  venue: Venue | undefined;
  userRole: 'owner' | 'admin' | 'staff' | 'viewer' | null;
  hasAccess: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManage: boolean;
  canEdit: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get venue data and check user's access level
 * 
 * @param venueId - Venue document ID
 * @param userId - Current user's ID
 */
export function useVenueAccess(venueId: string | undefined, userId: string | undefined): VenueAccessResult {
  const { databases } = useAppwrite();
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  
  const { data: venue, isLoading, error } = useQuery<Venue>({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      if (!venueId) throw new Error('Venue ID is required');
      
      const doc = await databases.getDocument(
        DATABASE_ID,
        'venues',
        venueId
      );
      
      // Parse users JSON string to array
      const parsedVenue = {
        ...doc,
        users: typeof doc.users === 'string' ? JSON.parse(doc.users) : (doc.users || [])
      } as unknown as Venue;
      
      return parsedVenue;
    },
    enabled: !!venueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find user's role in the venue
  const userRole = venue?.users?.find((u: VenueUser) => u.userId === userId)?.role || null;

  // Permission checks
  const hasAccess = !!userRole;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const canManage = isAdmin; // Owners and admins can manage settings
  const canEdit = isAdmin || userRole === 'staff'; // Staff can edit playlists/queue

  return {
    venue,
    userRole,
    hasAccess,
    isOwner,
    isAdmin,
    canManage,
    canEdit,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Get all venues where user has access
 * 
 * @param userId - Current user's ID
 */
export function useUserVenues(userId: string | undefined) {
  const { databases } = useAppwrite();
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['user-venues', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      // Search for user in venue.users[] arrays
      const response = await databases.listDocuments(
        DATABASE_ID,
        'venues',
        // Note: In production, create an index on users[].userId for performance
        // For now, we'll fetch all venues and filter client-side
      );
      
      // Parse users JSON and filter venues where user has access
      const userVenues = response.documents
        .map((doc: any) => ({
          ...doc,
          users: typeof doc.users === 'string' ? JSON.parse(doc.users) : (doc.users || [])
        }))
        .filter((venue: any) => 
          venue.users.some((u: VenueUser) => u.userId === userId)
        ) as Venue[];
      
      return userVenues;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    venues,
    isLoading,
    error: error as Error | null,
  };
}
