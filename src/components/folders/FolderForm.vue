<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@/components/common/BaseModal.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import { apidog, toCliError } from '@/services/apidog';
import type { CliError, Folder } from '@/types/apidog';
import { flattenFolders } from '@/utils/tree';

const props = defineProps<{ projectId: number; folders: Folder[]; folder?: Folder | null }>();
const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ (e: 'saved'): void }>();

const isEdit = computed(() => !!props.folder);
const name = ref('');
const parentId = ref(0);
const saving = ref(false);
const error = ref<CliError | null>(null);

/** Al editar no se puede mover una carpeta dentro de sí misma. */
const parentOptions = computed(() =>
  flattenFolders(props.folders).filter((f) => f.id !== props.folder?.id),
);

watch(open, (v) => {
  if (!v) return;
  error.value = null;
  name.value = props.folder?.name ?? '';
  parentId.value = props.folder?.parentId ?? 0;
});

async function submit() {
  saving.value = true;
  error.value = null;
  try {
    if (isEdit.value && props.folder) {
      const changes: { name?: string; parentId?: number } = {};
      if (name.value !== props.folder.name) changes.name = name.value;
      if (parentId.value !== props.folder.parentId) changes.parentId = parentId.value;
      if (Object.keys(changes).length) {
        await apidog.updateFolder(props.projectId, props.folder.id, changes);
      }
    } else {
      await apidog.createFolder(props.projectId, name.value, parentId.value || null);
    }
    emit('saved');
    open.value = false;
  } catch (err) {
    error.value = toCliError(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model="open" :title="isEdit ? 'Editar carpeta' : 'Nueva carpeta'">
    <form class="uk-form-stacked" @submit.prevent="submit">
      <div class="uk-margin-small">
        <label class="uk-form-label">Nombre</label>
        <input v-model="name" class="uk-input" type="text" required autofocus />
      </div>
      <div class="uk-margin-small">
        <label class="uk-form-label">Carpeta padre</label>
        <select v-model.number="parentId" class="uk-select">
          <option :value="0">(raíz)</option>
          <option v-for="f in parentOptions" :key="f.id" :value="f.id">
            {{ ' '.repeat(f.depth * 3) }}{{ f.label }}
          </option>
        </select>
      </div>
      <ErrorAlert :error="error" compact />
    </form>
    <template #footer>
      <button class="uk-button uk-button-default uk-modal-close" type="button">Cancelar</button>
      <button class="uk-button uk-button-primary uk-margin-small-left" type="button" :disabled="saving || !name.trim()" @click="submit">
        <span v-if="saving" uk-spinner="ratio: 0.6" class="uk-margin-small-right"></span>
        {{ isEdit ? 'Guardar' : 'Crear carpeta' }}
      </button>
    </template>
  </BaseModal>
</template>
