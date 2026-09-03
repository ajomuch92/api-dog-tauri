<script setup lang="ts">
import { computed } from 'vue';
import { prettyJson } from '@/utils/json';

const props = defineProps<{ value: unknown; maxHeight?: string }>();

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Resaltado ligero sin dependencias externas. */
const html = computed(() => {
  const text = typeof props.value === 'string' ? props.value : prettyJson(props.value);
  return escape(text).replace(
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (match.startsWith('"')) cls = match.endsWith(':') ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-boolean';
      else if (match === 'null') cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    },
  );
});
</script>

<template>
  <pre class="json-viewer" :style="{ maxHeight: maxHeight ?? '60vh' }" v-html="html"></pre>
</template>
