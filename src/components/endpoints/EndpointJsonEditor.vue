<script setup lang="ts">
import { ref, watch } from 'vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import { apidog, toCliError } from '@/services/apidog';
import type { CliError, EndpointDetail } from '@/types/apidog';
import { prettyJson, stripReadOnlyFields } from '@/utils/json';

const props = defineProps<{ projectId: number; endpoint: EndpointDetail }>();
const emit = defineEmits<{ (e: 'saved', endpoint: EndpointDetail): void }>();

const text = ref('');
const saving = ref(false);
const error = ref<CliError | null>(null);
const dirty = ref(false);

function reset() {
  text.value = prettyJson(stripReadOnlyFields(props.endpoint));
  dirty.value = false;
  error.value = null;
}
watch(() => props.endpoint, reset, { immediate: true });

async function save() {
  error.value = null;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text.value);
  } catch (err) {
    error.value = { kind: 'validation', message: `JSON inválido: ${(err as Error).message}` };
    return;
  }
  saving.value = true;
  try {
    const result = await apidog.updateEndpointJson(props.projectId, props.endpoint.id, payload);
    dirty.value = false;
    emit('saved', result);
  } catch (err) {
    error.value = toCliError(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <p class="uk-text-small uk-text-muted">
      Edita la definición completa del endpoint. Antes de guardar se valida con
      <code>apidog cli-schema validate endpoint-update</code>. El CLI no hace merge:
      lo que envíes reemplaza la definición.
    </p>
    <textarea v-model="text" class="uk-textarea code-editor" rows="24" spellcheck="false" @input="dirty = true"></textarea>
    <ErrorAlert :error="error" />
    <div class="uk-margin-small-top uk-text-right">
      <button class="uk-button uk-button-default uk-button-small" type="button" :disabled="!dirty" @click="reset">Descartar</button>
      <button class="uk-button uk-button-primary uk-button-small uk-margin-small-left" type="button" :disabled="saving || !dirty" @click="save">
        <span v-if="saving" uk-spinner="ratio: 0.5" class="uk-margin-small-right"></span>Guardar JSON
      </button>
    </div>
  </div>
</template>
