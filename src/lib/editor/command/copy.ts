import { writeHtml } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Copy link as html link
 *
 * @param href
 * @param text
 */
export const copyLinkAsHtml = async (href: string, text: string): Promise<void> => {
  const html = `<a href="${href}">${text}</a>`;
  await writeHtml(html);
};
