use std::collections::HashMap;
use std::error::Error;
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
        self.size = self.members.iter().map(|m| m.size).sum();
    }

    /// Gets the offset of a member by name
    pub fn get_member_offset(&self, name: &str) -> Option<u32> {
        self.member_offsets.get(name).copied()
    }

    /// Parses a UDT from CIP data
    pub fn from_cip_data(_data: &[u8]) -> Result<Self, Box<dyn Error>> {
        // TODO: Implement CIP data parsing
        Ok(Self {
            name: String::new(),
            members: Vec::new(),
            size: 0,
            member_offsets: HashMap::new(),
        })
    }

    /// Converts a UDT instance to a HashMap of member values
    pub fn to_hash_map(&self, data: &[u8]) -> Result<HashMap<String, PlcValue>, Box<dyn Error>> {
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
    fn parse_member_value(&self, member: &UdtMember, data: &[u8]) -> Result<PlcValue, Box<dyn Error>> {
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
            _ => Err("Unsupported data type".into()),
        }
    }
}

/// Manager for UDT definitions
#[derive(Debug)]
pub struct UdtManager {
    /// Cache of UDT definitions
    udts: HashMap<String, UserDefinedType>,
}

impl UdtManager {
    /// Creates a new UDT manager
    pub fn new() -> Self {
        Self {
            udts: HashMap::new(),
        }
    }

    /// Adds a UDT definition to the manager
    pub fn add_udt(&mut self, udt: UserDefinedType) {
        self.udts.insert(udt.name.clone(), udt);
    }

    /// Gets a UDT definition by name
    pub fn get_udt(&self, name: &str) -> Option<&UserDefinedType> {
        self.udts.get(name)
    }

    /// Parses a UDT instance from CIP data
    pub fn parse_udt_instance(&self, tag_name: &str, data: &[u8]) -> Result<PlcValue, Box<dyn Error>> {
        let udt = self.get_udt(tag_name).ok_or_else(|| format!("UDT not found: {}", tag_name))?;
        let mut members = HashMap::new();
        let mut offset = 0;
        for member in &udt.members {
            let value = match member.data_type {
                0x00C1 => { // BOOL
                    let value = data[offset] != 0;
                    offset += 1;
                    PlcValue::Bool(value)
                }
                0x00C4 => { // DINT
                    let value = i32::from_le_bytes([
                        data[offset],
                        data[offset + 1],
                        data[offset + 2],
                        data[offset + 3],
                    ]);
                    offset += 4;
                    PlcValue::Dint(value)
                }
                0x00CA => { // REAL
                    let value = f32::from_le_bytes([
                        data[offset],
                        data[offset + 1],
                        data[offset + 2],
                        data[offset + 3],
                    ]);
                    offset += 4;
                    PlcValue::Real(value)
                }
                0x00D0 => { // STRING
                    let len = u16::from_le_bytes([
                        data[offset],
                        data[offset + 1],
                    ]) as usize;
                    offset += 2;
                    let value = String::from_utf8_lossy(&data[offset..offset + len]).to_string();
                    offset += len;
                    PlcValue::String(value)
                }
                _ => return Err(format!("Unsupported data type: 0x{:04X}", member.data_type).into()),
            };
            members.insert(member.name.clone(), value);
        }
        Ok(PlcValue::Udt(members))
    }

    pub fn serialize_udt_instance(&self, tag_name: &str, members: &HashMap<String, PlcValue>) -> Result<Vec<u8>, Box<dyn Error>> {
        let udt = self.get_udt(tag_name).ok_or_else(|| format!("UDT not found: {}", tag_name))?;
        let mut data = Vec::new();
        for member in &udt.members {
            let value = members.get(&member.name)
                .ok_or_else(|| format!("Missing member: {}", member.name))?;
            match (member.data_type, value) {
                (0x00C1, PlcValue::Bool(v)) => {
                    data.push(*v as u8);
                }
                (0x00C4, PlcValue::Dint(v)) => {
                    data.extend_from_slice(&v.to_le_bytes());
                }
                (0x00CA, PlcValue::Real(v)) => {
                    data.extend_from_slice(&v.to_le_bytes());
                }
                (0x00D0, PlcValue::String(v)) => {
                    let bytes = v.as_bytes();
                    data.extend_from_slice(&(bytes.len() as u16).to_le_bytes());
                    data.extend_from_slice(bytes);
                }
                _ => return Err(format!("Type mismatch for member: {}", member.name).into()),
            }
        }
        Ok(data)
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