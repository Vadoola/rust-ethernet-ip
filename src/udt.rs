use std::collections::HashMap;
use crate::error::{EtherNetIpError, Result};
use crate::PlcValue;

/// Represents a UDT member definition
#[derive(Debug, Clone)]
pub struct UdtMember {
    /// Name of the member
    pub name: String,
    /// Data type of the member
    pub data_type: u16,
    /// Offset in bytes from the start of the UDT
    pub offset: u32,
    /// Size of the member in bytes
    pub size: u32,
    /// Whether the member is an array
    pub is_array: bool,
    /// Array dimensions if applicable
    pub dimensions: Vec<u32>,
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
        self.member_offsets.insert(member.name.clone(), member.offset);
        self.members.push(member);
        // Calculate total size including padding
        self.size = self.members.iter()
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
    fn parse_member_value(&self, member: &UdtMember, data: &[u8]) -> crate::error::Result<PlcValue> {
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
            _ => Err(crate::error::EtherNetIpError::InvalidData("Unsupported data type".to_string())),
        }
    }
}

/// Represents a User Defined Type (UDT) definition
#[derive(Debug, Clone)]
pub struct UdtDefinition {
    /// Name of the UDT
    pub name: String,
    /// Members of the UDT with their data types
    pub members: HashMap<String, u16>,
}

/// Manages User Defined Types (UDTs) for the EtherNet/IP client
#[derive(Debug)]
pub struct UdtManager {
    definitions: HashMap<String, UdtDefinition>,
}

impl UdtManager {
    /// Creates a new UDT manager
    pub fn new() -> Self {
        Self {
            definitions: HashMap::new(),
        }
    }

    /// Parses a UDT instance from raw data
    pub fn parse_udt_instance(&self, tag_name: &str, data: &[u8]) -> Result<PlcValue> {
        let definition = self.definitions.get(tag_name)
            .ok_or_else(|| EtherNetIpError::Udt(format!("No UDT definition found for {}", tag_name)))?;

        let mut members = HashMap::new();
        let mut offset = 0;

        for (name, data_type) in &definition.members {
            let value = match data_type {
                0x00C1 => { // BOOL
                    if offset + 1 > data.len() {
                        return Err(EtherNetIpError::InvalidData("Insufficient data for BOOL".into()));
                    }
                    PlcValue::Bool(data[offset] != 0)
                }
                0x00C4 => { // DINT
                    if offset + 4 > data.len() {
                        return Err(EtherNetIpError::InvalidData("Insufficient data for DINT".into()));
                    }
                    let value = i32::from_le_bytes([
                        data[offset], data[offset + 1],
                        data[offset + 2], data[offset + 3]
                    ]);
                    PlcValue::Dint(value)
                }
                0x00CA => { // REAL
                    if offset + 4 > data.len() {
                        return Err(EtherNetIpError::InvalidData("Insufficient data for REAL".into()));
                    }
                    let value = f32::from_le_bytes([
                        data[offset], data[offset + 1],
                        data[offset + 2], data[offset + 3]
                    ]);
                    PlcValue::Real(value)
                }
                _ => return Err(EtherNetIpError::Udt(format!("Unsupported data type: 0x{:04X}", data_type))),
            };
            members.insert(name.clone(), value);
            offset += match data_type {
                0x00C1 => 1,  // BOOL
                0x00C4 => 4,  // DINT
                0x00CA => 4,  // REAL
                _ => return Err(EtherNetIpError::Udt(format!("Unsupported data type: 0x{:04X}", data_type))),
            };
        }

        Ok(PlcValue::Udt(members))
    }

    /// Serializes a UDT instance to raw data
    pub fn serialize_udt_instance(&self, tag_name: &str, members: &HashMap<String, PlcValue>) -> Result<Vec<u8>> {
        let definition = self.definitions.get(tag_name)
            .ok_or_else(|| EtherNetIpError::Udt(format!("No UDT definition found for {}", tag_name)))?;

        let mut data = Vec::new();

        for (name, data_type) in &definition.members {
            let value = members.get(name)
                .ok_or_else(|| EtherNetIpError::Udt(format!("Missing member {} in UDT {}", name, tag_name)))?;

            match (value, data_type) {
                (PlcValue::Bool(v), 0x00C1) => {
                    data.push(if *v { 0xFF } else { 0x00 });
                }
                (PlcValue::Dint(v), 0x00C4) => {
                    data.extend_from_slice(&v.to_le_bytes());
                }
                (PlcValue::Real(v), 0x00CA) => {
                    data.extend_from_slice(&v.to_le_bytes());
                }
                _ => return Err(EtherNetIpError::Udt(format!(
                    "Type mismatch for member {} in UDT {}",
                    name, tag_name
                ))),
            }
        }

        Ok(data)
    }

    /// Adds a UDT definition
    pub fn add_definition(&mut self, definition: UdtDefinition) {
        self.definitions.insert(definition.name.clone(), definition);
    }

    /// Gets a UDT definition
    pub fn get_definition(&self, name: &str) -> Option<&UdtDefinition> {
        self.definitions.get(name)
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
            is_array: false,
            dimensions: vec![],
        });

        udt.add_member(UdtMember {
            name: "Dint1".to_string(),
            data_type: 0x00C4,
            offset: 4,
            size: 4,
            is_array: false,
            dimensions: vec![],
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
            is_array: false,
            dimensions: vec![],
        });

        udt.add_member(UdtMember {
            name: "Dint1".to_string(),
            data_type: 0x00C4,
            offset: 4,
            size: 4,
            is_array: false,
            dimensions: vec![],
        });

        let data = vec![0xFF, 0x00, 0x00, 0x00, 0x2A, 0x00, 0x00, 0x00];
        let result = udt.to_hash_map(&data).unwrap();

        assert_eq!(result.get("Bool1"), Some(&PlcValue::Bool(true)));
        assert_eq!(result.get("Dint1"), Some(&PlcValue::Dint(42)));
    }
} 