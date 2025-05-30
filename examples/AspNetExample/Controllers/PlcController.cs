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
            // Try all types
            try { var v = _plcService.ReadBool(tagName); return Ok(new { success = true, value = v, type = "BOOL" }); } catch { }
            try { var v = _plcService.ReadDint(tagName); return Ok(new { success = true, value = v, type = "DINT" }); } catch { }
            try { var v = _plcService.ReadReal(tagName); return Ok(new { success = true, value = v, type = "REAL" }); } catch { }
            try { var v = _plcService.ReadString(tagName); return Ok(new { success = true, value = v, type = "STRING" }); } catch { }
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
                        return Ok(new { success = true, message = $"Wrote {boolValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid boolean value" });
                case "DINT":
                    if (int.TryParse(request.Value.ToString(), out int dintValue))
                    {
                        _plcService.WriteDint(tagName, dintValue);
                        return Ok(new { success = true, message = $"Wrote {dintValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid integer value" });
                case "REAL":
                    if (float.TryParse(request.Value.ToString(), out float realValue))
                    {
                        _plcService.WriteReal(tagName, realValue);
                        return Ok(new { success = true, message = $"Wrote {realValue} to {tagName}" });
                    }
                    return BadRequest(new { success = false, message = "Invalid float value" });
                case "STRING":
                    if (request.Value == null)
                        return BadRequest(new { success = false, message = "String value cannot be null" });
                    string stringValue = request.Value.ToString() ?? string.Empty;
                    _plcService.WriteString(tagName, stringValue);
                    return Ok(new { success = true, message = $"Wrote {stringValue} to {tagName}" });
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