# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-01-14

### Changed

- Updated minimum Obsidian app version from 1.0.0 to 1.10.6
- Changed author URL from GitHub to personal website (pyk.ee)
- Simplified command IDs to follow Obsidian conventions (removed plugin prefix)
- Renamed command names to be shorter since plugin name is shown separately
- Converted all UI text to sentence case for consistency

### Fixed

- Moved inline modal styles to dedicated `styles.css` file (Obsidian requirement)
- Fixed promise handling in event callbacks to prevent void return warnings
- Replaced direct style manipulation with CSS classes for better theming support
- Removed unnecessary async keyword from synchronous method

## [1.0.1] - 2025-12-15

### Fixed

- Removed non-existent `styles.css` from release workflow to fix build failures

## [1.0.0] - 2025-12-15

### Added

- Initial release of Game Backlog plugin
- Game search and addition functionality
- Automatic metadata fetching from IGDB, HLTB, and SteamGridDB
- Value score calculation (rating ÷ hours to beat)
- Dataview-powered dashboard
- Game status tracking (Must Play, Playing, Completed, Dropped)
- Game note generation with rich metadata
- Platform and priority selection
- API settings configuration

### Features

- Add games to backlog with comprehensive metadata
- View backlog dashboard with stats and recommendations
- Update game status from command palette
- Automatic cover art fetching
- Game efficiency scoring

### Fixed

- Initial release - no fixes yet

### Changed

- Initial release - no changes yet

### Removed

- Initial release - no removals yet
