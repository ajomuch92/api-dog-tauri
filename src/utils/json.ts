/** Genera un ejemplo a partir de un JSON Schema sencillo (sin $ref). */
export function exampleFromSchema(schema: Record<string, unknown> | undefined, depth = 0): unknown {
  if (!schema || depth > 6) return null;
  if ('example' in schema) return schema.example;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case 'object': {
      const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const order = (schema['x-apidog-orders'] as string[] | undefined) ?? Object.keys(props);
      const out: Record<string, unknown> = {};
      for (const key of order) if (props[key]) out[key] = exampleFromSchema(props[key], depth + 1);
      return out;
    }
    case 'array':
      return [exampleFromSchema(schema.items as Record<string, unknown>, depth + 1)];
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'string':
      return schema.format === 'date-time' ? new Date().toISOString() : 'string';
    default:
      return null;
  }
}

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function tryPrettyJsonText(text: string): { pretty: string; isJson: boolean } {
  try {
    return { pretty: JSON.stringify(JSON.parse(text), null, 2), isJson: true };
  } catch {
    return { pretty: text, isJson: false };
  }
}

/** Campos que devuelve `endpoint get` pero que no deben enviarse en update. */
const READ_ONLY_FIELDS = [
  'id',
  'projectId',
  'createdAt',
  'updatedAt',
  'creatorId',
  'editorId',
  'creatorUserId',
  'editorUserId',
  'ordering',
];

export function stripReadOnlyFields(endpoint: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...endpoint };
  for (const key of READ_ONLY_FIELDS) delete copy[key];
  return copy;
}
