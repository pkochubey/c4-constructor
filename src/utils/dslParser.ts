/**
 * Structurizr DSL Parser
 * Parses Structurizr DSL files with smart layout
 */

import { v4 as uuidv4 } from 'uuid';
import { C4Element, C4Relationship, C4Workspace, C4ElementType, C4View } from '../types';
import { DSL_LAYOUT_CONFIG } from '../config';
import { logError } from './errors';

interface ParseContext {
  identifierMap: Map<string, string>;
  elements: ParsedElement[];
  relationships: C4Relationship[];
  views: C4View[];
  positions: Map<string, { x: number; y: number }>;
  pendingRelationships: Array<{
    sourceIdentifier: string;
    targetIdentifier: string;
    description: string;
    technology?: string;
  }>;
}

interface ElementStack {
  identifier: string;
  id: string;
  type: C4ElementType;
}

interface ParsedElement {
  id: string;
  identifier: string;
  type: C4ElementType;
  name: string;
  description: string;
  technology?: string;
  parentId?: string;
  tags: string[];
}

export class StructurizrDSLParser {
  /**
   * Parse a Structurizr DSL string into a C4Workspace
   */
  parse(dsl: string): C4Workspace {
    const context: ParseContext = {
      identifierMap: new Map(),
      elements: [],
      relationships: [],
      views: [],
      positions: new Map(),
      pendingRelationships: [],
    };

    const lines = dsl.split('\n');

    // Extract workspace name and description
    const workspaceMatch = dsl.match(/workspace\s+"([^"]*)"(?:\s+"([^"]*)")?/);
    const workspaceName = workspaceMatch?.[1] || 'Imported Workspace';
    const workspaceDescription = workspaceMatch?.[2] || '';

    this.parseDsl(lines, context);

    // Resolve positions and create final elements
    const elements: C4Element[] = context.elements.map((el, index) => {
      // Try full identifier first, then try short identifier (last segment)
      let pos = context.positions.get(el.identifier);
      if (!pos && el.identifier.includes('.')) {
        const shortIdent = el.identifier.split('.').pop()!;
        pos = context.positions.get(shortIdent);
      }
      const finalPos = pos || this.getDefaultPosition(index);
      return {
        id: el.id,
        type: el.type,
        name: el.name,
        description: el.description,
        technology: el.technology,
        parentId: el.parentId,
        tags: el.tags,
        isExternal: el.tags.includes('External'),
        position: finalPos
      };
    });

    // Resolve relationships
    this.resolveRelationships(context);

    // Ensure at least one systemLandscape view exists as the root view
    const hasLandscape = context.views.some(v => v.type === 'systemLandscape');
    if (!hasLandscape) {
      context.views.unshift({
        id: 'landscape',
        key: 'landscape',
        type: 'systemLandscape',
        name: 'System Landscape',
        description: 'Auto-generated landscape view'
      });
    }

    return {
      name: workspaceName,
      description: workspaceDescription,
      elements,
      relationships: context.relationships,
      views: context.views
    };
  }

  private parseDsl(lines: string[], context: ParseContext) {
    const elementStack: ElementStack[] = [];
    let currentInViews = false;
    let currentInStyles = false;
    let currentView: Partial<C4View> | null = null;
    let currentViewElement: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line || line.startsWith('!')) continue;

      // Special handling for layout metadata in comments
      const isComment = line.startsWith('#') || line.startsWith('//');
      if (isComment) {
        const layoutContent = line.replace(/^[#\/]+\s*/, '');
        if (layoutContent.startsWith('element ')) {
          line = layoutContent;
        } else {
          continue;
        }
      }

      if (line === 'model {') continue;
      if (line === 'views {') { currentInViews = true; continue; }
      if (line === 'styles {') { currentInStyles = true; continue; }

      if (line === '}') {
        if (currentViewElement) {
          currentViewElement = null;
        } else if (currentView) {
          context.views.push(currentView as C4View);
          currentView = null;
        } else if (currentInStyles) {
          currentInStyles = false;
        } else if (currentInViews) {
          currentInViews = false;
        } else if (elementStack.length > 0) {
          elementStack.pop();
        }
        continue;
      }

      if (currentInStyles) continue;

      if (currentInViews) {
        // Handle view settings and element overrides
        if (currentViewElement) {
          const posMatch = line.match(/^position\s+(-?\d+)\s+(-?\d+)/);
          if (posMatch) {
            context.positions.set(currentViewElement, {
              x: parseInt(posMatch[1]),
              y: parseInt(posMatch[2])
            });
          }
        }
        
        this.handleViewLine(line, context, (v) => currentView = v, (e) => currentViewElement = e);
        continue;
      }

      // Handle model elements
      this.handleModelLine(line, elementStack, context);
    }
  }

  private handleModelLine(line: string, elementStack: ElementStack[], context: ParseContext) {
    // Identifier = type "name" "desc" "tech" {
    // Note: [\w.]+ allows dots in identifiers (ss.wa)
    const elementMatch = line.match(/^([\w.]+)\s*=\s*(person|softwareSystem|container|component|deploymentNode|infrastructureNode)\s+"([^"]*)"(?:\s+"([^"]*)")?(?:\s+"([^"]*)")?(?:\s+"([^"]*)")?/);

    // Group: group "name" {
    const groupMatch = line.match(/^group\s+"([^"]*)"/);

    // Relationship: source -> target "desc" "tech"
    const relMatch = line.match(/^([\w.]+)\s*->\s*([\w.]+)\s+"([^"]*)"(?:\s+"([^"]*)")?/);

    if (elementMatch) {
      const [_, ident, type, name, desc, tech, tagsStr] = elementMatch;
      const id = uuidv4();

      // Store full path identifier if in nested context
      const fullIdent = elementStack.length > 0
        ? `${elementStack[elementStack.length - 1].identifier}.${ident}`
        : ident;

      context.identifierMap.set(fullIdent, id);
      context.identifierMap.set(ident, id); // Also store raw to be safe

      const tags = tagsStr ? tagsStr.replace(/"/g, '').split(',') : [];
      const parentId = elementStack.length > 0 ? elementStack[elementStack.length - 1].id : undefined;

      context.elements.push({
        id,
        identifier: fullIdent,
        type: type as C4ElementType,
        name,
        description: desc || '',
        technology: tech,
        parentId,
        tags
      });

      if (line.endsWith('{')) {
        elementStack.push({ identifier: fullIdent, id, type: type as C4ElementType });
      }
    } else if (groupMatch) {
      const name = groupMatch[1];
      const id = uuidv4();
      const parentId = elementStack.length > 0 ? elementStack[elementStack.length - 1].id : undefined;
      const ident = `group_${id.slice(0, 4)}`;

      context.elements.push({
        id,
        identifier: ident,
        type: 'group',
        name,
        description: '',
        parentId,
        tags: []
      });

      elementStack.push({ identifier: ident, id, type: 'group' });
    } else if (relMatch) {
      context.pendingRelationships.push({
        sourceIdentifier: relMatch[1],
        targetIdentifier: relMatch[2],
        description: relMatch[3],
        technology: relMatch[4]
      });
    }
  }

  private handleViewLine(line: string, context: ParseContext, setView: (v: any) => void, setElement: (e: any) => void) {
    const landscapeMatch = line.match(/^systemLandscape\s+"([^"]*)"\s+"([^"]*)"/);
    const contextMatch = line.match(/^systemContext\s+([\w.]+)\s+"([^"]*)"\s+"([^"]*)"/);
    const containerMatch = line.match(/^container\s+([\w.]+)\s+"([^"]*)"\s+"([^"]*)"/);
    const componentMatch = line.match(/^component\s+([\w.]+)\s+"([^"]*)"\s+"([^"]*)"/);

    // posMatch was here but unused
    const elementBlockMatch = line.match(/^element\s+([\w.]+)\s+\{/);
    const elementPosMatch = line.match(/^element\s+([\w.]+)\s+(-?\d+)\s+(-?\d+)/);

    if (landscapeMatch) {
      setView({ id: uuidv4(), key: landscapeMatch[1], type: 'systemLandscape', name: landscapeMatch[1], description: landscapeMatch[2] });
    } else if (contextMatch) {
      const systemId = context.identifierMap.get(contextMatch[1]);
      setView({ id: uuidv4(), key: contextMatch[2], type: 'systemContext', softwareSystemId: systemId, name: contextMatch[2], description: contextMatch[3] });
    } else if (containerMatch) {
      const systemId = context.identifierMap.get(containerMatch[1]);
      setView({ id: uuidv4(), key: containerMatch[2], type: 'container', softwareSystemId: systemId, name: containerMatch[2], description: containerMatch[3] });
    } else if (componentMatch) {
      const containerId = context.identifierMap.get(componentMatch[1]);
      setView({ id: uuidv4(), key: componentMatch[2], type: 'component', containerId: containerId, name: componentMatch[2], description: componentMatch[3] });
    } else if (elementPosMatch) {
      const identifier = elementPosMatch[1];
      const pos = {
        x: parseInt(elementPosMatch[2]),
        y: parseInt(elementPosMatch[3])
      };
      // Save position with the identifier from DSL (short form like "NewComponent_f5bf")
      context.positions.set(identifier, pos);

      // Also save position with full identifier if the element is nested
      // (e.g., "NewContainer_230c.NewComponent_f5bf")
      // This handles the case where DSL uses short identifiers but parser creates full ones
      for (const [key, value] of context.identifierMap) {
        if (key.endsWith(`.${identifier}`)) {
          context.positions.set(key, pos);
        }
      }
    } else if (elementBlockMatch) {
      setElement(elementBlockMatch[1]);
    }
  }

  private getDefaultPosition(index: number): { x: number; y: number } {
    const { PADDING, ELEMENT_WIDTH, ELEMENT_HEIGHT, COL_GAP, ROW_GAP, COLS_PER_ROW } = DSL_LAYOUT_CONFIG;
    const col = index % COLS_PER_ROW;
    const row = Math.floor(index / COLS_PER_ROW);
    return {
      x: PADDING + col * (ELEMENT_WIDTH + COL_GAP),
      y: PADDING + row * (ELEMENT_HEIGHT + ROW_GAP),
    };
  }

  private resolveRelationships(context: ParseContext): void {
    // Sort elements by identifier length (descending) to avoid partial matches if we had complex logic
    // But identifierMap should be enough if we populated it correctly.

    for (const rel of context.pendingRelationships) {
      const sourceId = context.identifierMap.get(rel.sourceIdentifier);
      const targetId = context.identifierMap.get(rel.targetIdentifier);

      if (sourceId && targetId) {
        context.relationships.push({
          id: uuidv4(),
          sourceId,
          targetId,
          description: rel.description,
          technology: rel.technology,
          type: 'uses',
        });
      } else {
        logError(`Could not resolve relationship elements: ${rel.sourceIdentifier} -> ${rel.targetIdentifier}`, 'DSLParser');
      }
    }

    // Auto-generate missing views for Software Systems and Deployment Nodes
    const systems = context.elements.filter(e => e.type === 'softwareSystem');
    for (const sys of systems) {
      const hasView = context.views.some(v => v.softwareSystemId === sys.id && v.type === 'container');
      if (!hasView) {
        context.views.push({
          id: uuidv4(),
          key: `view-${sys.id}`,
          type: 'container',
          softwareSystemId: sys.id,
          name: `${sys.name} - Containers`,
          description: `Auto-generated container view`
        });
      }
    }

    const dNodes = context.elements.filter(e => e.type === 'deploymentNode');
    for (const dNode of dNodes) {
      const hasView = context.views.some(v => v.type === 'deployment' && (v.key === `deploy-${dNode.id}` || v.name.includes(dNode.name)));
      if (!hasView) {
        context.views.push({
          id: uuidv4(),
          key: `deploy-${dNode.id}`,
          type: 'deployment',
          name: `${dNode.name} - Deployment`,
          description: `Auto-generated deployment view`
        });
      }
    }
  }
}

// Singleton instance
export const dslParser = new StructurizrDSLParser();

/**
 * Parse DSL string into workspace
 */
export function parseDSL(dsl: string): C4Workspace {
  return dslParser.parse(dsl);
}
/**
 * Load DSL from file using file service
 */
export async function loadDSLFromFile(file: File): Promise<C4Workspace> {
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
  return parseDSL(content);
}
