<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import CliStatusGate from '@/components/auth/CliStatusGate.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import GlobalProgress from '@/components/common/GlobalProgress.vue';
import BusyOverlay from '@/components/common/BusyOverlay.vue';
import { useCliStatus } from '@/composables/useCliStatus';

const { checking, ready, status, refresh } = useCliStatus();

onMounted(refresh);
</script>

<template>
  <GlobalProgress />
  <BusyOverlay />
  <div v-if="checking && !status" class="gate">
    <LoadingSpinner label="Comprobando el CLI de Apidog…" :ratio="1.2" />
  </div>
  <AppShell v-else-if="ready" />
  <CliStatusGate v-else />
</template>
