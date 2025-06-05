package ethernetip

/*
#cgo LDFLAGS: -L../target/release -lrust_ethernet_ip
#include <stdlib.h>
#include <string.h>

// C function declarations for the Rust library
extern int eip_connect(const char* ip_address);
extern int eip_disconnect(int client_id);

// Boolean operations
extern int eip_read_bool(int client_id, const char* tag_name, int* result);
extern int eip_write_bool(int client_id, const char* tag_name, int value);

// Integer operations
extern int eip_read_sint(int client_id, const char* tag_name, signed char* result);
extern int eip_write_sint(int client_id, const char* tag_name, signed char value);
extern int eip_read_int(int client_id, const char* tag_name, short* result);
extern int eip_write_int(int client_id, const char* tag_name, short value);
extern int eip_read_dint(int client_id, const char* tag_name, int* result);
extern int eip_write_dint(int client_id, const char* tag_name, int value);
extern int eip_read_lint(int client_id, const char* tag_name, long long* result);
extern int eip_write_lint(int client_id, const char* tag_name, long long value);

// Unsigned integer operations
extern int eip_read_usint(int client_id, const char* tag_name, unsigned char* result);
extern int eip_write_usint(int client_id, const char* tag_name, unsigned char value);
extern int eip_read_uint(int client_id, const char* tag_name, unsigned short* result);
extern int eip_write_uint(int client_id, const char* tag_name, unsigned short value);
extern int eip_read_udint(int client_id, const char* tag_name, unsigned int* result);
extern int eip_write_udint(int client_id, const char* tag_name, unsigned int value);
extern int eip_read_ulint(int client_id, const char* tag_name, unsigned long long* result);
extern int eip_write_ulint(int client_id, const char* tag_name, unsigned long long value);

// Float operations
extern int eip_read_real(int client_id, const char* tag_name, double* result);
extern int eip_write_real(int client_id, const char* tag_name, double value);
extern int eip_read_lreal(int client_id, const char* tag_name, double* result);
extern int eip_write_lreal(int client_id, const char* tag_name, double value);

// String operations
extern int eip_read_string(int client_id, const char* tag_name, char* result, int max_length);
extern int eip_write_string(int client_id, const char* tag_name, const char* value);

// Batch operations
extern int eip_read_tags_batch(int client_id, char** tag_names, int tag_count, char* results, int results_capacity);
extern int eip_write_tags_batch(int client_id, const char* tag_values, int tag_count, char* results, int results_capacity);
extern int eip_execute_batch(int client_id, const char* operations, int operation_count, char* results, int results_capacity);

// Health check
extern int eip_check_health(int client_id, int* is_healthy);
extern int eip_check_health_detailed(int client_id, int* is_healthy);

// Configuration
extern int eip_set_max_packet_size(int client_id, int size);
*/
import "C"
import (
	"errors"
	"fmt"
	"unsafe"
)

// PlcDataType represents different PLC data types
type PlcDataType int

const (
	Bool PlcDataType = iota
	Sint
	Int
	Dint
	Lint
	Usint
	Uint
	Udint
	Ulint
	Real
	Lreal
	String
)

// PlcValue represents a value that can be read from or written to the PLC
type PlcValue struct {
	Type  PlcDataType
	Value interface{}
}

// EipClient represents a connection to an EtherNet/IP PLC
type EipClient struct {
	clientID int
	ipAddr   string
}

// EipError represents errors from the EtherNet/IP library
type EipError struct {
	Code    int
	Message string
}

func (e *EipError) Error() string {
	return fmt.Sprintf("EIP Error %d: %s", e.Code, e.Message)
}

// NewClient creates a new EtherNet/IP client connection
func NewClient(ipAddress string) (*EipClient, error) {
	cIPAddress := C.CString(ipAddress)
	defer C.free(unsafe.Pointer(cIPAddress))

	clientID := int(C.eip_connect(cIPAddress))
	if clientID < 0 {
		return nil, &EipError{
			Code:    int(clientID),
			Message: fmt.Sprintf("Failed to connect to PLC at %s", ipAddress),
		}
	}

	return &EipClient{
		clientID: clientID,
		ipAddr:   ipAddress,
	}, nil
}

// Close disconnects from the PLC
func (c *EipClient) Close() error {
	result := int(C.eip_disconnect(C.int(c.clientID)))
	if result != 0 {
		return &EipError{
			Code:    result,
			Message: "Failed to disconnect from PLC",
		}
	}
	return nil
}

// GetClientID returns the internal client ID
func (c *EipClient) GetClientID() int {
	return c.clientID
}

// GetIPAddress returns the IP address of the connected PLC
func (c *EipClient) GetIPAddress() string {
	return c.ipAddr
}

// ReadBool reads a boolean value from the PLC
func (c *EipClient) ReadBool(tagName string) (bool, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.int
	retCode := int(C.eip_read_bool(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return false, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read boolean tag %s", tagName),
		}
	}

	return result != 0, nil
}

// WriteBool writes a boolean value to the PLC
func (c *EipClient) WriteBool(tagName string, value bool) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var cValue C.int
	if value {
		cValue = 1
	} else {
		cValue = 0
	}

	retCode := int(C.eip_write_bool(C.int(c.clientID), cTagName, cValue))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write boolean tag %s", tagName),
		}
	}

	return nil
}

// ReadSint reads a signed 8-bit integer from the PLC
func (c *EipClient) ReadSint(tagName string) (int8, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.schar
	retCode := int(C.eip_read_sint(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return 0, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read SINT tag %s", tagName),
		}
	}

	return int8(result), nil
}

// WriteSint writes a signed 8-bit integer to the PLC
func (c *EipClient) WriteSint(tagName string, value int8) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	retCode := int(C.eip_write_sint(C.int(c.clientID), cTagName, C.schar(value)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write SINT tag %s", tagName),
		}
	}

	return nil
}

// ReadInt reads a 16-bit integer from the PLC
func (c *EipClient) ReadInt(tagName string) (int16, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.short
	retCode := int(C.eip_read_int(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return 0, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read INT tag %s", tagName),
		}
	}

	return int16(result), nil
}

// WriteInt writes a 16-bit integer to the PLC
func (c *EipClient) WriteInt(tagName string, value int16) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	retCode := int(C.eip_write_int(C.int(c.clientID), cTagName, C.short(value)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write INT tag %s", tagName),
		}
	}

	return nil
}

// ReadDint reads a 32-bit integer from the PLC
func (c *EipClient) ReadDint(tagName string) (int32, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.int
	retCode := int(C.eip_read_dint(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return 0, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read DINT tag %s", tagName),
		}
	}

	return int32(result), nil
}

// WriteDint writes a 32-bit integer to the PLC
func (c *EipClient) WriteDint(tagName string, value int32) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	retCode := int(C.eip_write_dint(C.int(c.clientID), cTagName, C.int(value)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write DINT tag %s", tagName),
		}
	}

	return nil
}

// ReadLint reads a 64-bit integer from the PLC
func (c *EipClient) ReadLint(tagName string) (int64, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.longlong
	retCode := int(C.eip_read_lint(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return 0, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read LINT tag %s", tagName),
		}
	}

	return int64(result), nil
}

// WriteLint writes a 64-bit integer to the PLC
func (c *EipClient) WriteLint(tagName string, value int64) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	retCode := int(C.eip_write_lint(C.int(c.clientID), cTagName, C.longlong(value)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write LINT tag %s", tagName),
		}
	}

	return nil
}

// ReadReal reads a 32-bit float from the PLC
func (c *EipClient) ReadReal(tagName string) (float64, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var result C.double
	retCode := int(C.eip_read_real(C.int(c.clientID), cTagName, &result))
	if retCode != 0 {
		return 0, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read REAL tag %s", tagName),
		}
	}

	return float64(result), nil
}

// WriteReal writes a 32-bit float to the PLC
func (c *EipClient) WriteReal(tagName string, value float64) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	retCode := int(C.eip_write_real(C.int(c.clientID), cTagName, C.double(value)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write REAL tag %s", tagName),
		}
	}

	return nil
}

// ReadString reads a string from the PLC
func (c *EipClient) ReadString(tagName string) (string, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	const maxStringLength = 1024
	cResult := C.malloc(C.size_t(maxStringLength))
	defer C.free(cResult)

	retCode := int(C.eip_read_string(C.int(c.clientID), cTagName, (*C.char)(cResult), C.int(maxStringLength)))
	if retCode != 0 {
		return "", &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read STRING tag %s", tagName),
		}
	}

	return C.GoString((*C.char)(cResult)), nil
}

// WriteString writes a string to the PLC
func (c *EipClient) WriteString(tagName string, value string) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	cValue := C.CString(value)
	defer C.free(unsafe.Pointer(cValue))

	retCode := int(C.eip_write_string(C.int(c.clientID), cTagName, cValue))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write STRING tag %s", tagName),
		}
	}

	return nil
}

// CheckHealth checks if the PLC connection is healthy
func (c *EipClient) CheckHealth() (bool, error) {
	var isHealthy C.int
	retCode := int(C.eip_check_health(C.int(c.clientID), &isHealthy))
	if retCode != 0 {
		return false, &EipError{
			Code:    retCode,
			Message: "Failed to check PLC health",
		}
	}

	return isHealthy != 0, nil
}

// SetMaxPacketSize sets the maximum packet size for communications
func (c *EipClient) SetMaxPacketSize(size int) error {
	retCode := int(C.eip_set_max_packet_size(C.int(c.clientID), C.int(size)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: "Failed to set max packet size",
		}
	}

	return nil
}

// ReadValue reads a value with automatic type detection
func (c *EipClient) ReadValue(tagName string, dataType PlcDataType) (*PlcValue, error) {
	switch dataType {
	case Bool:
		value, err := c.ReadBool(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Bool, Value: value}, nil
	case Sint:
		value, err := c.ReadSint(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Sint, Value: value}, nil
	case Int:
		value, err := c.ReadInt(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Int, Value: value}, nil
	case Dint:
		value, err := c.ReadDint(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Dint, Value: value}, nil
	case Lint:
		value, err := c.ReadLint(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Lint, Value: value}, nil
	case Real:
		value, err := c.ReadReal(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: Real, Value: value}, nil
	case String:
		value, err := c.ReadString(tagName)
		if err != nil {
			return nil, err
		}
		return &PlcValue{Type: String, Value: value}, nil
	default:
		return nil, errors.New("unsupported data type")
	}
}

// WriteValue writes a value with automatic type handling
func (c *EipClient) WriteValue(tagName string, value *PlcValue) error {
	switch value.Type {
	case Bool:
		if boolVal, ok := value.Value.(bool); ok {
			return c.WriteBool(tagName, boolVal)
		}
		return errors.New("invalid boolean value")
	case Sint:
		if sintVal, ok := value.Value.(int8); ok {
			return c.WriteSint(tagName, sintVal)
		}
		return errors.New("invalid SINT value")
	case Int:
		if intVal, ok := value.Value.(int16); ok {
			return c.WriteInt(tagName, intVal)
		}
		return errors.New("invalid INT value")
	case Dint:
		if dintVal, ok := value.Value.(int32); ok {
			return c.WriteDint(tagName, dintVal)
		}
		return errors.New("invalid DINT value")
	case Lint:
		if lintVal, ok := value.Value.(int64); ok {
			return c.WriteLint(tagName, lintVal)
		}
		return errors.New("invalid LINT value")
	case Real:
		if realVal, ok := value.Value.(float64); ok {
			return c.WriteReal(tagName, realVal)
		}
		return errors.New("invalid REAL value")
	case String:
		if stringVal, ok := value.Value.(string); ok {
			return c.WriteString(tagName, stringVal)
		}
		return errors.New("invalid STRING value")
	default:
		return errors.New("unsupported data type")
	}
}
