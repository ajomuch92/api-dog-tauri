import { ref, shallowRef } from 'vue';
import { toCliError } from '@/services/apidog';
import type { CliError } from '@/types/apidog';

/** Estado estándar de carga/error para cualquier llamada al CLI. */
export function useAsync<T>(initial: T) {
  const data = shallowRef<T>(initial);
  const loading = ref(false);
  const error = ref<CliError | null>(null);

  async function run(task: () => Promise<T>): Promise<T | undefined> {
    loading.value = true;
    error.value = null;
    try {
      data.value = await task();
      return data.value;
    } catch (err) {
      error.value = toCliError(err);
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, run };
}
