import { Notice, Plugin, TFile } from 'obsidian';
import type { App } from 'obsidian';

import { HltbClient } from './src/api/hltb';
import { IgdbClient } from './src/api/igdb';
import { SteamGridDbClient } from './src/api/steamgriddb';
import type { GameBacklogSettings } from './src/settings';
import { GameBacklogSettingTab, DEFAULT_SETTINGS } from './src/settings';
import {
  generateGameNote,
  generateFileName,
  type NoteOptions,
} from './src/templates/gameNote';
import { AddGameModal, type GameData } from './src/ui/AddGameModal';

// Declare global console for ESLint
declare const console: Console;

/**
 * Main plugin class for the Game Backlog Obsidian plugin.
 * Manages game backlog functionality including adding games, updating status, and dashboard generation.
 */
export default class GameBacklogPlugin extends Plugin {
  settings: GameBacklogSettings;
  private igdbClient: IgdbClient;
  private hltbClient: HltbClient;
  private steamGridDbClient: SteamGridDbClient;

  /**
   * Initializes the plugin when loaded by Obsidian.
   * Sets up commands, settings, and API clients.
   */
  async onload() {
    await this.loadSettings();

    // Initialize API clients
    this.initializeClients();

    // Add command to add a game
    this.addCommand({
      id: 'add-game',
      name: 'Add game',
      callback: () => {
        this.openAddGameModal();
      },
    });

    // Add command to open backlog dashboard
    this.addCommand({
      id: 'open-dashboard',
      name: 'Open dashboard',
      callback: async () => {
        await this.openBacklogDashboard();
      },
    });

    // Add command to update game status
    this.addCommand({
      id: 'update-status',
      name: 'Update status',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          const cache = this.app.metadataCache.getFileCache(file);
          const tags = cache?.frontmatter?.tags;
          if (Array.isArray(tags) && tags.includes('game')) {
            if (!checking) {
              void this.updateGameStatus(file.path);
            }
            return true;
          }
        }
        return false;
      },
    });

    // Add settings tab
    this.addSettingTab(new GameBacklogSettingTab(this.app, this));
  }

  /**
   * Initializes API clients with current settings.
   */
  private initializeClients() {
    this.igdbClient = new IgdbClient(
      this.settings.twitchClientId,
      this.settings.twitchClientSecret
    );
    this.hltbClient = new HltbClient();
    this.steamGridDbClient = new SteamGridDbClient(
      this.settings.steamGridDbApiKey
    );
  }

  /**
   * Loads plugin settings from Obsidian's data storage.
   * Performs migration and validation for array settings.
   */
  async loadSettings() {
    const savedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);

    // Ensure arrays exist and have valid values (migration from older versions)
    this.validateArraySetting('platforms', DEFAULT_SETTINGS.platforms);
    this.validateArraySetting('priorities', DEFAULT_SETTINGS.priorities);
    this.validateArraySetting('noteTags', DEFAULT_SETTINGS.noteTags);

    // Ensure defaults exist in their respective lists
    this.validateDefaultInList('defaultPlatform', this.settings.platforms);
    this.validateDefaultInList('defaultPriority', this.settings.priorities);
  }

  /**
   * Validates an array setting, resetting to defaults if empty or invalid.
   * @param key - The settings key to validate
   * @param defaultValue - The default array value to use if invalid
   */
  private validateArraySetting(
    key: 'platforms' | 'priorities' | 'noteTags',
    defaultValue: string[]
  ): void {
    const value = this.settings[key];
    if (!Array.isArray(value) || value.length === 0) {
      this.settings[key] = [...defaultValue];
    }
  }

  /**
   * Validates that a default value exists in its corresponding list.
   * @param defaultKey - The default setting key to validate
   * @param list - The list of valid values
   */
  private validateDefaultInList(
    defaultKey: 'defaultPlatform' | 'defaultPriority',
    list: string[]
  ): void {
    if (list.length > 0 && !list.includes(this.settings[defaultKey])) {
      this.settings[defaultKey] = list[0];
    }
  }

  /**
   * Saves plugin settings to Obsidian's data storage.
   */
  async saveSettings() {
    await this.saveData(this.settings);
    // Reinitialize clients with new API keys
    this.initializeClients();
  }

  /**
   * Opens the Add Game modal for searching and adding games to the backlog.
   */
  private openAddGameModal() {
    if (!this.settings.twitchClientId || !this.settings.twitchClientSecret) {
      new Notice(
        'Please configure your Twitch client ID and secret in settings'
      );
      return;
    }

    const modal = new AddGameModal(
      this.app,
      this.igdbClient,
      this.hltbClient,
      this.steamGridDbClient,
      this.settings,
      (data: GameData) => {
        void this.createGameNote(data);
      }
    );
    modal.open();
  }

  /**
   * Creates a new game note in the vault with the provided game data.
   * @param data - The game data to create a note for
   */
  private async createGameNote(data: GameData) {
    const noteOptions: NoteOptions = {
      enableEfficiency: this.settings.enableEfficiency,
      tags: this.settings.noteTags,
      emojiPrefix: this.settings.noteEmojiPrefix,
    };
    const fileName = generateFileName(data.title, noteOptions.emojiPrefix);
    const content = generateGameNote(data, noteOptions);

    // Check if file already exists
    const existingFile = this.app.vault.getAbstractFileByPath(fileName);
    if (existingFile && existingFile instanceof TFile) {
      new Notice(`A note for "${data.title}" already exists`);
      // Open the existing file
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(existingFile);
      return;
    }

    try {
      const file = await this.app.vault.create(fileName, content);
      new Notice(`Added "${data.title}" to your backlog!`);

      // Open the new note
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    } catch (error) {
      console.error('Failed to create game note:', error);
      new Notice('Failed to create game note. Check console for details.');
    }
  }

  /**
   * Opens or creates the backlog dashboard file.
   */
  private async openBacklogDashboard() {
    const dashboardPath = this.settings.dashboardPath;
    let file = this.app.vault.getAbstractFileByPath(dashboardPath);

    if (!file) {
      // Create the dashboard if it doesn't exist
      const content = this.generateBacklogDashboard();
      file = await this.app.vault.create(dashboardPath, content);
      new Notice('Created video game backlog dashboard');
    }

    const leaf = this.app.workspace.getLeaf(false);
    if (file instanceof TFile) {
      await leaf.openFile(file);
    }
  }

  /**
   * Generates the content for the backlog dashboard file.
   * @returns The markdown content for the dashboard
   */
  private generateBacklogDashboard(): string {
    const { upNextLimit, enableEfficiency } = this.settings;
    const sortField = enableEfficiency ? 'efficiency' : 'rating';
    const upNextTitle = enableEfficiency ? 'Up Next (Best Value)' : 'Up Next';
    const upNextDesc = enableEfficiency
      ? '*Highest rated games you can finish quickly*'
      : '*Highest rated games*';

    // Build Up Next table columns based on efficiency setting
    const upNextColumns = enableEfficiency
      ? `  link(file.link, title) AS "Game",
  rating AS "Rating",
  hltb_hours + "h" AS "Time",
  efficiency AS "Value",
  platform AS "On"`
      : `  link(file.link, title) AS "Game",
  rating AS "Rating",
  hltb_hours + "h" AS "Time",
  platform AS "On"`;

    return `---
tags:
  - dashboard
  - gaming
obsidianUIMode: preview
---

# Video Game Backlog

## At a Glance

\`\`\`dataviewjs
const games = dv.pages('#game');
const backlog = games.where(p => p.priority === "Must Play" || p.priority === "Will Get Around To");
const backlogCount = backlog.length;
const totalHours = Math.round(backlog.array().reduce((sum, p) => sum + (p.hltb_hours || 0), 0));
const completed = games.where(p => p.priority === "Completed").length;
const playing = games.where(p => p.priority === "Playing").length;

dv.paragraph(\`**\${backlogCount}** games in backlog · **\${totalHours}h** to clear · **\${playing}** now playing · **\${completed}** completed\`);
\`\`\`

---

## Now Playing

\`\`\`dataview
LIST WITHOUT ID "**" + title + "** on " + platform + " (" + hltb_hours + "h remaining)"
FROM #game
WHERE priority = "Playing"
\`\`\`

---

## ${upNextTitle}

${upNextDesc}

\`\`\`dataview
TABLE WITHOUT ID
${upNextColumns}
FROM #game
WHERE priority = "Must Play"
SORT ${sortField} DESC
LIMIT ${upNextLimit}
\`\`\`

---

## The Backlog

### Must Play
\`\`\`dataview
LIST WITHOUT ID link(file.link, title) + " — " + rating + "/100, " + hltb_hours + "h (" + platform + ")"
FROM #game
WHERE priority = "Must Play"
SORT ${sortField} DESC
\`\`\`

### Eventually
\`\`\`dataview
LIST WITHOUT ID link(file.link, title) + " — " + hltb_hours + "h (" + platform + ")"
FROM #game
WHERE priority = "Will Get Around To"
SORT ${sortField} DESC
\`\`\`

---

## Completed

\`\`\`dataview
LIST WITHOUT ID link(file.link, title) + " (" + rating + "/100)"
FROM #game
WHERE priority = "Completed"
SORT file.mtime DESC
\`\`\`
`;
  }

  /**
   * Updates the status of a game in the backlog.
   * @param filePath - Path to the game note file
   */
  private async updateGameStatus(filePath: string) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) return;

    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return;

    const initialPriority = typeof cache.frontmatter.priority === 'string' ? cache.frontmatter.priority : 'Must Play';

    // Create a simple modal to select new status
    const { Modal, Setting } = await import('obsidian');

    const priorities = this.settings.priorities;

    /**
     * Callback interface for status updates.
     */
    interface StatusCallback {
      /**
       * Called when the user selects a new status.
       * @param priority - The selected priority value
       */
      (priority: string): void;
    }

    /**
     * Modal for updating game status.
     */
    class StatusModal extends Modal {
      private newPriority: string;
      private priorities: string[];
      private onSubmit: StatusCallback;

      /**
       * Creates a modal for updating game status.
       * @param app - Obsidian app instance
       * @param priority - Initial priority value
       * @param priorities - Available priority options from settings
       * @param onSubmit - Callback when status is updated
       */
      constructor(
        app: App,
        priority: string,
        priorities: string[],
        onSubmit: StatusCallback
      ) {
        super(app);
        this.newPriority = priority;
        this.priorities = priorities;
        this.onSubmit = onSubmit;
      }

      /**
       * Sets up the modal content when opened.
       */
      onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Update game status' });

        new Setting(contentEl).setName('Status').addDropdown((dropdown) => {
          this.priorities.forEach((p) => dropdown.addOption(p, p));
          dropdown.setValue(this.newPriority);
          dropdown.onChange((value) => {
            this.newPriority = value;
          });
        });

        new Setting(contentEl).addButton((btn) => {
          btn
            .setButtonText('Update')
            .setCta()
            .onClick(() => {
              this.onSubmit(this.newPriority);
              this.close();
            });
        });
      }

      /**
       * Cleans up the modal content when closed.
       */
      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    }

    const modal = new StatusModal(this.app, initialPriority, priorities, (priority) => {
      // Update the frontmatter using processFrontMatter for atomic updates
      void this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.priority = priority;
      });
      new Notice(`Updated status to "${priority}"`);
    });
    modal.open();
  }

  /**
   * Cleans up resources when the plugin is unloaded.
   */
  onunload(): void {
    // No cleanup needed - styles are now in styles.css
  }
}
