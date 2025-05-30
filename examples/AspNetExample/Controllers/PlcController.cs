using Microsoft.AspNetCore.Mvc;
using AspNetExample.Services;

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
        try
        {
            var success = _plcService.Connect(request.PlcAddress);
            return Ok(new { success });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to PLC at {PlcAddress}", request.PlcAddress);
            return Ok(new { success = false, error = ex.Message });
        }
    }

    [HttpPost("disconnect")]
    public IActionResult Disconnect([FromBody] ConnectRequest request)
    {
        try
        {
            _plcService.Disconnect(request.PlcAddress);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting from PLC at {PlcAddress}", request.PlcAddress);
            return Ok(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("discover")]
    public IActionResult DiscoverTag([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        try
        {
            var metadata = _plcService.GetTagMetadata(plcAddress, tagName);
            return Ok(new { success = true, metadata });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return Ok(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("read/bool")]
    public IActionResult ReadBool([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        var result = _plcService.TryReadBool(plcAddress, tagName);
        if (result.Success)
            return Ok(new { value = result.Value });
        if (result.Error != null && result.Error.Contains("not found"))
            return NotFound(new { error = result.Error });
        if (result.Error != null && result.Error.Contains("Type mismatch"))
            return BadRequest(new { error = result.Error });
        return StatusCode(500, new { error = result.Error ?? "Unknown error" });
    }

    [HttpGet("read/dint")]
    public IActionResult ReadDint([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        var result = _plcService.TryReadDint(plcAddress, tagName);
        if (result.Success)
            return Ok(new { value = result.Value });
        if (result.Error != null && result.Error.Contains("not found"))
            return NotFound(new { error = result.Error });
        if (result.Error != null && result.Error.Contains("Type mismatch"))
            return BadRequest(new { error = result.Error });
        return StatusCode(500, new { error = result.Error ?? "Unknown error" });
    }

    [HttpGet("read/real")]
    public IActionResult ReadReal([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        var result = _plcService.TryReadReal(plcAddress, tagName);
        if (result.Success)
            return Ok(new { value = result.Value });
        if (result.Error != null && result.Error.Contains("not found"))
            return NotFound(new { error = result.Error });
        if (result.Error != null && result.Error.Contains("Type mismatch"))
            return BadRequest(new { error = result.Error });
        return StatusCode(500, new { error = result.Error ?? "Unknown error" });
    }

    [HttpGet("read/string")]
    public IActionResult ReadString([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        var result = _plcService.TryReadString(plcAddress, tagName);
        if (result.Success)
            return Ok(new { value = result.Value });
        if (result.Error != null && result.Error.Contains("not found"))
            return NotFound(new { error = result.Error });
        if (result.Error != null && result.Error.Contains("Type mismatch"))
            return BadRequest(new { error = result.Error });
        return StatusCode(500, new { error = result.Error ?? "Unknown error" });
    }

    [HttpGet("read/udt")]
    public IActionResult ReadUdt([FromQuery] string plcAddress, [FromQuery] string tagName)
    {
        try
        {
            var value = _plcService.ReadUdt(plcAddress, tagName);
            return Ok(new { Value = value });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading UDT tag {Tag} from PLC at {Address}", tagName, plcAddress);
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("write/bool")]
    public IActionResult WriteBool([FromBody] WriteBoolRequest request)
    {
        try
        {
            _logger.LogInformation("Received write bool request: PlcAddress={PlcAddress}, TagName={TagName}, Value={Value}", 
                request.PlcAddress, request.TagName, request.Value);

            if (string.IsNullOrEmpty(request.PlcAddress))
                return BadRequest(new { success = false, error = "PLC address is required" });
            if (string.IsNullOrEmpty(request.TagName))
                return BadRequest(new { success = false, error = "Tag name is required" });

            _plcService.WriteBool(request.PlcAddress, request.TagName, request.Value);
            _logger.LogInformation("Successfully wrote bool value {Value} to tag {TagName} on PLC {PlcAddress}", 
                request.Value, request.TagName, request.PlcAddress);
            return Ok(new { success = true, message = $"Successfully wrote {request.Value} to {request.TagName}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing bool tag {TagName} to PLC at {PlcAddress}", request.TagName, request.PlcAddress);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("write/dint")]
    public IActionResult WriteDint([FromBody] WriteDintRequest request)
    {
        try
        {
            _logger.LogInformation("Received write dint request: PlcAddress={PlcAddress}, TagName={TagName}, Value={Value}", 
                request.PlcAddress, request.TagName, request.Value);

            if (string.IsNullOrEmpty(request.PlcAddress))
                return BadRequest(new { success = false, error = "PLC address is required" });
            if (string.IsNullOrEmpty(request.TagName))
                return BadRequest(new { success = false, error = "Tag name is required" });

            _plcService.WriteDint(request.PlcAddress, request.TagName, request.Value);
            _logger.LogInformation("Successfully wrote dint value {Value} to tag {TagName} on PLC {PlcAddress}", 
                request.Value, request.TagName, request.PlcAddress);
            return Ok(new { success = true, message = $"Successfully wrote {request.Value} to {request.TagName}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing dint tag {TagName} to PLC at {PlcAddress}", request.TagName, request.PlcAddress);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("write/real")]
    public IActionResult WriteReal([FromBody] WriteRealRequest request)
    {
        try
        {
            _logger.LogInformation("Received write real request: PlcAddress={PlcAddress}, TagName={TagName}, Value={Value}", 
                request.PlcAddress, request.TagName, request.Value);

            if (string.IsNullOrEmpty(request.PlcAddress))
                return BadRequest(new { success = false, error = "PLC address is required" });
            if (string.IsNullOrEmpty(request.TagName))
                return BadRequest(new { success = false, error = "Tag name is required" });

            _plcService.WriteReal(request.PlcAddress, request.TagName, request.Value);
            _logger.LogInformation("Successfully wrote real value {Value} to tag {TagName} on PLC {PlcAddress}", 
                request.Value, request.TagName, request.PlcAddress);
            return Ok(new { success = true, message = $"Successfully wrote {request.Value} to {request.TagName}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing real tag {TagName} to PLC at {PlcAddress}", request.TagName, request.PlcAddress);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("write/string")]
    public IActionResult WriteString([FromBody] WriteStringRequest request)
    {
        try
        {
            _logger.LogInformation("Received write string request: PlcAddress={PlcAddress}, TagName={TagName}, Value={Value}", 
                request.PlcAddress, request.TagName, request.Value);

            if (string.IsNullOrEmpty(request.PlcAddress))
                return BadRequest(new { success = false, error = "PLC address is required" });
            if (string.IsNullOrEmpty(request.TagName))
                return BadRequest(new { success = false, error = "Tag name is required" });
            if (request.Value == null)
                return BadRequest(new { success = false, error = "Value is required" });

            _plcService.WriteString(request.PlcAddress, request.TagName, request.Value);
            _logger.LogInformation("Successfully wrote string value '{Value}' to tag {TagName} on PLC {PlcAddress}", 
                request.Value, request.TagName, request.PlcAddress);
            return Ok(new { success = true, message = $"Successfully wrote '{request.Value}' to {request.TagName}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing string tag {TagName} to PLC at {PlcAddress}", request.TagName, request.PlcAddress);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("write/udt")]
    public IActionResult WriteUdt([FromBody] WriteUdtRequest request)
    {
        try
        {
            _plcService.WriteUdt(request.PlcAddress, request.TagName, request.Value);
            return Ok(new { Success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing UDT tag {Tag} to PLC at {Address}", request.TagName, request.PlcAddress);
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}

public class ConnectRequest
{
    public string PlcAddress { get; set; } = string.Empty;
}

public class WriteBoolRequest
{
    public string PlcAddress { get; set; } = string.Empty;
    public string TagName { get; set; } = string.Empty;
    public bool Value { get; set; }
}

public class WriteDintRequest
{
    public string PlcAddress { get; set; } = string.Empty;
    public string TagName { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class WriteRealRequest
{
    public string PlcAddress { get; set; } = string.Empty;
    public string TagName { get; set; } = string.Empty;
    public float Value { get; set; }
}

public class WriteStringRequest
{
    public string PlcAddress { get; set; } = string.Empty;
    public string TagName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class WriteUdtRequest
{
    public string PlcAddress { get; set; } = string.Empty;
    public string TagName { get; set; } = string.Empty;
    public Dictionary<string, object> Value { get; set; } = new();
} 