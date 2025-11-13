import type { JSONContent } from '@tiptap/vue-3';

function escapeHtml(str: string): string {
  return str
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/"/g, '&quot;')
    .replaceAll(/'/g, '&#39;');
}


function extractText(node: JSONContent): string {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  return (node.content ?? []).map(extractText).join('');
}

function mapLanguage(lang: string): string {
  const l = lang.toLowerCase();
  const aliases: Record<string, string> = {
    html: 'xml',
    vue: 'xml',
  };
  return aliases[l] || l;
}

/**
 * Convert tiptap json to html
 */
export function convertEditorJsonToHtml(json: JSONContent): string {
  return renderNode(json);
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

    case 'codeBlock': {
      const rawLang = typeof node.attrs?.language === 'string' ? node.attrs.language.trim() : '';
      const mapped = rawLang ? mapLanguage(rawLang) : '';
      const langClass = mapped ? ` class="language-${escapeHtml(mapped)}"` : '';
      return `<pre><code${langClass}>${escapeHtml(extractText(node))}</code></pre>`;
    }

    case 'image': {
      const src = node.attrs?.src ?? '';
      const alt = node.attrs?.alt ?? '';
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
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
  const base = escapeHtml(text);
  if (!marks) return base;

  // If code mark exists, prefer escaped text inside <code>, ignoring other marks
  if (marks.some(m => m.type === 'code')) {
    return `<code>${base}</code>`;
  }

  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${acc}</strong>`;
      case 'italic':
        return `<em>${acc}</em>`;
      case 'strike':
        return `<s>${acc}</s>`;
      case 'link': {
        const href = mark.attrs?.href ?? '#';
        return `<a href="${escapeHtml(href)}">${acc}</a>`;
      }
      default:
        return acc;
    }
  }, base);
}
