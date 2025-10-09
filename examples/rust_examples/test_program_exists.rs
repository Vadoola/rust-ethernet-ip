use rust_ethernet_ip::EipClient;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("=== Program Existence Test ===");
    println!("Testing if API_Web program exists in PLC\n");

    let plc_address = "192.168.0.1:44818";
    println!("🔌 Connecting to PLC at {}...", plc_address);
    
    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected to PLC successfully");

    // Test if we can read the program itself
    let program_names = vec![
        "API_Web",
        "Program:API_Web",
        "Program:API_Web.API_Web",
        "MainProgram",
        "Program:MainProgram",
        "Program",
    ];

    println!("\n🔍 Testing program existence:");
    println!("==================================================");
    
    for program_name in program_names {
        println!("🔍 Testing program: {}", program_name);
        match client.read_tag(program_name).await {
            Ok(value) => {
                println!("✅ Program '{}' exists! Type: {:?}", program_name, value);
            }
            Err(e) => {
                println!("❌ Program '{}' failed: {}", program_name, e);
            }
        }
    }

    // Test if we can read tags without program scope
    println!("\n🔍 Testing tags without program scope:");
    println!("==================================================");
    
    let tag_names = vec![
        "out_MachineStatus",
        "out_MachineReady", 
        "out_MachineAlarm",
        "in_ClearAlarms",
        "in_PCHandshake",
    ];

    for tag_name in tag_names {
        println!("🔍 Testing tag: {}", tag_name);
        match client.read_tag(tag_name).await {
            Ok(value) => {
                println!("✅ Tag '{}' exists! Type: {:?}", tag_name, value);
            }
            Err(e) => {
                println!("❌ Tag '{}' failed: {}", tag_name, e);
            }
        }
    }

    println!("\n🎉 Program existence test completed!");
    Ok(())
}
