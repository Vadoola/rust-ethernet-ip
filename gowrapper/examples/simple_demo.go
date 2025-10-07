package main

import (
	"fmt"
	"log"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("=== Simple Go Wrapper Test ===")
	fmt.Println("Testing basic functionality\n")

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to connect to PLC: %v", err)
	}
	defer client.Close()

	fmt.Println("✅ Connected to PLC")

	// Test basic tag reading
	fmt.Println("\n🔍 Testing basic tag reading...")

	// Try to read a simple boolean tag
	value, err := client.ReadBool("TestTag")
	if err != nil {
		fmt.Printf("❌ Failed to read TestTag: %v\n", err)
	} else {
		fmt.Printf("✅ TestTag: %v\n", value)
	}

	// Test UDT reading
	fmt.Println("\n🔍 Testing UDT reading...")
	udt, err := client.ReadUdt("Part_Data")
	if err != nil {
		fmt.Printf("❌ Failed to read Part_Data UDT: %v\n", err)
	} else {
		fmt.Printf("✅ Part_Data UDT read successfully with %d members\n", len(udt.Members))
		for key, value := range udt.Members {
			fmt.Printf("   - %s: %v\n", key, value)
		}
	}

	// Test template parsing
	fmt.Println("\n🔧 Testing template parsing...")
	template := ethernetip.TemplateFactory.CreateGenericTemplate("Part_Data", 2)
	parsedUdt, err := client.ParseUdtWithTemplate("Part_Data", template)
	if err != nil {
		fmt.Printf("❌ Failed to parse UDT with template: %v\n", err)
	} else {
		fmt.Printf("✅ Template parsing successful with %d members\n", len(parsedUdt.Members))
	}

	fmt.Println("\n🎉 Go wrapper test completed successfully!")
}
