// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  // Change nuxt app root dir
  srcDir: "src/",

  // Enable SSG
  ssr: false,

  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || "localhost" },

  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ["VITE_", "TAURI_"],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },

  modules: ["@nuxt/ui", "@nuxt/icon"],

  icon: {
    serverBundle: false,
    clientBundle: {
      icons: [
        "carbon:checkmark-outline",
        "carbon:warning-alt",
        "carbon:table-of-contents",
        "carbon:add-large",
        "carbon:search",
        "carbon:link",
        "carbon:unlink",
        "carbon:trash-can",
        "carbon:area",
        "carbon:settings",
        "carbon:overflow-menu-vertical",

        // For editor toolbar
        "carbon:text-bold",
        "carbon:text-italic",
        "carbon:text-strikethrough",
        "carbon:list-bulleted",
        "carbon:list-numbered",
        "carbon:quotes",
        "carbon:string-text",

        "heroicons:x-mark-20-solid"
      ],
      scan: true,
    },
  },
});
