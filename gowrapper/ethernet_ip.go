package ethernetip

/*
#cgo windows LDFLAGS: -L${SRCDIR} -lrust_ethernet_ip
#cgo windows CFLAGS: -I${SRCDIR}
#cgo windows LDFLAGS: -Wl,--allow-multiple-definition
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

// UDT operations
extern int eip_read_udt(int client_id, const char* tag_name, char* result, int max_size);
extern int eip_write_udt(int client_id, const char* tag_name, const char* value, int size);

// Tag management
extern int eip_discover_tags(int client_id);
extern int eip_get_tag_metadata(int client_id, const char* tag_name, void* metadata);

// Batch operations
extern int eip_read_tags_batch(int client_id, char** tag_names, int tag_count, char* results, int results_capacity);
extern int eip_write_tags_batch(int client_id, const char* tag_values, int tag_count, char* results, int results_capacity);
extern int eip_execute_batch(int client_id, const char* operations, int operation_count, char* results, int results_capacity);
extern int eip_configure_batch_operations(int client_id, void* config);
extern int eip_get_batch_config(int client_id, void* config);

// Health check
extern int eip_check_health(int client_id, int* is_healthy);
extern int eip_check_health_detailed(int client_id, int* is_healthy, char* details, int details_capacity);

// Configuration
extern int eip_set_max_packet_size(int client_id, int size);
*/
import "C"
import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
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
	Udt
)

// TagMetadata represents metadata for a PLC tag
type TagMetadata struct {
	DataType       int `json:"data_type"`       // CIP data type code
	Scope          int `json:"scope"`           // Tag scope (global, program, etc.)
	ArrayDimension int `json:"array_dimension"` // Number of array dimensions
	ArraySize      int `json:"array_size"`      // Total array size
}

// BatchConfig represents configuration for batch operations
type BatchConfig struct {
	MaxOperationsPerPacket int   `json:"max_operations_per_packet"`
	MaxPacketSize          int   `json:"max_packet_size"`
	PacketTimeoutMs        int64 `json:"packet_timeout_ms"`
	ContinueOnError        bool  `json:"continue_on_error"`
	OptimizePacketPacking  bool  `json:"optimize_packet_packing"`
}

// BatchOperation represents a single operation in a batch
type BatchOperation struct {
	TagName  string      `json:"tag_name"`
	IsWrite  bool        `json:"is_write"`
	DataType PlcDataType `json:"data_type"`
	Value    interface{} `json:"value,omitempty"`
}

// BatchOperationResult represents the result of a batch operation
type BatchOperationResult struct {
	TagName         string      `json:"tag_name"`
	IsWrite         bool        `json:"is_write"`
	Success         bool        `json:"success"`
	ExecutionTimeUs int64       `json:"execution_time_us"`
	ErrorCode       int         `json:"error_code"`
	ErrorMessage    string      `json:"error_message,omitempty"`
	DataType        PlcDataType `json:"data_type,omitempty"`
	Value           interface{} `json:"value,omitempty"`
}

// UdtValue represents a UDT (User Defined Type) value
type UdtValue struct {
	Members map[string]interface{} `json:"members"`
}

// PlcValue represents a value that can be read from or written to the PLC
type PlcValue struct {
	Type  PlcDataType
	Value interface{}
}

// PlcValueResult is used for async operations
// Value is the tag value, Err is any error encountered
// Type is the PlcDataType
// Tag is the tag name
type PlcValueResult struct {
	Tag   string
	Type  PlcDataType
	Value interface{}
	Err   error
}

// EipClient represents a connection to an EtherNet/IP PLC
type EipClient struct {
	clientID int
	ipAddr   string

	// Tag subscription fields
	subscriptions map[string]chan struct{}
	subMutex      sync.Mutex

	// Tag metadata cache
	tagCache   map[string]*TagMetadata
	tagCacheMu sync.RWMutex
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
		clientID:      clientID,
		ipAddr:        ipAddress,
		subscriptions: make(map[string]chan struct{}),
		tagCache:      make(map[string]*TagMetadata),
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

// ReadUdt reads a UDT (User Defined Type) from the PLC
func (c *EipClient) ReadUdt(tagName string) (*UdtValue, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	const maxUdtSize = 4096
	cResult := C.malloc(C.size_t(maxUdtSize))
	defer C.free(cResult)

	retCode := int(C.eip_read_udt(C.int(c.clientID), cTagName, (*C.char)(cResult), C.int(maxUdtSize)))
	if retCode != 0 {
		return nil, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to read UDT tag %s", tagName),
		}
	}

	// Parse the JSON result into UdtValue
	var udtValue UdtValue
	err := json.Unmarshal([]byte(C.GoString((*C.char)(cResult))), &udtValue)
	if err != nil {
		return nil, fmt.Errorf("failed to parse UDT value: %v", err)
	}

	return &udtValue, nil
}

// WriteUdt writes a UDT (User Defined Type) to the PLC
func (c *EipClient) WriteUdt(tagName string, value *UdtValue) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	// Convert UdtValue to JSON
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal UDT value: %v", err)
	}

	cValue := C.CString(string(jsonData))
	defer C.free(unsafe.Pointer(cValue))

	retCode := int(C.eip_write_udt(C.int(c.clientID), cTagName, cValue, C.int(len(jsonData))))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to write UDT tag %s", tagName),
		}
	}

	return nil
}

// DiscoverTags discovers all tags in the PLC
func (c *EipClient) DiscoverTags() error {
	retCode := int(C.eip_discover_tags(C.int(c.clientID)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: "Failed to discover tags from PLC",
		}
	}
	return nil
}

// GetTagMetadata gets metadata for a specific tag
func (c *EipClient) GetTagMetadata(tagName string) (*TagMetadata, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	var metadata TagMetadata
	retCode := int(C.eip_get_tag_metadata(C.int(c.clientID), cTagName, unsafe.Pointer(&metadata)))
	if retCode != 0 {
		return nil, &EipError{
			Code:    retCode,
			Message: fmt.Sprintf("Failed to get metadata for tag %s", tagName),
		}
	}

	return &metadata, nil
}

// CheckHealthDetailed checks if the PLC connection is healthy with detailed information
func (c *EipClient) CheckHealthDetailed() (bool, string, error) {
	var isHealthy C.int
	const maxDetailsSize = 1024
	cDetails := C.malloc(C.size_t(maxDetailsSize))
	defer C.free(cDetails)

	retCode := int(C.eip_check_health_detailed(C.int(c.clientID), &isHealthy, (*C.char)(cDetails), C.int(maxDetailsSize)))
	if retCode != 0 {
		return false, "", &EipError{
			Code:    retCode,
			Message: "Failed to check PLC health",
		}
	}

	return isHealthy != 0, C.GoString((*C.char)(cDetails)), nil
}

// ConfigureBatchOperations configures batch operations
func (c *EipClient) ConfigureBatchOperations(config *BatchConfig) error {
	jsonData, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal batch config: %v", err)
	}

	cConfig := C.CString(string(jsonData))
	defer C.free(unsafe.Pointer(cConfig))

	retCode := int(C.eip_configure_batch_operations(C.int(c.clientID), unsafe.Pointer(cConfig)))
	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: "Failed to configure batch operations",
		}
	}

	return nil
}

// GetBatchConfig gets the current batch configuration
func (c *EipClient) GetBatchConfig() (*BatchConfig, error) {
	const maxConfigSize = 1024
	cConfig := C.malloc(C.size_t(maxConfigSize))
	defer C.free(cConfig)

	retCode := int(C.eip_get_batch_config(C.int(c.clientID), cConfig))
	if retCode != 0 {
		return nil, &EipError{
			Code:    retCode,
			Message: "Failed to get batch configuration",
		}
	}

	var config BatchConfig
	err := json.Unmarshal([]byte(C.GoString((*C.char)(cConfig))), &config)
	if err != nil {
		return nil, fmt.Errorf("failed to parse batch config: %v", err)
	}

	return &config, nil
}

// BatchRead reads multiple tags in a single operation
func (c *EipClient) BatchRead(tagNames []string) (map[string]interface{}, error) {
	if len(tagNames) == 0 {
		return nil, errors.New("no tags specified for batch read")
	}

	// Convert tag names to C strings
	cTagNames := make([]*C.char, len(tagNames))
	for i, name := range tagNames {
		cTagNames[i] = C.CString(name)
		defer C.free(unsafe.Pointer(cTagNames[i]))
	}

	// Allocate memory for results
	const maxResultsSize = 4096
	cResults := C.malloc(C.size_t(maxResultsSize))
	defer C.free(cResults)

	// Call the batch read function
	retCode := int(C.eip_read_tags_batch(
		C.int(c.clientID),
		(**C.char)(unsafe.Pointer(&cTagNames[0])),
		C.int(len(tagNames)),
		(*C.char)(cResults),
		C.int(maxResultsSize),
	))

	if retCode != 0 {
		return nil, &EipError{
			Code:    retCode,
			Message: "Failed to execute batch read",
		}
	}

	// Parse the JSON results
	var results map[string]interface{}
	err := json.Unmarshal([]byte(C.GoString((*C.char)(cResults))), &results)
	if err != nil {
		return nil, fmt.Errorf("failed to parse batch read results: %v", err)
	}

	return results, nil
}

// BatchWrite writes multiple tags in a single operation
func (c *EipClient) BatchWrite(tagValues map[string]interface{}) error {
	if len(tagValues) == 0 {
		return errors.New("no tags specified for batch write")
	}

	// Convert tag values to JSON
	jsonData, err := json.Marshal(tagValues)
	if err != nil {
		return fmt.Errorf("failed to marshal tag values: %v", err)
	}

	cTagValues := C.CString(string(jsonData))
	defer C.free(unsafe.Pointer(cTagValues))

	// Allocate memory for results
	const maxResultsSize = 1024
	cResults := C.malloc(C.size_t(maxResultsSize))
	defer C.free(cResults)

	// Call the batch write function
	retCode := int(C.eip_write_tags_batch(
		C.int(c.clientID),
		cTagValues,
		C.int(len(tagValues)),
		(*C.char)(cResults),
		C.int(maxResultsSize),
	))

	if retCode != 0 {
		return &EipError{
			Code:    retCode,
			Message: "Failed to execute batch write",
		}
	}

	return nil
}

// ExecuteBatch executes a batch of operations (mix of reads and writes)
func (c *EipClient) ExecuteBatch(operations []BatchOperation) ([]BatchOperationResult, error) {
	if len(operations) == 0 {
		return nil, errors.New("no operations specified for batch execution")
	}

	// Convert operations to JSON
	jsonData, err := json.Marshal(operations)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal batch operations: %v", err)
	}

	cOperations := C.CString(string(jsonData))
	defer C.free(unsafe.Pointer(cOperations))

	// Allocate memory for results
	const maxResultsSize = 4096
	cResults := C.malloc(C.size_t(maxResultsSize))
	defer C.free(cResults)

	// Call the batch execute function
	retCode := int(C.eip_execute_batch(
		C.int(c.clientID),
		cOperations,
		C.int(len(operations)),
		(*C.char)(cResults),
		C.int(maxResultsSize),
	))

	if retCode != 0 {
		return nil, &EipError{
			Code:    retCode,
			Message: "Failed to execute batch operations",
		}
	}

	// Parse the JSON results
	var results []BatchOperationResult
	err = json.Unmarshal([]byte(C.GoString((*C.char)(cResults))), &results)
	if err != nil {
		return nil, fmt.Errorf("failed to parse batch execution results: %v", err)
	}

	return results, nil
}

// SubscribeToTag subscribes to changes in a tag value at a polling interval.
// Returns an unsubscribe function.
func (c *EipClient) SubscribeToTag(tagName string, interval time.Duration, dataType PlcDataType, callback func(value interface{}, err error)) (unsubscribe func()) {
	stopCh := make(chan struct{})
	c.subMutex.Lock()
	c.subscriptions[tagName] = stopCh
	c.subMutex.Unlock()
	go func() {
		var lastValue interface{}
		for {
			select {
			case <-stopCh:
				return
			case <-time.After(interval):
				val, err := c.ReadValue(tagName, dataType)
				if err == nil && (lastValue == nil || val.Value != lastValue) {
					lastValue = val.Value
					callback(val.Value, nil)
				} else if err != nil {
					callback(nil, err)
				}
			}
		}
	}()
	return func() {
		c.subMutex.Lock()
		if ch, ok := c.subscriptions[tagName]; ok {
			close(ch)
			delete(c.subscriptions, tagName)
		}
		c.subMutex.Unlock()
	}
}

// UnsubscribeFromAllTags stops all tag subscriptions
func (c *EipClient) UnsubscribeFromAllTags() {
	c.subMutex.Lock()
	for tag, ch := range c.subscriptions {
		close(ch)
		delete(c.subscriptions, tag)
	}
	c.subMutex.Unlock()
}

// Async read for a tag
func (c *EipClient) ReadTagAsync(tagName string, dataType PlcDataType) <-chan PlcValueResult {
	ch := make(chan PlcValueResult, 1)
	go func() {
		val, err := c.ReadValue(tagName, dataType)
		ch <- PlcValueResult{Tag: tagName, Type: dataType, Value: val.Value, Err: err}
	}()
	return ch
}

// Async write for a tag
func (c *EipClient) WriteTagAsync(tagName string, value *PlcValue) <-chan error {
	ch := make(chan error, 1)
	go func() {
		err := c.WriteValue(tagName, value)
		ch <- err
	}()
	return ch
}

// Tag metadata cache: get with cache
func (c *EipClient) GetTagMetadataCached(tagName string) (*TagMetadata, error) {
	c.tagCacheMu.RLock()
	if meta, ok := c.tagCache[tagName]; ok {
		c.tagCacheMu.RUnlock()
		return meta, nil
	}
	c.tagCacheMu.RUnlock()
	meta, err := c.GetTagMetadata(tagName)
	if err == nil {
		c.tagCacheMu.Lock()
		c.tagCache[tagName] = meta
		c.tagCacheMu.Unlock()
	}
	return meta, err
}

// ClearTagCache clears the tag metadata cache
func (c *EipClient) ClearTagCache() {
	c.tagCacheMu.Lock()
	c.tagCache = make(map[string]*TagMetadata)
	c.tagCacheMu.Unlock()
}

// Helper: Connect with retry
func ConnectWithRetry(ipAddress string, maxRetries int, delay time.Duration) (*EipClient, error) {
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		client, err := NewClient(ipAddress)
		if err == nil {
			return client, nil
		}
		lastErr = err
		time.Sleep(delay)
	}
	return nil, lastErr
}
