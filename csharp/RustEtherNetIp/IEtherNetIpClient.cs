using System;
using System.Collections.Generic;

namespace RustEtherNetIp
{
    /// <summary>
    /// Interface for EtherNet/IP client supporting Allen-Bradley CompactLogix and ControlLogix PLCs.
    /// Provides comprehensive data type support and advanced tag addressing capabilities.
    /// </summary>
    public interface IEtherNetIpClient : IDisposable
    {
        // Connection Management
        bool Connect(string address);
        void Disconnect();
        bool IsConnected { get; }
        int ClientId { get; }
        
        // Boolean Operations
        bool ReadBool(string tagName);
        void WriteBool(string tagName, bool value);
        
        // Signed Integer Operations
        sbyte ReadSint(string tagName);
        void WriteSint(string tagName, sbyte value);
        
        short ReadInt(string tagName);
        void WriteInt(string tagName, short value);
        
        int ReadDint(string tagName);
        void WriteDint(string tagName, int value);
        
        long ReadLint(string tagName);
        void WriteLint(string tagName, long value);
        
        // Unsigned Integer Operations
        byte ReadUsint(string tagName);
        void WriteUsint(string tagName, byte value);
        
        ushort ReadUint(string tagName);
        void WriteUint(string tagName, ushort value);
        
        uint ReadUdint(string tagName);
        void WriteUdint(string tagName, uint value);
        
        ulong ReadUlint(string tagName);
        void WriteUlint(string tagName, ulong value);
        
        // Floating Point Operations
        float ReadReal(string tagName);
        void WriteReal(string tagName, float value);
        
        double ReadLreal(string tagName);
        void WriteLreal(string tagName, double value);
        
        // String Operations
        string ReadString(string tagName);
        void WriteString(string tagName, string value);
        
        // UDT Operations
        Dictionary<string, object> ReadUdt(string tagName);
        void WriteUdt(string tagName, Dictionary<string, object> value);
        
        // Tag Management
        void DiscoverTags();
        TagMetadata GetTagMetadata(string tagName);
        
        // Configuration
        void SetMaxPacketSize(int size);
        bool CheckHealth();
    }
} 