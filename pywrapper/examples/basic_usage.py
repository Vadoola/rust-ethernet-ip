#!/usr/bin/env python3
"""
Basic example of using the rust-ethernet-ip Python wrapper.
"""

import asyncio
from rust_ethernet_ip import EipClient

async def main():
    # Create a new client
    client = await EipClient.connect("192.168.1.100")
    
    try:
        # Read a boolean tag
        bool_value = await client.read_tag("MyBoolTag")
        print(f"Boolean tag value: {bool_value}")
        
        # Write to a boolean tag
        await client.write_tag("MyBoolTag", True)
        
        # Read an integer tag
        int_value = await client.read_tag("MyIntTag")
        print(f"Integer tag value: {int_value}")
        
        # Write to an integer tag
        await client.write_tag("MyIntTag", 42)
        
        # Read a floating point tag
        float_value = await client.read_tag("MyRealTag")
        print(f"Real tag value: {float_value}")
        
        # Write to a floating point tag
        await client.write_tag("MyRealTag", 3.14159)
        
        # Read a string tag
        string_value = await client.read_tag("MyStringTag")
        print(f"String tag value: {string_value}")
        
        # Write to a string tag
        await client.write_tag("MyStringTag", "Hello, PLC!")
        
        # Batch read multiple tags
        results = await client.read_tags_batch([
            "MyBoolTag",
            "MyIntTag",
            "MyRealTag",
            "MyStringTag"
        ])
        
        print("\nBatch read results:")
        for tag_name, result in results:
            if isinstance(result, Exception):
                print(f"Error reading {tag_name}: {result}")
            else:
                print(f"{tag_name}: {result}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        await client.unregister_session()

if __name__ == "__main__":
    asyncio.run(main()) 