use std::ffi::CStr;
use rust_ethernet_ip::{EipClient, PlcValue};
use tokio::runtime::Runtime;
use lazy_static::lazy_static;

lazy_static! {
    static ref RUNTIME: Runtime = Runtime::new().unwrap();
}

#[no_mangle]
pub extern "C" fn read_dint(tag_name: *const i8) -> i32 {
    let tag_name = unsafe {
        match CStr::from_ptr(tag_name).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let mut client = match RUNTIME.block_on(EipClient::connect("192.168.0.1:44818")) {
        Ok(c) => c,
        Err(_) => return 0,
    };

    match RUNTIME.block_on(client.read_tag(tag_name)) {
        Ok(PlcValue::Dint(value)) => value,
        _ => 0,
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

    let mut client = match RUNTIME.block_on(EipClient::connect("192.168.0.1:44818")) {
        Ok(c) => c,
        Err(_) => return false,
    };

    match RUNTIME.block_on(client.write_tag(tag_name, PlcValue::Dint(value))) {
        Ok(_) => true,
        Err(_) => false,
    }
} 