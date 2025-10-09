use rust_ethernet_ip::{
    EipClient, PlcValue, RoutePath, TagAttributes, TagPermissions, TagScope, UdtDefinition,
    UdtMember,
};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔍 UDT Discovery Demo - v0.5.4");
    println!("=====================================");

    // Connect to PLC
    let mut client = EipClient::connect("192.168.0.1:44818").await?;
    println!("✅ Connected to PLC at 192.168.0.1:44818");

    // Demonstrate UDT Definition Discovery
    println!("\n📋 UDT Definition Discovery");
    println!("---------------------------");

    // Try to discover a UDT definition
    match client.get_udt_definition("Part_Data").await {
        Ok(definition) => {
            println!("✅ Successfully discovered UDT: {}", definition.name);
            println!("   Members ({}):", definition.members.len());

            for member in &definition.members {
                println!(
                    "   - {}: {} (offset: {}, size: {} bytes)",
                    member.name,
                    get_data_type_name(member.data_type),
                    member.offset,
                    member.size
                );
            }
        }
        Err(e) => {
            println!("❌ UDT discovery failed: {}", e);
            println!("   This is expected if the UDT doesn't exist on the PLC");
        }
    }

    // Demonstrate Tag Attributes Discovery
    println!("\n🏷️  Tag Attributes Discovery");
    println!("-----------------------------");

    // Try to get tag attributes
    match client.get_tag_attributes("Part_Data").await {
        Ok(attributes) => {
            println!("✅ Successfully discovered tag attributes:");
            println!("   Name: {}", attributes.name);
            println!(
                "   Data Type: {} (0x{:04X})",
                attributes.data_type_name, attributes.data_type
            );
            println!("   Size: {} bytes", attributes.size);
            println!("   Permissions: {:?}", attributes.permissions);
            println!("   Scope: {:?}", attributes.scope);
            if let Some(template_id) = attributes.template_instance_id {
                println!("   Template Instance ID: {}", template_id);
            }
        }
        Err(e) => {
            println!("❌ Tag attributes discovery failed: {}", e);
        }
    }

    // Demonstrate Enhanced Tag Discovery
    println!("\n🔍 Enhanced Tag Discovery");
    println!("-------------------------");

    match client.discover_tags_detailed().await {
        Ok(tags) => {
            println!("✅ Discovered {} tags:", tags.len());

            // Show first 10 tags
            for (i, tag) in tags.iter().take(10).enumerate() {
                println!(
                    "   {}. {} - {} ({} bytes)",
                    i + 1,
                    tag.name,
                    tag.data_type_name,
                    tag.size
                );
            }

            if tags.len() > 10 {
                println!("   ... and {} more tags", tags.len() - 10);
            }
        }
        Err(e) => {
            println!("❌ Tag discovery failed: {}", e);
        }
    }

    // Demonstrate Program-Scoped Tag Discovery
    println!("\n📁 Program-Scoped Tag Discovery");
    println!("-------------------------------");

    match client.discover_program_tags("MainProgram").await {
        Ok(tags) => {
            println!("✅ Discovered {} program-scoped tags:", tags.len());

            for tag in tags.iter().take(5) {
                println!(
                    "   - {} - {} ({} bytes)",
                    tag.name, tag.data_type_name, tag.size
                );
            }
        }
        Err(e) => {
            println!("❌ Program tag discovery failed: {}", e);
        }
    }

    // Demonstrate Route Path Support
    println!("\n🛣️  Route Path Support");
    println!("----------------------");

    // Create a route path for slot 2
    let route = RoutePath::new()
        .add_slot(0) // Backplane slot 0
        .add_slot(2); // Target slot 2

    println!("✅ Created route path:");
    println!("   Slots: {:?}", route.slots);
    println!("   CIP Bytes: {:02X?}", route.to_cip_bytes());

    // Create a client with route path
    match EipClient::with_route_path("192.168.0.1:44818", route.clone()).await {
        Ok(mut routed_client) => {
            println!("✅ Connected with route path");

            // Test reading a tag through the route
            match routed_client.read_tag("TestTag").await {
                Ok(value) => {
                    println!("   Read TestTag: {:?}", value);
                }
                Err(e) => {
                    println!("   Read failed: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ Route path connection failed: {}", e);
        }
    }

    // Demonstrate UDT Reading with Discovery
    println!("\n📖 UDT Reading with Discovery");
    println!("-----------------------------");

    // First discover the UDT structure
    if let Ok(definition) = client.get_udt_definition("Part_Data").await {
        println!("✅ UDT structure discovered, reading data...");

        // Read the UDT data
        match client.read_udt_chunked("Part_Data").await {
            Ok(udt_value) => {
                println!("✅ Successfully read UDT data");

                // Parse individual members using the discovered structure
                for member in &definition.members {
                    match client
                        .read_udt_member_by_offset(
                            "Part_Data",
                            member.offset as usize,
                            member.size as usize,
                            member.data_type,
                        )
                        .await
                    {
                        Ok(member_value) => {
                            println!("   {}: {:?}", member.name, member_value);
                        }
                        Err(e) => {
                            println!("   {}: Error - {}", member.name, e);
                        }
                    }
                }
            }
            Err(e) => {
                println!("❌ UDT reading failed: {}", e);
            }
        }
    } else {
        println!("❌ Cannot read UDT without structure discovery");
    }

    // Demonstrate Cache Management
    println!("\n💾 Cache Management");
    println!("-------------------");

    let cached_definitions = client.list_udt_definitions().await;
    let cached_attributes = client.list_cached_tag_attributes().await;

    println!("✅ Cached UDT definitions: {}", cached_definitions.len());
    println!("✅ Cached tag attributes: {}", cached_attributes.len());

    // Clear caches
    client.clear_caches().await;
    println!("✅ Caches cleared");

    // Demonstrate Error Handling
    println!("\n⚠️  Error Handling");
    println!("------------------");

    // Try to get UDT definition for non-existent tag
    match client.get_udt_definition("NonExistentUDT").await {
        Ok(_) => {
            println!("❌ Unexpected success for non-existent UDT");
        }
        Err(e) => {
            println!("✅ Correctly handled non-existent UDT: {}", e);
        }
    }

    // Try to get attributes for non-existent tag
    match client.get_tag_attributes("NonExistentTag").await {
        Ok(_) => {
            println!("❌ Unexpected success for non-existent tag");
        }
        Err(e) => {
            println!("✅ Correctly handled non-existent tag: {}", e);
        }
    }

    println!("\n🎉 UDT Discovery Demo Complete!");
    println!("================================");
    println!("New features demonstrated:");
    println!("✅ UDT Definition Discovery from PLC");
    println!("✅ Tag Attributes Discovery");
    println!("✅ Enhanced Tag Discovery");
    println!("✅ Program-Scoped Tag Discovery");
    println!("✅ Route Path Support");
    println!("✅ Packet Size Negotiation");
    println!("✅ Cache Management");
    println!("✅ Comprehensive Error Handling");

    Ok(())
}

/// Helper function to get human-readable data type names
fn get_data_type_name(data_type: u16) -> &'static str {
    match data_type {
        0x00C1 => "BOOL",
        0x00C2 => "INT",
        0x00C3 => "DINT",
        0x00C4 => "DINT",
        0x00C5 => "LINT",
        0x00C6 => "UINT",
        0x00C7 => "UDINT",
        0x00C8 => "ULINT",
        0x00CA => "REAL",
        0x00CB => "LREAL",
        0x00CE => "STRING",
        0x00CF => "SINT",
        0x00D0 => "USINT",
        0x00D1 => "UINT",
        0x00D2 => "UDINT",
        0x00D3 => "ULINT",
        0x00A0 => "UDT",
        _ => "UNKNOWN",
    }
}
