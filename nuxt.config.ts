// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/eslint', '@pinia/nuxt'],

  // Enable SSG
  ssr: false,
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],
  // Change nuxt app root dir
  srcDir: 'src/',

  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },
  compatibilityDate: '2024-11-01',

  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
      },
    },
  },

  icon: {
    serverBundle: false,
    clientBundle: {
      icons: [
        'carbon:checkmark-outline',
        'carbon:warning-alt',
        'carbon:table-of-contents',
        'carbon:add-large',
        'carbon:search',
        'carbon:link',
        'carbon:unlink',
        'carbon:trash-can',
        'carbon:area',
        'carbon:settings',
        'carbon:overflow-menu-vertical',

        // For editor toolbar
        'carbon:text-bold',
        'carbon:text-italic',
        'carbon:text-strikethrough',
        'carbon:list-bulleted',
        'carbon:list-numbered',
        'carbon:quotes',
        'carbon:string-text',
        'carbon:ibm-cloud-direct-link-1-connect',

        'carbon:arrow-left',
        'carbon:arrow-right',
        'carbon:menu',
        'carbon:bookmark',
        'carbon:recently-viewed',
        'carbon:arrows-horizontal',
        'carbon:db2-database',
        'carbon:chevron-down',
        'carbon:home',
        'carbon:copy',
        'carbon:text-clear-format',
        'carbon:side-panel-open',
        'carbon:side-panel-close',
        'carbon:text-annotation-toggle',
        'carbon:tree-view-alt',
        'carbon:html',
        'carbon:app-connectivity',

        // Nuxt
        'heroicons:x-mark-20-solid',
      ],
      scan: true,
    },
  },
});
