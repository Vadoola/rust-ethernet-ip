using RustEtherNetIp;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== Simple UDT Test ===");
        Console.WriteLine("Testing UDT reading with C# wrapper");
        Console.WriteLine();

        try
        {
            var client = new EtherNetIpClient();
            Console.WriteLine("✅ Created EtherNetIpClient");
            
            client.Connect("192.168.0.1:44818");
            Console.WriteLine("✅ Connected to PLC");
            
            Console.WriteLine("\n🔍 Testing UDT reading for Part_Data...");
            var udtValue = client.ReadUdt("Part_Data");
            Console.WriteLine($"✅ UDT read successful!");
            Console.WriteLine($"📊 Type: {udtValue.Type}");
            Console.WriteLine($"📊 IsUdt: {udtValue.IsUdt}");
            
            if (udtValue.IsUdt)
            {
                Console.WriteLine($"📋 UDT has {udtValue.UdtMembers.Count} members:");
                foreach (var member in udtValue.UdtMembers)
                {
                    Console.WriteLine($"   - {member.Key}: {member.Value} (Type: {member.Value.Type})");
                }
            }
            else
            {
                Console.WriteLine($"📊 UDT Value: {udtValue}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        }
    }
}
