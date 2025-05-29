// Program.cs - Demo application only
using System;
using RustEtherNetIp;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("🦀 Rust EtherNet/IP Driver - C# Integration Demo");
        Console.WriteLine("=================================================");

        try
        {
            using var client = new EtherNetIpClient();
            
            if (client.Connect("192.168.0.1:44818"))
            {
                Console.WriteLine("✅ Connected!");
                
                // Your existing demo code here...
                bool value = client.ReadBool("TestTag");
                Console.WriteLine($"TestTag: {value}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}