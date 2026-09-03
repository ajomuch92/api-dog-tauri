<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import { apidog, toCliError } from '@/services/apidog';
import { ENDPOINT_STATUSES, HTTP_METHODS } from '@/types/apidog';
import type { CliError, EndpointDetail, EndpointFields, Folder } from '@/types/apidog';
import { flattenFolders } from '@/utils/tree';

const props = defineProps<{
  projectId: number;
  folders: Folder[];
  /** Si se pasa, el formulario edita en vez de crear. */
  endpoint?: EndpointDetail | null;
  defaultFolderId?: number;
}>();
const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ (e: 'saved', endpoint: EndpointDetail): void }>();

const isEdit = computed(() => !!props.endpoint);
const folderOptions = computed(() => flattenFolders(props.folders));

const form = ref({
  name: '',
  method: 'get',
  path: '',
  status: 'designing',
  folderId: 0,
  description: '',
  tags: '',
});
const saving = ref(false);
const error = ref<CliError | null>(null);

function reset() {
  error.value = null;
  const e = props.endpoint;
  form.value = {
    name: e?.name ?? '',
    method: (e?.method ?? 'get').toLowerCase(),
    path: e?.path ?? '',
    status: e?.status ?? 'designing',
    folderId: e?.folderId ?? props.defaultFolderId ?? 0,
    description: e?.description ?? '',
    tags: (e?.tags ?? []).join(', '),
  };
}

watch(open, (v) => v && reset());

const parseTags = (s: string) => s.split(',').map((t) => t.trim()).filter(Boolean);

async function submit() {
  saving.value = true;
  error.value = null;
  try {
    let result: EndpointDetail;
    if (isEdit.value && props.endpoint) {
      const e = props.endpoint;
      const fields: EndpointFields = {};
      if (form.value.name !== (e.name ?? '')) fields.name = form.value.name;
      if (form.value.method !== (e.method ?? '').toLowerCase()) fields.method = form.value.method;
      if (form.value.path !== (e.path ?? '')) fields.path = form.value.path;
      if (form.value.status !== e.status) fields.status = form.value.status;
      if (form.value.folderId !== e.folderId) fields.folderId = String(form.value.folderId);
      if (form.value.description !== (e.description ?? '')) fields.description = form.value.description;
      const tags = parseTags(form.value.tags);
      if (tags.join(',') !== (e.tags ?? []).join(',')) fields.tags = tags;
      if (!Object.keys(fields).length) {
        open.value = false;
        return;
      }
      result = await apidog.updateEndpointFields(props.projectId, e.id, fields);
    } else {
      result = await apidog.createEndpoint(props.projectId, {
        name: form.value.name || form.value.path,
        method: form.value.method,
        path: form.value.path,
        status: form.value.status,
        folderId: form.value.folderId,
        description: form.value.description,
        tags: parseTags(form.value.tags),
      });
    }
    emit('saved', result);
    open.value = false;
  } catch (err) {
    error.value = toCliError(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model="open" :title="isEdit ? 'Editar endpoint' : 'Nuevo endpoint'">
    <form class="uk-form-stacked" @submit.prevent="submit">
      <div class="uk-margin-small">
        <label class="uk-form-label">Nombre</label>
        <input v-model="form.name" class="uk-input" type="text" placeholder="Obtener usuarios" />
      </div>
      <div class="uk-grid-small" uk-grid>
        <div class="uk-width-1-4">
          <label class="uk-form-label">Método</label>
          <select v-model="form.method" class="uk-select">
            <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m.toUpperCase() }}</option>
          </select>
        </div>
        <div class="uk-width-3-4">
          <label class="uk-form-label">Ruta</label>
          <input v-model="form.path" class="uk-input" type="text" placeholder="/users/{id}" required />
        </div>
      </div>
      <div class="uk-grid-small uk-margin-small-top" uk-grid>
        <div class="uk-width-1-2">
          <label class="uk-form-label">Estado</label>
          <select v-model="form.status" class="uk-select">
            <option v-for="s in ENDPOINT_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="uk-width-1-2">
          <label class="uk-form-label">Carpeta</label>
          <select v-model.number="form.folderId" class="uk-select">
            <option :value="0">(raíz)</option>
            <option v-for="f in folderOptions" :key="f.id" :value="f.id">
              {{ ' '.repeat(f.depth * 3) }}{{ f.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="uk-margin-small">
        <label class="uk-form-label">Descripción</label>
        <textarea v-model="form.description" class="uk-textarea" rows="3"></textarea>
      </div>
      <div class="uk-margin-small">
        <label class="uk-form-label">Tags (separados por coma)</label>
        <input v-model="form.tags" class="uk-input" type="text" placeholder="users, admin" />
      </div>
      <ErrorAlert :error="error" compact />
    </form>
    <template #footer>
      <button class="uk-button uk-button-default uk-modal-close" type="button">Cancelar</button>
      <button class="uk-button uk-button-primary uk-margin-small-left" type="button" :disabled="saving || !form.path" @click="submit">
        <span v-if="saving" uk-spinner="ratio: 0.6" class="uk-margin-small-right"></span>
        {{ isEdit ? 'Guardar cambios' : 'Crear endpoint' }}
      </button>
    </template>
  </BaseModal>
</template>
