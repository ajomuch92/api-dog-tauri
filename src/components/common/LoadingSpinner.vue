<script setup lang="ts">
defineProps<{ label?: string; ratio?: number }>();
</script>

<template>
  <div class="uk-flex uk-flex-middle uk-flex-center uk-text-muted uk-padding-small">
    <span :uk-spinner="`ratio: ${ratio ?? 0.8}`"></span>
    <span v-if="label" class="uk-margin-small-left">{{ label }}</span>
  </div>
</template>
