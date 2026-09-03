<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AuthEditor from './AuthEditor.vue';
import KeyValueEditor from './KeyValueEditor.vue';
import ResponseViewer from './ResponseViewer.vue';
import ErrorAlert from '@/components/common/ErrorAlert.vue';
import MethodBadge from '@/components/endpoints/MethodBadge.vue';
import { useRequestAuth } from '@/composables/useRequestAuth';
import { apidog, toCliError } from '@/services/apidog';
import { useSession } from '@/stores/session';
import type { CliError, EndpointDetail, EndpointParameter, Environment, GlobalVariable, HttpResponseOutput, KeyValue, RequestAuth } from '@/types/apidog';
import { applyAuth, authFromEndpoint, authSummary } from '@/utils/auth';
import { exampleFromSchema, prettyJson } from '@/utils/json';
import { buildRequestUrl, resolveVariables, toVariableMap, unresolvedVariables } from '@/utils/url';

const props = defineProps<{ endpoint: EndpointDetail; environments: Environment[]; variables: GlobalVariable[] }>();

const envId = ref<number | null>(null);
const url = ref('');
const query = ref<KeyValue[]>([]);
const headers = ref<KeyValue[]>([]);
const body = ref('');
const insecure = ref(false);
const sending = ref(false);
const response = ref<HttpResponseOutput | null>(null);
const error = ref<CliError | null>(null);
const section = ref<'query' | 'headers' | 'body' | 'auth'>('query');

const { state: session } = useSession();
const projectId = computed(() => props.endpoint.projectId ?? session.project?.id ?? null);
const { auth, reset: resetAuth } = useRequestAuth(projectId);
/** Auth definida en Apidog para este endpoint, con variables resueltas. */
const suggestedAuth = computed<RequestAuth | null>(() => {
  const mapped = authFromEndpoint(props.endpoint.auth);
  if (!mapped) return null;
  const r = (v: string) => resolveVariables(v, vars.value);
  return { ...mapped, token: r(mapped.token), value: r(mapped.value), username: r(mapped.username), password: r(mapped.password) };
});
const authLabel = computed(() => authSummary(auth.value));

function applySuggested() {
  if (suggestedAuth.value) auth.value = { ...suggestedAuth.value };
}

const vars = computed(() => toVariableMap(props.variables));
const selectedEnv = computed(() => props.environments.find((e) => e.id === envId.value) ?? null);
const hasBody = computed(() => !['get', 'head'].includes(props.endpoint.method.toLowerCase()));
const pending = computed(() => unresolvedVariables(url.value));
const wrapVar = (name: string) => `{{${name}}}`;

const toRows = (list: EndpointParameter[] | undefined): KeyValue[] =>
  (list ?? []).map((p) => ({
    key: p.name,
    value: resolveVariables(Array.isArray(p.example) ? p.example[0] ?? '' : p.example ?? '', vars.value),
    enabled: p.enable !== false,
  }));

function initialBody(): string {
  const rb = props.endpoint.requestBody;
  if (!rb || !rb.type || rb.type === 'none') return '';
  const first = rb.examples?.[0]?.value;
  if (first) return resolveVariables(first, vars.value);
  if (rb.data) return rb.data;
  if (rb.jsonSchema && rb.type.includes('json')) return prettyJson(exampleFromSchema(rb.jsonSchema));
  return '';
}

function initialContentType(): string {
  const t = props.endpoint.requestBody?.type;
  return t && t !== 'none' && t !== 'graphql' ? t : 'application/json';
}

function prefill() {
  url.value = buildRequestUrl(props.endpoint, selectedEnv.value, vars.value);
  query.value = toRows(props.endpoint.parameters?.query);
  const h = toRows(props.endpoint.parameters?.header);
  if (hasBody.value && !h.some((r) => r.key.toLowerCase() === 'content-type')) {
    h.unshift({ key: 'Content-Type', value: initialContentType(), enabled: true });
  }
  headers.value = h;
  body.value = hasBody.value ? initialBody() : '';
  section.value = hasBody.value && body.value ? 'body' : 'query';
}

watch(
  () => props.environments,
  (envs) => {
    if (envId.value === null && envs.length) envId.value = envs[0].id;
  },
  { immediate: true },
);
watch([() => props.endpoint.id, envId], prefill, { immediate: true });

async function send() {
  sending.value = true;
  error.value = null;
  response.value = null;
  try {
    const withAuth = applyAuth(auth.value, headers.value, query.value);
    response.value = await apidog.sendRequest({
      method: props.endpoint.method,
      url: url.value,
      query: withAuth.query,
      headers: withAuth.headers,
      body: hasBody.value ? body.value : null,
      insecure: insecure.value,
    });
  } catch (err) {
    error.value = toCliError(err);
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="runner">
    <div class="uk-flex uk-flex-middle uk-margin-small-bottom" uk-margin>
      <label class="uk-text-small uk-text-muted uk-margin-small-right">Ambiente</label>
      <select v-model="envId" class="uk-select uk-form-small uk-width-medium">
        <option v-if="!environments.length" :value="null">(sin ambientes)</option>
        <option v-for="e in environments" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
      <label class="uk-text-small uk-margin-left">
        <input v-model="insecure" class="uk-checkbox uk-margin-small-right" type="checkbox" />Ignorar certificado TLS
      </label>
    </div>

    <div class="runner-url">
      <MethodBadge :method="endpoint.method" />
      <input v-model="url" class="uk-input" type="text" spellcheck="false" @keydown.enter="send" />
      <button class="uk-button uk-button-primary" data-action="send" :disabled="sending || !url" @click="send">
        <span v-if="sending" uk-spinner="ratio: 0.6"></span>
        <span v-else uk-icon="icon: play; ratio: 0.9"></span>
        Enviar
      </button>
    </div>
    <p v-if="pending.length" class="uk-text-small uk-text-warning uk-margin-small-top uk-margin-remove-bottom">
      Variables sin resolver: <code v-for="v in pending" :key="v" class="uk-margin-small-right">{{ wrapVar(v) }}</code>
      Edita la URL antes de enviar.
    </p>

    <ul class="uk-subnav uk-subnav-pill uk-margin-small-top uk-margin-small-bottom">
      <li :class="{ 'uk-active': section === 'query' }"><a href="#" @click.prevent="section = 'query'">Query ({{ query.length }})</a></li>
      <li :class="{ 'uk-active': section === 'headers' }"><a href="#" @click.prevent="section = 'headers'">Headers ({{ headers.length }})</a></li>
      <li v-if="hasBody" :class="{ 'uk-active': section === 'body' }"><a href="#" @click.prevent="section = 'body'">Body</a></li>
      <li :class="{ 'uk-active': section === 'auth' }">
        <a href="#" data-section="auth" @click.prevent="section = 'auth'">
          <span uk-icon="icon: lock; ratio: 0.7" class="uk-margin-small-right"></span>Auth · {{ authLabel }}
        </a>
      </li>
    </ul>

    <KeyValueEditor v-if="section === 'query'" v-model="query" key-placeholder="parámetro" />
    <KeyValueEditor v-else-if="section === 'headers'" v-model="headers" key-placeholder="Header" />
    <AuthEditor v-else-if="section === 'auth'" v-model="auth" :suggested="suggestedAuth" @apply-suggested="applySuggested" @reset="resetAuth" />
    <textarea v-else v-model="body" class="uk-textarea code-editor" rows="10" spellcheck="false"></textarea>

    <ErrorAlert :error="error" />
    <ResponseViewer v-if="response" :response="response" class="uk-margin-top" />
  </div>
</template>
