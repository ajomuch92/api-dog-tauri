<script setup lang="ts">
import { computed } from 'vue';
import AppHeader from './AppHeader.vue';
import ProjectList from '@/components/projects/ProjectList.vue';
import EndpointExplorer from '@/components/endpoints/EndpointExplorer.vue';
import EndpointDetail from '@/components/endpoints/EndpointDetail.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useEndpoints } from '@/composables/useEndpoints';
import { useEnvironments } from '@/composables/useEnvironments';
import { useSession } from '@/stores/session';

const { state } = useSession();
const projectId = computed(() => state.project?.id ?? null);
const revision = computed(() => state.revision);

const endpointsState = useEndpoints(projectId, revision);
const envState = useEnvironments(projectId);
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <aside class="app-sidebar">
        <ProjectList />
      </aside>
      <section class="app-explorer">
        <EndpointExplorer v-if="state.project" :project-id="state.project.id" :endpoints="endpointsState" />
        <EmptyState v-else icon="folder" title="Selecciona un proyecto" hint="Los endpoints aparecerán aquí." />
      </section>
      <main class="app-main">
        <EndpointDetail
          v-if="state.project && state.endpointId"
          :key="state.endpointId"
          :project-id="state.project.id"
          :endpoint-id="state.endpointId"
          :folders="endpointsState.folders.value"
          :environments="envState.environments.value"
          :variables="envState.variables.value"
        />
        <EmptyState
          v-else
          icon="code"
          title="Ningún endpoint seleccionado"
          hint="Elige un endpoint del explorador para ver sus detalles o enviarle una petición."
        />
      </main>
    </div>
  </div>
</template>
