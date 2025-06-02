using Microsoft.AspNetCore.Mvc;
using AspNetExample.Services;
using System;
using System.Threading.Tasks;

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
        if (string.IsNullOrEmpty(request.Address))
            return BadRequest(new { success = false, message = "PLC address is required" });

        var connected = _plcService.Connect(request.Address);
        if (connected)
            return Ok(new { success = true, message = "Connected successfully" });
        else
            return BadRequest(new { success = false, message = "Connection failed" });
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

        try
        {
            // Try all types in order for proper detection
            try { var v = _plcService.ReadBool(tagName); return Ok(new { success = true, value = v, type = "BOOL" }); } catch { }
            try { var v = _plcService.ReadSint(tagName); return Ok(new { success = true, value = v, type = "SINT" }); } catch { }
            try { var v = _plcService.ReadInt(tagName); return Ok(new { success = true, value = v, type = "INT" }); } catch { }
            try { var v = _plcService.ReadDint(tagName); return Ok(new { success = true, value = v, type = "DINT" }); } catch { }
            try { var v = _plcService.ReadLint(tagName); return Ok(new { success = true, value = v, type = "LINT" }); } catch { }
            try { var v = _plcService.ReadUsint(tagName); return Ok(new { success = true, value = v, type = "USINT" }); } catch { }
            try { var v = _plcService.ReadUint(tagName); return Ok(new { success = true, value = v, type = "UINT" }); } catch { }
            try { var v = _plcService.ReadUdint(tagName); return Ok(new { success = true, value = v, type = "UDINT" }); } catch { }
            try { var v = _plcService.ReadUlint(tagName); return Ok(new { success = true, value = v, type = "ULINT" }); } catch { }
            try { var v = _plcService.ReadReal(tagName); return Ok(new { success = true, value = v, type = "REAL" }); } catch { }
            try { var v = _plcService.ReadLreal(tagName); return Ok(new { success = true, value = v, type = "LREAL" }); } catch { }
            try { var v = _plcService.ReadString(tagName); return Ok(new { success = true, value = v, type = "STRING" }); } catch { }
            try { var v = _plcService.ReadUdt(tagName); return Ok(new { success = true, value = v, type = "UDT" }); } catch { }
            return NotFound(new { success = false, message = $"Could not read tag {tagName}" });
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