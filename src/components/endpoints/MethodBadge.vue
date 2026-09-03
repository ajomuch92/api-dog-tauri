<script setup lang="ts">
import { methodClass } from '@/utils/methods';
defineProps<{ method: string }>();
</script>

<template>
  <span :class="methodClass(method)">{{ method.toUpperCase() }}</span>
</template>
