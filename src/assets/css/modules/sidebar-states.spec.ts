import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const utilitiesCss = readFileSync(
  resolve(process.cwd(), 'src/assets/css/modules/utilities.css'),
  'utf8',
);
const sidebarMenu = readFileSync(
  resolve(process.cwd(), 'src/app/scaffold/SidebarMenu/Index.vue'),
  'utf8',
);
const titleBar = readFileSync(
  resolve(process.cwd(), 'src/app/scaffold/TitleBar.vue'),
  'utf8',
);
const appButtonGroup = readFileSync(
  resolve(process.cwd(), 'src/app/elements/AppButtonGroup.vue'),
  'utf8',
);
const appShell = readFileSync(
  resolve(process.cwd(), 'src/app/scaffold/AppShell.vue'),
  'utf8',
);
const focusMenu = readFileSync(
  resolve(process.cwd(), 'src/app/features/focus-memo/FocusMenu.vue'),
  'utf8',
);
const memoEditing = readFileSync(
  resolve(process.cwd(), 'src/app/features/memo-editing/MemoEditing.vue'),
  'utf8',
);
const bookmarkButton = readFileSync(
  resolve(process.cwd(), 'src/app/features/memo-editing/view/bookmark-memo/BookmarkButton.vue'),
  'utf8',
);
const workspaceSwitcher = readFileSync(
  resolve(process.cwd(), 'src/app/scaffold/SidebarMenu/WorkspaceSwitcher.vue'),
  'utf8',
);
const workspaceFocusPage = readFileSync(
  resolve(process.cwd(), 'src/pages/workspace-focus.vue'),
  'utf8',
);
const memoBrowsing = readFileSync(
  resolve(process.cwd(), 'src/app/features/memo-browsing/view/memo-browsing/useMemoBrowsing.ts'),
  'utf8',
);
const openPagesList = readFileSync(
  resolve(process.cwd(), 'src/app/features/open-pages/OpenPagesList.vue'),
  'utf8',
);

describe('sidebar item states', () => {
  it('uses the shared neutral hover and active surfaces across sidebar links', () => {
    expect(utilitiesCss).toMatch(
      /\.sidebar-link:hover\s*{[^}]*var\(--color-sidebar-item-hover\)/s,
    );
    expect(utilitiesCss).toMatch(
      /\.sidebar-link\.is-active\s*{[^}]*var\(--color-sidebar-item-active\)/s,
    );
    expect(sidebarMenu).toMatch(
      /sidebar-primary-link--active[\s\S]*?background: var\(--color-sidebar-item-active\)/,
    );
  });

  it('places Settings in the sidebar footer instead of the title bar', () => {
    expect(sidebarMenu).toMatch(/class="sidebar-footer border-top pt-2 pb-2"[\s\S]*?class="sidebar-action sidebar-link"[\s\S]*?class="sidebar-action-label">Settings<\/span>/);
    expect(titleBar).not.toContain('aria-label="Settings"');
  });

  it('places the theme toggle beside Settings in the sidebar footer', () => {
    expect(sidebarMenu).toMatch(/class="sidebar-footer-actions"[\s\S]*?Settings<\/span>[\s\S]*?<ThemeToggle \/>/);
    expect(titleBar).not.toContain('<ThemeToggle');
  });

  it('places the workspace switcher in the sidebar and Home beside the omnibox', () => {
    expect(sidebarMenu).toMatch(/<WorkspaceSwitcher \/>[\s\S]*?class="sidebar-primary-nav"[\s\S]*?<OpenPagesList/);
    expect(workspaceSwitcher).toMatch(/class="workspace-switcher__name"[\s\S]*?workspaceName \|\| workspaceSlug/);
    expect(workspaceSwitcher).toMatch(/:name="iconKey\.chevronDown"/);
    expect(workspaceSwitcher).not.toContain(':label="workspaceName || workspaceSlug"');
    expect(workspaceSwitcher).toMatch(/class="workspace-switcher__content"/);
    expect(workspaceSwitcher).toMatch(/\.workspace-switcher__content\s*{[^}]*width: 100%;[^}]*justify-content: flex-start;/s);
    expect(workspaceSwitcher).toMatch(/:deep\(\.workspace-switcher__trigger\)\s*{[^}]*padding: 0\.25rem 0\.5rem;/s);
    expect(workspaceSwitcher).toMatch(/\.workspace-switcher__name\s*{[^}]*font-size: 1rem;/s);
    expect(titleBar).not.toContain(':label="workspaceName"');
    expect(titleBar).toMatch(/class="titlebar-home"[\s\S]*?:icon="iconKey\.home"/);
    expect(titleBar).toMatch(/goHome[\s\S]*?standaloneWorkspaceUrl\.value[\s\S]*?openOrActivatePageTab\(slug, NEW_TAB_PAGE\)[\s\S]*?resetActiveTab\(slug\)/);
  });

  it('routes Back and Forward through the active tab history', () => {
    expect(titleBar).toMatch(/openPagesStore\.goBack\(workspaceSlug\.value\)/);
    expect(titleBar).toMatch(/openPagesStore\.goForward\(workspaceSlug\.value\)/);
    expect(titleBar).toMatch(
      /class="titlebar-home"[\s\S]*?aria-label="Back"[\s\S]*?aria-label="Forward"[\s\S]*?aria-label="Home"/,
    );
  });

  it('groups Back and Forward while keeping Home separate', () => {
    expect(appButtonGroup).toContain('<UButtonGroup');
    expect(titleBar).toMatch(
      /<AppButtonGroup[\s\S]*?aria-label="Back"[\s\S]*?aria-label="Forward"[\s\S]*?<\/AppButtonGroup>[\s\S]*?aria-label="Home"/,
    );
    expect(titleBar).not.toMatch(/<AppButtonGroup[\s\S]*?aria-label="Home"[\s\S]*?<\/AppButtonGroup>/);
    expect(titleBar).toMatch(
      /\.titlebar-navigation-group\s*{[^}]*border: 1px solid var\(--color-border-light\);/s,
    );
    expect(titleBar).toMatch(
      /\.titlebar-navigation-group\s*{[^}]*overflow: hidden;/s,
    );
    expect(titleBar).toMatch(
      /\.titlebar-navigation-group\s*{[^}]*background: transparent;/s,
    );
  });

  it('renders the omnibox title from the active tab instead of the previous route', () => {
    expect(titleBar).toMatch(/const activeTabTitle = computed/);
    expect(titleBar).toMatch(/\{\{ activeTabTitle \}\}/);
    expect(titleBar).not.toContain('{{ memoTitleSlug || \'Search or open a page\' }}');
  });

  it('renders an internal URL for standalone workspace views instead of the previous tab title', () => {
    expect(titleBar).toMatch(/const standaloneWorkspaceUrl = computed\(\(\) => getStandaloneWorkspaceViewUrl/);
    expect(titleBar).toMatch(/standaloneWorkspaceUrl\.value \?\? activeTab\.value\?\.title/);
    expect(titleBar).toMatch(/standaloneWorkspaceUrl\.value \? '' :/);
    expect(titleBar).toMatch(/standaloneWorkspaceUrl\.value\s*\? false\s*:\s*openPagesStore\.canGoBack/);
    expect(titleBar).toMatch(/standaloneWorkspaceUrl\.value\s*\? false\s*:\s*openPagesStore\.canGoForward/);
  });

  it('lets the page-title field fill the space while reserving the right-side toolbar actions', () => {
    expect(titleBar).toMatch(
      /\.titlebar-main\s*{[^}]*display: grid;[^}]*grid-template-columns: auto minmax\(0, 1fr\) auto;/s,
    );
    expect(titleBar).toMatch(
      /\.titlebar-actions\s*{[^}]*grid-column: 3;/s,
    );
  });

  it('uses compact spacing around the omnibox and its neighboring actions', () => {
    expect(titleBar).toMatch(/\.titlebar-home\s*{[^}]*gap: 0\.375rem;/s);
    expect(titleBar).toMatch(/\.titlebar-main\s*{[^}]*gap: 0\.25rem;/s);
    expect(titleBar).toMatch(/\.titlebar-actions\s*{[^}]*gap: 0\.125rem;/s);
    expect(titleBar).not.toContain('titlebar-focus-action');
  });

  it('uses a compact round bookmark hit area without shrinking the star', () => {
    expect(bookmarkButton).toContain('class="bookmark-button size-6 min-w-6');
    expect(bookmarkButton).not.toContain('leadingIcon');
    expect(titleBar).toMatch(
      /\.titlebar-omnibox\s*{[^}]*padding-right: 0\.375rem;/s,
    );
  });

  it('tightens the leading navigation inset and separates Home without a vertical line', () => {
    expect(titleBar).toMatch(
      /\.titlebar-main\s*{[^}]*gap: 0\.25rem;[^}]*padding: 0 1rem 0 0\.5rem;/s,
    );
    expect(titleBar).not.toContain('>|</span>');
  });

  it('keeps the Focus menu component available without rendering it in the title bar', () => {
    expect(titleBar).not.toContain('<FocusMenu');
    expect(titleBar).not.toContain('toggleFocusSidebar');
    expect(focusMenu).toMatch(/focus-menu-count[\s\S]*?activeItems\.length/);
    expect(focusMenu).toMatch(/<FocusSidebar[\s\S]*?:is-open="true"/);
    expect(appShell).not.toContain('<FocusSidebar');
    expect(appShell).not.toContain('focus-sidebar-hover-zone');
    expect(appShell).not.toContain('floating-focus-sidebar');
  });

  it('places reorderable workspace actions above the memo tabs without title-bar Focus', () => {
    expect(sidebarMenu).toMatch(
      /class="sidebar-primary-nav"[\s\S]*?v-for="action in orderedActions"[\s\S]*?<OpenPagesList/,
    );
    expect(sidebarMenu).not.toContain('<FocusMenu');
    expect(sidebarMenu).toContain('FOCUS_PAGE');
    expect(sidebarMenu).toContain('BOOKMARKS_PAGE');
    expect(sidebarMenu).toContain('KANBAN_PAGE');
    expect(sidebarMenu).toContain('FILES_PAGE');
    expect(sidebarMenu).toContain('CALENDAR_PAGE');
    expect(sidebarMenu).toContain('reorderSidebarActions');
    expect(sidebarMenu).not.toContain('openOrActivatePageTab');
    expect(titleBar).not.toContain('<FocusMenu');
    expect(titleBar).not.toContain('<BookmarkMenu');
  });

  it('shows the active Focus count on the action but not on the Focus tab', () => {
    expect(sidebarMenu).toMatch(
      /action\.key === 'focus'[\s\S]*?#trailing[\s\S]*?activeFocusCount/,
    );
    expect(sidebarMenu).toContain('useFocusListReadModel');
    expect(openPagesList).not.toContain(':count=');
  });

  it('separates workspace actions from memo tabs with a divider', () => {
    expect(sidebarMenu).toMatch(
      /\.sidebar-primary-nav\s*{[^}]*border-bottom: 1px solid var\(--color-border-light\);[^}]*margin-bottom: 0\.25rem;[^}]*padding: 0\.375rem 0 0\.625rem;/s,
    );
  });

  it('opens Focus as a filtered memo page instead of a sidebar popover', () => {
    expect(workspaceFocusPage).toContain('path: \'/:workspace/_focus\'');
    expect(workspaceFocusPage).toContain('<MemoBrowsing />');
    expect(memoBrowsing).toContain('route.path.endsWith(\'/_focus\')');
    expect(memoBrowsing).toContain('return \'Focus\'');
  });

  it('does not render Kanban status items or previews in the sidebar', () => {
    expect(sidebarMenu).not.toContain('globalStatuses');
    expect(sidebarMenu).not.toContain('<KanbanStatusPreview');
    expect(sidebarMenu).not.toContain('kanban-status-preview-anchor');
  });

  it('keeps Random memo in the title-bar actions without Focus', () => {
    expect(titleBar).toMatch(
      /class="titlebar-actions"[\s\S]*?:icon="iconKey\.shuffle"[\s\S]*?aria-label="Random memo"/,
    );
    expect(titleBar).not.toContain('<FocusMenu');
    expect(titleBar).not.toMatch(/<template #actions[\s\S]*?>\s*Random memo\s*<\/AppButton>/);
  });

  it('places the bookmark star inside the page-title field instead of the editor toolbar', () => {
    expect(titleBar).toMatch(/class="titlebar-omnibox"[\s\S]*?<BookmarkButton/);
    expect(memoEditing).not.toContain('aria-label="Bookmark"');
  });

  it('uses one hover surface for the omnibox and a round bookmark button without shortcut text', () => {
    expect(titleBar).not.toContain('<AppKbd');
    expect(titleBar).toMatch(
      /\.titlebar-omnibox:has\(\.titlebar-omnibox__search:hover\),\s*\.titlebar-omnibox:has\(\.titlebar-omnibox__search:focus-visible\)\s*{[^}]*background: var\(--color-surface-hover\);/s,
    );
    expect(titleBar).not.toContain('.titlebar-omnibox:focus-within');
    expect(titleBar).toMatch(
      /:deep\(\.titlebar-omnibox__search:hover\)[\s\S]*?background: transparent;/,
    );
    expect(bookmarkButton).toMatch(
      /\.bookmark-button\s*{[^}]*border-radius: 9999px;/s,
    );
  });
});
