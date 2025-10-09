use rust_ethernet_ip::{EipClient, PlcValue};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Simple Tag Test - Individual Operations");
    println!("==========================================\n");

    let plc_address = "192.168.0.1:44818";
    println!("📡 Connecting to PLC at {}", plc_address);

    let mut client = EipClient::connect(plc_address).await?;
    println!("✅ Connected successfully!\n");

    // Test reading all the tags from the user's PLC
    let test_tags = vec![
        ("ProductionCount", "DINT"),
        ("Temperature_1", "REAL"),
        ("Temperature_2", "REAL"),
        ("Pressure_1", "REAL"),
        ("FlowRate", "REAL"),
        ("CurrentTemp", "REAL"),
        ("CurrentPressure", "REAL"),
        ("Performance_Test_1", "DINT"),
        ("Performance_Test_2", "DINT"),
        ("Performance_Test_3", "DINT"),
        ("ValidTag", "DINT"),
        ("SetPoint_1", "REAL"),
        ("EnableFlag", "BOOL"),
    ];

    println!("📊 Reading all tags individually:");
    println!("-----------------------------------");

    let start_time = Instant::now();
    let mut successful_reads = 0;
    let mut failed_reads = 0;

    for (tag_name, expected_type) in &test_tags {
        match client.read_tag(tag_name).await {
            Ok(value) => {
                println!("  ✅ {}: {:?} ({})", tag_name, value, expected_type);
                successful_reads += 1;
            }
            Err(e) => {
                println!("  ❌ {}: {} (expected {})", tag_name, e, expected_type);
                failed_reads += 1;
            }
        }
    }

    let total_time = start_time.elapsed();

    println!("\n📈 Results Summary:");
    println!("  • Successful reads: {}", successful_reads);
    println!("  • Failed reads: {}", failed_reads);
    println!("  • Total time: {:?}", total_time);
    println!(
        "  • Average per tag: {:?}",
        total_time / test_tags.len() as u32
    );

    // Test writing to a few tags
    println!("\n✏️  Testing writes:");
    println!("-------------------");

    let write_tests = vec![
        ("SetPoint_1", PlcValue::Real(99.9)),
        ("EnableFlag", PlcValue::Bool(false)),
        ("ValidTag", PlcValue::Dint(999)),
    ];

    for (tag_name, value) in &write_tests {
        match client.write_tag(tag_name, value.clone()).await {
            Ok(()) => println!("  ✅ {}: Write successful", tag_name),
            Err(e) => println!("  ❌ {}: Write failed - {}", tag_name, e),
        }

        // Read back to verify
        match client.read_tag(tag_name).await {
            Ok(read_value) => println!("      📖 Read back: {:?}", read_value),
            Err(e) => println!("      ❌ Read back failed: {}", e),
        }
    }

    println!("\n🎉 Individual tag operations test completed!");
    Ok(())
}
