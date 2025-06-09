#!/usr/bin/env python3
"""
Advanced example of using the rust-ethernet-ip Python wrapper.
Demonstrates tag subscriptions and UDT handling.
"""

import asyncio
from rust_ethernet_ip import EipClient, SubscriptionOptions

async def tag_update_callback(tag_name: str, value):
    """Callback function for tag updates."""
    print(f"Tag {tag_name} updated to: {value}")

async def main():
    # Create a new client
    client = await EipClient.connect("192.168.1.100")
    
    try:
        # Configure subscription options
        options = SubscriptionOptions(
            update_rate_ms=100,  # Update every 100ms
            callback=tag_update_callback
        )
        
        # Subscribe to multiple tags
        await client.subscribe_to_tags([
            ("MyBoolTag", options),
            ("MyIntTag", options),
            ("MyRealTag", options)
        ])
        
        # Work with a UDT (User Defined Type)
        # Assuming we have a UDT named "MyUDT" with members:
        # - Status (BOOL)
        # - Value (REAL)
        # - Description (STRING)
        
        # Read the entire UDT
        udt_value = await client.read_tag("MyUDT")
        print("\nUDT values:")
        for member_name, member_value in udt_value.items():
            print(f"{member_name}: {member_value}")
        
        # Update individual UDT members
        await client.write_tag("MyUDT.Status", True)
        await client.write_tag("MyUDT.Value", 123.45)
        await client.write_tag("MyUDT.Description", "Updated via Python")
        
        # Read the updated UDT
        updated_udt = await client.read_tag("MyUDT")
        print("\nUpdated UDT values:")
        for member_name, member_value in updated_udt.items():
            print(f"{member_name}: {member_value}")
        
        # Keep the program running to receive tag updates
        print("\nWaiting for tag updates (press Ctrl+C to exit)...")
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        await client.unregister_session()

if __name__ == "__main__":
    asyncio.run(main()) 