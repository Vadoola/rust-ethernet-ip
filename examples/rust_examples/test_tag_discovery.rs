use rust_ethernet_ip::EipClient;
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Tag Discovery Test ===");
    println!("Discovering available tags in the PLC\n");

    // Connect to PLC
    let plc_address = "192.168.0.1:44818";
    println!("🔌 Connecting to PLC at {}...", plc_address);
    
    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected to PLC successfully\n");

    // Test some common tag names that might exist
    let common_tags = vec![
        // Global scope tags
        "TestTag",
        "TestDint", 
        "TestReal",
        "TestBool",
        "TestString",
        "Part_Data",
        "PC_Database",
        
        // Program scope variations
        "API_Web",
        "MainProgram",
        "Main",
        "Program",
        
        // Try some of the specific tags without program scope
        "out_MachineStatus",
        "out_MachineReady",
        "out_MachineAlarm",
        "in_ClearAlarms",
        "in_PCHandshake",
        "out_FuseSerialNumber",
        "out_FuseWeight1",
        "out_FuseWeight2",
        "out_FuseResistance1",
        "out_FuseSandFillTime",
        "out_FusePartStatus",
        "out_FuseLastStationDone",
        "cmd_SaveFuseData",
        "sts_PLCHandshake",
    ];

    println!("🔍 Testing common tag names:");
    println!("{}", "=".repeat(50));
    
    let mut found_tags = HashMap::new();
    
    for tag_name in &common_tags {
        println!("🔍 Testing tag: {}", tag_name);
        
        // Try reading as different data types
        let mut found = false;
        
        // Try reading the tag (generic method)
        match client.read_tag(tag_name).await {
            Ok(value) => {
                let (data_type, value_str) = match value {
                    rust_ethernet_ip::PlcValue::Bool(v) => ("BOOL", format!("{}", v)),
                    rust_ethernet_ip::PlcValue::Dint(v) => ("DINT", format!("{}", v)),
                    rust_ethernet_ip::PlcValue::Real(v) => ("REAL", format!("{}", v)),
                    rust_ethernet_ip::PlcValue::String(v) => ("STRING", format!("{}", v)),
                    _ => ("UNKNOWN", format!("{:?}", value)),
                };
                
                println!("   ✅ {} ({}) = {}", tag_name, data_type, value_str);
                found_tags.insert(tag_name.to_string(), (data_type, value_str));
                found = true;
            }
            Err(e) => {
                // Don't print error for each tag, just continue
            }
        }
        
        if !found {
            println!("   ❌ {} - Not found", tag_name);
        }
        
        println!();
    }

    println!("📊 Summary:");
    println!("{}", "=".repeat(50));
    println!("✅ Found {} tags:", found_tags.len());
    
    for (tag_name, (data_type, value)) in &found_tags {
        println!("   - {} ({}): {}", tag_name, data_type, value);
    }

    if found_tags.is_empty() {
        println!("\n❌ No tags found. This could mean:");
        println!("   1. The PLC doesn't have any of these common tag names");
        println!("   2. The tags are in a different scope (e.g., program scope)");
        println!("   3. The PLC requires different tag path formats");
        println!("   4. The PLC has security restrictions");
    }

    println!("\n🎉 Tag discovery test completed!");
    Ok(())
}
