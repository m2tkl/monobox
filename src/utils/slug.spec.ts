import { describe, it, expect } from 'vitest';

import { encodeForSlug } from './slug';

describe('encodeForSlug', () => {
  it('returns empty string as is', () => {
    expect(encodeForSlug('')).toBe('');
  });

  it('replaces spaces with underscores', () => {
    expect(encodeForSlug('hello world')).toBe('hello_world');
    expect(encodeForSlug('  lead and trail  ')).toBe('__lead_and_trail__');
    expect(encodeForSlug('multi  space')).toBe('multi__space');
  });

  it('percent-encodes disallowed symbols', () => {
    expect(encodeForSlug('C# basics')).toBe('C%23_basics');
    expect(encodeForSlug('100% ready')).toBe('100%25_ready');
    expect(encodeForSlug('path/to/file')).toBe('path%2Fto%2Ffile');
    expect(encodeForSlug('A&B=C?')).toBe('A%26B%3DC%3F');
    expect(encodeForSlug('"quote"')).toBe('%22quote%22');
    expect(encodeForSlug('<tag>,{obj}|x^y~z')).toBe('%3Ctag%3E%2C%7Bobj%7D%7Cx%5Ey~z');
  });

  it('keeps non-ASCII characters (only spaces replaced)', () => {
    expect(encodeForSlug('こんにちは 世界')).toBe('こんにちは_世界');
  });

  it('returns input when no changes needed', () => {
    expect(encodeForSlug('simple')).toBe('simple');
    expect(encodeForSlug('under_score')).toBe('under_score');
  });
});
