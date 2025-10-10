import { Client, Databases, ID } from 'appwrite';
import type { NowPlaying } from '../types/player';

export interface PlayerStateDocument {
  $id: string;
  venueId: string;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  volume: number;
  lastUpdated: number;
  updatedBy: string; // playerId
}

export interface PlayerCommand {
  $id: string;
  venueId: string;
  command: 'play' | 'pause' | 'skip' | 'volume' | 'seek';
  payload?: any;
  issuedBy: string; // userId or deviceId
  issuedAt: number;
  executedBy?: string; // playerId
  executedAt?: number;
}

/**
 * Service for synchronizing player state across devices
 * Enables viewer endpoints and admin controls to see/control player
 */
export class PlayerSyncService {
  private databases: Databases;

  constructor(client: Client) {
    this.databases = new Databases(client);
  }

  /**
   * Update player state (called by master player)
   */
  async updatePlayerState(
    venueId: string,
    playerId: string,
    state: Partial<PlayerStateDocument>,
    databaseId: string
  ): Promise<void> {
    try {
      // Try to update existing document
      const existing = await this.getPlayerState(venueId, databaseId);

      if (existing) {
        await this.databases.updateDocument(
          databaseId,
          'player_state',
          existing.$id,
          {
            ...state,
            lastUpdated: Date.now(),
            updatedBy: playerId,
          }
        );
      } else {
        // Create new document
        await this.databases.createDocument(
          databaseId,
          'player_state',
          ID.unique(),
          {
            venueId,
            nowPlaying: state.nowPlaying || null,
            isPlaying: state.isPlaying ?? false,
            volume: state.volume ?? 100,
            lastUpdated: Date.now(),
            updatedBy: playerId,
          }
        );
      }
    } catch (error) {
      console.error('Failed to update player state:', error);
      throw error;
    }
  }

  /**
   * Get current player state for a venue
   */
  async getPlayerState(
    venueId: string,
    databaseId: string
  ): Promise<PlayerStateDocument | null> {
    try {
      const response = await this.databases.listDocuments(
        databaseId,
        'player_state',
        [`venueId=${venueId}`]
      );

      if (response.documents.length > 0) {
        return response.documents[0] as unknown as PlayerStateDocument;
      }

      return null;
    } catch (error) {
      console.error('Failed to get player state:', error);
      return null;
    }
  }

  /**
   * Subscribe to player state changes
   */
  subscribeToPlayerState(
    venueId: string,
    databaseId: string,
    client: Client,
    callback: (state: PlayerStateDocument) => void
  ): () => void {
    const channel = `databases.${databaseId}.collections.player_state.documents`;

    const unsubscribe = client.subscribe(channel, (response: any) => {
      if (
        response.payload &&
        response.payload.venueId === venueId
      ) {
        callback(response.payload as PlayerStateDocument);
      }
    });

    return unsubscribe;
  }

  /**
   * Issue a command to the player (from admin or viewer)
   */
  async issueCommand(
    venueId: string,
    command: PlayerCommand['command'],
    payload: any,
    issuedBy: string,
    databaseId: string
  ): Promise<PlayerCommand> {
    try {
      const doc = await this.databases.createDocument(
        databaseId,
        'player_commands',
        ID.unique(),
        {
          venueId,
          command,
          payload: payload ? JSON.stringify(payload) : null,
          issuedBy,
          issuedAt: Date.now(),
          executedBy: null,
          executedAt: null,
        }
      );

      return doc as unknown as PlayerCommand;
    } catch (error) {
      console.error('Failed to issue command:', error);
      throw error;
    }
  }

  /**
   * Subscribe to player commands (for master player to execute)
   */
  subscribeToCommands(
    venueId: string,
    databaseId: string,
    client: Client,
    callback: (command: PlayerCommand) => void
  ): () => void {
    const channel = `databases.${databaseId}.collections.player_commands.documents`;

    const unsubscribe = client.subscribe(channel, (response: any) => {
      if (
        response.events.includes('databases.*.collections.*.documents.*.create') &&
        response.payload &&
        response.payload.venueId === venueId &&
        !response.payload.executedAt
      ) {
        callback(response.payload as PlayerCommand);
      }
    });

    return unsubscribe;
  }

  /**
   * Mark command as executed (called by master player)
   */
  async markCommandExecuted(
    commandId: string,
    playerId: string,
    databaseId: string
  ): Promise<void> {
    try {
      await this.databases.updateDocument(
        databaseId,
        'player_commands',
        commandId,
        {
          executedBy: playerId,
          executedAt: Date.now(),
        }
      );
    } catch (error) {
      console.error('Failed to mark command as executed:', error);
    }
  }

  /**
   * Get pending commands for a venue
   */
  async getPendingCommands(
    venueId: string,
    databaseId: string
  ): Promise<PlayerCommand[]> {
    try {
      const response = await this.databases.listDocuments(
        databaseId,
        'player_commands',
        [
          `venueId=${venueId}`,
          `executedAt=null`,
        ]
      );

      return response.documents as unknown as PlayerCommand[];
    } catch (error) {
      console.error('Failed to get pending commands:', error);
      return [];
    }
  }

  /**
   * Clean up old commands (can be run periodically)
   */
  async cleanupOldCommands(
    databaseId: string,
    olderThanMs: number = 3600000 // 1 hour
  ): Promise<number> {
    try {
      const cutoffTime = Date.now() - olderThanMs;
      const response = await this.databases.listDocuments(
        databaseId,
        'player_commands',
        [`issuedAt<${cutoffTime}`]
      );

      for (const doc of response.documents) {
        await this.databases.deleteDocument(
          databaseId,
          'player_commands',
          doc.$id
        );
      }

      return response.documents.length;
    } catch (error) {
      console.error('Failed to cleanup old commands:', error);
      return 0;
    }
  }
}
