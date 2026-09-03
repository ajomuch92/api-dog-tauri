import type { EndpointAuth, KeyValue, RequestAuth } from '@/types/apidog';

export const AUTH_TYPES: Array<{ value: RequestAuth['type']; label: string }> = [
  { value: 'none', label: 'Sin autenticación' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Basic (usuario y contraseña)' },
  { value: 'apikey', label: 'API key' },
  { value: 'custom', label: 'Header personalizado' },
];

export function emptyAuth(): RequestAuth {
  return {
    type: 'none',
    token: '',
    prefix: 'Bearer',
    username: '',
    password: '',
    key: '',
    value: '',
    addTo: 'header',
  };
}

/** Convierte el `auth` definido en Apidog al modelo del runner. */
export function authFromEndpoint(auth: EndpointAuth | undefined): RequestAuth | null {
  if (!auth || !auth.type) return null;
  const base = emptyAuth();
  switch (auth.type) {
    case 'bearer':
      return { ...base, type: 'bearer', token: auth.bearer?.token ?? '' };
    case 'basic':
      return {
        ...base,
        type: 'basic',
        username: auth.basic?.username ?? '',
        password: auth.basic?.password ?? '',
      };
    case 'apikey':
      return {
        ...base,
        type: 'apikey',
        key: auth.apikey?.key ?? '',
        value: auth.apikey?.value ?? '',
        addTo: auth.apikey?.in === 'query' ? 'query' : 'header',
      };
    case 'noauth':
      return { ...base, type: 'none' };
    default:
      // inherit, oauth2, digest… no se pueden resolver aquí.
      return null;
  }
}

/** Etiqueta corta para mostrar en la pestaña. */
export function authSummary(auth: RequestAuth): string {
  switch (auth.type) {
    case 'bearer':
      return auth.token ? 'Bearer' : 'Bearer (vacío)';
    case 'basic':
      return auth.username ? `Basic · ${auth.username}` : 'Basic (vacío)';
    case 'apikey':
      return auth.key ? `API key · ${auth.key}` : 'API key (vacía)';
    case 'custom':
      return auth.key ? `Header · ${auth.key}` : 'Header (vacío)';
    default:
      return 'Ninguna';
  }
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function upsert(rows: KeyValue[], key: string, value: string): KeyValue[] {
  const idx = rows.findIndex((r) => r.key.trim().toLowerCase() === key.toLowerCase());
  const row = { key, value, enabled: true };
  if (idx >= 0) return rows.map((r, i) => (i === idx ? row : r));
  return [...rows, row];
}

/**
 * Devuelve copias de headers/query con la autenticación aplicada.
 * No modifica los arreglos originales para que el usuario siga viendo
 * sus filas tal como las escribió.
 */
export function applyAuth(
  auth: RequestAuth,
  headers: KeyValue[],
  query: KeyValue[],
): { headers: KeyValue[]; query: KeyValue[] } {
  switch (auth.type) {
    case 'bearer': {
      if (!auth.token) return { headers, query };
      const prefix = auth.prefix.trim();
      const value = prefix ? `${prefix} ${auth.token.trim()}` : auth.token.trim();
      return { headers: upsert(headers, 'Authorization', value), query };
    }
    case 'basic': {
      if (!auth.username && !auth.password) return { headers, query };
      const value = `Basic ${encodeBase64(`${auth.username}:${auth.password}`)}`;
      return { headers: upsert(headers, 'Authorization', value), query };
    }
    case 'apikey':
    case 'custom': {
      if (!auth.key.trim()) return { headers, query };
      if (auth.type === 'apikey' && auth.addTo === 'query') {
        return { headers, query: upsert(query, auth.key.trim(), auth.value) };
      }
      return { headers: upsert(headers, auth.key.trim(), auth.value), query };
    }
    default:
      return { headers, query };
  }
}
