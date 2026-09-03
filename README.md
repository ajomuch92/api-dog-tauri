# Apidog Client (Tauri + Vue + UIkit)

Cliente de escritorio ligero para [Apidog](https://apidog.com) construido sobre el
**CLI oficial de Apidog**. La app no habla con la API de Apidog directamente: cada
acción ejecuta `apidog <comando>` mediante `std::process::Command` y parsea su salida JSON.

## Requisitos

- Node.js + pnpm, Rust (toolchain estable) y los prerequisitos de Tauri 2.
- El CLI de Apidog instalado y con sesión iniciada:

```bash
npm install -g apidog-cli
apidog auth login --with-token <tu-personal-access-token>
```

Si el binario no está en el `PATH` que ve la app (típico con nvm/fnm al lanzarla
desde el escritorio), la app intenta resolverlo con un shell de login. También
puedes fijarlo con la variable de entorno `APIDOG_CLI=/ruta/al/binario`.

## Desarrollo

```bash
pnpm install
pnpm tauri dev
```

### UI en el navegador (sin Tauri)

`pnpm dev` y abrir `http://localhost:1420` carga un mock del backend
(`src/dev/mockTauri.ts`) con datos de ejemplo, útil para trabajar la interfaz sin
el CLI. Escenarios: `?mock=logged-out` (login), `?mock=not-installed` (instalación),
`?mock=app&tab=request&send=1` (runner con respuesta). El mock solo se carga en
modo desarrollo y cuando no existe el runtime de Tauri.

### Pruebas

```bash
cd src-tauri
cargo test               # unitarias (parseo de la salida del CLI)
cargo test -- --ignored  # integración de solo lectura contra el CLI real (requiere sesión)
```

## Funcionalidades

- Detección del CLI y de la sesión (pantalla de login con access token si falta).
- Listado de proyectos y árbol de carpetas/endpoints con filtros por texto, método y estado.
- Detalle de endpoint: parámetros, body (esquema y ejemplo) y respuestas.
- Crear, editar (campos básicos o JSON completo validado con `cli-schema validate`) y eliminar endpoints.
- Crear, renombrar/mover y eliminar carpetas.
- Enviar peticiones al endpoint desde Rust (`reqwest`): selección de ambiente, resolución de
  `{{variables}}` globales, query, headers y body editables, visor de respuesta.

## Estructura

```
src-tauri/src/
  apidog/cli.rs        # localiza el binario, ejecuta comandos, parsea el sobre JSON
  apidog/error.rs      # CliError serializable (kind: not-installed, not-logged-in, cli, validation…)
  commands/*.rs        # comandos Tauri por recurso: auth, projects, endpoints, folders,
                       # environments, variables, http (cliente de peticiones)
src/
  services/apidog.ts   # wrapper tipado de invoke()
  stores/session.ts    # estado global (proyecto/endpoint seleccionados, estado del CLI)
  composables/         # useCliStatus, useProjects, useEndpoints, useEnvironments, useNotify…
  components/
    layout/            # AppShell, AppHeader
    auth/              # CliStatusGate, LoginForm
    projects/          # ProjectList, ProjectCard
    endpoints/         # EndpointExplorer, EndpointTree(+Node), EndpointDetail, EndpointForm,
                       # EndpointOverview, EndpointJsonEditor, EndpointFilters, MethodBadge
    folders/           # FolderForm
    request/           # RequestRunner, KeyValueEditor, ResponseViewer
    common/            # BaseModal, JsonViewer, ErrorAlert, EmptyState, LoadingSpinner
  utils/               # tree (árbol de carpetas), url (variables/base URL), json, methods
```

## Comandos del CLI utilizados

| Acción | Comando |
| --- | --- |
| Estado | `apidog --version`, `apidog auth whoami` |
| Login / logout | `apidog auth login --with-token`, `apidog auth logout` |
| Proyectos | `apidog project list`, `apidog project get <id>` |
| Endpoints | `apidog endpoint list/get/create/update/delete --project <id>` |
| Carpetas | `apidog folder list/create/update/delete --project <id> --type endpoint` |
| Ambientes | `apidog environment list --project <id>` |
| Variables | `apidog variables list --project <id> --scope global` |
| Validación | `apidog cli-schema validate endpoint-create|endpoint-update|folder-create --file` |
