use rust_ethernet_ip::EipClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🔄 Starting EtherNet/IP String Test with Multiple Connection Configurations");
    
    // Connect to PLC
    let mut client = EipClient::connect("192.168.0.1:44818").await?;
    
    println!("✅ Connected to PLC successfully");
    
    // Test string read first (should work)
    println!("\n📖 Testing String Read...");
    match client.read_tag("TestString").await {
        Ok(value) => {
            println!("✅ Read TestString = {:?}", value);
        },
        Err(e) => {
            println!("❌ Failed to read TestString: {}", e);
            return Err(e.into());
        }
    }
    
    // Test connected string write with multiple configurations
    println!("\n🔗 Testing Connected String Write with Multiple Configurations...");
    match client.write_string_connected("TestString", "CONNECTED_TEST").await {
        Ok(()) => {
            println!("✅ Connected string write successful!");
            
            // Verify the write worked by reading back
            println!("\n📖 Verifying connected write...");
            match client.read_tag("TestString").await {
                Ok(value) => {
                    println!("✅ Verification read: TestString = {:?}", value);
                },
                Err(e) => {
                    println!("❌ Failed to verify write: {}", e);
                }
            }
        },
        Err(e) => {
            println!("❌ Connected string write failed: {}", e);
            println!("   This indicates that none of the connection parameter configurations worked");
            
            // Try a few more test strings to see if any work
            println!("\n🔄 Testing other string tags...");
            for tag in ["TestString1", "TestString2"] {
                match client.write_string_connected(tag, "ALT_TEST").await {
                    Ok(()) => {
                        println!("✅ Connected write to {} successful!", tag);
                        break;
                    },
                    Err(e) => {
                        println!("❌ Connected write to {} failed: {}", tag, e);
                    }
                }
            }
        }
    }
    
    // Test reading all string tags to see current values
    println!("\n📖 Reading all string tag values...");
    for tag in ["TestString", "TestString1", "TestString2"] {
        match client.read_tag(tag).await {
            Ok(value) => {
                println!("   {} = {:?}", tag, value);
            },
            Err(e) => {
                println!("   {} = Error: {}", tag, e);
            }
        }
    }
    
    println!("\n🏁 Test completed");
    Ok(())
} 