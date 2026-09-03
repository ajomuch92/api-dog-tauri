<script setup lang="ts">
import { useBusy } from '@/composables/useBusy';

const { pending } = useBusy();
</script>

<template>
  <Transition name="fade">
    <div v-if="pending" class="global-progress" role="progressbar" aria-busy="true">
      <div class="global-progress-bar"></div>
    </div>
  </Transition>
</template>
