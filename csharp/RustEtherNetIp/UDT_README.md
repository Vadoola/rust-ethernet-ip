# 🏗️ Enhanced Nested UDT Support - C# Wrapper

This document describes the complete nested UDT (User Defined Type) support in the Rust EtherNet/IP C# wrapper.

## 🎯 **Overview**

The C# wrapper now provides **full support for nested UDTs** with unlimited nesting depth, type safety, and intuitive dot-notation access patterns.

## ✨ **Key Features**

- **✅ Unlimited Nesting Depth** - UDTs can contain other UDTs at any level
- **✅ Type Safety** - Strongly-typed access to all UDT members
- **✅ Dot Notation Access** - Use `"Status.Running"` to access nested members
- **✅ JSON Serialization** - Automatic conversion between C# and Rust
- **✅ Batch Operations** - Read/write multiple UDTs efficiently
- **✅ Backward Compatibility** - Existing code continues to work

## 🚀 **Quick Start**

### Basic UDT Operations

```csharp
using RustEtherNetIp;

using var client = new EtherNetIpClient();
if (client.Connect("192.168.0.1:44818"))
{
    // Create a nested UDT
    var motorData = new Dictionary<string, PlcValue>
    {
        ["MotorID"] = PlcValue.Dint(1),
        ["Name"] = PlcValue.String("MainMotor"),
        
        // Nested Status UDT
        ["Status"] = PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["Running"] = PlcValue.Bool(true),
            ["Fault"] = PlcValue.Bool(false),
            ["ErrorCode"] = PlcValue.Dint(0)
        }),
        
        // Nested Config UDT
        ["Config"] = PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["Speed"] = PlcValue.Real(1750.0f),
            ["Acceleration"] = PlcValue.Real(100.0f),
            ["MaxCurrent"] = PlcValue.Real(15.5f)
        })
    };

    // Write the UDT
    client.WriteUdt("MotorData", PlcValue.Udt(motorData));

    // Read the UDT
    var readData = client.ReadUdt("MotorData");
    
    // Access nested values
    var isRunning = readData.GetNestedValue("Status.Running")?.As<bool>() ?? false;
    var speed = readData.GetNestedValue("Config.Speed")?.As<float>() ?? 0.0f;
}
```

## 🔧 **API Reference**

### Core UDT Methods

#### `PlcValue ReadUdt(string tagName)`
Reads a UDT from the PLC with full nested support.

```csharp
var udtValue = client.ReadUdt("MotorData");
if (udtValue.IsUdt)
{
    var members = udtValue.UdtMembers;
    // Access members...
}
```

#### `void WriteUdt(string tagName, PlcValue value)`
Writes a UDT to the PLC with full nested support.

```csharp
var udtValue = PlcValue.Udt(motorData);
client.WriteUdt("MotorData", udtValue);
```

#### `PlcValue GetUdtMember(string tagName, string memberPath)`
Gets a nested member using dot notation.

```csharp
var isRunning = client.GetUdtMember("MotorData", "Status.Running");
var speed = client.GetUdtMember("MotorData", "Config.Speed");
```

#### `void SetUdtMember(string tagName, string memberPath, PlcValue value)`
Sets a nested member using dot notation.

```csharp
client.SetUdtMember("MotorData", "Status.Running", PlcValue.Bool(false));
client.SetUdtMember("MotorData", "Config.Speed", PlcValue.Real(2000.0f));
```

### PlcValue Class

#### Creating Values
```csharp
// Basic types
var boolVal = PlcValue.Bool(true);
var intVal = PlcValue.Dint(42);
var floatVal = PlcValue.Real(3.14f);
var stringVal = PlcValue.String("Hello");

// UDT
var udtVal = PlcValue.Udt(new Dictionary<string, PlcValue>
{
    ["Member1"] = PlcValue.Dint(100),
    ["Member2"] = PlcValue.String("Test")
});
```

#### Accessing Values
```csharp
// Type-safe access
var intValue = plcValue.As<int>();
var floatValue = plcValue.AsOrDefault<float>(0.0f);

// Check type
if (plcValue.Type == PlcValueType.Udt)
{
    var members = plcValue.UdtMembers;
    // Access UDT members...
}
```

#### Nested Access
```csharp
// Get nested value using dot notation
var nestedValue = plcValue.GetNestedValue("Status.Running");
var deepValue = plcValue.GetNestedValue("Motor.Config.Speed");
```

## 🏗️ **Advanced Examples**

### Complex Multi-Level UDT

```csharp
// Create a production line with multiple levels of nesting
var productionLine = new Dictionary<string, PlcValue>
{
    ["LineID"] = PlcValue.Dint(1),
    ["LineName"] = PlcValue.String("Assembly Line 1"),
    
    // Station UDT
    ["Station1"] = PlcValue.Udt(new Dictionary<string, PlcValue>
    {
        ["StationID"] = PlcValue.Dint(1),
        ["Status"] = PlcValue.String("Active"),
        
        // Motor UDT within Station
        ["Motor"] = PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["Running"] = PlcValue.Bool(true),
            ["Speed"] = PlcValue.Real(1500.0f),
            
            // Diagnostics UDT within Motor
            ["Diagnostics"] = PlcValue.Udt(new Dictionary<string, PlcValue>
            {
                ["Temperature"] = PlcValue.Real(45.2f),
                ["Vibration"] = PlcValue.Real(0.5f),
                ["OperatingHours"] = PlcValue.Udint(1250)
            })
        })
    })
};

client.WriteUdt("ProductionLine", PlcValue.Udt(productionLine));

// Access deeply nested values
var temperature = client.GetUdtMember("ProductionLine", "Station1.Motor.Diagnostics.Temperature");
Console.WriteLine($"Motor Temperature: {temperature?.As<float>()}°C");
```

### Real-World Motor Control System

```csharp
public class MotorControlSystem
{
    public static void CreateSystem(EtherNetIpClient client)
    {
        var controlSystem = new Dictionary<string, PlcValue>
        {
            ["SystemID"] = PlcValue.Dint(100),
            ["SystemName"] = PlcValue.String("Main Control System"),
            
            // System Status
            ["SystemStatus"] = PlcValue.Udt(new Dictionary<string, PlcValue>
            {
                ["Online"] = PlcValue.Bool(true),
                ["Mode"] = PlcValue.String("Auto"),
                ["AlarmCount"] = PlcValue.Dint(0)
            }),
            
            // Multiple Motors
            ["Motor1"] = CreateMotorUdt(1, "Conveyor Motor", 1000.0f, true),
            ["Motor2"] = CreateMotorUdt(2, "Lift Motor", 800.0f, false),
            ["Motor3"] = CreateMotorUdt(3, "Gripper Motor", 500.0f, true),
            
            // Safety System
            ["Safety"] = PlcValue.Udt(new Dictionary<string, PlcValue>
            {
                ["EmergencyStop"] = PlcValue.Bool(false),
                ["LightCurtain"] = PlcValue.Bool(true),
                ["DoorOpen"] = PlcValue.Bool(false)
            })
        };

        client.WriteUdt("ControlSystem", PlcValue.Udt(controlSystem));
    }

    private static PlcValue CreateMotorUdt(int id, string name, float speed, bool running)
    {
        return PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["MotorID"] = PlcValue.Dint(id),
            ["Name"] = PlcValue.String(name),
            
            ["Status"] = PlcValue.Udt(new Dictionary<string, PlcValue>
            {
                ["Running"] = PlcValue.Bool(running),
                ["Fault"] = PlcValue.Bool(false),
                ["ErrorCode"] = PlcValue.Dint(0)
            }),
            
            ["Config"] = PlcValue.Udt(new Dictionary<string, PlcValue>
            {
                ["Speed"] = PlcValue.Real(speed),
                ["Acceleration"] = PlcValue.Real(100.0f),
                ["MaxCurrent"] = PlcValue.Real(15.5f)
            })
        });
    }
}
```

### Batch Operations with UDTs

```csharp
// Write multiple UDTs
var motor1 = CreateMotorUdt(1, "Motor1", 1500.0f, true);
var motor2 = CreateMotorUdt(2, "Motor2", 1800.0f, false);
var motor3 = CreateMotorUdt(3, "Motor3", 1200.0f, true);

client.WriteUdt("BatchMotor1", motor1);
client.WriteUdt("BatchMotor2", motor2);
client.WriteUdt("BatchMotor3", motor3);

// Read multiple UDTs in batch
var tags = new[] { "BatchMotor1", "BatchMotor2", "BatchMotor3" };
var results = client.ReadTagsBatch(tags);

foreach (var (tagName, result) in results)
{
    if (result.IsSuccess && result.Value is PlcValue udtValue && udtValue.IsUdt)
    {
        var motorName = udtValue.GetNestedValue("Name")?.As<string>() ?? "Unknown";
        var speed = udtValue.GetNestedValue("Config.Speed")?.As<float>() ?? 0.0f;
        var running = udtValue.GetNestedValue("Status.Running")?.As<bool>() ?? false;
        
        Console.WriteLine($"{tagName}: {motorName} - Speed: {speed} RPM, Running: {running}");
    }
}
```

## 🔄 **Backward Compatibility**

The enhanced UDT support maintains full backward compatibility:

```csharp
// Old way (still works)
var oldDict = new Dictionary<string, object>
{
    ["Value1"] = 42,
    ["Value2"] = "Hello"
};
client.WriteUdt("OldTag", oldDict);

var oldResult = client.ReadUdtAsDictionary("OldTag");

// New way (recommended)
var newUdt = PlcValue.Udt(new Dictionary<string, PlcValue>
{
    ["Value1"] = PlcValue.Dint(42),
    ["Value2"] = PlcValue.String("Hello")
});
client.WriteUdt("NewTag", newUdt);

var newResult = client.ReadUdt("NewTag");
```

## 🎯 **Best Practices**

### 1. Use Type-Safe Access
```csharp
// Good
var speed = udtValue.GetNestedValue("Config.Speed")?.AsOrDefault<float>(0.0f);

// Avoid
var speed = udtValue.GetNestedValue("Config.Speed")?.As<float>(); // Can throw
```

### 2. Check for UDT Type
```csharp
if (plcValue.IsUdt)
{
    var members = plcValue.UdtMembers;
    // Safe to access members
}
```

### 3. Use Helper Methods for Complex Structures
```csharp
public static PlcValue CreateMotorUdt(int id, string name, float speed, bool running)
{
    return PlcValue.Udt(new Dictionary<string, PlcValue>
    {
        ["MotorID"] = PlcValue.Dint(id),
        ["Name"] = PlcValue.String(name),
        ["Status"] = PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["Running"] = PlcValue.Bool(running),
            ["Fault"] = PlcValue.Bool(false)
        }),
        ["Config"] = PlcValue.Udt(new Dictionary<string, PlcValue>
        {
            ["Speed"] = PlcValue.Real(speed),
            ["Acceleration"] = PlcValue.Real(100.0f)
        })
    });
}
```

### 4. Handle Errors Gracefully
```csharp
try
{
    var udtValue = client.ReadUdt("MotorData");
    if (udtValue?.IsUdt == true)
    {
        var speed = udtValue.GetNestedValue("Config.Speed")?.AsOrDefault<float>(0.0f);
        Console.WriteLine($"Motor Speed: {speed} RPM");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error reading UDT: {ex.Message}");
}
```

## 🚀 **Performance Notes**

- **JSON Serialization**: UDTs are serialized to JSON for transmission between C# and Rust
- **Memory Efficient**: Only the necessary data is transmitted
- **Batch Operations**: Use batch operations for multiple UDTs to improve performance
- **Caching**: The library caches UDT definitions for faster subsequent access

## 📚 **Complete Example**

See `Examples/NestedUdtExample.cs` for a comprehensive example demonstrating all UDT features including:
- Simple nested UDTs
- Complex multi-level structures
- Dot notation access
- Batch operations
- Real-world motor control systems

## 🎉 **Summary**

The enhanced C# wrapper provides **complete nested UDT support** with:
- ✅ Unlimited nesting depth
- ✅ Type-safe access patterns
- ✅ Intuitive dot notation
- ✅ Full backward compatibility
- ✅ High performance
- ✅ Comprehensive error handling

This makes it easy to work with complex industrial data structures while maintaining clean, readable code! 🚀
