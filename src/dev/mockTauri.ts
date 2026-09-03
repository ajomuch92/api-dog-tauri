/**
 * Mock de `window.__TAURI_INTERNALS__` para desarrollar la UI en un navegador
 * normal (`pnpm dev`) sin el runtime de Tauri ni el CLI de Apidog.
 *
 * Escenarios via query string:
 *   ?mock=logged-out   → pantalla de login
 *   ?mock=not-installed→ pantalla de instalación
 *   (por defecto)      → sesión activa con el primer proyecto/endpoint seleccionados
 */
import { useSession } from '@/stores/session';
import type { CliError, CliStatus, EndpointDetail, EndpointSummary, Folder } from '@/types/apidog';
import * as fx from './fixtures';

type Args = Record<string, any>;
type Handler = (args: Args) => unknown;

const scenario = new URLSearchParams(location.search).get('mock') ?? 'app';
const latency = new URLSearchParams(location.search).get('slow') ? 8000 : 350;
let loggedIn = scenario !== 'logged-out';
const installed = scenario !== 'not-installed';

const folders: Folder[] = [...fx.folders];
const endpoints: EndpointSummary[] = [...fx.endpoints];
const details: Record<number, EndpointDetail> = { ...fx.details };
let nextId = 9000;

const fail = (message: string, kind: CliError['kind'] = 'cli'): never => {
  throw { kind, message } satisfies CliError;
};

const status = (): CliStatus => ({
  installed,
  binaryPath: installed ? '/usr/local/bin/apidog' : null,
  version: installed ? '2.2.9' : null,
  loggedIn: installed && loggedIn,
  user: installed && loggedIn ? { id: 1, email: 'dev@example.com' } : null,
  error: null,
});

const handlers: Record<string, Handler> = {
  cli_status: () => status(),
  auth_login: ({ token }) => {
    if (!token) fail('Token vacío', 'validation');
    loggedIn = true;
    return status().user;
  },
  auth_logout: () => {
    loggedIn = false;
  },

  list_projects: () => fx.projects,
  get_project: ({ projectId }) => fx.projects.find((p) => String(p.id) === projectId) ?? fail('Not found'),

  list_endpoints: () => [...endpoints],
  get_endpoint: ({ endpointId }) => details[Number(endpointId)] ?? fail('Not found'),
  create_endpoint: ({ payload }) => {
    if (!payload.method || !payload.path) fail('endpoint-create data file is invalid', 'validation');
    const summary: EndpointSummary = {
      id: nextId++,
      name: payload.name ?? payload.path,
      method: payload.method,
      path: payload.path,
      status: payload.status ?? 'designing',
      folderId: payload.folderId ?? 0,
    };
    endpoints.push(summary);
    details[summary.id] = { ...summary, description: payload.description ?? '', tags: payload.tags ?? [] };
    return details[summary.id];
  },
  update_endpoint_fields: ({ endpointId, fields }) => {
    const d = details[Number(endpointId)] ?? fail('Not found');
    const patch: Partial<EndpointDetail> = { ...fields };
    if (fields.folderId !== undefined) patch.folderId = Number(fields.folderId);
    Object.assign(d, patch);
    const s = endpoints.find((e) => e.id === d.id);
    if (s) Object.assign(s, { name: d.name, method: d.method, path: d.path, status: d.status, folderId: d.folderId });
    return d;
  },
  update_endpoint_json: ({ endpointId, payload }) => {
    const id = Number(endpointId);
    if (!details[id]) fail('Not found');
    details[id] = { ...payload, id };
    return details[id];
  },
  delete_endpoint: ({ endpointId }) => {
    const idx = endpoints.findIndex((e) => String(e.id) === endpointId);
    if (idx < 0) fail('Not found');
    endpoints.splice(idx, 1);
    delete details[Number(endpointId)];
  },

  list_folders: () => [...folders],
  create_folder: ({ name, parentId }) => {
    const f: Folder = { id: nextId++, name, parentId: parentId ?? 0, path: name };
    folders.push(f);
    return f;
  },
  update_folder: ({ folderId, name, parentId }) => {
    const f = folders.find((x) => String(x.id) === folderId) ?? fail('Not found');
    if (name) f.name = name;
    if (parentId !== null && parentId !== undefined) f.parentId = parentId;
    return f;
  },
  delete_folder: ({ folderId }) => {
    const idx = folders.findIndex((x) => String(x.id) === folderId);
    if (idx < 0) fail('Not found');
    folders.splice(idx, 1);
  },

  list_environments: () => fx.environments,
  list_global_variables: () => fx.variables,

  send_request: ({ request }) => ({
    status: 200,
    statusText: 'OK',
    headers: [
      ['content-type', 'application/json'],
      ['x-mock', 'true'],
    ],
    body: JSON.stringify({ ok: true, echo: { method: request.method, url: request.url } }),
    durationMs: 42,
    sizeBytes: 64,
    finalUrl: request.url,
  }),
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

(window as any).__TAURI_INTERNALS__ = {
  async invoke(cmd: string, args?: Args) {
    await delay(latency);
    const handler = handlers[cmd] ?? fail(`mock: comando "${cmd}" no implementado`);
    return handler(args ?? {});
  },
  transformCallback: () => 0,
  metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' } },
};

if (scenario === 'app') {
  const session = useSession();
  session.selectProject(fx.projects[0]);
  session.selectEndpoint(1002);

  // Navegación automática para capturas: ?tab=request&send=1
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab');
  if (tab) {
    const click = (selector: string) => (document.querySelector(selector) as HTMLElement | null)?.click();
    setTimeout(() => click(`[data-tab="${tab}"]`), 800);
    if (params.get('send')) setTimeout(() => click('[data-action="send"]'), 1400);
  }
}

console.info(`[mockTauri] escenario "${scenario}" activo`);
