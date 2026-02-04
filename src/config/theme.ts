/**
 * Theme configuration for C4 elements
 * Matches Structurizr C4 model color conventions
 */

import type { C4ElementType } from '../types';

export interface C4ColorScheme {
  background: string;
  border: string;
  text: string;
}

export const C4_COLORS: Record<C4ElementType, C4ColorScheme> = {
  person: {
    background: '#08427b',
    border: '#052e56',
    text: '#ffffff',
  },
  softwareSystem: {
    background: '#1168bd',
    border: '#0b4884',
    text: '#ffffff',
  },
  container: {
    background: '#438dd5',
    border: '#2e6295',
    text: '#ffffff',
  },
  component: {
    background: '#85bbf0',
    border: '#5d82a8',
    text: '#000000',
  },
  group: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '#cccccc',
    text: '#333333',
  },
} as const;

/**
 * Get color scheme for element type
 */
export function getElementColor(type: C4ElementType): C4ColorScheme {
  return C4_COLORS[type];
}

/**
 * Get CSS classes for element styling
 */
export function getElementClasses(
  _type: C4ElementType,
  isSelected: boolean,
  isGroup?: boolean
): string {
  const base = 'c4-node rounded-lg transition-all duration-150 cursor-pointer';
  const selected = isSelected ? 'ring-2 ring-[#ff0072] ring-offset-2' : '';
  const groupClass = isGroup ? 'border-dashed border-3 bg-opacity-10' : '';

  return `${base} ${selected} ${groupClass}`.trim();
}
