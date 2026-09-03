export type ErrorKind =
  | 'not-installed'
  | 'not-logged-in'
  | 'cli'
  | 'validation'
  | 'parse'
  | 'io'
  | 'http';

export interface CliError {
  kind: ErrorKind;
  message: string;
  code?: string | null;
  suggestion?: string | null;
  exitCode?: number | null;
  raw?: string | null;
}

export interface CliUser {
  id: number;
  email: string;
}

export interface CliStatus {
  installed: boolean;
  binaryPath: string | null;
  version: string | null;
  loggedIn: boolean;
  user: CliUser | null;
  error: CliError | null;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface ProjectModule {
  id: number;
  name: string;
  endpointCount: number;
  moduleType: string;
  updatedAt?: string;
}

export interface ProjectDetail extends Project {
  teamId: number;
  modules: ProjectModule[];
  statistics?: Record<string, number>;
}

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const ENDPOINT_STATUSES = [
  'designing',
  'pending',
  'developing',
  'integrating',
  'testing',
  'tested',
  'released',
  'deprecated',
  'exception',
  'obsolete',
] as const;
export type EndpointStatus = (typeof ENDPOINT_STATUSES)[number];

export interface EndpointSummary {
  id: number;
  name: string;
  method: string;
  path: string;
  status: string;
  folderId: number;
}

export interface EndpointParameter {
  id?: string;
  name: string;
  required?: boolean;
  description?: string;
  enable?: boolean;
  example?: string | string[];
  type?: string;
  schema?: Record<string, unknown>;
}

export interface EndpointParameters {
  query?: EndpointParameter[];
  path?: EndpointParameter[];
  header?: EndpointParameter[];
  cookie?: EndpointParameter[];
}

export interface RequestBodyExample {
  value: string;
  mediaType?: string;
  description?: string;
}

export interface EndpointRequestBody {
  type?: string;
  parameters?: EndpointParameter[];
  jsonSchema?: Record<string, unknown>;
  data?: string;
  description?: string;
  required?: boolean;
  examples?: RequestBodyExample[];
}

export interface EndpointResponse {
  id?: number | string;
  name?: string;
  code?: number | string;
  contentType?: string;
  description?: string;
  headers?: EndpointParameter[];
  jsonSchema?: Record<string, unknown>;
}

export interface EndpointDetail extends EndpointSummary {
  description?: string;
  tags?: string[];
  parameters?: EndpointParameters;
  requestBody?: EndpointRequestBody;
  responses?: EndpointResponse[];
  auth?: EndpointAuth;
  projectId?: number;
  moduleId?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EndpointFilters {
  method?: string;
  status?: string;
  folderId?: string;
  tag?: string;
  nameContains?: string;
  pathContains?: string;
}

export interface EndpointFields {
  name?: string;
  method?: string;
  path?: string;
  status?: string;
  folderId?: string;
  description?: string;
  tags?: string[];
}

export interface Folder {
  id: number;
  name: string;
  parentId: number;
  path: string;
  description?: string;
}

export interface Environment {
  id: number;
  name: string;
  baseUrls: Record<string, string>;
}

export interface GlobalVariable {
  name: string;
  value: string;
  initialValue?: string;
  description?: string;
}

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface HttpRequestInput {
  method: string;
  url: string;
  headers: KeyValue[];
  query: KeyValue[];
  body?: string | null;
  contentType?: string | null;
  insecure?: boolean;
  timeoutMs?: number;
}

export interface HttpResponseOutput {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  durationMs: number;
  sizeBytes: number;
  finalUrl: string;
}

// --- Autenticación del cliente ligero ---------------------------------------
export type RequestAuthType = 'none' | 'bearer' | 'basic' | 'apikey' | 'custom';

export interface RequestAuth {
  type: RequestAuthType;
  /** Bearer */
  token: string;
  /** Prefijo del esquema para bearer (por defecto "Bearer"). */
  prefix: string;
  /** Basic */
  username: string;
  password: string;
  /** API key y custom */
  key: string;
  value: string;
  addTo: 'header' | 'query';
}

/** Objeto `auth` tal como lo devuelve `apidog endpoint get`. */
export interface EndpointAuth {
  type?: string;
  apikey?: { key?: string; value?: string; in?: 'header' | 'query' };
  bearer?: { token?: string };
  basic?: { username?: string; password?: string };
}
