using System;
using RustEtherNetIp;

namespace SimplePlcTest
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== Simple PLC Connection Test ===");
            Console.WriteLine("Testing connection to PLC at 192.168.0.1");
            Console.WriteLine();

            string plcAddress = "192.168.0.1";
            
            try
            {
                Console.WriteLine("1. Creating EtherNet/IP client...");
                using (var client = new EtherNetIpClient())
                {
                    Console.WriteLine("   ✅ Client created successfully");
                    
                    Console.WriteLine($"2. Attempting connection to {plcAddress}...");
                    bool connected = client.Connect(plcAddress);
                    
                    if (connected)
                    {
                        Console.WriteLine("   ✅ Connection successful!");
                        Console.WriteLine($"   Client ID: {client.ClientId}");
                        Console.WriteLine($"   Is Connected: {client.IsConnected}");
                        
                        Console.WriteLine();
                        Console.WriteLine("3. Testing Part_Data UDT...");
                        
                        try
                        {
                            Console.WriteLine("   Reading Part_Data UDT as dictionary...");
                            var udtData = client.ReadUdtAsDictionary("Part_Data");
                            Console.WriteLine($"   ✅ Successfully read Part_Data UDT with {udtData.Count} members");
                            
                            // Show first few members
                            int count = 0;
                            foreach (var kvp in udtData)
                            {
                                if (count < 10) // Show first 10 members
                                {
                                    Console.WriteLine($"     {kvp.Key}: {kvp.Value} ({kvp.Value?.GetType().Name})");
                                }
                                count++;
                            }
                            if (count > 10)
                            {
                                Console.WriteLine($"     ... and {count - 10} more members");
                            }
                        }
                        catch (Exception udtEx)
                        {
                            Console.WriteLine($"   ⚠️  Could not read Part_Data UDT: {udtEx.Message}");
                            
                            // Try individual members
                            Console.WriteLine("   Trying individual UDT members...");
                            TestIndividualMembers(client);
                        }
                        
                        Console.WriteLine();
                        Console.WriteLine("4. Testing individual UDT member access...");
                        TestIndividualMembers(client);
                        
                        client.Disconnect();
                        Console.WriteLine("5. Disconnected successfully ✅");
                    }
                    else
                    {
                        Console.WriteLine("   ❌ Connection failed!");
                        Console.WriteLine();
                        Console.WriteLine("🔍 Troubleshooting steps:");
                        Console.WriteLine("1. Verify PLC is powered on and running");
                        Console.WriteLine("2. Check network cable connection");
                        Console.WriteLine("3. Verify IP address (192.168.0.1) is correct");
                        Console.WriteLine("4. Check if PLC EtherNet/IP module is configured");
                        Console.WriteLine("5. Ensure no firewall is blocking the connection");
                        Console.WriteLine("6. Try pinging the PLC: ping 192.168.0.1");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        static void TestIndividualMembers(EtherNetIpClient client)
        {
            var testMembers = new[]
            {
                "Part_Data.oFuse_Serial_Number",
                "Part_Data.oFuse_Resistance", 
                "Part_Data.oFuse_Weight",
                "Part_Data.oMachine_Running",
                "Part_Data.oMachine_Ready",
                "Part_Data.oProduction_Rate",
                "Part_Data.iStart_Production",
                "Part_Data.iTarget_Production"
            };
            
            foreach (var member in testMembers)
            {
                try
                {
                    Console.WriteLine($"   Testing {member}...");
                    
                    // Try reading as different data types
                    try
                    {
                        var boolValue = client.ReadBool(member);
                        Console.WriteLine($"     ✅ Read as BOOL: {boolValue}");
                    }
                    catch
                    {
                        try
                        {
                            var realValue = client.ReadReal(member);
                            Console.WriteLine($"     ✅ Read as REAL: {realValue}");
                        }
                        catch
                        {
                            try
                            {
                                var stringValue = client.ReadString(member);
                                Console.WriteLine($"     ✅ Read as STRING: {stringValue}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"     ❌ Could not read {member}: {ex.Message}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"     ❌ Error reading {member}: {ex.Message}");
                }
            }
        }
    }
}
