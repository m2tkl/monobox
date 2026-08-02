const ui = reactive({
  isSidebarOpen: true,
  isFocusSidebarOpen: false,
});

const toggleSidebar = () => {
  ui.isSidebarOpen = !ui.isSidebarOpen;
};

const toggleFocusSidebar = () => {
  ui.isFocusSidebarOpen = !ui.isFocusSidebarOpen;
};

export const useUIState = () => {
  return {
    ui: computed(() => ui),
    toggleSidebar,
    toggleFocusSidebar,
  };
};
