using System.Collections.Concurrent;
using RustEtherNetIp;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Threading;

namespace AspNetExample.Services;

public class PlcService : IDisposable
{
    private EtherNetIpClient _plcClient;
    private bool _isConnected;
    private string _currentAddress;
    private readonly ConcurrentDictionary<string, DateTime> _lastReadTimes = new();
    private readonly ILogger<PlcService> _logger;
    private readonly IConfiguration _configuration;
    private const int MAX_RETRIES = 3;
    private const int RETRY_DELAY = 1000;
    private readonly SemaphoreSlim _tagOperationLock = new(1, 1);

    public PlcService(ILogger<PlcService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _plcClient = new EtherNetIpClient();
        _isConnected = false;
        _currentAddress = string.Empty;
    }

    public bool Connect(string address)
    {
        if (_isConnected && _currentAddress == address)
            return true;

        if (_plcClient != null)
            _plcClient.Dispose();

        _plcClient = new EtherNetIpClient();
        _isConnected = _plcClient.Connect(address);
        _currentAddress = address;
        return _isConnected;
    }

    public void Disconnect()
    {
        if (_plcClient != null)
            _plcClient.Dispose();
        _plcClient = new EtherNetIpClient();
        _isConnected = false;
        _currentAddress = string.Empty;
        _lastReadTimes.Clear();
    }

    public bool IsConnected => _isConnected;
    public string CurrentAddress => _currentAddress;
    public EtherNetIpClient Client => _plcClient;

    public bool ReadBool(string tagName)
    {
        var value = _plcClient.ReadBool(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public sbyte ReadSint(string tagName)
    {
        var value = _plcClient.ReadSint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public short ReadInt(string tagName)
    {
        var value = _plcClient.ReadInt(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public int ReadDint(string tagName)
    {
        var value = _plcClient.ReadDint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public long ReadLint(string tagName)
    {
        var value = _plcClient.ReadLint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public byte ReadUsint(string tagName)
    {
        var value = _plcClient.ReadUsint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public ushort ReadUint(string tagName)
    {
        var value = _plcClient.ReadUint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public uint ReadUdint(string tagName)
    {
        var value = _plcClient.ReadUdint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public ulong ReadUlint(string tagName)
    {
        var value = _plcClient.ReadUlint(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public float ReadReal(string tagName)
    {
        var value = _plcClient.ReadReal(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public double ReadLreal(string tagName)
    {
        var value = _plcClient.ReadLreal(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public string ReadString(string tagName)
    {
        var value = _plcClient.ReadString(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public Dictionary<string, object> ReadUdt(string tagName)
    {
        var value = _plcClient.ReadUdt(tagName);
        UpdateLastReadTime(tagName);
        return value;
    }
    
    public void WriteBool(string tagName, bool value) => _plcClient.WriteBool(tagName, value);
    public void WriteSint(string tagName, sbyte value) => _plcClient.WriteSint(tagName, value);
    public void WriteInt(string tagName, short value) => _plcClient.WriteInt(tagName, value);
    public void WriteDint(string tagName, int value) => _plcClient.WriteDint(tagName, value);
    public void WriteLint(string tagName, long value) => _plcClient.WriteLint(tagName, value);
    public void WriteUsint(string tagName, byte value) => _plcClient.WriteUsint(tagName, value);
    public void WriteUint(string tagName, ushort value) => _plcClient.WriteUint(tagName, value);
    public void WriteUdint(string tagName, uint value) => _plcClient.WriteUdint(tagName, value);
    public void WriteUlint(string tagName, ulong value) => _plcClient.WriteUlint(tagName, value);
    public void WriteReal(string tagName, float value) => _plcClient.WriteReal(tagName, value);
    public void WriteLreal(string tagName, double value) => _plcClient.WriteLreal(tagName, value);
    public void WriteString(string tagName, string value) => _plcClient.WriteString(tagName, value);
    public void WriteUdt(string tagName, Dictionary<string, object> value) => _plcClient.WriteUdt(tagName, value);

    private void UpdateLastReadTime(string tagName)
    {
        _lastReadTimes.AddOrUpdate(tagName, DateTime.Now, (_, _) => DateTime.Now);
    }

    public ConcurrentDictionary<string, DateTime> LastReadTimes => _lastReadTimes;

    public object GetTagMetadata(string plcAddress, string tagName)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            // First try to read the tag to determine its type
            try
            {
                var boolValue = _plcClient.ReadBool(tagName);
                return new { type = "BOOL", value = boolValue };
            }
            catch { }

            try
            {
                var dintValue = _plcClient.ReadDint(tagName);
                return new { type = "DINT", value = dintValue };
            }
            catch { }

            try
            {
                var realValue = _plcClient.ReadReal(tagName);
                return new { type = "REAL", value = realValue };
            }
            catch { }

            try
            {
                var stringValue = _plcClient.ReadString(tagName);
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

    public Dictionary<string, object> ReadUdt(string plcAddress, string tagName)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            return _plcClient.ReadUdt(tagName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading UDT tag {Tag} from PLC at {Address}", tagName, plcAddress);
            throw;
        }
    }

    public void WriteUdt(string plcAddress, string tagName, Dictionary<string, object> value)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            throw new Exception($"Not connected to PLC at {plcAddress}");
        }

        try
        {
            _plcClient.WriteUdt(tagName, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing UDT tag {Tag} to PLC at {Address}", tagName, plcAddress);
            throw;
        }
    }

    public void Dispose()
    {
        if (_plcClient != null)
        {
            try
            {
                _plcClient.Disconnect();
            }
            catch
            {
                // Ignore errors during cleanup
            }
        }
    }

    public class TagNotFoundException : Exception { public TagNotFoundException(string tag) : base($"Tag not found: {tag}") { } }
    public class TagTypeMismatchException : Exception { public TagTypeMismatchException(string tag, string expected, string actual) : base($"Type mismatch for tag '{tag}': expected {expected}, got {actual}") { } }
    public class TagReadOnlyException : Exception { public TagReadOnlyException(string tag) : base($"Tag is read-only: {tag}") { } }
    public class PlcNotConnectedException : Exception { public PlcNotConnectedException(string address) : base($"Not connected to PLC at {address}") { } }
    public class PlcProtocolException : Exception { public PlcProtocolException(string msg) : base(msg) { } }

    public (bool Success, int? Value, string? Error) TryReadDint(string plcAddress, string tagName)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            var err = $"Not connected to PLC at {plcAddress}";
            _logger.LogError(err);
            return (false, null, err);
        }
        try
        {
            var value = _plcClient.ReadDint(tagName);
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
        if (!_isConnected || _currentAddress != plcAddress)
        {
            return (false, false, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = _plcClient.ReadBool(tagName);
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
        if (!_isConnected || _currentAddress != plcAddress)
        {
            return (false, 0, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = _plcClient.ReadReal(tagName);
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
        if (!_isConnected || _currentAddress != plcAddress)
        {
            return (false, string.Empty, $"Not connected to PLC at {plcAddress}");
        }

        try
        {
            var value = _plcClient.ReadString(tagName);
            _logger.LogInformation("Read string tag {TagName} from PLC at {PlcAddress}: {Value}", tagName, plcAddress, value);
            return (true, value, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading string tag {TagName} from PLC at {PlcAddress}", tagName, plcAddress);
            return (false, string.Empty, ex.Message);
        }
    }

    private async Task<T> RetryOperation<T>(Func<Task<T>> operation, string operationName)
    {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++)
        {
            try
            {
                await _tagOperationLock.WaitAsync();
                try
                {
                    return await operation();
                }
                finally
                {
                    _tagOperationLock.Release();
                }
            }
            catch (Exception ex)
            {
                if (attempt == MAX_RETRIES - 1)
                {
                    _logger.LogError(ex, "{Operation} failed after {MaxRetries} attempts", operationName, MAX_RETRIES);
                    throw;
                }
                _logger.LogWarning(ex, "{Operation} attempt {Attempt} failed", operationName, attempt + 1);
                await Task.Delay(RETRY_DELAY * (int)Math.Pow(2, attempt));
            }
        }
        throw new Exception($"{operationName} failed after {MAX_RETRIES} attempts");
    }

    public async Task<(bool success, string type, string value)> ReadTag(string plcAddress, string tagName)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            throw new PlcNotConnectedException(plcAddress);
        }

        return await RetryOperation(async () =>
        {
            try
            {
                // Try to read as different types
                try
                {
                    var value = _plcClient.ReadBool(tagName);
                    return (true, "BOOL", value.ToString());
                }
                catch { }

                try
                {
                    var value = _plcClient.ReadInt(tagName);
                    return (true, "INT", value.ToString());
                }
                catch { }

                try
                {
                    var value = _plcClient.ReadReal(tagName);
                    return (true, "REAL", value.ToString());
                }
                catch { }

                try
                {
                    var value = _plcClient.ReadString(tagName);
                    return (true, "STRING", value);
                }
                catch { }

                return (false, "UNKNOWN", string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading tag {Tag} from PLC at {Address}", tagName, plcAddress);
                throw;
            }
        }, $"Read tag {tagName}");
    }

    public async Task WriteTag(string plcAddress, string tagName, string value, string dataType)
    {
        if (!_isConnected || _currentAddress != plcAddress)
        {
            throw new PlcNotConnectedException(plcAddress);
        }

        await RetryOperation(async () =>
        {
            try
            {
                switch (dataType.ToUpper())
                {
                    case "BOOL":
                        _plcClient.WriteBool(tagName, bool.Parse(value));
                        break;
                    case "INT":
                        _plcClient.WriteInt(tagName, short.Parse(value));
                        break;
                    case "DINT":
                        _plcClient.WriteDint(tagName, int.Parse(value));
                        break;
                    case "REAL":
                        _plcClient.WriteReal(tagName, float.Parse(value));
                        break;
                    case "STRING":
                        _plcClient.WriteString(tagName, value);
                        break;
                    default:
                        throw new TagTypeMismatchException(tagName, dataType, "Unsupported type");
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing tag {Tag} to PLC at {Address}", tagName, plcAddress);
                throw;
            }
        }, $"Write tag {tagName}");
    }
} 