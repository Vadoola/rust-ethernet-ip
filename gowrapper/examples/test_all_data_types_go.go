package main

import (
	"fmt"
	"log"
	"time"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

const (
	PLC_IP          = "192.168.0.1:44818"
	PROGRAM_NAME    = "API_Web"
	REAL_TEST_VALUE = 88.88
	DINT_TEST_VALUE = int32(12345)
	BOOL_TEST_VALUE = true
	FLOAT_TOLERANCE = 0.001
)

func main() {
	fmt.Println("🧪 Testing ALL Data Types Write and Read Operations (Go)")
	fmt.Println("========================================================")
	fmt.Printf("PLC IP: %s\n", PLC_IP)
	fmt.Printf("Testing REAL, DINT, and BOOL tags in %s program\n", PROGRAM_NAME)
	fmt.Println("Writing test values, then reading back to verify")
	fmt.Println()

	// Connect to PLC
	client, err := ethernetip.NewClient(PLC_IP)
	if err != nil {
		log.Fatalf("❌ Failed to connect to PLC: %v", err)
	}
	defer client.Close()
	fmt.Println("✅ Connected to PLC successfully!\n")

	// Test tags with their expected values
	testTags := []struct {
		name         string
		expectedType string
		writeValue   interface{}
		readValue    interface{}
	}{
		// REAL tags
		{fmt.Sprintf("Program:%s.out_FuseWeight2", PROGRAM_NAME), "REAL", REAL_TEST_VALUE, REAL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_FuseWeight1", PROGRAM_NAME), "REAL", REAL_TEST_VALUE, REAL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_FuseSandFillTime", PROGRAM_NAME), "REAL", REAL_TEST_VALUE, REAL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_FuseResistance1", PROGRAM_NAME), "REAL", REAL_TEST_VALUE, REAL_TEST_VALUE},

		// DINT tags
		{fmt.Sprintf("Program:%s.out_MachineStatus", PROGRAM_NAME), "DINT", DINT_TEST_VALUE, DINT_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_FusePartStatus", PROGRAM_NAME), "DINT", DINT_TEST_VALUE, DINT_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_FuseLastStationDone", PROGRAM_NAME), "DINT", DINT_TEST_VALUE, DINT_TEST_VALUE},
		{fmt.Sprintf("Program:%s.cmd_SaveFuseData", PROGRAM_NAME), "DINT", DINT_TEST_VALUE, DINT_TEST_VALUE},

		// BOOL tags
		{fmt.Sprintf("Program:%s.sts_PLCHandshake", PROGRAM_NAME), "BOOL", BOOL_TEST_VALUE, BOOL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_MachineReady", PROGRAM_NAME), "BOOL", BOOL_TEST_VALUE, BOOL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.out_MachineAlarm", PROGRAM_NAME), "BOOL", BOOL_TEST_VALUE, BOOL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.in_PCHandshake", PROGRAM_NAME), "BOOL", BOOL_TEST_VALUE, BOOL_TEST_VALUE},
		{fmt.Sprintf("Program:%s.in_ClearAlarms", PROGRAM_NAME), "BOOL", BOOL_TEST_VALUE, BOOL_TEST_VALUE},
	}

	fmt.Println("🎯 Test Plan:")
	fmt.Println("1. Read initial values for all tags")
	fmt.Println("2. Write test values to all tags")
	fmt.Println("3. Read back values to verify changes")
	fmt.Println()

	// Step 1: Read initial values
	fmt.Println("📖 Step 1: Reading initial values")
	fmt.Println("----------------------------------")
	initialValues := make(map[string]interface{})

	for _, tag := range testTags {
		var value interface{}
		var err error

		switch tag.expectedType {
		case "REAL":
			value, err = client.ReadReal(tag.name)
		case "DINT":
			value, err = client.ReadDint(tag.name)
		case "BOOL":
			value, err = client.ReadBool(tag.name)
		}

		if err != nil {
			log.Printf("❌ %s: Read failed - %v", tag.name, err)
			continue
		}
		fmt.Printf("✅ %s: %v\n", tag.name, value)
		initialValues[tag.name] = value
	}
	fmt.Println()

	// Step 2: Write test values to all tags
	fmt.Println("✏️ Step 2: Writing test values to all tags")
	fmt.Println("--------------------------------------------")
	writeSuccessCount := 0

	for _, tag := range testTags {
		fmt.Printf("📝 Writing '%v' to %s tag '%s'\n", tag.writeValue, tag.expectedType, tag.name)

		var err error
		switch tag.expectedType {
		case "REAL":
			if realVal, ok := tag.writeValue.(float64); ok {
				err = client.WriteReal(tag.name, realVal)
			}
		case "DINT":
			if dintVal, ok := tag.writeValue.(int32); ok {
				err = client.WriteDint(tag.name, dintVal)
			}
		case "BOOL":
			if boolVal, ok := tag.writeValue.(bool); ok {
				err = client.WriteBool(tag.name, boolVal)
			}
		}

		if err != nil {
			log.Printf("❌ %s: Write failed - %v", tag.name, err)
		} else {
			fmt.Printf("✅ %s: Write successful\n", tag.name)
			writeSuccessCount++
		}
	}
	fmt.Println()

	// Small delay to ensure PLC processes the writes
	time.Sleep(100 * time.Millisecond)

	// Step 3: Read back values to verify changes
	fmt.Println("📖 Step 3: Reading back values to verify changes")
	fmt.Println("------------------------------------------------")
	readVerifySuccessCount := 0

	for _, tag := range testTags {
		var actualValue interface{}
		var err error

		switch tag.expectedType {
		case "REAL":
			actualValue, err = client.ReadReal(tag.name)
		case "DINT":
			actualValue, err = client.ReadDint(tag.name)
		case "BOOL":
			actualValue, err = client.ReadBool(tag.name)
		}

		if err != nil {
			log.Printf("❌ %s: Read failed - %v", tag.name, err)
			continue
		}

		// Verify the value based on data type
		success := false
		switch tag.expectedType {
		case "REAL":
			if actualFloat, ok := actualValue.(float64); ok {
				if expectedFloat, ok := tag.readValue.(float64); ok {
					if abs(actualFloat-expectedFloat) < FLOAT_TOLERANCE {
						fmt.Printf("✅ %s: %v ✓\n", tag.name, actualValue)
						success = true
					} else {
						fmt.Printf("❌ %s: %v ✗ Expected: %v\n", tag.name, actualValue, expectedFloat)
					}
				}
			} else {
				fmt.Printf("❌ %s: Read unexpected type: %T\n", tag.name, actualValue)
			}
		case "DINT":
			if actualInt, ok := actualValue.(int32); ok {
				if expectedInt, ok := tag.readValue.(int32); ok {
					if actualInt == expectedInt {
						fmt.Printf("✅ %s: %v ✓\n", tag.name, actualValue)
						success = true
					} else {
						fmt.Printf("❌ %s: %v ✗ Expected: %v\n", tag.name, actualValue, expectedInt)
					}
				}
			} else {
				fmt.Printf("❌ %s: Read unexpected type: %T\n", tag.name, actualValue)
			}
		case "BOOL":
			if actualBool, ok := actualValue.(bool); ok {
				if expectedBool, ok := tag.readValue.(bool); ok {
					if actualBool == expectedBool {
						fmt.Printf("✅ %s: %v ✓\n", tag.name, actualValue)
						success = true
					} else {
						fmt.Printf("❌ %s: %v ✗ Expected: %v\n", tag.name, actualValue, expectedBool)
					}
				}
			} else {
				fmt.Printf("❌ %s: Read unexpected type: %T\n", tag.name, actualValue)
			}
		}

		if success {
			readVerifySuccessCount++
		}
	}
	fmt.Println()

	// Final results
	fmt.Println("📊 Test Results Summary")
	fmt.Println("======================")
	fmt.Printf("Total tags tested: %d\n", len(testTags))
	fmt.Printf("Successful write/read cycles: %d/%d\n", readVerifySuccessCount, len(testTags))

	if readVerifySuccessCount == len(testTags) {
		fmt.Println("✅ ALL TESTS PASSED: All data types written and read successfully!")
	} else {
		fmt.Printf("❌ PARTIAL SUCCESS: %d/%d tags worked correctly\n", readVerifySuccessCount, len(testTags))
	}

	fmt.Println("\n⚡ Performance Notes:")
	fmt.Println("- Write operations should complete in <10ms")
	fmt.Println("- Read operations should complete in <5ms")
	fmt.Println("- Total test time should be <2 seconds for all operations")
}

// Helper function for absolute value of float64
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
