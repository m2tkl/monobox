/**
 * buildSlidesFromHtml — Design notes (background & rationale)
 *
 * Goals
 * - Purity & portability: avoid touching the global DOM (window/document) so the function runs in
 *   browsers, SSR, jsdom/happy-dom without branching.
 * - Determinism & testability: treat input HTML as data, return HTML as data; inject a Document factory
 *   so tests can supply their own DOM implementation.
 * - Single-pass splitting: iterate once over top-level nodes to build <section> blocks efficiently.
 *
 * Why we do NOT use `instanceof HTMLElement`
 * - `doc.defaultView` may be null in some environments (e.g., jsdom, happy-dom), so
 *   `doc.defaultView.HTMLElement` can throw.
 * - Cross‑realm checks (different windows/iframes/parser contexts) make `instanceof` unreliable because
 *   constructors differ by realm.
 * - Using numeric `nodeType` constants (1 = ELEMENT_NODE, 3 = TEXT_NODE) is stable across environments.
 *
 * Splitting rules
 * - Split on headings H1–H6 (configurable via `breakOnHeadingLevels`). A heading starts a new <section>.
 * - Split on <hr> (configurable). After an <hr>, the next slide optionally repeats the last heading as a
 *   chapter title to preserve context (`needChapterOnNextSlide`).
 * - Bare text nodes are wrapped into <p> so that top-level text content does not get lost.
 *
 * Safety & mutation model
 * - Work inside an isolated Document created via the injected factory; never reference the global
 *   document/window. This keeps the function side‑effect‑free.
 * - Clone nodes when appending into sections to avoid mutating or moving nodes out of the wrapper.
 *
 * Extensibility
 * - `SlideSplitConfig` allows changing split triggers without altering the algorithm.
 * - `createDoc` lets callers provide a custom DOM (e.g., for SSR or stricter HTML parsing).
 */
export type SlideSplitConfig = {
  breakOnHeadingLevels: number[]; // e.g. [1,2,3,4,5,6]
  breakOnHorizontalRule: boolean; // <hr>
};

const defaultConfig: SlideSplitConfig = {
  breakOnHeadingLevels: [1, 2, 3, 4, 5, 6],
  breakOnHorizontalRule: true,
};

/**
 * Pure transformation function:
 * - Does not reference global document/window
 * - Takes given HTML, splits it, and returns a set of <section>…</section> HTML fragments
 */
export function buildSlidesFromHtml(
  fullHtml: string,
  cfg: SlideSplitConfig = defaultConfig,
  createDoc: () => Document = () => {
    // Use a fresh, isolated Document (works in browsers and test environments: jsdom/happy-dom)
    const doc = new DOMParser().parseFromString('<div data-root></div>', 'text/html');
    return doc;
  },
): string {
  const doc = createDoc();

  // Parse into an isolated wrapper; all processing stays scoped to this Document
  const wrapper = doc.createElement('div');
  wrapper.innerHTML = fullHtml;

  const sections: HTMLElement[] = [];
  let current: HTMLElement | null = null;
  let lastHeadingEl: HTMLElement | null = null;
  let needChapterOnNextSlide = false;

  const nodes = Array.from(wrapper.childNodes);
  // Cross‑realm safe node identification: prefer numeric nodeType over instanceof
  const ELEMENT_NODE = 1; // Node.ELEMENT_NODE
  const TEXT_NODE = 3; // Node.TEXT_NODE
  for (const node of nodes) {
    if (node.nodeType !== ELEMENT_NODE) {
      if (node.nodeType === TEXT_NODE && node.textContent?.trim()) {
        // Wrap text nodes into <p>
        const p = doc.createElement('p');
        p.textContent = node.textContent || '';
        if (!current) current = doc.createElement('section');
        current.appendChild(p);
      }
      continue;
    }

    // Safe cast: nodeType === ELEMENT_NODE guarantees this is an Element
    const el = node as HTMLElement;

    // Split slides on <hr>
    if (el.tagName === 'HR' && cfg.breakOnHorizontalRule) {
      if (current) sections.push(current);
      current = null;
      needChapterOnNextSlide = true;
      continue;
    }

    // Split slides on headings
    const m = /^H([1-6])$/.exec(el.tagName);
    if (m) {
      const level = Number(m[1]);
      if (cfg.breakOnHeadingLevels.includes(level)) {
        if (current) sections.push(current);
        current = doc.createElement('section');
        lastHeadingEl = el.cloneNode(true) as HTMLElement;
        needChapterOnNextSlide = false;
        current.appendChild(lastHeadingEl.cloneNode(true));
        continue;
      }
    }

    if (!current) {
      current = doc.createElement('section');
      if (needChapterOnNextSlide && lastHeadingEl) {
        // Insert heading as chapter title on next slide if needed
        const tag = (lastHeadingEl.tagName || 'H2').toLowerCase();
        const chapter = doc.createElement(tag);
        chapter.textContent = lastHeadingEl.textContent || '';
        current.appendChild(chapter);
        needChapterOnNextSlide = false;
      }
    }
    current.appendChild(el.cloneNode(true) as HTMLElement);
  }

  if (current) sections.push(current);

  const container = doc.createElement('div');
  // Serialize sections by letting the container build innerHTML from cloned nodes
  for (const sec of sections) container.appendChild(sec);
  return container.innerHTML;
}
