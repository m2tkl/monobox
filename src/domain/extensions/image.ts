import { invoke } from '@tauri-apps/api/core';
import Image from '@tiptap/extension-image';
import { Plugin } from 'prosemirror-state';

import type { EditorView } from '@tiptap/pm/view';

export const imageExtention = () => {
  return Image.configure({ inline: true }).extend({
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleDOMEvents: {
              drop(view: EditorView, event: DragEvent) {
                const hasFiles = event.dataTransfer
                  && event.dataTransfer.files
                  && event.dataTransfer.files.length;

                if (!hasFiles) {
                  return;
                }
                const images = Array.from(event.dataTransfer.files).filter(
                  file => /image/i.test(file.type),
                );
                if (images.length === 0) {
                  return;
                }
                event.preventDefault();

                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                images.forEach(async (image) => {
                  try {
                    const uploadedImageUrl = await uploadImage(image);
                    const node = view.state.schema.nodes.image.create({
                      src: uploadedImageUrl,
                    });
                    const transaction = view.state.tr.insert(
                      coordinates ? coordinates.pos : 0,
                      node,
                    );
                    view.dispatch(transaction);
                  }
                  catch (error) {
                    console.error('Image upload failed', error);
                  }
                });
              },
              paste(view: EditorView, event: ClipboardEvent) {
                const hasFiles = event.clipboardData
                  && event.clipboardData.files
                  && event.clipboardData.files.length;

                if (!hasFiles) {
                  return;
                }

                const images = Array.from(
                  event.clipboardData.files,
                ).filter(file => /image/i.test(file.type));

                if (images.length === 0) {
                  return;
                }

                event.preventDefault();

                images.forEach(async (image) => {
                  try {
                    const uploadedImageUrl = await uploadImage(image);
                    const node = view.state.schema.nodes.image.create({
                      src: uploadedImageUrl,
                    });
                    const transaction = view.state.tr.replaceSelectionWith(
                      node,
                    );
                    view.dispatch(transaction);
                  }
                  catch (error) {
                    console.error('Image upload failed', error);
                  }
                });
              },
            },
          },
        }),
      ];
    },
    renderHTML({ HTMLAttributes }) {
      const transformedSrc = transformImageSrc(HTMLAttributes.src);
      return [
        'img',
        {
          ...HTMLAttributes,
          src: transformedSrc,
        },
      ];
    },
  });
};

async function uploadImage(image: File) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async (event) => {
      try {
        const base64Data = (event.target?.result as string).split(',')[1];
        const _fileName = image.name;
        const mimeType = image.type;

        const response = await invoke('save_image', {
          args: {
            data: base64Data,
            mime_type: mimeType,
          },
        });

        resolve(response as string);
      }
      catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject('Failed to read file');
    reader.readAsDataURL(image);
  });
}
