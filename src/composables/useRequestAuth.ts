import { ref, watch, type Ref } from 'vue';
import type { RequestAuth } from '@/types/apidog';
import { emptyAuth } from '@/utils/auth';

const STORAGE_PREFIX = 'apidog-client.auth.';

/**
 * Autenticación del runner, persistida por proyecto en localStorage para
 * reutilizar el mismo token entre endpoints.
 */
export function useRequestAuth(projectId: Ref<number | null>) {
  const auth = ref<RequestAuth>(emptyAuth());

  function storageKey() {
    return projectId.value ? `${STORAGE_PREFIX}${projectId.value}` : null;
  }

  function load() {
    const key = storageKey();
    auth.value = emptyAuth();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) auth.value = { ...emptyAuth(), ...(JSON.parse(raw) as Partial<RequestAuth>) };
    } catch {
      /* almacenamiento no disponible o JSON corrupto */
    }
  }

  function save() {
    const key = storageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(auth.value));
    } catch {
      /* ignorar */
    }
  }

  function reset() {
    auth.value = emptyAuth();
    save();
  }

  watch(projectId, load, { immediate: true });
  watch(auth, save, { deep: true });

  return { auth, reset, load };
}
