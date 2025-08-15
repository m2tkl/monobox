<!-- eslint-disable vue/no-v-html -->
<template>
  <NuxtLayout name="default">
    <template #main>
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

    <template #actions>
      <div class="fixed bottom-6 right-6 z-50 flex gap-2">
        <UButton
          :icon="iconKey.arrowLeft"
          color="neutral"
          variant="solid"
          @click="$router.go(-1)"
        >
          Back
        </UButton>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import { onMounted, ref, computed, nextTick } from 'vue';

import type { JSONContent } from '@tiptap/vue-3';

// Slide styles (Reveal core, theme, highlight theme)
import '~/assets/css/modules/slide.css';

import { convertMemoToHtml } from '~/lib/memo/exporter/toHtml';

definePageMeta({
  path: '/:workspace/:memo/_slide',
});

const route = useRoute();
const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

const { ready, error } = loadMemoData(workspaceSlug.value, memoSlug.value);

if (error.value) {
  showError({ statusCode: 404, statusMessage: 'Page not found', message: `Memo ${memoSlug.value} not found.` });
}

const slidesHtml = ref('');
const revealRoot = ref<HTMLDivElement | null>(null);

type SlideSplitConfig = {
  breakOnHeadingLevels: number[]; // e.g. [1,2,3,4,5,6]
  breakOnHorizontalRule: boolean; // <hr>
};

// Configure which conditions create a new slide
const splitConfig: SlideSplitConfig = {
  breakOnHeadingLevels: [1, 2, 3, 4, 5, 6],
  breakOnHorizontalRule: true,
};

function buildSlidesFromHtml(fullHtml: string, cfg: SlideSplitConfig = splitConfig): string {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = fullHtml;

  const sections: HTMLElement[] = [];
  let current: HTMLElement | null = null;
  let lastHeadingEl: HTMLElement | null = null; // Remember the latest heading as the current chapter
  let needChapterOnNextSlide = false; // Flag set when a slide is cut by <hr>

  const nodes = Array.from(wrapper.childNodes);
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      // Wrap text nodes into paragraphs to avoid layout issues
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const p = document.createElement('p');
        p.textContent = node.textContent;
        if (!current) {
          current = document.createElement('section');
        }
        current.appendChild(p);
      }
      continue;
    }

    // Break on horizontal rule
    if (node.tagName === 'HR' && cfg.breakOnHorizontalRule) {
      if (current) sections.push(current);
      current = null; // Do not include the HR itself in slides
      // Next slide (created by subsequent nodes) should display the current chapter title
      needChapterOnNextSlide = true;
      continue;
    }

    // Break on selected heading levels (H1..H6)
    const headingMatch = /^H([1-6])$/.exec(node.tagName);
    if (headingMatch) {
      const level = Number(headingMatch[1]);
      if (cfg.breakOnHeadingLevels.includes(level)) {
        if (current) sections.push(current);
        current = document.createElement('section');
        // Update chapter context to this heading
        lastHeadingEl = node.cloneNode(true) as HTMLElement;
        // This slide shows the heading itself; no need to prepend chapter label
        needChapterOnNextSlide = false;
        current.appendChild(lastHeadingEl.cloneNode(true));
        continue;
      }
    }

    if (!current) {
      current = document.createElement('section');
      // If the previous break was an <hr>, prepend the current chapter title
      if (needChapterOnNextSlide && lastHeadingEl) {
        const tag = (lastHeadingEl.tagName || 'H2').toLowerCase();
        const chapter = document.createElement(tag);
        chapter.textContent = lastHeadingEl.textContent || '';
        current.appendChild(chapter);
        needChapterOnNextSlide = false;
      }
    }
    current.appendChild(node.cloneNode(true));
  }

  if (current) sections.push(current);

  const container = document.createElement('div');
  for (const sec of sections) container.appendChild(sec);
  return container.innerHTML;
}

onMounted(async () => {
  const { memo } = await ready;
  const html = convertMemoToHtml(JSON.parse(memo.content) as JSONContent, memo.title);
  slidesHtml.value = buildSlidesFromHtml(html);

  // Wait DOM update then init Reveal
  await nextTick();
  if (revealRoot.value) {
    const deck = new Reveal(revealRoot.value, {
      hash: true,
      controls: true,
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
