/**
 * Maps raw errors to clean, user-facing messages.
 * Always logs the full technical error for debugging.
 */
export const handleApiError = (error: unknown, context?: string): string => {
  const label = context ? `[${context}]` : '[API Error]';
  console.error(label, error);

  // Detect network / fetch failures
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return 'No internet connection. Please check your network.';
  }

  // AbortController timeout
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request timed out. Please try again.';
  }

  // Handle objects with a status or code property (HTTP-style errors)
  const err = error as any;

  const status: number | undefined =
    err?.status ?? err?.statusCode ?? err?.response?.status;

  if (status !== undefined) {
    if (status === 401) {
      // Caller should also trigger logout when appropriate
      return 'Your session has expired. Please log in again.';
    }
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return 'The requested resource was not found.';
    if (status === 408) return 'The request timed out. Please try again.';
    if (status >= 500) return 'Something went wrong on our end. Please try again later.';
  }

  // Firebase auth error codes
  const code: string | undefined = err?.code;
  if (code) {
    if (code === 'auth/network-request-failed')
      return 'No internet connection. Please check your network.';
    if (code === 'auth/too-many-requests')
      return 'Too many attempts. Please wait a moment and try again.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
      return 'Invalid email or password.';
    if (code === 'auth/email-already-in-use')
      return 'This email is already registered.';
    if (code === 'auth/weak-password')
      return 'Password should be at least 6 characters.';
  }

  // Generic message string check
  const message: string = err?.message ?? String(error);
  if (/network|internet|offline|dns/i.test(message))
    return 'No internet connection. Please check your network.';
  if (/timeout|timed?\s?out|abort/i.test(message))
    return 'The request timed out. Please try again.';

  return 'An unexpected error occurred.';
};
