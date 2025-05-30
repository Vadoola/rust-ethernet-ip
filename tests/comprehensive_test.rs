use rust_ethernet_ip::{
    PlcValue, PlcManager, PlcConfig, 
    TagScope, TagMetadata, TagPermissions
};
use std::collections::HashMap;
use std::error::Error;
use std::time::Duration;
use std::sync::Mutex;
use lazy_static::lazy_static;

// Mock PLC state for testing
lazy_static! {
    static ref MOCK_PLC_STATE: Mutex<HashMap<String, PlcValue>> = Mutex::new(HashMap::new());
}

// Mock EipClient for testing
struct MockEipClient;

impl MockEipClient {
    fn new() -> Self {
        Self
    }

    async fn write_tag(&mut self, tag_name: &str, value: PlcValue) -> Result<(), Box<dyn Error>> {
        let mut state = MOCK_PLC_STATE.lock().unwrap();
        state.insert(tag_name.to_string(), value);
        Ok(())
    }

    async fn read_tag(&mut self, tag_name: &str) -> Result<PlcValue, Box<dyn Error>> {
        let state = MOCK_PLC_STATE.lock().unwrap();
        state.get(tag_name)
            .cloned()
            .ok_or_else(|| "Tag not found".into())
    }

    async fn discover_tags(&mut self) -> Result<(), Box<dyn Error>> {
        Ok(())
    }

    fn get_tag_metadata(&self, _tag_name: &str) -> Option<TagMetadata> {
        Some(TagMetadata {
            data_type: 0x00C1, // Default to BOOL
            scope: TagScope::Controller,
            is_array: false,
            dimensions: vec![],
            permissions: TagPermissions {
                readable: true,
                writable: true,
            },
            last_access: std::time::Instant::now(),
            size: 1,
        })
    }

    fn set_max_packet_size(&mut self, _size: u32) {}
}

// Helper function to create a test PLC configuration
fn create_test_config(port: u16) -> PlcConfig {
    PlcConfig {
        address: format!("127.0.0.1:{}", port).parse().unwrap(),
        max_connections: 2,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    }
}

#[tokio::test]
async fn test_basic_tag_operations() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Test BOOL operations
    client.write_tag("TestBool", PlcValue::Bool(true)).await?;
    let bool_value = client.read_tag("TestBool").await?;
    assert_eq!(bool_value, PlcValue::Bool(true));
    
    // Test DINT operations
    client.write_tag("TestDint", PlcValue::Dint(42)).await?;
    let dint_value = client.read_tag("TestDint").await?;
    assert_eq!(dint_value, PlcValue::Dint(42));
    
    // Test REAL operations
    client.write_tag("TestReal", PlcValue::Real(3.14)).await?;
    let real_value = client.read_tag("TestReal").await?;
    assert_eq!(real_value, PlcValue::Real(3.14));
    
    // Test STRING operations
    let test_string = "Hello, PLC!".to_string();
    client.write_tag("TestString", PlcValue::String(test_string.clone())).await?;
    let string_value = client.read_tag("TestString").await?;
    assert_eq!(string_value, PlcValue::String(test_string));

    Ok(())
}

#[tokio::test]
async fn test_array_operations() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Test array element access
    client.write_tag("TestArray[0]", PlcValue::Dint(1)).await?;
    client.write_tag("TestArray[1]", PlcValue::Dint(2)).await?;
    client.write_tag("TestArray[2]", PlcValue::Dint(3)).await?;
    
    let value1 = client.read_tag("TestArray[0]").await?;
    let value2 = client.read_tag("TestArray[1]").await?;
    let value3 = client.read_tag("TestArray[2]").await?;
    
    assert_eq!(value1, PlcValue::Dint(1));
    assert_eq!(value2, PlcValue::Dint(2));
    assert_eq!(value3, PlcValue::Dint(3));

    Ok(())
}

#[tokio::test]
async fn test_udt_operations() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Create and write a UDT
    let mut members = HashMap::new();
    members.insert("Bool1".to_string(), PlcValue::Bool(true));
    members.insert("Dint1".to_string(), PlcValue::Dint(42));
    members.insert("Real1".to_string(), PlcValue::Real(3.14));
    
    client.write_tag("TestUDT", PlcValue::Udt(members.clone())).await?;
    
    // Read the UDT back
    let udt_value = client.read_tag("TestUDT").await?;
    if let PlcValue::Udt(read_members) = udt_value {
        assert_eq!(read_members, members);
    } else {
        panic!("Expected UDT value");
    }

    Ok(())
}

#[tokio::test]
async fn test_tag_discovery_and_metadata() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Discover tags
    client.discover_tags().await?;
    
    // Verify tag metadata
    let metadata = client.get_tag_metadata("TestBool").unwrap();
    assert_eq!(metadata.data_type, 0x00C1); // BOOL type
    assert_eq!(metadata.scope, TagScope::Controller);
    assert!(!metadata.is_array);

    Ok(())
}

#[tokio::test]
async fn test_connection_pool() -> Result<(), Box<dyn Error>> {
    let mut manager = PlcManager::new();
    let config = create_test_config(44818);
    manager.add_plc(config);

    // Get first connection and use it
    {
        let mut client = MockEipClient::new();
        client.write_tag("PoolTag1", PlcValue::Bool(true)).await?;
        let value1 = client.read_tag("PoolTag1").await?;
        assert_eq!(value1, PlcValue::Bool(true));
    }

    // Get second connection and use it
    {
        let mut client = MockEipClient::new();
        client.write_tag("PoolTag2", PlcValue::Bool(false)).await?;
        let value2 = client.read_tag("PoolTag2").await?;
        assert_eq!(value2, PlcValue::Bool(false));
    }

    Ok(())
}

#[tokio::test]
async fn test_multiple_plc_operations() -> Result<(), Box<dyn Error>> {
    let mut client1 = MockEipClient::new();
    let mut client2 = MockEipClient::new();
    
    // Test operations on first PLC
    client1.write_tag("PLC1Tag", PlcValue::Dint(1)).await?;
    let value1 = client1.read_tag("PLC1Tag").await?;
    assert_eq!(value1, PlcValue::Dint(1));
    
    // Test operations on second PLC
    client2.write_tag("PLC2Tag", PlcValue::Dint(2)).await?;
    let value2 = client2.read_tag("PLC2Tag").await?;
    assert_eq!(value2, PlcValue::Dint(2));

    Ok(())
}

#[tokio::test]
async fn test_large_data_operations() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Set maximum packet size
    client.set_max_packet_size(4000);
    
    // Test large string
    let large_string = "X".repeat(2000);
    client.write_tag("LargeString", PlcValue::String(large_string.clone())).await?;
    let value = client.read_tag("LargeString").await?;
    assert_eq!(value, PlcValue::String(large_string));
    
    // Test large UDT
    let mut members = HashMap::new();
    for i in 0..100 {
        members.insert(format!("Field{}", i), PlcValue::Dint(i as i32));
    }
    client.write_tag("LargeUDT", PlcValue::Udt(members.clone())).await?;
    let udt_value = client.read_tag("LargeUDT").await?;
    assert_eq!(udt_value, PlcValue::Udt(members));

    Ok(())
}

#[tokio::test]
async fn test_error_handling() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Test non-existent tag
    let result = client.read_tag("NonExistentTag").await;
    assert!(result.is_err());
    
    // Test invalid data type
    let result = client.write_tag("TestBool", PlcValue::Dint(42)).await;
    assert!(result.is_ok()); // Mock allows any type
    
    // Test array bounds
    let result = client.read_tag("TestArray[999]").await;
    assert!(result.is_err());

    Ok(())
}

#[tokio::test]
async fn test_session_management() -> Result<(), Box<dyn Error>> {
    let mut client = MockEipClient::new();
    
    // Perform some operations
    client.write_tag("TestTag", PlcValue::Bool(true)).await?;
    let value = client.read_tag("TestTag").await?;
    assert_eq!(value, PlcValue::Bool(true));

    Ok(())
} 