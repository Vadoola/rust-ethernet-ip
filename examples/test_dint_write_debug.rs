use rust_ethernet_ip::{EipClient, PlcValue};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("🔧 DINT Write Debug Test");
    println!("========================");

    // Connect to PLC
    let plc_address = "192.168.0.1:44818";
    println!("🔌 Connecting to PLC at {}...", plc_address);

    let mut client = match EipClient::connect(plc_address).await {
        Ok(client) => {
            println!("✅ Connected successfully!");
            client
        }
        Err(e) => {
            println!("❌ Connection failed: {}", e);
            return Err(e.into());
        }
    };

    // Test DINT tag name (assuming this exists)
    let tag_name = "TestDint";

    // First, read the current value
    println!("\n📖 READING CURRENT VALUE");
    println!("-------------------------");
    match client.read_tag(tag_name).await {
        Ok(value) => {
            println!("✅ Current value: {:?}", value);
        }
        Err(e) => {
            println!("❌ Read failed: {}", e);
            println!("   (Tag might not exist, but that's OK for this test)");
        }
    }

    // Test DINT write
    println!("\n📝 TESTING DINT WRITE");
    println!("---------------------");
    let test_value = PlcValue::Dint(12345);
    println!("📝 Writing {:?} to tag '{}'", test_value, tag_name);

    match client.write_tag(tag_name, test_value).await {
        Ok(()) => {
            println!("✅ DINT write completed successfully!");

            // Verify by reading back
            println!("\n🔍 VERIFYING WRITE");
            println!("------------------");
            match client.read_tag(tag_name).await {
                Ok(read_value) => {
                    println!("✅ Read back value: {:?}", read_value);
                    if let PlcValue::Dint(val) = read_value {
                        if val == 12345 {
                            println!("✅ VERIFICATION PASSED: Value matches!");
                        } else {
                            println!("❌ VERIFICATION FAILED: Expected 12345, got {}", val);
                        }
                    } else {
                        println!("❌ VERIFICATION FAILED: Wrong data type returned");
                    }
                }
                Err(e) => {
                    println!("❌ Read verification failed: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ DINT write failed: {}", e);
        }
    }

    println!("\n🎯 DINT debug test completed.");
    Ok(())
}
