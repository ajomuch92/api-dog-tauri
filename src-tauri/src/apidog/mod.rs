//! Integración con el CLI de Apidog.
//!
//! `cli` se encarga de localizar el binario y ejecutar comandos con
//! `std::process::Command`; `error` define el tipo de error serializable que
//! viaja hasta el frontend.

pub mod cli;
pub mod error;

pub use cli::Cli;
pub use error::{CliError, ErrorKind};
