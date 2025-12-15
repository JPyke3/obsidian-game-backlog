# Obsidian Game Backlog

[![CI](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/ci.yml/badge.svg)](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/ci.yml)
[![Lint](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/lint.yml/badge.svg)](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/lint.yml)
[![Test](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/test.yml/badge.svg)](https://github.com/JPyke3/obsidian-game-backlog/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JPyke3/obsidian-game-backlog/graph/badge.svg)](https://codecov.io/gh/JPyke3/obsidian-game-backlog)

A video game backlog manager plugin for [Obsidian](https://obsidian.md) with automatic metadata fetching from IGDB, HowLongToBeat, and SteamGridDB.

## About This Project

This is a personal project I vibe coded for myself using [Mistral Vibe](https://github.com/mistralai/mistral-vibe) and [Claude Code](https://claude.ai/claude-code). The goal is simple: have an easy way to add games to my backlog, pick what to play next, and jot down notes about them after the fact.

The methodology is loosely inspired by [this YouTube video](https://www.youtube.com/watch?v=nkgAlnDIPMU) about tackling gaming backlogs. The key insight is the "Value" score: rating ÷ hours to beat. This surfaces short, highly-rated games you can actually finish, rather than endlessly scrolling through a Steam library wondering what to commit to. I am not really one for spreadsheets so I thought I would give it a crack using Obsidian.

## Screenshots

### Add Games to Your Backlog

Search for games, select your platform, and set a priority level.

![Add Game Modal](assets/add-game-modal.png)

### Rich Game Metadata

Each game note includes automatically fetched metadata like ratings, completion times, efficiency scores, genres, and cover art.

![Game Note Properties](assets/game-note-properties.png)

### Dashboard Overview

See your backlog at a glance with stats, what you're currently playing, and recommendations for what to play next based on value (rating vs time to complete).

![Dashboard View](assets/dashboard-view.png)

## Features

- **Game Search**: Search and add games to your backlog using the IGDB database
- **Automatic Metadata**: Fetches ratings, completion times, cover art, and more
- **Value Score**: Calculates rating ÷ HLTB hours, surfacing short, highly-rated games. A 90-rated 10-hour game (9.0) beats an 85-rated 40-hour game (2.1)
- **Dataview Dashboard**: Auto-generated dashboard with games organized by priority and platform
- **Status Tracking**: Track games as "Must Play", "Playing", "Completed", or "Dropped"

## Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "Game Backlog"
4. Install the plugin and enable it

## Required Plugins

This plugin requires the following Obsidian community plugins to be installed and enabled:

- **[Dataview](https://github.com/blacksmithgu/obsidian-dataview)** - Used to power the dynamic dashboard and game queries

The dashboard features will not work without Dataview installed.

## Configuration

The plugin requires API credentials to fetch game data:

### Twitch/IGDB API (Required)

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Copy your Client ID and Client Secret to the plugin settings

### SteamGridDB API (Optional)

1. Go to [steamgriddb.com/profile/preferences/api](https://www.steamgriddb.com/profile/preferences/api)
2. Generate an API key
3. Copy it to the plugin settings

## Usage

### Adding Games

1. Open the command palette (Ctrl/Cmd + P)
2. Run "Add game to backlog"
3. Search for a game and select it
4. Choose your platform and priority
5. Click "Add Game"

### Viewing Your Backlog

1. Open the command palette
2. Run "Open game backlog dashboard"

**Note**: The dashboard requires the Dataview plugin to be installed and enabled for proper functionality.

### Updating Game Status

1. Open a game note
2. Open the command palette
3. Run "Update current game status"

## Troubleshooting

### API Issues

If you encounter API-related errors:

1. **IGDB/Twitch API**:
   - Ensure your Client ID and Client Secret are correct
   - Check that your Twitch application is approved
   - Verify you haven't exceeded API rate limits

2. **SteamGridDB API**:
   - Ensure your API key is valid
   - Check that you haven't exceeded the free tier limits

3. **General API Issues**:
   - Check your internet connection
   - Try restarting Obsidian
   - Verify the plugin has the latest version

### Dashboard Not Working

If the dashboard doesn't display properly:

1. Ensure Dataview plugin is installed and enabled
2. Check that you have at least one game in your backlog
3. Verify the dashboard note exists in your vault
4. Try running "Open game backlog dashboard" again

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Bug Reports**: Open an issue with detailed reproduction steps
2. **Feature Requests**: Open an issue describing the desired functionality
3. **Pull Requests**:
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Submit a pull request with clear description

## Support

For support, please:

1. Check the [GitHub Issues](https://github.com/jacobpyke/obsidian-game-backlog/issues) for known problems
2. Open a new issue if you encounter a bug
3. Include as much detail as possible (screenshots, error messages, steps to reproduce)

## Game Note Structure

Each game creates a markdown note with:

- YAML frontmatter with metadata (rating, hours, efficiency, genres, etc.)
- Cover image
- Game summary
- Notes section for your own thoughts

## Development

```bash
# Install dependencies
npm install

# Start development server with watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## License

GPL-3.0 License - See [LICENSE](LICENSE) for details.
