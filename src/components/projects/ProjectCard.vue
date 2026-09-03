<script setup lang="ts">
import type { Project } from '@/types/apidog';

defineProps<{ project: Project; active: boolean }>();
defineEmits<{ (e: 'select'): void }>();
</script>

<template>
  <a href="#" class="project-card" :class="{ active }" @click.prevent="$emit('select')">
    <div class="uk-flex uk-flex-middle">
      <span uk-icon="icon: folder" class="uk-margin-small-right"></span>
      <span class="uk-text-truncate uk-text-bold">{{ project.name }}</span>
    </div>
    <p v-if="project.description" class="uk-text-small uk-text-muted uk-margin-remove line-clamp">
      {{ project.description }}
    </p>
    <span class="uk-text-meta">ID {{ project.id }}</span>
  </a>
</template>
