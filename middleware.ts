// Authentication middleware disabled - no longer needed
// All routes are now public

export function middleware() {
  // No authentication checks
  return;
}

export const config = {
  matcher: []
}