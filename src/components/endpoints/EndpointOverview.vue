<script setup lang="ts">
import { computed } from 'vue';
import JsonViewer from '@/components/common/JsonViewer.vue';
import type { EndpointDetail, EndpointParameter } from '@/types/apidog';

const props = defineProps<{ endpoint: EndpointDetail }>();

const paramGroups = computed(() => {
  const p = props.endpoint.parameters ?? {};
  return (
    [
      ['Path', p.path],
      ['Query', p.query],
      ['Headers', p.header],
      ['Cookies', p.cookie],
    ] as Array<[string, EndpointParameter[] | undefined]>
  ).filter(([, list]) => list && list.length);
});

const body = computed(() => props.endpoint.requestBody);
const hasBody = computed(() => body.value && body.value.type && body.value.type !== 'none');
const example = (p: EndpointParameter) => (Array.isArray(p.example) ? p.example.join(', ') : p.example ?? '');
const hasSchema = (s?: Record<string, unknown>) => !!s && Object.keys(s.properties ?? {}).length > 0;
</script>

<template>
  <div>
    <p v-if="endpoint.description" class="uk-text-muted">{{ endpoint.description }}</p>
    <p v-if="endpoint.tags?.length" class="uk-margin-small">
      <span v-for="t in endpoint.tags" :key="t" class="uk-label uk-margin-small-right">{{ t }}</span>
    </p>

    <template v-for="[label, list] in paramGroups" :key="label">
      <h4 class="section-title">{{ label }}</h4>
      <table class="uk-table uk-table-small uk-table-divider uk-table-middle uk-margin-small-top">
        <thead>
          <tr><th>Nombre</th><th>Tipo</th><th>Requerido</th><th>Ejemplo</th><th>Descripción</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in list" :key="p.id ?? p.name">
            <td><code>{{ p.name }}</code></td>
            <td class="uk-text-muted">{{ p.type ?? '—' }}</td>
            <td>{{ p.required ? 'Sí' : 'No' }}</td>
            <td class="uk-text-small">{{ example(p) }}</td>
            <td class="uk-text-small uk-text-muted">{{ p.description }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template v-if="hasBody">
      <h4 class="section-title">Body <span class="uk-text-muted uk-text-small">({{ body?.type }})</span></h4>
      <table v-if="body?.parameters?.length" class="uk-table uk-table-small uk-table-divider uk-margin-small-top">
        <thead><tr><th>Campo</th><th>Tipo</th><th>Requerido</th><th>Ejemplo</th></tr></thead>
        <tbody>
          <tr v-for="p in body.parameters" :key="p.id ?? p.name">
            <td><code>{{ p.name }}</code></td>
            <td class="uk-text-muted">{{ p.type ?? '—' }}</td>
            <td>{{ p.required ? 'Sí' : 'No' }}</td>
            <td class="uk-text-small">{{ example(p) }}</td>
          </tr>
        </tbody>
      </table>
      <JsonViewer v-if="hasSchema(body?.jsonSchema)" :value="body?.jsonSchema" max-height="40vh" />
      <template v-if="body?.examples?.length">
        <p class="uk-text-small uk-text-bold uk-margin-small-bottom uk-margin-top">Ejemplo</p>
        <JsonViewer :value="body.examples[0].value" max-height="40vh" />
      </template>
    </template>

    <h4 class="section-title">Respuestas</h4>
    <p v-if="!endpoint.responses?.length" class="uk-text-muted uk-text-small">Sin respuestas definidas.</p>
    <div v-for="r in endpoint.responses" :key="String(r.id)" class="uk-margin-small">
      <div class="uk-flex uk-flex-middle">
        <span class="uk-label uk-margin-small-right">{{ r.code }}</span>
        <span class="uk-text-bold">{{ r.name || 'Respuesta' }}</span>
        <span class="uk-text-muted uk-text-small uk-margin-small-left">{{ r.contentType }}</span>
      </div>
      <p v-if="r.description" class="uk-text-small uk-text-muted uk-margin-remove">{{ r.description }}</p>
      <JsonViewer v-if="hasSchema(r.jsonSchema)" :value="r.jsonSchema" max-height="30vh" />
    </div>

    <p class="uk-text-meta uk-margin-top">
      ID {{ endpoint.id }} · Módulo {{ endpoint.moduleId ?? '—' }} · Actualizado {{ endpoint.updatedAt ?? '—' }}
    </p>
  </div>
</template>
