# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start dev server with watch mode (esbuild)
npm run build    # Type-check and build for production
```

The build outputs `main.js` to the project root. For testing in Obsidian, symlink or copy the project folder to your vault's `.obsidian/plugins/game-backlog/` directory.

## Architecture

This is an Obsidian plugin that helps users manage their video game backlog. It integrates with three external APIs to fetch game metadata:

### API Clients (`src/api/`)

- **IGDB** (`igdb.ts`): Primary game database. Uses Twitch OAuth for authentication. Provides game metadata, ratings, genres, release dates, and cover images.
- **HowLongToBeat** (`hltb.ts`): Fetches completion time estimates. Uses web scraping with auth token discovery from the HLTB website.
- **SteamGridDB** (`steamgriddb.ts`): Fetches high-quality game artwork (grids, heroes, logos).

### Core Flow

1. User opens "Add Game" modal via command palette
2. `AddGameModal` (`src/ui/AddGameModal.ts`) searches IGDB as user types
3. On game selection, fetches HLTB time estimates and SteamGridDB artwork
4. Calculates "efficiency" score: `rating / hltb_hours`
5. `generateGameNote()` (`src/templates/gameNote.ts`) creates markdown note with YAML frontmatter
6. Notes are tagged with `#game` and `#backlog` for Dataview queries

### Settings (`src/settings.ts`)

Stores API credentials (Twitch Client ID/Secret, SteamGridDB API Key) and default values for platform/priority dropdowns.

### Generated Dashboard

The plugin creates a Dataview-powered dashboard at `Video Game Backlog.md` that displays games organized by priority and platform, sorted by efficiency score.

## Frontmatter Schema

Game notes use this frontmatter structure:

```yaml
title: 'Game Name'
platform: 'Steam Deck' # Full PC | Gaming Laptop | Steam Deck | Android Handheld
priority: 'Must Play' # Must Play | Will Get Around To | Playing | Completed | Dropped
rating: 85 # IGDB aggregated_rating (critic score, 0-100)
hltb_hours: 12.5 # Main story completion time
efficiency: 6.8 # rating / hltb_hours
cover: 'https://...'
igdb_id: 12345
release_year: 2023
genres: ['RPG', 'Action']
added: '2024-01-15'
tags: [game, backlog]
```

## Obsidian Plugin Submission Requirements

When modifying this plugin, ensure all changes comply with Obsidian's official plugin submission guidelines. The plugin must pass review before being listed in the community plugin directory.

### Core Principles

1. **No Duplicate Functionality**: Don't recreate features that already exist in other established plugins unless you offer significant improvements
2. **Lasting Benefits**: The plugin must provide ongoing value, not just one-time setup utilities
3. **Desktop-Only Features**: If a feature only works on desktop, clearly document this limitation
4. **No Safe Mode Bypass**: Never create functionality that circumvents Obsidian's safe mode protections

### Security Requirements (Critical)

These are **strictly enforced** and will cause rejection:

- **No dynamic code execution**: Never use eval or construct functions from strings
- **No remote code loading**: Don't fetch and execute JavaScript from external sources
- **No arbitrary file system access on mobile**: Use Obsidian's Vault API, not direct `fs` access
- **No obfuscated code**: All source code must be readable and auditable
- **No hardcoded secrets**: API keys must be user-configurable in settings, never embedded in source
- **Sanitize all user inputs**: Prevent XSS, command injection, and path traversal attacks
- **Use Obsidian's `requestUrl()`**: For all network requests instead of `fetch()` directly

### Code Quality Standards

```typescript
// ✅ CORRECT: Use Obsidian's request API
import { requestUrl } from 'obsidian';
const response = await requestUrl({ url: 'https://api.example.com/data' });

// ❌ WRONG: Direct fetch bypasses Obsidian's security layer
const response = await fetch('https://api.example.com/data');
```

```typescript
// ✅ CORRECT: Async/await with proper error handling
async function loadData(): Promise<Data | null> {
  try {
    const result = await this.apiClient.fetch();
    return result;
  } catch (error) {
    console.error('Failed to load data:', error);
    new Notice('Failed to load data. Check your API credentials.');
    return null;
  }
}

// ❌ WRONG: Unhandled promises or callback hell
function loadData() {
  this.apiClient.fetch().then((result) => {
    // ...
  });
}
```

### API & Network Requirements

1. **API keys must be user-provided**: The plugin requires Twitch/IGDB credentials configured in settings - this is compliant
2. **Graceful degradation**: If an optional API (SteamGridDB) fails, the plugin should still function
3. **Rate limiting**: Respect API rate limits and implement appropriate backoff
4. **Caching**: Cache API responses where appropriate to reduce unnecessary requests
5. **Timeout handling**: All network requests must have reasonable timeouts

### Performance Requirements

- **No blocking the main thread**: All I/O operations must be async
- **Efficient DOM updates**: Minimize reflows and repaints in modals/views
- **Clean up on unload**: Remove all event listeners, intervals, and observers in `onunload()`
- **Lazy loading**: Don't load heavy resources until needed

### Privacy & User Consent

- **Transparent data usage**: Users must know what data is sent to external APIs
- **No analytics/telemetry**: Unless explicitly disclosed and user-consented
- **Local-first**: Store user data in the vault, not on external servers
- **API credentials security**: Never log or expose API credentials

### Mobile Compatibility

This plugin should work on mobile where possible:

- Use `Platform.isMobile` to detect mobile environment
- Use Obsidian's Vault API for all file operations (not Node.js `fs`)
- Test touch interactions in modals
- Consider smaller screen sizes in UI design

### UI/UX Guidelines

- **Follow Obsidian conventions**: Use standard modal patterns, settings tabs, and notices
- **Accessible**: Support keyboard navigation and screen readers
- **Responsive**: UI should work at various window sizes
- **Non-intrusive**: Don't show modals/notices unless user-initiated or critical

### Testing Requirements

Before submitting updates:

1. Run `npm run build` - must complete without errors
2. Run `npm test` - all tests must pass
3. Run `npm run lint` - no linting errors
4. Test manually in Obsidian on desktop
5. Test on mobile if making UI changes
6. Verify API error states are handled gracefully

### Changelog Maintenance

When making changes to the codebase, **always update `CHANGELOG.md`** to document your work:

1. **Add entries to the `[Unreleased]` section** at the top of the changelog
2. **Use the appropriate category** for each change:
   - `Added` - New features or functionality
   - `Changed` - Changes to existing functionality
   - `Deprecated` - Features that will be removed in future versions
   - `Removed` - Features that have been removed
   - `Fixed` - Bug fixes
   - `Security` - Security-related changes
3. **Write clear, user-facing descriptions** - Explain what changed from the user's perspective, not implementation details
4. **One entry per logical change** - Group related changes, but keep distinct features separate

Example entry:

```markdown
## [Unreleased]

### Added

- Support for custom cover image URLs in game notes

### Fixed

- Resolved issue where HLTB search failed for games with special characters
```

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and [Semantic Versioning](https://semver.org/).

### Manifest & Release Requirements

The `manifest.json` must include:

- Valid semver version
- Accurate `minAppVersion` (currently requires Obsidian 0.15.0+)
- Correct `author` and `authorUrl`
- Clear `description`

### What Will Cause Rejection

- Dynamic code execution (eval, constructing functions from strings)
- Loading remote JavaScript
- Obfuscated or minified source in the repository
- Missing error handling for network requests
- Hardcoded API keys or secrets
- Breaking existing user data without migration path
- Excessive permissions or file system access outside the vault
- Cryptocurrency mining, ads, or tracking
