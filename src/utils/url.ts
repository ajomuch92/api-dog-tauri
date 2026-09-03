import type { EndpointDetail, Environment, GlobalVariable } from '@/types/apidog';

const VARIABLE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function toVariableMap(vars: GlobalVariable[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of vars) map[v.name] = v.value ?? v.initialValue ?? '';
  return map;
}

/** Sustituye `{{NOMBRE}}` por su valor; deja intactas las desconocidas. */
export function resolveVariables(text: string, vars: Record<string, string>): string {
  return text.replace(VARIABLE_RE, (match, name: string) =>
    name in vars && vars[name] !== '' ? vars[name] : match,
  );
}

export function unresolvedVariables(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(VARIABLE_RE)) found.add(m[1]);
  return [...found];
}

/** URL inicial para el runner: base del ambiente (por módulo) + path. */
export function buildRequestUrl(
  endpoint: EndpointDetail,
  env: Environment | null,
  vars: Record<string, string>,
): string {
  const path = resolveVariables(endpoint.path ?? '', vars);
  if (/^https?:\/\//i.test(path)) return path;

  let base = '';
  if (env) {
    const byModule = endpoint.moduleId ? env.baseUrls[String(endpoint.moduleId)] : '';
    base = byModule || env.baseUrls.default || '';
  }
  base = resolveVariables(base, vars).replace(/\/+$/, '');
  const suffix = path.startsWith('/') || path.startsWith('{{') ? path : `/${path}`;
  return `${base}${suffix}`;
}
