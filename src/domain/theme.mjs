export function parseThemePreference(value) {
  return value === 'dark' || value === 'light' ? value : 'system';
}

export function resolveTheme(preference, systemPrefersDark) {
  if (preference === 'dark' || preference === 'light') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}
