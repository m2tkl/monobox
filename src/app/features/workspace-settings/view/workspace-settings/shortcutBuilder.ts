export type ShortcutModel = {
  modifier: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
};

const modifierAliases = new Set(['commandorcontrol', 'ctrl', 'control', 'cmd', 'command', 'meta', 'super']);
const altAliases = new Set(['alt', 'option']);
const shiftAliases = new Set(['shift']);

export const parseShortcut = (shortcut: string): ShortcutModel => {
  const model: ShortcutModel = {
    modifier: false,
    alt: false,
    shift: false,
    key: '',
  };

  for (const token of shortcut.split('+').map(part => part.trim()).filter(Boolean)) {
    const normalizedToken = token.toLowerCase();
    if (modifierAliases.has(normalizedToken)) {
      model.modifier = true;
    }
    else if (altAliases.has(normalizedToken)) {
      model.alt = true;
    }
    else if (shiftAliases.has(normalizedToken)) {
      model.shift = true;
    }
    else {
      model.key = normalizeShortcutKey(token);
    }
  }

  return model;
};

export const buildShortcut = (model: ShortcutModel): string => {
  const parts = [
    model.modifier ? 'CommandOrControl' : '',
    model.alt ? 'Alt' : '',
    model.shift ? 'Shift' : '',
    normalizeShortcutKey(model.key),
  ].filter(Boolean);

  return parts.join('+');
};

export const normalizeShortcutKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length === 1) return trimmed.toUpperCase();

  const lower = trimmed.toLowerCase();
  if (lower === ' ') return 'Space';
  if (lower === 'esc') return 'Escape';
  if (lower === 'return') return 'Enter';
  if (lower.startsWith('arrow')) {
    return `Arrow${lower.slice('arrow'.length, 'arrow'.length + 1).toUpperCase()}${lower.slice('arrow'.length + 1)}`;
  }
  if (/^f\d{1,2}$/i.test(trimmed)) return trimmed.toUpperCase();

  return trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1);
};

export const shortcutKeyFromKeyboardEvent = (event: KeyboardEvent): string | null => {
  if (event.isComposing) return null;
  if (['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) return null;
  if (event.key === 'Backspace' || event.key === 'Delete') return '';
  if (event.key === ' ') return 'Space';
  if (event.key.length === 1) return event.key.toUpperCase();
  return normalizeShortcutKey(event.key);
};
