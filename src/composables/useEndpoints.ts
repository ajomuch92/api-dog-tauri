import { computed, ref, watch, type Ref } from 'vue';
import { apidog, toCliError } from '@/services/apidog';
import type { CliError, EndpointSummary, Folder } from '@/types/apidog';
import { buildTree } from '@/utils/tree';

/** Lista de endpoints + carpetas de un proyecto, con árbol y filtros locales. */
export function useEndpoints(projectId: Ref<number | null>, revision: Ref<number>) {
  const endpoints = ref<EndpointSummary[]>([]);
  const folders = ref<Folder[]>([]);
  const loading = ref(false);
  const error = ref<CliError | null>(null);

  const search = ref('');
  const method = ref('');
  const status = ref('');

  async function load() {
    if (!projectId.value) {
      endpoints.value = [];
      folders.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const [eps, fds] = await Promise.all([
        apidog.listEndpoints(projectId.value),
        apidog.listFolders(projectId.value),
      ]);
      endpoints.value = eps;
      folders.value = fds;
    } catch (err) {
      error.value = toCliError(err);
    } finally {
      loading.value = false;
    }
  }

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase();
    return endpoints.value.filter((e) => {
      if (method.value && e.method.toLowerCase() !== method.value) return false;
      if (status.value && e.status !== status.value) return false;
      if (term && !`${e.name} ${e.path}`.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  const hasActiveFilters = computed(
    () => !!(search.value.trim() || method.value || status.value),
  );

  const tree = computed(() => buildTree(folders.value, filtered.value, hasActiveFilters.value));

  watch([projectId, revision], load, { immediate: true });

  return { endpoints, folders, filtered, tree, loading, error, search, method, status, hasActiveFilters, load };
}
