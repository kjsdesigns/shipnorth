// Error handling utilities for TypeScript strict mode

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

export function getErrorStack(error: unknown): string {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return getErrorMessage(error);
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('connection') ||
         message.includes('timeout');
}

export function logError(context: string, error: unknown): void {
  console.error(`❌ ${context}:`, getErrorMessage(error));
  
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
}