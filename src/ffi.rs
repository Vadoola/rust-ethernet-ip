use std::ffi::{CStr, CString, c_char, c_int};
use std::ptr;
use crate::{EipClient, PlcValue, RUNTIME, CLIENTS, NEXT_ID};

/// Connect to a PLC and return a client ID
#[no_mangle]
pub extern "C" fn eip_connect(address: *const c_char) -> c_int {
    if address.is_null() {
        return -1;
    }
    
    let address_str = match unsafe { CStr::from_ptr(address) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    // Use the global runtime to handle the async connection
    match RUNTIME.block_on(EipClient::connect(address_str)) {
        Ok(client) => {
            // Generate new client ID
            let client_id = {
                let mut next_id = NEXT_ID.lock().unwrap();
                let id = *next_id;
                *next_id += 1;
                id
            };
            
            // Store the client
            {
                let mut clients = CLIENTS.lock().unwrap();
                clients.insert(client_id, client);
            }
            
            client_id
        }
        Err(_) => -1,
    }
}

/// Disconnect from a PLC
#[no_mangle]
pub extern "C" fn eip_disconnect(client_id: c_int) -> c_int {
    let mut clients = CLIENTS.lock().unwrap();
    match clients.remove(&client_id) {
        Some(_) => 0, // Success
        None => -1,   // Client not found
    }
}

/// Read a boolean tag
#[no_mangle]
pub extern "C" fn eip_read_bool(client_id: c_int, tag_name: *const c_char, result: *mut c_int) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.read_tag(tag_name_str)) {
                Ok(PlcValue::Bool(value)) => {
                    unsafe { *result = if value { 1 } else { 0 }; }
                    0
                }
                _ => -1,
            }
        }
        None => -1,
    }
}

/// Write a boolean tag
#[no_mangle]
pub extern "C" fn eip_write_bool(client_id: c_int, tag_name: *const c_char, value: c_int) -> c_int {
    if tag_name.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
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

/// Read a DINT tag
#[no_mangle]
pub extern "C" fn eip_read_dint(client_id: c_int, tag_name: *const c_char, result: *mut c_int) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.read_tag(tag_name_str)) {
                Ok(PlcValue::Dint(value)) => {
                    unsafe { *result = value; }
                    0
                }
                _ => -1,
            }
        }
        None => -1,
    }
}

/// Write a DINT tag
#[no_mangle]
pub extern "C" fn eip_write_dint(client_id: c_int, tag_name: *const c_char, value: c_int) -> c_int {
    if tag_name.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
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

/// Read a REAL tag
#[no_mangle]
pub extern "C" fn eip_read_real(client_id: c_int, tag_name: *const c_char, result: *mut f64) -> c_int {
    if tag_name.is_null() || result.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.read_tag(tag_name_str)) {
                Ok(PlcValue::Real(value)) => {
                    unsafe { *result = value as f64; }
                    0
                }
                _ => -1,
            }
        }
        None => -1,
    }
}

/// Write a REAL tag
#[no_mangle]
pub extern "C" fn eip_write_real(client_id: c_int, tag_name: *const c_char, value: f64) -> c_int {
    if tag_name.is_null() {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
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

/// Read a STRING tag
#[no_mangle]
pub extern "C" fn eip_read_string(client_id: c_int, tag_name: *const c_char, result: *mut c_char, max_length: c_int) -> c_int {
    if tag_name.is_null() || result.is_null() || max_length <= 0 {
        return -1;
    }
    
    let tag_name_str = match unsafe { CStr::from_ptr(tag_name) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    
    let mut clients = CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.read_tag(tag_name_str)) {
                Ok(PlcValue::String(value)) => {
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
                _ => -1,
            }
        }
        None => -1,
    }
}

/// Write a STRING tag
#[no_mangle]
pub extern "C" fn eip_write_string(client_id: c_int, tag_name: *const c_char, value: *const c_char) -> c_int {
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
    
    let mut clients = CLIENTS.lock().unwrap();
    match clients.get_mut(&client_id) {
        Some(client) => {
            match RUNTIME.block_on(client.write_tag(tag_name_str, PlcValue::String(value_str.to_string()))) {
                Ok(_) => 0,
                Err(_) => -1,
            }
        }
        None => -1,
    }
} 