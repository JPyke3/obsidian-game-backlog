import { vi } from 'vitest';

// Mock requestUrl for HTTP requests
// Returns a mock function that can be configured in tests
export const requestUrl = vi.fn().mockImplementation((options) => {
  // Default implementation returns empty response
  // Tests should override with mockResolvedValueOnce
  return Promise.resolve({
    json: {},
    text: '',
    arrayBuffer: new ArrayBuffer(0),
    status: 200,
    headers: {},
  });
});

// Mock Notice for notifications - using vi.fn() so we can spy on calls
export const Notice = vi.fn().mockImplementation(function (
  this: any,
  message: string,
  timeout?: number
) {
  this.message = message;
  this.timeout = timeout;
});

// Mock Plugin base class
export class Plugin {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  loadData = vi.fn().mockResolvedValue({});
  saveData = vi.fn().mockResolvedValue(undefined);

  addCommand(command: Command): Command {
    return command;
  }

  addSettingTab(tab: PluginSettingTab): void {}

  registerEvent(eventRef: EventRef): void {}
}

// Mock FileManager
export class FileManager {
  processFrontMatter = vi.fn().mockImplementation(
    async (file: TFile, fn: (frontmatter: any) => void) => {
      const frontmatter: any = {};
      fn(frontmatter);
      return Promise.resolve();
    }
  );
}

// Mock App
export class App {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
  fileManager: FileManager;

  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
    this.fileManager = new FileManager();
  }
}

// Mock TFile
export class TFile {
  path: string = '';
  basename: string = '';
  extension: string = '';
  parent: any = null;
  
  constructor() {
    this.path = '';
    this.basename = '';
    this.extension = '';
    this.parent = null;
  }
}

// Mock Vault
export class Vault {
  getAbstractFileByPath = vi.fn();
  create = vi.fn();
  read = vi.fn();
  modify = vi.fn();
}

// Mock Workspace
export class Workspace {
  getActiveFile = vi.fn();
  getLeaf = vi.fn().mockReturnValue({
    openFile: vi.fn(),
  });
}

// Mock MetadataCache
export class MetadataCache {
  getFileCache = vi.fn();
}

// Mock Modal
export class Modal {
  app: App;
  contentEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = createMockElement();
  }

  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

// Mock PluginSettingTab
export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = createMockElement();
  }

  display(): void {}
  hide(): void {}
}

// Mock Setting
export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = createMockElement();
    this.infoEl = createMockElement();
    this.nameEl = createMockElement();
    this.descEl = createMockElement();
    this.controlEl = createMockElement();
  }

  setName(name: string): this {
    return this;
  }

  setDesc(desc: string | DocumentFragment): this {
    return this;
  }

  setHeading(): this {
    return this;
  }

  addText(cb: (text: TextComponent) => void): this {
    cb(new TextComponent(createMockElement()));
    return this;
  }

  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    cb(new DropdownComponent(createMockElement()));
    return this;
  }

  addButton(cb: (button: ButtonComponent) => void): this {
    cb(new ButtonComponent(createMockElement()));
    return this;
  }
}

// Mock TextComponent
export class TextComponent {
  inputEl: HTMLInputElement;
  private value: string = '';
  private onChangeCallback: ((value: string) => void) | null = null;

  constructor(containerEl: HTMLElement) {
    this.inputEl = createMockElement() as unknown as HTMLInputElement;
    this.inputEl.type = 'text';
    this.inputEl.dispatchEvent = vi.fn().mockImplementation((event: Event) => {
      if (event.type === 'input' && this.onChangeCallback) {
        this.onChangeCallback(this.value);
      }
    });
  }

  setPlaceholder(placeholder: string): this {
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(callback: (value: string) => void): this {
    this.onChangeCallback = callback;
    return this;
  }

  trigger(eventType: string, data?: any): void {
    if (eventType === 'input' && data?.target?.value !== undefined) {
      this.value = data.target.value;
      if (this.onChangeCallback) {
        this.onChangeCallback(this.value);
      }
    }
  }
}

// Mock DropdownComponent
export class DropdownComponent {
  selectEl: HTMLSelectElement;
  private value: string = '';
  private onChangeCallback: ((value: string) => void) | null = null;

  constructor(containerEl: HTMLElement) {
    this.selectEl = createMockElement() as unknown as HTMLSelectElement;
    this.selectEl.dispatchEvent = vi.fn();
  }

  addOption(value: string, display: string): this {
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(callback: (value: string) => void): this {
    this.onChangeCallback = callback;
    return this;
  }

  trigger(eventType: string, data?: any): void {
    if (eventType === 'change' && data?.target?.value !== undefined) {
      this.value = data.target.value;
      if (this.onChangeCallback) {
        this.onChangeCallback(this.value);
      }
    }
  }
}

// Mock ButtonComponent
export class ButtonComponent {
  buttonEl: HTMLButtonElement;

  constructor(containerEl: HTMLElement) {
    this.buttonEl = createMockElement() as unknown as HTMLButtonElement;
  }

  setButtonText(text: string): this {
    return this;
  }

  setCta(): this {
    return this;
  }

  onClick(callback: () => void): this {
    return this;
  }
}

// Mock debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Interfaces
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
  authorUrl?: string;
  isDesktopOnly?: boolean;
}

export interface Command {
  id: string;
  name: string;
  callback?: () => void;
  checkCallback?: (checking: boolean) => boolean | void;
}

export interface EventRef {
  id: string;
}

// Helper to create mock HTML elements - use lazy evaluation to avoid stack overflow
function createMockElement(): HTMLElement {
  const el: any = {
    empty: vi.fn(),
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setText: vi.fn(),
    addClass: vi.fn(),
    removeClass: vi.fn(),
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
    },
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([]),
    innerHTML: '',
    textContent: '',
    disabled: false,
    children: [],
  };
  
  // Add DOM-like methods
  el.hasClass = vi.fn().mockImplementation((cls: string) => {
    return el.classList.contains(cls);
  });
  
  el.find = vi.fn().mockImplementation((selector: string) => {
    // Simple mock - return null for most selectors
    if (selector === '.setting-item') {
      return createMockElement();
    }
    return null;
  });
  
  el.findAll = vi.fn().mockImplementation((selector: string) => {
    // Return array of mock elements
    if (selector === '.setting-item') {
      return [createMockElement(), createMockElement(), createMockElement(), createMockElement(), createMockElement()];
    }
    return [];
  });
  
  // Use lazy evaluation to prevent infinite recursion
  el.createEl = vi.fn().mockImplementation(() => createMockElement());
  el.createDiv = vi.fn().mockImplementation(() => createMockElement());
  return el as HTMLElement;
}

// Export createFragment helper
export function createFragment(
  callback?: (frag: DocumentFragment) => void
): DocumentFragment {
  const frag = {
    appendText: vi.fn(),
    createEl: vi.fn().mockReturnValue(createMockElement()),
  } as unknown as DocumentFragment;
  if (callback) callback(frag);
  return frag;
}
