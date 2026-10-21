import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, Suspense } from 'vue';

import WorkspaceSettingsPage from './WorkspaceSettingsPage.vue';

const { config, toast, publishResourceChanges } = vi.hoisted(() => ({
  config: {
    get: vi.fn(), mcpServerInfo: vi.fn(), regenerateMcpServerToken: vi.fn(),
    setAppWindowOpacity: vi.fn(), setGlobalShortcuts: vi.fn(),
    setSelectionCopyFormat: vi.fn(), setInboxIgnoreFileNames: vi.fn(),
  },
  toast: { add: vi.fn() },
  publishResourceChanges: vi.fn(),
}));
vi.mock('~/external/tauri/command', () => ({ command: { config } }));
vi.mock('~/resource-runtime/query-runtime', () => ({ publishResourceChanges }));
vi.mock('./useWorkspaceSettings', () => ({
  useWorkspaceSettings: () => ({
    hasWorkspaceContext: ref(false), currentWorkspace: ref(null), isWorkspaceLoading: ref(false),
    activePanel: ref('appearance'), isDeleteConfirmationOpen: ref(false),
    openDeleteConfirmation: vi.fn(), deleteWorkspace: vi.fn(), loadWorkspaceSettings: vi.fn(),
  }),
}));
vi.mock('~/resources/kanban/globalStatus', () => ({ loadGlobalStatusKanban: vi.fn() }));
vi.mock('~/app/features/memo-templates', () => ({ MemoTemplateManager: { template: '<div />' } }));
vi.mock('~/app/features/storage-settings', () => ({ StoragePathsForm: { template: '<div />' } }));
vi.mock('~/app/features/workspace-kanban/view/workspace-kanban/KanbanStatusManager.vue', () => ({ default: { template: '<div />' } }));

const initialConfig = {
  app_window_opacity: 0.8, focus_app_shortcut: 'Ctrl+A', new_memo_shortcut: 'Ctrl+N',
  inbox_ignore_file_names: ['desktop.ini'], selection_copy_format: 'html',
};
const wrappers: ReturnType<typeof mount>[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  config.get.mockResolvedValue({ ...initialConfig });
  config.mcpServerInfo.mockResolvedValue({ url: 'http://localhost/mcp/token', enabled: true, setup_complete: true });
  vi.stubGlobal('useTheme', () => ({ currentTheme: { config: { name: 'Light', description: '' } } }));
  vi.stubGlobal('useToast', () => toast);
  vi.stubGlobal('useRouter', () => ({}));
  vi.stubGlobal('useRoute', () => ({ query: {} }));
  vi.stubGlobal('usePageLoader', async (load: () => Promise<void>) => load());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  document.documentElement.style.removeProperty('--app-window-opacity');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const Card = defineComponent({ template: '<section><slot name="header" /><slot /><slot name="footer" /></section>' });
const Button = defineComponent({
  props: ['disabled', 'loading'], emits: ['click'],
  template: '<button :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
});
const Input = defineComponent({
  props: ['modelValue', 'disabled'], emits: ['update:modelValue'],
  template: '<input :disabled="disabled" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});
async function renderPage() {
  const wrapper = mount(defineComponent({
    setup: () => () => h(Suspense, null, { default: () => h(WorkspaceSettingsPage) }),
  }), { global: { stubs: {
    AppPageFrame: Card, AppCard: Card, UCard: Card, AppButton: Button, AppTextarea: Input,
    AppSelect: Input, ShortcutBuilder: Input, ThemeSelector: true, ConfirmModal: true, UIcon: true,
  } } });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
function button(wrapper: ReturnType<typeof mount>, text: string) {
  const found = wrapper.findAll('button').find(item => item.text() === text);
  if (!found) throw new Error('Missing button: ' + text);
  return found;
}

describe('settings page', () => {
  it('loads once, previews opacity without saving, and preserves drafts across panels', async () => {
    const wrapper = await renderPage();
    expect(config.get).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue('--app-window-opacity')).toBe('0.8');
    await wrapper.get('input[type=range]').setValue('0.6');
    expect(document.documentElement.style.getPropertyValue('--app-window-opacity')).toBe('0.6');
    expect(config.setAppWindowOpacity).not.toHaveBeenCalled();
    await button(wrapper, 'Editor').trigger('click');
    await wrapper.get('input').setValue('markdown');
    await button(wrapper, 'Appearance').trigger('click');
    expect((wrapper.get('input[type=range]').element as HTMLInputElement).value).toBe('0.6');
    config.setAppWindowOpacity.mockResolvedValue({ ...initialConfig, app_window_opacity: 0.65 });
    await button(wrapper, 'Save background opacity').trigger('click');
    await flushPromises();
    expect(config.setAppWindowOpacity).toHaveBeenCalledWith(0.6);
    expect(document.documentElement.style.getPropertyValue('--app-window-opacity')).toBe('0.65');
    await button(wrapper, 'Editor').trigger('click');
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('markdown');
    expect(button(wrapper, 'Save copy format').attributes('disabled')).toBeUndefined();
    expect(config.get).toHaveBeenCalledTimes(1);
  });

  it('keeps failed edits available for retry and releases the saving state', async () => {
    const wrapper = await renderPage();
    await button(wrapper, 'Editor').trigger('click');
    await wrapper.get('input').setValue('markdown');
    config.setSelectionCopyFormat.mockRejectedValueOnce(new Error('Unavailable'));
    await button(wrapper, 'Save copy format').trigger('click');
    await flushPromises();
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('markdown');
    expect(button(wrapper, 'Save copy format').attributes('disabled')).toBeUndefined();
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'Failed to save copy format.' }));
    config.setSelectionCopyFormat.mockResolvedValue({ ...initialConfig, selection_copy_format: 'markdown' });
    await button(wrapper, 'Save copy format').trigger('click');
    await flushPromises();
    expect(button(wrapper, 'Save copy format').attributes('disabled')).toBeDefined();
  });

  it('normalizes the ignore list and announces Inbox changes only after successful persistence', async () => {
    const wrapper = await renderPage();
    await button(wrapper, 'Files').trigger('click');
    // The input stub can emit multiline values without browser input sanitization.
    const field = wrapper.findAllComponents(Input)[0]!;
    field.vm.$emit('update:modelValue', ' b.tmp\n A.tmp\nB.TMP\n\n');
    await flushPromises();
    let finish!: (value: unknown) => void;
    config.setInboxIgnoreFileNames.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    await button(wrapper, 'Save ignore list').trigger('click');
    expect(config.setInboxIgnoreFileNames).toHaveBeenCalledWith(['A.tmp', 'B.TMP']);
    expect(publishResourceChanges).not.toHaveBeenCalled();
    finish({ ...initialConfig, inbox_ignore_file_names: ['A.tmp', 'B.TMP'] });
    await flushPromises();
    expect(publishResourceChanges).toHaveBeenCalledWith([{ type: 'inboxFileCollectionChanged' }]);
    expect(button(wrapper, 'Save ignore list').attributes('disabled')).toBeDefined();
  });
  it('saves the shortcut pair, accepts canonical values, and retains edits on failure', async () => {
    const wrapper = await renderPage();
    await button(wrapper, 'Shortcuts').trigger('click');
    const fields = wrapper.findAll('input');
    await fields[0]!.setValue(' Ctrl+B ');
    await fields[1]!.setValue('Ctrl+M');
    config.setGlobalShortcuts.mockRejectedValueOnce(new Error('Shortcut:Already registered'));
    await button(wrapper, 'Save shortcuts').trigger('click');
    await flushPromises();
    expect(config.setGlobalShortcuts).toHaveBeenCalledWith({
      focusAppShortcut: ' Ctrl+B ', newMemoShortcut: 'Ctrl+M',
    });
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Failed to save global shortcuts.', description: 'Already registered',
    }));
    expect(button(wrapper, 'Save shortcuts').attributes('disabled')).toBeUndefined();
    config.setGlobalShortcuts.mockResolvedValue({
      ...initialConfig, focus_app_shortcut: 'Ctrl+B', new_memo_shortcut: 'Ctrl+M',
    });
    await button(wrapper, 'Save shortcuts').trigger('click');
    await flushPromises();
    expect((fields[0]!.element as HTMLInputElement).value).toBe('Ctrl+B');
    expect(button(wrapper, 'Save shortcuts').attributes('disabled')).toBeDefined();
  });

  it('retains the opacity preview and does not change the saved baseline on failure', async () => {
    const wrapper = await renderPage();
    await wrapper.get('input[type=range]').setValue('0.5');
    config.setAppWindowOpacity.mockRejectedValueOnce(new Error('Unavailable'));
    await button(wrapper, 'Save background opacity').trigger('click');
    await flushPromises();
    expect(document.documentElement.style.getPropertyValue('--app-window-opacity')).toBe('0.5');
    expect(button(wrapper, 'Save background opacity').attributes('disabled')).toBeUndefined();
    await wrapper.get('input[type=range]').setValue('0.8');
    expect(button(wrapper, 'Save background opacity').attributes('disabled')).toBeDefined();
  });

  it('does not announce Inbox changes after a failed save', async () => {
    const wrapper = await renderPage();
    await button(wrapper, 'Files').trigger('click');
    await wrapper.get('input').setValue('new.tmp');
    config.setInboxIgnoreFileNames.mockRejectedValueOnce(new Error('Unavailable'));
    await button(wrapper, 'Save ignore list').trigger('click');
    await flushPromises();
    expect(publishResourceChanges).not.toHaveBeenCalled();
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('new.tmp');
    expect(button(wrapper, 'Save ignore list').attributes('disabled')).toBeUndefined();
  });

  it('copies the current MCP URL and requires restart only after successful regeneration', async () => {
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const wrapper = await renderPage();
    await button(wrapper, 'MCP').trigger('click');
    expect(wrapper.text()).toContain('Running inside this app');
    await button(wrapper, 'Copy URL').trigger('click');
    await flushPromises();
    expect(copy).toHaveBeenCalledWith('http://localhost/mcp/token');

    config.regenerateMcpServerToken.mockRejectedValueOnce(new Error('Unavailable'));
    await button(wrapper, 'Regenerate URL').trigger('click');
    await flushPromises();
    expect(wrapper.text()).not.toContain('Pending restart');
    expect(wrapper.text()).toContain('http://localhost/mcp/token');

    config.regenerateMcpServerToken.mockResolvedValue({
      url: 'http://localhost/mcp/new-token', enabled: true, setup_complete: true,
    });
    await button(wrapper, 'Regenerate URL').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Pending restart');
    expect(wrapper.text()).toContain('http://localhost/mcp/new-token');
    await button(wrapper, 'Appearance').trigger('click');
    await button(wrapper, 'MCP').trigger('click');
    expect(wrapper.text()).toContain('Pending restart');
    await button(wrapper, 'Copy URL').trigger('click');
    await flushPromises();
    expect(copy).toHaveBeenLastCalledWith('http://localhost/mcp/new-token');
    expect(config.mcpServerInfo).toHaveBeenCalledTimes(1);
  });

  it('reports initial loading failures and still renders the settings page', async () => {
    config.get.mockRejectedValueOnce(new Error('Unavailable'));
    config.mcpServerInfo.mockRejectedValueOnce(new Error('Unavailable'));
    const wrapper = await renderPage();
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Failed to load appearance settings.', color: 'error',
    }));
    await button(wrapper, 'MCP').trigger('click');
    expect(wrapper.text()).toContain('Failed to load MCP server info.');
  });
});
