import { Notice, Plugin, TFile } from 'obsidian';
import type { App } from 'obsidian';

import { HltbClient } from './src/api/hltb';
import { IgdbClient } from './src/api/igdb';
import { SteamGridDbClient } from './src/api/steamgriddb';
import type { GameBacklogSettings, Platform, Priority } from './src/settings';
import { GameBacklogSettingTab, DEFAULT_SETTINGS } from './src/settings';
import { generateGameNote, generateFileName } from './src/templates/gameNote';
import { AddGameModal, type GameData } from './src/ui/AddGameModal';

// Declare global console for ESLint
declare const console: Console;

export default class GameBacklogPlugin extends Plugin {
  settings: GameBacklogSettings;
  private igdbClient: IgdbClient;
  private hltbClient: HltbClient;
  private steamGridDbClient: SteamGridDbClient;

  async onload() {
    await this.loadSettings();

    // Initialize API clients
    this.initializeClients();

    // Add command to add a game
    this.addCommand({
      id: 'add-game-to-backlog',
      name: 'Add game to backlog',
      callback: () => {
        this.openAddGameModal();
      },
    });

    // Add command to open backlog dashboard
    this.addCommand({
      id: 'open-game-backlog',
      name: 'Open game backlog dashboard',
      callback: async () => {
        await this.openBacklogDashboard();
      },
    });

    // Add command to update game status
    this.addCommand({
      id: 'update-game-status',
      name: 'Update current game status',
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Reinitialize clients with new API keys
    this.initializeClients();
  }

  private openAddGameModal() {
    if (!this.settings.twitchClientId || !this.settings.twitchClientSecret) {
      new Notice(
        'Please configure your Twitch Client ID and Secret in the Game Backlog settings'
      );
      return;
    }

    const modal = new AddGameModal(
      this.app,
      this.igdbClient,
      this.hltbClient,
      this.steamGridDbClient,
      this.settings.defaultPlatform as Platform,
      this.settings.defaultPriority as Priority,
      async (data: GameData) => {
        await this.createGameNote(data);
      }
    );
    modal.open();
  }

  private async createGameNote(data: GameData) {
    const fileName = generateFileName(data.title);
    const content = generateGameNote(data);

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

  private async openBacklogDashboard() {
    const dashboardPath = 'Video Game Backlog.md';
    let file = this.app.vault.getAbstractFileByPath(dashboardPath);

    if (!file) {
      // Create the dashboard if it doesn't exist
      const content = this.generateBacklogDashboard();
      file = await this.app.vault.create(dashboardPath, content);
      new Notice('Created Video Game Backlog dashboard');
    }

    const leaf = this.app.workspace.getLeaf(false);
    if (file instanceof TFile) {
      await leaf.openFile(file);
    }
  }

  private generateBacklogDashboard(): string {
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

## Up Next (Best Value)

*Highest rated games you can finish quickly*

\`\`\`dataview
TABLE WITHOUT ID
  link(file.link, title) AS "Game",
  rating AS "Rating",
  hltb_hours + "h" AS "Time",
  efficiency AS "Value",
  platform AS "On"
FROM #game
WHERE priority = "Must Play"
SORT efficiency DESC
LIMIT 5
\`\`\`

---

## The Backlog

### Must Play
\`\`\`dataview
LIST WITHOUT ID link(file.link, title) + " — " + rating + "/100, " + hltb_hours + "h (" + platform + ")"
FROM #game
WHERE priority = "Must Play"
SORT efficiency DESC
\`\`\`

### Eventually
\`\`\`dataview
LIST WITHOUT ID link(file.link, title) + " — " + hltb_hours + "h (" + platform + ")"
FROM #game
WHERE priority = "Will Get Around To"
SORT efficiency DESC
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

  private async updateGameStatus(filePath: string) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) return;

    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return;

    const initialPriority = typeof cache.frontmatter.priority === 'string' ? cache.frontmatter.priority : 'Must Play';

    // Create a simple modal to select new status
    const { Modal, Setting } = await import('obsidian');

    class StatusModal extends Modal {
      private newPriority: string;
      private onSubmit: (priority: string) => void;

      constructor(
        app: App,
        priority: string,
        onSubmit: (priority: string) => void
      ) {
        super(app);
        this.newPriority = priority;
        this.onSubmit = onSubmit;
      }

      onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Update game status' });

        new Setting(contentEl).setName('Status').addDropdown((dropdown) => {
          const priorities = [
            'Must Play',
            'Will Get Around To',
            'Playing',
            'Completed',
            'Dropped',
          ];
          priorities.forEach((p) => dropdown.addOption(p, p));
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

      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    }

    const modal = new StatusModal(this.app, initialPriority, async (priority) => {
      // Update the frontmatter using processFrontMatter for atomic updates
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.priority = priority;
      });
      new Notice(`Updated status to "${priority}"`);
    });
    modal.open();
  }

  onunload(): void {
    // Clean up injected styles
    const styleEl = document.getElementById('game-backlog-modal-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }
}
