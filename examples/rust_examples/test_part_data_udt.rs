use rust_ethernet_ip::{EipClient, PlcValue};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing Part_Data UDT Tag");
    println!("============================");
    println!("PLC IP: 192.168.0.1");
    println!("Tag: Part_Data (UDT with multiple members)");
    println!();

    let plc_address = "192.168.0.1:44818";
    println!("📡 Connecting to PLC at {}", plc_address);

    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected successfully!\n");

    // Test reading the Part_Data UDT
    println!("🎯 Testing: Part_Data UDT");
    println!("{}", "=".repeat(50));

    let start_time = Instant::now();
    
    match client.read_tag("Part_Data").await {
        Ok(value) => {
            let duration = start_time.elapsed();
            println!("   ✅ SUCCESS: {:?} (took {:?})", value, duration);
            
            match value {
                PlcValue::Udt(udt_data) => {
                    println!("   📋 UDT contains {} members:", udt_data.len());
                    for (key, val) in udt_data.iter() {
                        println!("      - {}: {:?}", key, val);
                    }
                    
                    // Try to access specific members if they exist
                    let common_members = vec![
                        "oFuse_Pass_Status",
                        "oMachine_Running", 
                        "oFuse_Resistance",
                        "oProduction_Rate",
                        "oFuse_Serial_Number",
                        "oCurrent_Shift",
                        "iStart_Production",
                        "iStop_Production",
                        "iTarget_Production",
                        "iQuality_Threshold"
                    ];
                    
                    println!("\n   🔍 Looking for common UDT members:");
                    for member in common_members {
                        if let Some(member_value) = udt_data.get(member) {
                            println!("      ✅ {}: {:?}", member, member_value);
                        }
                    }
                }
                PlcValue::Dint(actual_value) => {
                    println!("   📊 Direct DINT value: {}", actual_value);
                }
                _ => {
                    println!("   ⚠️  Unexpected type: {:?}", value);
                }
            }
        }
        Err(e) => {
            let duration = start_time.elapsed();
            println!("   ❌ FAILED: {} (took {:?})", e, duration);
            
            // Try alternative approaches
            println!("   🔍 Trying alternative UDT access methods...");
            
            let alternative_paths = vec![
                "Part_Data[0]",
                "Controller:Part_Data",
                "Program:MainProgram.Part_Data",
            ];
            
            for alt_path in alternative_paths {
                println!("   🔍 Trying: {}", alt_path);
                match client.read_tag(alt_path).await {
                    Ok(value) => {
                        println!("   ✅ Alternative path worked: {:?}", value);
                        break;
                    }
                    Err(e) => {
                        println!("   ❌ Alternative path failed: {}", e);
                    }
                }
            }
        }
    }

    println!("\n🎉 Part_Data UDT test completed!");
    Ok(())
}
