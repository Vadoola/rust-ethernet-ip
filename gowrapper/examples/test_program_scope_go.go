package main

import (
	"fmt"
	"log"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("=== Go Program Scope Tags Test ===")
	fmt.Println("Testing API_Web program scope tags with Go wrapper\n")

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to connect to PLC: %v", err)
	}
	defer client.Close()

	fmt.Println("✅ Connected to PLC")

	// Test different path formats
	pathFormats := []string{
		"Program:API_Web.out_MachineStatus",
		"API_Web.out_MachineStatus",
		"Program:API_Web[0].out_MachineStatus",
		"API_Web[0].out_MachineStatus",
		"Program:API_Web[0][0].out_MachineStatus",
		"API_Web[0][0].out_MachineStatus",
		"Program:API_Web[0].out_MachineStatus[0]",
		"API_Web[0].out_MachineStatus[0]",
		"Program:API_Web.out_MachineStatus[0]",
		"API_Web.out_MachineStatus[0]",
	}

	testTag := "out_MachineStatus"

	fmt.Printf("🔍 Testing different path formats for %s:\n", testTag)
	fmt.Println("=" + string(make([]byte, 60)))

	for i, path := range pathFormats {
		fmt.Printf("%d. Testing path: %s\n", i+1, path)

		// Try to read the tag
		value, err := client.ReadDint(path)
		if err != nil {
			fmt.Printf("   ❌ FAILED: %v\n", err)
		} else {
			fmt.Printf("   ✅ SUCCESS: %s = %d\n", path, value)
			fmt.Printf("   🎉 Found working path format: %s\n", path)
			break
		}
		fmt.Println()
	}

	// If we found a working format, test a few more tags
	fmt.Println("\n🔍 Testing additional tags with working format...")
	fmt.Println("=" + string(make([]byte, 60)))

	additionalTags := []struct {
		name string
		typ  string
	}{
		{"out_MachineReady", "BOOL"},
		{"out_MachineAlarm", "BOOL"},
		{"in_ClearAlarms", "BOOL"},
		{"in_PCHandshake", "BOOL"},
	}

	for _, tag := range additionalTags {
		// Try the most likely working format first
		testPaths := []string{
			fmt.Sprintf("API_Web.%s", tag.name),
			fmt.Sprintf("Program:API_Web.%s", tag.name),
			fmt.Sprintf("API_Web[0].%s", tag.name),
			fmt.Sprintf("Program:API_Web[0].%s", tag.name),
		}

		foundWorking := false
		for _, path := range testPaths {
			var err error
			var value interface{}

			switch tag.typ {
			case "BOOL":
				value, err = client.ReadBool(path)
			case "DINT":
				value, err = client.ReadDint(path)
			case "REAL":
				value, err = client.ReadReal(path)
			case "STRING":
				value, err = client.ReadString(path)
			}

			if err == nil {
				fmt.Printf("   ✅ %s = %v (path: %s)\n", tag.name, value, path)
				foundWorking = true
				break
			}
		}

		if !foundWorking {
			fmt.Printf("   ❌ %s - No working path found\n", tag.name)
		}
	}

	fmt.Println("\n🎉 Go program scope tags test completed!")
}
