using System;
using RustEtherNetIp;

namespace ConnectionVariations
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== PLC Connection Variations Test ===");
            Console.WriteLine("Testing different connection approaches...");
            Console.WriteLine();

            string plcAddress = "192.168.0.1";
            
            // Test 1: Basic connection
            Console.WriteLine("1. Testing basic connection...");
            TestBasicConnection(plcAddress);
            
            Console.WriteLine();
            
            // Test 2: Connection with timeout
            Console.WriteLine("2. Testing connection with longer timeout...");
            TestConnectionWithTimeout(plcAddress);
            
            Console.WriteLine();
            
            // Test 3: Connection with different parameters
            Console.WriteLine("3. Testing connection variations...");
            TestConnectionVariations(plcAddress);
            
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        static void TestBasicConnection(string address)
        {
            try
            {
                using (var client = new EtherNetIpClient())
                {
                    Console.WriteLine($"   Attempting connection to {address}...");
                    bool connected = client.Connect(address);
                    
                    if (connected)
                    {
                        Console.WriteLine("   ✅ Basic connection successful!");
                        Console.WriteLine($"   Client ID: {client.ClientId}");
                        client.Disconnect();
                    }
                    else
                    {
                        Console.WriteLine("   ❌ Basic connection failed");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Exception: {ex.Message}");
            }
        }

        static void TestConnectionWithTimeout(string address)
        {
            try
            {
                using (var client = new EtherNetIpClient())
                {
                    Console.WriteLine($"   Attempting connection to {address} with timeout...");
                    
                    // Try multiple times with delays
                    for (int i = 0; i < 3; i++)
                    {
                        Console.WriteLine($"   Attempt {i + 1}/3...");
                        bool connected = client.Connect(address);
                        
                        if (connected)
                        {
                            Console.WriteLine("   ✅ Connection successful!");
                            Console.WriteLine($"   Client ID: {client.ClientId}");
                            client.Disconnect();
                            return;
                        }
                        else
                        {
                            Console.WriteLine($"   ❌ Attempt {i + 1} failed");
                            if (i < 2)
                            {
                                Console.WriteLine("   Waiting 2 seconds before retry...");
                                System.Threading.Thread.Sleep(2000);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Exception: {ex.Message}");
            }
        }

        static void TestConnectionVariations(string address)
        {
            // Test different address formats
            var addressVariations = new[]
            {
                address,
                $"{address}:44818",
                $"tcp://{address}",
                $"tcp://{address}:44818"
            };
            
            foreach (var addr in addressVariations)
            {
                try
                {
                    using (var client = new EtherNetIpClient())
                    {
                        Console.WriteLine($"   Testing address format: {addr}");
                        bool connected = client.Connect(addr);
                        
                        if (connected)
                        {
                            Console.WriteLine($"   ✅ Connection successful with {addr}!");
                            Console.WriteLine($"   Client ID: {client.ClientId}");
                            client.Disconnect();
                            return;
                        }
                        else
                        {
                            Console.WriteLine($"   ❌ Connection failed with {addr}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"   ❌ Exception with {addr}: {ex.Message}");
                }
            }
        }
    }
}
