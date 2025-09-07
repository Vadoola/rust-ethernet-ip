#![allow(non_local_definitions)]

use crate::{EipClient, PlcValue, SubscriptionOptions};
use pyo3::prelude::*;
use pyo3::types::{PyDict, PyTuple};
use pyo3::IntoPyObjectExt;
use std::collections::HashMap;
use tokio::runtime::Runtime;

/// Python module for rust_ethernet_ip
#[pymodule]
fn rust_ethernet_ip(_py: Python<'_>, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<PyEipClient>()?;
    m.add_class::<PyPlcValue>()?;
    m.add_class::<PySubscriptionOptions>()?;
    Ok(())
}

/// Python wrapper for EipClient
#[pyclass]
struct PyEipClient {
    client: EipClient,
    runtime: Runtime,
}

// Newtype for (String, PyPlcValue)
struct TagValueArg {
    name: String,
    value: PyPlcValue,
}

impl<'a> FromPyObject<'a> for TagValueArg {
    fn extract_bound(ob: &Bound<'a, PyAny>) -> PyResult<Self> {
        let tuple = ob.downcast::<PyTuple>()?;
        if tuple.len() != 2 {
            return Err(PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                "Expected tuple of length 2",
            ));
        }
        let name = tuple.get_item(0)?.extract::<String>()?;
        let value = tuple.get_item(1)?.extract::<PyPlcValue>()?;
        Ok(TagValueArg { name, value })
    }
}

// Newtype for (String, PySubscriptionOptions)
struct TagSubOptArg {
    name: String,
    options: PySubscriptionOptions,
}

impl<'a> FromPyObject<'a> for TagSubOptArg {
    fn extract_bound(ob: &Bound<'a, PyAny>) -> PyResult<Self> {
        let tuple = ob.downcast::<PyTuple>()?;
        if tuple.len() != 2 {
            return Err(PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                "Expected tuple of length 2",
            ));
        }
        let name = tuple.get_item(0)?.extract::<String>()?;
        let options = tuple.get_item(1)?.extract::<PySubscriptionOptions>()?;
        Ok(TagSubOptArg { name, options })
    }
}

#[pymethods]
impl PyEipClient {
    /// Create a new EipClient instance
    #[new]
    fn new(addr: &str) -> PyResult<Self> {
        let runtime = Runtime::new().unwrap();
        let client = runtime
            .block_on(async { EipClient::connect(addr).await })
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;

        Ok(PyEipClient { client, runtime })
    }

    /// Read a tag value
    fn read_tag(&mut self, tag_name: &str) -> PyResult<PyPlcValue> {
        let value = self
            .runtime
            .block_on(async { self.client.read_tag(tag_name).await })
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;

        Ok(PyPlcValue { value })
    }

    /// Write a value to a tag
    fn write_tag(&mut self, tag_name: &str, value: &PyPlcValue) -> PyResult<bool> {
        let result = self
            .runtime
            .block_on(async { self.client.write_tag(tag_name, value.value.clone()).await });
        match result {
            Ok(_) => Ok(true),
            Err(e) => Err(PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(
                e.to_string(),
            )),
        }
    }

    /// Read multiple tags in batch
    fn read_tags_batch(&mut self, tag_names: Vec<String>) -> PyResult<Vec<(String, Py<PyAny>)>> {
        Python::attach(|py| {
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let results = runtime
                .block_on(async {
                    self.client
                        .read_tags_batch(&tag_names.iter().map(|s| s.as_str()).collect::<Vec<_>>())
                        .await
                })
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
            let mut results_vec = Vec::new();
            for (name, result) in results {
                let obj = match result {
                    Ok(v) => PyPlcValue { value: v }.into_bound_py_any(py)?,
                    Err(e) => PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string())
                        .into_bound_py_any(py)?,
                };
                results_vec.push((name, obj.unbind()));
            }
            Ok(results_vec)
        })
    }

    /// Write multiple tags in batch
    fn write_tags_batch(
        &mut self,
        tag_values: Vec<TagValueArg>,
    ) -> PyResult<Vec<(String, Py<PyAny>)>> {
        Python::attach(|py| {
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let results = runtime
                .block_on(async {
                    self.client
                        .write_tags_batch(
                            &tag_values
                                .iter()
                                .map(|arg| (arg.name.as_str(), arg.value.value.clone()))
                                .collect::<Vec<_>>(),
                        )
                        .await
                })
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
            let mut results_vec = Vec::new();
            for (name, result) in results {
                let obj = match result {
                    Ok(()) => py.None().into_bound_py_any(py)?,
                    Err(e) => PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string())
                        .into_bound_py_any(py)?,
                };
                results_vec.push((name, obj.unbind()));
            }
            Ok(results_vec)
        })
    }

    /// Subscribe to a tag
    fn subscribe_to_tag(&self, tag_path: &str, options: &PySubscriptionOptions) -> PyResult<()> {
        self.runtime
            .block_on(async {
                self.client
                    .subscribe_to_tag(tag_path, options.options.clone())
                    .await
            })
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;

        Ok(())
    }

    /// Subscribe to multiple tags
    fn subscribe_to_tags(&self, tags: Vec<TagSubOptArg>) -> PyResult<()> {
        self.runtime
            .block_on(async {
                self.client
                    .subscribe_to_tags(
                        &tags
                            .iter()
                            .map(|arg| (arg.name.as_str(), arg.options.options.clone()))
                            .collect::<Vec<_>>(),
                    )
                    .await
            })
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        Ok(())
    }

    /// Unregister the session
    fn unregister_session(&mut self) -> PyResult<()> {
        self.runtime
            .block_on(async { self.client.unregister_session().await })
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;

        Ok(())
    }
}

/// Python wrapper for PlcValue
#[pyclass]
struct PyPlcValue {
    value: PlcValue,
}

impl FromPyObject<'_> for PyPlcValue {
    fn extract_bound(ob: &Bound<'_, PyAny>) -> PyResult<Self> {
        if let Ok(bool_val) = ob.extract::<bool>() {
            Ok(PyPlcValue {
                value: PlcValue::Bool(bool_val),
            })
        } else if let Ok(int_val) = ob.extract::<i32>() {
            Ok(PyPlcValue {
                value: PlcValue::Dint(int_val),
            })
        } else if let Ok(float_val) = ob.extract::<f64>() {
            Ok(PyPlcValue {
                value: PlcValue::Lreal(float_val),
            })
        } else if let Ok(string_val) = ob.extract::<String>() {
            Ok(PyPlcValue {
                value: PlcValue::String(string_val),
            })
        } else if let Ok(dict) = ob.downcast::<PyDict>() {
            let mut map = HashMap::new();
            for (key, value) in dict.iter() {
                let key = key.extract::<String>()?;
                let value = value.extract::<PyPlcValue>()?.value;
                map.insert(key, value);
            }
            Ok(PyPlcValue {
                value: PlcValue::Udt(map),
            })
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                "Unsupported value type",
            ))
        }
    }
}

#[pymethods]
impl PyPlcValue {
    #[new]
    fn new(value: Py<PyAny>) -> PyResult<Self> {
        Python::attach(|py| {
            let bound_value = value.bind(py);
            if let Ok(val) = bound_value.extract::<bool>() {
                Ok(PyPlcValue {
                    value: PlcValue::Bool(val),
                })
            } else if let Ok(val) = bound_value.extract::<i32>() {
                Ok(PyPlcValue {
                    value: PlcValue::Dint(val),
                })
            } else if let Ok(val) = bound_value.extract::<f32>() {
                Ok(PyPlcValue {
                    value: PlcValue::Real(val),
                })
            } else if let Ok(val) = bound_value.extract::<f64>() {
                Ok(PyPlcValue {
                    value: PlcValue::Real(val as f32),
                })
            } else if let Ok(val) = bound_value.extract::<String>() {
                Ok(PyPlcValue {
                    value: PlcValue::String(val),
                })
            } else {
                Err(PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                    "Unsupported value type",
                ))
            }
        })
    }

    #[staticmethod]
    fn real(val: f32) -> Self {
        PyPlcValue {
            value: PlcValue::Real(val),
        }
    }
    #[staticmethod]
    fn lreal(val: f64) -> Self {
        PyPlcValue {
            value: PlcValue::Lreal(val),
        }
    }
    #[staticmethod]
    fn dint(val: i32) -> Self {
        PyPlcValue {
            value: PlcValue::Dint(val),
        }
    }
    #[staticmethod]
    fn lint(val: i64) -> Self {
        PyPlcValue {
            value: PlcValue::Lint(val),
        }
    }
    #[staticmethod]
    fn string(val: String) -> Self {
        PyPlcValue {
            value: PlcValue::String(val),
        }
    }

    #[getter]
    fn value(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        match &self.value {
            PlcValue::Bool(b) => Ok(b.into_bound_py_any(py)?.unbind()),
            PlcValue::Sint(i) => Ok(i.into_bound_py_any(py)?.unbind()),
            PlcValue::Int(i) => Ok(i.into_bound_py_any(py)?.unbind()),
            PlcValue::Dint(i) => Ok(i.into_bound_py_any(py)?.unbind()),
            PlcValue::Lint(i) => Ok(i.into_bound_py_any(py)?.unbind()),
            PlcValue::Usint(u) => Ok(u.into_bound_py_any(py)?.unbind()),
            PlcValue::Uint(u) => Ok(u.into_bound_py_any(py)?.unbind()),
            PlcValue::Udint(u) => Ok(u.into_bound_py_any(py)?.unbind()),
            PlcValue::Ulint(u) => Ok(u.into_bound_py_any(py)?.unbind()),
            PlcValue::Real(f) => Ok(f.into_bound_py_any(py)?.unbind()),
            PlcValue::Lreal(f) => Ok(f.into_bound_py_any(py)?.unbind()),
            PlcValue::String(s) => Ok(s.into_bound_py_any(py)?.unbind()),
            PlcValue::Udt(map) => {
                let dict = PyDict::new(py);
                for (k, v) in map.iter() {
                    let v_py = PyPlcValue { value: v.clone() }.value(py)?;
                    dict.set_item(k, v_py)?;
                }
                Ok(dict.unbind().into())
            }
        }
    }

    fn __str__(&self) -> String {
        format!("{:?}", self.value)
    }

    fn __repr__(&self) -> String {
        format!("PyPlcValue({:?})", self.value)
    }
}

/// Python wrapper for SubscriptionOptions
#[pyclass]
struct PySubscriptionOptions {
    options: SubscriptionOptions,
}

impl FromPyObject<'_> for PySubscriptionOptions {
    fn extract_bound(ob: &Bound<'_, PyAny>) -> PyResult<Self> {
        let update_rate = ob.getattr("update_rate")?.extract::<u32>()?;
        let change_threshold = ob.getattr("change_threshold")?.extract::<f32>()?;
        let timeout = ob.getattr("timeout")?.extract::<u32>()?;

        Ok(PySubscriptionOptions {
            options: SubscriptionOptions {
                update_rate,
                change_threshold,
                timeout,
            },
        })
    }
}

#[pymethods]
impl PySubscriptionOptions {
    #[new]
    fn new(update_rate: u32, change_threshold: f32, timeout: u32) -> PyResult<Self> {
        let options = SubscriptionOptions {
            update_rate,
            change_threshold,
            timeout,
        };

        Ok(PySubscriptionOptions { options })
    }

    /// Get the update rate in milliseconds
    #[getter]
    fn update_rate(&self) -> u32 {
        self.options.update_rate
    }

    /// Get the change threshold for numeric values
    #[getter]
    fn change_threshold(&self) -> f32 {
        self.options.change_threshold
    }

    /// Get the timeout in milliseconds
    #[getter]
    fn timeout(&self) -> u32 {
        self.options.timeout
    }
}
