const ui = reactive({
  isSidebarOpen: true,
  isFocusPaneOpen: false,
  isFocusPaneExpanded: false,
  focusPaneSortMode: 'focused' as 'focused' | 'updated',
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
