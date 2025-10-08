import { Client, Databases } from 'appwrite';
import { config } from '@shared/config/env';
import type { PlayerRegistrationResult } from '@shared/types/player';

export class PlayerRegistry {
  private deviceId: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  async requestMasterPlayer(
    venueId: string,
    authToken: string
  ): Promise<PlayerRegistrationResult> {
    try {
      const functionUrl = `${config.appwrite.endpoint}/functions/${config.appwrite.functions.playerRegistry}/executions`;
      console.log('🎵 Registering master player at:', functionUrl);
      console.log('Device ID:', this.deviceId, 'Venue:', venueId);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'X-Appwrite-Project': config.appwrite.projectId,
        },
        body: JSON.stringify({
          body: JSON.stringify({
            action: 'register',
            venueId,
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
          })
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Player registration API error:', response.status, errorText);
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Registration response:', result);
      const data = JSON.parse(result.responseBody || '{}');

      if (data.reason === 'MASTER_ACTIVE') {
        console.warn('⚠️ Master player already active:', data.currentMaster);
        return {
          success: false,
          reason: 'MASTER_ACTIVE',
          currentMaster: data.currentMaster,
        };
      }

      if (data.success) {
        console.log('🎉 Registered as master player!');
        localStorage.setItem(`isMasterPlayer_${venueId}`, 'true');
        this.startHeartbeat(venueId, authToken);
        this.retryCount = 0;
        return {
          success: true,
          status: data.status,
          playerId: data.playerId,
        };
      }

      throw new Error(`Registration failed: ${data.error || 'Unknown error'}`);
    } catch (error) {
      console.error('Master player registration failed:', error);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying registration (${this.retryCount}/${this.maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * this.retryCount));
        return this.requestMasterPlayer(venueId, authToken);
      }

      return { success: false, reason: 'NETWORK_ERROR' };
    }
  }

  private startHeartbeat(venueId: string, authToken: string): void {
    // Clear any existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${config.appwrite.endpoint}/functions/${config.appwrite.functions.playerRegistry}/executions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'X-Appwrite-Project': config.appwrite.projectId,
            },
            body: JSON.stringify({ 
              body: JSON.stringify({
                action: 'heartbeat',
                venueId, 
                deviceId: this.deviceId 
              })
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Heartbeat failed');
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.handleMasterLoss(venueId);
      }
    }, 25000); // 25 seconds
  }

  private handleMasterLoss(venueId: string): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    localStorage.removeItem(`isMasterPlayer_${venueId}`);

    // Dispatch custom event for components to handle
    window.dispatchEvent(
      new CustomEvent('masterPlayerLost', { detail: { venueId } })
    );
  }

  async checkMasterStatus(venueId: string, authToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${config.appwrite.endpoint}/functions/${config.appwrite.functions.playerRegistry}/executions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'X-Appwrite-Project': config.appwrite.projectId,
          },
          body: JSON.stringify({ 
            body: JSON.stringify({
              action: 'status',
              venueId 
            })
          }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const data = JSON.parse(result.responseBody || '{}');
      const isMaster = data.hasMaster && data.deviceId === this.deviceId;

      if (isMaster) {
        localStorage.setItem(`isMasterPlayer_${venueId}`, 'true');
        this.startHeartbeat(venueId, authToken);
      }

      return isMaster;
    } catch (error) {
      console.error('Master status check failed:', error);
      return false;
    }
  }

  async cleanup(venueId: string, authToken: string): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    try {
      await fetch(`${config.appwrite.endpoint}/functions/${config.appwrite.functions.playerRegistry}/executions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'X-Appwrite-Project': config.appwrite.projectId,
        },
        body: JSON.stringify({ 
          body: JSON.stringify({
            action: 'release',
            venueId, 
            deviceId: this.deviceId 
          })
        }),
      });

      localStorage.removeItem(`isMasterPlayer_${venueId}`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }
}
