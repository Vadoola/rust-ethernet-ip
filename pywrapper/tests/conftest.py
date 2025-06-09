import pytest
from rust_ethernet_ip import PyEipClient, PyPlcValue

@pytest.fixture
def connection():
    return PyEipClient("192.168.0.1:44818")

@pytest.fixture
def value():
    return PyPlcValue(42) 