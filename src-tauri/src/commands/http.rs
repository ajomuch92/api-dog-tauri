//! Cliente HTTP ligero para "interactuar" con los endpoints: envía la
//! petición desde Rust (evita CORS del webview) y devuelve la respuesta.

use crate::apidog::{CliError, ErrorKind};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use reqwest::Method;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Deserialize)]
pub struct KeyValue {
    pub key: String,
    pub value: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestInput {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<KeyValue>,
    #[serde(default)]
    pub query: Vec<KeyValue>,
    pub body: Option<String>,
    pub content_type: Option<String>,
    #[serde(default)]
    pub insecure: bool,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponseOutput {
    pub status: u16,
    pub status_text: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub duration_ms: u128,
    pub size_bytes: usize,
    pub final_url: String,
}

#[tauri::command]
pub async fn send_request(request: HttpRequestInput) -> Result<HttpResponseOutput, CliError> {
    let method = Method::from_bytes(request.method.trim().to_uppercase().as_bytes())
        .map_err(|_| CliError::new(ErrorKind::Validation, "Método HTTP inválido"))?;

    let mut url = reqwest::Url::parse(request.url.trim())
        .map_err(|e| CliError::new(ErrorKind::Validation, format!("URL inválida: {e}")))?;

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(request.insecure)
        .timeout(Duration::from_millis(request.timeout_ms.unwrap_or(30_000)))
        .build()
        .map_err(CliError::http)?;

    let mut headers = HeaderMap::new();
    for kv in request.headers.iter().filter(|kv| kv.enabled && !kv.key.trim().is_empty()) {
        let name = HeaderName::from_bytes(kv.key.trim().as_bytes())
            .map_err(|_| CliError::new(ErrorKind::Validation, format!("Header inválido: {}", kv.key)))?;
        let value = HeaderValue::from_str(&kv.value)
            .map_err(|_| CliError::new(ErrorKind::Validation, format!("Valor de header inválido: {}", kv.key)))?;
        headers.insert(name, value);
    }
    if let Some(ct) = request.content_type.as_deref().filter(|c| !c.trim().is_empty()) {
        if !headers.contains_key(reqwest::header::CONTENT_TYPE) {
            if let Ok(v) = HeaderValue::from_str(ct) {
                headers.insert(reqwest::header::CONTENT_TYPE, v);
            }
        }
    }

    {
        let mut pairs = url.query_pairs_mut();
        for kv in request.query.iter().filter(|kv| kv.enabled && !kv.key.trim().is_empty()) {
            pairs.append_pair(kv.key.trim(), &kv.value);
        }
    }

    let mut builder = client.request(method.clone(), url).headers(headers);
    if let Some(body) = request.body.filter(|b| !b.is_empty()) {
        if !matches!(method, Method::GET | Method::HEAD) {
            builder = builder.body(body);
        }
    }

    let started = Instant::now();
    let response = builder.send().await.map_err(CliError::http)?;
    let status = response.status();
    let final_url = response.url().to_string();
    let headers: Vec<(String, String)> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("<binario>").to_string()))
        .collect();
    let bytes = response.bytes().await.map_err(CliError::http)?;
    let duration_ms = started.elapsed().as_millis();

    Ok(HttpResponseOutput {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers,
        size_bytes: bytes.len(),
        body: String::from_utf8_lossy(&bytes).to_string(),
        duration_ms,
        final_url,
    })
}
