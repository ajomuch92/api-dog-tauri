<script setup lang="ts">
import { onMounted } from 'vue';
import ProjectCard from './ProjectCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useProjects } from '@/composables/useProjects';
import { useSession } from '@/stores/session';

const { projects, loading, error, load } = useProjects();
const { state, selectProject } = useSession();

onMounted(load);
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <span class="uk-text-bold uk-text-small uk-text-uppercase">Proyectos</span>
      <span v-if="loading" uk-spinner="ratio: 0.6"></span>
      <button v-else class="uk-icon-button uk-icon-button-small" uk-icon="refresh" uk-tooltip="Recargar" @click="load"></button>
    </div>
    <div class="panel-content" :class="{ 'panel-loading': loading && projects.length }">
      <LoadingSpinner v-if="loading && !projects.length" label="Cargando proyectos…" />
      <ErrorAlert :error="error" compact />
      <EmptyState v-if="!loading && !error && !projects.length" icon="folder" title="Sin proyectos" />
      <ProjectCard
        v-for="p in projects"
        :key="p.id"
        :project="p"
        :active="state.project?.id === p.id"
        @select="selectProject(p)"
      />
    </div>
  </div>
</template>
