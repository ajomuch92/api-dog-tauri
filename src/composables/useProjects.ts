import { apidog } from '@/services/apidog';
import type { Project } from '@/types/apidog';
import { useAsync } from './useAsync';

export function useProjects() {
  const { data: projects, loading, error, run } = useAsync<Project[]>([]);
  const load = () => run(() => apidog.listProjects());
  return { projects, loading, error, load };
}
