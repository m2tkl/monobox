import { describe, expect, it } from 'vitest';

import { buildHeadingHref, buildHeadingLinkText, decodeHeadingHash } from './headingLink';

describe('headingLink', () => {
  it('encodes heading ids in hrefs but keeps link text readable', () => {
    expect(buildHeadingHref('/workspace/memo', '日本語 見出し')).toBe('/workspace/memo#%E6%97%A5%E6%9C%AC%E8%AA%9E%20%E8%A6%8B%E5%87%BA%E3%81%97');
    expect(buildHeadingLinkText('/workspace/memo', '日本語 見出し')).toBe('/workspace/memo#日本語 見出し');
  });

  it('decodes encoded heading hashes and tolerates malformed hashes', () => {
    expect(decodeHeadingHash('#%E6%97%A5%E6%9C%AC%E8%AA%9E')).toBe('日本語');
    expect(decodeHeadingHash('#%E0%A4%A')).toBe('%E0%A4%A');
  });
});
