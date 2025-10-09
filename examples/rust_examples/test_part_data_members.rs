use rust_ethernet_ip::{EipClient, PlcValue};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing Part_Data UDT Individual Members");
    println!("=============================================");
    println!("PLC IP: 192.168.0.1");
    println!("Tag: Part_Data (UDT with multiple members)");
    println!();

    let plc_address = "192.168.0.1:44818";
    println!("📡 Connecting to PLC at {}", plc_address);

    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected successfully!\n");

    // Test reading individual members of the Part_Data UDT
    println!("🎯 Testing: Part_Data UDT Individual Members");
    println!("{}", "=".repeat(50));

    // Common UDT member names to try
    let udt_members = vec![
        "Part_Data.oFuse_Pass_Status",
        "Part_Data.oMachine_Running", 
        "Part_Data.oFuse_Resistance",
        "Part_Data.oProduction_Rate",
        "Part_Data.oFuse_Serial_Number",
        "Part_Data.oCurrent_Shift",
        "Part_Data.iStart_Production",
        "Part_Data.iStop_Production",
        "Part_Data.iTarget_Production",
        "Part_Data.iQuality_Threshold",
        "Part_Data.oFuse_Weight1",
        "Part_Data.oFuse_Weight2",
        "Part_Data.oFuseSandFillTime",
        "Part_Data.oFusePartStatus",
        "Part_Data.oFuseLastStationDone"
    ];

    let mut successful_reads = 0;
    let mut total_reads = 0;

    for member in udt_members {
        total_reads += 1;
        println!("\n🔍 Testing: {}", member);
        
        let start_time = Instant::now();
        
        match client.read_tag(member).await {
            Ok(value) => {
                let duration = start_time.elapsed();
                println!("   ✅ SUCCESS: {:?} (took {:?})", value, duration);
                successful_reads += 1;
            }
            Err(e) => {
                let duration = start_time.elapsed();
                println!("   ❌ FAILED: {} (took {:?})", e, duration);
            }
        }
    }

    println!("\n📊 Summary:");
    println!("   Total members tested: {}", total_reads);
    println!("   Successful reads: {}", successful_reads);
    println!("   Success rate: {:.1}%", (successful_reads as f32 / total_reads as f32) * 100.0);

    // Also try to get UDT definition
    println!("\n🔍 Attempting to get UDT definition...");
    match client.get_udt_definition("Part_Data").await {
        Ok(definition) => {
            println!("   ✅ UDT Definition found!");
            println!("   📋 UDT Name: {}", definition.name);
            println!("   📊 Member Count: {}", definition.members.len());
            println!("   📏 Total Size: {} bytes", definition.members.iter().map(|m| m.size).sum::<u32>());
            
            println!("   📋 Members:");
            for member in &definition.members {
                println!("      - {}: {} (offset: {}, size: {})", 
                    member.name, 
                    member.data_type, 
                    member.offset, 
                    member.size
                );
            }
        }
        Err(e) => {
            println!("   ❌ UDT Definition not found: {}", e);
        }
    }

    println!("\n🎉 Part_Data UDT members test completed!");
    Ok(())
}
