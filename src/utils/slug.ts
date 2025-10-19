/**
 * Custom encode for memo title
 *
 * NOTE:
 *   When including the title in a path, ensure it is further encoded using `encodeURIComponent`.
 *   When including it in the body, no additional encoding is necessary as it is not part of a URI.
 */
export const encodeForSlug = (title: string) => {
  // Replace space to '_'
  const titleEncodedSpace = title.replaceAll(' ', '_');

  // Percent-encode disallowed/unsafe symbols (not replace with '_')
  // e.g. ": ; ` / : @ & = + $ , < > # % { } | ^ ~ [ ] \\ ?
  const charsToReplace = /["`;/:@&=+$,<>#%{}|^~[\]?]/g;
  const titleEncodedOnlySybols = titleEncodedSpace.replace(charsToReplace, char => encodeURIComponent(char));
  return titleEncodedOnlySybols;
};
