using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Threading;
using WpfExample.Models;
using RustEtherNetIp;

namespace WpfExample.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private EtherNetIpClient? _plcClient;
        private DispatcherTimer? _refreshTimer;

        [ObservableProperty]
        private string plcAddress = "192.168.0.1:44818";

        [ObservableProperty]
        private bool isConnected;

        [ObservableProperty]
        private string connectionStatus = "Disconnected";

        [ObservableProperty]
        private string sessionId = "None";

        [ObservableProperty]
        private int readRate;

        [ObservableProperty]
        private int writeRate;

        public ObservableCollection<PlcTag> Tags { get; } = new();
        public ObservableCollection<string> LogMessages { get; } = new();

        public MainViewModel()
        {
            InitializeTags();
            SetupTimer();
        }

        private void InitializeTags()
        {
            Tags.Add(new PlcTag("TestTag", "BOOL"));
            Tags.Add(new PlcTag("TestDint", "DINT"));
            Tags.Add(new PlcTag("TestReal", "REAL"));
        }

        private void SetupTimer()
        {
            _refreshTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _refreshTimer.Tick += RefreshTimer_Tick;
        }

        [RelayCommand]
        private async Task ConnectAsync()
        {
            try
            {
                LogMessage("🔌 Connecting to PLC...");
                
                _plcClient = new EtherNetIpClient();
                
                if (_plcClient.Connect(PlcAddress))
                {
                    IsConnected = true;
                    ConnectionStatus = "Connected";
                    SessionId = $"0x{_plcClient.ClientId:X8}";
                    
                    _refreshTimer?.Start();
                    LogMessage($"✅ Connected! Session ID: {SessionId}");
                }
                else
                {
                    LogMessage("❌ Connection failed!");
                    _plcClient?.Dispose();
                    _plcClient = null;
                }
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Connection error: {ex.Message}");
                _plcClient?.Dispose();
                _plcClient = null;
            }
        }

        [RelayCommand]
        private void Disconnect()
        {
            try
            {
                _refreshTimer?.Stop();
                
                _plcClient?.Dispose();
                _plcClient = null;
                
                IsConnected = false;
                ConnectionStatus = "Disconnected";
                SessionId = "None";
                
                // Clear tag values
                foreach (var tag in Tags)
                {
                    tag.Value = null;
                    tag.HasError = false;
                    tag.ErrorMessage = null;
                }
                
                LogMessage("📤 Disconnected from PLC");
            }
            catch (Exception ex)
            {
                LogMessage($"⚠️ Disconnect error: {ex.Message}");
            }
        }

        [RelayCommand]
        private void ToggleMotor()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                var testTag = Tags.FirstOrDefault(t => t.Name == "TestTag");
                if (testTag?.Value is bool currentValue)
                {
                    _plcClient.WriteBool("TestTag", !currentValue);
                    LogMessage($"✏️ Motor toggled to: {(!currentValue ? "ON" : "OFF")}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Toggle error: {ex.Message}");
            }
        }

        [RelayCommand]
        private void ResetCounter()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                _plcClient.WriteDint("TestDint", 0);
                LogMessage("✏️ Counter reset to 0");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Reset error: {ex.Message}");
            }
        }

        [RelayCommand]
        private void RunBenchmark()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                LogMessage("⚡ Running performance benchmark...");
                
                // Read performance test
                var readStart = DateTime.Now;
                int readSuccess = 0;
                
                for (int i = 0; i < 10; i++)
                {
                    try
                    {
                        _plcClient.ReadBool("TestTag");
                        readSuccess++;
                    }
                    catch { }
                }
                
                var readDuration = (DateTime.Now - readStart).TotalSeconds;
                ReadRate = (int)(readSuccess / readDuration);
                
                // Write performance test
                var writeStart = DateTime.Now;
                int writeSuccess = 0;
                
                for (int i = 0; i < 10; i++)
                {
                    try
                    {
                        _plcClient.WriteDint("TestDint", i);
                        writeSuccess++;
                    }
                    catch { }
                }
                
                var writeDuration = (DateTime.Now - writeStart).TotalSeconds;
                WriteRate = (int)(writeSuccess / writeDuration);
                
                LogMessage($"📊 Performance: {ReadRate} read ops/sec, {WriteRate} write ops/sec");
            }
            catch (Exception ex)
            {
                LogMessage($"⚠️ Benchmark error: {ex.Message}");
            }
        }

        private async void RefreshTimer_Tick(object? sender, EventArgs e)
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                // Read all tags
                foreach (var tag in Tags)
                {
                    try
                    {
                        object value = tag.DataType switch
                        {
                            "BOOL" => _plcClient.ReadBool(tag.Name),
                            "DINT" => _plcClient.ReadDint(tag.Name),
                            "REAL" => _plcClient.ReadReal(tag.Name),
                            _ => "Unknown"
                        };
                        
                        tag.UpdateValue(value);
                    }
                    catch (Exception ex)
                    {
                        tag.SetError(ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                LogMessage($"⚠️ Refresh error: {ex.Message}");
            }
        }

        private void LogMessage(string message)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            var logEntry = $"[{timestamp}] {message}";
            
            Application.Current.Dispatcher.Invoke(() =>
            {
                LogMessages.Insert(0, logEntry);
                
                // Keep only last 100 messages
                while (LogMessages.Count > 100)
                {
                    LogMessages.RemoveAt(LogMessages.Count - 1);
                }
            });
        }
    }
}