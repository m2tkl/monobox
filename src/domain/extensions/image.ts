import Image from "@tiptap/extension-image";
import type { EditorView } from "@tiptap/pm/view";
import { Plugin } from "prosemirror-state";

export const imageExtention = () => {
  return Image.configure({ inline: true }).extend({
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleDOMEvents: {
              drop(view: EditorView, event: DragEvent) {
                const hasFiles = event.dataTransfer &&
                  event.dataTransfer.files &&
                  event.dataTransfer.files.length;

                if (!hasFiles) {
                  return;
                }
                const images = Array.from(event.dataTransfer.files).filter(
                  (file) => /image/i.test(file.type),
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
                  } catch (error) {
                    console.error("Image upload failed", error);
                  }
                });
              },
              paste(view: EditorView, event: ClipboardEvent) {
                const hasFiles = event.clipboardData &&
                  event.clipboardData.files &&
                  event.clipboardData.files.length;

                if (!hasFiles) {
                  return;
                }

                const images = Array.from(
                  event.clipboardData.files,
                ).filter((file) => /image/i.test(file.type));

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
                  } catch (error) {
                    console.error("Image upload failed", error);
                  }
                });
              },
            },
          },
        }),
      ];
    },
  });
};

async function uploadImage(image: File) {
  const formData = new FormData();
  formData.append("file", image);

  const uploadedImageUrl = await $fetch(
    "/api/v2/assets/uploads",
    {
      method: "post",
      body: formData,
    },
  );
  return uploadedImageUrl[0];
}
