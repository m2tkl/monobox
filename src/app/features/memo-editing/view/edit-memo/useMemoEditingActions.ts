import {
  useMemoEditingClipboardActions,
  type UseMemoEditingClipboardActionsDeps,
} from './useMemoEditingClipboardActions';
import {
  useMemoEditingEditorActions,
  type UseMemoEditingEditorActionsDeps,
} from './useMemoEditingEditorActions';
import {
  useMemoEditingExportActions,
  type UseMemoEditingExportActionsDeps,
} from './useMemoEditingExportActions';
import {
  useMemoEditingPageActions,
  type UseMemoEditingPageActionsDeps,
} from './useMemoEditingPageActions';

import type { ActionResult, MemoEditingAction } from './memoEditingAction';

type UseMemoEditingActionsDeps = {
  clipboard: UseMemoEditingClipboardActionsDeps;
  editor: UseMemoEditingEditorActionsDeps;
  export: UseMemoEditingExportActionsDeps;
  page: UseMemoEditingPageActionsDeps;
};

export function useMemoEditingActions(options: UseMemoEditingActionsDeps) {
  const clipboardActions = useMemoEditingClipboardActions(options.clipboard);
  const editorActions = useMemoEditingEditorActions(options.editor);
  const exportActions = useMemoEditingExportActions(options.export);
  const pageActions = useMemoEditingPageActions(options.page);
  const toast = useToast();

  const notifyActionResult = (action: MemoEditingAction, result: ActionResult) => {
    if (result.ok && result.silent) {
      return;
    }

    if (result.ok) {
      switch (action.type) {
        case 'action/export-markdown':
          toast.add({ title: 'Exported markdown.', icon: iconKey.success, duration: 1000 });
          return;
        case 'action/copy-selected-text':
          toast.add({ title: action.format === 'markdown' ? 'Copied markdown.' : 'Copied HTML.', icon: iconKey.success, duration: 1000 });
          return;
        case 'action/copy-link-to-heading':
          toast.add({ title: 'Copied link to heading.', icon: iconKey.success, duration: 1000 });
          return;
        default:
          return;
      }
    }

    switch (action.type) {
      case 'action/export-markdown':
      case 'action/copy-selected-text':
      case 'action/copy-link-to-heading':
      case 'action/toggle-bookmark':
        toast.add({
          title: 'Failed to complete action.',
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
        return;
      case 'action/open-selected-image-preview':
        window.alert('Failed to find preview target.');
        return;
      default:
        return;
    }
  };

  const dispatchAction = async (action: MemoEditingAction): Promise<ActionResult> => {
    const result = await (async (): Promise<ActionResult> => {
      switch (action.type) {
        case 'action/toggle-bookmark':
          return pageActions.toggleBookmark();
        case 'action/open-slide-mode':
          return pageActions.openSlideMode();
        case 'action/export-markdown':
          return clipboardActions.exportMarkdown();
        case 'action/export-with-linked-pages':
          return exportActions.openExportTargetSelection();
        case 'action/start-image-alt-editing':
          return editorActions.startImageAltEditing();
        case 'action/open-selected-image-preview':
          return editorActions.openSelectedImagePreview();
        case 'action/open-link-palette':
          return editorActions.openLinkPalette();
        case 'action/start-link-editing':
          return editorActions.startLinkEditing();
        case 'action/unset-link':
          return editorActions.unsetLink();
        case 'action/toggle-editor-style':
          return editorActions.toggleEditorStyle(action.style);
        case 'action/toggle-inline-code':
          return editorActions.toggleInlineCode();
        case 'action/reset-editor-style':
          return editorActions.resetEditorStyle();
        case 'action/copy-selected-text':
          return clipboardActions.copySelected(action.format);
        case 'action/copy-link-to-heading':
          return clipboardActions.copyLinkToHeading(action.fullUrl, action.titleWithHeading);
      }
    })();

    notifyActionResult(action, result);
    return result;
  };

  return {
    dispatchAction,
  };
}
