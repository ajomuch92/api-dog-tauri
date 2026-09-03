<script setup lang="ts">
import { useBusy } from '@/composables/useBusy';

const { blockingMessage } = useBusy();
</script>

<template>
  <Transition name="fade">
    <div v-if="blockingMessage" class="busy-overlay" aria-busy="true">
      <div class="busy-card uk-card uk-card-default uk-card-body">
        <span uk-spinner="ratio: 1.2"></span>
        <p class="uk-margin-small-top uk-margin-remove-bottom">{{ blockingMessage }}</p>
      </div>
    </div>
  </Transition>
</template>
