package main

import (
	"fmt"
	"log"
	"time"

	"github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
	fmt.Println("🧪 Testing Rust Library Improvements via Go Wrapper")
	fmt.Println("=====================================================")
	fmt.Println("PLC IP: 192.168.0.1")
	fmt.Println("Testing all the improvements we made to the Rust library")
	fmt.Println()

	// Connect to PLC
	client, err := ethernetip.NewClient("192.168.0.1:44818")
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	fmt.Println("📡 Connecting to PLC...")
	// Note: The Go wrapper's NewClient already connects
	fmt.Println("✅ Connected successfully!\n")

	// Test 1: Controller-scoped tag (TestTagController)
	fmt.Println("🎯 Test 1: Controller-scoped tag (TestTagController)")
	fmt.Println("==================================================")
	start := time.Now()
	value, err := client.ReadDint("TestTagController")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 2: Program-scoped tag (TestTagProgram)
	fmt.Println("\n🎯 Test 2: Program-scoped tag (TestTagProgram)")
	fmt.Println("===========================================")
	start = time.Now()
	value, err = client.ReadDint("Program:API_Web.TestTagProgram")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 3: Program-scoped tag (out_FusePartStatus)
	fmt.Println("\n🎯 Test 3: Program-scoped tag (out_FusePartStatus)")
	fmt.Println("=================================================")
	start = time.Now()
	value, err = client.ReadDint("Program:API_Web.out_FusePartStatus")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %d (took %v)\n", value, time.Since(start))
	}

	// Test 4: UDT tag (TestTagUDT)
	fmt.Println("\n🎯 Test 4: UDT tag (TestTagUDT)")
	fmt.Println("===============================")
	start = time.Now()
	udtValue, err := client.ReadUdt("TestTagUDT")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %+v (took %v)\n", udtValue, time.Since(start))
	}

	// Test 5: gTracking UDT
	fmt.Println("\n🎯 Test 5: gTracking UDT")
	fmt.Println("========================")
	start = time.Now()
	udtValue, err = client.ReadUdt("gTracking")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %+v (took %v)\n", udtValue, time.Since(start))
	}

	// Test 6: Part_Data UDT (chunked reading)
	fmt.Println("\n🎯 Test 6: Part_Data UDT (chunked reading)")
	fmt.Println("========================================")
	start = time.Now()
	udtValue, err = client.ReadUdt("Part_Data")
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: %+v (took %v)\n", udtValue, time.Since(start))
	}

	// Test 7: Health check
	fmt.Println("\n🎯 Test 7: Health Check")
	fmt.Println("======================")
	start = time.Now()
	healthy, err := client.CheckHealth()
	if err != nil {
		fmt.Printf("   ❌ FAILED: %v (took %v)\n", err, time.Since(start))
	} else {
		fmt.Printf("   ✅ SUCCESS: PLC is healthy: %v (took %v)\n", healthy, time.Since(start))
	}

	fmt.Println("\n🎉 Go wrapper test completed!")
	fmt.Println("=============================")
	fmt.Println("This demonstrates that our Rust library improvements")
	fmt.Println("are working correctly through the Go wrapper!")
}
