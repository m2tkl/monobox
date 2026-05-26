// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

import { buildSlidesFromHtml, type SlideSplitConfig } from './buildSlidesFromHtml';

function sectionsFrom(html: string): HTMLElement[] {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root')!;
  return Array.from(root.querySelectorAll('section')) as HTMLElement[];
}

describe('buildSlidesFromHtml', () => {
  it('returns empty string for empty input', () => {
    const out = buildSlidesFromHtml('');
    expect(out).toBe('');
  });

  it('splits slides on headings and includes the heading', () => {
    const input = `
      <h1>Title</h1>
      <p>Intro</p>
      <h2>Next</h2>
      <p>More</p>
    `;
    const out = buildSlidesFromHtml(input);
    const sections = sectionsFrom(out);
    expect(sections.length).toBe(2);
    expect(sections[0].querySelector('h1')?.textContent).toBe('Title');
    expect(sections[0].querySelector('p')?.textContent).toBe('Intro');
    expect(sections[1].querySelector('h2')?.textContent).toBe('Next');
    expect(sections[1].querySelector('p')?.textContent).toBe('More');
  });

  it('splits on <hr> and repeats last heading on the following slide', () => {
    const input = `
      <h2>Chapter</h2>
      <p>A</p>
      <hr>
      <p>B</p>
    `;
    const out = buildSlidesFromHtml(input);
    const sections = sectionsFrom(out);
    expect(sections.length).toBe(2);
    // First slide: heading + paragraph A
    expect(sections[0].querySelector('h2')?.textContent).toBe('Chapter');
    expect(sections[0].querySelector('p')?.textContent).toBe('A');
    // Second slide: repeated heading (chapter) + paragraph B
    const h2 = sections[1].querySelector('h2');
    expect(h2?.textContent).toBe('Chapter');
    // Ensure the paragraph B is present
    expect(Array.from(sections[1].querySelectorAll('p')).some(p => p.textContent === 'B')).toBe(true);
  });

  it('wraps top-level text nodes into <p>', () => {
    const input = `
      Text before
      <h2>H</h2>
      Text after
    `;
    const out = buildSlidesFromHtml(input);
    const sections = sectionsFrom(out);
    // Expect 2 slides: one for initial text, one for H2 + following text
    expect(sections.length).toBe(2);
    expect(sections[0].querySelector('p')?.textContent?.trim()).toBe('Text before');
    // Second slide should include H2 and a wrapped paragraph for trailing text
    expect(sections[1].querySelector('h2')?.textContent).toBe('H');
    const ps = sections[1].querySelectorAll('p');
    expect(Array.from(ps).some(p => p.textContent?.trim() === 'Text after')).toBe(true);
  });

  it('ignores whitespace-only text nodes', () => {
    const input = '\n\n  \n  <h1>T</h1>  \n  \n';
    const out = buildSlidesFromHtml(input);
    const sections = sectionsFrom(out);
    expect(sections.length).toBe(1);
    expect(sections[0].querySelector('h1')?.textContent).toBe('T');
  });

  it('respects custom breakOnHeadingLevels config', () => {
    const cfg: SlideSplitConfig = { breakOnHeadingLevels: [2], breakOnHorizontalRule: true };
    const input = `
      <h1>H1</h1>
      <p>a</p>
      <h2>H2</h2>
      <p>b</p>
    `;
    const out = buildSlidesFromHtml(input, cfg);
    const sections = sectionsFrom(out);
    // H1 does not break; first slide should contain H1+p and stop at H2
    expect(sections.length).toBe(2);
    expect(sections[0].querySelector('h1')?.textContent).toBe('H1');
    expect(Array.from(sections[0].querySelectorAll('p')).some(p => p.textContent === 'a')).toBe(true);
    // Second slide starts at H2
    expect(sections[1].querySelector('h2')?.textContent).toBe('H2');
    expect(Array.from(sections[1].querySelectorAll('p')).some(p => p.textContent === 'b')).toBe(true);
  });
});
