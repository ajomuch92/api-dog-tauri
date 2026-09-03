<script setup lang="ts">
import { ref } from 'vue';
import { useCliStatus } from '@/composables/useCliStatus';
import { useNotify } from '@/composables/useNotify';
import { toCliError } from '@/services/apidog';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import type { CliError } from '@/types/apidog';

const { login } = useCliStatus();
const notify = useNotify();

const token = ref('');
const apiBaseUrl = ref('');
const showAdvanced = ref(false);
const submitting = ref(false);
const error = ref<CliError | null>(null);

async function submit() {
  submitting.value = true;
  error.value = null;
  try {
    await login(token.value, apiBaseUrl.value || undefined);
    notify.success('Sesión iniciada');
    token.value = '';
  } catch (err) {
    error.value = toCliError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="uk-form-stacked" @submit.prevent="submit">
    <p class="uk-text-small uk-text-muted">
      Pega tu <strong>personal access token</strong> de Apidog para iniciar sesión con el CLI.
    </p>
    <div class="uk-margin">
      <label class="uk-form-label" for="token">Access token</label>
      <input id="token" v-model="token" class="uk-input" type="password" autocomplete="off" placeholder="APS-..." required />
    </div>
    <div class="uk-margin-small">
      <a href="#" class="uk-text-small" @click.prevent="showAdvanced = !showAdvanced">
        {{ showAdvanced ? 'Ocultar' : 'Mostrar' }} opciones avanzadas
      </a>
    </div>
    <div v-if="showAdvanced" class="uk-margin">
      <label class="uk-form-label" for="apiBase">API base URL (instancias privadas)</label>
      <input id="apiBase" v-model="apiBaseUrl" class="uk-input" type="url" placeholder="https://api.apidog.com" />
    </div>
    <ErrorAlert :error="error" compact />
    <button class="uk-button uk-button-primary uk-width-1-1 uk-margin-top" type="submit" :disabled="submitting || !token">
      <span v-if="submitting" uk-spinner="ratio: 0.6" class="uk-margin-small-right"></span>
      Iniciar sesión
    </button>
  </form>
</template>
