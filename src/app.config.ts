export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'rounded-[calc(var(--ui-radius)*1.5)] font-medium inline-flex items-center justify-center focus:outline-hidden disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60 transition-colors',
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary)] aria-disabled:bg-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'ring ring-inset ring-[var(--color-primary)]/35 text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary-light)]/35 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        },
        {
          color: 'primary',
          variant: 'soft',
          class: 'text-[var(--color-primary)] bg-[var(--color-primary-light)]/55 ring ring-inset ring-[var(--color-primary)]/15 hover:bg-[var(--color-primary-light)]/75 hover:ring-[var(--color-primary)]/25 focus-visible:bg-[var(--color-primary-light)]/75 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35',
        },
        {
          color: 'primary',
          variant: 'subtle',
          class: 'text-[var(--color-primary)] ring ring-inset ring-[var(--color-primary)]/25 bg-[var(--color-primary-light)]/40 hover:bg-[var(--color-primary-light)]/65 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        },
        {
          color: 'primary',
          variant: 'ghost',
          class: 'text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/45 focus-visible:bg-[var(--color-primary-light)]/45',
        },
        {
          color: 'primary',
          variant: 'link',
          class: 'text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] p-0',
        },
        {
          color: 'neutral',
          variant: 'solid',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] ring ring-inset ring-[var(--color-border-light)]',
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: 'text-[var(--color-text-primary)] bg-transparent ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'neutral',
          variant: 'soft',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-active)] hover:ring-[var(--color-border-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface)] ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] hover:ring-[var(--color-border-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'neutral',
          variant: 'ghost',
          class: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'neutral',
          variant: 'link',
          class: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-0',
        },
        {
          color: 'secondary',
          variant: 'solid',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] ring ring-inset ring-[var(--color-border-light)]',
        },
        {
          color: 'secondary',
          variant: 'outline',
          class: 'text-[var(--color-text-secondary)] bg-transparent ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)]',
        },
        {
          color: 'secondary',
          variant: 'soft',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-active)] hover:ring-[var(--color-border-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'secondary',
          variant: 'subtle',
          class: 'text-[var(--color-text-primary)] bg-[var(--color-surface)] ring ring-inset ring-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] hover:ring-[var(--color-border-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'secondary',
          variant: 'ghost',
          class: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]',
        },
        {
          color: 'secondary',
          variant: 'link',
          class: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-0',
        },
        {
          color: 'success',
          variant: 'solid',
          class: 'text-white bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600',
        },
        {
          color: 'success',
          variant: 'outline',
          class: 'text-emerald-700 ring ring-inset ring-emerald-600/35 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
        },
        {
          color: 'success',
          variant: 'soft',
          class: 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
        },
        {
          color: 'success',
          variant: 'subtle',
          class: 'text-emerald-700 ring ring-inset ring-emerald-600/25 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
        },
        {
          color: 'success',
          variant: 'ghost',
          class: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
        },
        {
          color: 'success',
          variant: 'link',
          class: 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 p-0',
        },
        {
          color: 'info',
          variant: 'solid',
          class: 'text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600',
        },
        {
          color: 'info',
          variant: 'outline',
          class: 'text-sky-700 ring ring-inset ring-sky-600/35 hover:bg-sky-50 dark:hover:bg-sky-950/30',
        },
        {
          color: 'info',
          variant: 'soft',
          class: 'text-sky-700 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/35 dark:text-sky-300 dark:hover:bg-sky-950/50',
        },
        {
          color: 'info',
          variant: 'subtle',
          class: 'text-sky-700 ring ring-inset ring-sky-600/25 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/35 dark:text-sky-300 dark:hover:bg-sky-950/50',
        },
        {
          color: 'info',
          variant: 'ghost',
          class: 'text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/30',
        },
        {
          color: 'info',
          variant: 'link',
          class: 'text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200 p-0',
        },
        {
          color: 'warning',
          variant: 'solid',
          class: 'text-white bg-amber-600 hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600',
        },
        {
          color: 'warning',
          variant: 'outline',
          class: 'text-amber-700 ring ring-inset ring-amber-600/35 hover:bg-amber-50 dark:hover:bg-amber-950/30',
        },
        {
          color: 'warning',
          variant: 'soft',
          class: 'text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/35 dark:text-amber-300 dark:hover:bg-amber-950/50',
        },
        {
          color: 'warning',
          variant: 'subtle',
          class: 'text-amber-700 ring ring-inset ring-amber-600/25 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/35 dark:text-amber-300 dark:hover:bg-amber-950/50',
        },
        {
          color: 'warning',
          variant: 'ghost',
          class: 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30',
        },
        {
          color: 'warning',
          variant: 'link',
          class: 'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 p-0',
        },
        {
          color: 'error',
          variant: 'solid',
          class: 'text-white bg-rose-600 hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600',
        },
        {
          color: 'error',
          variant: 'outline',
          class: 'text-rose-700 ring ring-inset ring-rose-600/35 hover:bg-rose-50 dark:hover:bg-rose-950/30',
        },
        {
          color: 'error',
          variant: 'soft',
          class: 'text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/35 dark:text-rose-300 dark:hover:bg-rose-950/50',
        },
        {
          color: 'error',
          variant: 'subtle',
          class: 'text-rose-700 ring ring-inset ring-rose-600/25 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/35 dark:text-rose-300 dark:hover:bg-rose-950/50',
        },
        {
          color: 'error',
          variant: 'ghost',
          class: 'text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30',
        },
        {
          color: 'error',
          variant: 'link',
          class: 'text-rose-700 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200 p-0',
        },
      ],
    },
  },
});
