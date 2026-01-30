/**
 * Custom error classes for better error handling
 */

export class C4Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'C4Error';
  }
}

export class DSLError extends C4Error {
  constructor(message: string, details?: unknown) {
    super(message, 'DSL_ERROR', details);
    this.name = 'DSLError';
  }
}

export class ValidationError extends C4Error {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class FileError extends C4Error {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_ERROR', details);
    this.name = 'FileError';
  }
}

/**
 * Type guard for C4Error
 */
export function isC4Error(error: unknown): error is C4Error {
  return error instanceof C4Error;
}

/**
 * Extract user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isC4Error(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  const message = getErrorMessage(error);

  console.error(`${prefix} ${message}`, error);
}

/**
 * Safe wrapper for async functions that may throw
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      logError(error);
    }
    return null;
  }
}
