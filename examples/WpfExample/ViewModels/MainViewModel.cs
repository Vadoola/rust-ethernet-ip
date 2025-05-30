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
        private bool _isRefreshing;
        private readonly object _refreshLock = new();

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

        [ObservableProperty]
        private string tagToDiscover = string.Empty;

        [ObservableProperty]
        private string tagName = string.Empty;

        [ObservableProperty]
        private string tagValue = string.Empty;

        [ObservableProperty]
        private string selectedDataType = "BOOL";

        public ObservableCollection<string> DataTypes { get; } = new()
        {
            "BOOL",
            "DINT",
            "REAL",
            "STRING"
        };

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
                Interval = TimeSpan.FromMilliseconds(100)
            };
            _refreshTimer.Tick += RefreshTimer_Tick;
        }

        [RelayCommand]
        private async Task ConnectAsync()
        {
            try
            {
                LogMessage("🔌 Connecting to PLC...");
                
                // Create and connect on background thread
                await Task.Run(() =>
                {
                    _plcClient = new EtherNetIpClient();
                    return _plcClient.Connect(PlcAddress);
                }).ContinueWith(t =>
                {
                    if (t.Result)
                    {
                        IsConnected = true;
                        ConnectionStatus = "Connected";
                        SessionId = $"0x{_plcClient?.ClientId:X8}";
                        
                        _refreshTimer?.Start();
                        LogMessage($"✅ Connected! Session ID: {SessionId}");
                    }
                    else
                    {
                        LogMessage("❌ Connection failed!");
                        _plcClient?.Dispose();
                        _plcClient = null;
                    }
                }, TaskScheduler.FromCurrentSynchronizationContext());
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
        private void DiscoverTag()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                LogMessage($"🔍 Discovering tag: {TagToDiscover}");
                
                // Try to read the tag to determine its type
                try
                {
                    var boolValue = _plcClient.ReadBool(TagToDiscover);
                    SelectedDataType = "BOOL";
                    TagName = TagToDiscover;
                    TagValue = boolValue.ToString();
                    LogMessage($"✅ Discovered BOOL tag: {TagToDiscover} = {boolValue}");
                    return;
                }
                catch { }

                try
                {
                    var dintValue = _plcClient.ReadDint(TagToDiscover);
                    SelectedDataType = "DINT";
                    TagName = TagToDiscover;
                    TagValue = dintValue.ToString();
                    LogMessage($"✅ Discovered DINT tag: {TagToDiscover} = {dintValue}");
                    return;
                }
                catch { }

                try
                {
                    var realValue = _plcClient.ReadReal(TagToDiscover);
                    SelectedDataType = "REAL";
                    TagName = TagToDiscover;
                    TagValue = realValue.ToString();
                    LogMessage($"✅ Discovered REAL tag: {TagToDiscover} = {realValue}");
                    return;
                }
                catch { }

                try
                {
                    var stringValue = _plcClient.ReadString(TagToDiscover);
                    SelectedDataType = "STRING";
                    TagName = TagToDiscover;
                    TagValue = stringValue;
                    LogMessage($"✅ Discovered STRING tag: {TagToDiscover} = {stringValue}");
                    return;
                }
                catch { }

                LogMessage($"❌ Could not determine type for tag: {TagToDiscover}");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Discovery error: {ex.Message}");
            }
        }

        [RelayCommand]
        private void ReadTag()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                LogMessage($"📖 Reading tag: {TagName}");
                
                object value = SelectedDataType switch
                {
                    "BOOL" => _plcClient.ReadBool(TagName),
                    "DINT" => _plcClient.ReadDint(TagName),
                    "REAL" => _plcClient.ReadReal(TagName),
                    "STRING" => _plcClient.ReadString(TagName),
                    _ => throw new Exception($"Unsupported data type: {SelectedDataType}")
                };
                
                TagValue = value.ToString() ?? string.Empty;
                LogMessage($"✅ Read {SelectedDataType} tag: {TagName} = {value}");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Read error: {ex.Message}");
            }
        }

        [RelayCommand]
        private void WriteTag()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                LogMessage($"✏️ Writing tag: {TagName}");
                
                switch (SelectedDataType)
                {
                    case "BOOL":
                        if (bool.TryParse(TagValue, out bool boolValue))
                        {
                            _plcClient.WriteBool(TagName, boolValue);
                            LogMessage($"✅ Wrote BOOL tag: {TagName} = {boolValue}");
                        }
                        else
                        {
                            throw new Exception("Invalid boolean value");
                        }
                        break;
                        
                    case "DINT":
                        if (int.TryParse(TagValue, out int dintValue))
                        {
                            _plcClient.WriteDint(TagName, dintValue);
                            LogMessage($"✅ Wrote DINT tag: {TagName} = {dintValue}");
                        }
                        else
                        {
                            throw new Exception("Invalid integer value");
                        }
                        break;
                        
                    case "REAL":
                        if (float.TryParse(TagValue, out float realValue))
                        {
                            _plcClient.WriteReal(TagName, realValue);
                            LogMessage($"✅ Wrote REAL tag: {TagName} = {realValue}");
                        }
                        else
                        {
                            throw new Exception("Invalid float value");
                        }
                        break;
                        
                    case "STRING":
                        _plcClient.WriteString(TagName, TagValue);
                        LogMessage($"✅ Wrote STRING tag: {TagName} = {TagValue}");
                        break;
                        
                    default:
                        throw new Exception($"Unsupported data type: {SelectedDataType}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Write error: {ex.Message}");
            }
        }

        [RelayCommand]
        private async Task RunBenchmarkAsync()
        {
            if (!IsConnected || _plcClient == null) return;

            try
            {
                LogMessage("📊 Running benchmark...");
                
                var startTime = DateTime.Now;
                var readCount = 0;
                var writeCount = 0;
                
                // Run benchmark on background thread
                await Task.Run(() =>
                {
                    while ((DateTime.Now - startTime).TotalSeconds < 5)
                    {
                        try
                        {
                            _plcClient?.ReadBool("TestTag");
                            readCount++;
                        }
                        catch { }
                        
                        try
                        {
                            _plcClient?.WriteBool("TestTag", true);
                            writeCount++;
                        }
                        catch { }
                    }
                });
                
                ReadRate = (int)(readCount / 5.0);
                WriteRate = (int)(writeCount / 5.0);
                
                LogMessage($"✅ Benchmark complete: {ReadRate} reads/sec, {WriteRate} writes/sec");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Benchmark error: {ex.Message}");
            }
        }

        private async void RefreshTimer_Tick(object? sender, EventArgs e)
        {
            if (!IsConnected || _plcClient == null || _isRefreshing) return;

            lock (_refreshLock)
            {
                if (_isRefreshing) return;
                _isRefreshing = true;
            }

            try
            {
                // Read all tags in parallel on background thread
                await Task.Run(() =>
                {
                    Parallel.ForEach(Tags, tag =>
                    {
                        try
                        {
                            object value = tag.DataType switch
                            {
                                "BOOL" => _plcClient?.ReadBool(tag.Name) ?? false,
                                "DINT" => _plcClient?.ReadDint(tag.Name) ?? 0,
                                "REAL" => _plcClient?.ReadReal(tag.Name) ?? 0.0f,
                                _ => "Unknown"
                            };
                            
                            Application.Current.Dispatcher.Invoke(() => tag.UpdateValue(value));
                        }
                        catch (Exception ex)
                        {
                            Application.Current.Dispatcher.Invoke(() => tag.SetError(ex.Message));
                        }
                    });
                });
            }
            catch (Exception ex)
            {
                LogMessage($"⚠️ Refresh error: {ex.Message}");
            }
            finally
            {
                _isRefreshing = false;
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