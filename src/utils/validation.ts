/**
 * Validation utilities for C4 models
 */

import { C4Element, C4Relationship, C4Workspace, C4ElementType } from '../types';
import { ValidationError } from './errors';

// ============================================
// Element Validation
// ============================================

export function validateElement(element: C4Element): void {
  if (!element.id || element.id.trim() === '') {
    throw new ValidationError('Element ID is required');
  }

  if (!element.name || element.name.trim() === '') {
    throw new ValidationError('Element name is required');
  }

  if (!isValidElementType(element.type)) {
    throw new ValidationError(`Invalid element type: ${element.type}`);
  }

  if (element.position && (typeof element.position.x !== 'number' || typeof element.position.y !== 'number')) {
    throw new ValidationError('Element position must have numeric x and y coordinates');
  }
}

export function isValidElementType(type: string): type is C4ElementType {
  const validTypes: C4ElementType[] = ['person', 'softwareSystem', 'container', 'component', 'deploymentNode', 'infrastructureNode'];
  return validTypes.includes(type as C4ElementType);
}

// ============================================
// Relationship Validation
// ============================================

export function validateRelationship(relationship: C4Relationship, elements: C4Element[]): void {
  if (!relationship.id || relationship.id.trim() === '') {
    throw new ValidationError('Relationship ID is required');
  }

  if (!relationship.description || relationship.description.trim() === '') {
    throw new ValidationError('Relationship description is required');
  }

  if (!elements.find((e) => e.id === relationship.sourceId)) {
    throw new ValidationError(`Source element not found: ${relationship.sourceId}`);
  }

  if (!elements.find((e) => e.id === relationship.targetId)) {
    throw new ValidationError(`Target element not found: ${relationship.targetId}`);
  }

  if (relationship.sourceId === relationship.targetId) {
    throw new ValidationError('Relationship cannot connect an element to itself');
  }
}

// ============================================
// Workspace Validation
// ============================================

export function validateWorkspace(workspace: C4Workspace): void {
  if (!workspace.name || workspace.name.trim() === '') {
    throw new ValidationError('Workspace name is required');
  }

  // Validate all elements
  workspace.elements.forEach((element) => {
    validateElement(element);
  });

  // Validate all relationships
  workspace.relationships.forEach((relationship) => {
    validateRelationship(relationship, workspace.elements);
  });

  // Check for orphaned children
  const elementIds = new Set(workspace.elements.map((e) => e.id));
  workspace.elements.forEach((element) => {
    if (element.parentId && !elementIds.has(element.parentId)) {
      throw new ValidationError(`Element ${element.id} has invalid parent: ${element.parentId}`);
    }
  });
}

// ============================================
// DSL Validation
// ============================================

export function validateDSL(dsl: string): void {
  if (!dsl || dsl.trim() === '') {
    throw new ValidationError('DSL content is empty');
  }

  // Basic DSL structure check
  if (!dsl.includes('workspace')) {
    throw new ValidationError('DSL must contain a workspace definition');
  }

  // Check for balanced braces
  const openBraces = (dsl.match(/{/g) || []).length;
  const closeBraces = (dsl.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    throw new ValidationError('DSL has unbalanced braces');
  }
}

// ============================================
// Key Sanitization
// ============================================

/**
 * Sanitize a string to be a valid Structurizr DSL key.
 * Valid characters: a-zA-Z0-9_-
 * Spaces are replaced with underscores, other invalid chars are removed.
 */
export function sanitizeKey(key: string): string {
  if (!key) return '';
  // Replace spaces with underscores, then remove any remaining invalid characters
  return key
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

// ============================================
// Safe Validators (return boolean instead of throwing)
// ============================================

export function isValidElement(element: C4Element): boolean {
  try {
    validateElement(element);
    return true;
  } catch {
    return false;
  }
}

export function isValidWorkspace(workspace: C4Workspace): boolean {
  try {
    validateWorkspace(workspace);
    return true;
  } catch {
    return false;
  }
}
