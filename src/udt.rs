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
    pub fn parse_udt_instance(&self, _udt_name: &str, data: &[u8]) -> Result<PlcValue> {
        // For now, return raw UDT data as a generic structure
        // In a real implementation, this would use the UDT definition from the PLC
        // For now, we'll return the raw data as a generic UDT with unknown structure
        let mut result = HashMap::new();
        result.insert("raw_data".to_string(), PlcValue::String(format!("{:02X?}", data)));
        result.insert("size".to_string(), PlcValue::Dint(data.len() as i32));
        Ok(PlcValue::Udt(result))
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

    /// Converts a UDT instance to a `HashMap` of member values
    pub fn to_hash_map(&self, data: &[u8]) -> crate::error::Result<HashMap<String, PlcValue>> {
        if data.is_empty() {
            return Err(crate::error::EtherNetIpError::Protocol(
                "UDT data is empty".to_string(),
            ));
        }

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

    /// Converts a `HashMap` of member values to raw UDT bytes
    pub fn from_hash_map(&self, values: &HashMap<String, PlcValue>) -> crate::error::Result<Vec<u8>> {
        let mut data = vec![0u8; self.size as usize];

        for member in &self.members {
            if let Some(value) = values.get(&member.name) {
                let member_data = self.serialize_member_value(member, value)?;
                let offset = member.offset as usize;
                let end_offset = offset + member_data.len();
                
                if end_offset <= data.len() {
                    data[offset..end_offset].copy_from_slice(&member_data);
                } else {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        format!("Member {} data exceeds UDT size", member.name),
                    ));
                }
            }
        }

        Ok(data)
    }

    /// Reads a specific UDT member by name
    pub fn read_member(&self, data: &[u8], member_name: &str) -> crate::error::Result<PlcValue> {
        if let Some(member) = self.members.iter().find(|m| m.name == member_name) {
            let offset = member.offset as usize;
            if offset + member.size as usize <= data.len() {
                let member_data = &data[offset..offset + member.size as usize];
                self.parse_member_value(member, member_data)
            } else {
                Err(crate::error::EtherNetIpError::Protocol(
                    format!("Member {} data incomplete", member_name),
                ))
            }
        } else {
            Err(crate::error::EtherNetIpError::TagNotFound(
                format!("UDT member '{}' not found", member_name),
            ))
        }
    }

    /// Writes a specific UDT member by name
    pub fn write_member(
        &self,
        data: &mut [u8],
        member_name: &str,
        value: &PlcValue,
    ) -> crate::error::Result<()> {
        if let Some(member) = self.members.iter().find(|m| m.name == member_name) {
            let member_data = self.serialize_member_value(member, value)?;
            let offset = member.offset as usize;
            let end_offset = offset + member_data.len();
            
            if end_offset <= data.len() {
                data[offset..end_offset].copy_from_slice(&member_data);
                Ok(())
            } else {
                Err(crate::error::EtherNetIpError::Protocol(
                    format!("Member {} data exceeds UDT size", member_name),
                ))
            }
        } else {
            Err(crate::error::EtherNetIpError::TagNotFound(
                format!("UDT member '{}' not found", member_name),
            ))
        }
    }

    /// Gets the size of a specific member
    pub fn get_member_size(&self, member_name: &str) -> Option<u32> {
        self.members
            .iter()
            .find(|m| m.name == member_name)
            .map(|m| m.size)
    }

    /// Gets the data type of a specific member
    pub fn get_member_data_type(&self, member_name: &str) -> Option<u16> {
        self.members
            .iter()
            .find(|m| m.name == member_name)
            .map(|m| m.data_type)
    }

    /// Parses a member value from raw data
    pub fn parse_member_value(
        &self,
        member: &UdtMember,
        data: &[u8],
    ) -> crate::error::Result<PlcValue> {
        match member.data_type {
            0x00C1 => Ok(PlcValue::Bool(data[0] != 0)),
            0x00C2 => {
                if data.len() < 2 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "INT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 2];
                bytes.copy_from_slice(&data[..2]);
                Ok(PlcValue::Int(i16::from_le_bytes(bytes)))
            }
            0x00C3 => {
                if data.len() < 4 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "DINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Dint(i32::from_le_bytes(bytes)))
            }
            0x00C4 => {
                if data.len() < 4 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "DINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Dint(i32::from_le_bytes(bytes)))
            }
            0x00C5 => {
                if data.len() < 8 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "LINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&data[..8]);
                Ok(PlcValue::Lint(i64::from_le_bytes(bytes)))
            }
            0x00C6 => {
                if data.len() < 2 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "UINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 2];
                bytes.copy_from_slice(&data[..2]);
                Ok(PlcValue::Uint(u16::from_le_bytes(bytes)))
            }
            0x00C7 => {
                if data.len() < 4 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "UDINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Udint(u32::from_le_bytes(bytes)))
            }
            0x00C8 => {
                if data.len() < 8 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "ULINT data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&data[..8]);
                Ok(PlcValue::Ulint(u64::from_le_bytes(bytes)))
            }
            0x00CA => {
                if data.len() < 4 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "REAL data too short".to_string(),
                    ));
                }
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Real(f32::from_le_bytes(bytes)))
            }
            0x00CB => {
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&data[..8]);
                Ok(PlcValue::Lreal(f64::from_le_bytes(bytes)))
            }
            0x00CE => {
                // STRING type - first 2 bytes are length, followed by data
                if data.len() < 2 {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "STRING data too short".to_string(),
                    ));
                }
                let length = u16::from_le_bytes([data[0], data[1]]) as usize;
                if data.len() < 2 + length {
                    return Err(crate::error::EtherNetIpError::Protocol(
                        "STRING data incomplete".to_string(),
                    ));
                }
                let string_data = &data[2..2 + length];
                let string_value = String::from_utf8_lossy(string_data).to_string();
                Ok(PlcValue::String(string_value))
            }
            0x00CF => {
                // SINT (8-bit signed integer)
                Ok(PlcValue::Sint(data[0] as i8))
            }
            0x00D0 => {
                // USINT (8-bit unsigned integer)
                Ok(PlcValue::Usint(data[0]))
            }
            0x00D1 => {
                // UINT (16-bit unsigned integer)
                let mut bytes = [0u8; 2];
                bytes.copy_from_slice(&data[..2]);
                Ok(PlcValue::Uint(u16::from_le_bytes(bytes)))
            }
            0x00D2 => {
                // UDINT (32-bit unsigned integer)
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[..4]);
                Ok(PlcValue::Udint(u32::from_le_bytes(bytes)))
            }
            0x00D3 => {
                // ULINT (64-bit unsigned integer)
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&data[..8]);
                Ok(PlcValue::Ulint(u64::from_le_bytes(bytes)))
            }
            _ => Err(crate::error::EtherNetIpError::Protocol(
                format!("Unsupported UDT data type: 0x{:04X}", member.data_type),
            )),
        }
    }

    /// Serializes a member value to raw data
    pub fn serialize_member_value(
        &self,
        member: &UdtMember,
        value: &PlcValue,
    ) -> crate::error::Result<Vec<u8>> {
        match member.data_type {
            0x00C1 => {
                match value {
                    PlcValue::Bool(b) => Ok(vec![if *b { 1 } else { 0 }]),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "BOOL".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C2 => {
                match value {
                    PlcValue::Int(i) => Ok(i.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "INT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C3 | 0x00C4 => {
                match value {
                    PlcValue::Dint(d) => Ok(d.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "DINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C5 => {
                match value {
                    PlcValue::Lint(l) => Ok(l.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "LINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C6 => {
                match value {
                    PlcValue::Uint(w) => Ok(w.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "UINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C7 => {
                match value {
                    PlcValue::Udint(d) => Ok(d.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "UDINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00C8 => {
                match value {
                    PlcValue::Ulint(l) => Ok(l.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "ULINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00CA => {
                match value {
                    PlcValue::Real(r) => Ok(r.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "REAL".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00CB => {
                match value {
                    PlcValue::Lreal(l) => Ok(l.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "LREAL".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00CE => {
                match value {
                    PlcValue::String(s) => {
                        let mut result = Vec::new();
                        let length = (s.len() as u16).min(82); // Max STRING length is 82
                        result.extend_from_slice(&length.to_le_bytes());
                        result.extend_from_slice(s.as_bytes());
                        // Pad to even byte boundary
                        if result.len() % 2 != 0 {
                            result.push(0);
                        }
                        Ok(result)
                    }
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "STRING".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00CF => {
                match value {
                    PlcValue::Sint(s) => Ok(vec![*s as u8]),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "SINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00D0 => {
                match value {
                    PlcValue::Usint(u) => Ok(vec![*u]),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "USINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00D1 => {
                match value {
                    PlcValue::Uint(u) => Ok(u.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "UINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00D2 => {
                match value {
                    PlcValue::Udint(u) => Ok(u.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "UDINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            0x00D3 => {
                match value {
                    PlcValue::Ulint(u) => Ok(u.to_le_bytes().to_vec()),
                    _ => Err(crate::error::EtherNetIpError::DataTypeMismatch {
                        expected: "ULINT".to_string(),
                        actual: format!("{:?}", value),
                    }),
                }
            }
            _ => Err(crate::error::EtherNetIpError::Protocol(
                format!("Unsupported UDT data type for serialization: 0x{:04X}", member.data_type),
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
