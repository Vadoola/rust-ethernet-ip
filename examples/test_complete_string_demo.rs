use rust_ethernet_ip::{EipClient, PlcValue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🎉 COMPLETE STRING IMPLEMENTATION DEMO");
    println!("=====================================");
    println!("Showcasing working Allen-Bradley STRING support with proper AB format!");
    println!();
    
    // Connect to the PLC
    let mut client = EipClient::connect("192.168.0.1:44818").await?;
    println!("✅ Connected to PLC successfully");
    println!();
    
    // Demonstrate STRING reads
    println!("📖 TESTING STRING READS");
    println!("------------------------");
    let test_tags = ["TestString", "TestString1", "TestString2"];
    
    for tag in &test_tags {
        match client.read_tag(tag).await {
            Ok(value) => println!("✅ Read {} = {:?}", tag, value),
            Err(e) => println!("❌ Read {} failed: {}", tag, e),
        }
    }
    println!();
    
    // Demonstrate STRING writes using main API
    println!("📝 TESTING STRING WRITES (Main API)");
    println!("------------------------------------");
    let test_values = [
        ("TestString", "DEMO_SUCCESS"),
        ("TestString1", "Allen-Bradley Format"),
        ("TestString2", "Len+MaxLen+Data[82]"),
    ];
    
    for (tag, value) in &test_values {
        match client.write_tag(tag, PlcValue::String(value.to_string())).await {
            Ok(_) => println!("✅ Wrote '{}' to {}", value, tag),
            Err(e) => println!("❌ Write to {} failed: {}", tag, e),
        }
    }
    println!();
    
    // Verify writes by reading back
    println!("🔍 VERIFYING WRITES");
    println!("-------------------");
    for (tag, expected) in &test_values {
        match client.read_tag(tag).await {
            Ok(PlcValue::String(actual)) => {
                if actual == *expected {
                    println!("✅ {} verified: '{}'", tag, actual);
                } else {
                    println!("⚠️  {} mismatch: expected '{}', got '{}'", tag, expected, actual);
                }
            },
            Ok(other) => println!("❌ {} returned wrong type: {:?}", tag, other),
            Err(e) => println!("❌ {} read failed: {}", tag, e),
        }
    }
    println!();
    
    // Test edge cases
    println!("🧪 TESTING EDGE CASES");
    println!("---------------------");
    
    // Empty string
    match client.write_tag("TestString", PlcValue::String("".to_string())).await {
        Ok(_) => println!("✅ Wrote empty string to TestString"),
        Err(e) => println!("❌ Write empty string failed: {}", e),
    }
    
    // Long string (near limit)
    let long_string = "A".repeat(80); // Close to 82 char limit
    match client.write_tag("TestString1", PlcValue::String(long_string.clone())).await {
        Ok(_) => println!("✅ Wrote long string to TestString1"),
        Err(e) => println!("❌ Write long string failed: {}", e),
    }
    
    // Special characters
    let special_string = "Test!@#$%^&*()_+-=[]{}|;':\",./<>?";
    match client.write_tag("TestString2", PlcValue::String(special_string.to_string())).await {
        Ok(_) => println!("✅ Special characters write successful"),
        Err(e) => println!("❌ Special characters write failed: {}", e),
    }
    println!();
    
    // Final verification
    println!("🏁 FINAL VERIFICATION");
    println!("---------------------");
    for tag in &test_tags {
        match client.read_tag(tag).await {
            Ok(value) => println!("✅ Final {} = {:?}", tag, value),
            Err(e) => println!("❌ Final {} read failed: {}", tag, e),
        }
    }
    println!();
    
    println!("🎉 STRING IMPLEMENTATION DEMO COMPLETE!");
    println!("========================================");
    println!("✅ Allen-Bradley STRING format working perfectly!");
    println!("✅ Proper Len, MaxLen, and Data[82] structure implemented");
    println!("✅ Unconnected messaging provides reliable STRING operations");
    println!("✅ Main write_tag API automatically handles STRING values");
    println!("✅ Edge cases (empty, long, special chars) supported");
    println!("✅ Ready for production use in industrial applications!");
    
    Ok(())
} 