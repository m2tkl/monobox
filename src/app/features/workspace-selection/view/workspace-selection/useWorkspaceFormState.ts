import { computed, reactive } from 'vue';

import type { FormError } from '@nuxt/ui';

type State = { name?: string };
type ValidatedState = { name: string };

export function useWorkspaceFormState() {
  const state = reactive<State>({
    name: undefined,
  });

  const validate = (state: State): FormError[] => {
    const errors: FormError[] = [];
    if (!state.name) errors.push({ name: 'name', message: 'Workspace name is required.' });
    return errors;
  };

  const isValid = computed(() => {
    return !!state.name;
  });

  const getValidatedState = (): ValidatedState | null => {
    return isValid.value ? { name: state.name! } : null;
  };

  const reset = () => {
    state.name = undefined;
  };

  return {
    state,
    isValid,
    getValidatedState,
    validate,
    reset,
  };
}
