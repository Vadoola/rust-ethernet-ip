using RustEtherNetIp;
using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== Test UDT Member Reading ===");
        Console.WriteLine("Testing individual UDT member reading\n");

        var client = new EtherNetIpClient();
        Console.WriteLine("✅ Created EtherNetIpClient");

        try
        {
            client.Connect("192.168.0.1:44818");
            Console.WriteLine("✅ Connected to PLC");

            // Test reading the UDT member as a simple tag
            Console.WriteLine("\n🔍 Testing UDT member: Part_Data.oMachine_Running");
            try
            {
                var value = client.ReadBool("Part_Data.oMachine_Running");
                Console.WriteLine($"✅ Boolean read successful: {value}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Boolean read failed: {ex.Message}");
            }

            // Test reading as DINT
            Console.WriteLine("\n🔍 Testing as DINT: Part_Data.oMachine_Running");
            try
            {
                var value = client.ReadDint("Part_Data.oMachine_Running");
                Console.WriteLine($"✅ DINT read successful: {value}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DINT read failed: {ex.Message}");
            }

            // Test reading as UDT
            Console.WriteLine("\n🔍 Testing as UDT: Part_Data.oMachine_Running");
            try
            {
                var value = client.ReadUdt("Part_Data.oMachine_Running");
                Console.WriteLine($"✅ UDT read successful: {value.Type}");
                if (value.IsUdt)
                {
                    Console.WriteLine($"📋 UDT has {value.UdtMembers.Count} members:");
                    foreach (var member in value.UdtMembers)
                    {
                        Console.WriteLine($"   - {member.Key}: {member.Value.Value} (Type: {member.Value.Type})");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UDT read failed: {ex.Message}");
            }

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Connection failed: {ex.Message}");
        }
    }
}
