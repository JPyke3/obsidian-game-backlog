import { vi } from 'vitest';

/**
 * Creates a mock style element for testing.
 * @returns Mock style element object
 */
function createMockStyleElement() {
  return {
    id: '',
    textContent: '',
    appendChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    style: {},
    sheet: {
      insertRule: vi.fn(),
    },
  };
}

/**
 * Creates a mock HTML element for testing.
 * @param tag - The HTML tag name
 * @returns Mock element object
 */
function createMockElement(tag: string) {
  return {
    tagName: tag.toUpperCase(),
    id: '',
    textContent: '',
    innerHTML: '',
    appendChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(),
    },
    children: [],
    childNodes: [],
    parentElement: null,
  };
}

// Mock global document object for tests
const mockDocument = {
  getElementById: vi.fn().mockReturnValue(null),
  createElement: vi.fn().mockImplementation((tag: string) => {
    if (tag === 'style') {
      return createMockStyleElement();
    }
    return createMockElement(tag);
  }),
  head: {
    appendChild: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
  },
  querySelectorAll: vi.fn().mockReturnValue([]),
  querySelector: vi.fn().mockReturnValue(null),
};

// Set global document
(globalThis as any).document = mockDocument;
