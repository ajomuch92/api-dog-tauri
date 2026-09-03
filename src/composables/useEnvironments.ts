import { ref, watch, type Ref } from 'vue';
import { apidog, toCliError } from '@/services/apidog';
import type { CliError, Environment, GlobalVariable } from '@/types/apidog';

export function useEnvironments(projectId: Ref<number | null>) {
  const environments = ref<Environment[]>([]);
  const variables = ref<GlobalVariable[]>([]);
  const loading = ref(false);
  const error = ref<CliError | null>(null);

  async function load() {
    if (!projectId.value) return;
    loading.value = true;
    error.value = null;
    try {
      const [envs, vars] = await Promise.all([
        apidog.listEnvironments(projectId.value),
        apidog.listGlobalVariables(projectId.value).catch(() => [] as GlobalVariable[]),
      ]);
      environments.value = envs;
      variables.value = vars;
    } catch (err) {
      error.value = toCliError(err);
    } finally {
      loading.value = false;
    }
  }

  watch(projectId, load, { immediate: true });

  return { environments, variables, loading, error, load };
}
