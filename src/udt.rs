use crate::error::Result;
use crate::PlcValue;
use std::collections::HashMap;

/// Definition of a User Defined Type
#[derive(Debug, Clone)]
pub struct UdtDefinition {
    pub name: String,
    pub members: Vec<UdtMember>,
}

/// Member of a UDT
#[derive(Debug, Clone)]
pub struct UdtMember {
    pub name: String,
    pub data_type: u16,
    pub offset: u32,
    pub size: u32,
}

/// Manager for UDT operations
#[derive(Debug)]
pub struct UdtManager {
    _definitions: HashMap<String, UdtDefinition>,
}

impl UdtManager {
    pub fn new() -> Self {
        Self {
            _definitions: HashMap::new(),
        }
    }

    /// Parse a UDT instance from raw bytes
    pub fn parse_udt_instance(&self, _udt_name: &str, _data: &[u8]) -> Result<PlcValue> {
        // For now, return an empty UDT
        // Full UDT parsing can be implemented later
        Ok(PlcValue::Udt(HashMap::new()))
    }

    /// Serialize a UDT instance to bytes
    pub fn serialize_udt_instance(
        &self,
        _udt_value: &HashMap<String, PlcValue>,
    ) -> Result<Vec<u8>> {
        // For now, return empty bytes
        // Full UDT serialization can be implemented later
        Ok(Vec::new())
    }
}

impl Default for UdtManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Represents a User Defined Type (UDT)
#[derive(Debug, Clone)]
pub struct UserDefinedType {
    /// Name of the UDT
    pub name: String,
    /// Total size of the UDT in bytes
    pub size: u32,
    /// Members of the UDT
    pub members: Vec<UdtMember>,
    /// Cache of member offsets for quick lookup
    member_offsets: HashMap<String, u32>,
}

impl UserDefinedType {
    /// Creates a new UDT
    pub fn new(name: String) -> Self {
        Self {
            name,
            size: 0,
            members: Vec::new(),
            member_offsets: HashMap::new(),
        }
    }

    /// Adds a member to the UDT
    pub fn add_member(&mut self, member: UdtMember) {
        self.member_offsets
            .insert(member.name.clone(), member.offset);
        self.members.push(member);
        // Calculate total size including padding
        self.size = self
            .members
            .iter()
            .map(|m| m.offset + m.size)
            .max()
            .unwrap_or(0);
    }

    /// Gets the offset of a member by name
    pub fn get_member_offset(&self, name: &str) -> Option<u32> {
        self.member_offsets.get(name).copied()
    }

    /// Parses a UDT from CIP data
    pub fn from_cip_data(_data: &[u8]) -> crate::error::Result<Self> {
        // TODO: Implement CIP data parsing
        Ok(Self {
            name: String::new(),
            members: Vec::new(),
            size: 0,
            member_offsets: HashMap::new(),
        })
    }

    /// Converts a UDT instance to a HashMap of member values
    pub fn to_hash_map(&self, data: &[u8]) -> crate::error::Result<HashMap<String, PlcValue>> {
        let mut result = HashMap::new();

        for member in &self.members {
            let offset = member.offset as usize;
            if offset + member.size as usize <= data.len() {
                let member_data = &data[offset..offset + member.size as usize];
                let value = self.parse_member_value(member, member_data)?;
                result.insert(member.name.clone(), value);
            }
        }

        Ok(result)
    }

    /// Parses a member value from raw data
    fn parse_member_value(
        &self,
        member: &UdtMember,
        data: &[u8],
    ) -> crate::error::Result<PlcValue> {
        match member.data_type {
            0x00C1 => Ok(PlcValue::Bool(data[0] != 0)),
            0x00C4 => {
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Dint(i32::from_le_bytes(bytes)))
            }
            0x00CA => {
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Real(f32::from_le_bytes(bytes)))
            }
            _ => Err(crate::error::EtherNetIpError::Protocol(
                "Unsupported data type".to_string(),
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_udt_member_offsets() {
        let mut udt = UserDefinedType::new("TestUDT".to_string());

        udt.add_member(UdtMember {
            name: "Bool1".to_string(),
            data_type: 0x00C1,
            offset: 0,
            size: 1,
        });

        udt.add_member(UdtMember {
            name: "Dint1".to_string(),
            data_type: 0x00C4,
            offset: 4,
            size: 4,
        });

        assert_eq!(udt.get_member_offset("Bool1"), Some(0));
        assert_eq!(udt.get_member_offset("Dint1"), Some(4));
        assert_eq!(udt.size, 8);
    }

    #[test]
    fn test_udt_parsing() {
        let mut udt = UserDefinedType::new("TestUDT".to_string());

        udt.add_member(UdtMember {
            name: "Bool1".to_string(),
            data_type: 0x00C1,
            offset: 0,
            size: 1,
        });

        udt.add_member(UdtMember {
            name: "Dint1".to_string(),
            data_type: 0x00C4,
            offset: 4,
            size: 4,
        });

        let data = vec![0xFF, 0x00, 0x00, 0x00, 0x2A, 0x00, 0x00, 0x00];
        let result = udt.to_hash_map(&data).unwrap();

        assert_eq!(result.get("Bool1"), Some(&PlcValue::Bool(true)));
        assert_eq!(result.get("Dint1"), Some(&PlcValue::Dint(42)));
    }
}
