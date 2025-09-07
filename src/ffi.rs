use crate::EipClient;
use crate::PlcValue;
use crate::RUNTIME;
use lazy_static::lazy_static;
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};
use std::ptr;
use std::sync::Mutex;

// FFI-specific client manager using synchronous mutex
lazy_static! {
    static ref FFI_CLIENTS: Mutex<HashMap<i32, EipClient>> = Mutex::new(HashMap::new());
    static ref FFI_NEXT_ID: Mutex<i32> = Mutex::new(1);
}

/// Connect to a PLC and return a client ID
///
/// # Safety
///
/// This function is unsafe because:
/// - `ip_address` must be a valid null-terminated C string pointer
/// - The caller must ensure the pointer remains valid for the duration of the call
/// - The string must contain a valid IP address format
#[no_mangle]
pub unsafe extern "C" fn eip_connect(ip_address: *const c_char) -> c_int {
    if ip_address.is_null() {
        return -1;
    }

    let ip_str = match unsafe { CStr::from_ptr(ip_address) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let client = match RUNTIME.block_on(EipClient::new(ip_str)) {
        Ok(client) => client,
        Err(_) => return -1,
    };

    let client_id = {
        let mut next_id = FFI_NEXT_ID.lock().unwrap();
        let id = *next_id;
        *next_id += 1;
        id
    };

    {
        let mut clients = FFI_CLIENTS.lock().unwrap();
        clients.insert(client_id, client);
    }

    client_id
}

/// Disconnect from a PLC
///
/// # Safety
///
/// This function is unsafe because:
/// - `client_id` must be a valid client ID returned from `eip_connect`
/// - The caller must not use the client_id after this call
#[no_mangle]
pub unsafe extern "C" fn eip_disconnect(client_id: c_int) -> c_int {
    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.remove(&client_id) {
        Some(_) => 0,
        None => -1,
    }
}

/// Read a boolean tag
///
/// # Safety
///
/// This function is unsafe because:
/// - `tag_name` must be a valid null-terminated C string pointer
/// - `result` must be a valid mutable pointer to a c_int
/// - The caller must ensure both pointers remain valid for the duration of the call
/// - `client_id` must be a valid client ID returned from `eip_connect`
#[no_mangle]
pub unsafe extern "C" fn eip_read_bool(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut c_int,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Bool(value)) => {
                unsafe {
                    *result = if value { 1 } else { 0 };
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

/// Write a boolean tag
///
/// # Safety
///
/// This function is unsafe because:
/// - `tag_name` must be a valid null-terminated C string pointer
/// - The caller must ensure the pointer remains valid for the duration of the call
/// - `client_id` must be a valid client ID returned from `eip_connect`
/// - The tag name must be a valid PLC tag identifier
#[no_mangle]
pub unsafe extern "C" fn eip_write_bool(
    client_id: c_int,
    tag_name: *const c_char,
    value: c_int,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            let bool_value = value != 0;
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Bool(bool_value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// SINT (8-bit signed integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_sint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut i8,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Sint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_sint(
    client_id: c_int,
    tag_name: *const c_char,
    value: i8,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Sint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// INT (16-bit signed integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_int(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut i16,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Int(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_int(
    client_id: c_int,
    tag_name: *const c_char,
    value: i16,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Int(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

/// Read a DINT tag
#[no_mangle]
pub unsafe extern "C" fn eip_read_dint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut c_int,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Dint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

/// Write a DINT tag
#[no_mangle]
pub unsafe extern "C" fn eip_write_dint(
    client_id: c_int,
    tag_name: *const c_char,
    value: c_int,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Dint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// LINT (64-bit signed integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_lint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut i64,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Lint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_lint(
    client_id: c_int,
    tag_name: *const c_char,
    value: i64,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Lint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// USINT (8-bit unsigned integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_usint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut u8,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Usint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_usint(
    client_id: c_int,
    tag_name: *const c_char,
    value: u8,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Usint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// UINT (16-bit unsigned integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_uint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut u16,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Uint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_uint(
    client_id: c_int,
    tag_name: *const c_char,
    value: u16,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Uint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// UDINT (32-bit unsigned integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_udint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut u32,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Udint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_udint(
    client_id: c_int,
    tag_name: *const c_char,
    value: u32,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Udint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// ULINT (64-bit unsigned integer) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_ulint(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut u64,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Ulint(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_ulint(
    client_id: c_int,
    tag_name: *const c_char,
    value: u64,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Ulint(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

/// Read a REAL tag
#[no_mangle]
pub unsafe extern "C" fn eip_read_real(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut f64,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Real(value)) => {
                unsafe {
                    *result = value as f64;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

/// Write a REAL tag
#[no_mangle]
pub unsafe extern "C" fn eip_write_real(
    client_id: c_int,
    tag_name: *const c_char,
    value: f64,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Real(value as f32))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

// LREAL (64-bit double precision) operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_lreal(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut f64,
) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => match RUNTIME.block_on(client.read_tag(tag_name_str)) {
            Ok(PlcValue::Lreal(value)) => {
                unsafe {
                    *result = value;
                }
                0
            }
            _ => -1,
        },
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_lreal(
    client_id: c_int,
    tag_name: *const c_char,
    value: f64,
) -> c_int {
    if tag_name.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::Lreal(value))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
}

/// Read a STRING tag
#[no_mangle]
pub unsafe extern "C" fn eip_read_string(
    client_id: c_int,
    tag_name: *const c_char,
    result: *mut c_char,
    max_length: c_int,
) -> c_int {
    if tag_name.is_null() || result.is_null() || max_length <= 0 {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    let client = match clients.get_mut(&client_id) {
        Some(client) => client,
        None => return -1,
    };

    let value = match RUNTIME.block_on(client.read_tag(tag_name_str)) {
        Ok(PlcValue::String(value)) => value,
        Ok(_) => return -1,  // Wrong data type
        Err(_) => return -1, // Error reading tag
    };

    let c_string = match CString::new(value) {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let bytes = c_string.as_bytes_with_nul();
    if bytes.len() > max_length as usize {
        return -1; // String too long
    }

    unsafe {
        ptr::copy_nonoverlapping(bytes.as_ptr(), result as *mut u8, bytes.len());
    }
    0
}

/// Write a STRING tag
#[no_mangle]
pub unsafe extern "C" fn eip_write_string(
    client_id: c_int,
    tag_name: *const c_char,
    value: *const c_char,
) -> c_int {
    if tag_name.is_null() || value.is_null() {
        return -1;
    }

    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let value_str = match unsafe { CStr::from_ptr(value) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut clients = FFI_CLIENTS.lock().unwrap();
    let client = match clients.get_mut(&client_id) {
        Some(client) => client,
        None => return -1,
    };

    match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::String(value_str.to_string())))
    {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

// UDT operations
#[no_mangle]
pub unsafe extern "C" fn eip_read_udt(
    _client_id: c_int,
    _tag_name: *const c_char,
    _result: *mut c_char,
    _max_size: c_int,
) -> c_int {
    // For now, return error - UDT support can be added later
    -1
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_udt(
    _client_id: c_int,
    _tag_name: *const c_char,
    _value: *const c_char,
    _size: c_int,
) -> c_int {
    // For now, return error - UDT support can be added later
    -1
}

// Tag discovery and metadata
#[no_mangle]
pub unsafe extern "C" fn eip_discover_tags(_client_id: c_int) -> c_int {
    // Return success for now - can implement tag discovery later
    0
}

#[no_mangle]
pub unsafe extern "C" fn eip_get_tag_metadata(
    _client_id: c_int,
    _tag_name: *const c_char,
    _metadata: *mut u8,
) -> c_int {
    // For now, return error - metadata support can be added later
    -1
}

// Configuration
#[no_mangle]
pub unsafe extern "C" fn eip_set_max_packet_size(_client_id: c_int, _size: c_int) -> c_int {
    // Return success for now - packet size configuration can be added later
    0
}

// Health checks
#[no_mangle]
pub unsafe extern "C" fn eip_check_health(client_id: c_int, is_healthy: *mut c_int) -> c_int {
    if is_healthy.is_null() {
        return -1;
    }

    let clients = FFI_CLIENTS.lock().unwrap();
    match clients.get(&client_id) {
        Some(_) => {
            unsafe {
                *is_healthy = 1;
            }
            0
        }
        None => {
            unsafe {
                *is_healthy = 0;
            }
            -1
        }
    }
}

#[no_mangle]
pub unsafe extern "C" fn eip_check_health_detailed(
    client_id: c_int,
    is_healthy: *mut c_int,
) -> c_int {
    // Use the same logic as basic health check for now
    eip_check_health(client_id, is_healthy)
}

// Batch operations implementation
#[no_mangle]
pub unsafe extern "C" fn eip_read_tags_batch(
    client_id: c_int,
    tag_names: *mut *const c_char,
    tag_count: c_int,
    results: *mut c_char,
    results_capacity: c_int,
) -> c_int {
    if tag_names.is_null() || results.is_null() || tag_count <= 0 {
        return -1;
    }

    let mut clients = FFI_CLIENTS.lock().unwrap();
    let client = match clients.get_mut(&client_id) {
        Some(client) => client,
        None => return -1,
    };

    // Convert C strings to Rust strings
    let mut tag_name_strs = Vec::new();
    unsafe {
        for i in 0..tag_count {
            let tag_name_ptr = *tag_names.offset(i as isize);
            if tag_name_ptr.is_null() {
                return -1;
            }
            let tag_name = match CStr::from_ptr(tag_name_ptr).to_str() {
                Ok(s) => s,
                Err(_) => return -1,
            };
            tag_name_strs.push(tag_name);
        }
    }

    // Execute batch read
    let batch_results = RUNTIME.block_on(async { client.read_tags_batch(&tag_name_strs).await });

    let results_data = match batch_results {
        Ok(results) => {
            // Simple format: "tag1:value1;tag2:value2;..."
            let mut formatted = String::new();
            for (i, (tag_name, result)) in results.iter().enumerate() {
                if i > 0 {
                    formatted.push(';');
                }
                formatted.push_str(tag_name);
                formatted.push(':');
                match result {
                    Ok(value) => formatted.push_str(&format!("{:?}", value)),
                    Err(e) => formatted.push_str(&format!("ERROR:{}", e)),
                }
            }
            formatted
        }
        Err(_) => return -1,
    };

    // Copy results to output buffer
    let results_bytes = results_data.as_bytes();
    if results_bytes.len() >= results_capacity as usize {
        return -1;
    }

    unsafe {
        std::ptr::copy_nonoverlapping(
            results_bytes.as_ptr(),
            results as *mut u8,
            results_bytes.len(),
        );
        *results.add(results_bytes.len()) = 0; // Null terminate
    }

    0
}

#[no_mangle]
pub unsafe extern "C" fn eip_write_tags_batch(
    client_id: c_int,
    tag_values: *const c_char,
    tag_count: c_int,
    results: *mut c_char,
    results_capacity: c_int,
) -> c_int {
    if tag_values.is_null() || results.is_null() || tag_count <= 0 {
        return -1;
    }

    let mut clients = FFI_CLIENTS.lock().unwrap();
    let _client = match clients.get_mut(&client_id) {
        Some(client) => client,
        None => return -1,
    };

    // Parse input (simplified implementation)
    let _input_str = unsafe {
        match CStr::from_ptr(tag_values).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    // For now, return not implemented
    // TODO: Parse input and execute batch write
    let results_data = "ERROR:Batch write not yet implemented in FFI";
    let results_bytes = results_data.as_bytes();

    if results_bytes.len() >= results_capacity as usize {
        return -1;
    }

    unsafe {
        std::ptr::copy_nonoverlapping(
            results_bytes.as_ptr(),
            results as *mut u8,
            results_bytes.len(),
        );
        *results.add(results_bytes.len()) = 0; // Null terminate
    }

    0
}

#[no_mangle]
pub unsafe extern "C" fn eip_execute_batch(
    client_id: c_int,
    operations: *const c_char,
    operation_count: c_int,
    results: *mut c_char,
    results_capacity: c_int,
) -> c_int {
    if operations.is_null() || results.is_null() || operation_count <= 0 {
        return -1;
    }

    let mut clients = FFI_CLIENTS.lock().unwrap();
    let _client = match clients.get_mut(&client_id) {
        Some(client) => client,
        None => return -1,
    };

    // Parse input (simplified implementation)
    let _input_str = unsafe {
        match CStr::from_ptr(operations).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    // For now, return not implemented
    // TODO: Parse input and execute mixed batch operations
    let results_data = "ERROR:Mixed batch operations not yet implemented in FFI";
    let results_bytes = results_data.as_bytes();

    if results_bytes.len() >= results_capacity as usize {
        return -1;
    }

    unsafe {
        std::ptr::copy_nonoverlapping(
            results_bytes.as_ptr(),
            results as *mut u8,
            results_bytes.len(),
        );
        *results.add(results_bytes.len()) = 0; // Null terminate
    }

    0
}

#[no_mangle]
pub unsafe extern "C" fn eip_configure_batch_operations(
    _client_id: c_int,
    _config: *const u8,
) -> c_int {
    0 // Return success for now
}

#[no_mangle]
pub unsafe extern "C" fn eip_get_batch_config(_client_id: c_int, _config: *mut u8) -> c_int {
    -1 // Not implemented yet
}
