<template>
  <header class="app-page-header">
    <div class="app-page-header__title-group">
      <div class="app-page-header__title-row">
        <UIcon
          v-if="icon"
          :name="icon"
          class="app-page-header__icon"
        />
        <component
          :is="headingTag"
          class="app-page-header__title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </component>
        <slot name="inline" />
      </div>

      <p
        v-if="$slots.description || description"
        class="app-page-header__description"
      >
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </div>

    <div
      v-if="$slots.actions"
      class="app-page-header__actions"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  icon?: string;
  headingLevel?: 1 | 2 | 3;
}>(), {
  headingLevel: 1,
});

const headingTag = computed(() => `h${props.headingLevel}`);
</script>

<style scoped>
.app-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.375rem;
}

.app-page-header__title-group {
  min-width: 0;
}

.app-page-header__title-row {
  display: flex;
  min-height: 3rem;
  align-items: center;
  gap: 0.5rem;
}

.app-page-header__icon {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
}

.app-page-header__title {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.app-page-header__description {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.app-page-header__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  min-height: 3rem;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .app-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .app-page-header__actions {
    justify-content: flex-start;
  }
}
</style>
