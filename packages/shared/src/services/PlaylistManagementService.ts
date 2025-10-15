/**
 * PlaylistManagementService - CRUD operations for playlists
 * 
 * Manages venue-scoped playlists with full CRUD operations:
 * - Create/Read/Update/Delete playlists
 * - Add/Remove/Reorder tracks within playlists
 * - Get playlists by venue or owner
 * 
 * Database Schema (AppWrite):
 * - Collection: playlists
 * - Attributes: playlistId, name, description, ownerId, venueId, tracks (JSON), createdAt, updatedAt
 * - Indexes: ownerId_key, venueId_key
 * 
 * @module PlaylistManagementService
 */

import { Client, Databases, Query, ID } from 'appwrite';
import type { Track } from '../types/player';
import type { Playlist } from '../types/database';

/**
 * Configuration for PlaylistManagementService
 */
export interface PlaylistServiceConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

/**
 * Service for managing playlists with AppWrite backend
 */
export class PlaylistManagementService {
  private client: Client;
  private databases: Databases;
  private config: PlaylistServiceConfig;

  constructor(config: PlaylistServiceConfig) {
    this.config = config;
    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    this.databases = new Databases(this.client);
  }

  /**
   * Parse tracks from JSON string stored in database
   */
  private parseTracks(tracksJson: string): Track[] {
    try {
      const parsed = JSON.parse(tracksJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse tracks JSON:', error);
      return [];
    }
  }

  /**
   * Convert database document to Playlist type
   */
  private documentToPlaylist(doc: any): Playlist {
    return {
      playlistId: doc.playlistId,
      name: doc.name,
      description: doc.description,
      ownerId: doc.ownerId,
      venueId: doc.venueId,
      tracks: this.parseTracks(doc.tracks),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Get all playlists for a venue
   */
  async getPlaylistsByVenue(venueId: string): Promise<Playlist[]> {
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('venueId', venueId), Query.orderDesc('createdAt')]
      );

      return response.documents.map((doc) => this.documentToPlaylist(doc));
    } catch (error) {
      console.error('Failed to get playlists by venue:', error);
      throw new Error(`Failed to fetch playlists for venue ${venueId}`);
    }
  }

  /**
   * Get all playlists created by a user
   */
  async getPlaylistsByOwner(ownerId: string): Promise<Playlist[]> {
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('ownerId', ownerId), Query.orderDesc('createdAt')]
      );

      return response.documents.map((doc) => this.documentToPlaylist(doc));
    } catch (error) {
      console.error('Failed to get playlists by owner:', error);
      throw new Error(`Failed to fetch playlists for owner ${ownerId}`);
    }
  }

  /**
   * Get a single playlist by ID
   */
  async getPlaylist(playlistId: string): Promise<Playlist> {
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      return this.documentToPlaylist(response.documents[0]);
    } catch (error) {
      console.error('Failed to get playlist:', error);
      throw error;
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(data: {
    name: string;
    description?: string;
    ownerId: string;
    venueId?: string;
    tracks?: Track[];
  }): Promise<Playlist> {
    try {
      const playlistId = ID.unique();
      const now = new Date().toISOString();

      const playlistData = {
        playlistId,
        name: data.name,
        description: data.description || '',
        ownerId: data.ownerId,
        venueId: data.venueId || '',
        tracks: JSON.stringify(data.tracks || []),
        createdAt: now,
        updatedAt: now,
      };

      const response = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collectionId,
        ID.unique(),
        playlistData
      );

      return this.documentToPlaylist(response);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw new Error('Failed to create playlist');
    }
  }

  /**
   * Update playlist metadata (name, description)
   */
  async updatePlaylist(
    playlistId: string,
    updates: {
      name?: string;
      description?: string;
      venueId?: string;
    }
  ): Promise<Playlist> {
    try {
      // Get current playlist to find document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.venueId !== undefined) updateData.venueId = updates.venueId;

      const updated = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        updateData
      );

      return this.documentToPlaylist(updated);
    } catch (error) {
      console.error('Failed to update playlist:', error);
      throw error;
    }
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(playlistId: string): Promise<void> {
    try {
      // Get current playlist to find document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;

      await this.databases.deleteDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId
      );
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  }

  /**
   * Add a track to a playlist
   */
  async addTrack(playlistId: string, track: Track): Promise<Playlist> {
    try {
      const playlist = await this.getPlaylist(playlistId);
      const updatedTracks = [...playlist.tracks, track];

      // Get document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;

      const updated = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        {
          tracks: JSON.stringify(updatedTracks),
          updatedAt: new Date().toISOString(),
        }
      );

      return this.documentToPlaylist(updated);
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      throw error;
    }
  }

  /**
   * Remove a track from a playlist by videoId
   */
  async removeTrack(playlistId: string, videoId: string): Promise<Playlist> {
    try {
      const playlist = await this.getPlaylist(playlistId);
      const updatedTracks = playlist.tracks.filter((t) => t.videoId !== videoId);

      // Get document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;

      const updated = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        {
          tracks: JSON.stringify(updatedTracks),
          updatedAt: new Date().toISOString(),
        }
      );

      return this.documentToPlaylist(updated);
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
      throw error;
    }
  }

  /**
   * Reorder tracks in a playlist
   * @param playlistId - Playlist ID
   * @param trackOrder - Array of videoIds in desired order
   */
  async reorderTracks(playlistId: string, trackOrder: string[]): Promise<Playlist> {
    try {
      const playlist = await this.getPlaylist(playlistId);

      // Create a map for quick lookup
      const trackMap = new Map(playlist.tracks.map((t) => [t.videoId, t]));

      // Reorder based on trackOrder array
      const reorderedTracks = trackOrder
        .map((videoId) => trackMap.get(videoId))
        .filter((t): t is Track => t !== undefined);

      // Get document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;

      const updated = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        {
          tracks: JSON.stringify(reorderedTracks),
          updatedAt: new Date().toISOString(),
        }
      );

      return this.documentToPlaylist(updated);
    } catch (error) {
      console.error('Failed to reorder tracks:', error);
      throw error;
    }
  }

  /**
   * Update all tracks in a playlist (bulk replace)
   */
  async updateTracks(playlistId: string, tracks: Track[]): Promise<Playlist> {
    try {
      // Get document ID
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.equal('playlistId', playlistId)]
      );

      if (response.documents.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      const docId = response.documents[0].$id;

      const updated = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        {
          tracks: JSON.stringify(tracks),
          updatedAt: new Date().toISOString(),
        }
      );

      return this.documentToPlaylist(updated);
    } catch (error) {
      console.error('Failed to update tracks:', error);
      throw error;
    }
  }

  /**
   * Get total duration of all tracks in a playlist
   */
  calculateTotalDuration(playlist: Playlist): number {
    return playlist.tracks.reduce((total, track) => total + track.duration, 0);
  }

  /**
   * Check if a track exists in a playlist
   */
  hasTrack(playlist: Playlist, videoId: string): boolean {
    return playlist.tracks.some((t) => t.videoId === videoId);
  }

  /**
   * Get track count for a playlist
   */
  getTrackCount(playlist: Playlist): number {
    return playlist.tracks.length;
  }
}
