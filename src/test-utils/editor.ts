import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';

export function createBasicEditor() {
  return new Editor({
    extensions: [StarterKit, Link, Image],
    content: '',
  });
}
