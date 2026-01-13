import { GameData } from '../ui/AddGameModal';

/**
 * Options for customizing game note generation.
 */
export interface NoteOptions {
  /** Whether to include efficiency score in the note */
  enableEfficiency: boolean;
  /** Tags to add to the note frontmatter */
  tags: string[];
  /** Emoji prefix for the filename (empty string to disable) */
  emojiPrefix: string;
}

/**
 * Generates a complete game note with frontmatter and body content.
 * @param data - Game data to include in the note
 * @param options - Options for customizing the note output
 * @returns Complete markdown content for the game note
 */
export function generateGameNote(data: GameData, options: NoteOptions): string {
  const frontmatter = generateFrontmatter(data, options);
  const body = generateBody(data, options);
  return `${frontmatter}\n${body}`;
}

/**
 * Generates YAML frontmatter for the game note.
 * @param data - Game data to include in frontmatter
 * @param options - Options for customizing the frontmatter output
 * @returns YAML frontmatter string
 */
function generateFrontmatter(data: GameData, options: NoteOptions): string {
  const lines: string[] = ['---'];

  lines.push(`title: "${escapeYaml(data.title)}"`);
  lines.push(`platform: "${data.platform}"`);
  lines.push(`priority: "${data.priority}"`);

  if (data.rating !== null) {
    lines.push(`rating: ${data.rating}`);
  } else {
    lines.push('rating: null');
  }

  if (data.hltbHours !== null) {
    lines.push(`hltb_hours: ${data.hltbHours}`);
  } else {
    lines.push('hltb_hours: null');
  }

  // Only include efficiency if enabled
  if (options.enableEfficiency) {
    if (data.efficiency !== null) {
      lines.push(`efficiency: ${data.efficiency}`);
    } else {
      lines.push('efficiency: null');
    }
  }

  if (data.coverUrl) {
    lines.push(`cover: "${data.coverUrl}"`);
  }

  if (data.igdbId) {
    lines.push(`igdb_id: ${data.igdbId}`);
  }

  if (data.releaseYear) {
    lines.push(`release_year: ${data.releaseYear}`);
  }

  if (data.genres.length > 0) {
    lines.push('genres:');
    data.genres.forEach((genre) => {
      lines.push(`  - "${escapeYaml(genre)}"`);
    });
  }

  lines.push(`added: ${new Date().toISOString().split('T')[0]}`);

  // Add user-configured tags
  lines.push('tags:');
  options.tags.forEach((tag) => {
    lines.push(`  - ${tag}`);
  });

  lines.push('---');

  return lines.join('\n');
}

/**
 * Generates the markdown body content for the game note.
 * @param data - Game data to include in the body
 * @param options - Options for customizing the body output
 * @returns Markdown body content
 */
function generateBody(data: GameData, options: NoteOptions): string {
  const sections: string[] = [];

  // Cover image
  if (data.coverUrl) {
    sections.push(`![cover](${data.coverUrl})`);
    sections.push('');
  }

  // Game info summary
  const infoParts: string[] = [];
  if (data.rating !== null) {
    infoParts.push(`**Rating:** ${data.rating}`);
  }
  if (data.hltbHours !== null) {
    infoParts.push(`**HLTB:** ${data.hltbHours}h`);
  }
  // Only include efficiency if enabled
  if (options.enableEfficiency && data.efficiency !== null) {
    infoParts.push(`**Efficiency:** ${data.efficiency}`);
  }
  infoParts.push(`**Platform:** ${data.platform}`);
  if (data.releaseYear) {
    infoParts.push(`**Year:** ${data.releaseYear}`);
  }

  if (infoParts.length > 0) {
    sections.push(infoParts.join(' | '));
    sections.push('');
  }

  // Description
  if (data.description) {
    sections.push('## Description');
    sections.push('');
    // Truncate description if too long and clean it up
    let desc = data.description;
    // Remove HTML entities
    desc = desc.replace(/&#\d+;/g, '');
    // Limit to first 800 chars if very long
    if (desc.length > 800) {
      desc = `${desc.substring(0, 800).trim()}...`;
    }
    sections.push(desc);
    sections.push('');
  }

  // Notes section for user
  sections.push('## Notes');
  sections.push('');
  sections.push('');

  return sections.join('\n');
}

/**
 * Escapes special characters in a string for YAML compatibility.
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}

/**
 * Generates a safe filename for the game note.
 * @param title - Game title
 * @param emojiPrefix - Emoji prefix for the filename (empty string to disable)
 * @returns Safe filename with optional emoji prefix
 */
export function generateFileName(title: string, emojiPrefix: string): string {
  // Sanitize the title for use as a filename
  const sanitized = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Add emoji prefix with space if provided, otherwise just use the title
  const prefix = emojiPrefix ? `${emojiPrefix} ` : '';
  return `${prefix}${sanitized}.md`;
}
