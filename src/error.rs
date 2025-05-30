use thiserror::Error;
use std::io;

/// Errors that can occur in the EtherNet/IP library
#[derive(Error, Debug)]
pub enum EtherNetIpError {
    /// I/O errors from the underlying network
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),

    /// Connection errors
    #[error("Connection error: {0}")]
    Connection(String),

    /// Session errors
    #[error("Session error: {0}")]
    Session(String),

    /// Tag errors
    #[error("Tag error: {0}")]
    Tag(String),

    /// UDT errors
    #[error("UDT error: {0}")]
    Udt(String),

    /// Timeout errors
    #[error("Operation timed out after {0:?}")]
    Timeout(std::time::Duration),

    /// Invalid data errors
    #[error("Invalid data: {0}")]
    InvalidData(String),

    /// Protocol errors
    #[error("Protocol error: {0}")]
    Protocol(String),

    /// Configuration errors
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// Resource errors
    #[error("Resource error: {0}")]
    Resource(String),

    /// Authentication errors
    #[error("Authentication error: {0}")]
    Authentication(String),

    /// Permission errors
    #[error("Permission error: {0}")]
    Permission(String),
}

/// Result type for EtherNet/IP operations
pub type Result<T> = std::result::Result<T, EtherNetIpError>;

impl From<std::net::AddrParseError> for EtherNetIpError {
    fn from(err: std::net::AddrParseError) -> Self {
        EtherNetIpError::Configuration(err.to_string())
    }
}

impl From<std::string::FromUtf8Error> for EtherNetIpError {
    fn from(err: std::string::FromUtf8Error) -> Self {
        EtherNetIpError::InvalidData(err.to_string())
    }
}

impl From<std::num::ParseIntError> for EtherNetIpError {
    fn from(err: std::num::ParseIntError) -> Self {
        EtherNetIpError::InvalidData(err.to_string())
    }
}

impl From<std::num::ParseFloatError> for EtherNetIpError {
    fn from(err: std::num::ParseFloatError) -> Self {
        EtherNetIpError::InvalidData(err.to_string())
    }
}

impl From<std::time::SystemTimeError> for EtherNetIpError {
    fn from(err: std::time::SystemTimeError) -> Self {
        EtherNetIpError::Resource(err.to_string())
    }
}

impl From<std::sync::PoisonError<std::sync::MutexGuard<'_, ()>>> for EtherNetIpError {
    fn from(err: std::sync::PoisonError<std::sync::MutexGuard<'_, ()>>) -> Self {
        EtherNetIpError::Resource(err.to_string())
    }
}

impl From<std::sync::PoisonError<std::sync::RwLockReadGuard<'_, ()>>> for EtherNetIpError {
    fn from(err: std::sync::PoisonError<std::sync::RwLockReadGuard<'_, ()>>) -> Self {
        EtherNetIpError::Resource(err.to_string())
    }
}

impl From<std::sync::PoisonError<std::sync::RwLockWriteGuard<'_, ()>>> for EtherNetIpError {
    fn from(err: std::sync::PoisonError<std::sync::RwLockWriteGuard<'_, ()>>) -> Self {
        EtherNetIpError::Resource(err.to_string())
    }
} 