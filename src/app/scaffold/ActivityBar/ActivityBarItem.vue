<template>
  <UTooltip :text="label">
    <NuxtLink
      :to="to"
      class="activity-bar-item"
      :class="{ 'activity-bar-item--active': active }"
      :aria-current="active ? 'page' : undefined"
      :aria-label="label"
    >
      <UIcon
        :name="icon"
        class="activity-bar-icon"
      />
    </NuxtLink>
  </UTooltip>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  icon: string;
  to: string;
  active: boolean;
}>();
</script>

<style scoped>
.activity-bar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  color: var(--color-text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.activity-bar-item:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.activity-bar-item:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.activity-bar-item--active {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.activity-bar-icon {
  font-size: 20px;
}
</style>
