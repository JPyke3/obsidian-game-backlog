import { describe, it, expect, vi } from 'vitest';

import {
  DEFAULT_SETTINGS,
  type GameBacklogSettings,
  type Platform,
  type Priority,
} from '../../src/settings';

vi.mock('obsidian', () => import('../__mocks__/obsidian'));

describe('settings', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have empty string for twitchClientId', () => {
      expect(DEFAULT_SETTINGS.twitchClientId).toBe('');
    });

    it('should have empty string for twitchClientSecret', () => {
      expect(DEFAULT_SETTINGS.twitchClientSecret).toBe('');
    });

    it('should have empty string for steamGridDbApiKey', () => {
      expect(DEFAULT_SETTINGS.steamGridDbApiKey).toBe('');
    });

    it('should have Steam Deck as default platform', () => {
      expect(DEFAULT_SETTINGS.defaultPlatform).toBe('Steam Deck');
    });

    it('should have Will Get Around To as default priority', () => {
      expect(DEFAULT_SETTINGS.defaultPriority).toBe('Will Get Around To');
    });

    it('should have efficiency enabled by default', () => {
      expect(DEFAULT_SETTINGS.enableEfficiency).toBe(true);
    });

    it('should have correct dashboard path', () => {
      expect(DEFAULT_SETTINGS.dashboardPath).toBe('Video Game Backlog.md');
    });

    it('should have upNextLimit of 5', () => {
      expect(DEFAULT_SETTINGS.upNextLimit).toBe(5);
    });

    it('should have game and backlog as default tags', () => {
      expect(DEFAULT_SETTINGS.noteTags).toEqual(['game', 'backlog']);
    });

    it('should have game emoji as default prefix', () => {
      expect(DEFAULT_SETTINGS.noteEmojiPrefix).toBe('🎮');
    });

    it('should match GameBacklogSettings interface structure', () => {
      const settings: GameBacklogSettings = DEFAULT_SETTINGS;

      expect(settings).toHaveProperty('twitchClientId');
      expect(settings).toHaveProperty('twitchClientSecret');
      expect(settings).toHaveProperty('steamGridDbApiKey');
      expect(settings).toHaveProperty('defaultPlatform');
      expect(settings).toHaveProperty('defaultPriority');
      expect(settings).toHaveProperty('platforms');
      expect(settings).toHaveProperty('priorities');
      expect(settings).toHaveProperty('enableEfficiency');
      expect(settings).toHaveProperty('dashboardPath');
      expect(settings).toHaveProperty('upNextLimit');
      expect(settings).toHaveProperty('noteTags');
      expect(settings).toHaveProperty('noteEmojiPrefix');
    });
  });

  describe('DEFAULT_SETTINGS.platforms', () => {
    it('should contain exactly 4 platforms', () => {
      expect(DEFAULT_SETTINGS.platforms).toHaveLength(4);
    });

    it('should contain Full PC', () => {
      expect(DEFAULT_SETTINGS.platforms).toContain('Full PC');
    });

    it('should contain Gaming Laptop', () => {
      expect(DEFAULT_SETTINGS.platforms).toContain('Gaming Laptop');
    });

    it('should contain Steam Deck', () => {
      expect(DEFAULT_SETTINGS.platforms).toContain('Steam Deck');
    });

    it('should contain Android Handheld', () => {
      expect(DEFAULT_SETTINGS.platforms).toContain('Android Handheld');
    });

    it('should be an array', () => {
      expect(Array.isArray(DEFAULT_SETTINGS.platforms)).toBe(true);
    });

    it('should have default platform as a valid option', () => {
      expect(DEFAULT_SETTINGS.platforms).toContain(DEFAULT_SETTINGS.defaultPlatform);
    });
  });

  describe('DEFAULT_SETTINGS.priorities', () => {
    it('should contain exactly 5 priorities', () => {
      expect(DEFAULT_SETTINGS.priorities).toHaveLength(5);
    });

    it('should contain Must Play', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain('Must Play');
    });

    it('should contain Will Get Around To', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain('Will Get Around To');
    });

    it('should contain Playing', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain('Playing');
    });

    it('should contain Completed', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain('Completed');
    });

    it('should contain Dropped', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain('Dropped');
    });

    it('should be an array', () => {
      expect(Array.isArray(DEFAULT_SETTINGS.priorities)).toBe(true);
    });

    it('should have default priority as a valid option', () => {
      expect(DEFAULT_SETTINGS.priorities).toContain(DEFAULT_SETTINGS.defaultPriority);
    });
  });

  describe('Type compatibility', () => {
    it('should allow Platform type assignment from platforms array', () => {
      const platform: Platform = DEFAULT_SETTINGS.platforms[0];
      expect(DEFAULT_SETTINGS.platforms).toContain(platform);
    });

    it('should allow Priority type assignment from priorities array', () => {
      const priority: Priority = DEFAULT_SETTINGS.priorities[0];
      expect(DEFAULT_SETTINGS.priorities).toContain(priority);
    });
  });
});
