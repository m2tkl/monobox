/**
 * Extended theme management composable
 * Extends @nuxt/ui useColorMode with theme metadata and utilities
 */
export const useTheme = () => {
  const colorMode = useColorMode();

  // Theme configuration with metadata
  const themeConfig = {
    light: {
      name: 'Light',
      icon: 'i-heroicons-sun',
      description: 'Clean and bright theme',
    },
    dark: {
      name: 'Dark',
      icon: 'i-heroicons-moon',
      description: 'Easy on the eyes',
    },
  } as const;

  type ThemeMode = keyof typeof themeConfig;

  // Current theme with metadata
  const currentTheme = computed(() => {
    const mode = colorMode.value as ThemeMode;
    return {
      mode,
      config: themeConfig[mode] || themeConfig.light,
    };
  });

  // All available themes
  const availableThemes = computed(() =>
    Object.entries(themeConfig).map(([mode, config]) => ({
      mode: mode as ThemeMode,
      active: colorMode.value === mode,
      ...config,
    })),
  );

  // Theme switching functions
  const setTheme = (mode: ThemeMode) => {
    colorMode.preference = mode;
  };

  const toggleDarkMode = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  };

  const nextTheme = () => {
    const themes = Object.keys(themeConfig) as ThemeMode[];
    const currentIndex = themes.indexOf(colorMode.value as ThemeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return {
    // useColorMode properties
    ...colorMode,

    // Enhanced theme management
    currentTheme,
    availableThemes,
    setTheme,
    toggleDarkMode,
    nextTheme,

    // Utility functions
    isTheme: (theme: ThemeMode) => colorMode.value === theme,
    isDark: computed(() => colorMode.value === 'dark'),
    isLight: computed(() => colorMode.value === 'light'),
  };
};
