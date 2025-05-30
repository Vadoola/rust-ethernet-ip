// Program.cs - Demo application only
using System;
using RustEtherNetIp;

Console.WriteLine("🦀 Rust EtherNet/IP Driver - C# Integration Demo");
Console.WriteLine("=================================================");

try
{
    using var client = new EtherNetIpClient();
    
    if (client.Connect("192.168.0.1:44818"))
    {
        Console.WriteLine("✅ Connected!");
        
        try 
        {
            // Read a boolean tag
            bool boolValue = client.ReadBool("TestTag");
            Console.WriteLine($"TestTag (bool): {boolValue}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error reading TestTag: {ex.Message}");
        }
        
        try 
        {
            // Read an integer tag
            int intValue = client.ReadDint("TestInt");
            Console.WriteLine($"TestInt: {intValue}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error reading TestInt: {ex.Message}");
        }
        
        try 
        {
            // Read a float tag
            float floatValue = client.ReadReal("TestFloat");
            Console.WriteLine($"TestFloat: {floatValue}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error reading TestFloat: {ex.Message}");
        }
        
        try
        {
            Console.WriteLine("\nReading BOOL tag 'TestTagX'...");
            bool testTagX = client.ReadBool("TestTagX");
            Console.WriteLine($"TestTagX: {testTagX}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error reading TestTagX: {ex.Message}\n{ex.StackTrace}");
        }
        
        try 
        {
            // Write some values
            client.WriteBool("TestTag", true);
            client.WriteDint("TestInt", 42);
            client.WriteReal("TestFloat", 3.14f);
            
            Console.WriteLine("✅ Write operations completed");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error during write operations: {ex.Message}");
        }
    }
    else
    {
        Console.WriteLine("❌ Failed to connect to PLC");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}