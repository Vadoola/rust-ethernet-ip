package main

// #cgo CFLAGS: -I${SRCDIR}/../go_backend/target/release
// #cgo LDFLAGS: -L${SRCDIR}/../go_backend/target/release -lrust_ethernet_ip
// #include <stdlib.h>
// #include <stdint.h>
// #include <stdbool.h>
// extern int32_t read_dint(const char* tag_name);
// extern bool write_dint(const char* tag_name, int32_t value);
import "C"
import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"unsafe"
)

var mu sync.Mutex

func readDint(tagName string) (int32, error) {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	value := C.read_dint(cTagName)
	return int32(value), nil
}

func writeDint(tagName string, value int32) error {
	cTagName := C.CString(tagName)
	defer C.free(unsafe.Pointer(cTagName))

	success := C.write_dint(cTagName, C.int32_t(value))
	if !success {
		return fmt.Errorf("failed to write tag")
	}
	return nil
}

func readTagHandler(w http.ResponseWriter, r *http.Request) {
	tagName := r.URL.Query().Get("tag")
	if tagName == "" {
		http.Error(w, "Tag name is required", http.StatusBadRequest)
		return
	}

	mu.Lock()
	value, err := readDint(tagName)
	mu.Unlock()

	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading tag: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"tag":   tagName,
		"value": value,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func writeTagHandler(w http.ResponseWriter, r *http.Request) {
	tagName := r.URL.Query().Get("tag")
	valueStr := r.URL.Query().Get("value")
	if tagName == "" || valueStr == "" {
		http.Error(w, "Tag name and value are required", http.StatusBadRequest)
		return
	}

	var value int32
	_, err := fmt.Sscanf(valueStr, "%d", &value)
	if err != nil {
		http.Error(w, "Invalid value format", http.StatusBadRequest)
		return
	}

	mu.Lock()
	err = writeDint(tagName, value)
	mu.Unlock()

	if err != nil {
		http.Error(w, fmt.Sprintf("Error writing tag: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"message": "Tag written successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	http.HandleFunc("/read", readTagHandler)
	http.HandleFunc("/write", writeTagHandler)

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
