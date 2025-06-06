package ethernetip

import (
	"testing"
	"time"
)

// TestPlcDataType tests the PlcDataType enum
func TestPlcDataType(t *testing.T) {
	if Bool != 0 {
		t.Errorf("Expected Bool to be 0, got %d", Bool)
	}
	if Sint != 1 {
		t.Errorf("Expected Sint to be 1, got %d", Sint)
	}
	if Int != 2 {
		t.Errorf("Expected Int to be 2, got %d", Int)
	}
	if Dint != 3 {
		t.Errorf("Expected Dint to be 3, got %d", Dint)
	}
	if Lint != 4 {
		t.Errorf("Expected Lint to be 4, got %d", Lint)
	}
	if Real != 9 {
		t.Errorf("Expected Real to be 9, got %d", Real)
	}
	if String != 11 {
		t.Errorf("Expected String to be 11, got %d", String)
	}
}

// TestPlcValue tests the PlcValue struct
func TestPlcValue(t *testing.T) {
	// Test boolean value
	boolValue := &PlcValue{Type: Bool, Value: true}
	if boolValue.Type != Bool {
		t.Errorf("Expected Bool type, got %d", boolValue.Type)
	}
	if boolValue.Value != true {
		t.Errorf("Expected true value, got %v", boolValue.Value)
	}

	// Test integer value
	intValue := &PlcValue{Type: Int, Value: int16(42)}
	if intValue.Type != Int {
		t.Errorf("Expected Int type, got %d", intValue.Type)
	}
	if intValue.Value != int16(42) {
		t.Errorf("Expected 42 value, got %v", intValue.Value)
	}

	// Test real value
	realValue := &PlcValue{Type: Real, Value: 3.14}
	if realValue.Type != Real {
		t.Errorf("Expected Real type, got %d", realValue.Type)
	}
	if realValue.Value != 3.14 {
		t.Errorf("Expected 3.14 value, got %v", realValue.Value)
	}

	// Test string value
	stringValue := &PlcValue{Type: String, Value: "test"}
	if stringValue.Type != String {
		t.Errorf("Expected String type, got %d", stringValue.Type)
	}
	if stringValue.Value != "test" {
		t.Errorf("Expected 'test' value, got %v", stringValue.Value)
	}
}

// TestEipError tests the EipError struct
func TestEipError(t *testing.T) {
	err := &EipError{
		Code:    1,
		Message: "test error",
	}

	expected := "EIP Error 1: test error"
	if err.Error() != expected {
		t.Errorf("EipError.Error() = %v, want %v", err.Error(), expected)
	}
}

// TestEipClient tests the EipClient struct
func TestEipClient(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	if client.GetClientID() <= 0 {
		t.Error("Expected positive client ID")
	}

	if client.GetIPAddress() != "192.168.0.1" {
		t.Errorf("Expected IP address 192.168.0.1, got %s", client.GetIPAddress())
	}
}

// TestReadWriteValue tests reading and writing values
func TestReadWriteValue(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Test writing boolean value
	boolValue := &PlcValue{Type: Bool, Value: true}
	err = client.WriteValue("TestBool", boolValue)
	if err != nil {
		t.Fatalf("Failed to write bool value: %v", err)
	}

	// Test reading boolean value
	readValue, err := client.ReadValue("TestBool", Bool)
	if err != nil {
		t.Fatalf("Failed to read bool value: %v", err)
	}
	if readValue.Value != true {
		t.Error("Expected true, got false")
	}

	// Test writing integer value
	intValue := &PlcValue{Type: Int, Value: int16(42)}
	err = client.WriteValue("TestInt", intValue)
	if err != nil {
		t.Fatalf("Failed to write int value: %v", err)
	}

	// Test reading integer value
	readIntValue, err := client.ReadValue("TestInt", Int)
	if err != nil {
		t.Fatalf("Failed to read int value: %v", err)
	}
	if readIntValue.Value != int16(42) {
		t.Errorf("Expected 42, got %v", readIntValue.Value)
	}

	// Test writing real value
	realValue := &PlcValue{Type: Real, Value: 3.14}
	err = client.WriteValue("TestReal", realValue)
	if err != nil {
		t.Fatalf("Failed to write real value: %v", err)
	}

	// Test reading real value
	readRealValue, err := client.ReadValue("TestReal", Real)
	if err != nil {
		t.Fatalf("Failed to read real value: %v", err)
	}
	if readRealValue.Value != 3.14 {
		t.Errorf("Expected 3.14, got %v", readRealValue.Value)
	}

	// Test writing string value
	stringValue := &PlcValue{Type: String, Value: "Hello, World!"}
	err = client.WriteValue("TestString", stringValue)
	if err != nil {
		t.Fatalf("Failed to write string value: %v", err)
	}

	// Test reading string value
	readStringValue, err := client.ReadValue("TestString", String)
	if err != nil {
		t.Fatalf("Failed to read string value: %v", err)
	}
	if readStringValue.Value != "Hello, World!" {
		t.Errorf("Expected 'Hello, World!', got %v", readStringValue.Value)
	}
}

// TestBatchOperations tests batch read and write operations
func TestBatchOperations(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Configure batch operations
	config := &BatchConfig{
		MaxOperationsPerPacket: 10,
		MaxPacketSize:          1024,
		PacketTimeoutMs:        1000,
		ContinueOnError:        true,
		OptimizePacketPacking:  true,
	}
	err = client.ConfigureBatchOperations(config)
	if err != nil {
		t.Fatalf("Failed to configure batch operations: %v", err)
	}

	// Test batch write
	tagValues := map[string]interface{}{
		"TestBool":   true,
		"TestInt":    int16(42),
		"TestReal":   3.14,
		"TestString": "Hello, World!",
	}
	err = client.BatchWrite(tagValues)
	if err != nil {
		t.Fatalf("Failed to batch write: %v", err)
	}

	// Test batch read
	tagNames := []string{"TestBool", "TestInt", "TestReal", "TestString"}
	results, err := client.BatchRead(tagNames)
	if err != nil {
		t.Fatalf("Failed to batch read: %v", err)
	}

	// Verify results
	if len(results) != len(tagNames) {
		t.Errorf("Expected %d results, got %d", len(tagNames), len(results))
	}

	for tagName, value := range results {
		switch tagName {
		case "TestBool":
			if boolValue, ok := value.(bool); !ok || !boolValue {
				t.Errorf("Expected true for TestBool, got %v", value)
			}
		case "TestInt":
			if intValue, ok := value.(int16); !ok || intValue != 42 {
				t.Errorf("Expected 42 for TestInt, got %v", value)
			}
		case "TestReal":
			if realValue, ok := value.(float64); !ok || realValue != 3.14 {
				t.Errorf("Expected 3.14 for TestReal, got %v", value)
			}
		case "TestString":
			if stringValue, ok := value.(string); !ok || stringValue != "Hello, World!" {
				t.Errorf("Expected 'Hello, World!' for TestString, got %v", value)
			}
		}
	}
}

// TestHealthCheck tests the health check functionality
func TestHealthCheck(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Test basic health check
	isHealthy, err := client.CheckHealth()
	if err != nil {
		t.Fatalf("Failed to check health: %v", err)
	}
	if !isHealthy {
		t.Error("Expected healthy status")
	}

	// Test detailed health check
	isHealthy, details, err := client.CheckHealthDetailed()
	if err != nil {
		t.Fatalf("Failed to check detailed health: %v", err)
	}
	if !isHealthy {
		t.Error("Expected healthy status")
	}
	if details == "" {
		t.Error("Expected non-empty health details")
	}
}

// TestTagMetadata tests tag metadata functionality
func TestTagMetadata(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Test discovering tags
	err = client.DiscoverTags()
	if err != nil {
		t.Fatalf("Failed to discover tags: %v", err)
	}

	// Test getting tag metadata
	metadata, err := client.GetTagMetadata("TestBool")
	if err != nil {
		t.Fatalf("Failed to get tag metadata: %v", err)
	}

	if metadata == nil {
		t.Error("Expected non-nil metadata")
	}

	// Test cached metadata
	cachedMetadata, err := client.GetTagMetadataCached("TestBool")
	if err != nil {
		t.Fatalf("Failed to get cached tag metadata: %v", err)
	}

	if cachedMetadata == nil {
		t.Error("Expected non-nil cached metadata")
	}

	// Test clearing cache
	client.ClearTagCache()
}

// TestAsyncOperations tests asynchronous operations
func TestAsyncOperations(t *testing.T) {
	client, err := NewClient("192.168.0.1")
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Test async read
	resultChan := client.ReadTagAsync("TestBool", Bool)
	result := <-resultChan
	if result.Err != nil {
		t.Fatalf("Failed to read tag asynchronously: %v", result.Err)
	}
	if result.Tag != "TestBool" {
		t.Errorf("Expected tag name TestBool, got %s", result.Tag)
	}

	// Test async write
	value := &PlcValue{Type: Bool, Value: true}
	errChan := client.WriteTagAsync("TestBool", value)
	err = <-errChan
	if err != nil {
		t.Fatalf("Failed to write tag asynchronously: %v", err)
	}

	// Test tag subscription
	callbackCalled := false
	unsubscribe := client.SubscribeToTag("TestBool", 100*time.Millisecond, Bool, func(value interface{}, err error) {
		callbackCalled = true
		if err != nil {
			t.Errorf("Error in subscription callback: %v", err)
		}
	})

	// Wait for a few callbacks
	time.Sleep(300 * time.Millisecond)
	unsubscribe()

	if !callbackCalled {
		t.Error("Expected subscription callback to be called")
	}

	// Test unsubscribing from all tags
	client.UnsubscribeFromAllTags()
}

// TestConnectionRetry tests connection retry functionality
func TestConnectionRetry(t *testing.T) {
	// Test with invalid IP to trigger retries
	_, err := ConnectWithRetry("192.168.0.999", 3, 100*time.Millisecond)
	if err == nil {
		t.Error("Expected error when connecting to invalid IP")
	}

	// Test with valid IP
	client, err := ConnectWithRetry("192.168.0.1", 3, 100*time.Millisecond)
	if err != nil {
		t.Fatalf("Failed to connect with retry: %v", err)
	}
	defer client.Close()

	if client.GetIPAddress() != "192.168.0.1" {
		t.Errorf("Expected IP address 192.168.0.1, got %s", client.GetIPAddress())
	}
}
