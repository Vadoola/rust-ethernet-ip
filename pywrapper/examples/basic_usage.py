#!/usr/bin/env python3
"""
Basic example of using the rust-ethernet-ip Python wrapper.
"""

import asyncio
from rust_ethernet_ip import PyEipClient, PyPlcValue

def main():
    # Create a new client (this will try to connect to PLC)
    try:
        client = PyEipClient("192.168.1.100:44818")
        print("✅ Successfully connected to PLC")
        
        # Read a DINT tag
        int_value = client.read_tag("MyIntTag")
        print(f"Integer tag value: {int_value}")
        
        # Write to a DINT tag
        dint_value = PyPlcValue.dint(42)
        result = client.write_tag("MyIntTag", dint_value)
        print(f"Write result: {result}")
        
        # Read a REAL tag
        real_value = client.read_tag("MyRealTag")
        print(f"Real tag value: {real_value}")
        
        # Write to a REAL tag
        real_val = PyPlcValue.real(3.14159)
        result = client.write_tag("MyRealTag", real_val)
        print(f"Write result: {result}")
        
        # Read a STRING tag
        string_value = client.read_tag("MyStringTag")
        print(f"String tag value: {string_value}")
        
        # Write to a STRING tag
        string_val = PyPlcValue.string("Hello, PLC!")
        result = client.write_tag("MyStringTag", string_val)
        print(f"Write result: {result}")
        
        # Batch read multiple tags
        results = client.read_tags_batch([
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
        try:
            client.unregister_session()
            print("✅ Session unregistered")
        except:
            pass

if __name__ == "__main__":
    main() 