using System;
using System.Threading.Tasks;
using RustEtherNetIp;

namespace Part_Data_UDT_Test
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== Part_Data UDT Test ===");
            Console.WriteLine("Testing read/write operations on Part_Data UDT members");
            Console.WriteLine("PLC Address: 192.168.0.1");
            Console.WriteLine();

            try
            {
                // Create client and connect
                using var client = new EthernetNetIpClient("192.168.0.1");
                
                Console.WriteLine("Connecting to PLC...");
                await client.ConnectAsync();
                Console.WriteLine("✅ Connected successfully!");
                Console.WriteLine();

                // Test reading individual UDT members
                await TestReadOperations(client);
                
                Console.WriteLine();
                Console.WriteLine("--- Writing Test Values ---");
                
                // Test writing individual UDT members
                await TestWriteOperations(client);
                
                Console.WriteLine();
                Console.WriteLine("--- Reading Back Written Values ---");
                
                // Read back the values we just wrote
                await TestReadOperations(client);
                
                Console.WriteLine();
                Console.WriteLine("--- Testing UDT as Dictionary ---");
                
                // Test reading the entire UDT as a dictionary
                await TestUdtAsDictionary(client);
                
                Console.WriteLine();
                Console.WriteLine("✅ All tests completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            }
            
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        static async Task TestReadOperations(EthernetNetIpClient client)
        {
            Console.WriteLine("Reading individual UDT members:");
            
            // Output members (oFuse_*)
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Serial_Number", "String");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Resistance", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Weight", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Sand_Fill_Time", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Pass_Status", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Defect_Code", "String");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Spare_Data_1", "String");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Spare_Data_2", "String");
            await ReadAndDisplayTag(client, "Part_Data.oFuse_Spare_Data_3", "String");
            
            // Machine status members (oMachine_*)
            await ReadAndDisplayTag(client, "Part_Data.oMachine_Running", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.oMachine_Ready", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.oMachine_Alarm", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.oProduction_Rate", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oShift_Count", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oDaily_Target", "Real");
            await ReadAndDisplayTag(client, "Part_Data.oCurrent_Shift", "String");
            
            // Input members (i*)
            await ReadAndDisplayTag(client, "Part_Data.iStart_Production", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iStop_Production", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iReset_Machine", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iClear_Alarms", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iData_Acknowledged", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iSave_Data", "Bool");
            await ReadAndDisplayTag(client, "Part_Data.iTarget_Production", "Real");
            await ReadAndDisplayTag(client, "Part_Data.iQuality_Threshold", "Real");
        }

        static async Task TestWriteOperations(EthernetNetIpClient client)
        {
            Console.WriteLine("Writing test values to UDT members:");
            
            // Write test values to output members
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Resistance", 123.45, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Weight", 67.89, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Sand_Fill_Time", 12.34, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Pass_Status", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Serial_Number", "TEST123", "String");
            await WriteAndDisplayTag(client, "Part_Data.oFuse_Defect_Code", "DEF001", "String");
            
            // Write test values to machine status
            await WriteAndDisplayTag(client, "Part_Data.oMachine_Running", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.oMachine_Ready", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.oMachine_Alarm", false, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.oProduction_Rate", 150.75, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oShift_Count", 3.0, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oDaily_Target", 1000.0, "Real");
            await WriteAndDisplayTag(client, "Part_Data.oCurrent_Shift", "Day Shift", "String");
            
            // Write test values to input members
            await WriteAndDisplayTag(client, "Part_Data.iStart_Production", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iStop_Production", false, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iReset_Machine", false, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iClear_Alarms", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iData_Acknowledged", true, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iSave_Data", false, "Bool");
            await WriteAndDisplayTag(client, "Part_Data.iTarget_Production", 500.0, "Real");
            await WriteAndDisplayTag(client, "Part_Data.iQuality_Threshold", 95.5, "Real");
        }

        static async Task TestUdtAsDictionary(EthernetNetIpClient client)
        {
            try
            {
                Console.WriteLine("Reading entire Part_Data UDT as dictionary:");
                var udtData = client.ReadUdtAsDictionary("Part_Data");
                
                Console.WriteLine($"✅ Successfully read UDT with {udtData.Count} members:");
                foreach (var kvp in udtData)
                {
                    Console.WriteLine($"  {kvp.Key}: {kvp.Value} ({kvp.Value?.GetType().Name})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error reading UDT as dictionary: {ex.Message}");
            }
        }

        static async Task ReadAndDisplayTag(EthernetNetIpClient client, string tagName, string expectedType)
        {
            try
            {
                var result = await client.ReadTagAsync(tagName);
                if (result.Success)
                {
                    Console.WriteLine($"  ✅ {tagName}: {result.Value} ({result.Value?.GetType().Name})");
                }
                else
                {
                    Console.WriteLine($"  ❌ {tagName}: Failed - {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ❌ {tagName}: Exception - {ex.Message}");
            }
        }

        static async Task WriteAndDisplayTag(EthernetNetIpClient client, string tagName, object value, string type)
        {
            try
            {
                bool success = false;
                
                switch (type.ToLower())
                {
                    case "bool":
                        success = client.WriteBool(tagName, (bool)value);
                        break;
                    case "real":
                        success = client.WriteReal(tagName, (float)value);
                        break;
                    case "string":
                        success = client.WriteString(tagName, (string)value);
                        break;
                    default:
                        Console.WriteLine($"  ❌ {tagName}: Unknown type {type}");
                        return;
                }
                
                if (success)
                {
                    Console.WriteLine($"  ✅ {tagName}: Wrote {value} ({type})");
                }
                else
                {
                    Console.WriteLine($"  ❌ {tagName}: Write failed");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ❌ {tagName}: Write exception - {ex.Message}");
            }
        }
    }
}
