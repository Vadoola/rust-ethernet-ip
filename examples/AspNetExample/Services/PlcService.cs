using System.Collections.Concurrent;
using RustEtherNetIp;
using Microsoft.Extensions.Logging;

namespace AspNetExample.Services;

public class PlcService : IDisposable
{
    private readonly ConcurrentDictionary<string, EtherNetIpClient> _clients = new();
    private readonly ILogger<PlcService> _logger;
    private readonly IConfiguration _configuration;

    public PlcService(ILogger<PlcService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public bool Connect(string plcAddress)
    {
        try
        {
            if (_clients.ContainsKey(plcAddress))
            {
                return true;
            }

            var client = new EtherNetIpClient();
            client.Connect(plcAddress);
            _clients.TryAdd(plcAddress, client);
            _logger.LogInformation("Connected to PLC at {PlcAddress}", plcAddress);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to PLC at {PlcAddress}", plcAddress);
            throw;
        }
    }

    public void Disconnect(string plcAddress)
    {
        if (_clients.TryRemove(plcAddress, out var client))
        {
            try
            {
                client.Disconnect();
                _logger.LogInformation("Disconnected from PLC at {PlcAddress}", plcAddress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disconnecting from PLC at {PlcAddress}", plcAddress);
                throw;
            }
        }
    }

    public object GetTagMetadata(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            // First try to read the tag to determine its type
            try
            {
                var boolValue = client.ReadBool(tagName);
                return new { type = "BOOL", value = boolValue };
            }
            catch { }

            try
            {
                var dintValue = client.ReadDint(tagName);
                return new { type = "DINT", value = dintValue };
            }
            catch { }

            try
            {
                var realValue = client.ReadReal(tagName);
                return new { type = "REAL", value = realValue };
            }
            catch { }

            try
            {
                var stringValue = client.ReadString(tagName);
                return new { type = "STRING", value = stringValue };
            }
            catch { }

            throw new Exception($"Could not determine type for tag {tagName}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metadata for tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public bool ReadBool(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadBool(tagName);
            _logger.LogInformation("Read bool tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading bool tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public int ReadDint(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadDint(tagName);
            _logger.LogInformation("Read dint tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading dint tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public float ReadReal(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadReal(tagName);
            _logger.LogInformation("Read real tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading real tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public string ReadString(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadString(tagName);
            _logger.LogInformation("Read string tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading string tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public Dictionary<string, object> ReadUdt(string plcAddress, string tagName)
    {
        if (_clients.TryGetValue(plcAddress, out var client))
        {
            try
            {
                return client.ReadUdt(tagName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading UDT tag {Tag} from PLC at {Address}", tagName, plcAddress);
                throw;
            }
        }
        throw new InvalidOperationException($"No connection to PLC at {plcAddress}");
    }

    public void WriteBool(string plcAddress, string tagName, bool value)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            _logger.LogInformation("Attempting to write bool value {Value} to tag {TagName} on PLC {PlcAddress}", 
                value, tagName, plcAddress);
            
            // First check if we can get metadata for the tag
            try
            {
                var metadata = client.GetTagMetadata(tagName);
                _logger.LogInformation("Tag metadata: DataType={DataType}, Scope={Scope}, ArrayDimension={ArrayDimension}, ArraySize={ArraySize}", 
                    metadata.DataType, metadata.Scope, metadata.ArrayDimension, metadata.ArraySize);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not get metadata for tag {TagName}: {Error}", tagName, ex.Message);
            }
            
            // First read the current value
            var currentValue = client.ReadBool(tagName);
            _logger.LogInformation("Current value of tag {TagName} is {Value}", tagName, currentValue);
            
            // Only write if the value is different
            if (currentValue != value)
            {
                _logger.LogInformation("Writing new value {Value} to tag {TagName}", value, tagName);
                
                // Convert the value to bytes in the correct order
                byte[] bytes = new byte[] { value ? (byte)0xFF : (byte)0x00 };
                _logger.LogInformation("Writing bytes: [{Bytes}]", string.Join(", ", bytes.Select(b => $"0x{b:X2}")));
                
                client.WriteBool(tagName, value);
                
                // Add a small delay to allow the PLC to process the write
                Thread.Sleep(100);
                
                // Verify the write by reading the value back
                var readValue = client.ReadBool(tagName);
                if (readValue != value)
                {
                    _logger.LogWarning("Write verification failed for bool tag {TagName}. Expected: {Expected}, Got: {Actual}", 
                        tagName, value, readValue);
                    throw new Exception($"Write verification failed. Expected: {value}, Got: {readValue}. The tag might be read-only or protected.");
                }
                
                _logger.LogInformation("Successfully wrote and verified bool value {Value} to tag {TagName} on PLC {PlcAddress}", 
                    value, tagName, plcAddress);
            }
            else
            {
                _logger.LogInformation("Tag {TagName} already has the desired value {Value}", tagName, value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing bool tag {TagName} to PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public void WriteDint(string plcAddress, string tagName, int value)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            _logger.LogInformation("Attempting to write dint value {Value} to tag {TagName} on PLC {PlcAddress}", 
                value, tagName, plcAddress);
            
            // First check if we can get metadata for the tag
            try
            {
                var metadata = client.GetTagMetadata(tagName);
                _logger.LogInformation("Tag metadata: DataType={DataType}, Scope={Scope}, ArrayDimension={ArrayDimension}, ArraySize={ArraySize}", 
                    metadata.DataType, metadata.Scope, metadata.ArrayDimension, metadata.ArraySize);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not get metadata for tag {TagName}: {Error}", tagName, ex.Message);
            }
            
            // First read the current value
            var currentValue = client.ReadDint(tagName);
            _logger.LogInformation("Current value of tag {TagName} is {Value}", tagName, currentValue);
            
            // Only write if the value is different
            if (currentValue != value)
            {
                _logger.LogInformation("Writing new value {Value} to tag {TagName}", value, tagName);
                
                // Write the value
                client.WriteDint(tagName, value);
                
                // Add a small delay to allow the PLC to process the write
                Thread.Sleep(100);
                
                // Verify the write by reading the value back
                var readValue = client.ReadDint(tagName);
                if (readValue != value)
                {
                    _logger.LogWarning("Write verification failed for dint tag {TagName}. Expected: {Expected}, Got: {Actual}", 
                        tagName, value, readValue);
                    throw new Exception($"Write verification failed. Expected: {value}, Got: {readValue}. The tag might be read-only or protected.");
                }
                
                _logger.LogInformation("Successfully wrote and verified dint value {Value} to tag {TagName} on PLC {PlcAddress}", 
                    value, tagName, plcAddress);
            }
            else
            {
                _logger.LogInformation("Tag {TagName} already has the desired value {Value}", tagName, value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing dint tag {TagName} to PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public void WriteReal(string plcAddress, string tagName, float value)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            _logger.LogInformation("Attempting to write real value {Value} to tag {TagName} on PLC {PlcAddress}", 
                value, tagName, plcAddress);
            
            // First read the current value
            var currentValue = client.ReadReal(tagName);
            _logger.LogInformation("Current value of tag {TagName} is {Value}", tagName, currentValue);
            
            // Only write if the value is different (using a small epsilon for float comparison)
            if (Math.Abs(currentValue - value) > 0.0001)
            {
                _logger.LogInformation("Writing new value {Value} to tag {TagName}", value, tagName);
                
                // Convert the value to bytes in the correct order
                byte[] bytes = BitConverter.GetBytes(value);
                if (BitConverter.IsLittleEndian)
                {
                    Array.Reverse(bytes);
                }
                _logger.LogInformation("Writing bytes: [{Bytes}]", string.Join(", ", bytes.Select(b => $"0x{b:X2}")));
                
                client.WriteReal(tagName, value);
                
                // Add a small delay to allow the PLC to process the write
                Thread.Sleep(100);
                
                // Verify the write by reading the value back
                var readValue = client.ReadReal(tagName);
                if (Math.Abs(readValue - value) > 0.0001)
                {
                    _logger.LogWarning("Write verification failed for real tag {TagName}. Expected: {Expected}, Got: {Actual}", 
                        tagName, value, readValue);
                    throw new Exception($"Write verification failed. Expected: {value}, Got: {readValue}. The tag might be read-only or protected.");
                }
                
                _logger.LogInformation("Successfully wrote and verified real value {Value} to tag {TagName} on PLC {PlcAddress}", 
                    value, tagName, plcAddress);
            }
            else
            {
                _logger.LogInformation("Tag {TagName} already has the desired value {Value}", tagName, value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing real tag {TagName} to PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public void WriteString(string plcAddress, string tagName, string value)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            _logger.LogInformation("Attempting to write string value '{Value}' to tag {TagName} on PLC {PlcAddress}", 
                value, tagName, plcAddress);
            
            client.WriteString(tagName, value);
            
            // Verify the write by reading the value back
            var readValue = client.ReadString(tagName);
            if (readValue != value)
            {
                _logger.LogWarning("Write verification failed for string tag {TagName}. Expected: '{Expected}', Got: '{Actual}'", 
                    tagName, value, readValue);
                throw new Exception($"Write verification failed. Expected: '{value}', Got: '{readValue}'");
            }
            
            _logger.LogInformation("Successfully wrote and verified string value '{Value}' to tag {TagName} on PLC {PlcAddress}", 
                value, tagName, plcAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing string tag {TagName} to PLC at {PlcAddress}", tagName, plcAddress);
            throw;
        }
    }

    public void WriteUdt(string plcAddress, string tagName, Dictionary<string, object> value)
    {
        if (_clients.TryGetValue(plcAddress, out var client))
        {
            try
            {
                client.WriteUdt(tagName, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing UDT tag {Tag} to PLC at {Address}", tagName, plcAddress);
                throw;
            }
        }
        else
        {
            throw new InvalidOperationException($"No connection to PLC at {plcAddress}");
        }
    }

    public void Dispose()
    {
        foreach (var client in _clients.Values)
        {
            try
            {
                client.Disconnect();
            }
            catch
            {
                // Ignore errors during cleanup
            }
        }
        _clients.Clear();
    }

    public class TagNotFoundException : Exception { public TagNotFoundException(string tag) : base($"Tag not found: {tag}") { } }
    public class TagTypeMismatchException : Exception { public TagTypeMismatchException(string tag, string expected, string actual) : base($"Type mismatch for tag '{tag}': expected {expected}, got {actual}") { } }
    public class TagReadOnlyException : Exception { public TagReadOnlyException(string tag) : base($"Tag is read-only: {tag}") { } }
    public class PlcNotConnectedException : Exception { public PlcNotConnectedException(string address) : base($"Not connected to PLC at {address}") { } }
    public class PlcProtocolException : Exception { public PlcProtocolException(string msg) : base(msg) { } }

    public (bool Success, int? Value, string? Error) TryReadDint(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            var err = $"Not connected to PLC at {plcAddress}";
            _logger.LogError(err);
            return (false, null, err);
        }
        try
        {
            var value = client.ReadDint(tagName);
            _logger.LogInformation("Read DINT tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return (true, value, null);
        }
        catch (TagNotFoundException ex)
        {
            _logger.LogError(ex, "Tag not found: {TagName}", tagName);
            return (false, null, ex.Message);
        }
        catch (TagTypeMismatchException ex)
        {
            _logger.LogError(ex, "Type mismatch for tag: {TagName}", tagName);
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading DINT tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return (false, null, ex.Message);
        }
    }

    public (bool Success, bool Value, string? Error) TryReadBool(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            return (false, false, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadBool(tagName);
            _logger.LogInformation("Read bool tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return (true, value, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading bool tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return (false, false, ex.Message);
        }
    }

    public (bool Success, float Value, string? Error) TryReadReal(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            return (false, 0, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadReal(tagName);
            _logger.LogInformation("Read real tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return (true, value, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading real tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return (false, 0, ex.Message);
        }
    }

    public (bool Success, string Value, string? Error) TryReadString(string plcAddress, string tagName)
    {
        if (!_clients.TryGetValue(plcAddress, out var client))
        {
            return (false, string.Empty, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = client.ReadString(tagName);
            _logger.LogInformation("Read string tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return (true, value, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading string tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return (false, string.Empty, ex.Message);
        }
    }
} 