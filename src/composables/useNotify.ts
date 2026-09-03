import UIkit from 'uikit';
import type { CliError } from '@/types/apidog';

type Status = 'primary' | 'success' | 'warning' | 'danger';

function push(message: string, status: Status, timeout = 4000) {
  UIkit.notification({ message, status, pos: 'top-right', timeout });
}

export function useNotify() {
  return {
    success: (message: string) => push(message, 'success'),
    info: (message: string) => push(message, 'primary'),
    warning: (message: string) => push(message, 'warning'),
    error: (err: CliError | string) => {
      const message = typeof err === 'string' ? err : err.message;
      push(message, 'danger', 7000);
    },
    /** Devuelve `true` si el usuario confirmó. */
    confirm: async (message: string, okLabel = 'Confirmar'): Promise<boolean> => {
      try {
        await UIkit.modal.confirm(message, { i18n: { ok: okLabel, cancel: 'Cancelar' } });
        return true;
      } catch {
        return false;
      }
    },
  };
}
