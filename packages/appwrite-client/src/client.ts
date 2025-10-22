/**
 * Singleton AppWrite Client
 * Ensures all services share the same authenticated client instance
 * This is critical for session authentication to work across all services
 */
import { Client } from 'appwrite';
import { config } from '@shared/config/env';

let clientInstance: Client | null = null;

/**
 * Get the singleton AppWrite Client instance
 * All services should use this to ensure session cookies are shared
 */
export function getAppwriteClient(): Client {
  if (!clientInstance) {
    console.log('[AppWrite Client] Creating singleton instance');
    clientInstance = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId);
    
    console.log('[AppWrite Client] Configured:', {
      endpoint: config.appwrite.endpoint,
      projectId: config.appwrite.projectId
    });
  }
  
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing or logout)
 */
export function resetAppwriteClient(): void {
  console.log('[AppWrite Client] Resetting singleton instance');
  clientInstance = null;
}
