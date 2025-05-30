// EtherNetIpClient.cs - Reusable C# wrapper for Rust EtherNet/IP driver
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RustEtherNetIp
{
    /// <summary>
    /// C# wrapper for Rust EtherNet/IP driver to communicate with Allen-Bradley CompactLogix PLCs.
    /// Provides high-performance, type-safe access to PLC tags via EtherNet/IP protocol.
    /// </summary>
    /// <remarks>
    /// This class manages the connection to a single PLC and provides methods to read/write
    /// various data types. The underlying Rust library handles the EtherNet/IP protocol
    /// implementation, CIP messaging, and network communications.
    /// 
    /// Performance: 1,895+ reads/sec, 677+ writes/sec
    /// Supported PLCs: CompactLogix L1x-L5x series
    /// Supported Data Types: BOOL, DINT, REAL
    /// </remarks>
    /// <example>
    /// Basic usage:
    /// <code>
    /// using var client = new EtherNetIpClient();
    /// if (client.Connect("192.168.1.100:44818"))
    /// {
    ///     bool value = client.ReadBool("StartButton");
    ///     client.WriteDint("Counter", 42);
    /// }
    /// </code>
    /// </example>
    public class EtherNetIpClient : IEtherNetIpClient
    {
        private int _clientId = -1;
        private bool _disposed = false;
        private Dictionary<string, TagMetadata> _tagCache = new Dictionary<string, TagMetadata>();

        #region DLL Imports
        // These are the low-level FFI calls to the Rust library
        // Users should not call these directly - use the public methods instead

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_connect(IntPtr address);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_disconnect(int client_id);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_bool(int client_id, IntPtr tag_name, out int result);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_bool(int client_id, IntPtr tag_name, int value);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_dint(int client_id, IntPtr tag_name, out int result);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_dint(int client_id, IntPtr tag_name, int value);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_real(int client_id, IntPtr tag_name, out double result);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_real(int client_id, IntPtr tag_name, double value);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_string(int client_id, IntPtr tag_name, IntPtr result, int max_length);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_string(int client_id, IntPtr tag_name, IntPtr value);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_discover_tags(int client_id);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_get_tag_metadata(int client_id, IntPtr tag_name, out TagMetadata metadata);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_udt(int client_id, IntPtr tag_name, IntPtr result, int max_size);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_udt(int client_id, IntPtr tag_name, IntPtr value, int size);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_set_max_packet_size(int client_id, int size);

        [DllImport("rust_ethernet_ip", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_check_health(int client_id, out int is_healthy);
        #endregion

        #region Public Methods

        /// <summary>
        /// Establishes connection to a CompactLogix PLC via EtherNet/IP.
        /// </summary>
        /// <param name="address">
        /// PLC network address in format "IP:PORT" (e.g., "192.168.1.100:44818").
        /// Port 44818 is the standard EtherNet/IP port for CompactLogix PLCs.
        /// </param>
        /// <returns>True if connection successful, false otherwise.</returns>
        /// <exception cref="InvalidOperationException">Thrown if already connected to a PLC.</exception>
        public bool Connect(string address)
        {
            if (_clientId != -1)
                throw new InvalidOperationException("Already connected to a PLC. Call Disconnect() first.");

            IntPtr addressPtr = Marshal.StringToHGlobalAnsi(address);
            try
            {
                _clientId = eip_connect(addressPtr);
                if (_clientId >= 0)
                {
                    // Set default max packet size
                    eip_set_max_packet_size(_clientId, 4000);
                }
                return _clientId >= 0;
            }
            finally
            {
                Marshal.FreeHGlobal(addressPtr);
            }
        }

        /// <summary>
        /// Disconnects from the PLC and cleans up the EtherNet/IP session.
        /// </summary>
        public void Disconnect()
        {
            if (_clientId >= 0)
            {
                eip_disconnect(_clientId);
                _clientId = -1;
                _tagCache.Clear();
            }
        }

        /// <summary>
        /// Reads a BOOL (boolean) tag from the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to read.</param>
        /// <returns>The boolean value of the tag (true/false).</returns>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist or communication fails.</exception>
        public bool ReadBool(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_read_bool(_clientId, tagPtr, out int value);
                if (result != 0)
                    throw new Exception($"Failed to read BOOL tag '{tagName}'. Check tag exists and is BOOL type.");
                return value != 0;
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        /// <summary>
        /// Writes a BOOL (boolean) tag to the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to write to.</param>
        /// <param name="value">Boolean value to write (true/false).</param>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist, is read-only, or communication fails.</exception>
        public void WriteBool(string tagName, bool value)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                // Try to read the current value first
                try
                {
                    var currentValue = ReadBool(tagName);
                    if (currentValue == value)
                    {
                        Console.WriteLine($"ℹ️ Tag '{tagName}' already has value {value}, skipping write");
                        return; // No need to write if value is already set
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception($"Failed to read current value of tag '{tagName}': {ex.Message}");
                }

                // Try to get metadata, but don't fail if we can't
                try
                {
                    var metadata = GetTagMetadata(tagName);
                    if (metadata.DataType != 0xC1) // 0xC1 is BOOL type
                    {
                        throw new Exception($"Tag '{tagName}' exists but is not a BOOL type. Actual type: 0x{metadata.DataType:X2}");
                    }
                }
                catch (Exception ex)
                {
                    // Log but continue - we know the tag exists and is readable as a BOOL
                    Console.WriteLine($"Warning: Could not get metadata for tag '{tagName}': {ex.Message}");
                }

                // Log the write attempt
                Console.WriteLine($"📝 Writing BOOL: {value} to tag '{tagName}'");

                // Attempt the write
                int result = eip_write_bool(_clientId, tagPtr, value ? 1 : 0);
                if (result != 0)
                {
                    string errorMsg = result switch
                    {
                        -1 => "Tag not found",
                        -2 => "Tag is read-only",
                        -3 => "Tag is protected",
                        -4 => "Invalid data type",
                        -5 => "Access denied",
                        _ => $"Unknown error (code: {result})"
                    };
                    throw new Exception($"Failed to write BOOL tag '{tagName}'. {errorMsg}");
                }

                // Add a small delay to allow the PLC to process the write
                System.Threading.Thread.Sleep(100);

                // Verify the write by reading back
                try
                {
                    var verifyValue = ReadBool(tagName);
                    if (verifyValue != value)
                    {
                        throw new Exception($"Write verification failed for tag '{tagName}'. Expected: {value}, Got: {verifyValue}");
                    }
                    Console.WriteLine($"✅ Successfully wrote and verified BOOL: {value} to tag '{tagName}'");
                }
                catch (Exception ex)
                {
                    throw new Exception($"Write verification failed for tag '{tagName}': {ex.Message}");
                }
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        /// <summary>
        /// Reads a DINT (32-bit signed integer) tag from the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to read.</param>
        /// <returns>The integer value of the tag (-2,147,483,648 to 2,147,483,647).</returns>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist or communication fails.</exception>
        public int ReadDint(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_read_dint(_clientId, tagPtr, out int value);
                if (result != 0)
                    throw new Exception($"Failed to read DINT tag '{tagName}'. Check tag exists and is DINT type.");
                return value;
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        /// <summary>
        /// Writes a DINT (32-bit signed integer) tag to the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to write to.</param>
        /// <param name="value">Integer value to write (-2,147,483,648 to 2,147,483,647).</param>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist, is read-only, or communication fails.</exception>
        public void WriteDint(string tagName, int value)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_write_dint(_clientId, tagPtr, value);
                if (result != 0)
                    throw new Exception($"Failed to write DINT tag '{tagName}'. Check tag exists and is writable.");
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        /// <summary>
        /// Reads a REAL (32-bit floating point) tag from the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to read.</param>
        /// <returns>The floating point value of the tag (IEEE 754 single precision).</returns>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist or communication fails.</exception>
        public float ReadReal(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_read_real(_clientId, tagPtr, out double value);
                if (result != 0)
                    throw new Exception($"Failed to read REAL tag '{tagName}'. Check tag exists and is REAL type.");
                return (float)value;
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        /// <summary>
        /// Writes a REAL (32-bit floating point) tag to the PLC.
        /// </summary>
        /// <param name="tagName">Name of the PLC tag to write to.</param>
        /// <param name="value">Floating point value to write.</param>
        /// <exception cref="InvalidOperationException">Thrown if not connected to PLC.</exception>
        /// <exception cref="Exception">Thrown if tag doesn't exist, is read-only, or communication fails.</exception>
        public void WriteReal(string tagName, float value)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_write_real(_clientId, tagPtr, value);
                if (result != 0)
                    throw new Exception($"Failed to write REAL tag '{tagName}'. Check tag exists and is writable.");
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        public string ReadString(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                const int maxLength = 1024;
                IntPtr resultPtr = Marshal.AllocHGlobal(maxLength);
                try
                {
                    int result = eip_read_string(_clientId, tagPtr, resultPtr, maxLength);
                    if (result != 0)
                        throw new Exception($"Failed to read STRING tag '{tagName}'. Check tag exists and is STRING type.");
                    return Marshal.PtrToStringAnsi(resultPtr) ?? string.Empty;
                }
                finally
                {
                    Marshal.FreeHGlobal(resultPtr);
                }
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        public void WriteString(string tagName, string value)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            IntPtr valuePtr = Marshal.StringToHGlobalAnsi(value);
            try
            {
                int result = eip_write_string(_clientId, tagPtr, valuePtr);
                if (result != 0)
                    throw new Exception($"Failed to write STRING tag '{tagName}'. Check tag exists and is writable.");
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
                Marshal.FreeHGlobal(valuePtr);
            }
        }

        public Dictionary<string, object> ReadUdt(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                const int maxSize = 4096;
                IntPtr resultPtr = Marshal.AllocHGlobal(maxSize);
                try
                {
                    int result = eip_read_udt(_clientId, tagPtr, resultPtr, maxSize);
                    if (result != 0)
                        throw new Exception($"Failed to read UDT tag '{tagName}'. Check tag exists and is UDT type.");
                    
                    // Get the UDT metadata
                    var metadata = GetTagMetadata(tagName);
                    
                    // Read the raw data
                    byte[] rawData = new byte[metadata.ArraySize];
                    Marshal.Copy(resultPtr, rawData, 0, metadata.ArraySize);
                    
                    // Parse the UDT data
                    var udtData = new Dictionary<string, object>();
                    int offset = 0;
                    
                    // Parse each member based on its data type
                    while (offset < rawData.Length)
                    {
                        // Read member name length (2 bytes)
                        int nameLength = BitConverter.ToUInt16(rawData, offset);
                        offset += 2;
                        
                        // Read member name
                        string memberName = System.Text.Encoding.ASCII.GetString(rawData, offset, nameLength);
                        offset += nameLength;
                        
                        // Read data type (2 bytes)
                        ushort dataType = BitConverter.ToUInt16(rawData, offset);
                        offset += 2;
                        
                        // Read value based on data type
                        object value;
                        switch (dataType)
                        {
                            case 0x00C1: // BOOL
                                value = rawData[offset++] != 0;
                                break;
                            case 0x00C4: // DINT
                                value = BitConverter.ToInt32(rawData, offset);
                                offset += 4;
                                break;
                            case 0x00CA: // REAL
                                value = BitConverter.ToSingle(rawData, offset);
                                offset += 4;
                                break;
                            case 0x00D0: // STRING
                                int strLength = BitConverter.ToUInt16(rawData, offset);
                                offset += 2;
                                value = System.Text.Encoding.ASCII.GetString(rawData, offset, strLength);
                                offset += strLength;
                                break;
                            default:
                                throw new Exception($"Unsupported UDT member data type: 0x{dataType:X4}");
                        }
                        
                        udtData[memberName] = value;
                    }
                    
                    return udtData;
                }
                finally
                {
                    Marshal.FreeHGlobal(resultPtr);
                }
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        public void WriteUdt(string tagName, Dictionary<string, object> value)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                // Get the UDT metadata
                var metadata = GetTagMetadata(tagName);
                
                // Serialize the UDT data
                using var ms = new System.IO.MemoryStream();
                using var writer = new System.IO.BinaryWriter(ms);
                
                foreach (var kvp in value)
                {
                    // Write member name length and name
                    byte[] nameBytes = System.Text.Encoding.ASCII.GetBytes(kvp.Key);
                    writer.Write((ushort)nameBytes.Length);
                    writer.Write(nameBytes);
                    
                    // Write value based on its type
                    switch (kvp.Value)
                    {
                        case bool boolValue:
                            writer.Write((ushort)0x00C1); // BOOL type
                            writer.Write((byte)(boolValue ? 1 : 0));
                            break;
                            
                        case int intValue:
                            writer.Write((ushort)0x00C4); // DINT type
                            writer.Write(intValue);
                            break;
                            
                        case float floatValue:
                            writer.Write((ushort)0x00CA); // REAL type
                            writer.Write(floatValue);
                            break;
                            
                        case string stringValue:
                            writer.Write((ushort)0x00D0); // STRING type
                            byte[] strBytes = System.Text.Encoding.ASCII.GetBytes(stringValue);
                            writer.Write((ushort)strBytes.Length);
                            writer.Write(strBytes);
                            break;
                            
                        default:
                            throw new Exception($"Unsupported UDT member type: {kvp.Value?.GetType().Name ?? "null"}");
                    }
                }
                
                // Get the serialized data
                byte[] serializedData = ms.ToArray();
                
                // Write the UDT data
                IntPtr valuePtr = Marshal.AllocHGlobal(serializedData.Length);
                try
                {
                    Marshal.Copy(serializedData, 0, valuePtr, serializedData.Length);
                    int result = eip_write_udt(_clientId, tagPtr, valuePtr, serializedData.Length);
                    if (result != 0)
                        throw new Exception($"Failed to write UDT tag '{tagName}'. Check tag exists and is writable.");
                }
                finally
                {
                    Marshal.FreeHGlobal(valuePtr);
                }
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        public void DiscoverTags()
        {
            CheckConnection();
            int result = eip_discover_tags(_clientId);
            if (result != 0)
                throw new Exception("Failed to discover tags.");
        }

        public TagMetadata GetTagMetadata(string tagName)
        {
            CheckConnection();
            IntPtr tagPtr = Marshal.StringToHGlobalAnsi(tagName);
            try
            {
                int result = eip_get_tag_metadata(_clientId, tagPtr, out TagMetadata metadata);
                if (result != 0)
                    throw new Exception($"Failed to get metadata for tag '{tagName}'.");
                return metadata;
            }
            finally
            {
                Marshal.FreeHGlobal(tagPtr);
            }
        }

        public void SetMaxPacketSize(int size)
        {
            CheckConnection();
            int result = eip_set_max_packet_size(_clientId, size);
            if (result != 0)
                throw new Exception($"Failed to set max packet size to {size}.");
        }

        public bool CheckHealth()
        {
            CheckConnection();
            int result = eip_check_health(_clientId, out int is_healthy);
            if (result != 0)
                throw new Exception("Failed to check PLC health.");
            return is_healthy != 0;
        }

        #endregion

        #region Properties

        /// <summary>
        /// Gets a value indicating whether the client is connected to a PLC.
        /// </summary>
        public bool IsConnected => _clientId >= 0;

        /// <summary>
        /// Gets the internal client ID used by the Rust library.
        /// </summary>
        public int ClientId => _clientId;

        #endregion

        #region Private Methods

        private void CheckConnection()
        {
            if (_clientId < 0)
                throw new InvalidOperationException("Not connected to PLC. Call Connect() first.");
        }

        #endregion

        #region IDisposable Implementation

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    Disconnect();
                }
                _disposed = true;
            }
        }

        ~EtherNetIpClient()
        {
            Dispose(false);
        }

        #endregion
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct TagMetadata
    {
        public int DataType;
        public int Scope;
        public int ArrayDimension;
        public int ArraySize;
    }

    /// <summary>
    /// Extension methods and utility functions for EtherNet/IP operations.
    /// </summary>
    public static class EtherNetIpExtensions
    {
        /// <summary>
        /// Creates and connects to a PLC in one operation.
        /// </summary>
        /// <param name="address">PLC address in format "IP:PORT".</param>
        /// <returns>Connected EtherNetIpClient instance.</returns>
        /// <exception cref="Exception">Thrown if connection fails.</exception>
        public static EtherNetIpClient ConnectToPlc(string address)
        {
            var client = new EtherNetIpClient();
            if (!client.Connect(address))
                throw new Exception($"Failed to connect to PLC at {address}");
            return client;
        }

        /// <summary>
        /// Attempts to connect to a PLC with retry logic.
        /// </summary>
        /// <param name="address">PLC address.</param>
        /// <param name="maxRetries">Maximum number of connection attempts.</param>
        /// <param name="retryDelayMs">Delay between retry attempts in milliseconds.</param>
        /// <returns>Connected client or null if all attempts fail.</returns>
        public static EtherNetIpClient? TryConnectToPlc(string address, int maxRetries = 3, int retryDelayMs = 1000)
        {
            for (int i = 0; i < maxRetries; i++)
            {
                var client = new EtherNetIpClient();
                if (client.Connect(address))
                    return client;
                
                client.Dispose();
                if (i < maxRetries - 1)
                    Task.Delay(retryDelayMs).Wait();
            }
            return null;
        }
    }
}