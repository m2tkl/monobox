/**
 * Copy link as html link
 *
 * @param href
 * @param text
 */
export const copyLinkAsHtml = async (href: string, text: string): Promise<void> => {
  const html = `<a href="${href}">${text}</a>`;
  navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
    }),
  ]);
};
