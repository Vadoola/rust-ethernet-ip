package main

import (
	"fmt"
	"log"
	"time"

	ethernetip "github.com/sergiogallegos/rust-ethernet-ip/gowrapper"
)

func main() {
	fmt.Println("EtherNet/IP Client Test Program")
	fmt.Println("==============================")

	// Connect to PLC
	plcIP := "192.168.0.1:44818"
	fmt.Printf("Connecting to PLC at %s...\n", plcIP)

	// Try to connect with retry logic
	client, err := ethernetip.ConnectWithRetry(plcIP, 3, time.Second)
	if err != nil {
		log.Fatalf("Failed to connect to PLC: %v", err)
	}
	defer client.Close()

	fmt.Println("Connected successfully!")
	fmt.Println("\nTesting basic read/write operations...")

	// Test writing a boolean value
	tagName := "_IO_EM_DI00"
	fmt.Printf("Writing 'true' to tag '%s'\n", tagName)

	err = client.WriteBool(tagName, true)
	if err != nil {
		log.Printf("Failed to write boolean: %v", err)
		return
	}

	// Read the value back
	value, err := client.ReadBool(tagName)
	if err != nil {
		log.Printf("Failed to read boolean: %v", err)
		return
	}

	fmt.Printf("Read value: %v\n", value)

	// Test health check
	healthy, err := client.CheckHealth()
	if err != nil {
		log.Printf("Failed to check health: %v", err)
		return
	}
	fmt.Printf("PLC health check: %v\n", healthy)

	// Test detailed health check
	healthy, details, err := client.CheckHealthDetailed()
	if err != nil {
		log.Printf("Failed to check detailed health: %v", err)
		return
	}
	fmt.Printf("PLC detailed health check: %v\nDetails: %s\n", healthy, details)

	// Test tag metadata
	metadata, err := client.GetTagMetadata(tagName)
	if err != nil {
		log.Printf("Failed to get tag metadata: %v", err)
		return
	}
	fmt.Printf("Tag metadata: %+v\n", metadata)

	// Test batch operations
	fmt.Println("\nTesting batch operations...")

	// Configure batch operations
	config := ethernetip.DefaultBatchConfig()
	err = client.ConfigureBatchOperations(config)
	if err != nil {
		log.Printf("Failed to configure batch operations: %v", err)
		return
	}

	// Batch write
	tagValues := map[string]interface{}{
		tagName: true,
	}
	err = client.BatchWrite(tagValues)
	if err != nil {
		log.Printf("Failed to batch write: %v", err)
		return
	}

	// Batch read
	tagNames := []string{tagName}
	results, err := client.BatchRead(tagNames)
	if err != nil {
		log.Printf("Failed to batch read: %v", err)
		return
	}

	fmt.Printf("Batch read results: %+v\n", results)

	// Test subscription
	fmt.Println("\nTesting tag subscription...")

	unsubscribe := client.SubscribeToTag(tagName, time.Second, ethernetip.Bool, func(value interface{}, err error) {
		if err != nil {
			log.Printf("Subscription error: %v", err)
			return
		}
		fmt.Printf("Tag value changed: %v\n", value)
	})

	// Wait for a few updates
	time.Sleep(5 * time.Second)
	unsubscribe()

	fmt.Println("\nTest completed successfully!")
}
