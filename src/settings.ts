import { App, PluginSettingTab, Setting } from 'obsidian';

import GameBacklogPlugin from '../main';

export interface GameBacklogSettings {
  twitchClientId: string;
  twitchClientSecret: string;
  steamGridDbApiKey: string;
  defaultPlatform: string;
  defaultPriority: string;
}

export const DEFAULT_SETTINGS: GameBacklogSettings = {
  twitchClientId: '',
  twitchClientSecret: '',
  steamGridDbApiKey: '',
  defaultPlatform: 'Steam Deck',
  defaultPriority: 'Will Get Around To',
};

export const PLATFORMS = [
  'Full PC',
  'Gaming Laptop',
  'Steam Deck',
  'Android Handheld',
] as const;

export const PRIORITIES = [
  'Must Play',
  'Will Get Around To',
  'Playing',
  'Completed',
  'Dropped',
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type Priority = (typeof PRIORITIES)[number];

export class GameBacklogSettingTab extends PluginSettingTab {
  plugin: GameBacklogPlugin;

  constructor(app: App, plugin: GameBacklogPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // API Keys Section
    new Setting(containerEl).setName('API credentials').setHeading();

    new Setting(containerEl)
      .setName('Twitch Client ID')
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
          .setPlaceholder('Enter your Twitch Client ID')
          .setValue(this.plugin.settings.twitchClientId)
          .onChange(async (value) => {
            this.plugin.settings.twitchClientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Twitch Client Secret')
      .setDesc("Your Twitch application's Client Secret")
      .addText((text) => {
        text
          .setPlaceholder('Enter your Twitch Client Secret')
          .setValue(this.plugin.settings.twitchClientSecret)
          .onChange(async (value) => {
            this.plugin.settings.twitchClientSecret = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('SteamGridDB API Key')
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

    // Defaults Section
    new Setting(containerEl).setName('Defaults').setHeading();

    new Setting(containerEl)
      .setName('Default Platform')
      .setDesc('The platform selected by default when adding a new game')
      .addDropdown((dropdown) => {
        PLATFORMS.forEach((platform) => {
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
      .setName('Default Priority')
      .setDesc('The priority selected by default when adding a new game')
      .addDropdown((dropdown) => {
        PRIORITIES.forEach((priority) => {
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
}
