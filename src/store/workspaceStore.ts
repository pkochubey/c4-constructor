import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { C4_GROUP_DEFAULT_SIZE } from '../config';
import {
  C4Element,
  C4Relationship,
  C4Workspace,
  C4ElementType,
  C4View,
  C4_LABELS
} from '../types';

interface WorkspaceState {
  workspace: C4Workspace;
  workspaceVersion: number;
  currentViewId: string | null;
  selectedElementId: string | null;
  selectedRelationshipId: string | null;
  elementsLocked: boolean;

  // Element actions
  addElement: (type: C4ElementType, position: { x: number; y: number }, parentId?: string) => C4Element;
  renameElement: (id: string, newName: string) => void;
  updateElement: (id: string, updates: Partial<C4Element>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;

  // Relationship actions
  addRelationship: (sourceId: string, targetId: string, description?: string) => C4Relationship;
  updateRelationship: (id: string, updates: Partial<C4Relationship>) => void;
  deleteRelationship: (id: string) => void;
  selectRelationship: (id: string | null) => void;

  // View actions
  setCurrentView: (viewId: string | null) => void;
  renameView: (id: string, newName: string) => void;
  addView: (view: Omit<C4View, 'id'>) => C4View;
  updateView: (id: string, updates: Partial<C4View>) => void;
  deleteView: (id: string) => void;

  // Element lock actions
  toggleElementsLock: () => void;

  // Workspace actions
  setWorkspaceName: (name: string) => void;
  setWorkspaceDescription: (description: string) => void;
  clearWorkspace: () => void;
  loadWorkspace: (workspace: C4Workspace) => void;

  // Track positions during re-parse
  previousElementPositions: Map<string, { x: number; y: number }>;
}

const transliterate = (text: string) => {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return text.toLowerCase().split('').map(char => map[char] || char).join('');
};

const slugify = (text: string) => {
  const clean = transliterate(text)
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim();
  
  if (!clean) return '';
  
  return clean
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

const initialWorkspace: C4Workspace = {
  name: 'Untitled Workspace',
  description: 'A new C4 model workspace',
  elements: [],
  relationships: [],
  views: [
    {
      id: 'landscape',
      key: 'landscape',
      type: 'systemLandscape',
      name: 'System Landscape',
      description: 'The system landscape view for the workspace.'
    }
  ]
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: initialWorkspace,
  workspaceVersion: 0,
  currentViewId: 'landscape',
  selectedElementId: null,
  selectedRelationshipId: null,
  elementsLocked: false,
  previousElementPositions: new Map<string, { x: number; y: number }>(),

  addElement: (type: C4ElementType, position: { x: number; y: number }, parentId?: string) => {
    const id = uuidv4();
    const newElement: C4Element = {
      id,
      type,
      name: `New ${C4_LABELS[type]}`,
      description: '',
      position,
      parentId,
      isExternal: false,
      ...(type === 'group' ? { size: { ...C4_GROUP_DEFAULT_SIZE } } : {})
    };

    set((state) => {
      const nextElements = [...state.workspace.elements, newElement];
      const nextViews = [...state.workspace.views];

      // Automatically create a Container View for every new Software System
      if (type === 'softwareSystem') {
        nextViews.push({
          id: uuidv4(),
          key: `view-${id}`,
          type: 'container',
          softwareSystemId: id,
          name: `${newElement.name} - Containers`,
          description: `Container view for ${newElement.name}`
        });
      }

      return {
        workspaceVersion: state.workspaceVersion + 1,
        workspace: {
          ...state.workspace,
          elements: nextElements,
          views: nextViews
        }
      };
    });

    return newElement;
  },

  renameElement: (id: string, newName: string) => {
    set((state) => {
      const element = state.workspace.elements.find(e => e.id === id);
      if (!element) return state;

      const typeLabel = C4_LABELS[element.type].replace(/\s+/g, '');
      const baseId = slugify(newName) + '_' + typeLabel;
      
      let newId = baseId;
      let suffix = 0;
      const otherIds = state.workspace.elements.filter(e => e.id !== id).map(e => e.id);
      
      while (otherIds.includes(newId)) {
        suffix++;
        newId = `${baseId}_${suffix}`;
      }

      const oldId = id;
      
      // Update element itself and children
      const nextElements = state.workspace.elements.map(el => {
        if (el.id === oldId) {
          return { ...el, id: newId, name: newName };
        }
        if (el.parentId === oldId) {
          return { ...el, parentId: newId };
        }
        return el;
      });

      // Update relationships
      const nextRelationships = state.workspace.relationships.map(rel => {
        let updated = { ...rel };
        if (rel.sourceId === oldId) updated.sourceId = newId;
        if (rel.targetId === oldId) updated.targetId = newId;
        return updated;
      });

      // Update views
      const nextViews = state.workspace.views.map(view => {
        let updated = { ...view };
        if (view.softwareSystemId === oldId) updated.softwareSystemId = newId;
        if (view.containerId === oldId) updated.containerId = newId;
        return updated;
      });

      return {
        workspaceVersion: state.workspaceVersion + 1,
        selectedElementId: state.selectedElementId === oldId ? newId : state.selectedElementId,
        workspace: {
          ...state.workspace,
          elements: nextElements,
          relationships: nextRelationships,
          views: nextViews
        }
      };
    });
  },

  updateElement: (id: string, updates: Partial<C4Element>) => {
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        elements: state.workspace.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        )
      }
    }));
  },

  deleteElement: (id: string) => {
    set((state) => {
      const nextElements = state.workspace.elements.filter((el) => el.id !== id);
      const nextRelationships = state.workspace.relationships.filter(
        (rel) => rel.sourceId !== id && rel.targetId !== id
      );
      
      // Filter out views associated with this element
      const viewsToRemove = state.workspace.views.filter(v =>
        v.softwareSystemId === id ||
        v.containerId === id
      );
      const viewIdsToRemove = new Set(viewsToRemove.map(v => v.id));
      const nextViews = state.workspace.views.filter(v => !viewIdsToRemove.has(v.id));

      // Reset current view if it's being deleted
      let nextCurrentViewId = state.currentViewId;
      if (state.currentViewId && viewIdsToRemove.has(state.currentViewId)) {
        nextCurrentViewId = nextViews[0]?.id || 'landscape';
      }

      return {
        workspaceVersion: state.workspaceVersion + 1,
        workspace: {
          ...state.workspace,
          elements: nextElements,
          relationships: nextRelationships,
          views: nextViews
        },
        currentViewId: nextCurrentViewId,
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
      };
    });
  },

  selectElement: (id: string | null) => {
    set({ selectedElementId: id, selectedRelationshipId: null });
  },

  addRelationship: (sourceId: string, targetId: string, description = 'Uses') => {
    const newRelationship: C4Relationship = {
      id: uuidv4(),
      sourceId,
      targetId,
      description,
      type: 'uses'
    };

    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        relationships: [...state.workspace.relationships, newRelationship]
      }
    }));

    return newRelationship;
  },

  updateRelationship: (id: string, updates: Partial<C4Relationship>) => {
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        relationships: state.workspace.relationships.map((rel) =>
          rel.id === id ? { ...rel, ...updates } : rel
        )
      }
    }));
  },

  deleteRelationship: (id: string) => {
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        relationships: state.workspace.relationships.filter((rel) => rel.id !== id)
      },
      selectedRelationshipId: state.selectedRelationshipId === id ? null : state.selectedRelationshipId
    }));
  },

  selectRelationship: (id: string | null) => {
    set({ selectedRelationshipId: id, selectedElementId: null });
  },

  setCurrentView: (viewId: string | null) => {
    set({ currentViewId: viewId });
  },

  renameView: (id: string, newName: string) => {
    set((state) => {
      const view = state.workspace.views.find(v => v.id === id);
      if (!view) return state;
      if (view.id === 'landscape' && id === 'landscape') {
        // Landscape name can change but ID stays landscape for root
        return {
          workspaceVersion: state.workspaceVersion + 1,
          workspace: {
            ...state.workspace,
            views: state.workspace.views.map(v => v.id === id ? { ...v, name: newName } : v)
          }
        };
      }

      const baseKey = slugify(newName) || 'view';
      let newId = baseKey;
      let suffix = 0;
      const otherIds = state.workspace.views.filter(v => v.id !== id).map(v => v.id);
      
      while (otherIds.includes(newId)) {
        suffix++;
        newId = `${baseKey}_${suffix}`;
      }

      const oldId = id;
      return {
        workspaceVersion: state.workspaceVersion + 1,
        currentViewId: state.currentViewId === oldId ? newId : state.currentViewId,
        workspace: {
          ...state.workspace,
          views: state.workspace.views.map(v => 
            v.id === oldId ? { ...v, id: newId, name: newName, key: newId } : v
          )
        }
      };
    });
  },

  addView: (view: Omit<C4View, 'id'>) => {
    const newView: C4View = { ...view, id: uuidv4() };
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        views: [...state.workspace.views, newView]
      }
    }));
    return newView;
  },

  updateView: (id: string, updates: Partial<C4View>) => {
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        views: state.workspace.views.map((v) => (v.id === id ? { ...v, ...updates } : v))
      }
    }));
  },

  deleteView: (id: string) => {
    set((state) => ({
      workspaceVersion: state.workspaceVersion + 1,
      workspace: {
        ...state.workspace,
        views: state.workspace.views.filter((v) => v.id !== id)
      },
      currentViewId: state.currentViewId === id ? (state.workspace.views[0]?.id || null) : state.currentViewId
    }));
  },

  toggleElementsLock: () => {
    set((state) => ({
      elementsLocked: !state.elementsLocked
    }));
  },

  setWorkspaceName: (name: string) => {
    set((state) => ({
      workspace: { ...state.workspace, name }
    }));
  },

  setWorkspaceDescription: (description: string) => {
    set((state) => ({
      workspace: { ...state.workspace, description }
    }));
  },

  clearWorkspace: () => {
    set({
      workspace: initialWorkspace,
      currentViewId: 'landscape',
      selectedElementId: null,
      selectedRelationshipId: null
    });
  },

  loadWorkspace: (workspace: C4Workspace) => {
    // Ensure it has at least one view
    const workspaceToLoad = {
      ...workspace,
      views: workspace.views && workspace.views.length > 0 ? workspace.views : initialWorkspace.views
    };

    set((state) => ({
      workspace: workspaceToLoad,
      workspaceVersion: state.workspaceVersion + 1,
      currentViewId: workspaceToLoad.views[0]?.id || null,
      selectedElementId: null,
      selectedRelationshipId: null
    }));
  }
}));
