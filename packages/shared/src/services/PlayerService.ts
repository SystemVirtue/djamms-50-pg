import { Client, Databases, Query } from 'appwrite';
import type { MasterPlayer, PlayerRegistrationResult } from '../types/player';

export class PlayerService {
  private databases: Databases;
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly MASTER_TIMEOUT = 15000; // 15 seconds

  constructor(client: Client) {
    this.databases = new Databases(client);
  }

  /**
   * Request to become master player for a venue
   * Implements master election with heartbeat-based expiry
   */
  async requestMaster(
    venueId: string,
    deviceId: string,
    databaseId: string
  ): Promise<PlayerRegistrationResult> {
    try {
      // Check for existing master
      const existingMasters = await this.databases.listDocuments(
        databaseId,
        'player_instances',
        [
          Query.equal('venueId', venueId),
          Query.equal('status', 'active'),
          Query.greaterThan('expiresAt', Date.now()),
        ]
      );

      // If there's an active master that hasn't expired
      if (existingMasters.documents.length > 0) {
        const currentMaster = existingMasters.documents[0] as unknown as MasterPlayer;
        
        // If this device is the current master (reconnection)
        if (currentMaster.deviceId === deviceId) {
          // Update heartbeat and continue
          await this.updateHeartbeat(currentMaster.playerId, databaseId);
          return {
            success: true,
            status: 'reconnected',
            playerId: currentMaster.playerId,
          };
        }

        // Another device is master
        return {
          success: false,
          reason: 'Another player is currently active',
          currentMaster: {
            deviceId: currentMaster.deviceId,
            lastHeartbeat: currentMaster.lastHeartbeat,
          },
        };
      }

      // No active master - register this device
      const now = Date.now();
      const player = await this.databases.createDocument(
        databaseId,
        'player_instances',
        'unique()',
        {
          venueId,
          deviceId,
          status: 'active',
          lastHeartbeat: now,
          expiresAt: now + this.MASTER_TIMEOUT,
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString(),
        }
      );

      return {
        success: true,
        status: 'registered',
        playerId: player.$id,
      };
    } catch (error) {
      console.error('Failed to request master:', error);
      return {
        success: false,
        reason: 'Failed to connect to server',
      };
    }
  }

  /**
   * Update heartbeat to maintain master status
   */
  async updateHeartbeat(playerId: string, databaseId: string): Promise<void> {
    try {
      const now = Date.now();
      await this.databases.updateDocument(databaseId, 'player_instances', playerId, {
        lastHeartbeat: now,
        expiresAt: now + this.MASTER_TIMEOUT,
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to update heartbeat:', error);
      throw error;
    }
  }

  /**
   * Start heartbeat interval to maintain master status
   */
  startHeartbeat(playerId: string, databaseId: string): void {
    // Clear any existing interval
    this.stopHeartbeat();

    // Send initial heartbeat
    this.updateHeartbeat(playerId, databaseId).catch(console.error);

    // Start interval
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat(playerId, databaseId).catch((error) => {
        console.error('Heartbeat failed:', error);
        // Could implement reconnection logic here
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat interval
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Release master status (when leaving or closing)
   */
  async releaseMaster(playerId: string, databaseId: string): Promise<void> {
    try {
      this.stopHeartbeat();
      await this.databases.updateDocument(databaseId, 'player_instances', playerId, {
        status: 'offline',
        expiresAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to release master:', error);
    }
  }

  /**
   * Check if this player is still master
   */
  async checkMasterStatus(
    playerId: string,
    venueId: string,
    databaseId: string
  ): Promise<boolean> {
    try {
      const player = await this.databases.getDocument(
        databaseId,
        'player_instances',
        playerId
      );

      const masterPlayer = player as unknown as MasterPlayer;
      
      // Check if still active and not expired
      return (
        masterPlayer.venueId === venueId &&
        masterPlayer.status === 'active' &&
        masterPlayer.expiresAt > Date.now()
      );
    } catch (error) {
      console.error('Failed to check master status:', error);
      return false;
    }
  }

  /**
   * Cleanup expired master instances
   * This can be called periodically or by cloud function
   */
  async cleanupExpiredMasters(databaseId: string): Promise<number> {
    try {
      const expired = await this.databases.listDocuments(
        databaseId,
        'player_instances',
        [
          Query.equal('status', 'active'),
          Query.lessThan('expiresAt', Date.now()),
        ]
      );

      // Update expired instances to offline
      for (const doc of expired.documents) {
        await this.databases.updateDocument(databaseId, 'player_instances', doc.$id, {
          status: 'offline',
        });
      }

      return expired.documents.length;
    } catch (error) {
      console.error('Failed to cleanup expired masters:', error);
      return 0;
    }
  }
}
