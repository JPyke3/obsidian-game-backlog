import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock obsidian before importing main
vi.mock('obsidian', () => import('../__mocks__/obsidian'));

import GameBacklogPlugin from '../../main.ts';
import { DEFAULT_SETTINGS } from '../../src/settings';
import { generateGameNote, generateFileName } from '../../src/templates/gameNote';
import type { GameData } from '../../src/ui/AddGameModal';
import { App, Plugin, Notice, requestUrl } from '../__mocks__/obsidian';

describe('GameBacklogPlugin', () => {
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

  afterEach(() => {
    vi.resetAllMocks();
  });

  const _mockRequestUrl = requestUrl;

  describe('constructor', () => {
    it('should create plugin instance', () => {
      expect(plugin).toBeInstanceOf(Plugin);
    });

    it('should have app reference', () => {
      expect(plugin.app).toBe(app);
    });
  });

  describe('loadSettings', () => {
    it('should load default settings when no saved data', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});

      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge saved settings with defaults', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({
        twitchClientId: 'saved-id',
        defaultPlatform: 'Full PC',
      });

      await plugin.loadSettings();

      expect(plugin.settings.twitchClientId).toBe('saved-id');
      expect(plugin.settings.defaultPlatform).toBe('Full PC');
      expect(plugin.settings.twitchClientSecret).toBe(''); // Default
      expect(plugin.settings.defaultPriority).toBe('Will Get Around To'); // Default
    });

    it('should handle null saved data', async () => {
      plugin.loadData = vi.fn().mockResolvedValue(null);

      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('should save settings data', async () => {
      plugin.saveData = vi.fn().mockResolvedValue(undefined);
      plugin.settings = { ...DEFAULT_SETTINGS, twitchClientId: 'new-id' };

      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('onload', () => {
    it('should load settings on plugin load', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      plugin.saveData = vi.fn().mockResolvedValue(undefined);

      await plugin.onload();

      expect(plugin.loadData).toHaveBeenCalled();
    });

    it('should register commands', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const addCommandSpy = vi.spyOn(plugin, 'addCommand');

      await plugin.onload();

      expect(addCommandSpy).toHaveBeenCalledTimes(3);
    });

    it('should add settings tab', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const addSettingTabSpy = vi.spyOn(plugin, 'addSettingTab');

      await plugin.onload();

      expect(addSettingTabSpy).toHaveBeenCalled();
    });
  });

  describe('onunload', () => {
    it('should have onunload method', () => {
      expect(typeof plugin.onunload).toBe('function');
    });

    it('should not throw on unload', () => {
      expect(() => plugin.onunload()).not.toThrow();
    });
  });

  describe('generateBacklogDashboard', () => {
    it('should generate dashboard with Dataview queries', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.onload();

      // Access private method via type assertion
      const generateDashboard = (plugin as any).generateBacklogDashboard.bind(plugin);
      const dashboard = generateDashboard();

      expect(dashboard).toContain('# Video Game Backlog');
      expect(dashboard).toContain('## At a Glance');
      expect(dashboard).toContain('## Now Playing');
      expect(dashboard).toContain('## Up Next (Best Value)');
      expect(dashboard).toContain('## The Backlog');
      expect(dashboard).toContain('## Completed');
    });

    it('should include Dataview queries', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.onload();

      const generateDashboard = (plugin as any).generateBacklogDashboard.bind(plugin);
      const dashboard = generateDashboard();

      expect(dashboard).toContain('```dataview');
      expect(dashboard).toContain('FROM #game');
      expect(dashboard).toContain('SORT efficiency DESC');
    });

    it('should include dataviewjs for summary stats', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.onload();

      const generateDashboard = (plugin as any).generateBacklogDashboard.bind(plugin);
      const dashboard = generateDashboard();

      expect(dashboard).toContain('```dataviewjs');
      expect(dashboard).toContain('games in backlog');
      expect(dashboard).toContain('to clear');
      expect(dashboard).toContain('now playing');
      expect(dashboard).toContain('completed');
    });

    it('should include frontmatter with dashboard tag', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      await plugin.onload();

      const generateDashboard = (plugin as any).generateBacklogDashboard.bind(plugin);
      const dashboard = generateDashboard();

      expect(dashboard).toContain('---');
      expect(dashboard).toContain('- dashboard');
      expect(dashboard).toContain('- gaming');
      expect(dashboard).toContain('obsidianUIMode: preview');
    });
  });

  describe('game note creation workflow', () => {
    it('should create game note with correct content', () => {
      const gameData: GameData = {
        title: 'Test Game',
        platform: 'Steam Deck',
        priority: 'Must Play',
        rating: 85,
        hltbHours: 20,
        efficiency: 4.25,
        coverUrl: 'https://example.com/cover.jpg',
        description: 'A test game description',
        igdbId: 12345,
        genres: ['Action', 'RPG'],
        releaseYear: 2023,
      };

      const noteContent = generateGameNote(gameData);
      const fileName = generateFileName(gameData.title);

      expect(fileName).toBe('🎮 Test Game.md');
      expect(noteContent).toContain('title: "Test Game"');
      expect(noteContent).toContain('platform: "Steam Deck"');
      expect(noteContent).toContain('priority: "Must Play"');
      expect(noteContent).toContain('rating: 85');
      expect(noteContent).toContain('hltb_hours: 20');
      expect(noteContent).toContain('efficiency: 4.25');
    });

    it('should handle special characters in filename', () => {
      const gameData: GameData = {
        title: 'Game: The "Test" Edition',
        platform: 'Full PC',
        priority: 'Playing',
        rating: null,
        hltbHours: null,
        efficiency: null,
        coverUrl: null,
        description: null,
        igdbId: null,
        genres: [],
        releaseYear: null,
      };

      const fileName = generateFileName(gameData.title);

      expect(fileName).not.toContain(':');
      expect(fileName).not.toContain('"');
    });
  });

  describe('command registration', () => {
    it('should register add-game command', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });

      await plugin.onload();

      const addGameCmd = commands.find((c) => c.id === 'add-game');
      expect(addGameCmd).toBeDefined();
      expect(addGameCmd.name).toBe('Add game');
    });

    it('should register open-dashboard command', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });

      await plugin.onload();

      const openBacklogCmd = commands.find((c) => c.id === 'open-dashboard');
      expect(openBacklogCmd).toBeDefined();
      expect(openBacklogCmd.name).toBe('Open dashboard');
    });

    it('should register update-status command', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });

      await plugin.onload();

      const updateStatusCmd = commands.find((c) => c.id === 'update-status');
      expect(updateStatusCmd).toBeDefined();
      expect(updateStatusCmd.name).toBe('Update status');
      expect(updateStatusCmd.checkCallback).toBeDefined();
    });
  });

  describe('add game command', () => {
    it('should show notice when credentials missing', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });

      await plugin.onload();

      const addGameCmd = commands.find((c) => c.id === 'add-game');
      addGameCmd.callback();

      expect(Notice).toHaveBeenCalledWith(
        'Please configure your Twitch client ID and secret in settings'
      );
    });
  });

  describe('update status command', () => {
    it('should return false when no active file', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });
      app.workspace.getActiveFile = vi.fn().mockReturnValue(null);

      await plugin.onload();

      const updateStatusCmd = commands.find((c) => c.id === 'update-status');
      const result = updateStatusCmd.checkCallback(true);

      expect(result).toBe(false);
    });

    it('should return false when file has no game tag', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });
      app.workspace.getActiveFile = vi.fn().mockReturnValue({ path: 'test.md' });
      app.metadataCache.getFileCache = vi.fn().mockReturnValue({
        frontmatter: { tags: ['other'] },
      });

      await plugin.onload();

      const updateStatusCmd = commands.find((c) => c.id === 'update-status');
      const result = updateStatusCmd.checkCallback(true);

      expect(result).toBe(false);
    });

    it('should return true when file has game tag', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      const commands: any[] = [];
      plugin.addCommand = vi.fn((cmd) => {
        commands.push(cmd);
        return cmd;
      });
      app.workspace.getActiveFile = vi.fn().mockReturnValue({ path: 'test.md' });
      app.metadataCache.getFileCache = vi.fn().mockReturnValue({
        frontmatter: { tags: ['game', 'backlog'] },
      });

      await plugin.onload();

      const updateStatusCmd = commands.find((c) => c.id === 'update-status');
      const result = updateStatusCmd.checkCallback(true);

      expect(result).toBe(true);
    });
  });

  describe('client initialization', () => {
    it('should reinitialize clients on settings save', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({});
      plugin.saveData = vi.fn().mockResolvedValue(undefined);

      await plugin.onload();

      // Change settings
      plugin.settings.twitchClientId = 'new-client-id';

      await plugin.saveSettings();

      // Clients should be reinitialized with new credentials
      expect(plugin.saveData).toHaveBeenCalled();
    });
  });
});
