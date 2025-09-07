use rust_ethernet_ip::{EipClient, PlcValue};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("🔧 STRING Write Debug Test");
    println!("==========================");

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

    // Test string tag name
    let tag_name = "TestString";

    // First, read the current value to establish baseline
    println!("\n📖 READING CURRENT VALUE");
    println!("-------------------------");
    match client.read_tag(tag_name).await {
        Ok(PlcValue::String(current_value)) => {
            println!("✅ Current value: '{}'", current_value);
        }
        Ok(other) => {
            println!("⚠️  Tag returned unexpected type: {:?}", other);
        }
        Err(e) => {
            println!("❌ Read failed: {}", e);
        }
    }

    // Test different string write approaches
    let long_string = "A".repeat(80);
    let test_strings = vec![
        ("", "Empty string"),
        ("A", "Single character"),
        ("Hello", "Short string"),
        ("This is a test string", "Medium string"),
        (&long_string, "Long string (80 chars)"),
    ];

    for (test_value, description) in test_strings {
        println!(
            "\n📝 TESTING: {} ('{}')",
            description,
            if test_value.len() > 20 {
                format!("{}... ({} chars)", &test_value[..20], test_value.len())
            } else {
                test_value.to_string()
            }
        );
        println!("{}", "-".repeat(50));

        // Write using standard method
        match client
            .write_tag(tag_name, PlcValue::String(test_value.to_string()))
            .await
        {
            Ok(_) => {
                println!("✅ Write operation completed successfully");

                // Verify by reading back
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                match client.read_tag(tag_name).await {
                    Ok(PlcValue::String(read_value)) => {
                        if read_value == *test_value {
                            println!("✅ VERIFICATION PASSED: Read back matches written value");
                        } else {
                            println!(
                                "❌ VERIFICATION FAILED: Expected '{}', got '{}'",
                                test_value, read_value
                            );
                            println!(
                                "   Expected length: {}, Actual length: {}",
                                test_value.len(),
                                read_value.len()
                            );
                        }
                    }
                    Ok(other) => {
                        println!(
                            "❌ VERIFICATION FAILED: Read returned wrong type: {:?}",
                            other
                        );
                    }
                    Err(e) => {
                        println!("❌ VERIFICATION FAILED: Read error: {}", e);
                    }
                }
            }
            Err(e) => {
                println!("❌ Write failed: {}", e);
            }
        }

        // Small delay between tests
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    // Test edge cases
    println!("\n🧪 EDGE CASE TESTING");
    println!("====================");

    // Test special characters
    let special_test = "Test!@#$%^&*()_+-=";
    println!("\n🔤 Testing special characters: '{}'", special_test);
    match client
        .write_tag(tag_name, PlcValue::String(special_test.to_string()))
        .await
    {
        Ok(_) => {
            println!("✅ Special character write successful");
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            match client.read_tag(tag_name).await {
                Ok(PlcValue::String(read_value)) => {
                    if read_value == special_test {
                        println!("✅ Special character verification passed");
                    } else {
                        println!(
                            "❌ Special character verification failed: '{}' != '{}'",
                            special_test, read_value
                        );
                    }
                }
                _ => println!("❌ Special character read failed"),
            }
        }
        Err(e) => println!("❌ Special character write failed: {}", e),
    }

    // Test numbers as strings
    let number_test = "12345";
    println!("\n🔢 Testing numeric string: '{}'", number_test);
    match client
        .write_tag(tag_name, PlcValue::String(number_test.to_string()))
        .await
    {
        Ok(_) => {
            println!("✅ Numeric string write successful");
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            match client.read_tag(tag_name).await {
                Ok(PlcValue::String(read_value)) => {
                    if read_value == number_test {
                        println!("✅ Numeric string verification passed");
                    } else {
                        println!(
                            "❌ Numeric string verification failed: '{}' != '{}'",
                            number_test, read_value
                        );
                    }
                }
                _ => println!("❌ Numeric string read failed"),
            }
        }
        Err(e) => println!("❌ Numeric string write failed: {}", e),
    }

    // Final status check
    println!("\n🏁 FINAL STATUS CHECK");
    println!("=====================");
    match client.read_tag(tag_name).await {
        Ok(PlcValue::String(final_value)) => {
            println!("✅ Final tag value: '{}'", final_value);
        }
        Ok(other) => {
            println!("⚠️  Final tag returned unexpected type: {:?}", other);
        }
        Err(e) => {
            println!("❌ Final read failed: {}", e);
        }
    }

    println!("\n🎯 Debug test completed.");
    println!("   If writes report success but values don't change in PLC,");
    println!("   the issue is likely with the Allen-Bradley STRING format.");

    Ok(())
}
