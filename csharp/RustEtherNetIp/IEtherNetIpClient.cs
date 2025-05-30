using System;
using System.Collections.Generic;

namespace RustEtherNetIp
{
    public interface IEtherNetIpClient : IDisposable
    {
        bool Connect(string address);
        bool IsConnected { get; }
        int ClientId { get; }
        bool ReadBool(string tagName);
        int ReadDint(string tagName);
        float ReadReal(string tagName);
        string ReadString(string tagName);
        Dictionary<string, object> ReadUdt(string tagName);
        void WriteBool(string tagName, bool value);
        void WriteDint(string tagName, int value);
        void WriteReal(string tagName, float value);
        void WriteString(string tagName, string value);
        void WriteUdt(string tagName, Dictionary<string, object> value);
        TagMetadata GetTagMetadata(string tagName);
        void SetMaxPacketSize(int size);
        bool CheckHealth();
    }
} 