export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function parseThemePreference(value: unknown): ThemePreference;
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme;
