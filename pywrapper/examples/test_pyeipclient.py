from rust_ethernet_ip import PyEipClient, PyPlcValue

def main():
    # Create a new client
    client = PyEipClient(addr="192.168.0.1:44818")
    
    try:
        # Read a DINT value
        value = client.read_tag("TestDINT")
        print(f"Read TestDINT: {value}")
        
        # Create a new PyPlcValue for writing
        new_value = PyPlcValue.dint(42)
        
        # Write the new value
        result = client.write_tag("TestDINT", new_value)
        print(f"write_tag returned: {result!r}")
        if not result:
            print("Failed to write value")
            return
        print("Successfully wrote new value")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        print("🔌 Unregistering session and cleaning up connections...")
        client.unregister_session()
        print("✅ Session unregistered and all connections closed")

if __name__ == "__main__":
    main() 