import { reactive, readonly } from 'vue';
import type { CliStatus, Project } from '@/types/apidog';

interface SessionState {
  checking: boolean;
  status: CliStatus | null;
  project: Project | null;
  endpointId: number | null;
  /** Se incrementa para forzar recargas de listas tras crear/editar/borrar. */
  revision: number;
}

const state = reactive<SessionState>({
  checking: true,
  status: null,
  project: null,
  endpointId: null,
  revision: 0,
});

export function useSession() {
  return {
    state: readonly(state),
    setChecking(value: boolean) {
      state.checking = value;
    },
    setStatus(status: CliStatus | null) {
      state.status = status;
    },
    selectProject(project: Project | null) {
      state.project = project;
      state.endpointId = null;
    },
    selectEndpoint(id: number | null) {
      state.endpointId = id;
    },
    bumpRevision() {
      state.revision += 1;
    },
  };
}
