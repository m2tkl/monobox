export const getLinkFromMouseClickEvent = (
  event: MouseEvent,
): string | undefined => {
  if (!event.target) {
    return;
  }

  const link = (event.target as HTMLElement).closest('a');
  if (!link) {
    return;
  }

  const url = link.getAttribute('href');
  if (!url) {
    return;
  }

  return url;
};
