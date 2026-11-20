/** Follow Jira's light/dark mode (sets data-color-mode on <html>) when embedded. */
export function followJiraTheme() {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  import('@forge/bridge')
    .then(({ view }) => view.theme.enable())
    .catch(() => {});
}
