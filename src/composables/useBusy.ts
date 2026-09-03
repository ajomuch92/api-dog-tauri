import { computed } from 'vue';
import { useSession } from '@/stores/session';

/** Estado de carga global: barra de progreso y overlay bloqueante. */
export function useBusy() {
  const session = useSession();

  /**
   * Ejecuta `task` mostrando un overlay que bloquea la UI con `message`.
   * Para acciones que no deben interrumpirse (eliminar, cerrar sesión).
   */
  async function withBlocking<T>(message: string, task: () => Promise<T>): Promise<T> {
    session.setBlocking(message);
    try {
      return await task();
    } finally {
      session.setBlocking(null);
    }
  }

  return {
    pending: computed(() => session.state.pending > 0),
    blockingMessage: computed(() => session.state.blockingMessage),
    withBlocking,
  };
}
