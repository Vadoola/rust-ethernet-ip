import pytest
from rust_ethernet_ip import PyEipClient as Connection, PyPlcValue as PlcValue

def test_connection_creation():
    connection = Connection("192.168.0.1:44818")
    assert connection is not None

def test_plc_value():
    value = PlcValue(42)
    assert value.value == 42

@pytest.mark.skip(reason="Requires actual PLC connection")
def test_read_write_tag():
    connection = Connection("192.168.0.1:44818")
    value = PlcValue(42)
    connection.write_tag("TestTag", value)
    result = connection.read_tag("TestTag")
    assert result.value == 42 