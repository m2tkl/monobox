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
  const setTheme = async (mode: ThemeMode) => {
    colorMode.preference = mode;
  };

  const toggleDarkMode = async () => {
    const newMode = colorMode.value === 'dark' ? 'light' : 'dark';
    await setTheme(newMode as ThemeMode);
  };

  const nextTheme = async () => {
    const themes = Object.keys(themeConfig) as ThemeMode[];
    const currentIndex = themes.indexOf(colorMode.value as ThemeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    await setTheme(themes[nextIndex]);
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
