using System;
using System.Runtime.InteropServices;

class Program
{
    [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int eip_connect(IntPtr address);

    [DllImport("rust_ethernet_ip.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int eip_disconnect(int client_id);

    static void Main()
    {
        Console.WriteLine("Testing Rust FFI connection...");
        
        try
        {
            // Test if we can load the DLL and call the function
            string address = "192.168.0.1:44818";
            IntPtr addressPtr = Marshal.StringToHGlobalAnsi(address);
            
            Console.WriteLine($"Attempting to connect to {address}...");
            int client_id = eip_connect(addressPtr);
            
            if (client_id >= 0)
            {
                Console.WriteLine($"✅ Connection successful! Client ID: {client_id}");
                
                // Disconnect
                int result = eip_disconnect(client_id);
                Console.WriteLine($"Disconnect result: {result}");
            }
            else
            {
                Console.WriteLine($"❌ Connection failed. Client ID: {client_id}");
            }
            
            Marshal.FreeHGlobal(addressPtr);
        }
        catch (DllNotFoundException ex)
        {
            Console.WriteLine($"❌ DLL not found: {ex.Message}");
        }
        catch (EntryPointNotFoundException ex)
        {
            Console.WriteLine($"❌ Function not found in DLL: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Unexpected error: {ex.Message}");
        }
        
        Console.WriteLine("Press any key to exit...");
        Console.ReadKey();
    }
} 