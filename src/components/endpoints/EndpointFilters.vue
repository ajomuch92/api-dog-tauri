<script setup lang="ts">
import { ENDPOINT_STATUSES, HTTP_METHODS } from '@/types/apidog';

const search = defineModel<string>('search', { default: '' });
const method = defineModel<string>('method', { default: '' });
const status = defineModel<string>('status', { default: '' });
</script>

<template>
  <div class="endpoint-filters">
    <div class="uk-inline uk-width-1-1">
      <span class="uk-form-icon" uk-icon="icon: search"></span>
      <input v-model="search" class="uk-input uk-form-small" type="search" placeholder="Buscar por nombre o ruta…" />
    </div>
    <div class="uk-flex uk-margin-small-top" uk-margin>
      <select v-model="method" class="uk-select uk-form-small uk-margin-small-right">
        <option value="">Método</option>
        <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m.toUpperCase() }}</option>
      </select>
      <select v-model="status" class="uk-select uk-form-small">
        <option value="">Estado</option>
        <option v-for="s in ENDPOINT_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
  </div>
</template>
