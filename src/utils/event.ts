export const isModifierKeyPressed = (event: MouseEvent) => {
  return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
};
