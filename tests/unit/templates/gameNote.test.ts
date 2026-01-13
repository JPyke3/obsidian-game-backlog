import { describe, it, expect } from 'vitest';

import {
  generateGameNote,
  generateFileName,
  type NoteOptions,
} from '../../../src/templates/gameNote';
import type { GameData } from '../../../src/ui/AddGameModal';

/** Default note options for testing */
const defaultOptions: NoteOptions = {
  enableEfficiency: true,
  tags: ['game', 'backlog'],
  emojiPrefix: '🎮',
};

describe('gameNote', () => {
  describe('generateFileName', () => {
    it('should generate filename with emoji prefix', () => {
      const result = generateFileName('The Witcher 3', '🎮');
      expect(result).toBe('🎮 The Witcher 3.md');
    });

    it('should remove invalid filename characters', () => {
      const result = generateFileName('Game: The "Test" Edition', '🎮');
      expect(result).toBe('🎮 Game The Test Edition.md');
    });

    it('should remove all invalid characters', () => {
      const result = generateFileName('Test<>:/\\|?*Game', '🎮');
      expect(result).toBe('🎮 TestGame.md');
    });

    it('should normalize whitespace', () => {
      const result = generateFileName('Game   With    Spaces', '🎮');
      expect(result).toBe('🎮 Game With Spaces.md');
    });

    it('should trim whitespace', () => {
      const result = generateFileName('  Trimmed Title  ', '🎮');
      expect(result).toBe('🎮 Trimmed Title.md');
    });

    it('should handle unicode characters', () => {
      const result = generateFileName('Pokémon Legends: Arceus', '🎮');
      expect(result).toBe('🎮 Pokémon Legends Arceus.md');
    });

    it('should handle empty string title', () => {
      const result = generateFileName('', '🎮');
      expect(result).toBe('🎮 .md');
    });

    it('should handle empty emoji prefix', () => {
      const result = generateFileName('The Witcher 3', '');
      expect(result).toBe('The Witcher 3.md');
    });

    it('should handle custom emoji prefix', () => {
      const result = generateFileName('Zelda', '🗡️');
      expect(result).toBe('🗡️ Zelda.md');
    });
  });

  describe('generateGameNote', () => {
    const completeGameData: GameData = {
      title: 'The Witcher 3: Wild Hunt',
      platform: 'Steam Deck',
      priority: 'Must Play',
      rating: 92,
      hltbHours: 50.5,
      efficiency: 1.82,
      coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
      description: 'An action role-playing game set in an open world environment.',
      igdbId: 1942,
      genres: ['Role-playing (RPG)', 'Adventure'],
      releaseYear: 2015,
    };

    it('should generate complete note with all data', () => {
      const result = generateGameNote(completeGameData, defaultOptions);

      // Check frontmatter
      expect(result).toContain('---');
      expect(result).toContain('title: "The Witcher 3: Wild Hunt"');
      expect(result).toContain('platform: "Steam Deck"');
      expect(result).toContain('priority: "Must Play"');
      expect(result).toContain('rating: 92');
      expect(result).toContain('hltb_hours: 50.5');
      expect(result).toContain('efficiency: 1.82');
      expect(result).toContain('cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg"');
      expect(result).toContain('igdb_id: 1942');
      expect(result).toContain('release_year: 2015');
      expect(result).toContain('genres:');
      expect(result).toContain('  - "Role-playing (RPG)"');
      expect(result).toContain('  - "Adventure"');
      expect(result).toContain('tags:');
      expect(result).toContain('  - game');
      expect(result).toContain('  - backlog');

      // Check body
      expect(result).toContain('![cover](https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg)');
      expect(result).toContain('**Rating:** 92');
      expect(result).toContain('**HLTB:** 50.5h');
      expect(result).toContain('**Efficiency:** 1.82');
      expect(result).toContain('**Platform:** Steam Deck');
      expect(result).toContain('**Year:** 2015');
      expect(result).toContain('## Description');
      expect(result).toContain('An action role-playing game set in an open world environment.');
      expect(result).toContain('## Notes');
    });

    it('should handle minimal data with null values', () => {
      const minimalData: GameData = {
        title: 'Minimal Game',
        platform: 'Full PC',
        priority: 'Will Get Around To',
        rating: null,
        hltbHours: null,
        efficiency: null,
        coverUrl: null,
        description: null,
        igdbId: null,
        genres: [],
        releaseYear: null,
      };

      const result = generateGameNote(minimalData, defaultOptions);

      expect(result).toContain('title: "Minimal Game"');
      expect(result).toContain('platform: "Full PC"');
      expect(result).toContain('priority: "Will Get Around To"');
      expect(result).toContain('rating: null');
      expect(result).toContain('hltb_hours: null');
      expect(result).toContain('efficiency: null');
      expect(result).not.toContain('cover:');
      expect(result).not.toContain('igdb_id:');
      expect(result).not.toContain('release_year:');
      expect(result).not.toContain('genres:');
      expect(result).not.toContain('![cover]');
      expect(result).not.toContain('## Description');
      expect(result).toContain('## Notes');
    });

    it('should escape quotes in title', () => {
      const dataWithQuotes: GameData = {
        title: 'Game "With" Quotes',
        platform: 'Steam Deck',
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

      const result = generateGameNote(dataWithQuotes, defaultOptions);
      expect(result).toContain('title: "Game \\"With\\" Quotes"');
    });

    it('should escape quotes in genre names', () => {
      const dataWithGenreQuotes: GameData = {
        title: 'Test Game',
        platform: 'Full PC',
        priority: 'Must Play',
        rating: 80,
        hltbHours: 10,
        efficiency: 8,
        coverUrl: null,
        description: null,
        igdbId: 12345,
        genres: ['Action "Test"', 'Adventure'],
        releaseYear: 2023,
      };

      const result = generateGameNote(dataWithGenreQuotes, defaultOptions);
      expect(result).toContain('  - "Action \\"Test\\""');
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      const dataWithLongDesc: GameData = {
        title: 'Long Desc Game',
        platform: 'Gaming Laptop',
        priority: 'Completed',
        rating: 75,
        hltbHours: 20,
        efficiency: 3.75,
        coverUrl: null,
        description: longDescription,
        igdbId: 99999,
        genres: ['Action'],
        releaseYear: 2022,
      };

      const result = generateGameNote(dataWithLongDesc, defaultOptions);
      expect(result).toContain('## Description');
      // Should be truncated to 800 chars + "..."
      expect(result).toContain(`${'A'.repeat(800)}...`);
    });

    it('should remove HTML entities from description', () => {
      const dataWithHtmlEntities: GameData = {
        title: 'HTML Entity Game',
        platform: 'Android Handheld',
        priority: 'Dropped',
        rating: 60,
        hltbHours: 5,
        efficiency: 12,
        coverUrl: null,
        description: 'Test &#39; description &#8217; with entities &#65;',
        igdbId: 11111,
        genres: [],
        releaseYear: 2021,
      };

      const result = generateGameNote(dataWithHtmlEntities, defaultOptions);
      expect(result).toContain('Test  description  with entities ');
      expect(result).not.toContain('&#');
    });

    it('should include added date in ISO format', () => {
      const data: GameData = {
        title: 'Date Test',
        platform: 'Steam Deck',
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

      const result = generateGameNote(data, defaultOptions);
      // Check for ISO date format (YYYY-MM-DD)
      expect(result).toMatch(/added: \d{4}-\d{2}-\d{2}/);
    });

    it('should handle rating without hours (no efficiency in body)', () => {
      const data: GameData = {
        title: 'Rating Only',
        platform: 'Full PC',
        priority: 'Must Play',
        rating: 85,
        hltbHours: null,
        efficiency: null,
        coverUrl: null,
        description: null,
        igdbId: null,
        genres: [],
        releaseYear: null,
      };

      const result = generateGameNote(data, defaultOptions);
      expect(result).toContain('**Rating:** 85');
      expect(result).not.toContain('**HLTB:**');
      expect(result).not.toContain('**Efficiency:**');
    });

    it('should handle hours without rating', () => {
      const data: GameData = {
        title: 'Hours Only',
        platform: 'Full PC',
        priority: 'Will Get Around To',
        rating: null,
        hltbHours: 25,
        efficiency: null,
        coverUrl: null,
        description: null,
        igdbId: null,
        genres: [],
        releaseYear: null,
      };

      const result = generateGameNote(data, defaultOptions);
      expect(result).toContain('**HLTB:** 25h');
      expect(result).not.toContain('**Rating:**');
      expect(result).not.toContain('**Efficiency:**');
    });

    it('should handle all priority values', () => {
      const priorities = ['Must Play', 'Will Get Around To', 'Playing', 'Completed', 'Dropped'] as const;

      for (const priority of priorities) {
        const data: GameData = {
          title: `Test ${priority}`,
          platform: 'Steam Deck',
          priority: priority,
          rating: null,
          hltbHours: null,
          efficiency: null,
          coverUrl: null,
          description: null,
          igdbId: null,
          genres: [],
          releaseYear: null,
        };

        const result = generateGameNote(data, defaultOptions);
        expect(result).toContain(`priority: "${priority}"`);
      }
    });

    it('should handle all platform values', () => {
      const platforms = ['Full PC', 'Gaming Laptop', 'Steam Deck', 'Android Handheld'] as const;

      for (const platform of platforms) {
        const data: GameData = {
          title: `Test ${platform}`,
          platform: platform,
          priority: 'Must Play',
          rating: null,
          hltbHours: null,
          efficiency: null,
          coverUrl: null,
          description: null,
          igdbId: null,
          genres: [],
          releaseYear: null,
        };

        const result = generateGameNote(data, defaultOptions);
        expect(result).toContain(`platform: "${platform}"`);
        expect(result).toContain(`**Platform:** ${platform}`);
      }
    });

    describe('with efficiency disabled', () => {
      const noEfficiencyOptions: NoteOptions = {
        enableEfficiency: false,
        tags: ['game', 'backlog'],
        emojiPrefix: '🎮',
      };

      it('should not include efficiency in frontmatter when disabled', () => {
        const result = generateGameNote(completeGameData, noEfficiencyOptions);
        expect(result).not.toContain('efficiency:');
      });

      it('should not include efficiency in body when disabled', () => {
        const result = generateGameNote(completeGameData, noEfficiencyOptions);
        expect(result).not.toContain('**Efficiency:**');
      });
    });

    describe('with custom tags', () => {
      const customTagOptions: NoteOptions = {
        enableEfficiency: true,
        tags: ['videogame', 'library', 'toplay'],
        emojiPrefix: '🎮',
      };

      it('should use custom tags in frontmatter', () => {
        const data: GameData = {
          title: 'Custom Tags Game',
          platform: 'Steam Deck',
          priority: 'Must Play',
          rating: null,
          hltbHours: null,
          efficiency: null,
          coverUrl: null,
          description: null,
          igdbId: null,
          genres: [],
          releaseYear: null,
        };

        const result = generateGameNote(data, customTagOptions);
        expect(result).toContain('  - videogame');
        expect(result).toContain('  - library');
        expect(result).toContain('  - toplay');
        expect(result).not.toContain('  - game');
        expect(result).not.toContain('  - backlog');
      });
    });
  });
});
