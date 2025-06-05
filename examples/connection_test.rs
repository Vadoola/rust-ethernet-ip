use rust_ethernet_ip::EipClient;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::{Duration, Instant};
use tokio::time::timeout;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🔍 EtherNet/IP PLC Connection Diagnostic Tool");
    println!("============================================");
    
    // Test different common PLC IP addresses
    let test_addresses = vec![
        "192.168.0.1:44818",   // Current configured address
        "192.168.1.1:44818",   // Common gateway
        "192.168.1.100:44818", // Alternative from other examples
        "192.168.0.100:44818", // Common PLC address
        "10.0.0.1:44818",      // Industrial network
    ];
    
    println!("\n📡 Testing TCP connectivity first...");
    println!("------------------------------------");
    
    for addr in &test_addresses {
        print!("Testing {:<20} -> ", addr);
        match test_tcp_connection(addr).await {
            Ok(duration) => println!("✅ Connected in {:?}", duration),
            Err(e) => println!("❌ Failed: {}", e),
        }
    }
    
    println!("\n🔧 Testing EtherNet/IP protocol...");
    println!("----------------------------------");
    
    for addr in &test_addresses {
        print!("EIP to {:<20} -> ", addr);
        match test_eip_connection(addr).await {
            Ok(duration) => println!("✅ EtherNet/IP OK in {:?}", duration),
            Err(e) => println!("❌ EIP Failed: {}", e),
        }
    }
    
    println!("\n🌐 Network Interface Information");
    println!("-------------------------------");
    show_network_info().await;
    
    println!("\n💡 Troubleshooting Tips:");
    println!("========================");
    println!("1. ✅ Verify PLC IP address in Studio 5000/RSLogix");
    println!("2. ✅ Check PLC EtherNet/IP module status");
    println!("3. ✅ Ping the PLC: ping <PLC_IP>");
    println!("4. ✅ Verify PLC is on same network subnet");
    println!("5. ✅ Check Windows Firewall settings");
    println!("6. ✅ Ensure PLC communication module is running");
    println!("7. ✅ Try telnet <PLC_IP> 44818 from command line");
    
    Ok(())
}

async fn test_tcp_connection(addr: &str) -> Result<Duration, Box<dyn std::error::Error + Send + Sync>> {
    let start = Instant::now();
    
    // Try to resolve the address first
    let socket_addrs: Vec<_> = addr.to_socket_addrs()?.collect();
    if socket_addrs.is_empty() {
        return Err("Address resolution failed".into());
    }
    
    // Test TCP connection with timeout
    match timeout(Duration::from_secs(5), async {
        TcpStream::connect(addr)
    }).await {
        Ok(Ok(_stream)) => Ok(start.elapsed()),
        Ok(Err(e)) => Err(format!("TCP error: {}", e).into()),
        Err(_) => Err("Connection timeout (5s)".into()),
    }
}

async fn test_eip_connection(addr: &str) -> Result<Duration, Box<dyn std::error::Error + Send + Sync>> {
    let start = Instant::now();
    
    match timeout(Duration::from_secs(10), async {
        EipClient::connect(addr).await
    }).await {
        Ok(Ok(_client)) => Ok(start.elapsed()),
        Ok(Err(e)) => Err(format!("EIP error: {}", e).into()),
        Err(_) => Err("EIP timeout (10s)".into()),
    }
}

async fn show_network_info() {
    use std::process::Command;
    
    // Try to get local IP addresses
    match Command::new("ipconfig").output() {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            
            // Extract relevant network information
            for line in output_str.lines() {
                if line.contains("IPv4 Address") || 
                   line.contains("Subnet Mask") || 
                   line.contains("Default Gateway") {
                    println!("  {}", line.trim());
                }
            }
        }
        Err(_) => {
            println!("  ❌ Could not retrieve network information");
            println!("  💡 Run 'ipconfig' manually to check your network settings");
        }
    }
} 