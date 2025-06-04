///! # Batch Operations Demo
///! 
///! This example demonstrates the powerful batch operations feature of the rust-ethernet-ip library.
///! Batch operations allow you to perform multiple read/write operations in a single network packet,
///! dramatically improving performance for scenarios involving multiple PLC operations.
///! 
///! ## Performance Benefits
///! 
///! - **3-10x faster** than individual operations
///! - **Reduced network traffic** (1-5 packets instead of N packets for N operations)
///! - **Lower PLC CPU usage** due to fewer connection handling overheads
///! - **Better throughput** for data collection and control applications
///! 
///! ## Use Cases
///! 
///! - **Data acquisition**: Reading multiple sensor values simultaneously
///! - **Recipe management**: Writing multiple setpoints at once
///! - **Status monitoring**: Reading multiple status flags efficiently
///! - **Coordinated control**: Atomic operations across multiple tags

use rust_ethernet_ip::EipClient;
use rust_ethernet_ip::{BatchOperation, BatchConfig, PlcValue};
use std::time::Instant;
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Rust EtherNet/IP Batch Operations Demo");
    println!("==========================================\n");

    // For demonstration purposes, we'll use a mock PLC address
    // In real usage, replace with your PLC's IP address
    let plc_address = "192.168.0.1:44818";
    
    println!("📡 Connecting to PLC at {}", plc_address);
    
    // Note: This demo shows the API usage. In a real environment, ensure your PLC is accessible
    match EipClient::connect(plc_address).await {
        Ok(mut client) => {
            run_batch_operations_demo(&mut client).await?;
        }
        Err(e) => {
            println!("⚠️  Connection failed: {}", e);
            println!("📝 This is expected if no PLC is available - showing API usage examples instead\n");
            demonstrate_batch_api_usage();
        }
    }

    Ok(())
}

async fn run_batch_operations_demo(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("✅ Connected to PLC successfully!\n");

    // Example 1: Basic Batch Reading
    demo_basic_batch_reading(client).await?;
    
    // Example 2: Basic Batch Writing
    demo_basic_batch_writing(client).await?;
    
    // Example 3: Mixed Operations (Reads and Writes)
    demo_mixed_operations(client).await?;
    
    // Example 4: Performance Comparison
    demo_performance_comparison(client).await?;
    
    // Example 5: Advanced Configuration
    demo_advanced_configuration(client).await?;
    
    // Example 6: Error Handling
    demo_error_handling(client).await?;

    println!("🎉 All batch operations demos completed successfully!");
    Ok(())
}

async fn demo_basic_batch_reading(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("📖 Demo 1: Basic Batch Reading");
    println!("------------------------------");
    
    let tags_to_read = vec![
        "ProductionCount",
        "Temperature_1",
        "Temperature_2", 
        "Pressure_1",
        "FlowRate",
    ];
    
    let start_time = Instant::now();
    
    match client.read_tags_batch(&tags_to_read).await {
        Ok(results) => {
            let duration = start_time.elapsed();
            
            println!("✅ Read {} tags in {:?}", results.len(), duration);
            for (tag_name, result) in results {
                match result {
                    Ok(value) => println!("  📊 {}: {:?}", tag_name, value),
                    Err(error) => println!("  ❌ {}: {}", tag_name, error),
                }
            }
        }
        Err(e) => println!("❌ Batch read failed: {}", e),
    }
    
    println!();
    Ok(())
}

async fn demo_basic_batch_writing(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("✏️  Demo 2: Basic Batch Writing");
    println!("------------------------------");
    
    let tags_to_write = vec![
        ("SetPoint_1", PlcValue::Real(75.5)),
        ("SetPoint_2", PlcValue::Real(80.0)),
        ("EnableFlag", PlcValue::Bool(true)),
        ("ProductionMode", PlcValue::Dint(2)),
        ("RecipeNumber", PlcValue::Dint(42)),
    ];
    
    let start_time = Instant::now();
    
    match client.write_tags_batch(&tags_to_write).await {
        Ok(results) => {
            let duration = start_time.elapsed();
            
            println!("✅ Wrote {} tags in {:?}", results.len(), duration);
            for (tag_name, result) in results {
                match result {
                    Ok(()) => println!("  ✅ {}: Write successful", tag_name),
                    Err(error) => println!("  ❌ {}: {}", tag_name, error),
                }
            }
        }
        Err(e) => println!("❌ Batch write failed: {}", e),
    }
    
    println!();
    Ok(())
}

async fn demo_mixed_operations(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("🔄 Demo 3: Mixed Operations (Reads + Writes)");
    println!("--------------------------------------------");
    
    let operations = vec![
        // Read current values
        BatchOperation::Read { tag_name: "CurrentTemp".to_string() },
        BatchOperation::Read { tag_name: "CurrentPressure".to_string() },
        
        // Write new setpoints based on current conditions
        BatchOperation::Write { 
            tag_name: "TempSetpoint".to_string(), 
            value: PlcValue::Real(78.5) 
        },
        BatchOperation::Write { 
            tag_name: "PressureSetpoint".to_string(), 
            value: PlcValue::Real(15.2) 
        },
        
        // Update status flags
        BatchOperation::Write { 
            tag_name: "AutoModeEnabled".to_string(), 
            value: PlcValue::Bool(true) 
        },
    ];
    
    let start_time = Instant::now();
    
    match client.execute_batch(&operations).await {
        Ok(results) => {
            let duration = start_time.elapsed();
            
            println!("✅ Executed {} operations in {:?}", results.len(), duration);
            for result in results {
                match result.operation {
                    BatchOperation::Read { tag_name } => {
                        match result.result {
                            Ok(Some(value)) => println!("  📊 Read {}: {:?} ({}μs)", 
                                tag_name, value, result.execution_time_us),
                            Ok(None) => println!("  ❌ Read {}: No data returned", tag_name),
                            Err(error) => println!("  ❌ Read {}: {}", tag_name, error),
                        }
                    }
                    BatchOperation::Write { tag_name, .. } => {
                        match result.result {
                            Ok(_) => println!("  ✅ Write {}: Success ({}μs)", 
                                tag_name, result.execution_time_us),
                            Err(error) => println!("  ❌ Write {}: {}", tag_name, error),
                        }
                    }
                }
            }
        }
        Err(e) => println!("❌ Mixed batch operations failed: {}", e),
    }
    
    println!();
    Ok(())
}

async fn demo_performance_comparison(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("⚡ Demo 4: Performance Comparison");
    println!("--------------------------------");
    
    let tags = vec![
        "Performance_Test_1",
        "Performance_Test_2",
        "Performance_Test_3",
        "Performance_Test_4",
        "Performance_Test_5",
    ];
    
    // Individual operations (traditional approach)
    println!("🐌 Individual operations:");
    let individual_start = Instant::now();
    
    for tag in &tags {
        match client.read_tag(tag).await {
            Ok(value) => println!("  📊 {}: {:?}", tag, value),
            Err(e) => println!("  ❌ {}: {}", tag, e),
        }
    }
    
    let individual_duration = individual_start.elapsed();
    println!("  ⏱️  Total time: {:?}", individual_duration);
    
    // Batch operations (optimized approach)
    println!("\n🚀 Batch operations:");
    let batch_start = Instant::now();
    
    match client.read_tags_batch(&tags).await {
        Ok(results) => {
            for (tag_name, result) in results {
                match result {
                    Ok(value) => println!("  📊 {}: {:?}", tag_name, value),
                    Err(error) => println!("  ❌ {}: {}", tag_name, error),
                }
            }
        }
        Err(e) => println!("  ❌ Batch failed: {}", e),
    }
    
    let batch_duration = batch_start.elapsed();
    println!("  ⏱️  Total time: {:?}", batch_duration);
    
    // Calculate performance improvement
    if batch_duration.as_nanos() > 0 {
        let speedup = individual_duration.as_nanos() as f64 / batch_duration.as_nanos() as f64;
        println!("\n📈 Performance improvement: {:.1}x faster with batch operations!", speedup);
    }
    
    println!();
    Ok(())
}

async fn demo_advanced_configuration(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("⚙️  Demo 5: Advanced Configuration");
    println!("----------------------------------");
    
    // Show current configuration
    let current_config = client.get_batch_config();
    println!("📋 Current batch configuration:");
    println!("  • Max operations per packet: {}", current_config.max_operations_per_packet);
    println!("  • Max packet size: {} bytes", current_config.max_packet_size);
    println!("  • Packet timeout: {}ms", current_config.packet_timeout_ms);
    println!("  • Continue on error: {}", current_config.continue_on_error);
    println!("  • Optimize packet packing: {}", current_config.optimize_packet_packing);
    
    // Configure for high-performance scenario
    println!("\n🚀 Configuring for high-performance scenario:");
    let high_perf_config = BatchConfig {
        max_operations_per_packet: 50,
        max_packet_size: 4000,
        packet_timeout_ms: 1000,
        continue_on_error: true,
        optimize_packet_packing: true,
    };
    
    client.configure_batch_operations(high_perf_config);
    println!("  ✅ Applied high-performance configuration");
    
    // Configure for conservative/reliable scenario
    println!("\n🛡️  Configuring for conservative scenario:");
    let conservative_config = BatchConfig {
        max_operations_per_packet: 10,
        max_packet_size: 504,
        packet_timeout_ms: 5000,
        continue_on_error: false,
        optimize_packet_packing: false,
    };
    
    client.configure_batch_operations(conservative_config);
    println!("  ✅ Applied conservative configuration");
    
    // Restore default configuration
    client.configure_batch_operations(BatchConfig::default());
    println!("  🔄 Restored default configuration");
    
    println!();
    Ok(())
}

async fn demo_error_handling(client: &mut EipClient) -> Result<(), Box<dyn std::error::Error>> {
    println!("🚨 Demo 6: Error Handling");
    println!("-------------------------");
    
    // Test with intentionally problematic operations
    let operations_with_errors = vec![
        BatchOperation::Read { tag_name: "ValidTag".to_string() },
        BatchOperation::Read { tag_name: "NonExistentTag_12345".to_string() },
        BatchOperation::Write { 
            tag_name: "AnotherValidTag".to_string(), 
            value: PlcValue::Dint(100) 
        },
        BatchOperation::Read { tag_name: "".to_string() }, // Invalid tag name
    ];
    
    println!("🧪 Testing error handling with problematic operations...");
    
    match client.execute_batch(&operations_with_errors).await {
        Ok(results) => {
            println!("✅ Batch completed with mixed results:");
            
            let mut success_count = 0;
            let mut error_count = 0;
            
            for result in results {
                match result.operation {
                    BatchOperation::Read { tag_name } => {
                        match result.result {
                            Ok(Some(value)) => {
                                println!("  ✅ Read {}: {:?}", tag_name, value);
                                success_count += 1;
                            }
                            Ok(None) => {
                                println!("  ⚠️  Read {}: No data", tag_name);
                                error_count += 1;
                            }
                            Err(error) => {
                                println!("  ❌ Read {}: {}", tag_name, error);
                                error_count += 1;
                            }
                        }
                    }
                    BatchOperation::Write { tag_name, .. } => {
                        match result.result {
                            Ok(_) => {
                                println!("  ✅ Write {}: Success", tag_name);
                                success_count += 1;
                            }
                            Err(error) => {
                                println!("  ❌ Write {}: {}", tag_name, error);
                                error_count += 1;
                            }
                        }
                    }
                }
            }
            
            println!("\n📊 Results summary:");
            println!("  • Successful operations: {}", success_count);
            println!("  • Failed operations: {}", error_count);
            println!("  • Success rate: {:.1}%", 
                (success_count as f32 / (success_count + error_count) as f32) * 100.0);
        }
        Err(e) => {
            println!("❌ Entire batch failed: {}", e);
            println!("💡 This demonstrates batch-level error handling");
        }
    }
    
    println!();
    Ok(())
}

/// Demonstrates the API usage without requiring an actual PLC connection
fn demonstrate_batch_api_usage() {
    println!("📚 Batch Operations API Usage Examples");
    println!("======================================\n");

    // Example 1: Creating batch operations
    println!("1️⃣  Creating Batch Operations:");
    println!("```rust");
    println!("use rust_ethernet_ip::{{BatchOperation, PlcValue}};");
    println!();
    println!("let operations = vec![");
    println!("    BatchOperation::Read {{ tag_name: \"Temperature\".to_string() }},");
    println!("    BatchOperation::Write {{ ");
    println!("        tag_name: \"Setpoint\".to_string(), ");
    println!("        value: PlcValue::Real(75.5) ");
    println!("    }},");
    println!("];");
    println!("```\n");

    // Example 2: Batch configuration
    println!("2️⃣  Configuring Batch Behavior:");
    println!("```rust");
    println!("use rust_ethernet_ip::BatchConfig;");
    println!();
    println!("let high_performance_config = BatchConfig {{");
    println!("    max_operations_per_packet: 50,");
    println!("    max_packet_size: 4000,");
    println!("    packet_timeout_ms: 1000,");
    println!("    continue_on_error: true,");
    println!("    optimize_packet_packing: true,");
    println!("}};");
    println!();
    println!("client.configure_batch_operations(high_performance_config);");
    println!("```\n");

    // Example 3: Executing batch operations
    println!("3️⃣  Executing Batch Operations:");
    println!("```rust");
    println!("// Execute mixed operations");
    println!("let results = client.execute_batch(&operations).await?;");
    println!();
    println!("// Or use convenience methods");
    println!("let read_results = client.read_tags_batch(&[\"Tag1\", \"Tag2\"]).await?;");
    println!("let write_results = client.write_tags_batch(&[");
    println!("    (\"SetPoint1\", PlcValue::Dint(1500)),");
    println!("    (\"EnableFlag\", PlcValue::Bool(true)),");
    println!("]).await?;");
    println!("```\n");

    // Example 4: Error handling
    println!("4️⃣  Handling Results and Errors:");
    println!("```rust");
    println!("for result in results {{");
    println!("    match result.operation {{");
    println!("        BatchOperation::Read {{ tag_name }} => {{");
    println!("            match result.result {{");
    println!("                Ok(Some(value)) => println!(\"Read {{}}: {{:?}}\", tag_name, value),");
    println!("                Ok(None) => println!(\"No data for {{}}\", tag_name),");
    println!("                Err(error) => println!(\"Error reading {{}}: {{}}\", tag_name, error),");
    println!("            }}");
    println!("        }}");
    println!("        BatchOperation::Write {{ tag_name, .. }} => {{");
    println!("            match result.result {{");
    println!("                Ok(_) => println!(\"Write {{}} successful\", tag_name),");
    println!("                Err(error) => println!(\"Error writing {{}}: {{}}\", tag_name, error),");
    println!("            }}");
    println!("        }}");
    println!("    }}");
    println!("}}");
    println!("```\n");

    // Performance tips
    println!("🚀 Performance Tips:");
    println!("• Use batch operations for 3+ operations to see significant benefits");
    println!("• Group similar operations (reads together, writes together) for optimal packing");
    println!("• Adjust max_operations_per_packet based on your PLC's capabilities");
    println!("• Use higher packet sizes (up to 4000 bytes) for modern PLCs");
    println!("• Enable continue_on_error for data collection scenarios");
    println!("• Disable optimize_packet_packing if operation order is critical\n");

    println!("📖 For more examples, see the documentation and integration tests.");
} 