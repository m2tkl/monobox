<template>
  <UDropdown
    :items="workspaceMenuItems"
    :popper="{ placement: 'bottom-start' }"
    class="border"
  >
    <div class="flex items-center">
      <UIcon
        :name="iconKey.database"
        class="mr-1"
      />
      <span class="font-bold text-gray-600 text-lg">
        {{ workspaceSlug }}
      </span>
      <UIcon
        :name="iconKey.chevronDown"
        class="ml-1"
        size="xs"
      />
    </div>
  </UDropdown>
</template>

<script setup lang="ts">
const props = defineProps<{ workspaceSlug: string }>();

const router = useRouter();

const workspaceMenuItems = [
  [
    {
      label: 'Switch workspace',
      icon: iconKey.switch,
      click: () => {
        router.push('/');
      },
    },
    {
      label: 'Workspace setting',
      icon: iconKey.setting,
      click: () => {
        router.push(`/${props.workspaceSlug}/_setting`);
      },
    },
  ],
];
</script>
