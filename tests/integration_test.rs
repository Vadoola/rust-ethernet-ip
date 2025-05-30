use rust_ethernet_ip::{EipClient, PlcValue, PlcManager, PlcConfig, TagScope};
use std::collections::HashMap;
use std::time::Duration;

/// Helper function to check if a PLC is available at the given address
async fn is_plc_available(address: &str) -> bool {
    match EipClient::connect(address).await {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[tokio::test]
#[ignore]
async fn test_tag_discovery() {
    let address = "127.0.0.1:44818";
    if !is_plc_available(address).await {
        println!("Skipping test_tag_discovery: No PLC available at {}", address);
        return;
    }

    let mut client = EipClient::connect(address).await.unwrap();
    
    // Discover tags
    client.discover_tags().await.unwrap();
    
    // Verify some common tags exist
    let metadata = client.get_tag_metadata("_IO_EM_DI00").unwrap();
    assert_eq!(metadata.data_type, 0x00C1); // BOOL type
    assert_eq!(metadata.scope, TagScope::Controller);
    
    let metadata = client.get_tag_metadata("_IO_EM_DI01").unwrap();
    assert_eq!(metadata.data_type, 0x00C1); // BOOL type
    assert_eq!(metadata.scope, TagScope::Controller);
}

#[tokio::test]
#[ignore]
async fn test_udt_operations() {
    let address = "127.0.0.1:44818";
    if !is_plc_available(address).await {
        println!("Skipping test_udt_operations: No PLC available at {}", address);
        return;
    }

    let mut client = EipClient::connect(address).await.unwrap();
    
    // Read a UDT
    let udt_value = client.read_tag("MotorData").await.unwrap();
    if let PlcValue::Udt(members) = udt_value {
        assert!(members.contains_key("Speed"));
        assert!(members.contains_key("Current"));
        assert!(members.contains_key("Status"));
    } else {
        panic!("Expected UDT value");
    }
    
    // Write a UDT
    let mut members = HashMap::new();
    members.insert("Speed".to_string(), PlcValue::Dint(1500));
    members.insert("Current".to_string(), PlcValue::Real(10.5));
    members.insert("Status".to_string(), PlcValue::String("Running".to_string()));
    
    client.write_tag("MotorData", PlcValue::Udt(members)).await.unwrap();
}

#[tokio::test]
#[ignore]
async fn test_multiple_plc_connections() {
    let address1 = "127.0.0.1:44818";
    let address2 = "127.0.0.1:44819";
    if !is_plc_available(address1).await || !is_plc_available(address2).await {
        println!("Skipping test_multiple_plc_connections: PLCs not available at {} or {}", address1, address2);
        return;
    }

    let mut manager = PlcManager::new();
    
    // Configure two PLCs
    let config1 = PlcConfig {
        address: address1.parse().unwrap(),
        max_connections: 2,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    };
    
    let config2 = PlcConfig {
        address: address2.parse().unwrap(),
        max_connections: 2,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    };
    
    manager.add_plc(config1.clone());
    manager.add_plc(config2.clone());
    
    // Get and use client1
    {
        let client1 = manager.get_connection(config1.address).await.unwrap();
        client1.write_tag("Tag1", PlcValue::Bool(true)).await.unwrap();
        let value1 = client1.read_tag("Tag1").await.unwrap();
        assert_eq!(value1, PlcValue::Bool(true));
    }
    // Get and use client2
    {
        let client2 = manager.get_connection(config2.address).await.unwrap();
        client2.write_tag("Tag2", PlcValue::Dint(42)).await.unwrap();
        let value2 = client2.read_tag("Tag2").await.unwrap();
        assert_eq!(value2, PlcValue::Dint(42));
    }
}

#[tokio::test]
#[ignore]
async fn test_connection_pooling() {
    let address = "127.0.0.1:44818";
    if !is_plc_available(address).await {
        println!("Skipping test_connection_pooling: No PLC available at {}", address);
        return;
    }

    let mut manager = PlcManager::new();
    
    let config = PlcConfig {
        address: address.parse().unwrap(),
        max_connections: 2,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    };
    
    manager.add_plc(config.clone());
    
    // Get and use client1
    {
        let client1 = manager.get_connection(config.address).await.unwrap();
        client1.write_tag("Tag1", PlcValue::Bool(true)).await.unwrap();
        let value1 = client1.read_tag("Tag1").await.unwrap();
        assert_eq!(value1, PlcValue::Bool(true));
    }
    // Get and use client2
    {
        let client2 = manager.get_connection(config.address).await.unwrap();
        client2.write_tag("Tag2", PlcValue::Bool(false)).await.unwrap();
        let value2 = client2.read_tag("Tag2").await.unwrap();
        assert_eq!(value2, PlcValue::Bool(false));
    }
}

#[tokio::test]
#[ignore]
async fn test_health_monitoring() {
    let address = "127.0.0.1:44818";
    if !is_plc_available(address).await {
        println!("Skipping test_health_monitoring: No PLC available at {}", address);
        return;
    }

    let mut manager = PlcManager::new();
    
    let config = PlcConfig {
        address: address.parse().unwrap(),
        max_connections: 2,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    };
    
    manager.add_plc(config.clone());
    
    // Get a connection
    let _client = manager.get_connection(config.address).await.unwrap();
    
    // Perform health check
    manager.check_health().await;
    
    // Clean up inactive connections
    manager.cleanup_connections();
}

#[tokio::test]
#[ignore]
async fn test_large_packet_support() {
    let address = "127.0.0.1:44818";
    if !is_plc_available(address).await {
        println!("Skipping test_large_packet_support: No PLC available at {}", address);
        return;
    }

    let mut client = EipClient::connect(address).await.unwrap();
    
    // Set maximum packet size
    client.set_max_packet_size(4000);
    
    // Create a large string
    let large_string = "X".repeat(2000);
    
    // Write the large string
    client.write_tag("LargeString", PlcValue::String(large_string.clone())).await.unwrap();
    
    // Read it back
    let value = client.read_tag("LargeString").await.unwrap();
    if let PlcValue::String(s) = value {
        assert_eq!(s, large_string);
    } else {
        panic!("Expected string value");
    }
} 