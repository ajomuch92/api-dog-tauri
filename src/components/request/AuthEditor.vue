<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RequestAuth } from '@/types/apidog';
import { AUTH_TYPES } from '@/utils/auth';

const auth = defineModel<RequestAuth>({ required: true });
defineProps<{
  /** Auth definida en Apidog para este endpoint (si se pudo mapear). */
  suggested?: RequestAuth | null;
}>();
const emit = defineEmits<{ (e: 'apply-suggested'): void; (e: 'reset'): void }>();

const showSecret = ref(false);
const secretType = computed(() => (showSecret.value ? 'text' : 'password'));
</script>

<template>
  <div class="auth-editor">
    <div class="uk-grid-small uk-flex-middle" uk-grid>
      <div class="uk-width-expand">
        <label class="uk-form-label">Tipo</label>
        <select v-model="auth.type" class="uk-select uk-form-small">
          <option v-for="t in AUTH_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="uk-width-auto uk-margin-small-top" style="align-self: flex-end">
        <label class="uk-text-small uk-margin-small-right">
          <input v-model="showSecret" class="uk-checkbox uk-margin-small-right" type="checkbox" />Mostrar secretos
        </label>
        <button class="uk-button uk-button-default uk-button-small" type="button" @click="emit('reset')">Limpiar</button>
      </div>
    </div>

    <p v-if="suggested && suggested.type !== 'none'" class="uk-text-small uk-margin-small-top uk-margin-remove-bottom">
      <span uk-icon="icon: info; ratio: 0.8" class="uk-margin-small-right"></span>
      Este endpoint define autenticación <strong>{{ suggested.type }}</strong> en Apidog.
      <a href="#" class="gate-link uk-margin-small-left" @click.prevent="emit('apply-suggested')">Usar esa configuración</a>
    </p>

    <!-- Bearer -->
    <div v-if="auth.type === 'bearer'" class="uk-grid-small uk-margin-small-top" uk-grid>
      <div class="uk-width-1-4">
        <label class="uk-form-label">Prefijo</label>
        <input v-model="auth.prefix" class="uk-input uk-form-small" type="text" placeholder="Bearer" />
      </div>
      <div class="uk-width-3-4">
        <label class="uk-form-label">Token</label>
        <input v-model="auth.token" class="uk-input uk-form-small" :type="secretType" autocomplete="off" spellcheck="false" placeholder="eyJhbGciOi…" />
      </div>
    </div>

    <!-- Basic -->
    <div v-else-if="auth.type === 'basic'" class="uk-grid-small uk-margin-small-top" uk-grid>
      <div class="uk-width-1-2">
        <label class="uk-form-label">Usuario</label>
        <input v-model="auth.username" class="uk-input uk-form-small" type="text" autocomplete="off" />
      </div>
      <div class="uk-width-1-2">
        <label class="uk-form-label">Contraseña</label>
        <input v-model="auth.password" class="uk-input uk-form-small" :type="secretType" autocomplete="off" />
      </div>
    </div>

    <!-- API key -->
    <div v-else-if="auth.type === 'apikey'" class="uk-grid-small uk-margin-small-top" uk-grid>
      <div class="uk-width-1-3">
        <label class="uk-form-label">Nombre</label>
        <input v-model="auth.key" class="uk-input uk-form-small" type="text" placeholder="X-API-Key" spellcheck="false" />
      </div>
      <div class="uk-width-1-3">
        <label class="uk-form-label">Valor</label>
        <input v-model="auth.value" class="uk-input uk-form-small" :type="secretType" autocomplete="off" spellcheck="false" />
      </div>
      <div class="uk-width-1-3">
        <label class="uk-form-label">Enviar en</label>
        <select v-model="auth.addTo" class="uk-select uk-form-small">
          <option value="header">Header</option>
          <option value="query">Query string</option>
        </select>
      </div>
    </div>

    <!-- Header personalizado -->
    <div v-else-if="auth.type === 'custom'" class="uk-grid-small uk-margin-small-top" uk-grid>
      <div class="uk-width-1-2">
        <label class="uk-form-label">Header</label>
        <input v-model="auth.key" class="uk-input uk-form-small" type="text" placeholder="Authorization" spellcheck="false" />
      </div>
      <div class="uk-width-1-2">
        <label class="uk-form-label">Valor</label>
        <input v-model="auth.value" class="uk-input uk-form-small" :type="secretType" autocomplete="off" spellcheck="false" placeholder="Token abc123" />
      </div>
    </div>

    <p v-else class="uk-text-small uk-text-muted uk-margin-small-top">
      La petición se enviará sin credenciales. Elige un tipo para agregarlas.
    </p>

    <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
      La configuración se guarda por proyecto en este equipo y se aplica al enviar, sin modificar tus headers manuales.
    </p>
  </div>
</template>
