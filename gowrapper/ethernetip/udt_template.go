package ethernetip

import (
	"encoding/binary"
	"fmt"
	"strconv"
	"strings"
)

// UdtTemplate represents a UDT (User Defined Type) template for parsing and serializing UDT data
type UdtTemplate struct {
	Name        string             `json:"name"`
	Description string             `json:"description"`
	TotalSize   int                `json:"total_size"`
	Members     []UdtMemberTemplate `json:"members"`
}

// UdtMemberTemplate represents a member of a UDT template
type UdtMemberTemplate struct {
	Name        string `json:"name"`
	DataType    string `json:"data_type"`
	Size        int    `json:"size"`
	Offset      int    `json:"offset"`
	BitOffset   int    `json:"bit_offset"`
	Description string `json:"description"`
}

// ParseRawData parses raw UDT data according to this template
func (t *UdtTemplate) ParseRawData(rawData []byte) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	offset := 0

	for _, member := range t.Members {
		if offset+member.Size > len(rawData) {
			result["_error_"+member.Name] = "Insufficient data"
			break
		}

		value, err := t.parseMemberValue(rawData, offset, member)
		if err != nil {
			result["_error_"+member.Name] = fmt.Sprintf("Parse error: %v", err)
		} else {
			result[member.Name] = value
		}

		offset += member.Size
	}

	return result, nil
}

// parseMemberValue parses a single member value from raw data
func (t *UdtTemplate) parseMemberValue(data []byte, offset int, member UdtMemberTemplate) (interface{}, error) {
	switch strings.ToLower(member.DataType) {
	case "bool":
		if member.BitOffset >= 0 && member.BitOffset < 8 {
			return (data[offset] & (1 << member.BitOffset)) != 0, nil
		}
		return data[offset] != 0, nil
	case "sint":
		return int8(data[offset]), nil
	case "int":
		if offset+1 < len(data) {
			return int16(binary.LittleEndian.Uint16(data[offset:offset+2])), nil
		}
		return int16(data[offset]), nil
	case "dint":
		if offset+3 < len(data) {
			return int32(binary.LittleEndian.Uint32(data[offset:offset+4])), nil
		}
		return int32(data[offset]), nil
	case "real":
		if offset+3 < len(data) {
			bits := binary.LittleEndian.Uint32(data[offset:offset+4])
			return float32(bits), nil
		}
		return float32(data[offset]), nil
	case "string":
		end := offset + member.Size
		if end > len(data) {
			end = len(data)
		}
		return strings.TrimRight(string(data[offset:end]), "\x00"), nil
	default:
		return fmt.Sprintf("Unknown type: %s", member.DataType), nil
	}
}

// UdtTemplateFactory provides factory methods for creating common UDT templates
type UdtTemplateFactory struct{}

// CreateGenericTemplate creates a generic UDT template for raw data parsing
func (f *UdtTemplateFactory) CreateGenericTemplate(name string, size int) *UdtTemplate {
	return &UdtTemplate{
		Name:        name,
		Description: fmt.Sprintf("Generic UDT template for %s", name),
		TotalSize:   size,
		Members: []UdtMemberTemplate{
			{
				Name:        "_raw_data",
				DataType:    "bytes",
				Size:        size,
				Offset:      0,
				BitOffset:   0,
				Description: "Raw UDT data",
			},
		},
	}
}

// CreateFromRawData creates a template for parsing raw UDT data without specific member definitions
func (f *UdtTemplateFactory) CreateFromRawData(name string, rawData []byte) *UdtTemplate {
	return &UdtTemplate{
		Name:        name,
		Description: fmt.Sprintf("UDT template created from raw data for %s", name),
		TotalSize:   len(rawData),
		Members: []UdtMemberTemplate{
			{
				Name:        "_raw_data",
				DataType:    "bytes",
				Size:        len(rawData),
				Offset:      0,
				BitOffset:   0,
				Description: "Raw UDT data",
			},
			{
				Name:        "_size",
				DataType:    "dint",
				Size:        4,
				Offset:      0,
				BitOffset:   0,
				Description: "UDT size in bytes",
			},
		},
	}
}

// Global template factory instance
var TemplateFactory = &UdtTemplateFactory{}

// ParseHexString parses a hex string like "[04, 00]" to bytes
func ParseHexString(hexStr string) ([]byte, error) {
	// Remove brackets and split by comma
	hexStr = strings.Trim(hexStr, "[]")
	parts := strings.Split(hexStr, ",")
	
	result := make([]byte, len(parts))
	for i, part := range parts {
		part = strings.TrimSpace(part)
		val, err := strconv.ParseUint(part, 16, 8)
		if err != nil {
			return nil, fmt.Errorf("invalid hex value '%s': %v", part, err)
		}
		result[i] = byte(val)
	}
	
	return result, nil
}
