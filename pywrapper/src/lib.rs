use pyo3::prelude::*;
use rust_ethernet_ip::{EipClient, PlcValue};
use tokio::runtime::Runtime;

#[pyclass]
pub struct PyEipClient {
    client: Option<EipClient>,
    rt: Runtime,
}

#[pymethods]
impl PyEipClient {
    #[new]
    pub fn new() -> Self {
        Self {
            client: None,
            rt: Runtime::new().unwrap(),
        }
    }

    pub fn connect(&mut self, address: &str) -> PyResult<bool> {
        let client = self.rt.block_on(EipClient::connect(address));
        match client {
            Ok(c) => {
                self.client = Some(c);
                Ok(true)
            },
            Err(e) => Err(pyo3::exceptions::PyRuntimeError::new_err(e.to_string())),
        }
    }

    pub fn read_dint(&mut self, tag: &str) -> PyResult<i32> {
        let client = self.client.as_mut().ok_or_else(|| pyo3::exceptions::PyRuntimeError::new_err("Not connected"))?;
        let value = self.rt.block_on(client.read_tag(tag));
        match value {
            Ok(PlcValue::Dint(v)) => Ok(v),
            Ok(_) => Err(pyo3::exceptions::PyTypeError::new_err("Tag is not a DINT")),
            Err(e) => Err(pyo3::exceptions::PyRuntimeError::new_err(e.to_string())),
        }
    }

    pub fn write_dint(&mut self, tag: &str, value: i32) -> PyResult<()> {
        let client = self.client.as_mut().ok_or_else(|| pyo3::exceptions::PyRuntimeError::new_err("Not connected"))?;
        let result = self.rt.block_on(client.write_tag(tag, PlcValue::Dint(value)));
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(pyo3::exceptions::PyRuntimeError::new_err(e.to_string())),
        }
    }
}

#[pymodule]
fn _rust_ethernet_ip(_py: Python<'_>, m: &PyModule) -> PyResult<()> {
    m.add_class::<PyEipClient>()?;
    Ok(())
} 