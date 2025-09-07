#!/usr/bin/env python3
"""
Advanced example of using the rust-ethernet-ip Python wrapper.
Demonstrates tag subscriptions and UDT handling.
"""

import asyncio
from rust_ethernet_ip import PyEipClient, PyPlcValue

async def tag_update_callback(tag_name: str, value):
    """Callback function for tag updates."""
    print(f"Tag {tag_name} updated to: {value}")

def main():
    # Create a new client
    client = PyEipClient("192.168.1.100")
    
    try:
        # Connect to the PLC
        client.connect()
        
        # Read some basic tags
        print("Reading basic tags...")
        
        # Read a boolean tag
        bool_value = client.read_bool("MyBoolTag")
        print(f"Boolean tag value: {bool_value}")
        
        # Read an integer tag
        int_value = client.read_dint("MyIntTag")
        print(f"Integer tag value: {int_value}")
        
        # Read a real tag
        real_value = client.read_real("MyRealTag")
        print(f"Real tag value: {real_value}")
        
        # Write some values
        print("\nWriting values...")
        client.write_bool("MyBoolTag", True)
        client.write_dint("MyIntTag", 42)
        client.write_real("MyRealTag", 3.14159)
        
        # Read back the values
        print("\nReading back values...")
        print(f"Boolean: {client.read_bool('MyBoolTag')}")
        print(f"Integer: {client.read_dint('MyIntTag')}")
        print(f"Real: {client.read_real('MyRealTag')}")
        
        # Work with strings
        print("\nWorking with strings...")
        client.write_string("MyStringTag", "Hello from Python!")
        string_value = client.read_string("MyStringTag")
        print(f"String value: {string_value}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        client.disconnect()

if __name__ == "__main__":
    main() 