/**
 * Structurizr DSL Generator
 * Generates Structurizr DSL from a C4 workspace model
 * https://docs.structurizr.com/dsl/language
 */

import { C4Workspace, C4Element } from '../types';
import { fileService, clipboardService } from '../services';
import { sanitizeKey } from './validation';

export class StructurizrDSLGenerator {
  private readonly indent = '    ';
  private identifiers: Map<string, string> = new Map();

  /**
   * Generate complete Structurizr DSL from workspace
   */
  generate(workspace: C4Workspace): string {
    const lines: string[] = [];
    this.identifiers.clear();

    lines.push(`workspace "${this.escape(workspace.name)}" "${this.escape(workspace.description)}" {`);
    lines.push('');

    // Model section
    lines.push(`${this.indent}model {`);
    lines.push(...this.generateModel(workspace));
    lines.push(`${this.indent}}`);
    lines.push('');

    // Views section
    lines.push(`${this.indent}views {`);
    lines.push(...this.generateViews(workspace));
    lines.push(`${this.indent}}`);

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate model section with elements and relationships
   */
  private generateModel(workspace: C4Workspace): string[] {
    const lines: string[] = [];
    const indent2 = this.indent.repeat(2);

    // First, map all identifiers
    workspace.elements.forEach(el => {
      this.identifiers.set(el.id, this.generateIdentifier(el));
    });

    // 1. Group by parent/nesting
    const rootElements = workspace.elements.filter(e => !e.parentId);

    lines.push(...this.generateNestedElements(rootElements, workspace, 2));

    if (workspace.elements.length > 0) lines.push('');

    // 2. Generate relationships
    for (const rel of workspace.relationships) {
      const sourceIdent = this.identifiers.get(rel.sourceId);
      const targetIdent = this.identifiers.get(rel.targetId);

      if (sourceIdent && targetIdent) {
        const techPart = rel.technology ? ` "${this.escape(rel.technology)}"` : '';
        const tagsPart = rel.tags && rel.tags.length > 0 ? ` "${rel.tags.join(',')}"` : '';
        lines.push(
          `${indent2}${sourceIdent} -> ${targetIdent} "${this.escape(rel.description)}"${techPart}${tagsPart}`
        );
      }
    }

    return lines;
  }

  private generateNestedElements(elements: C4Element[], workspace: C4Workspace, indentLevel: number): string[] {
    const lines: string[] = [];
    const currentIndent = this.indent.repeat(indentLevel);

    for (const el of elements) {
      const ident = this.identifiers.get(el.id);
      const children = workspace.elements.filter(child => child.parentId === el.id);

      let typeKeyword = el.type as string;
      if (typeKeyword === 'softwareSystem') typeKeyword = 'softwareSystem';

      const properties = [
        `"${this.escape(el.name)}"`,
        el.description ? `"${this.escape(el.description)}"` : null,
        el.technology ? `"${this.escape(el.technology)}"` : null
      ].filter(p => p !== null).join(' ');

      const tags = (el.tags || []).slice();
      if (el.isExternal) tags.push('External');
      const tagsPart = tags.length > 0 ? ` "${tags.join(',')}"` : '';

      if (el.type === 'group') {
        lines.push(`${currentIndent}group "${this.escape(el.name)}" {`);
        lines.push(...this.generateNestedElements(children, workspace, indentLevel + 1));
        lines.push(`${currentIndent}}`);
      } else if (children.length > 0) {
        lines.push(`${currentIndent}${ident} = ${typeKeyword} ${properties}${tagsPart} {`);
        lines.push(...this.generateNestedElements(children, workspace, indentLevel + 1));
        lines.push(`${currentIndent}}`);
      } else {
        lines.push(`${currentIndent}${ident} = ${typeKeyword} ${properties}${tagsPart}`);
      }
    }

    return lines;
  }

  /**
   * Generate views section
   */
  private generateViews(workspace: C4Workspace): string[] {
    const lines: string[] = [];
    const indent2 = this.indent.repeat(2);
    const indent3 = this.indent.repeat(3);
    const indent4 = this.indent.repeat(4);

    if (!workspace.views || workspace.views.length === 0) {
      // Fallback for old workspaces
      const systems = workspace.elements.filter(e => e.type === 'softwareSystem');
      if (systems.length > 0) {
        lines.push(`${indent2}systemContext ${this.identifiers.get(systems[0].id)} "Context" "Context View" {`);
        lines.push(`${indent3}include *`);
        lines.push(`${indent3}autoLayout lr`);
        lines.push(`${indent2}}`);
      }
    } else {
      for (const view of workspace.views) {
        const sourceIdent = view.softwareSystemId ? this.identifiers.get(view.softwareSystemId) : '';
        const sanitizedKey = sanitizeKey(view.key);

        let viewHeader = '';
        let validTypes: string[] = [];

        switch (view.type) {
          case 'systemLandscape':
            viewHeader = `systemLandscape "${sanitizedKey}" "${this.escape(view.description)}"`;
            validTypes = ['person', 'softwareSystem'];
            break;
          case 'systemContext':
            viewHeader = `systemContext ${sourceIdent} "${sanitizedKey}" "${this.escape(view.description)}"`;
            validTypes = ['person', 'softwareSystem'];
            break;
          case 'container':
            viewHeader = `container ${sourceIdent} "${sanitizedKey}" "${this.escape(view.description)}"`;
            validTypes = ['person', 'softwareSystem', 'container'];
            break;
          case 'component':
            const containerIdent = view.containerId ? this.identifiers.get(view.containerId) : '';
            viewHeader = `component ${containerIdent} "${sanitizedKey}" "${this.escape(view.description)}"`;
            validTypes = ['person', 'softwareSystem', 'container', 'component'];
            break;
        }

        lines.push(`${indent2}${viewHeader} {`);
        lines.push(`${indent3}include *`);
        
        // Export positions only for valid elements in this view
        for (const el of workspace.elements) {
          if (validTypes.includes(el.type)) {
            const ident = this.identifiers.get(el.id);
            if (ident) {
              // Comment out position metadata to keep DSL valid for official Structurizr tools
              lines.push(`${indent3}# element ${ident} ${Math.round(el.position.x)} ${Math.round(el.position.y)}`);
            }
          }
        }

        lines.push(`${indent3}autoLayout lr`);
        lines.push(`${indent2}}`);
        lines.push('');
      }
    }

    // Styles
    lines.push(`${indent2}styles {`);
    this.generateStyles(indent3, indent4).forEach(l => lines.push(l));
    lines.push(`${indent2}}`);

    return lines;
  }

  private generateStyles(indent3: string, indent4: string): string[] {
    const lines: string[] = [];

    // Hardcoded list of element tags for styles
    const tags = ['Person', 'Software System', 'Container', 'Component'];
    const backgrounds: Record<string, string> = {
      'Person': '#08427b',
      'Software System': '#1168bd',
      'Container': '#438dd5',
      'Component': '#85bbf0'
    };

    for (const tag of tags) {
      lines.push(`${indent3}element "${tag}" {`);
      if (tag === 'Person') lines.push(`${indent4}shape Person`);
      lines.push(`${indent4}background ${backgrounds[tag] || '#dddddd'}`);
      lines.push(`${indent4}color ${tag === 'Component' ? '#000000' : '#ffffff'}`);
      lines.push(`${indent3}}`);
    }

    // External style
    lines.push(`${indent3}element "External" {`);
    lines.push(`${indent4}background #999999`);
    lines.push(`${indent4}color #ffffff`);
    lines.push(`${indent3}}`);

    return lines;
  }

  /**
   * Generate a valid identifier from element
   */
  private generateIdentifier(element: C4Element): string {
    // If the ID is already a valid Structurizr identifier (starts with a letter, no dashes), use it.
    // This supports our "smart IDs" generated during renaming.
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(element.id)) {
      return element.id;
    }

    const base = element.name
      .replace(/[^a-zA-Z0-9]/g, '');

    return (base || 'element') + '_' + element.id.slice(0, 4);
  }

  /**
   * Escape special characters in strings
   */
  private escape(str: string): string {
    if (!str) return '';
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

// Singleton instance
export const dslGenerator = new StructurizrDSLGenerator();

/**
 * Generate DSL string from workspace
 */
export function generateDSL(workspace: C4Workspace): string {
  return dslGenerator.generate(workspace);
}

/**
 * Download DSL as file using file service
 */
export function downloadDSL(workspace: C4Workspace, filename?: string): void {
  const dsl = generateDSL(workspace);
  const finalFilename = filename || fileService.generateDSLFilename(workspace.name);
  fileService.download(dsl, finalFilename);
}

/**
 * Copy DSL to clipboard using clipboard service
 */
export async function copyDSLToClipboard(workspace: C4Workspace): Promise<void> {
  const dsl = generateDSL(workspace);
  await clipboardService.copy(dsl);
}
