# C4 Constructor - AI Agent Guide

This guide helps AI agents understand the project architecture, patterns, and conventions for consistent development.

## Project Overview

**C4 Constructor** is a visual diagram editor for C4 architecture models with Structurizr DSL import/export. Built with React, TypeScript, ReactFlow, and Zustand.

**Tech Stack:**

- React 18 + TypeScript
- ReactFlow (canvas/graph rendering)
- Zustand (state management)
- Tailwind CSS v4 (styling)
- i18next (internationalization with auto-detection and cookie persistence)
- Vite (build tool)
- Docker (deployment with multi-stage build & Nginx)
- Versioning (via root `version` file)

## Project Structure

```
src/
├── components/           # React components
│   ├── canvas/          # ReactFlow canvas (diagram editor)
│   ├── nodes/           # Custom ReactFlow node types
│   ├── modals/          # Modal dialogs (DSL editor, import, help)
│   ├── properties/      # Right panel for editing selected element
│   ├── sidebar/         # Left panel with draggable element palette
│   ├── toolbar/         # Top bar (view selector, actions)
│   └── ui/              # Reusable UI components (Button, Input, etc.)
├── config/              # Constants and configuration
├── services/            # Clipboard, file, storage services
├── store/               # Zustand state store
├── types/               # TypeScript types/interfaces
├── utils/               # Helper functions (DSL parse/generate, validation)
├── i18n.ts              # Translation setup & language detection
├── main.tsx             # Entry point
└── version              # App version (synced with release tagging)
```

## Core Architecture

### State Management (Zustand)

**Single store pattern** - `workspaceStore.ts` manages everything:

```typescript
interface WorkspaceState {
  workspace: C4Workspace; // Elements, relationships, views
  workspaceVersion: number; // Increment on structural changes
  currentViewId: string | null; // Active view
  selectedElementId: string | null; // Currently selected element
  selectedRelationshipId: string | null;
  elementsLocked: boolean; // Lock toggle (prevents edits)

  // CRUD operations
  addElement;
  updateElement;
  deleteElement;
  renameElement;
  addRelationship;
  updateRelationship;
  deleteRelationship;
  addView;
  updateView;
  deleteView;
  setCurrentView;
  selectElement;
  selectRelationship;
}
```

**Key patterns:**

- Always increment `workspaceVersion` when modifying workspace structure
- Use `renameElement()` instead of `updateElement()` for name changes (handles ID regeneration)
- The store auto-creates views when adding Software Systems

### C4 Element Types

```typescript
type C4ElementType =
  | "person" // External users
  | "softwareSystem" // Software systems
  | "container" // Containers (apps, databases, services)
  | "component" // Components inside containers
  | "group"; // Visual grouping only
```

### View Hierarchy System

Views control **what elements are visible** and **how they relate**:

| View Type         | Shows                                   | Focus                   |
| ----------------- | --------------------------------------- | ----------------------- |
| `systemLandscape` | Top-level elements (no parentId)        | All persons and systems |
| `systemContext`   | Elements related to one Software System | `softwareSystemId`      |
| `container`       | Containers of one System + related      | `softwareSystemId`      |
| `component`       | Components of one Container + related   | `containerId`           |

**View filtering logic** (in `Canvas.tsx`):

- Each view type filters `workspace.elements` differently
- Relationships are "lifted" to visible representatives
- Focus zone elements are hidden (the frame is removed)

### Parent-Child Relationships

**Valid parent-child combinations:**

- Software System → Container, Person, Group
- Container → Component
- Group → Any element (visual grouping only)

- Manual parenting is preferred. Automatic "falling inside" an element during drop is disabled.
- Users select the parent element in the **Properties Panel**.
- Valid parent-child relationships apply (e.g., softwareSystem -> container).
- Selection logic in `PropertiesPanel` filters potential parents to prevent circular references.

**Position handling:**

- Child positions are **relative to parent** in store.
- Canvas converts to absolute for display (using `parentId` hierarchy).
- Position preservation during DSL re-import uses `previousElementPositions` map to keep user-defined layouts.

## Component Patterns

### Canvas (ReactFlow Integration)

**File:** `components/canvas/Canvas.tsx`

Key responsibilities:

- Converts `workspace.elements` to ReactFlow nodes
- Filters visible elements based on current view
- Handles drag-drop, selection, position updates
- Manages lock state

**Important patterns:**

1. **`structureKey`** - memoized key that triggers node refresh when structure changes
2. **`useNodesState`** - manages ReactFlow's internal node state
3. **Separate useEffects** - one for structure sync, one for selection, one for draggable state
4. **`onNodesChange`** - handles position updates, parenting changes, calls `updateElement`

### Custom Node Types

**Files:** `components/nodes/*.tsx`

Each C4 element type has its own node component with:

- Consistent `C4NodeData` interface
- Edit/delete handlers on hover
- Visual styling based on element properties
- External indicator (dashed border) when `isExternal: true`

### Sidebar (Element Palette)

**File:** `components/sidebar/Sidebar.tsx`

**Smart filtering** - shows only elements allowed in current view:

```typescript
const allowedTypes = {
  systemLandscape: ["person", "softwareSystem", "group"],
  systemContext: ["person", "softwareSystem", "group"],
  container: ["container", "person", "group"],
  component: ["component", "person", "group"],
}[currentView.type];
```

### Internationalization (i18n)

**File:** `src/i18n.ts`

- Supports **English (en)** and **Russian (ru)**.
- Uses `i18next-browser-languagedetector` to set default language from browser settings.
- Persists language choice in **Cookies** and **LocalStorage**.
- A language switcher is integrated into the `Toolbar` component.
- All UI strings, including labels and help descriptions, are localized.

### Properties Panel

**File:** `components/properties/PropertiesPanel.tsx`

**Critical pattern** - use `key={selectedElement.id}` to force remount on selection change:

```tsx
{
  selectedElement && (
    <div key={selectedElement.id} className="flex flex-col gap-5">
      <Input
        value={name}
        onChange={(e) => {
          const currentElement = getSelectedElement();
          if (currentElement)
            updateElement(currentElement.id, { name: e.target.value });
        }}
      />
    </div>
  );
}
```

**Why:** Prevents stale closure bugs where properties transfer between elements when clicking.

## DSL Import/Export

### Parser (`utils/dslParser.ts`)

Converts Structurizr DSL → C4Workspace.

**Key features:**

- Parses workspace, models, relationships, views
- Generates automatic positions via `getDefaultPosition()`
- Resolves element references using `identifierMap`
- Handles nested element syntax (`system.container.component`)
- Preserves positions from DSL comments (`# element id x y`)

**Position parsing:**

```typescript
// DSL comment format: # element NewComponent_f5bf 795 135
// Stored under both short and full identifiers for lookup
```

### Generator (`utils/dslGenerator.ts`)

Converts C4Workspace → Structurizr DSL.

**Features:**

- Generates valid Structurizr DSL syntax
- Creates hierarchical element definitions
- Generates all views (landscape, context, container, component)
- Includes position comments for round-trip compatibility

## Styling Conventions

### Tailwind CSS

**Usage patterns:**

- Utility-first approach
- Responsive variants (`sm:`, `md:`, `lg:`)
- Arbitrary values when needed (`w-[280px]`)
- State variants (`hover:`, `focus:`)

### Color System

**C4 Colors** (`types/c4.ts`):

```typescript
const C4_COLORS = {
  person: { background: "#08427b", border: "#08427b" },
  softwareSystem: { background: "#1168bd", border: "#1168bd" },
  container: { background: "#76a9fa", border: "#1168bd" },
  component: { background: "#389636", border: "#389636" },
  // ...
};
```

### Component Styling

**Common patterns:**

```tsx
// Panel backgrounds
bg-slate-50 / bg-white

// Borders
border-l border-slate-200

// Spacing
p-4 (padding), gap-3 (flex gap), m-0 (margin reset)

// Text
text-sm, font-bold, uppercase, tracking-wider
```

## Important Gotchas

### 1. Stale Closures in Event Handlers

**Problem:** Event handlers capture old state from when they were created.

**Solution:** Read fresh state from store or use callbacks:

```tsx
const getSelectedElement = useCallback(() =>
  workspace.elements.find((e) => e.id === selectedElementId),
  [workspace.elements, selectedElementId]
);

onChange={() => {
  const currentElement = getSelectedElement(); // Fresh!
  if (currentElement) updateElement(currentElement.id, { ... });
}}
```

### 2. ReactFlow Node State

**Problem:** Setting `nodes` prop directly breaks ReactFlow's internal state.

**Solution:** Use `useNodesState` hook and update via `setNodes`:

```tsx
const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);

// Sync on structural changes
useEffect(() => {
  setNodes(initialNodes);
}, [structureKey, setNodes]);

// Handle ReactFlow's changes
const onNodesChange = useCallback((changes) => {
  onNodesChangeInternal(changes);
  // ... custom logic
}, []);
```

### 3. Lock State Management

**Problem:** Lock button must prevent element movement but allow pan/zoom.

**Solution:**

```tsx
<Controls
  onInteractiveChange={(isInteractive) => {
    useWorkspaceStore.setState({ elementsLocked: !isInteractive });
  }}
/>

// Canvas props
panOnDrag={!elementsLocked}      // Block drag when locked
panOnScroll                       // Always allow scroll pan
zoomOnScroll                      // Always allow zoom
// nodesDraggable controlled by per-node draggable prop
```

### 4. Element ID Generation

**Problem:** Element IDs must be stable and unique.

**Solution:** Slugify names with type suffix and collision handling:

```typescript
// "Web App" + container → "WebApp_container"
// Collision → "WebApp_container_1", "WebApp_container_2", ...
```

Use `renameElement()` for name changes (handles ID updates).

## Code Style Guidelines

### Comments

**Remove obvious comments** like:

```tsx
// Bad
const nodes = getNodes(); // Get nodes

// Good
const nodes = getNodes();
```

Keep comments that explain **why**, not **what**.

### Component Structure

```tsx
// 1. Imports
import React, { useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '../../store';

// 2. Component
export const ComponentName: React.FC = () => {
  // 3. Store access
  const { workspace, updateElement } = useWorkspaceStore();

  // 4. Memoized values
  const filteredData = useMemo(() => {
    return workspace.data.filter(...);
  }, [workspace.data]);

  // 5. Callbacks (useCallback for performance)
  const handleClick = useCallback(() => {
    updateElement(...);
  }, [updateElement]);

  // 6. Effects
  useEffect(() => {
    // ...
  }, []);

  // 7. Render
  return <div>...</div>;
};
```

### Naming Conventions

- **Components:** PascalCase (`PropertiesPanel`, `SoftwareSystemNode`)
- **Hooks:** camelCase with `use` prefix (`useWorkspaceStore`)
- **Events:** `on` prefix (`onNodeClick`, `onDrop`)
- **Booleans:** `is`/`has` prefix (`isExternal`, `hasParent`)
- **Types:** PascalCase, same name as runtime (`C4Element`, `Node`)

## Common Tasks

### Adding a New C4 Element Type

1. Add to `C4ElementType` in `types/c4.ts`
2. Add color to `C4_COLORS`
3. Add label to `C4_LABELS`
4. Create node component in `components/nodes/`
5. Register in `components/nodes/index.ts`
6. Update sidebar filtering logic
7. Add to DSL parser/generator

### Adding a New View Type

1. Add to `C4ViewType` in `types/c4.ts`
2. Add filtering logic in `Canvas.tsx` (`visibleElements` useMemo)
3. Add sidebar allowed types for this view
4. Update DSL parser/generator for view export

### Modifying Store State

```tsx
// Simple update
updateElement(id, { name: "New Name" });

// Complex update with version bump
set((state) => ({
  workspaceVersion: state.workspaceVersion + 1,
  workspace: {
    ...state.workspace,
    elements: state.workspace.elements.map((el) =>
      el.id === id ? { ...el, name: "New Name" } : el,
    ),
  },
}));
```

## Testing Locally

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### Docker Deployment

**File:** `Dockerfile`

The project uses a multi-stage Docker build:

1. **Stage 1 (Building)**: Uses `node:24-alpine` (or LTS) to compile the app.
2. **Stage 2 (Serving)**: Uses `nginx:stable-alpine` to serve static assets.
3. Custom `nginx.conf` ensures SPA routing works correctly (redirects all requests to `index.html`).

**Build command with versioning:**

```bash
docker build -t c4-constructor:$(cat version) .
```

## Files to Modify For Common Changes

| Change               | Files                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| Element styling      | `components/nodes/*`, `src/index.css`                                     |
| Add element property | `types/c4.ts`, `components/nodes/*`, `components/properties/*`, DSL files |
| Change view behavior | `components/canvas/Canvas.tsx`, `components/sidebar/*`                    |
| Add translation key  | `src/i18n.ts`                                                             |
| Modify DSL format    | `src/utils/dslParser.ts`, `src/utils/dslGenerator.ts`                     |
| Update store         | `src/store/workspaceStore.ts`                                             |

## Architecture Decisions

### Why ReactFlow?

- Best-in-class canvas library for node graphs
- Built-in drag-drop, zoom, pan, selection
- Custom node types for C4 elements
- Active maintenance and good documentation

### Why Zustand?

- Simple, boilerplate-free state management
- Great TypeScript support
- No context provider hell
- Easy to devtools debug

### Why Separate parse/generate for DSL?

- Structurizr DSL is complex (nested, context-sensitive)
- Need to preserve positions during round-trip
- Custom layout algorithms for new elements
- Validation and error handling

### Why View-Based Filtering?

- C4 model is hierarchical (system → container → component)
- Different stakeholders need different views
- Prevents information overload
- Matches Structurizr mental model
