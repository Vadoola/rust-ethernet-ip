// Program.cs - Demo application only
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using RustEtherNetIp;

namespace RustEtherNetIp
{
    /// <summary>
    /// Example program demonstrating EtherNet/IP client usage including new batch operations.
    /// </summary>
    internal class Program
    {
        private static async Task Main(string[] args)
        {
            Console.WriteLine("🚀 Rust EtherNet/IP C# Wrapper Demo");
            Console.WriteLine("=====================================\n");

            // For demonstration, we'll show API usage without requiring actual PLC connection
            await DemonstrateIndividualOperations();
            await DemonstrateBatchOperations();
            
            Console.WriteLine("\n✅ Demo completed successfully!");
            Console.WriteLine("\n📝 Note: To connect to a real PLC, replace '192.168.1.100:44818' with your PLC's IP address.");
            Console.ReadKey();
        }

        /// <summary>
        /// Demonstrates traditional individual tag operations.
        /// </summary>
        private static async Task DemonstrateIndividualOperations()
        {
            Console.WriteLine("📖 Demo 1: Individual Tag Operations");
            Console.WriteLine("------------------------------------");

            try
            {
                using var client = new EtherNetIpClient();
                
                // Note: This will fail without a real PLC, but shows the API usage
                Console.WriteLine("🔗 Attempting to connect to PLC...");
                bool connected = client.Connect("192.168.1.100:44818");
                
                if (connected)
                {
                    Console.WriteLine("✅ Connected to PLC successfully!");
                    
                    // Individual operations
                    var stopwatch = Stopwatch.StartNew();
                    
                    try
                    {
                        var value1 = client.ReadDint("ProductionCount");
                        var value2 = client.ReadReal("Temperature");
                        var value3 = client.ReadBool("StartButton");
                        
                        Console.WriteLine($"📊 Read ProductionCount: {value1}");
                        Console.WriteLine($"📊 Read Temperature: {value2:F2}");
                        Console.WriteLine($"📊 Read StartButton: {value3}");
                        
                        client.WriteDint("SetPoint", 1500);
                        client.WriteReal("TargetTemp", 75.5f);
                        client.WriteBool("EnableFlag", true);
                        
                        Console.WriteLine("✅ Write operations completed");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️  Operations failed: {ex.Message}");
                    }
                    
                    stopwatch.Stop();
                    Console.WriteLine($"⏱️  Individual operations took: {stopwatch.ElapsedMilliseconds}ms");
                }
                else
                {
                    Console.WriteLine("❌ Failed to connect to PLC (expected for demo)");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Connection error: {ex.Message} (expected for demo)");
            }

            Console.WriteLine();
        }

        /// <summary>
        /// Demonstrates high-performance batch operations.
        /// </summary>
        private static async Task DemonstrateBatchOperations()
        {
            Console.WriteLine("🚀 Demo 2: High-Performance Batch Operations");
            Console.WriteLine("--------------------------------------------");

            try
            {
                using var client = new EtherNetIpClient();
                
                Console.WriteLine("🔗 Attempting to connect to PLC...");
                bool connected = client.Connect("192.168.1.100:44818");
                
                if (connected)
                {
                    Console.WriteLine("✅ Connected to PLC successfully!");
                    await DemonstrateBatchReads(client);
                    await DemonstrateBatchWrites(client);
                    await DemonstrateMixedBatch(client);
                    await DemonstrateBatchConfiguration(client);
                }
                else
                {
                    Console.WriteLine("❌ Failed to connect to PLC (expected for demo)");
                    await DemonstrateBatchApiUsage();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Connection error: {ex.Message} (expected for demo)");
                await DemonstrateBatchApiUsage();
            }

            Console.WriteLine();
        }

        /// <summary>
        /// Demonstrates batch read operations.
        /// </summary>
        private static async Task DemonstrateBatchReads(EtherNetIpClient client)
        {
            Console.WriteLine("\n📖 Batch Read Operations:");
            
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                string[] tagsToRead = {
                    "ProductionCount",
                    "Temperature_1",
                    "Temperature_2",
                    "Pressure_1",
                    "FlowRate"
                };
                
                var results = client.ReadTagsBatch(tagsToRead);
                
                stopwatch.Stop();
                
                Console.WriteLine($"✅ Batch read completed in {stopwatch.ElapsedMilliseconds}ms");
                Console.WriteLine($"📊 Results ({results.Count} tags):");
                
                foreach (var result in results)
                {
                    if (result.Value.Success)
                    {
                        Console.WriteLine($"  ✅ {result.Key}: {result.Value.Value} ({result.Value.DataType})");
                    }
                    else
                    {
                        Console.WriteLine($"  ❌ {result.Key}: {result.Value.ErrorMessage}");
                    }
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"❌ Batch read failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Demonstrates batch write operations.
        /// </summary>
        private static async Task DemonstrateBatchWrites(EtherNetIpClient client)
        {
            Console.WriteLine("\n✏️  Batch Write Operations:");
            
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var tagsToWrite = new Dictionary<string, object>
                {
                    { "SetPoint_1", 1500 },
                    { "SetPoint_2", 1750 },
                    { "TargetTemp", 75.5f },
                    { "EnableFlag", true },
                    { "RecipeNumber", 42 }
                };
                
                var results = client.WriteTagsBatch(tagsToWrite);
                
                stopwatch.Stop();
                
                Console.WriteLine($"✅ Batch write completed in {stopwatch.ElapsedMilliseconds}ms");
                Console.WriteLine($"📊 Results ({results.Count} tags):");
                
                foreach (var result in results)
                {
                    if (result.Value.Success)
                    {
                        Console.WriteLine($"  ✅ {result.Key}: Write successful");
                    }
                    else
                    {
                        Console.WriteLine($"  ❌ {result.Key}: {result.Value.ErrorMessage}");
                    }
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"❌ Batch write failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Demonstrates mixed batch operations (reads and writes).
        /// </summary>
        private static async Task DemonstrateMixedBatch(EtherNetIpClient client)
        {
            Console.WriteLine("\n🔄 Mixed Batch Operations:");
            
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                var operations = new[]
                {
                    BatchOperation.Read("CurrentTemp"),
                    BatchOperation.Read("CurrentPressure"),
                    BatchOperation.Write("TempSetpoint", 78.5f),
                    BatchOperation.Write("PressureSetpoint", 15.2f),
                    BatchOperation.Write("AutoModeEnabled", true)
                };
                
                var results = client.ExecuteBatch(operations);
                
                stopwatch.Stop();
                
                Console.WriteLine($"✅ Mixed batch completed in {stopwatch.ElapsedMilliseconds}ms");
                Console.WriteLine($"📊 Results ({results.Length} operations):");
                
                foreach (var result in results)
                {
                    string operation = result.IsWrite ? "Write" : "Read";
                    if (result.Success)
                    {
                        string valueInfo = result.IsWrite ? "" : $" = {result.Value}";
                        Console.WriteLine($"  ✅ {operation} {result.TagName}{valueInfo} ({result.ExecutionTimeMs:F1}ms)");
                    }
                    else
                    {
                        Console.WriteLine($"  ❌ {operation} {result.TagName}: {result.ErrorMessage}");
                    }
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"❌ Mixed batch failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Demonstrates batch configuration options.
        /// </summary>
        private static async Task DemonstrateBatchConfiguration(EtherNetIpClient client)
        {
            Console.WriteLine("\n⚙️  Batch Configuration:");
            
            try
            {
                // Get current configuration
                var currentConfig = client.GetBatchConfig();
                Console.WriteLine($"📋 Current configuration:");
                Console.WriteLine($"  • Max operations per packet: {currentConfig.MaxOperationsPerPacket}");
                Console.WriteLine($"  • Max packet size: {currentConfig.MaxPacketSize} bytes");
                Console.WriteLine($"  • Packet timeout: {currentConfig.PacketTimeoutMs}ms");
                Console.WriteLine($"  • Continue on error: {currentConfig.ContinueOnError}");
                Console.WriteLine($"  • Optimize packet packing: {currentConfig.OptimizePacketPacking}");
                
                // Apply high-performance configuration
                Console.WriteLine("\n🚀 Applying high-performance configuration...");
                var highPerfConfig = BatchConfig.HighPerformance();
                client.ConfigureBatchOperations(highPerfConfig);
                Console.WriteLine("✅ High-performance configuration applied");
                
                // Apply conservative configuration
                Console.WriteLine("\n🛡️  Applying conservative configuration...");
                var conservativeConfig = BatchConfig.Conservative();
                client.ConfigureBatchOperations(conservativeConfig);
                Console.WriteLine("✅ Conservative configuration applied");
                
                // Restore default
                var defaultConfig = BatchConfig.Default();
                client.ConfigureBatchOperations(defaultConfig);
                Console.WriteLine("🔄 Default configuration restored");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Configuration demo failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Demonstrates batch API usage without requiring PLC connection.
        /// </summary>
        private static async Task DemonstrateBatchApiUsage()
        {
            Console.WriteLine("\n📚 Batch Operations API Usage Examples");
            Console.WriteLine("======================================");

            Console.WriteLine("\n1️⃣  Creating Batch Operations:");
            Console.WriteLine("```csharp");
            Console.WriteLine("// Read operations");
            Console.WriteLine("var readOp = BatchOperation.Read(\"Temperature\");");
            Console.WriteLine();
            Console.WriteLine("// Write operations");
            Console.WriteLine("var writeOp = BatchOperation.Write(\"Setpoint\", 75.5f);");
            Console.WriteLine();
            Console.WriteLine("// Mixed operations array");
            Console.WriteLine("var operations = new[] {");
            Console.WriteLine("    BatchOperation.Read(\"CurrentTemp\"),");
            Console.WriteLine("    BatchOperation.Write(\"TargetTemp\", 80.0f),");
            Console.WriteLine("    BatchOperation.Read(\"Pressure\"),");
            Console.WriteLine("};");
            Console.WriteLine("```");

            Console.WriteLine("\n2️⃣  Batch Read Operations:");
            Console.WriteLine("```csharp");
            Console.WriteLine("string[] tags = { \"Tag1\", \"Tag2\", \"Tag3\" };");
            Console.WriteLine("var results = client.ReadTagsBatch(tags);");
            Console.WriteLine();
            Console.WriteLine("foreach (var result in results)");
            Console.WriteLine("{");
            Console.WriteLine("    if (result.Value.Success)");
            Console.WriteLine("        Console.WriteLine($\"{result.Key}: {result.Value.Value}\");");
            Console.WriteLine("    else");
            Console.WriteLine("        Console.WriteLine($\"{result.Key}: Error - {result.Value.ErrorMessage}\");");
            Console.WriteLine("}");
            Console.WriteLine("```");

            Console.WriteLine("\n3️⃣  Batch Write Operations:");
            Console.WriteLine("```csharp");
            Console.WriteLine("var values = new Dictionary<string, object>");
            Console.WriteLine("{");
            Console.WriteLine("    { \"SetPoint1\", 1500 },");
            Console.WriteLine("    { \"Temperature\", 75.5f },");
            Console.WriteLine("    { \"EnableFlag\", true }");
            Console.WriteLine("};");
            Console.WriteLine();
            Console.WriteLine("var results = client.WriteTagsBatch(values);");
            Console.WriteLine("```");

            Console.WriteLine("\n4️⃣  Performance Configuration:");
            Console.WriteLine("```csharp");
            Console.WriteLine("// High-performance setup");
            Console.WriteLine("var config = BatchConfig.HighPerformance();");
            Console.WriteLine("client.ConfigureBatchOperations(config);");
            Console.WriteLine();
            Console.WriteLine("// Custom configuration");
            Console.WriteLine("var customConfig = new BatchConfig");
            Console.WriteLine("{");
            Console.WriteLine("    MaxOperationsPerPacket = 50,");
            Console.WriteLine("    MaxPacketSize = 4000,");
            Console.WriteLine("    PacketTimeoutMs = 1000,");
            Console.WriteLine("    ContinueOnError = true,");
            Console.WriteLine("    OptimizePacketPacking = true");
            Console.WriteLine("};");
            Console.WriteLine("```");

            Console.WriteLine("\n🚀 Performance Benefits:");
            Console.WriteLine("• 3-10x faster than individual operations");
            Console.WriteLine("• Reduced network traffic (1 packet vs N packets)");
            Console.WriteLine("• Lower PLC CPU usage");
            Console.WriteLine("• Better throughput for data collection");
            Console.WriteLine("• Atomic operations for coordinated control");

            Console.WriteLine("\n💡 Use Cases:");
            Console.WriteLine("• Data acquisition from multiple sensors");
            Console.WriteLine("• Recipe management (writing multiple setpoints)");
            Console.WriteLine("• Status monitoring across multiple systems");
            Console.WriteLine("• Coordinated control operations");
            Console.WriteLine("• High-frequency data logging");
        }
    }
}