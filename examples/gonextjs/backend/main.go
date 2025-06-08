package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	gowrapper "github.com/sergiogallegos/rust-ethernet-ip/gowrapper"
)

var (
	client *gowrapper.EipClient
	mu     sync.Mutex
)

func main() {
	r := mux.NewRouter()

	// REST endpoints
	r.HandleFunc("/api/connect", handleConnect).Methods("POST")
	r.HandleFunc("/api/disconnect", handleDisconnect).Methods("POST")
	r.HandleFunc("/api/tag", handleTag).Methods("GET", "POST")
	r.HandleFunc("/api/batch", handleBatch).Methods("POST")
	r.HandleFunc("/api/taginfo", handleTagInfo).Methods("GET")
	// Debug read endpoint
	r.HandleFunc("/api/test-read", handleTestRead).Methods("GET")
	r.HandleFunc("/api/benchmark", handleBenchmark).Methods("POST")

	// WebSocket endpoint
	r.HandleFunc("/ws", handleWebSocket)

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func handleConnect(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IPAddress string `json:"ipAddress"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if client != nil {
		client.Close()
	}

	var err error
	client, err = gowrapper.NewClient(req.IPAddress)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDisconnect(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client != nil {
		client.Close()
		client = nil
	}

	w.WriteHeader(http.StatusOK)
}

func handleTag(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case "GET":
		tag := r.URL.Query().Get("tag")
		typeStr := r.URL.Query().Get("type")
		if tag == "" || typeStr == "" {
			http.Error(w, "Tag and type required", http.StatusBadRequest)
			return
		}
		typeVal, err := parsePlcDataType(typeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		val, err := client.ReadValue(tag, typeVal)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tag":   tag,
			"value": val.Value,
			"type":  typeStr,
		})
	case "POST":
		var req struct {
			Tag   string      `json:"tag"`
			Type  string      `json:"type"`
			Value interface{} `json:"value"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		typeVal, err := parsePlcDataType(req.Type)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var value interface{} = req.Value
		switch req.Type {
		case "Dint":
			if f, ok := req.Value.(float64); ok {
				value = int32(f)
			} else if i, ok := req.Value.(int); ok {
				value = int32(i)
			} else if s, ok := req.Value.(string); ok {
				var v int32
				_, err := fmt.Sscanf(s, "%d", &v)
				if err != nil {
					http.Error(w, "invalid DINT value", http.StatusBadRequest)
					return
				}
				value = v
			}
		case "Int":
			if f, ok := req.Value.(float64); ok {
				value = int16(f)
			} else if i, ok := req.Value.(int); ok {
				value = int16(i)
			} else if s, ok := req.Value.(string); ok {
				var v int16
				_, err := fmt.Sscanf(s, "%d", &v)
				if err != nil {
					http.Error(w, "invalid INT value", http.StatusBadRequest)
					return
				}
				value = v
			}
		case "Real":
			if f, ok := req.Value.(float64); ok {
				value = f
			} else if s, ok := req.Value.(string); ok {
				var v float64
				_, err := fmt.Sscanf(s, "%f", &v)
				if err != nil {
					http.Error(w, "invalid REAL value", http.StatusBadRequest)
					return
				}
				value = v
			}
		}
		plcVal := &gowrapper.PlcValue{Type: typeVal, Value: value}
		err = client.WriteValue(req.Tag, plcVal)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func handleBatch(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	var req struct {
		Tags []struct {
			Tag  string `json:"tag"`
			Type string `json:"type"`
		} `json:"tags"`
		Writes []struct {
			Tag   string      `json:"tag"`
			Type  string      `json:"type"`
			Value interface{} `json:"value"`
		} `json:"writes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req.Writes) > 0 {
		// Batch write
		writeMap := make(map[string]interface{})
		for _, writeReq := range req.Writes {
			_, err := parsePlcDataType(writeReq.Type)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			var value interface{} = writeReq.Value
			switch writeReq.Type {
			case "Dint":
				if f, ok := writeReq.Value.(float64); ok {
					value = int32(f)
				} else if i, ok := writeReq.Value.(int); ok {
					value = int32(i)
				} else if s, ok := writeReq.Value.(string); ok {
					var v int32
					_, err := fmt.Sscanf(s, "%d", &v)
					if err != nil {
						http.Error(w, "invalid DINT value", http.StatusBadRequest)
						return
					}
					value = v
				}
			case "Int":
				if f, ok := writeReq.Value.(float64); ok {
					value = int16(f)
				} else if i, ok := writeReq.Value.(int); ok {
					value = int16(i)
				} else if s, ok := writeReq.Value.(string); ok {
					var v int16
					_, err := fmt.Sscanf(s, "%d", &v)
					if err != nil {
						http.Error(w, "invalid INT value", http.StatusBadRequest)
						return
					}
					value = v
				}
			case "Real":
				if f, ok := writeReq.Value.(float64); ok {
					value = f
				} else if s, ok := writeReq.Value.(string); ok {
					var v float64
					_, err := fmt.Sscanf(s, "%f", &v)
					if err != nil {
						http.Error(w, "invalid REAL value", http.StatusBadRequest)
						return
					}
					value = v
				}
			}
			writeMap[writeReq.Tag] = value
		}
		err := client.BatchWrite(writeMap)
		if err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		return
	}

	// Batch read (existing logic)
	results := make([]map[string]interface{}, len(req.Tags))
	for i, t := range req.Tags {
		typeVal, err := parsePlcDataType(t.Type)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		val, err := client.ReadValue(t.Tag, typeVal)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		results[i] = map[string]interface{}{
			"tag":   t.Tag,
			"value": val.Value,
			"type":  t.Type,
		}
	}
	json.NewEncoder(w).Encode(results)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	// Simulate real-time updates
	for {
		time.Sleep(1 * time.Second)
		mu.Lock()
		if client == nil {
			mu.Unlock()
			return
		}
		mu.Unlock()

		// Example: Read a tag and send update (Bool type for demo)
		val, err := client.ReadValue("_IO_EM_DI00", gowrapper.Bool)
		if err != nil {
			log.Println(err)
			continue
		}
		conn.WriteJSON(map[string]interface{}{
			"tag":   "_IO_EM_DI00",
			"value": val.Value,
			"type":  "Bool",
		})
	}
}

// parsePlcDataType converts a string to gowrapper.PlcDataType
func parsePlcDataType(s string) (gowrapper.PlcDataType, error) {
	switch s {
	case "Bool":
		return gowrapper.Bool, nil
	case "Sint":
		return gowrapper.Sint, nil
	case "Int":
		return gowrapper.Int, nil
	case "Dint":
		return gowrapper.Dint, nil
	case "Lint":
		return gowrapper.Lint, nil
	case "Usint":
		return gowrapper.Usint, nil
	case "Uint":
		return gowrapper.Uint, nil
	case "Udint":
		return gowrapper.Udint, nil
	case "Ulint":
		return gowrapper.Ulint, nil
	case "Real":
		return gowrapper.Real, nil
	case "Lreal":
		return gowrapper.Lreal, nil
	case "String":
		return gowrapper.String, nil
	case "Udt":
		return gowrapper.Udt, nil
	default:
		return 0, fmt.Errorf("unsupported PLC data type: %s", s)
	}
}

// Add handler for tag info discovery
func handleTagInfo(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}
	tag := r.URL.Query().Get("tag")
	if tag == "" {
		http.Error(w, "Tag required", http.StatusBadRequest)
		return
	}
	log.Printf("[DEBUG] Discovering metadata for tag: %s", tag)
	meta, err := client.GetTagMetadata(tag)
	if err != nil {
		log.Printf("[ERROR] Failed to get metadata for tag %s: %v", tag, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("[DEBUG] Metadata for tag %s: %+v", tag, meta)
	typeStr := plcDataTypeToString(meta.DataType)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tag":  tag,
		"type": typeStr,
	})
}

// Helper to convert PLC data type code to string
func plcDataTypeToString(dt int) string {
	switch dt {
	case int(gowrapper.Bool):
		return "Bool"
	case int(gowrapper.Sint):
		return "Sint"
	case int(gowrapper.Int):
		return "Int"
	case int(gowrapper.Dint):
		return "Dint"
	case int(gowrapper.Lint):
		return "Lint"
	case int(gowrapper.Usint):
		return "Usint"
	case int(gowrapper.Uint):
		return "Uint"
	case int(gowrapper.Udint):
		return "Udint"
	case int(gowrapper.Ulint):
		return "Ulint"
	case int(gowrapper.Real):
		return "Real"
	case int(gowrapper.Lreal):
		return "Lreal"
	case int(gowrapper.String):
		return "String"
	case int(gowrapper.Udt):
		return "Udt"
	default:
		return "Unknown"
	}
}

// Debug read handler
func handleTestRead(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}
	tag := r.URL.Query().Get("tag")
	typeStr := r.URL.Query().Get("type")
	if tag == "" || typeStr == "" {
		http.Error(w, "Tag and type required", http.StatusBadRequest)
		return
	}
	log.Printf("[DEBUG] /api/test-read: tag=%s, type=%s", tag, typeStr)
	typeVal, err := parsePlcDataType(typeStr)
	if err != nil {
		log.Printf("[ERROR] /api/test-read: parsePlcDataType failed: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	val, err := client.ReadValue(tag, typeVal)
	if err != nil {
		log.Printf("[ERROR] /api/test-read: ReadValue failed: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tag":   tag,
			"type":  typeStr,
			"error": err.Error(),
			"value": nil,
		})
		return
	}
	log.Printf("[DEBUG] /api/test-read: ReadValue success: %+v", val)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tag":   tag,
		"type":  typeStr,
		"error": nil,
		"value": val.Value,
	})
}

func handleBenchmark(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	var req struct {
		Tag   string `json:"tag"`
		Write bool   `json:"write"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	typeVal := gowrapper.Dint // Default to Dint for speed test; could be improved
	readCount := 0
	writeCount := 0
	start := time.Now()
	duration := 3 * time.Second
	end := start.Add(duration)
	var lastVal int32 = 0
	for time.Now().Before(end) {
		_, err := client.ReadValue(req.Tag, typeVal)
		if err == nil {
			readCount++
		}
		if req.Write {
			lastVal++
			plcVal := &gowrapper.PlcValue{Type: typeVal, Value: lastVal}
			err := client.WriteValue(req.Tag, plcVal)
			if err == nil {
				writeCount++
			}
		}
	}
	elapsed := time.Since(start)
	readRate := float64(readCount) / elapsed.Seconds()
	writeRate := float64(writeCount) / elapsed.Seconds()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"readCount":  readCount,
		"writeCount": writeCount,
		"elapsedMs":  elapsed.Milliseconds(),
		"readRate":   readRate,
		"writeRate":  writeRate,
	})
}
