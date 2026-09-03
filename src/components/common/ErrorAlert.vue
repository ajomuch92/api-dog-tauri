<script setup lang="ts">
import { computed } from 'vue';
import type { CliError } from '@/types/apidog';

const props = defineProps<{ error: CliError | null; compact?: boolean }>();

/** `cli-schema validate` devuelve los errores como JSON dentro de `suggestion`. */
const validationErrors = computed<string[]>(() => {
  const s = props.error?.suggestion;
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as { errors?: Array<{ path?: string; message?: string }> };
    return (parsed.errors ?? []).map((e) => `${e.path ? e.path + ': ' : ''}${e.message ?? ''}`);
  } catch {
    return [s];
  }
});
</script>

<template>
  <div v-if="error" class="uk-alert uk-alert-danger" :class="{ 'uk-margin-remove': compact }" uk-alert>
    <p class="uk-margin-remove">
      <strong>{{ error.message }}</strong>
      <span v-if="error.code" class="uk-text-small uk-text-muted"> ({{ error.code }})</span>
    </p>
    <ul v-if="validationErrors.length" class="uk-list uk-list-bullet uk-text-small uk-margin-small-top uk-margin-remove-bottom">
      <li v-for="(msg, i) in validationErrors" :key="i">{{ msg }}</li>
    </ul>
    <details v-if="error.raw && !compact" class="uk-margin-small-top">
      <summary class="uk-text-small">Salida del CLI</summary>
      <pre class="uk-text-small raw-output">{{ error.raw }}</pre>
    </details>
  </div>
</template>
