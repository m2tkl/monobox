export function buildHeadingHref(routePath: string, headingId: string): string {
  return `${routePath}#${encodeURIComponent(headingId)}`;
}

export function buildHeadingLinkText(routePath: string, headingText: string): string {
  return `${routePath}#${headingText}`;
}

export function decodeHeadingHash(hash: string): string {
  const rawHash = hash.replace(/^#/, '');
  try {
    return decodeURIComponent(rawHash);
  }
  catch {
    return rawHash;
  }
}
