type JSONContent = {
  type: string;
  content?: JSONContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, Record<string, unknown>>;
};

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
      const level = node.attrs?.level ?? 1;
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
