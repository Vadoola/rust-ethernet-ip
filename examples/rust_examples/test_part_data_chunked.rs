use rust_ethernet_ip::{EipClient, PlcValue};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing Part_Data UDT with Chunked Reading");
    println!("===============================================");
    println!("PLC IP: 192.168.0.1");
    println!("Tag: Part_Data (Large UDT with multiple members)");
    println!();

    let plc_address = "192.168.0.1:44818";
    println!("📡 Connecting to PLC at {}", plc_address);

    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected successfully!\n");

    // Test reading the Part_Data UDT with chunked reading
    println!("🎯 Testing: Part_Data UDT (Chunked Reading)");
    println!("{}", "=".repeat(50));

    let start_time = Instant::now();
    
    match client.read_udt_chunked("Part_Data").await {
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
                        "iQuality_Threshold",
                        "oFuse_Weight1",
                        "oFuse_Weight2",
                        "oFuseSandFillTime",
                        "oFusePartStatus",
                        "oFuseLastStationDone"
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
        }
    }

    println!("\n🎉 Part_Data UDT chunked reading test completed!");
    Ok(())
}
