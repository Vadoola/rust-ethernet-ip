using Microsoft.AspNetCore.Mvc;
using AspNetExample.Services;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AspNetExample.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlcController : ControllerBase
{
    private readonly PlcService _plcService;
    private readonly ILogger<PlcController> _logger;

    public PlcController(PlcService plcService, ILogger<PlcController> logger)
    {
        _plcService = plcService;
        _logger = logger;
    }

    [HttpPost("connect")]
    public IActionResult Connect([FromBody] ConnectRequest request)
    {
        _logger.LogInformation("Connect request received. Address: {Address}", request?.Address ?? "null");
        
        if (request == null)
        {
            _logger.LogWarning("Connect request is null");
            return BadRequest(new { success = false, message = "Invalid request format" });
        }
        
        if (string.IsNullOrEmpty(request.Address))
        {
            _logger.LogWarning("Connect request address is null or empty");
            return BadRequest(new { success = false, message = "PLC address is required" });
        }

        _logger.LogInformation("Attempting to connect to PLC at address: {Address}", request.Address);
        var connected = _plcService.Connect(request.Address);
        if (connected)
        {
            _logger.LogInformation("Successfully connected to PLC at {Address}", request.Address);
            return Ok(new { success = true, message = "Connected successfully" });
        }
        else
        {
            _logger.LogWarning("Failed to connect to PLC at {Address}", request.Address);
            return BadRequest(new { success = false, message = "Failed to connect to PLC" });
        }
    }

    [HttpPost("disconnect")]
    public IActionResult Disconnect()
    {
        _plcService.Disconnect();
        return Ok(new { success = true, message = "Disconnected successfully" });
    }

    [HttpGet("tag/{tagName}")]
    public IActionResult ReadTag(string tagName)
    {
        if (!_plcService.IsConnected)
            return StatusCode(503, new { success = false, message = "Not connected to PLC" });

        _logger.LogInformation("Attempting to discover type for tag: {TagName}", tagName);

        try
        {
            // Try to use the PlcService metadata method if available
            try
            {
                var metadata = _plcService.GetTagMetadata(_plcService.CurrentAddress, tagName);
                if (metadata != null)
                {
                    _logger.LogInformation("Tag metadata found for {TagName}: {Metadata}", tagName, metadata);
                    return Ok(new { success = true, value = metadata.GetType().GetProperty("value")?.GetValue(metadata), type = metadata.GetType().GetProperty("type")?.GetValue(metadata)?.ToString() });
                }
            }
            catch (Exception metaEx)
            {
                _logger.LogDebug("Metadata discovery failed for {TagName}: {Error}", tagName, metaEx.Message);
            }

            // Try types in a smarter order - more specific types first
            var typeAttempts = new List<(string Type, Func<object> ReadFunc)>
            {
                ("STRING", () => _plcService.ReadString(tagName)),
                ("LREAL", () => _plcService.ReadLreal(tagName)),
                ("REAL", () => _plcService.ReadReal(tagName)),
                ("LINT", () => _plcService.ReadLint(tagName)),
                ("ULINT", () => _plcService.ReadUlint(tagName)),
                ("DINT", () => _plcService.ReadDint(tagName)),
                ("UDINT", () => _plcService.ReadUdint(tagName)),
                ("INT", () => _plcService.ReadInt(tagName)),
                ("UINT", () => _plcService.ReadUint(tagName)),
                ("SINT", () => _plcService.ReadSint(tagName)),
                ("USINT", () => _plcService.ReadUsint(tagName)),
                ("BOOL", () => _plcService.ReadBool(tagName)),
                ("UDT", () => _plcService.ReadUdt(tagName))
            };

            Exception lastException = null;
            
            foreach (var (type, readFunc) in typeAttempts)
            {
                try
                {
                    var value = readFunc();
                    _logger.LogInformation("Successfully read tag {TagName} as {Type} with value: {Value}", tagName, type, value);
                    return Ok(new { success = true, value = value, type = type });
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogDebug("Failed to read {TagName} as {Type}: {Error}", tagName, type, ex.Message);
                }
            }
            
            _logger.LogWarning("Could not determine type for tag {TagName}. Last error: {Error}", tagName, lastException?.Message);
            return NotFound(new { success = false, message = $"Could not determine type for tag {tagName}. Tag may not exist or may be an unsupported type." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading tag {TagName}", tagName);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost("tag/{tagName}")]
    public IActionResult WriteTag(string tagName, [FromBody] WriteTagRequest request)
    {
        if (!_plcService.IsConnected)
            return StatusCode(503, new { success = false, message = "Not connected to PLC" });

        try
        {
            switch (request.Type.ToUpper())
            {
                case "BOOL":
                    if (bool.TryParse(request.Value.ToString(), out bool boolValue))
                    {
                        _plcService.WriteBool(tagName, boolValue);
                        return Ok(new { success = true, message = $"Wrote BOOL {boolValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid boolean value" });
                    
                case "SINT":
                    if (sbyte.TryParse(request.Value.ToString(), out sbyte sintValue))
                    {
                        _plcService.WriteSint(tagName, sintValue);
                        return Ok(new { success = true, message = $"Wrote SINT {sintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid SINT value (-128 to 127)" });
                    
                case "INT":
                    if (short.TryParse(request.Value.ToString(), out short intValue))
                    {
                        _plcService.WriteInt(tagName, intValue);
                        return Ok(new { success = true, message = $"Wrote INT {intValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid INT value (-32,768 to 32,767)" });
                    
                case "DINT":
                    if (int.TryParse(request.Value.ToString(), out int dintValue))
                    {
                        _plcService.WriteDint(tagName, dintValue);
                        return Ok(new { success = true, message = $"Wrote DINT {dintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid DINT value" });
                    
                case "LINT":
                    if (long.TryParse(request.Value.ToString(), out long lintValue))
                    {
                        _plcService.WriteLint(tagName, lintValue);
                        return Ok(new { success = true, message = $"Wrote LINT {lintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid LINT value" });
                    
                case "USINT":
                    if (byte.TryParse(request.Value.ToString(), out byte usintValue))
                    {
                        _plcService.WriteUsint(tagName, usintValue);
                        return Ok(new { success = true, message = $"Wrote USINT {usintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid USINT value (0 to 255)" });
                    
                case "UINT":
                    if (ushort.TryParse(request.Value.ToString(), out ushort uintValue))
                    {
                        _plcService.WriteUint(tagName, uintValue);
                        return Ok(new { success = true, message = $"Wrote UINT {uintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid UINT value (0 to 65,535)" });
                    
                case "UDINT":
                    if (uint.TryParse(request.Value.ToString(), out uint udintValue))
                    {
                        _plcService.WriteUdint(tagName, udintValue);
                        return Ok(new { success = true, message = $"Wrote UDINT {udintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid UDINT value" });
                    
                case "ULINT":
                    if (ulong.TryParse(request.Value.ToString(), out ulong ulintValue))
                    {
                        _plcService.WriteUlint(tagName, ulintValue);
                        return Ok(new { success = true, message = $"Wrote ULINT {ulintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid ULINT value" });
                    
                case "REAL":
                    if (float.TryParse(request.Value.ToString(), out float realValue))
                    {
                        _plcService.WriteReal(tagName, realValue);
                        return Ok(new { success = true, message = $"Wrote REAL {realValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid REAL value" });
                    
                case "LREAL":
                    if (double.TryParse(request.Value.ToString(), out double lrealValue))
                    {
                        _plcService.WriteLreal(tagName, lrealValue);
                        return Ok(new { success = true, message = $"Wrote LREAL {lrealValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid LREAL value" });
                    
                case "STRING":
                    if (request.Value == null)
                        return BadRequest(new { success = false, message = "String value cannot be null" });
                    string stringValue = request.Value.ToString() ?? string.Empty;
                    _plcService.WriteString(tagName, stringValue);
                    return Ok(new { success = true, message = $"Wrote STRING '{stringValue}' to {tagName}" });
                    
                case "UDT":
                    return BadRequest(new { success = false, message = "UDT writing not supported in this example" });
                    
                default:
                    return BadRequest(new { success = false, message = $"Unsupported type: {request.Type}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing to tag {TagName}", tagName);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost("benchmark")]
    public IActionResult RunBenchmark([FromBody] BenchmarkRequest? request = null)
    {
        if (!_plcService.IsConnected)
            return StatusCode(503, new { success = false, message = "Not connected to PLC" });

        // Use provided test tag or default
        string testTag = request?.TestTag ?? "TestTag";
        bool testWrites = request?.TestWrites ?? false;
        int durationSeconds = Math.Max(1, Math.Min(request?.DurationSeconds ?? 5, 30)); // 1-30 seconds

        _logger.LogInformation("Starting benchmark with tag: {TestTag}, Duration: {Duration}s, TestWrites: {TestWrites}", 
            testTag, durationSeconds, testWrites);

        try
        {
            var startTime = DateTime.Now;
            var readCount = 0;
            var writeCount = 0;
            var readErrors = 0;
            var writeErrors = 0;
            string detectedType = "UNKNOWN";
            bool tagExists = false;

            // First, detect the tag's actual data type
            var typeAttempts = new List<(string Type, Func<object> ReadFunc, Action<object> WriteFunc)>
            {
                ("BOOL", () => _plcService.ReadBool(testTag), (val) => _plcService.WriteBool(testTag, (bool)val)),
                ("DINT", () => _plcService.ReadDint(testTag), (val) => _plcService.WriteDint(testTag, (int)val)),
                ("REAL", () => _plcService.ReadReal(testTag), (val) => _plcService.WriteReal(testTag, (float)val)),
                ("INT", () => _plcService.ReadInt(testTag), (val) => _plcService.WriteInt(testTag, (short)val)),
                ("STRING", () => _plcService.ReadString(testTag), (val) => _plcService.WriteString(testTag, (string)val)),
                ("LREAL", () => _plcService.ReadLreal(testTag), (val) => _plcService.WriteLreal(testTag, (double)val)),
                ("SINT", () => _plcService.ReadSint(testTag), (val) => _plcService.WriteSint(testTag, (sbyte)val)),
                ("USINT", () => _plcService.ReadUsint(testTag), (val) => _plcService.WriteUsint(testTag, (byte)val)),
                ("UINT", () => _plcService.ReadUint(testTag), (val) => _plcService.WriteUint(testTag, (ushort)val)),
                ("UDINT", () => _plcService.ReadUdint(testTag), (val) => _plcService.WriteUdint(testTag, (uint)val)),
                ("LINT", () => _plcService.ReadLint(testTag), (val) => _plcService.WriteLint(testTag, (long)val)),
                ("ULINT", () => _plcService.ReadUlint(testTag), (val) => _plcService.WriteUlint(testTag, (ulong)val))
            };

            Func<object> readFunction = null;
            Action<object> writeFunction = null;
            object testValue = null;

            // Detect the correct data type
            foreach (var (type, readFunc, writeFunc) in typeAttempts)
            {
                try
                {
                    var value = readFunc();
                    detectedType = type;
                    readFunction = readFunc;
                    writeFunction = writeFunc;
                    testValue = GetTestValue(type, value);
                    tagExists = true;
                    _logger.LogInformation("Detected tag {TestTag} as type {Type} with value: {Value}", testTag, type, value);
                    break;
                }
                catch
                {
                    // Continue to next type
                }
            }

            if (!tagExists)
            {
                _logger.LogWarning("Tag {TestTag} does not exist or is not readable", testTag);
                return Ok(new { 
                    success = false, 
                    readRate = 0, 
                    writeRate = 0, 
                    message = $"Tag '{testTag}' does not exist or is not accessible",
                    details = new {
                        testTag,
                        durationSeconds = 0.0,
                        readCount = 0,
                        writeCount = 0,
                        readErrors = 0,
                        writeErrors = 0,
                        tagExists = false,
                        detectedType = "UNKNOWN"
                    }
                });
            }

            // Run the benchmark with the detected type
            while ((DateTime.Now - startTime).TotalSeconds < durationSeconds)
            {
                // Test reads
                try 
                { 
                    readFunction();
                    readCount++; 
                } 
                catch 
                { 
                    readErrors++; 
                }

                // Test writes (only if enabled)
                if (testWrites && writeFunction != null)
                {
                    try 
                    { 
                        writeFunction(testValue);
                        writeCount++; 
                        // Alternate test values for some types
                        if (detectedType == "BOOL")
                            testValue = !(bool)testValue;
                        else if (detectedType == "DINT")
                            testValue = ((int)testValue == 100) ? 200 : 100;
                    } 
                    catch 
                    { 
                        writeErrors++; 
                    }
                }
            }

            var actualDuration = (DateTime.Now - startTime).TotalSeconds;
            var readRate = (int)(readCount / actualDuration);
            var writeRate = (int)(writeCount / actualDuration);

            _logger.LogInformation("Benchmark complete. Type: {Type}, Reads: {ReadCount} ({ReadRate}/sec), Writes: {WriteCount} ({WriteRate}/sec), Read Errors: {ReadErrors}, Write Errors: {WriteErrors}", 
                detectedType, readCount, readRate, writeCount, writeRate, readErrors, writeErrors);

            var message = $"Benchmark complete: {readRate} reads/sec";
            if (testWrites)
                message += $", {writeRate} writes/sec";
            message += $" (Type: {detectedType})";

            return Ok(new { 
                success = true, 
                readRate, 
                writeRate, 
                message,
                details = new {
                    testTag,
                    durationSeconds = actualDuration,
                    readCount,
                    writeCount,
                    readErrors,
                    writeErrors,
                    tagExists = true,
                    detectedType
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running benchmark");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    private object GetTestValue(string type, object currentValue)
    {
        return type switch
        {
            "BOOL" => true,
            "SINT" => (sbyte)10,
            "INT" => (short)100,
            "DINT" => 1000,
            "LINT" => 10000L,
            "USINT" => (byte)10,
            "UINT" => (ushort)100,
            "UDINT" => 1000U,
            "ULINT" => 10000UL,
            "REAL" => 123.45f,
            "LREAL" => 123.45,
            "STRING" => "TEST",
            _ => currentValue
        };
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        try
        {
            var status = new
            {
                IsConnected = _plcService.IsConnected,
                Address = _plcService.CurrentAddress,
                IsHealthy = _plcService.IsHealthy,
                LastHealthCheck = _plcService.LastHealthCheck.ToString("HH:mm:ss.fff"),
                LastReadTimes = _plcService.LastReadTimes.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.ToString("HH:mm:ss.fff")
                )
            };
            return Ok(new { success = true, status });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class ConnectRequest
{
    public string Address { get; set; } = string.Empty;
}

public class WriteTagRequest
{
    public string Type { get; set; } = string.Empty;
    public object Value { get; set; } = null!;
}

public class BenchmarkRequest
{
    public string TestTag { get; set; } = string.Empty;
    public bool TestWrites { get; set; } = false;
    public int DurationSeconds { get; set; } = 5;
} 