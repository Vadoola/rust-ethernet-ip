package main

import (
	"fmt"
	"log"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("🧪 Simple Go Test")
	fmt.Println("=================")

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("❌ Failed to connect to PLC: %v", err)
	}
	defer client.Close()
	fmt.Println("✅ Connected to PLC successfully!")

	// Test reading a simple tag
	tagName := "Program:API_Web.out_FuseWeight2"
	fmt.Printf("📖 Reading tag: %s\n", tagName)

	value, err := client.ReadReal(tagName)
	if err != nil {
		log.Printf("❌ Read failed: %v", err)
	} else {
		fmt.Printf("✅ Value: %v\n", value)
	}
}
