<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="size-full"
    style="background-color: var(--color-background)"
  >
    <div class="h-full w-full flex items-stretch justify-center">
      <client-only>
        <div
          ref="revealRoot"
          class="reveal w-full h-full"
        >
          <div
            class="slides"
            v-html="slidesHtml"
          />
        </div>
      </client-only>
    </div>
  </div>
</template>

<script setup lang="ts">
import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';

// Slide styles (Reveal core, theme, highlight theme)
import '~/assets/css/modules/slide.css';
import { buildSlidesFromHtml } from './lib/buildSlidesFromHtml';

defineOptions({ name: 'Slide' });

const props = defineProps<{
  html: string;
}>();

const slidesHtml = ref('');
const revealRoot = ref<HTMLDivElement | null>(null);

watch(() => props.html, async () => {
  slidesHtml.value = buildSlidesFromHtml(props.html);

  // Wait DOM update then init Reveal
  await nextTick();
  if (revealRoot.value) {
    const deck = new Reveal(revealRoot.value, {
      hash: true,
      controls: true,
      controlsLayout: 'edges',
      progress: true,
      slideNumber: true,
      center: false,
      width: '100%',
      height: '100%',
      embedded: true,
      navigationMode: 'default',
      plugins: [RevealHighlight],
    });
    await deck.initialize();
  }
});
</script>
