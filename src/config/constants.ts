/**
 * Application constants and configuration
 */

import type { C4ElementType } from '../types';

// ============================================
// C4 Element Configuration
// ============================================

export const C4_DEFAULT_SIZES = {
  person: { width: 160, height: 180 },
  softwareSystem: { width: 200, height: 120 },
  container: { width: 200, height: 120 },
  component: { width: 180, height: 100 },
  deploymentNode: { width: 240, height: 160 },
  infrastructureNode: { width: 200, height: 120 },
} as const;

export const C4_GROUP_DEFAULT_SIZE = { width: 600, height: 400 } as const;

export const C4_LABELS: Record<C4ElementType, string> = {
  person: 'Person',
  softwareSystem: 'Software System',
  container: 'Container',
  component: 'Component',
  deploymentNode: 'Deployment Node',
  infrastructureNode: 'Infrastructure Node',
  group: 'Group',
} as const;

// ============================================
// Canvas Configuration
// ============================================

export const CANVAS_CONFIG = {
  SNAP_GRID: [15, 15] as [number, number],
  GRID_GAP: 20,
  GRID_SIZE: 1,
  MINI_MAP_ZOOMABLE: true,
  MINI_MAP_PANNABLE: true,
} as const;

// ============================================
// Layout Configuration
// ============================================

export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 220,
  PROPERTIES_WIDTH: 280,
  TOOLBAR_HEIGHT: 56,
  HEADER_PADDING: 16,
  CONTENT_PADDING: 16,
} as const;

// ============================================
// Drag & Drop Configuration
// ============================================

export const DND_CONFIG = {
  DATA_TYPE: 'application/c4-type',
  GROUP_PADDING: { x: 20, y: 50 },
  GROUP_BOTTOM_PADDING: 20,
} as const;

// ============================================
// DSL Parser Layout Configuration
// ============================================

export const DSL_LAYOUT_CONFIG = {
  PADDING: 40,
  ELEMENT_WIDTH: 220,
  ELEMENT_HEIGHT: 140,
  COL_GAP: 60,
  ROW_GAP: 80,
  COLS_PER_ROW: 4,
} as const;

// ============================================
// UI Constants
// ============================================

export const UI_COLORS = {
  PRIMARY: '#4cc9f0',
  SECONDARY: '#f77f00',
  SUCCESS: '#28a745',
  DANGER: '#e94560',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  DARK: '#1a1a2e',
  DARKER: '#16213e',

  // C4 specific colors
  C4_SELECTED: '#ff0072',
  C4_EDGE_DEFAULT: '#555',

  // Backgrounds
  BG_LIGHT: '#f8f9fa',
  BG_DARK: '#1a1a2e',
  BG_MUTED: '#e9ecef',

  // Borders
  BORDER_DEFAULT: '#dee2e6',
  BORDER_DARK: '#ced4da',

  // Text
  TEXT_PRIMARY: '#212529',
  TEXT_SECONDARY: '#6c757d',
  TEXT_MUTED: '#495057',
} as const;

export const FONT_SIZES = {
  XS: '11px',
  SM: '12px',
  BASE: '13px',
  LG: '14px',
  XL: '16px',
} as const;

export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '12px',
  LG: '16px',
  XL: '20px',
  XXL: '24px',
} as const;

// ============================================
// Modal Configuration
// ============================================

export const MODAL_CONFIG = {
  ANIMATION_DURATION: 200,
  Z_INDEX: 1000,
  MAX_WIDTH: {
    SMALL: '400px',
    MEDIUM: '800px',
    LARGE: '1200px',
  },
  MAX_HEIGHT: '95vh',
  WIDTH: '90%',
} as const;

// ============================================
// File Configuration
// ============================================

export const FILE_CONFIG = {
  DSL_EXTENSION: '.dsl',
  TXT_EXTENSIONS: ['.dsl', '.txt'],
  MIME_TYPE: 'text/plain;charset=utf-8',
} as const;

// ============================================
// Element Types
// ============================================

export const ELEMENT_TYPES: C4ElementType[] = [
  'person',
  'softwareSystem',
  'container',
  'component',
  'deploymentNode',
  'infrastructureNode',
] as const;

// ============================================
// Default Workspace
// ============================================

export const DEFAULT_WORKSPACE = {
  name: 'Untitled Workspace',
  description: 'A new C4 model workspace',
} as const;

// ============================================
// Validation Messages
// ============================================

export const VALIDATION_MESSAGES = {
  EMPTY_DSL: 'Please enter DSL code',
  INVALID_DSL: 'Failed to parse DSL',
  FILE_READ_ERROR: 'Failed to read file',
  CONFIRM_CLEAR: 'Are you sure you want to clear the workspace? This cannot be undone.',
} as const;
