import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/app/features/editor';
import { command } from '~/external/tauri/command';
import { transformImageSrc } from '~/utils/imageSrc';

function escapeHtml(str: string): string {
  return str
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/"/g, '&quot;')
    .replaceAll(/'/g, '&#39;');
}

export function convertMemoToHtml(content: JSONContent, title: string): string {
  const htmlBody = convertEditorJsonToHtml(content);
  return `<h1>${escapeHtml(title)}</h1>${htmlBody}`;
}

export function createHtmlLink(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });
}

async function imageSrcToDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) {
    return src;
  }

  if (isMonoboxAssetSrc(src)) {
    return await command.asset.readImageAsDataUrl(src);
  }

  const response = await fetch(transformImageSrc(src));
  if (!response.ok) {
    throw new Error(`Failed to load export image: ${src}`);
  }

  return await blobToDataUrl(await response.blob());
}

function isMonoboxAssetSrc(src: string): boolean {
  return src.startsWith('asset://localhost/monobox/')
    || src.startsWith('http://asset.localhost/monobox/');
}

export async function embedImagesAsDataUrls(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img[src]'));

  await Promise.all(images.map(async (image) => {
    const src = image.getAttribute('src');
    if (!src) return;

    image.setAttribute('src', await imageSrcToDataUrl(src));
  }));

  return doc.body.innerHTML;
}

export async function embedEditorJsonImagesAsDataUrls(json: JSONContent): Promise<JSONContent> {
  const content = json.content
    ? await Promise.all(json.content.map(child => embedEditorJsonImagesAsDataUrls(child)))
    : undefined;
  const next: JSONContent = {
    ...json,
    ...(content ? { content } : {}),
  };

  if (json.type === 'image' && typeof json.attrs?.src === 'string') {
    next.attrs = {
      ...json.attrs,
      src: await imageSrcToDataUrl(json.attrs.src),
    };
  }

  return next;
}

export async function exportEditorJsonImagesForMarkdown(
  json: JSONContent,
  directoryPath: string,
): Promise<JSONContent> {
  const content = json.content
    ? await Promise.all(json.content.map(child => exportEditorJsonImagesForMarkdown(child, directoryPath)))
    : undefined;
  const next: JSONContent = {
    ...json,
    ...(content ? { content } : {}),
  };

  if (json.type === 'image' && typeof json.attrs?.src === 'string') {
    next.attrs = {
      ...json.attrs,
      src: await command.textExport.saveMarkdownAsset({
        directoryPath,
        src: json.attrs.src,
      }),
    };
  }

  return next;
}

export function buildStandaloneHtmlDocument(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.65;
    }
    body {
      max-width: 840px;
      margin: 0 auto;
      padding: 48px 24px;
      color: #111827;
      background: #ffffff;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th,
    td {
      border: 1px solid #d1d5db;
      padding: 0.5rem;
      vertical-align: top;
    }
    blockquote {
      margin-left: 0;
      padding-left: 1rem;
      border-left: 4px solid #d1d5db;
      color: #4b5563;
    }
    pre {
      overflow-x: auto;
      padding: 1rem;
      border-radius: 6px;
      background: #111827;
      color: #f9fafb;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    a {
      color: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      body {
        color: #e5e7eb;
        background: #111827;
      }
      th,
      td {
        border-color: #374151;
      }
      blockquote {
        border-left-color: #4b5563;
        color: #d1d5db;
      }
      a {
        color: #93c5fd;
      }
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
