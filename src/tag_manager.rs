use std::collections::HashMap;
use std::sync::RwLock;
use std::time::{Duration, Instant};
use crate::error::{EtherNetIpError, Result};
use crate::EipClient;

/// Represents the scope of a tag in the PLC
#[derive(Debug, Clone, PartialEq)]
pub enum TagScope {
    /// Tag in the controller scope
    Controller,
    /// Tag in a program scope
    Program(String),
}

/// Metadata for a PLC tag
#[derive(Debug, Clone)]
pub struct TagMetadata {
    /// The data type of the tag
    pub data_type: u16,
    /// Size of the tag in bytes
    pub size: u32,
    /// Whether the tag is an array
    pub is_array: bool,
    /// Array dimensions if applicable
    pub dimensions: Vec<u32>,
    /// Access permissions for the tag
    pub permissions: TagPermissions,
    /// Scope of the tag
    pub scope: TagScope,
    /// Last time this tag was accessed
    pub last_access: Instant,
}

/// Access permissions for a tag
#[derive(Debug, Clone, PartialEq)]
pub struct TagPermissions {
    /// Whether the tag can be read
    pub readable: bool,
    /// Whether the tag can be written
    pub writable: bool,
}

/// Cache for PLC tags with automatic expiration
#[derive(Debug)]
#[allow(dead_code)]
pub struct TagCache {
    /// Map of tag names to their metadata
    tags: HashMap<String, (TagMetadata, Instant)>,
    /// Cache expiration time
    expiration: Duration,
}

impl TagCache {
    /// Creates a new tag cache with the specified expiration time
    #[allow(dead_code)]
    pub fn new(expiration: Duration) -> Self {
        Self {
            tags: HashMap::new(),
            expiration,
        }
    }

    /// Updates or adds a tag to the cache
    #[allow(dead_code)]
    pub fn update_tag(&mut self, name: String, metadata: TagMetadata) {
        self.tags.insert(name, (metadata, Instant::now()));
    }

    /// Gets a tag from the cache if it exists and hasn't expired
    #[allow(dead_code)]
    pub fn get_tag(&self, name: &str) -> Option<&TagMetadata> {
        if let Some((metadata, timestamp)) = self.tags.get(name) {
            if timestamp.elapsed() < self.expiration {
                return Some(metadata);
            }
        }
        None
    }

    /// Removes expired tags from the cache
    #[allow(dead_code)]
    pub fn cleanup(&mut self) {
        self.tags.retain(|_, (_, timestamp)| timestamp.elapsed() < self.expiration);
    }
}

/// Manager for PLC tag discovery and caching
#[derive(Debug)]
pub struct TagManager {
    pub cache: RwLock<HashMap<String, TagMetadata>>,
}

impl TagManager {
    pub fn new() -> Self {
        TagManager {
            cache: RwLock::new(HashMap::new()),
        }
    }

    pub fn get_tag(&self, tag_name: &str) -> Option<TagMetadata> {
        self.cache.read().unwrap().get(tag_name).cloned()
    }

    pub async fn discover_tags(&self, client: &mut EipClient) -> Result<()> {
        let response = client.send_cip_request(&client.build_list_tags_request()).await?;
        let tags = self.parse_tag_list(&response)?;
        let mut cache = self.cache.write().unwrap();
        for (name, metadata) in tags {
            cache.insert(name, metadata);
        }
        Ok(())
    }

    pub fn parse_tag_list(&self, response: &[u8]) -> Result<Vec<(String, TagMetadata)>> {
        let mut tags = Vec::new();
        let mut offset = 0;
        while offset < response.len() {
            let name_len = response[offset] as usize;
            offset += 1;
            let name = String::from_utf8_lossy(&response[offset..offset + name_len]).to_string();
            offset += name_len;
            let data_type = u16::from_le_bytes([
                response[offset],
                response[offset + 1],
            ]);
            offset += 2;
            let is_array = response[offset] != 0;
            offset += 1;
            let mut dimensions = Vec::new();
            if is_array {
                let dim_count = response[offset] as usize;
                offset += 1;
                for _ in 0..dim_count {
                    let dim = u32::from_le_bytes([
                        response[offset],
                        response[offset + 1],
                        response[offset + 2],
                        response[offset + 3],
                    ]);
                    dimensions.push(dim);
                    offset += 4;
                }
            }
            let metadata = TagMetadata {
                data_type,
                scope: TagScope::Controller,
                permissions: TagPermissions { readable: true, writable: true },
                is_array,
                dimensions,
                last_access: Instant::now(),
                size: 0,
            };
            tags.push((name, metadata));
        }
        Ok(tags)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tag_cache_expiration() {
        let mut cache = TagCache::new(Duration::from_secs(1));
        let metadata = TagMetadata {
            data_type: 0x00C1,
            size: 1,
            is_array: false,
            dimensions: vec![],
            permissions: TagPermissions {
                readable: true,
                writable: true,
            },
            scope: TagScope::Controller,
            last_access: Instant::now(),
        };

        cache.update_tag("TestTag".to_string(), metadata);
        assert!(cache.get_tag("TestTag").is_some());

        // Wait for expiration
        std::thread::sleep(Duration::from_secs(2));
        assert!(cache.get_tag("TestTag").is_none());
    }
} 