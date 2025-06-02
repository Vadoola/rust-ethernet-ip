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
    public IActionResult RunBenchmark()
    {
        if (!_plcService.IsConnected)
            return StatusCode(503, new { success = false, message = "Not connected to PLC" });

        try
        {
            var startTime = DateTime.Now;
            var readCount = 0;
            var writeCount = 0;
            while ((DateTime.Now - startTime).TotalSeconds < 5)
            {
                try { _plcService.ReadBool("TestTag"); readCount++; } catch { }
                try { _plcService.WriteBool("TestTag", true); writeCount++; } catch { }
            }
            var readRate = (int)(readCount / 5.0);
            var writeRate = (int)(writeCount / 5.0);
            return Ok(new { success = true, readRate, writeRate, message = $"Benchmark complete: {readRate} reads/sec, {writeRate} writes/sec" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running benchmark");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
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