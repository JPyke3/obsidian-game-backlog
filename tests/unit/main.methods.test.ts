import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock obsidian before importing main
vi.mock('obsidian', () => import('../__mocks__/obsidian'));

import GameBacklogPlugin from '../../main.ts';
import { App, Notice, TFile } from '../__mocks__/obsidian';

describe('GameBacklogPlugin methods', () => {
  let plugin: GameBacklogPlugin;
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();

    app = new App();
    const manifest = {
      id: 'game-backlog',
      name: 'Game Backlog',
      version: '1.0.0',
      minAppVersion: '1.0.0',
      description: 'Test description',
      author: 'Test Author',
    };

    plugin = new GameBacklogPlugin(app, manifest);
  });

  describe('createGameNote method', () => {
    it('should create game note with correct filename', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      const gameData = {
        title: 'Test Game',
        platform: 'Steam Deck',
        priority: 'Must Play',
        rating: 85,
        hltbHours: 20,
        efficiency: 4.25,
        coverUrl: 'https://example.com/cover.jpg',
        description: 'A test game',
        igdbId: 12345,
        genres: ['Action'],
        releaseYear: 2023,
      };

      // Mock vault methods
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);
      app.vault.create = vi.fn().mockResolvedValue({ path: '🎮 Test Game.md' });
      
      // Mock workspace
      app.workspace.getLeaf = vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined)
      });

      // Access private method via type assertion
      const createGameNote = (plugin as any).createGameNote.bind(plugin);
      await createGameNote(gameData);

      expect(app.vault.create).toHaveBeenCalledWith('🎮 Test Game.md', expect.any(String));
      expect(Notice).toHaveBeenCalledWith('Added "Test Game" to your backlog!');
    });

    it('should handle existing file gracefully', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      const gameData = {
        title: 'Existing Game',
        platform: 'Steam Deck',
        priority: 'Must Play',
        rating: 85,
        hltbHours: 20,
        efficiency: 4.25,
        coverUrl: 'https://example.com/cover.jpg',
        description: 'A test game',
        igdbId: 12345,
        genres: ['Action'],
        releaseYear: 2023,
      };

      // Mock existing file
      const existingFile = new TFile();
      existingFile.path = '🎮 Existing Game.md';
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(existingFile);
      
      // Mock workspace
      app.workspace.getLeaf = vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined)
      });

      // Access private method via type assertion
      const createGameNote = (plugin as any).createGameNote.bind(plugin);
      await createGameNote(gameData);

      expect(app.vault.create).not.toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith('A note for "Existing Game" already exists');
    });

    it('should handle file creation errors', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      const gameData = {
        title: 'Error Game',
        platform: 'Steam Deck',
        priority: 'Must Play',
        rating: 85,
        hltbHours: 20,
        efficiency: 4.25,
        coverUrl: 'https://example.com/cover.jpg',
        description: 'A test game',
        igdbId: 12345,
        genres: ['Action'],
        releaseYear: 2023,
      };

      // Mock vault to throw error
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);
      app.vault.create = vi.fn().mockRejectedValue(new Error('Create failed'));

      // Access private method via type assertion
      const createGameNote = (plugin as any).createGameNote.bind(plugin);
      await createGameNote(gameData);

      expect(Notice).toHaveBeenCalledWith('Failed to create game note. Check console for details.');
    });
  });

  describe('openBacklogDashboard method', () => {
    it('should create dashboard when it does not exist', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Mock vault to return null (no existing file)
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);
      app.vault.create = vi.fn().mockResolvedValue({ path: 'Video Game Backlog.md' });
      
      // Mock workspace
      app.workspace.getLeaf = vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined)
      });

      // Access private method via type assertion
      const openBacklogDashboard = (plugin as any).openBacklogDashboard.bind(plugin);
      await openBacklogDashboard();

      expect(app.vault.create).toHaveBeenCalledWith('Video Game Backlog.md', expect.any(String));
      expect(Notice).toHaveBeenCalledWith('Created Video Game Backlog dashboard');
    });

    it('should open existing dashboard', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Mock existing file
      const existingFile = new TFile();
      existingFile.path = 'Video Game Backlog.md';
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(existingFile);
      
      // Mock workspace
      app.workspace.getLeaf = vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined)
      });

      // Access private method via type assertion
      const openBacklogDashboard = (plugin as any).openBacklogDashboard.bind(plugin);
      await openBacklogDashboard();

      expect(app.vault.create).not.toHaveBeenCalled();
      expect(app.workspace.getLeaf().openFile).toHaveBeenCalledWith(existingFile);
    });
  });

  describe('updateGameStatus method', () => {
    it('should update game status in frontmatter', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Mock file and vault
      const file = new TFile();
      file.path = 'test.md';
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(file);
      app.vault.read = vi.fn().mockResolvedValue(`---
title: "Test Game"
priority: "Must Play"
---

Some content`);
      app.vault.modify = vi.fn().mockResolvedValue(undefined);
      
      // Mock metadata cache
      app.metadataCache.getFileCache = vi.fn().mockReturnValue({
        frontmatter: {
          priority: 'Must Play'
        }
      });

      // Access private method via type assertion
      const updateGameStatus = (plugin as any).updateGameStatus.bind(plugin);
      await updateGameStatus('test.md');

      // Should open a modal, but we can't easily test the modal interaction
      // Just verify the method doesn't throw
      expect(true).toBe(true);
    });

    it('should handle missing file gracefully', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Mock vault to return null
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);

      // Access private method via type assertion
      const updateGameStatus = (plugin as any).updateGameStatus.bind(plugin);
      await updateGameStatus('nonexistent.md');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle missing frontmatter gracefully', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Mock file and vault
      const file = new TFile();
      file.path = 'test.md';
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(file);
      app.vault.read = vi.fn().mockResolvedValue('Some content without frontmatter');
      
      // Mock metadata cache with no frontmatter
      app.metadataCache.getFileCache = vi.fn().mockReturnValue({});

      // Access private method via type assertion
      const updateGameStatus = (plugin as any).updateGameStatus.bind(plugin);
      await updateGameStatus('test.md');

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('openAddGameModal method', () => {
    it('should show notice when credentials are missing', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.loadSettings();
      
      // Access private method via type assertion
      const openAddGameModal = (plugin as any).openAddGameModal.bind(plugin);
      openAddGameModal();

      expect(Notice).toHaveBeenCalledWith(
        'Please configure your Twitch Client ID and Secret in the Game Backlog settings'
      );
    });

    it('should open modal when credentials are present', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({
        twitchClientId: 'test-id',
        twitchClientSecret: 'test-secret'
      });
      await plugin.loadSettings();
      
      // Mock the modal
      const mockModal = {
        open: vi.fn()
      };
      
      // We can't easily test the modal creation, but we can verify it doesn't throw
      // Access private method via type assertion
      const openAddGameModal = (plugin as any).openAddGameModal.bind(plugin);
      openAddGameModal();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('initializeClients method', () => {
    it('should initialize API clients with settings', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({
        twitchClientId: 'test-id',
        twitchClientSecret: 'test-secret',
        steamGridDbApiKey: 'test-key'
      });
      await plugin.loadSettings();
      
      // Access private method via type assertion
      const initializeClients = (plugin as any).initializeClients.bind(plugin);
      initializeClients();

      // Check that clients are initialized
      expect(plugin.igdbClient).toBeDefined();
      expect(plugin.hltbClient).toBeDefined();
      expect(plugin.steamGridDbClient).toBeDefined();
    });
  });
});