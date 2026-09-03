import { createApp } from 'vue';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import 'uikit/dist/css/uikit.min.css';
import '@/styles/app.css';
import App from './App.vue';

UIkit.use(Icons);

async function bootstrap() {
  // En el navegador (sin runtime de Tauri) se usa un mock del backend.
  if (import.meta.env.DEV && !('__TAURI_INTERNALS__' in window)) {
    await import('@/dev/mockTauri');
  }
  createApp(App).mount('#app');
}

void bootstrap();
