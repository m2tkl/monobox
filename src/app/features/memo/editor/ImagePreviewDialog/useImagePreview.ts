import { transformImageSrc } from '~/utils/imageSrc';

export type ImagePreviewState = {
  open: boolean;
  src: string;
  alt: string;
};

export const useImagePreviewState = () =>
  useState<ImagePreviewState>('image-preview-state', () => ({
    open: false,
    src: '',
    alt: '',
  }));

export const useImagePreview = () => {
  const state = useImagePreviewState();

  const openPreview = (src: string, alt?: string) => {
    if (!src) {
      return;
    }

    state.value.open = true;
    state.value.src = transformImageSrc(src);
    state.value.alt = alt ?? '';
  };

  const closePreview = () => {
    state.value.open = false;
    state.value.src = '';
    state.value.alt = '';
  };

  return {
    state,
    openPreview,
    closePreview,
  };
};
