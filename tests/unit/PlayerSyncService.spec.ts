import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PlayerSyncService } from '@shared/services/PlayerSyncService';
import { Client, Databases, ID } from 'appwrite';

// Mock appwrite module
vi.mock('appwrite', () => ({
  Client: vi.fn(),
  Databases: vi.fn(),
  ID: {
    unique: vi.fn(() => 'mock-id-123'),
  },
}));

describe('PlayerSyncService', () => {
  let service: PlayerSyncService;
  let mockClient: any;
  let mockDatabases: any;
  const testVenueId = 'test-venue-123';
  const testDatabaseId = 'test-db';
  const testPlayerId = 'player-001';

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock AppWrite Client
    mockClient = {
      subscribe: vi.fn((_channel: string, _callback: any) => {
        return vi.fn(); // Return unsubscribe function
      }),
    };

    // Mock AppWrite Databases methods
    mockDatabases = {
      createDocument: vi.fn().mockResolvedValue({
        $id: 'doc-123',
        venueId: testVenueId,
      }),
      updateDocument: vi.fn().mockResolvedValue({
        $id: 'doc-123',
        venueId: testVenueId,
      }),
      listDocuments: vi.fn().mockResolvedValue({
        documents: [],
        total: 0,
      }),
      getDocument: vi.fn().mockResolvedValue({
        $id: 'state-123',
        venueId: testVenueId,
        nowPlaying: null,
        isPlaying: false,
        volume: 50,
      }),
      deleteDocument: vi.fn().mockResolvedValue({}),
    };

    // Mock Databases constructor
    (Databases as any).mockImplementation(() => mockDatabases);

    service = new PlayerSyncService(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePlayerState', () => {
    it('should update player state when state document exists', async () => {
      const state = {
        nowPlaying: { videoId: 'abc123', title: 'Test Song', artist: 'Test Artist', duration: 180 },
        isPlaying: true,
        volume: 75,
      };

      mockDatabases.listDocuments = vi.fn().mockResolvedValue({
        documents: [{ $id: 'existing-state-123', venueId: testVenueId }],
        total: 1,
      });

      await service.updatePlayerState(testVenueId, testPlayerId, state, testDatabaseId);

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        testDatabaseId,
        'player_state',
        'existing-state-123',
        expect.objectContaining({
          updatedBy: testPlayerId,
          lastUpdated: expect.any(Number),
        })
      );
    });

    it('should create player state when no state document exists', async () => {
      const state = {
        nowPlaying: null,
        isPlaying: false,
        volume: 50,
      };

      mockDatabases.listDocuments = vi.fn().mockResolvedValue({
        documents: [],
        total: 0,
      });

      await service.updatePlayerState(testVenueId, testPlayerId, state, testDatabaseId);

      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        testDatabaseId,
        'player_state',
        expect.any(String),
        expect.objectContaining({
          venueId: testVenueId,
          nowPlaying: null,
          isPlaying: false,
          volume: 50,
          updatedBy: testPlayerId,
          lastUpdated: expect.any(Number),
        })
      );
    });
  });

  describe('getPlayerState', () => {
    it('should retrieve current player state', async () => {
      const mockState = {
        $id: 'state-123',
        venueId: testVenueId,
        nowPlaying: { videoId: 'abc', title: 'Song' },
        isPlaying: true,
        volume: 80,
        lastUpdated: Date.now(),
        updatedBy: 'player-001',
      };

      mockDatabases.listDocuments = vi.fn().mockResolvedValue({
        documents: [mockState],
        total: 1,
      });

      const result = await service.getPlayerState(testVenueId, testDatabaseId);

      expect(result).toEqual(mockState);
    });

    it('should return null when no state exists', async () => {
      mockDatabases.listDocuments = vi.fn().mockResolvedValue({
        documents: [],
        total: 0,
      });

      const result = await service.getPlayerState(testVenueId, testDatabaseId);

      expect(result).toBeNull();
    });
  });

  describe('issueCommand', () => {
    it('should create a command document', async () => {
      const command = 'play';
      const payload = { trackId: 'track-123' };
      const issuedBy = 'admin-001';

      await service.issueCommand(command, testVenueId, payload, issuedBy, testDatabaseId);

      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        testDatabaseId,
        'player_commands',
        expect.any(String),
        expect.objectContaining({
          venueId: testVenueId,
          command,
          payload,
          issuedBy,
          issuedAt: expect.any(Number),
        })
      );
    });

    it('should handle different command types', async () => {
      const commands: Array<{ command: 'play' | 'pause' | 'skip' | 'volume'; payload: any }> = [
        { command: 'pause', payload: {} },
        { command: 'skip', payload: {} },
        { command: 'volume', payload: { volume: 65 } },
      ];

      for (const cmd of commands) {
        await service.issueCommand(cmd.command, testVenueId, cmd.payload, 'admin-001', testDatabaseId);
      }

      expect(mockDatabases.createDocument).toHaveBeenCalledTimes(commands.length);
    });
  });

  describe('markCommandExecuted', () => {
    it('should mark command as executed', async () => {
      const commandId = 'cmd-123';
      const executedBy = 'player-001';

      await service.markCommandExecuted(commandId, executedBy, testDatabaseId);

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        testDatabaseId,
        'player_commands',
        commandId,
        expect.objectContaining({
          executedBy,
          executedAt: expect.any(Number),
        })
      );
    });
  });

  describe('subscribeToPlayerState', () => {
    it('should subscribe to state changes', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToPlayerState(
        testVenueId,
        testDatabaseId,
        mockClient,
        callback
      );

      expect(mockClient.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('subscribeToCommands', () => {
    it('should subscribe to command changes', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToCommands(
        testVenueId,
        testDatabaseId,
        mockClient,
        callback
      );

      expect(mockClient.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('cleanupOldCommands', () => {
    it('should delete old executed commands', async () => {
      const maxAge = 60; // 60 minutes
      const oldCommand = {
        $id: 'old-cmd-123',
        executedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      };

      mockDatabases.listDocuments = vi.fn().mockResolvedValue({
        documents: [oldCommand],
        total: 1,
      });

      await service.cleanupOldCommands(testVenueId, maxAge, testDatabaseId);

      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
        testDatabaseId,
        'player_commands',
        oldCommand.$id
      );
    });
  });
});

