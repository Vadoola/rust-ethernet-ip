using RustEtherNetIp;
using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== UDT Member Parsing Test ===");
        Console.WriteLine("Testing UDT reading and member parsing\n");

        var client = new EtherNetIpClient();
        Console.WriteLine("✅ Created EtherNetIpClient");

        try
        {
            client.Connect("192.168.0.1:44818");
            Console.WriteLine("✅ Connected to PLC");

            // Test reading the entire UDT
            Console.WriteLine("\n🔍 Reading entire Part_Data UDT...");
            var udtValue = client.ReadUdt("Part_Data");
            
            if (udtValue.IsUdt)
            {
                Console.WriteLine($"✅ UDT read successful!");
                Console.WriteLine($"📊 UDT has {udtValue.UdtMembers.Count} members:");
                
                foreach (var member in udtValue.UdtMembers)
                {
                    Console.WriteLine($"   - {member.Key}: {member.Value.Value} (Type: {member.Value.Type})");
                }
                
                // Check if we have the parsed oMachine_Running member
                if (udtValue.UdtMembers.ContainsKey("oMachine_Running"))
                {
                    var machineRunning = udtValue.UdtMembers["oMachine_Running"];
                    Console.WriteLine($"\n🎯 Found oMachine_Running: {machineRunning.Value} (Type: {machineRunning.Type})");
                }
                
                // Check raw data
                if (udtValue.UdtMembers.ContainsKey("_raw_data"))
                {
                    var rawData = udtValue.UdtMembers["_raw_data"];
                    Console.WriteLine($"\n📦 Raw UDT data: {rawData.Value}");
                }
            }
            else
            {
                Console.WriteLine($"❌ UDT read failed or returned non-UDT value");
            }

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }
}
