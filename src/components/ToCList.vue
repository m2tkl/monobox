<template>
  <div class="border-x border-t border-slate-300 bg-slate-50">
    <div
      class="flex items-center gap-2 border-b-2 border-slate-400 bg-slate-300 px-2 py-1 text-sm font-semibold text-gray-800"
    >
      <UIcon :name="iconKey.toc" />
      Table of Contents
    </div>

    <!-- toc -->
    <ul class="sticky flex flex-col">
      <li
        v-for="item in items"
        :key="item.text"
      >
        <div
          class="flex cursor-pointer items-center border-b border-slate-300 px-2 py-1 text-sm text-gray-700 hover:bg-slate-200 hover:text-gray-900"
          @click="item.id && emits('click', item.id)"
        >
          <span :class="indent(item.level)" />
          <span class="pr-1 text-xs font-semibold text-gray-400">h{{ item.level }}</span>
          <span v-if="item">
            {{ item.text }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  items: Array<{
    id: string | null;
    text: string;
    level: number;
  }>;
}>();

const emits = defineEmits<{
  (e: 'click', id: string): void;
}>();

const indentStyle: Record<number, string> = {
  1: '',
  2: 'pl-4',
  3: 'pl-8',
  4: 'pl-12',
  5: 'pl-16',
  6: 'pl-20',
};

const indent = (level: number) => indentStyle[level] ?? '';
</script>
