<script setup lang="ts">
import { ref, watch } from 'vue';
import MethodBadge from './MethodBadge.vue';
import EndpointOverview from './EndpointOverview.vue';
import EndpointJsonEditor from './EndpointJsonEditor.vue';
import EndpointForm from './EndpointForm.vue';
import RequestRunner from '@/components/request/RequestRunner.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import { useAsync } from '@/composables/useAsync';
import { useNotify } from '@/composables/useNotify';
import { apidog } from '@/services/apidog';
import { useSession } from '@/stores/session';
import type { EndpointDetail, Environment, Folder, GlobalVariable } from '@/types/apidog';
import { statusClass } from '@/utils/methods';

const props = defineProps<{
  projectId: number;
  endpointId: number;
  folders: Folder[];
  environments: Environment[];
  variables: GlobalVariable[];
}>();

const { selectEndpoint, bumpRevision } = useSession();
const notify = useNotify();
const { data: endpoint, loading, error, run } = useAsync<EndpointDetail | null>(null);

type Tab = 'overview' | 'request' | 'json';
const tab = ref<Tab>('overview');
const showEdit = ref(false);

const load = () => run(() => apidog.getEndpoint(props.projectId, props.endpointId));
watch(() => props.endpointId, load, { immediate: true });

async function remove() {
  if (!endpoint.value) return;
  const ok = await notify.confirm(`¿Eliminar el endpoint "${endpoint.value.name}"?`, 'Eliminar');
  if (!ok) return;
  try {
    await apidog.deleteEndpoint(props.projectId, props.endpointId);
    notify.success('Endpoint eliminado');
    selectEndpoint(null);
    bumpRevision();
  } catch (err) {
    notify.error(err as never);
  }
}

function onSaved(message: string) {
  notify.success(message);
  bumpRevision();
  load();
}
</script>

<template>
  <div class="detail">
    <LoadingSpinner v-if="loading && !endpoint" label="Cargando endpoint…" />
    <ErrorAlert :error="error" />

    <template v-if="endpoint">
      <header class="detail-header">
        <div class="uk-flex uk-flex-middle detail-title">
          <MethodBadge :method="endpoint.method" class="uk-margin-small-right" />
          <div class="detail-name">
            <h3 class="uk-margin-remove uk-text-truncate uk-h4" :title="endpoint.name">{{ endpoint.name }}</h3>
            <code class="uk-text-small detail-path">{{ endpoint.path }}</code>
          </div>
          <span :class="statusClass(endpoint.status)" class="uk-margin-small-left uk-flex-none">{{ endpoint.status }}</span>
        </div>
        <div class="uk-flex-none detail-actions">
          <button class="uk-icon-button" uk-icon="refresh" uk-tooltip="Recargar" :disabled="loading" @click="load"></button>
          <button class="uk-icon-button" uk-icon="pencil" uk-tooltip="Editar" @click="showEdit = true"></button>
          <button class="uk-icon-button detail-delete" uk-icon="trash" uk-tooltip="Eliminar" @click="remove"></button>
        </div>
      </header>

      <ul class="uk-tab uk-margin-small-top">
        <li :class="{ 'uk-active': tab === 'overview' }"><a href="#" data-tab="overview" @click.prevent="tab = 'overview'">Resumen</a></li>
        <li :class="{ 'uk-active': tab === 'request' }"><a href="#" data-tab="request" @click.prevent="tab = 'request'">Enviar petición</a></li>
        <li :class="{ 'uk-active': tab === 'json' }"><a href="#" data-tab="json" @click.prevent="tab = 'json'">JSON</a></li>
      </ul>

      <div class="detail-body">
        <EndpointOverview v-if="tab === 'overview'" :endpoint="endpoint" />
        <RequestRunner
          v-else-if="tab === 'request'"
          :endpoint="endpoint"
          :environments="environments"
          :variables="variables"
        />
        <EndpointJsonEditor
          v-else
          :project-id="projectId"
          :endpoint="endpoint"
          @saved="onSaved('Endpoint actualizado')"
        />
      </div>

      <EndpointForm
        v-model="showEdit"
        :project-id="projectId"
        :folders="folders"
        :endpoint="endpoint"
        @saved="onSaved('Endpoint actualizado')"
      />
    </template>
  </div>
</template>
