import { App, PluginSettingTab, Setting } from 'obsidian';

import GameBacklogPlugin from '../main';

export interface GameBacklogSettings {
  // API credentials
  twitchClientId: string;
  twitchClientSecret: string;
  steamGridDbApiKey: string;

  // Defaults for new games
  defaultPlatform: string;
  defaultPriority: string;

  // Configurable lists
  platforms: string[];
  priorities: string[];

  // Efficiency toggle
  enableEfficiency: boolean;

  // Dashboard configuration
  dashboardPath: string;
  upNextLimit: number;

  // Note formatting
  noteTags: string[];
  noteEmojiPrefix: string;
}

/** Default platforms for new installations */
const DEFAULT_PLATFORMS = [
  'Full PC',
  'Gaming Laptop',
  'Steam Deck',
  'Android Handheld',
];

/** Default priorities for new installations */
const DEFAULT_PRIORITIES = [
  'Must Play',
  'Will Get Around To',
  'Playing',
  'Completed',
  'Dropped',
];

export const DEFAULT_SETTINGS: GameBacklogSettings = {
  // API credentials
  twitchClientId: '',
  twitchClientSecret: '',
  steamGridDbApiKey: '',

  // Defaults for new games
  defaultPlatform: 'Steam Deck',
  defaultPriority: 'Will Get Around To',

  // Configurable lists
  platforms: [...DEFAULT_PLATFORMS],
  priorities: [...DEFAULT_PRIORITIES],

  // Efficiency toggle
  enableEfficiency: true,

  // Dashboard configuration
  dashboardPath: 'Video Game Backlog.md',
  upNextLimit: 5,

  // Note formatting
  noteTags: ['game', 'backlog'],
  noteEmojiPrefix: '🎮',
};

/** Platform type - now user-configurable so just a string alias */
export type Platform = string;

/** Priority type - now user-configurable so just a string alias */
export type Priority = string;

/**
 * Callback interface for list updates in settings UI.
 */
interface ListUpdateCallback {
  /**
   * Called when the list is updated.
   * @param newList - The updated list of strings
   * @returns A promise that resolves when the update is complete
   */
  (newList: string[]): Promise<void>;
}

/**
 * Settings tab for the Game Backlog plugin.
 * Provides UI for configuring API keys, lists, and default values.
 */
export class GameBacklogSettingTab extends PluginSettingTab {
  plugin: GameBacklogPlugin;

  /**
   * Creates a new settings tab.
   * @param app - Obsidian app instance
   * @param plugin - Game Backlog plugin instance
   */
  constructor(app: App, plugin: GameBacklogPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Renders the settings UI by delegating to section-specific methods.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderApiCredentials(containerEl);
    this.renderDefaults(containerEl);
    this.renderPlatforms(containerEl);
    this.renderPriorities(containerEl);
    this.renderEfficiency(containerEl);
    this.renderDashboard(containerEl);
    this.renderNoteFormatting(containerEl);
  }

  /**
   * Renders the API credentials section.
   * @param containerEl - Container element to render into
   */
  private renderApiCredentials(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('API credentials').setHeading();

    new Setting(containerEl)
      .setName('Twitch client ID')
      .setDesc(
        createFragment((frag) => {
          frag.appendText('Create an app at ');
          frag.createEl('a', {
            text: 'dev.twitch.tv/console/apps',
            href: 'https://dev.twitch.tv/console/apps',
          });
          frag.appendText(' to get your Client ID (used for IGDB API)');
        })
      )
      .addText((text) =>
        text
          .setPlaceholder('Enter your Twitch client ID')
          .setValue(this.plugin.settings.twitchClientId)
          .onChange(async (value) => {
            this.plugin.settings.twitchClientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Twitch client secret')
      .setDesc("Your Twitch application's client secret")
      .addText((text) => {
        text
          .setPlaceholder('Enter your Twitch client secret')
          .setValue(this.plugin.settings.twitchClientSecret)
          .onChange(async (value) => {
            this.plugin.settings.twitchClientSecret = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('SteamGridDB API key')
      .setDesc(
        createFragment((frag) => {
          frag.appendText('Get your API key from ');
          frag.createEl('a', {
            text: 'steamgriddb.com/profile/preferences/api',
            href: 'https://www.steamgriddb.com/profile/preferences/api',
          });
        })
      )
      .addText((text) =>
        text
          .setPlaceholder('Enter your SteamGridDB API key')
          .setValue(this.plugin.settings.steamGridDbApiKey)
          .onChange(async (value) => {
            this.plugin.settings.steamGridDbApiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * Renders the defaults section for platform and priority dropdowns.
   * @param containerEl - Container element to render into
   */
  private renderDefaults(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Defaults').setHeading();

    new Setting(containerEl)
      .setName('Default platform')
      .setDesc('The platform selected by default when adding a new game')
      .addDropdown((dropdown) => {
        this.plugin.settings.platforms.forEach((platform) => {
          dropdown.addOption(platform, platform);
        });
        dropdown
          .setValue(this.plugin.settings.defaultPlatform)
          .onChange(async (value) => {
            this.plugin.settings.defaultPlatform = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Default priority')
      .setDesc('The priority selected by default when adding a new game')
      .addDropdown((dropdown) => {
        this.plugin.settings.priorities.forEach((priority) => {
          dropdown.addOption(priority, priority);
        });
        dropdown
          .setValue(this.plugin.settings.defaultPriority)
          .onChange(async (value) => {
            this.plugin.settings.defaultPriority = value;
            await this.plugin.saveSettings();
          });
      });
  }

  /**
   * Renders the platforms configuration section with add/remove UI.
   * @param containerEl - Container element to render into
   */
  private renderPlatforms(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Platforms')
      .setDesc('Configure the platforms available when adding games')
      .setHeading();

    this.renderEditableList(
      containerEl,
      this.plugin.settings.platforms,
      'platform',
      async (newList) => {
        this.plugin.settings.platforms = newList;
        this.validateDefaultInList('defaultPlatform', newList);
        await this.plugin.saveSettings();
      }
    );
  }

  /**
   * Renders the priorities configuration section with add/remove UI.
   * @param containerEl - Container element to render into
   */
  private renderPriorities(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Priorities')
      .setDesc('Configure the priority levels for your backlog')
      .setHeading();

    this.renderEditableList(
      containerEl,
      this.plugin.settings.priorities,
      'priority',
      async (newList) => {
        this.plugin.settings.priorities = newList;
        this.validateDefaultInList('defaultPriority', newList);
        await this.plugin.saveSettings();
      }
    );
  }

  /**
   * Renders the efficiency toggle section.
   * @param containerEl - Container element to render into
   */
  private renderEfficiency(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Efficiency score').setHeading();

    new Setting(containerEl)
      .setName('Enable efficiency calculation')
      .setDesc(
        'Calculate efficiency score (rating / hours) for each game. ' +
          'Used for sorting by best value in the dashboard.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableEfficiency)
          .onChange(async (value) => {
            this.plugin.settings.enableEfficiency = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * Renders the dashboard configuration section.
   * @param containerEl - Container element to render into
   */
  private renderDashboard(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Dashboard').setHeading();

    new Setting(containerEl)
      .setName('Dashboard file path')
      .setDesc('Path where the backlog dashboard will be created')
      .addText((text) =>
        text
          .setPlaceholder('Video Game Backlog.md')
          .setValue(this.plugin.settings.dashboardPath)
          .onChange(async (value) => {
            const path = value.trim() || 'Video Game Backlog.md';
            this.plugin.settings.dashboardPath = path.endsWith('.md')
              ? path
              : `${path}.md`;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Up Next limit')
      .setDesc('Maximum number of games to show in the "Up Next" section')
      .addSlider((slider) =>
        slider
          .setLimits(1, 20, 1)
          .setValue(this.plugin.settings.upNextLimit)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.upNextLimit = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * Renders the note formatting configuration section.
   * @param containerEl - Container element to render into
   */
  private renderNoteFormatting(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Note formatting').setHeading();

    new Setting(containerEl)
      .setName('File emoji prefix')
      .setDesc('Emoji prefix for game note filenames (leave empty to disable)')
      .addText((text) =>
        text
          .setPlaceholder('🎮')
          .setValue(this.plugin.settings.noteEmojiPrefix)
          .onChange(async (value) => {
            this.plugin.settings.noteEmojiPrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Note tags')
      .setDesc('Tags to add to game notes (used for Dataview queries)')
      .setHeading();

    this.renderEditableList(
      containerEl,
      this.plugin.settings.noteTags,
      'tag',
      async (newList) => {
        this.plugin.settings.noteTags = newList;
        await this.plugin.saveSettings();
      }
    );
  }

  /**
   * Renders an editable list with add/remove buttons for each item.
   * @param containerEl - Container element to render into
   * @param items - Array of items to display
   * @param itemName - Singular name for the item type (e.g., 'platform')
   * @param onUpdate - Callback when the list changes
   */
  private renderEditableList(
    containerEl: HTMLElement,
    items: string[],
    itemName: string,
    onUpdate: ListUpdateCallback
  ): void {
    const listContainer = containerEl.createDiv({
      cls: 'game-backlog-list-container',
    });

    items.forEach((item, index) => {
      this.renderListItem(listContainer, items, index, itemName, onUpdate);
    });

    // Add new item button - styled consistently
    const addSetting = new Setting(listContainer);
    addSetting.infoEl.remove(); // Remove the empty name/desc area
    addSetting.addButton((btn) => {
      btn
        .setButtonText(`Add ${itemName}`)
        .setCta()
        .onClick(async () => {
          items.push(`New ${itemName}`);
          await onUpdate(items);
          this.display();
        });
    });
  }

  /**
   * Renders a single item in an editable list with text input and remove button.
   * @param container - Container element to render into
   * @param items - The full array of items
   * @param index - Index of this item in the array
   * @param itemName - Singular name for the item type
   * @param onUpdate - Callback when the list changes
   */
  private renderListItem(
    container: HTMLElement,
    items: string[],
    index: number,
    itemName: string,
    onUpdate: ListUpdateCallback
  ): void {
    const setting = new Setting(container);
    setting.infoEl.remove(); // Remove the name/description area for cleaner list look
    setting.settingEl.addClass('game-backlog-list-item');

    setting
      .addText((text) => {
        text.inputEl.addClass('game-backlog-list-input');
        text.setValue(items[index]).onChange(async (value) => {
          items[index] = value;
          await onUpdate(items);
        });
      })
      .addExtraButton((btn) => {
        btn
          .setIcon('cross')
          .setTooltip(`Remove ${itemName}`)
          .onClick(async () => {
            if (items.length <= 1) {
              return; // Prevent removing last item
            }
            items.splice(index, 1);
            await onUpdate(items);
            this.display();
          });
      });
  }

  /**
   * Validates that the default value exists in the list, resetting if not.
   * @param settingKey - The setting key to validate ('defaultPlatform' or 'defaultPriority')
   * @param list - The list of valid values
   */
  private validateDefaultInList(
    settingKey: 'defaultPlatform' | 'defaultPriority',
    list: string[]
  ): void {
    if (list.length > 0 && !list.includes(this.plugin.settings[settingKey])) {
      this.plugin.settings[settingKey] = list[0];
    }
  }
}
