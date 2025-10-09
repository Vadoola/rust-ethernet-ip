package main

import (
	"fmt"
	"log"
	"time"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("🧪 Testing Program Tag Reading via Go Wrapper")
	fmt.Println("==============================================")
	fmt.Println("PLC IP: 192.168.0.1")
	fmt.Println("Testing program tag with correct path format")
	fmt.Println()

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	fmt.Println("📡 Connecting to PLC...")
	fmt.Println("✅ Connected successfully!\n")

	// Test 1: Try reading program tag with correct format
	fmt.Println("🎯 Test 1: Program tag with correct format")
	fmt.Println("==========================================")
	fmt.Println("Tag: Program:API_Web.out_FusePartStatus")
	start := time.Now()
	value, err := client.ReadDint("Program:API_Web.out_FusePartStatus")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 2: Try reading program tag with old format
	fmt.Println("\n🎯 Test 2: Program tag with old format")
	fmt.Println("====================================")
	fmt.Println("Tag: out_FusePartStatus")
	start = time.Now()
	value, err = client.ReadDint("out_FusePartStatus")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 3: Try reading TestTagProgram with correct format
	fmt.Println("\n🎯 Test 3: TestTagProgram with correct format")
	fmt.Println("===========================================")
	fmt.Println("Tag: Program:API_Web.TestTagProgram")
	start = time.Now()
	value, err = client.ReadDint("Program:API_Web.TestTagProgram")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 4: Try reading TestTagProgram with old format
	fmt.Println("\n🎯 Test 4: TestTagProgram with old format")
	fmt.Println("=======================================")
	fmt.Println("Tag: TestTagProgram")
	start = time.Now()
	value, err = client.ReadDint("TestTagProgram")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	fmt.Println("\n🎉 Program tag test completed!")
	fmt.Println("=============================")
	fmt.Println("This test shows which format works for program tags")
}
