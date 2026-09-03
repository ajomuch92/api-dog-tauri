<script setup lang="ts">
import { useCliStatus } from '@/composables/useCliStatus';
import { useNotify } from '@/composables/useNotify';
import { useBusy } from '@/composables/useBusy';
import { useSession } from '@/stores/session';

const { status, checking, logout, refresh } = useCliStatus();
const { withBlocking } = useBusy();
const { state } = useSession();
const notify = useNotify();

async function onLogout() {
  if (!(await notify.confirm('¿Cerrar la sesión del CLI de Apidog?', 'Cerrar sesión'))) return;
  try {
    await withBlocking('Cerrando sesión…', logout);
    notify.info('Sesión cerrada');
  } catch (err) {
    notify.error(err as never);
  }
}
</script>

<template>
  <nav class="uk-navbar-container app-header" uk-navbar>
    <div class="uk-navbar-left">
      <a class="uk-navbar-item uk-logo uk-text-bold" href="#" @click.prevent>
        <span uk-icon="icon: bolt" class="uk-margin-small-right"></span>Apidog Client
      </a>
      <span v-if="state.project" class="uk-navbar-item uk-text-muted uk-text-small">
        <span uk-icon="icon: chevron-right"></span>
        {{ state.project.name }}
      </span>
    </div>
    <div class="uk-navbar-right">
      <div class="uk-navbar-item uk-text-small uk-text-muted">
        <span v-if="status?.version" class="uk-margin-right">CLI v{{ status.version }}</span>
        <span v-if="status?.user">{{ status.user.email }}</span>
      </div>
      <div class="uk-navbar-item">
        <span v-if="checking" class="uk-margin-small-right uk-icon-button" uk-spinner="ratio: 0.6"></span>
        <button v-else class="uk-icon-button uk-margin-small-right" uk-icon="refresh" uk-tooltip="Revisar estado del CLI" @click="refresh"></button>
        <button class="uk-icon-button" uk-icon="sign-out" uk-tooltip="Cerrar sesión" @click="onLogout"></button>
      </div>
    </div>
  </nav>
</template>
