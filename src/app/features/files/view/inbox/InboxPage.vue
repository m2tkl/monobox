<template>
  <div />
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const workspace = route.params.workspace;

await router.replace({
  path: `/${workspace}/_files`,
  query: {
    ...route.query,
    tab: 'inbox',
  },
  hash: route.hash,
});
</script>
