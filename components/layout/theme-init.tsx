// Injects a tiny blocking script into <head> that applies the correct
// theme class BEFORE React hydrates — prevents flash of wrong theme.
// globals.css uses `@custom-variant dark (&:is(.dark *))` so the class
// must live on <html> (or any ancestor of body).
export function ThemeInit() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('gymsync-theme');
    var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = stored || preferred;
    var html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
  } catch(e) {
    // If localStorage is blocked, keep the SSR default ('dark' from className)
  }
})()
  `.trim();

  return (
    <script
      // This script runs synchronously before CSS is applied — no defer/async.
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
