# Python Wrapper for rust-ethernet-ip

This is a Python wrapper for the rust-ethernet-ip library, providing high-performance EtherNet/IP communication capabilities for Allen-Bradley CompactLogix and ControlLogix PLCs.

## Installation

### Prerequisites

- Python 3.7 or higher
- Rust toolchain (for building from source)
- pip (Python package manager)

### From Source

1. Clone the repository:
```bash
git clone https://github.com/sergiogallegos/rust-ethernet-ip.git
cd rust-ethernet-ip/pywrapper
```

2. Install the package:
```bash
pip install -e .
```

## Usage

Here's a basic example of how to use the library:

```python
from rust_ethernet_ip import EipClient

async def main():
    # Create a new client
    client = await EipClient.connect("192.168.1.100")
    
    try:
        # Read a tag
        value = await client.read_tag("MyTag")
        print(f"Tag value: {value}")
        
        # Write to a tag
        await client.write_tag("MyTag", 42)
        
        # Read multiple tags in batch
        results = await client.read_tags_batch(["Tag1", "Tag2", "Tag3"])
        for tag_name, result in results:
            if isinstance(result, Exception):
                print(f"Error reading {tag_name}: {result}")
            else:
                print(f"{tag_name}: {result}")
                
    finally:
        # Clean up
        await client.unregister_session()

# Run the async function
import asyncio
asyncio.run(main())
```

## Features

- High-performance async I/O
- Complete data type support
- Batch operations
- Tag subscriptions
- Error handling
- Type safety

## Data Types

The library supports all Allen-Bradley data types:

- BOOL
- SINT, INT, DINT, LINT
- USINT, UINT, UDINT, ULINT
- REAL, LREAL
- STRING
- UDT (User Defined Types)

## Error Handling

All operations return Python exceptions that can be caught and handled:

```python
try:
    value = await client.read_tag("NonExistentTag")
except Exception as e:
    print(f"Error: {e}")
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 