// EtherNetIpClient.cs - Reusable C# wrapper for Rust EtherNet/IP driver
using System;
using System.Runtime.InteropServices;

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
    public class EtherNetIpClient : IDisposable
    {
        private int _clientId = -1;
        private bool _disposed = false;

        #region DLL Imports
        // These are the low-level FFI calls to the Rust library
        // Users should not call these directly - use the public methods instead

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_connect(IntPtr address);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_disconnect(int client_id);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_bool(int client_id, IntPtr tag_name, out int result);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_bool(int client_id, IntPtr tag_name, int value);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_dint(int client_id, IntPtr tag_name, out int result);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_dint(int client_id, IntPtr tag_name, int value);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_read_real(int client_id, IntPtr tag_name, out double result);

        [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
        private static extern int eip_write_real(int client_id, IntPtr tag_name, double value);
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
                int result = eip_write_bool(_clientId, tagPtr, value ? 1 : 0);
                if (result != 0)
                    throw new Exception($"Failed to write BOOL tag '{tagName}'. Check tag exists and is writable.");
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
                Disconnect();
                _disposed = true;
            }
        }

        ~EtherNetIpClient()
        {
            Dispose(false);
        }

        #endregion
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
            {
                client.Dispose();
                throw new Exception($"Failed to connect to PLC at {address}. Check IP address, network connectivity, and PLC status.");
            }
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
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    var client = new EtherNetIpClient();
                    if (client.Connect(address))
                    {
                        return client;
                    }
                    client.Dispose();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Connection attempt {attempt} failed: {ex.Message}");
                }

                if (attempt < maxRetries)
                {
                    System.Threading.Thread.Sleep(retryDelayMs);
                }
            }
            return null;
        }
    }
}