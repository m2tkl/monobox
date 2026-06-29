<template>
  <UCard>
    <template
      v-if="$slots.header"
      #header
    >
      <slot name="header" />
    </template>

    <slot />
  </UCard>
</template>
