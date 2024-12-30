<template>
  <div class="border-x border-t border-slate-300 bg-slate-50">
    <div
      class="flex items-center gap-2 border-b-2 border-slate-400 bg-slate-300 px-2 py-1 text-sm font-semibold text-gray-800"
    >
      <UIcon :name="iconKey.toc"/>
      Table of Contents
    </div>

    <!-- toc -->
    <ul class="sticky flex flex-col">
      <li v-for="item in items">
        <div
          class="flex cursor-pointer items-center border-b border-slate-300 px-2 py-1 text-sm text-gray-700 hover:bg-slate-200 hover:text-gray-900"
          @click="item.id && emits('click', item.id)"
        >
          <span class="pl-4" v-for="n in item.level - 1"></span>
          <span class="pr-1 text-xs font-semibold text-gray-400"
            >h{{ item.level }}</span
          >
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
  (e: "click", id: string): void;
}>();
</script>
