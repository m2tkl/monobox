const ui = reactive({
  isSidebarOpen: true,
});

const toggleSidebar = () => {
  ui.isSidebarOpen = !ui.isSidebarOpen;
};

export const useUIState = () => {
  return {
    ui: computed(() => ui),
    toggleSidebar,
  };
};
