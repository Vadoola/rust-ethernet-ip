use std::error::Error;
use std::fmt;
use std::io;
use std::time::Duration;

/// Result type alias for EtherNet/IP operations
pub type Result<T> = std::result::Result<T, EtherNetIpError>;

/// Error types that can occur during EtherNet/IP communication
#[derive(Debug)]
pub enum EtherNetIpError {
    /// IO error (network issues, connection problems)
    Io(io::Error),
    
    /// Protocol error (invalid responses, CIP errors)
    Protocol(String),
    
    /// Timeout error
    Timeout(Duration),
    
    /// Permission error (tag not readable/writable)
    Permission(String),
    
    /// Tag error (tag not found, invalid tag name)
    Tag(String),
    
    /// UDT error (UDT parsing/serialization issues)
    Udt(String),
    
    /// Connection error (PLC not responding, session issues)
    Connection(String),
}

impl fmt::Display for EtherNetIpError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EtherNetIpError::Io(err) => write!(f, "IO error: {}", err),
            EtherNetIpError::Protocol(msg) => write!(f, "Protocol error: {}", msg),
            EtherNetIpError::Timeout(duration) => write!(f, "Timeout after {:?}", duration),
            EtherNetIpError::Permission(msg) => write!(f, "Permission error: {}", msg),
            EtherNetIpError::Tag(msg) => write!(f, "Tag error: {}", msg),
            EtherNetIpError::Udt(msg) => write!(f, "UDT error: {}", msg),
            EtherNetIpError::Connection(msg) => write!(f, "Connection error: {}", msg),
        }
    }
}

impl Error for EtherNetIpError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            EtherNetIpError::Io(err) => Some(err),
            _ => None,
        }
    }
}

impl From<io::Error> for EtherNetIpError {
    fn from(err: io::Error) -> Self {
        EtherNetIpError::Io(err)
    }
} 