import { invoke } from '@tauri-apps/api/core';
import { useSession } from '@/stores/session';
import type {
  CliError,
  CliStatus,
  CliUser,
  EndpointDetail,
  EndpointFields,
  EndpointFilters,
  EndpointSummary,
  Environment,
  Folder,
  GlobalVariable,
  HttpRequestInput,
  HttpResponseOutput,
  Project,
  ProjectDetail,
} from '@/types/apidog';

/** Normaliza cualquier rechazo de `invoke` a un `CliError`. */
export function toCliError(err: unknown): CliError {
  if (err && typeof err === 'object' && 'kind' in err && 'message' in err) {
    return err as CliError;
  }
  return { kind: 'cli', message: typeof err === 'string' ? err : String(err) };
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const session = useSession();
  session.beginCall();
  try {
    return await invoke<T>(command, args);
  } catch (err) {
    throw toCliError(err);
  } finally {
    session.endCall();
  }
}

export const apidog = {
  // --- Auth / estado del CLI --------------------------------------------
  cliStatus: () => call<CliStatus>('cli_status'),
  login: (token: string, apiBaseUrl?: string) =>
    call<CliUser>('auth_login', { token, apiBaseUrl: apiBaseUrl || null }),
  logout: () => call<void>('auth_logout'),

  // --- Proyectos ----------------------------------------------------------
  listProjects: (teamId?: string) => call<Project[]>('list_projects', { teamId: teamId || null }),
  getProject: (projectId: string | number) =>
    call<ProjectDetail>('get_project', { projectId: String(projectId) }),

  // --- Endpoints ----------------------------------------------------------
  listEndpoints: (projectId: string | number, filters?: EndpointFilters) =>
    call<EndpointSummary[]>('list_endpoints', { projectId: String(projectId), filters: filters ?? null }),
  getEndpoint: (projectId: string | number, endpointId: string | number) =>
    call<EndpointDetail>('get_endpoint', {
      projectId: String(projectId),
      endpointId: String(endpointId),
    }),
  createEndpoint: (projectId: string | number, payload: Record<string, unknown>) =>
    call<EndpointDetail>('create_endpoint', { projectId: String(projectId), payload }),
  updateEndpointFields: (
    projectId: string | number,
    endpointId: string | number,
    fields: EndpointFields,
  ) =>
    call<EndpointDetail>('update_endpoint_fields', {
      projectId: String(projectId),
      endpointId: String(endpointId),
      fields,
    }),
  updateEndpointJson: (
    projectId: string | number,
    endpointId: string | number,
    payload: Record<string, unknown>,
  ) =>
    call<EndpointDetail>('update_endpoint_json', {
      projectId: String(projectId),
      endpointId: String(endpointId),
      payload,
    }),
  deleteEndpoint: (projectId: string | number, endpointId: string | number) =>
    call<unknown>('delete_endpoint', {
      projectId: String(projectId),
      endpointId: String(endpointId),
    }),

  // --- Carpetas -----------------------------------------------------------
  listFolders: (projectId: string | number, folderTypeName = 'endpoint') =>
    call<Folder[]>('list_folders', { projectId: String(projectId), folderTypeName }),
  createFolder: (projectId: string | number, name: string, parentId?: number | null) =>
    call<Folder>('create_folder', {
      projectId: String(projectId),
      name,
      parentId: parentId ?? null,
      folderTypeName: 'endpoint',
    }),
  updateFolder: (
    projectId: string | number,
    folderId: string | number,
    changes: { name?: string; description?: string; parentId?: number | null },
  ) =>
    call<Folder>('update_folder', {
      projectId: String(projectId),
      folderId: String(folderId),
      name: changes.name ?? null,
      description: changes.description ?? null,
      parentId: changes.parentId ?? null,
      folderTypeName: 'endpoint',
    }),
  deleteFolder: (projectId: string | number, folderId: string | number) =>
    call<unknown>('delete_folder', {
      projectId: String(projectId),
      folderId: String(folderId),
      folderTypeName: 'endpoint',
    }),

  // --- Ambientes y variables ---------------------------------------------
  listEnvironments: (projectId: string | number) =>
    call<Environment[]>('list_environments', { projectId: String(projectId) }),
  listGlobalVariables: (projectId: string | number) =>
    call<GlobalVariable[]>('list_global_variables', { projectId: String(projectId) }),

  // --- Cliente HTTP -------------------------------------------------------
  sendRequest: (request: HttpRequestInput) =>
    call<HttpResponseOutput>('send_request', { request }),
};
