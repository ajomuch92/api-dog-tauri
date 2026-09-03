import type { EndpointDetail, EndpointSummary, Environment, Folder, GlobalVariable, Project } from '@/types/apidog';

export const projects: Project[] = [
  { id: 100, name: 'Demo Shop', description: 'Catálogo, carrito y pedidos de la tienda de ejemplo.' },
  { id: 200, name: 'Auth Service', description: 'Emisión y validación de tokens.' },
];

export const folders: Folder[] = [
  { id: 1, name: 'Root', parentId: 0, path: 'Root' },
  { id: 10, name: 'Productos', parentId: 0, path: 'Productos' },
  { id: 11, name: 'Categorías', parentId: 10, path: 'Productos/Categorías' },
  { id: 20, name: 'Pedidos', parentId: 0, path: 'Pedidos' },
];

export const endpoints: EndpointSummary[] = [
  { id: 1001, name: 'Listar productos', method: 'get', path: '/products', status: 'released', folderId: 10 },
  { id: 1002, name: 'Crear producto', method: 'post', path: '/products', status: 'developing', folderId: 10 },
  { id: 1003, name: 'Actualizar producto', method: 'put', path: '/products/{id}', status: 'testing', folderId: 10 },
  { id: 1004, name: 'Eliminar producto', method: 'delete', path: '/products/{id}', status: 'deprecated', folderId: 10 },
  { id: 1005, name: 'Listar categorías', method: 'get', path: '{{CATALOG_URL}}/categories', status: 'released', folderId: 11 },
  { id: 2001, name: 'Crear pedido', method: 'post', path: '/orders', status: 'released', folderId: 20 },
  { id: 3001, name: 'Health', method: 'get', path: '/health', status: 'released', folderId: 0 },
];

export const environments: Environment[] = [
  { id: 1, name: 'DEV', baseUrls: { default: 'https://dev.demo-shop.test/api', '5': 'https://dev.demo-shop.test/catalog' } },
  { id: 2, name: 'LOCAL', baseUrls: { default: 'http://localhost:3000/api' } },
];

export const variables: GlobalVariable[] = [
  { name: 'CATALOG_URL', value: 'https://catalog.demo-shop.test/v1', description: 'Base del servicio de catálogo' },
  { name: 'ACCESS_TOKEN', value: 'demo-token-123', description: 'Token de pruebas' },
];

const baseDetail = (s: EndpointSummary): EndpointDetail => ({
  ...s,
  description: '',
  tags: [],
  parameters: { query: [], path: [], header: [], cookie: [] },
  requestBody: { type: 'none' },
  responses: [],
  projectId: 100,
  moduleId: 5,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-09-01T12:30:00.000Z',
});

export const details: Record<number, EndpointDetail> = Object.fromEntries(
  endpoints.map((e) => [e.id, baseDetail(e)]),
);

details[1002] = {
  ...details[1002],
  auth: { type: 'bearer', bearer: { token: '{{ACCESS_TOKEN}}' } },
  description: 'Crea un producto nuevo dentro del catálogo.',
  tags: ['products', 'admin'],
  parameters: {
    query: [],
    path: [],
    header: [{ id: 'X-Tenant#0', name: 'X-Tenant', required: true, type: 'string', example: 'acme', description: 'Tenant' }],
    cookie: [],
  },
  requestBody: {
    type: 'application/json',
    parameters: [],
    jsonSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name', 'price'],
      'x-apidog-orders': ['name', 'price', 'stock', 'active'],
    },
    examples: [{ value: '{\n  "name": "Teclado",\n  "price": 49.9,\n  "stock": 12,\n  "active": true\n}', mediaType: 'application/json' }],
  },
  responses: [
    { id: 1, name: 'Creado', code: 201, contentType: 'json', jsonSchema: { type: 'object', properties: { id: { type: 'integer' } } } },
    { id: 2, name: 'Validación', code: 422, contentType: 'json', description: 'Errores de validación' },
  ],
};

details[1003] = {
  ...details[1003],
  auth: { type: 'apikey', apikey: { key: 'X-API-Key', value: 'demo-key', in: 'header' } },
  parameters: {
    query: [{ id: 'dryRun#0', name: 'dryRun', required: false, type: 'boolean', example: 'false' }],
    path: [{ id: 'id#0', name: 'id', required: true, type: 'integer', example: '42' }],
    header: [],
    cookie: [],
  },
  requestBody: { type: 'application/json', jsonSchema: { type: 'object', properties: { price: { type: 'number' } } } },
};
