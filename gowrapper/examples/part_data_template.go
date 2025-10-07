package main

import (
	"fmt"
	"log"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

// PartDataTemplate creates a template specifically for the Part_Data UDT used in this demo
func CreatePartDataTemplate() *ethernetip.UdtTemplate {
	return &ethernetip.UdtTemplate{
		Name:        "Part_Data",
		Description: "Part data structure with machine status flags (Demo Template)",
		TotalSize:   2,
		Members: []ethernetip.UdtMemberTemplate{
			{Name: "oMachine_Running", DataType: "bool", Size: 1, Offset: 0, BitOffset: 0, Description: "Machine running status"},
			{Name: "oAlarm_Active", DataType: "bool", Size: 1, Offset: 0, BitOffset: 1, Description: "Alarm active status"},
			{Name: "oReady_State", DataType: "bool", Size: 1, Offset: 0, BitOffset: 2, Description: "Ready state status"},
			{Name: "oError_State", DataType: "bool", Size: 1, Offset: 0, BitOffset: 3, Description: "Error state status"},
			{Name: "oMaintenance_Mode", DataType: "bool", Size: 1, Offset: 0, BitOffset: 4, Description: "Maintenance mode status"},
			{Name: "oProduction_Active", DataType: "bool", Size: 1, Offset: 0, BitOffset: 5, Description: "Production active status"},
			{Name: "oQuality_Check", DataType: "bool", Size: 1, Offset: 0, BitOffset: 6, Description: "Quality check status"},
			{Name: "oSystem_Ready", DataType: "bool", Size: 1, Offset: 0, BitOffset: 7, Description: "System ready status"},
			{Name: "iCounter", DataType: "sint", Size: 1, Offset: 1, BitOffset: 0, Description: "Counter value"},
		},
	}
}

// DemoUdtExample demonstrates UDT functionality with the Go wrapper
func DemoUdtExample() {
	fmt.Println("=== Go UDT Demo Example ===")
	fmt.Println("Testing UDT reading and parsing with Go wrapper\n")

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to connect to PLC: %v", err)
	}
	defer client.Close()

	fmt.Println("✅ Connected to PLC")

	// Test basic UDT reading
	fmt.Println("\n🔍 Testing basic UDT reading for Part_Data...")
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

	// Test template-based parsing
	fmt.Println("\n🔧 Testing template-based parsing...")
	template := CreatePartDataTemplate()
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

	// Test individual UDT member access
	fmt.Println("\n🎯 Testing individual UDT member access...")
	memberValue, err := client.GetUdtMember("Part_Data", "oMachine_Running")
	if err != nil {
		log.Printf("❌ Failed to get UDT member: %v", err)
	} else {
		fmt.Printf("✅ oMachine_Running: %v\n", memberValue)
	}

	// Test UDT member writing
	fmt.Println("\n📤 Testing UDT member writing...")
	err = client.WriteUdtMember("Part_Data", "oMachine_Running", true)
	if err != nil {
		log.Printf("❌ Failed to write UDT member: %v", err)
	} else {
		fmt.Println("✅ UDT member write successful!")
	}

	fmt.Println("\n🎉 Go UDT demo completed successfully!")
}

// Uncomment to run the demo
// func main() {
// 	DemoUdtExample()
// }
