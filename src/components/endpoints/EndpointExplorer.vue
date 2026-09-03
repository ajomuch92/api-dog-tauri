<script setup lang="ts">
import { ref } from 'vue';
import EndpointFilters from './EndpointFilters.vue';
import EndpointTree from './EndpointTree.vue';
import EndpointForm from './EndpointForm.vue';
import FolderForm from '@/components/folders/FolderForm.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import { useNotify } from '@/composables/useNotify';
import { useBusy } from '@/composables/useBusy';
import type { useEndpoints } from '@/composables/useEndpoints';
import { apidog } from '@/services/apidog';
import { useSession } from '@/stores/session';
import type { Folder } from '@/types/apidog';

const props = defineProps<{ projectId: number; endpoints: ReturnType<typeof useEndpoints> }>();

const { state, selectEndpoint, bumpRevision } = useSession();
const notify = useNotify();
const { withBlocking } = useBusy();

const showEndpointForm = ref(false);
const defaultFolderId = ref(0);
const showFolderForm = ref(false);
const editingFolder = ref<Folder | null>(null);

function openCreateEndpoint(folderId = 0) {
  defaultFolderId.value = folderId;
  showEndpointForm.value = true;
}

function openFolderForm(folder: Folder | null) {
  editingFolder.value = folder;
  showFolderForm.value = true;
}

async function deleteFolder(folder: Folder) {
  const ok = await notify.confirm(
    `¿Eliminar la carpeta "${folder.name}"? Los endpoints que contiene también se eliminarán.`,
    'Eliminar',
  );
  if (!ok) return;
  try {
    await withBlocking(`Eliminando carpeta "${folder.name}"…`, () => apidog.deleteFolder(props.projectId, folder.id));
    notify.success('Carpeta eliminada');
    bumpRevision();
  } catch (err) {
    notify.error(err as never);
  }
}

function onSaved(message: string) {
  notify.success(message);
  bumpRevision();
}
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <span class="uk-text-bold uk-text-small uk-text-uppercase">Endpoints</span>
      <span>
        <button class="uk-icon-button uk-icon-button-small" uk-icon="folder" uk-tooltip="Nueva carpeta" @click="openFolderForm(null)"></button>
        <button class="uk-icon-button uk-icon-button-small uk-margin-small-left" uk-icon="plus" uk-tooltip="Nuevo endpoint" @click="openCreateEndpoint(0)"></button>
        <span v-if="endpoints.loading.value" class="uk-margin-small-left" uk-spinner="ratio: 0.6"></span>
        <button v-else class="uk-icon-button uk-icon-button-small uk-margin-small-left" uk-icon="refresh" uk-tooltip="Recargar" @click="endpoints.load"></button>
      </span>
    </div>

    <EndpointFilters
      v-model:search="endpoints.search.value"
      v-model:method="endpoints.method.value"
      v-model:status="endpoints.status.value"
    />

    <div class="panel-content" :class="{ 'panel-loading': endpoints.loading.value && endpoints.endpoints.value.length }">
      <LoadingSpinner v-if="endpoints.loading.value && !endpoints.endpoints.value.length" label="Cargando endpoints…" />
      <ErrorAlert :error="endpoints.error.value" compact />
      <EndpointTree
        v-if="!endpoints.error.value"
        :tree="endpoints.tree.value"
        :selected-id="state.endpointId"
        :force-open="endpoints.hasActiveFilters.value"
        @select="selectEndpoint($event)"
        @create-endpoint="openCreateEndpoint"
        @edit-folder="openFolderForm"
        @delete-folder="deleteFolder"
      />
    </div>

    <EndpointForm
      v-model="showEndpointForm"
      :project-id="projectId"
      :folders="endpoints.folders.value"
      :default-folder-id="defaultFolderId"
      @saved="onSaved('Endpoint creado')"
    />
    <FolderForm
      v-model="showFolderForm"
      :project-id="projectId"
      :folders="endpoints.folders.value"
      :folder="editingFolder"
      @saved="onSaved(editingFolder ? 'Carpeta actualizada' : 'Carpeta creada')"
    />
  </div>
</template>
