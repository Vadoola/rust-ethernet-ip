# Tag Discovery and Reading Fix Summary

## Issues Identified

The contributor reported two main issues:
1. **Tag Discovery Failure**: `discover_tags()` was returning empty results
2. **Tag Reading Failure**: Reading tags like `Program:LS18_Rewind.CoreDiamMin` was failing with "Path segment error"

## Root Causes

### 1. Incorrect Tag List Request Format
- **Problem**: The original implementation used service `0x55` (List All Tags) with a simple path format
- **Solution**: Changed to use `GET_INSTANCE_ATTRIBUTE_LIST` service (0x55) with proper path structure matching the Node.js implementation

### 2. Wrong Tag List Response Parsing
- **Problem**: The parser expected a simple format `[name_len][name][type][is_array]...`
- **Solution**: Updated to parse the correct attribute list format: `[InstanceID(4)][NameLength(2)][Name][Type(2)]`

### 3. Incorrect Tag Path Building for Program Tags
- **Problem**: Program tags like `Program:LS18_Rewind.CoreDiamMin` were not handled correctly
- **Solution**: Added proper path building that handles program prefixes by splitting the path into program name and tag name segments

## Changes Made

### 1. Fixed Tag List Request (`src/lib.rs`)
```rust
// OLD: Simple service call
let cip_request = vec![0x55, 0x03, 0x20, 0x6B, 0x24, 0x01, 0x01, 0x00];

// NEW: Proper attribute list request
let mut path_array = Vec::new();
path_array.push(0x20); // Class segment identifier
path_array.push(0x6B); // Symbol Object Class
path_array.push(0x25); // Instance segment identifier with 0x00
path_array.push(0x00);
path_array.push(0x00);
path_array.push(0x00);

let request_data = vec![0x02, 0x00, 0x01, 0x00, 0x02, 0x00];
// Build proper CIP Message Router request...
```

### 2. Fixed Tag List Response Parsing (`src/tag_manager.rs`)
```rust
// OLD: Simple format parsing
let name_len = response[offset] as usize;
let name = String::from_utf8_lossy(&response[offset..offset + name_len]);

// NEW: Attribute list format parsing
let instance_id = u32::from_le_bytes([response[offset], response[offset + 1], response[offset + 2], response[offset + 3]]);
let name_length = u16::from_le_bytes([response[offset + 4], response[offset + 5]]) as usize;
let name = String::from_utf8_lossy(&response[offset + 6..offset + 6 + name_length]);
```

### 3. Fixed Tag Path Building (`src/lib.rs`)
```rust
// NEW: Proper program tag handling
if tag_name.starts_with("Program:") {
    let parts: Vec<&str> = tag_name.splitn(2, ':').collect();
    if parts.len() == 2 {
        let program_and_tag = parts[1];
        let program_parts: Vec<&str> = program_and_tag.splitn(2, '.').collect();
        
        if program_parts.len() == 2 {
            let program_name = program_parts[0];
            let tag_name = program_parts[1];
            
            // Build path: Program segment + program name + tag segment + tag name
            path.push(0x91); // ANSI Extended Symbol Segment
            path.push(program_name.len() as u8);
            path.extend_from_slice(program_name.as_bytes());
            // ... proper padding and tag segment
        }
    }
}
```

## Expected Results

After these fixes:
1. **Tag Discovery**: Should successfully discover and parse tag lists from PLCs
2. **Program Tag Reading**: Should correctly handle tags like `Program:LS18_Rewind.CoreDiamMin`
3. **Compatibility**: Should work with various PLC types that support the standard EtherNet/IP protocol

## Testing

A test example has been created at `examples/test_tag_discovery_fix.rs` that demonstrates:
- Connection to PLC
- Tag discovery
- Reading various tag types including program tags
- Error handling

## Compatibility Notes

These changes align the implementation with the working Node.js version referenced by the contributor, ensuring better compatibility across different PLC manufacturers and models.
