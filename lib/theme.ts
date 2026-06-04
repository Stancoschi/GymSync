/**
 * Theme helpers — used by client components to persist the user's
 * theme preference as a cookie (readable by the server on next request).
 *
 * Usage in your theme toggle component:
 *   import { setThemeCookie, getClientTheme } from '@/lib/theme';
 *   setThemeCookie('dark');
 */

export type Theme = 'dark' | 'light';

/** Persist theme in a cookie so SSR layout.tsx can read it. */
export function setThemeCookie(theme: Theme): void {
  // Max-age: 1 year. SameSite=Lax is fine for first-party use.
  document.cookie = `gymsync-theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

/** Read current theme from the DOM (set by layout.tsx server-side). */
export function getClientTheme(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

/** Toggle theme, update DOM class, and persist cookie. */
export function toggleTheme(): Theme {
  const current = getClientTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(next);
  setThemeCookie(next);
  return next;
}
