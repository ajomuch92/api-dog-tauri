<script setup lang="ts">
import { useCliStatus } from '@/composables/useCliStatus';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import LoginForm from './LoginForm.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';

const { status, checking, refresh } = useCliStatus();
</script>

<template>
  <div class="uk-flex uk-flex-center uk-flex-middle gate">
    <ThemeToggle class="gate-theme-toggle" />
    <div class="uk-card uk-card-default uk-card-body uk-width-large">
      <h2 class="uk-card-title uk-margin-small-bottom">
        <span uk-icon="icon: bolt; ratio: 1.3" class="uk-margin-small-right"></span>Apidog Client
      </h2>

      <template v-if="!status?.installed">
        <p class="uk-text-muted">
          Este cliente necesita el CLI de Apidog instalado en tu sistema.
        </p>
        <pre class="uk-text-small">npm install -g apidog-cli</pre>
        <p class="uk-text-small uk-text-muted">
          Si ya está instalado pero no se detecta, define la variable de entorno
          <code>APIDOG_CLI</code> con la ruta completa al binario.
        </p>
        <button class="uk-button uk-button-primary" :disabled="checking" @click="refresh">
          <span v-if="checking" uk-spinner="ratio: 0.6" class="uk-margin-small-right"></span>
          <span v-else uk-icon="refresh" class="uk-margin-small-right"></span>Volver a comprobar
        </button>
      </template>

      <template v-else>
        <p class="uk-text-muted uk-margin-small-bottom">
          CLI detectado <span v-if="status?.version">(v{{ status.version }})</span> en
          <code class="uk-text-small">{{ status?.binaryPath }}</code>
        </p>
        <ErrorAlert :error="status?.error ?? null" compact />
        <LoginForm />
      </template>
    </div>
  </div>
</template>
