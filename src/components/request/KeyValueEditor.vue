<script setup lang="ts">
import type { KeyValue } from '@/types/apidog';

const rows = defineModel<KeyValue[]>({ default: () => [] });
defineProps<{ keyPlaceholder?: string; valuePlaceholder?: string }>();

function add() {
  rows.value = [...rows.value, { key: '', value: '', enabled: true }];
}
function remove(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index);
}
</script>

<template>
  <div class="kv-editor">
    <div v-for="(row, i) in rows" :key="i" class="kv-row">
      <input v-model="row.enabled" class="uk-checkbox" type="checkbox" />
      <input v-model="row.key" class="uk-input uk-form-small" type="text" :placeholder="keyPlaceholder ?? 'clave'" />
      <input v-model="row.value" class="uk-input uk-form-small" type="text" :placeholder="valuePlaceholder ?? 'valor'" />
      <button class="uk-icon-link uk-text-danger" type="button" uk-icon="icon: close; ratio: 0.8" @click="remove(i)"></button>
    </div>
    <button class="uk-button uk-button-text uk-button-small" type="button" @click="add">
      <span uk-icon="icon: plus; ratio: 0.7"></span> Agregar
    </button>
  </div>
</template>
