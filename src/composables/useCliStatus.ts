import { computed } from 'vue';
import { apidog } from '@/services/apidog';
import { useSession } from '@/stores/session';

export function useCliStatus() {
  const session = useSession();

  async function refresh() {
    session.setChecking(true);
    try {
      session.setStatus(await apidog.cliStatus());
    } finally {
      session.setChecking(false);
    }
  }

  async function login(token: string, apiBaseUrl?: string) {
    await apidog.login(token, apiBaseUrl);
    await refresh();
  }

  async function logout() {
    await apidog.logout();
    session.selectProject(null);
    await refresh();
  }

  const ready = computed(
    () => !!session.state.status?.installed && !!session.state.status?.loggedIn,
  );

  return { status: computed(() => session.state.status), checking: computed(() => session.state.checking), ready, refresh, login, logout };
}
