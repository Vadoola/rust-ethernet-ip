using System;
using RustEtherNetIp;

namespace TestConnection
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("EtherNet/IP Connection Test");
            Console.WriteLine("============================");
            
            if (args.Length == 0)
            {
                Console.WriteLine("Usage: test_connection <PLC_IP:PORT>");
                Console.WriteLine("Example: test_connection 192.168.1.100:44818");
                return;
            }
            
            string address = args[0];
            Console.WriteLine($"Attempting to connect to: {address}");
            
            try
            {
                using var client = new EtherNetIpClient();
                
                Console.WriteLine("Connecting...");
                if (client.Connect(address))
                {
                    Console.WriteLine("✅ Connection successful!");
                    Console.WriteLine($"Client ID: {client.ClientId}");
                    
                    // Test health check
                    Console.WriteLine("\nTesting health check...");
                    bool isHealthy = client.CheckHealth();
                    Console.WriteLine($"Health check result: {isHealthy}");
                    
                    // Test tag discovery
                    Console.WriteLine("\nTesting tag discovery...");
                    try
                    {
                        client.DiscoverTags();
                        Console.WriteLine("✅ Tag discovery completed successfully!");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Tag discovery failed: {ex.Message}");
                    }
                    
                    // Test reading common tag types that might exist
                    string[] testTags = { "TestBool", "TestDint", "TestReal", "TestString", "LocalBool", "GlobalBool", "Status" };
                    
                    Console.WriteLine("\nTesting tag reads...");
                    foreach (var tagName in testTags)
                    {
                        Console.WriteLine($"\nTrying to read tag '{tagName}':");
                        
                        // Try as BOOL first
                        try
                        {
                            bool value = client.ReadBool(tagName);
                            Console.WriteLine($"  ✅ Read as BOOL: {value}");
                            continue;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"  ❌ BOOL read failed: {ex.Message}");
                        }
                        
                        // Try as DINT
                        try
                        {
                            int value = client.ReadDint(tagName);
                            Console.WriteLine($"  ✅ Read as DINT: {value}");
                            continue;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"  ❌ DINT read failed: {ex.Message}");
                        }
                        
                        // Try as REAL
                        try
                        {
                            float value = client.ReadReal(tagName);
                            Console.WriteLine($"  ✅ Read as REAL: {value}");
                            continue;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"  ❌ REAL read failed: {ex.Message}");
                        }
                        
                        Console.WriteLine($"  ❌ Tag '{tagName}' could not be read as any tested type");
                    }
                    
                    // Test writing (only if we can read something first)
                    Console.WriteLine("\nTesting tag writes...");
                    try
                    {
                        // Try writing to a test tag - this will likely fail but we'll see the debug output
                        client.WriteBool("TestWrite", true);
                        Console.WriteLine("✅ Write test completed!");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Write test failed: {ex.Message}");
                    }
                    
                    Console.WriteLine("\nDisconnecting...");
                    client.Disconnect();
                    Console.WriteLine("✅ Disconnected successfully!");
                }
                else
                {
                    Console.WriteLine("❌ Connection failed!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            
            Console.WriteLine("\nTest completed. Press any key to exit...");
            Console.ReadKey();
        }
    }
} 