const IMAGE_EXTENSIONS = new Set([
  'avif', 'bmp', 'gif', 'heic', 'jpeg', 'jpg', 'png', 'svg', 'webp',
]);

export function isImageFile(fileName: string) {
  const extension = fileName.split('.').at(-1)?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.has(extension);
}
