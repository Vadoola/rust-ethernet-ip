using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using RustEtherNetIp;

namespace WinFormsExample
{
    public partial class MainForm : Form
    {
        private EtherNetIpClient? _plcClient;
        private bool _isConnected;
        private string _currentAddress = string.Empty;
        private System.Windows.Forms.Timer? _refreshTimer;
        private System.Windows.Forms.Timer? _connectionMonitorTimer;
        private Dictionary<string, TagInfo> _tags = new();
        private int _retryCount = 0;
        private const int MAX_RETRIES = 3;
        private const int RETRY_DELAY = 2000;

        public MainForm()
        {
            InitializeComponent();
            InitializeCustomComponents();
            SetupTimers();
            UpdateConnectionStatus();
        }

        private void InitializeCustomComponents()
        {
            // Set form properties
            this.Text = "🦀 Rust EtherNet/IP - WinForms Demo";
            this.Size = new Size(1200, 800);
            this.StartPosition = FormStartPosition.CenterScreen;

            // Create main layout
            var mainLayout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                Padding = new Padding(10)
            };
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 100));
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 80));
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 200));

            // Header Panel
            var headerPanel = CreateHeaderPanel();
            mainLayout.Controls.Add(headerPanel, 0, 0);

            // Performance Panel
            var performancePanel = CreatePerformancePanel();
            mainLayout.Controls.Add(performancePanel, 0, 1);

            // Main Content Panel
            var contentPanel = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 2,
                RowCount = 1
            };
            contentPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
            contentPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));

            // Tag Monitoring Panel
            var tagPanel = CreateTagPanel();
            contentPanel.Controls.Add(tagPanel, 0, 0);

            // Activity Log Panel
            var logPanel = CreateLogPanel();
            contentPanel.Controls.Add(logPanel, 1, 0);

            mainLayout.Controls.Add(contentPanel, 0, 2);

            // Add the main layout to the form
            this.Controls.Add(mainLayout);
        }

        private Panel CreateHeaderPanel()
        {
            var panel = new Panel { Dock = DockStyle.Fill };

            // PLC Address input
            var plcAddressLabel = new Label
            {
                Text = "PLC Address:",
                Location = new Point(10, 15),
                AutoSize = true
            };
            panel.Controls.Add(plcAddressLabel);

            var plcAddressTextBox = new TextBox
            {
                Name = "plcAddressTextBox",
                Location = new Point(100, 12),
                Size = new Size(200, 23),
                Text = "192.168.0.1:44818"
            };
            panel.Controls.Add(plcAddressTextBox);

            // Connect/Disconnect buttons
            var connectButton = new Button
            {
                Name = "connectButton",
                Text = "Connect",
                Location = new Point(320, 11),
                Size = new Size(100, 25),
                BackColor = Color.FromArgb(34, 197, 94),
                ForeColor = Color.White
            };
            connectButton.Click += ConnectButton_Click;
            panel.Controls.Add(connectButton);

            var disconnectButton = new Button
            {
                Name = "disconnectButton",
                Text = "Disconnect",
                Location = new Point(430, 11),
                Size = new Size(100, 25),
                BackColor = Color.FromArgb(239, 68, 68),
                ForeColor = Color.White,
                Enabled = false
            };
            disconnectButton.Click += DisconnectButton_Click;
            panel.Controls.Add(disconnectButton);

            // Connection status
            var statusLabel = new Label
            {
                Name = "statusLabel",
                Text = "Disconnected",
                Location = new Point(10, 50),
                AutoSize = true,
                Font = new Font(this.Font, FontStyle.Bold),
                ForeColor = Color.FromArgb(239, 68, 68)
            };
            panel.Controls.Add(statusLabel);

            var sessionLabel = new Label
            {
                Name = "sessionLabel",
                Text = "Session: None",
                Location = new Point(10, 70),
                AutoSize = true
            };
            panel.Controls.Add(sessionLabel);

            return panel;
        }

        private Panel CreatePerformancePanel()
        {
            var panel = new Panel { Dock = DockStyle.Fill };

            // Read/Write rate labels
            var readRateLabel = new Label
            {
                Name = "readRateLabel",
                Text = "📊 Read Rate: 0 ops/sec",
                Location = new Point(10, 10),
                AutoSize = true
            };
            panel.Controls.Add(readRateLabel);

            var writeRateLabel = new Label
            {
                Name = "writeRateLabel",
                Text = "📝 Write Rate: 0 ops/sec",
                Location = new Point(200, 10),
                AutoSize = true
            };
            panel.Controls.Add(writeRateLabel);

            // Benchmark button
            var benchmarkButton = new Button
            {
                Name = "benchmarkButton",
                Text = "Run Benchmark",
                Location = new Point(400, 8),
                Size = new Size(120, 25),
                BackColor = Color.FromArgb(59, 130, 246),
                ForeColor = Color.White,
                Enabled = false
            };
            benchmarkButton.Click += BenchmarkButton_Click;
            panel.Controls.Add(benchmarkButton);

            return panel;
        }

        private Panel CreateTagPanel()
        {
            var panel = new Panel { Dock = DockStyle.Fill };

            // Tag discovery
            var discoverTextBox = new TextBox
            {
                Name = "discoverTextBox",
                Location = new Point(10, 10),
                Size = new Size(200, 23),
                PlaceholderText = "Tag to discover"
            };
            panel.Controls.Add(discoverTextBox);

            var discoverButton = new Button
            {
                Name = "discoverButton",
                Text = "Discover Tag",
                Location = new Point(220, 9),
                Size = new Size(100, 25),
                BackColor = Color.FromArgb(59, 130, 246),
                ForeColor = Color.White,
                Enabled = false
            };
            discoverButton.Click += DiscoverButton_Click;
            panel.Controls.Add(discoverButton);

            // Tag operations
            var tagNameTextBox = new TextBox
            {
                Name = "tagNameTextBox",
                Location = new Point(10, 45),
                Size = new Size(150, 23),
                PlaceholderText = "Tag name"
            };
            panel.Controls.Add(tagNameTextBox);

            var dataTypeComboBox = new ComboBox
            {
                Name = "dataTypeComboBox",
                Location = new Point(170, 45),
                Size = new Size(100, 23),
                DropDownStyle = ComboBoxStyle.DropDownList
            };
            dataTypeComboBox.Items.AddRange(new string[] { "BOOL", "DINT", "REAL", "STRING" });
            dataTypeComboBox.SelectedIndex = 0;
            panel.Controls.Add(dataTypeComboBox);

            var tagValueTextBox = new TextBox
            {
                Name = "tagValueTextBox",
                Location = new Point(280, 45),
                Size = new Size(150, 23),
                PlaceholderText = "Value"
            };
            panel.Controls.Add(tagValueTextBox);

            var readButton = new Button
            {
                Name = "readButton",
                Text = "Read",
                Location = new Point(440, 44),
                Size = new Size(80, 25),
                BackColor = Color.FromArgb(34, 197, 94),
                ForeColor = Color.White,
                Enabled = false
            };
            readButton.Click += ReadButton_Click;
            panel.Controls.Add(readButton);

            var writeButton = new Button
            {
                Name = "writeButton",
                Text = "Write",
                Location = new Point(530, 44),
                Size = new Size(80, 25),
                BackColor = Color.FromArgb(234, 179, 8),
                ForeColor = Color.White,
                Enabled = false
            };
            writeButton.Click += WriteButton_Click;
            panel.Controls.Add(writeButton);

            // Tags table
            var tagsDataGridView = new DataGridView
            {
                Name = "tagsDataGridView",
                Location = new Point(10, 80),
                Size = new Size(panel.Width - 20, panel.Height - 90),
                Dock = DockStyle.Bottom,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
            };
            tagsDataGridView.Columns.AddRange(new DataGridViewColumn[]
            {
                new DataGridViewTextBoxColumn { Name = "Name", HeaderText = "Tag Name" },
                new DataGridViewTextBoxColumn { Name = "Value", HeaderText = "Value" },
                new DataGridViewTextBoxColumn { Name = "Type", HeaderText = "Type" },
                new DataGridViewTextBoxColumn { Name = "Updated", HeaderText = "Updated" }
            });
            panel.Controls.Add(tagsDataGridView);

            return panel;
        }

        private Panel CreateLogPanel()
        {
            var panel = new Panel { Dock = DockStyle.Fill };

            var logTextBox = new TextBox
            {
                Name = "logTextBox",
                Location = new Point(10, 10),
                Size = new Size(panel.Width - 20, panel.Height - 20),
                Dock = DockStyle.Fill,
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                ReadOnly = true,
                BackColor = Color.FromArgb(17, 24, 39),
                ForeColor = Color.FromArgb(74, 222, 128),
                Font = new Font("Consolas", 9F)
            };
            panel.Controls.Add(logTextBox);

            return panel;
        }

        private void SetupTimers()
        {
            _refreshTimer = new System.Windows.Forms.Timer();
            _refreshTimer.Interval = 2000; // 2 seconds
            _refreshTimer.Tick += RefreshTimer_Tick;

            _connectionMonitorTimer = new System.Windows.Forms.Timer();
            _connectionMonitorTimer.Interval = 10000; // 10 seconds
            _connectionMonitorTimer.Tick += ConnectionMonitorTimer_Tick;

            _refreshTimer.Start();
            _connectionMonitorTimer.Start();
        }

        private void UpdateConnectionStatus()
        {
            var statusLabel = (Label)Controls.Find("statusLabel", true)[0];
            var sessionLabel = (Label)Controls.Find("sessionLabel", true)[0];
            var connectButton = (Button)Controls.Find("connectButton", true)[0];
            var disconnectButton = (Button)Controls.Find("disconnectButton", true)[0];
            var benchmarkButton = (Button)Controls.Find("benchmarkButton", true)[0];
            var discoverButton = (Button)Controls.Find("discoverButton", true)[0];
            var readButton = (Button)Controls.Find("readButton", true)[0];
            var writeButton = (Button)Controls.Find("writeButton", true)[0];

            if (_isConnected)
            {
                statusLabel.Text = "Connected";
                statusLabel.ForeColor = Color.FromArgb(16, 185, 129);
                sessionLabel.Text = $"Session: 0x{_plcClient?.ClientId:X8}";
                connectButton.Enabled = false;
                disconnectButton.Enabled = true;
                benchmarkButton.Enabled = true;
                discoverButton.Enabled = true;
                readButton.Enabled = true;
                writeButton.Enabled = true;
            }
            else
            {
                statusLabel.Text = "Disconnected";
                statusLabel.ForeColor = Color.FromArgb(239, 68, 68);
                sessionLabel.Text = "Session: None";
                connectButton.Enabled = true;
                disconnectButton.Enabled = false;
                benchmarkButton.Enabled = false;
                discoverButton.Enabled = false;
                readButton.Enabled = false;
                writeButton.Enabled = false;
            }
        }

        private void Log(string message)
        {
            var logTextBox = (TextBox)Controls.Find("logTextBox", true)[0];
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            logTextBox.AppendText($"[{timestamp}] {message}{Environment.NewLine}");
            logTextBox.ScrollToCaret();
        }

        private void ConnectButton_Click(object? sender, EventArgs e)
        {
            var plcAddressTextBox = (TextBox)Controls.Find("plcAddressTextBox", true)[0];
            var address = plcAddressTextBox.Text.Trim();

            if (string.IsNullOrEmpty(address))
            {
                Log("❌ Please enter a PLC address");
                return;
            }

            try
            {
                Log("🔌 Connecting to PLC...");
                _plcClient = new EtherNetIpClient();
                _isConnected = _plcClient.Connect(address);
                _currentAddress = address;

                if (_isConnected)
                {
                    Log($"✅ Connected! Session ID: 0x{_plcClient.ClientId:X8}");
                    UpdateConnectionStatus();
                    _ = InitializeTags();
                }
                else
                {
                    Log("❌ Connection failed");
                    _isConnected = false;
                    UpdateConnectionStatus();
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Connection error: {ex.Message}");
                _isConnected = false;
                UpdateConnectionStatus();
            }
        }

        private void DisconnectButton_Click(object? sender, EventArgs e)
        {
            try
            {
                if (_plcClient != null)
                {
                    _plcClient.Dispose();
                }
                _isConnected = false;
                _currentAddress = string.Empty;
                UpdateConnectionStatus();
                Log("📤 Disconnected from PLC");
            }
            catch (Exception ex)
            {
                Log($"⚠️ Disconnect error: {ex.Message}");
            }
        }

        private async Task InitializeTags()
        {
            var testTags = new TagInfo[]
            {
                new TagInfo { Name = "TestTag", Type = "BOOL", Value = false },
                new TagInfo { Name = "TestDint", Type = "DINT", Value = 0 },
                new TagInfo { Name = "TestReal", Type = "REAL", Value = 0.0f }
            };

            foreach (var tag in testTags)
            {
                try
                {
                    // First try to read the tag to see if it exists
                    try
                    {
                        switch (tag.Type)
                        {
                            case "BOOL":
                                _plcClient.ReadBool(tag.Name);
                                break;
                            case "DINT":
                                _plcClient.ReadDint(tag.Name);
                                break;
                            case "REAL":
                                _plcClient.ReadReal(tag.Name);
                                break;
                        }
                        Log($"✅ Tag {tag.Name} already exists");
                        continue;
                    }
                    catch { }

                    // If tag doesn't exist, try to create it
                    Log($"📝 Creating tag {tag.Name}...");
                    switch (tag.Type)
                    {
                        case "BOOL":
                            _plcClient.WriteBool(tag.Name, (bool)tag.Value);
                            break;
                        case "DINT":
                            _plcClient.WriteDint(tag.Name, (int)tag.Value);
                            break;
                        case "REAL":
                            _plcClient.WriteReal(tag.Name, (float)tag.Value);
                            break;
                    }
                    Log($"✅ Created {tag.Name}");
                }
                catch (Exception ex)
                {
                    Log($"⚠️ Error handling {tag.Name}: {ex.Message}");
                }
            }
        }

        private void RefreshTimer_Tick(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            var tagsDataGridView = (DataGridView)Controls.Find("tagsDataGridView", true)[0];
            foreach (DataGridViewRow row in tagsDataGridView.Rows)
            {
                var tagName = row.Cells["Name"].Value?.ToString();
                if (string.IsNullOrEmpty(tagName)) continue;

                try
                {
                    // Try to read the tag
                    try
                    {
                        var boolValue = _plcClient.ReadBool(tagName);
                        row.Cells["Value"].Value = boolValue;
                        row.Cells["Type"].Value = "BOOL";
                        row.Cells["Updated"].Value = DateTime.Now.ToString("HH:mm:ss.fff");
                        continue;
                    }
                    catch { }

                    try
                    {
                        var dintValue = _plcClient.ReadDint(tagName);
                        row.Cells["Value"].Value = dintValue;
                        row.Cells["Type"].Value = "DINT";
                        row.Cells["Updated"].Value = DateTime.Now.ToString("HH:mm:ss.fff");
                        continue;
                    }
                    catch { }

                    try
                    {
                        var realValue = _plcClient.ReadReal(tagName);
                        row.Cells["Value"].Value = realValue;
                        row.Cells["Type"].Value = "REAL";
                        row.Cells["Updated"].Value = DateTime.Now.ToString("HH:mm:ss.fff");
                        continue;
                    }
                    catch { }

                    Log($"⚠️ Tag {tagName} not found. Will retry initialization later.");
                }
                catch (Exception ex)
                {
                    Log($"⚠️ Error refreshing tag {tagName}: {ex.Message}");
                    if (ex.Message.Contains("Failed to fetch") || ex.Message.Contains("Connection refused"))
                    {
                        _retryCount++;
                        if (_retryCount >= MAX_RETRIES)
                        {
                            Log("⚠️ Lost connection to server. Attempting to reconnect...");
                            AttemptReconnect();
                        }
                    }
                }
            }
        }

        private void ConnectionMonitorTimer_Tick(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            try
            {
                // Try to read a tag to check connection
                _plcClient.ReadBool("TestTag");
            }
            catch
            {
                Log("⚠️ Connection lost");
                _isConnected = false;
                UpdateConnectionStatus();
                AttemptReconnect();
            }
        }

        private async void AttemptReconnect()
        {
            try
            {
                // First try to disconnect
                if (_plcClient != null)
                {
                    _plcClient.Dispose();
                }
            }
            catch (Exception ex)
            {
                Log($"Error during disconnect: {ex.Message}");
            }

            // Wait a bit before reconnecting
            await Task.Delay(RETRY_DELAY);

            try
            {
                _plcClient = new EtherNetIpClient();
                _isConnected = _plcClient.Connect(_currentAddress);

                if (_isConnected)
                {
                    Log("✅ Reconnected successfully");
                    _retryCount = 0;
                    UpdateConnectionStatus();
                }
                else
                {
                    throw new Exception("Reconnection failed");
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Reconnection failed: {ex.Message}");
                _isConnected = false;
                UpdateConnectionStatus();
            }
        }

        private void BenchmarkButton_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            try
            {
                Log("📊 Running benchmark...");
                var startTime = DateTime.Now;
                var readCount = 0;
                var writeCount = 0;

                while ((DateTime.Now - startTime).TotalSeconds < 5)
                {
                    try { _plcClient.ReadBool("TestTag"); readCount++; } catch { }
                    try { _plcClient.WriteBool("TestTag", true); writeCount++; } catch { }
                }

                var readRate = (int)(readCount / 5.0);
                var writeRate = (int)(writeCount / 5.0);

                var readRateLabel = (Label)Controls.Find("readRateLabel", true)[0];
                var writeRateLabel = (Label)Controls.Find("writeRateLabel", true)[0];

                readRateLabel.Text = $"📊 Read Rate: {readRate} ops/sec";
                writeRateLabel.Text = $"📝 Write Rate: {writeRate} ops/sec";

                Log($"✅ Benchmark complete: {readRate} reads/sec, {writeRate} writes/sec");
            }
            catch (Exception ex)
            {
                Log($"❌ Benchmark error: {ex.Message}");
            }
        }

        private void DiscoverButton_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            var discoverTextBox = (TextBox)Controls.Find("discoverTextBox", true)[0];
            var tagName = discoverTextBox.Text.Trim();

            if (string.IsNullOrEmpty(tagName))
            {
                Log("❌ Please enter a tag name to discover");
                return;
            }

            try
            {
                Log($"🔍 Discovering tag: {tagName}");

                // Try to read the tag as different types
                try
                {
                    var boolValue = _plcClient.ReadBool(tagName);
                    UpdateTagFields(tagName, "BOOL", boolValue.ToString());
                    Log($"✅ Discovered BOOL tag: {tagName} = {boolValue}");
                    return;
                }
                catch { }

                try
                {
                    var dintValue = _plcClient.ReadDint(tagName);
                    UpdateTagFields(tagName, "DINT", dintValue.ToString());
                    Log($"✅ Discovered DINT tag: {tagName} = {dintValue}");
                    return;
                }
                catch { }

                try
                {
                    var realValue = _plcClient.ReadReal(tagName);
                    UpdateTagFields(tagName, "REAL", realValue.ToString());
                    Log($"✅ Discovered REAL tag: {tagName} = {realValue}");
                    return;
                }
                catch { }

                try
                {
                    var stringValue = _plcClient.ReadString(tagName);
                    UpdateTagFields(tagName, "STRING", stringValue);
                    Log($"✅ Discovered STRING tag: {tagName} = {stringValue}");
                    return;
                }
                catch { }

                Log($"❌ Could not determine type for tag: {tagName}");
            }
            catch (Exception ex)
            {
                Log($"❌ Discovery error: {ex.Message}");
            }
        }

        private void UpdateTagFields(string tagName, string type, string value)
        {
            var tagNameTextBox = (TextBox)Controls.Find("tagNameTextBox", true)[0];
            var dataTypeComboBox = (ComboBox)Controls.Find("dataTypeComboBox", true)[0];
            var tagValueTextBox = (TextBox)Controls.Find("tagValueTextBox", true)[0];

            tagNameTextBox.Text = tagName;
            dataTypeComboBox.SelectedItem = type;
            tagValueTextBox.Text = value;
        }

        private void ReadButton_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            var tagNameTextBox = (TextBox)Controls.Find("tagNameTextBox", true)[0];
            var tagValueTextBox = (TextBox)Controls.Find("tagValueTextBox", true)[0];
            var tagName = tagNameTextBox.Text.Trim();

            if (string.IsNullOrEmpty(tagName))
            {
                Log("❌ Please enter a tag name");
                return;
            }

            try
            {
                Log($"📖 Reading tag: {tagName}");

                // Try to read the tag as different types
                try
                {
                    var boolValue = _plcClient.ReadBool(tagName);
                    tagValueTextBox.Text = boolValue.ToString();
                    Log($"✅ Read BOOL tag: {tagName} = {boolValue}");
                    return;
                }
                catch { }

                try
                {
                    var dintValue = _plcClient.ReadDint(tagName);
                    tagValueTextBox.Text = dintValue.ToString();
                    Log($"✅ Read DINT tag: {tagName} = {dintValue}");
                    return;
                }
                catch { }

                try
                {
                    var realValue = _plcClient.ReadReal(tagName);
                    tagValueTextBox.Text = realValue.ToString();
                    Log($"✅ Read REAL tag: {tagName} = {realValue}");
                    return;
                }
                catch { }

                try
                {
                    var stringValue = _plcClient.ReadString(tagName);
                    tagValueTextBox.Text = stringValue;
                    Log($"✅ Read STRING tag: {tagName} = {stringValue}");
                    return;
                }
                catch { }

                Log($"❌ Could not read tag: {tagName}");
            }
            catch (Exception ex)
            {
                Log($"❌ Read error: {ex.Message}");
            }
        }

        private void WriteButton_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            var tagNameTextBox = (TextBox)Controls.Find("tagNameTextBox", true)[0];
            var dataTypeComboBox = (ComboBox)Controls.Find("dataTypeComboBox", true)[0];
            var tagValueTextBox = (TextBox)Controls.Find("tagValueTextBox", true)[0];
            var tagName = tagNameTextBox.Text.Trim();
            var type = dataTypeComboBox.SelectedItem?.ToString() ?? string.Empty;
            var value = tagValueTextBox.Text.Trim();

            if (string.IsNullOrEmpty(tagName))
            {
                Log("❌ Please enter a tag name");
                return;
            }

            try
            {
                Log($"✏️ Writing tag: {tagName}");

                switch (type)
                {
                    case "BOOL":
                        if (bool.TryParse(value, out bool boolValue))
                        {
                            _plcClient.WriteBool(tagName, boolValue);
                            Log($"✅ Wrote {boolValue} to {tagName}");
                        }
                        else
                        {
                            Log("❌ Invalid boolean value");
                        }
                        break;

                    case "DINT":
                        if (int.TryParse(value, out int dintValue))
                        {
                            _plcClient.WriteDint(tagName, dintValue);
                            Log($"✅ Wrote {dintValue} to {tagName}");
                        }
                        else
                        {
                            Log("❌ Invalid integer value");
                        }
                        break;

                    case "REAL":
                        if (float.TryParse(value, out float realValue))
                        {
                            _plcClient.WriteReal(tagName, realValue);
                            Log($"✅ Wrote {realValue} to {tagName}");
                        }
                        else
                        {
                            Log("❌ Invalid float value");
                        }
                        break;

                    case "STRING":
                        _plcClient.WriteString(tagName, value);
                        Log($"✅ Wrote '{value}' to {tagName}");
                        break;

                    default:
                        Log($"❌ Unsupported type: {type}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Write error: {ex.Message}");
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);

            if (_plcClient != null)
            {
                _plcClient.Dispose();
            }

            _refreshTimer?.Dispose();
            _connectionMonitorTimer?.Dispose();
        }
    }

    public class TagInfo
    {
        public required string Name { get; set; }
        public required object Value { get; set; }
        public required string Type { get; set; }
        public DateTime Updated { get; set; }
    }
} 