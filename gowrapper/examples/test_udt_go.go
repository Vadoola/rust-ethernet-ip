package main

import (
	"fmt"
	"log"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("=== Go UDT Test Example ===")
	fmt.Println("Testing UDT functionality with Go wrapper\n")

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to connect to PLC: %v", err)
	}
	defer client.Close()

	fmt.Println("✅ Connected to PLC")

	// Test UDT reading
	fmt.Println("\n🔍 Testing UDT reading for Part_Data...")
	udtValue, err := client.ReadUdt("Part_Data")
	if err != nil {
		log.Printf("❌ Failed to read UDT: %v", err)
		return
	}

	fmt.Printf("✅ UDT read successful!\n")
	fmt.Printf("📊 UDT has %d members:\n", len(udtValue.Members))
	for key, value := range udtValue.Members {
		fmt.Printf("   - %s: %v\n", key, value)
	}

	// Test template parsing
	fmt.Println("\n🔧 Testing template parsing...")
	template := ethernetip.TemplateFactory.CreateGenericTemplate("Part_Data", 2)
	parsedUdt, err := client.ParseUdtWithTemplate("Part_Data", template)
	if err != nil {
		log.Printf("❌ Failed to parse UDT with template: %v", err)
		return
	}

	fmt.Printf("✅ Template parsing successful!\n")
	fmt.Printf("📊 Parsed UDT has %d members:\n", len(parsedUdt.Members))
	for key, value := range parsedUdt.Members {
		fmt.Printf("   - %s: %v\n", key, value)
	}

	// Test individual member access
	fmt.Println("\n🎯 Testing individual member access...")
	memberValue, err := client.GetUdtMember("Part_Data", "oMachine_Running")
	if err != nil {
		log.Printf("❌ Failed to get UDT member: %v", err)
	} else {
		fmt.Printf("✅ oMachine_Running: %v\n", memberValue)
	}

	fmt.Println("\n🎉 Go UDT test completed successfully!")
}
