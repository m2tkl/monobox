import type { JSONContent } from '@tiptap/vue-3';

/**
 * Convert tiptap json to html
 */
export function convertEditorJsonToHtml(json: JSONContent): string {
  return renderNode(json);
}

/**
 * Render a complete memo as HTML with title and content.
 *
 * @param json - The TipTap JSON content representing the memo body
 * @param title - The memo title to be rendered as an H1 heading
 * @returns Complete HTML string with the title as H1 followed by the memo content
 */
export function renderMemoAsHtml(json: JSONContent, title: string): string {
  const htmlBody = convertEditorJsonToHtml(json);
  return `<h1>${title}</h1>${htmlBody}`;
}

/**
 * Render tiptap node as html
 */
function renderNode(node: JSONContent): string {
  switch (node.type) {
    case 'doc':
    case 'fragment':
      return renderChildren(node);

    case 'paragraph':
      return `<p>${renderChildren(node)}</p>`;

    case 'heading': {
      const rawLevel = node.attrs?.level;
      const originalLevel = typeof rawLevel === 'number' ? rawLevel : 1;
      // Add +1 because memo title is level 1 heading.
      const level = Math.min(originalLevel + 1, 6);

      return `<h${level}>${renderChildren(node)}</h${level}>`;
    }

    case 'text':
      return wrapWithMarks(node.text ?? '', node.marks);

    case 'bulletList':
      return `<ul>${renderChildren(node)}</ul>`;

    case 'orderedList':
      return `<ol>${renderChildren(node)}</ol>`;

    case 'listItem':
      return `<li>${renderChildren(node)}</li>`;

    case 'taskList':
      return `<ul>${renderChildren(node)}</ul>`;

    case 'taskItem': {
      const checked = node.attrs?.checked ? 'checked' : '';
      return `<li><input type="checkbox" disabled ${checked}> ${renderChildren(node)}</li>`;
    }

    case 'blockquote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;

    case 'codeBlock':
      return `<pre><code>${renderChildren(node)}</code></pre>`;

    case 'image': {
      const src = node.attrs?.src ?? '';
      const alt = node.attrs?.alt ?? '';
      return `<img src="${src}" alt="${alt}">`;
    }

    case 'hardBreak':
      return `<br />`;

    case 'horizontalRule':
      return `<hr />`;

    default:
      // For undefined nodes, output only their children (ignore the node itself but keep its content)
      return renderChildren(node);
  }
}

/**
 * Render children nodes
 */
function renderChildren(node: JSONContent): string {
  return (node.content ?? []).map(renderNode).join('');
}

/**
 * Wrap mark texts
 */
function wrapWithMarks(text: string, marks?: JSONContent['marks']): string {
  if (!marks) return text;

  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${acc}</strong>`;
      case 'italic':
        return `<em>${acc}</em>`;
      case 'strike':
        return `<s>${acc}</s>`;
      case 'code':
        return `<code>${acc}</code>`;
      case 'link': {
        const href = mark.attrs?.href ?? '#';
        return `<a href="${href}">${acc}</a>`;
      }
      default:
        return acc;
    }
  }, text);
}
