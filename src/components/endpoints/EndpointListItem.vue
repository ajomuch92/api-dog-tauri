<script setup lang="ts">
import MethodBadge from './MethodBadge.vue';
import type { EndpointSummary } from '@/types/apidog';

defineProps<{ endpoint: EndpointSummary; active: boolean }>();
defineEmits<{ (e: 'select'): void }>();
</script>

<template>
  <a href="#" class="endpoint-item" :class="{ active }" :title="endpoint.path" @click.prevent="$emit('select')">
    <MethodBadge :method="endpoint.method" />
    <span class="uk-text-truncate">{{ endpoint.name || endpoint.path }}</span>
  </a>
</template>
