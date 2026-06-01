// Server component — injects a tiny inline script that runs before React hydration
// to prevent flash of wrong theme.
export function ThemeInit() {
  const script = `
    (function(){
      try {
        var t = localStorage.getItem('gymsync-theme');
        var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var theme = t || preferred;
        document.documentElement.classList.remove('dark','light');
        document.documentElement.classList.add(theme);
      } catch(e) {
        document.documentElement.classList.add('dark');
      }
    })()
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
