// C4 Model Types for Structurizr DSL compatibility

export type C4ElementType =
  | 'person'
  | 'softwareSystem'
  | 'container'
  | 'component'
  | 'group';

export type C4RelationshipType =
  | 'uses'
  | 'interactsWith'
  | 'delivers'
  | 'influences';

export interface C4Element {
  id: string;
  type: C4ElementType;
  name: string;
  description: string;
  technology?: string;
  tags?: string[];
  parentId?: string; // For containers inside systems, components inside containers
  isExternal?: boolean; // Structurizr 'internal' vs 'external'
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
}

export interface C4Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
  technology?: string;
  type: C4RelationshipType;
  tags?: string[];
}

export interface C4View {
  id: string;
  key: string;
  type: 'systemLandscape' | 'systemContext' | 'container' | 'component';
  softwareSystemId?: string; // Root system for context/container/component views
  containerId?: string; // Root container for component views
  name: string;
  description: string;
}

export interface C4Workspace {
  name: string;
  description: string;
  elements: C4Element[];
  relationships: C4Relationship[];
  views: C4View[];
}

// Node types for React Flow
export type C4NodeData = {
  element: C4Element;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

// Element colors based on C4 model conventions
export const C4_COLORS: Record<C4ElementType, { background: string; border: string; text: string }> = {
  person: {
    background: '#08427b',
    border: '#052e56',
    text: '#ffffff'
  },
  softwareSystem: {
    background: '#1168bd',
    border: '#0b4884',
    text: '#ffffff'
  },
  container: {
    background: '#438dd5',
    border: '#2e6295',
    text: '#ffffff'
  },
  component: {
    background: '#85bbf0',
    border: '#5d82a8',
    text: '#000000'
  },
  group: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '#cccccc',
    text: '#333333'
  }
};

// Default sizes for elements
export const C4_DEFAULT_SIZES: Record<C4ElementType, { width: number; height: number }> = {
  person: { width: 160, height: 180 },
  softwareSystem: { width: 200, height: 120 },
  container: { width: 200, height: 120 },
  component: { width: 180, height: 100 },
  group: { width: 400, height: 300 }
};

// Element labels for UI
export const C4_LABELS: Record<C4ElementType, string> = {
  person: 'Person',
  softwareSystem: 'Software System',
  container: 'Container',
  component: 'Component',
  group: 'Group'
};
