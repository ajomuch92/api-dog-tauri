<script setup lang="ts">
import { computed, ref } from 'vue';
import JsonViewer from '@/components/common/JsonViewer.vue';
import type { HttpResponseOutput } from '@/types/apidog';
import { tryPrettyJsonText } from '@/utils/json';
import { httpStatusClass } from '@/utils/methods';

const props = defineProps<{ response: HttpResponseOutput }>();
const view = ref<'body' | 'headers'>('body');

const body = computed(() => tryPrettyJsonText(props.response.body));
const size = computed(() => {
  const b = props.response.sizeBytes;
  return b > 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`;
});
</script>

<template>
  <div class="response-viewer">
    <div class="uk-flex uk-flex-middle uk-flex-between response-meta">
      <div>
        <span :class="httpStatusClass(response.status)">{{ response.status }} {{ response.statusText }}</span>
        <span class="uk-text-small uk-text-muted uk-margin-small-left">{{ response.durationMs }} ms · {{ size }}</span>
      </div>
      <ul class="uk-subnav uk-subnav-pill uk-margin-remove">
        <li :class="{ 'uk-active': view === 'body' }"><a href="#" @click.prevent="view = 'body'">Body</a></li>
        <li :class="{ 'uk-active': view === 'headers' }"><a href="#" @click.prevent="view = 'headers'">Headers ({{ response.headers.length }})</a></li>
      </ul>
    </div>

    <template v-if="view === 'body'">
      <JsonViewer v-if="body.isJson" :value="body.pretty" max-height="50vh" />
      <pre v-else class="json-viewer" style="max-height: 50vh">{{ body.pretty || '(sin contenido)' }}</pre>
    </template>
    <table v-else class="uk-table uk-table-small uk-table-divider uk-text-small">
      <tbody>
        <tr v-for="[k, v] in response.headers" :key="k + v">
          <td class="uk-text-bold uk-text-nowrap">{{ k }}</td>
          <td class="uk-text-break">{{ v }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
