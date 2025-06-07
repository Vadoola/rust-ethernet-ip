use std::ffi::CStr;
use rust_ethernet_ip::EipClient;

#[no_mangle]
pub extern "C" fn read_dint(tag_name: *const i8) -> i32 {
    let tag_name = unsafe {
        match CStr::from_ptr(tag_name).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let client = match EipClient::connect("192.168.0.1:44818") {
        Ok(c) => c,
        Err(_) => return 0,
    };

    match client.read_dint(tag_name) {
        Ok(value) => value,
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "C" fn write_dint(tag_name: *const i8, value: i32) -> bool {
    let tag_name = unsafe {
        match CStr::from_ptr(tag_name).to_str() {
            Ok(s) => s,
            Err(_) => return false,
        }
    };

    let client = match EipClient::connect("192.168.0.1:44818") {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.write_dint(tag_name, value) {
        Ok(_) => true,
        Err(_) => false,
    }
} 