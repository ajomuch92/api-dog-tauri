<script setup lang="ts">
defineProps<{ icon?: string; title: string; hint?: string }>();
</script>

<template>
  <div class="uk-text-center uk-text-muted uk-padding">
    <span :uk-icon="`icon: ${icon ?? 'info'}; ratio: 2`"></span>
    <p class="uk-margin-small-top uk-text-bold uk-margin-remove-bottom">{{ title }}</p>
    <p v-if="hint" class="uk-text-small uk-margin-remove-top">{{ hint }}</p>
    <slot />
  </div>
</template>
