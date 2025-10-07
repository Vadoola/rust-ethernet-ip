using System;
using System.Collections.Generic;
using RustEtherNetIp;

namespace AspNetExample.Services
{
    /// <summary>
    /// Demo-specific UDT template for Part_Data UDT.
    /// This is for demonstration purposes only and should not be in the general wrapper.
    /// </summary>
    public static class PartDataUdtTemplate
    {
        /// <summary>
        /// Creates a template specifically for the Part_Data UDT used in this demo.
        /// </summary>
        public static UdtTemplate CreatePartDataTemplate()
        {
            return new UdtTemplate
            {
                Name = "Part_Data",
                Description = "Part data structure with machine status flags (Demo Template)",
                TotalSize = 2,
                Members = new List<UdtMemberTemplate>
                {
                    new UdtMemberTemplate { Name = "oMachine_Running", DataType = "bool", Size = 1, Offset = 0, BitOffset = 0, Description = "Machine running status" },
                    new UdtMemberTemplate { Name = "oAlarm_Active", DataType = "bool", Size = 1, Offset = 0, BitOffset = 1, Description = "Alarm active status" },
                    new UdtMemberTemplate { Name = "oReady_State", DataType = "bool", Size = 1, Offset = 0, BitOffset = 2, Description = "Ready state status" },
                    new UdtMemberTemplate { Name = "oError_State", DataType = "bool", Size = 1, Offset = 0, BitOffset = 3, Description = "Error state status" },
                    new UdtMemberTemplate { Name = "oMaintenance_Mode", DataType = "bool", Size = 1, Offset = 0, BitOffset = 4, Description = "Maintenance mode status" },
                    new UdtMemberTemplate { Name = "oProduction_Active", DataType = "bool", Size = 1, Offset = 0, BitOffset = 5, Description = "Production active status" },
                    new UdtMemberTemplate { Name = "oQuality_Check", DataType = "bool", Size = 1, Offset = 0, BitOffset = 6, Description = "Quality check status" },
                    new UdtMemberTemplate { Name = "oSystem_Ready", DataType = "bool", Size = 1, Offset = 0, BitOffset = 7, Description = "System ready status" },
                    new UdtMemberTemplate { Name = "iCounter", DataType = "sint", Size = 1, Offset = 1, BitOffset = 0, Description = "Counter value" }
                }
            };
        }
        
        /// <summary>
        /// Parses raw UDT data using the Part_Data template.
        /// </summary>
        /// <param name="rawData">Raw bytes from the PLC.</param>
        /// <returns>Dictionary of parsed UDT members.</returns>
        public static Dictionary<string, PlcValue> ParsePartData(byte[] rawData)
        {
            var template = CreatePartDataTemplate();
            return template.ParseRawData(rawData);
        }
    }
}
