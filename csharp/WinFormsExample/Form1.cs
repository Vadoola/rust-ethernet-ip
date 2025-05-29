// Form1.cs - Complete Windows Forms Example (No Designer)
using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using RustEtherNetIp;

namespace PlcMonitorWinForms
{
    public class Form1 : Form
    {
        private EtherNetIpClient? _plcClient;
        private System.Windows.Forms.Timer? _refreshTimer;
        private bool _isConnected = false;

        public Form1()
        {
            InitializeComponent();
            SetupTimer();
        }

        private void InitializeComponent()
        {
            // Form setup
            this.SuspendLayout();
            
            this.Text = "🦀 Rust EtherNet/IP - PLC Monitor";
            this.ClientSize = new Size(480, 450);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;

            // Connection controls
            var lblAddress = new Label()
            {
                Text = "PLC Address:",
                Location = new Point(20, 20),
                Size = new Size(80, 23),
                AutoSize = false
            };
            this.Controls.Add(lblAddress);

            var txtAddress = new TextBox()
            {
                Name = "txtAddress",
                Text = "192.168.0.1:44818",
                Location = new Point(110, 20),
                Size = new Size(150, 23)
            };
            this.Controls.Add(txtAddress);

            var btnConnect = new Button()
            {
                Name = "btnConnect",
                Text = "Connect",
                Location = new Point(280, 20),
                Size = new Size(75, 23),
                BackColor = Color.LightGreen,
                UseVisualStyleBackColor = false
            };
            this.Controls.Add(btnConnect);

            var btnDisconnect = new Button()
            {
                Name = "btnDisconnect",
                Text = "Disconnect",
                Location = new Point(365, 20),
                Size = new Size(75, 23),
                BackColor = Color.LightCoral,
                UseVisualStyleBackColor = false,
                Enabled = false
            };
            this.Controls.Add(btnDisconnect);

            var lblStatus = new Label()
            {
                Name = "lblStatus",
                Text = "❌ Disconnected",
                Location = new Point(20, 55),
                Size = new Size(200, 23),
                ForeColor = Color.Red,
                Font = new Font("Arial", 9, FontStyle.Bold),
                AutoSize = false
            };
            this.Controls.Add(lblStatus);

            // Separator line
            var separator1 = new Label()
            {
                Text = "────────────────────────────────────────────────",
                Location = new Point(20, 85),
                Size = new Size(440, 20),
                ForeColor = Color.Gray,
                AutoSize = false
            };
            this.Controls.Add(separator1);

            // Tag monitoring section
            var lblMonitorTitle = new Label()
            {
                Text = "📊 Tag Monitoring:",
                Location = new Point(20, 110),
                Size = new Size(200, 23),
                Font = new Font("Arial", 10, FontStyle.Bold),
                AutoSize = false
            };
            this.Controls.Add(lblMonitorTitle);

            var lblMotorStatus = new Label()
            {
                Name = "lblMotorStatus",
                Text = "Motor Status: Unknown",
                Location = new Point(40, 140),
                Size = new Size(200, 23),
                AutoSize = false
            };
            this.Controls.Add(lblMotorStatus);

            var lblCounter = new Label()
            {
                Name = "lblCounter",
                Text = "Counter: Unknown",
                Location = new Point(40, 170),
                Size = new Size(200, 23),
                AutoSize = false
            };
            this.Controls.Add(lblCounter);

            var lblTemperature = new Label()
            {
                Name = "lblTemperature",
                Text = "Temperature: Unknown",
                Location = new Point(40, 200),
                Size = new Size(200, 23),
                AutoSize = false
            };
            this.Controls.Add(lblTemperature);

            // Separator line
            var separator2 = new Label()
            {
                Text = "────────────────────────────────────────────────",
                Location = new Point(20, 230),
                Size = new Size(440, 20),
                ForeColor = Color.Gray,
                AutoSize = false
            };
            this.Controls.Add(separator2);

            // Control section
            var lblControlTitle = new Label()
            {
                Text = "🎮 Controls:",
                Location = new Point(20, 255),
                Size = new Size(200, 23),
                Font = new Font("Arial", 10, FontStyle.Bold),
                AutoSize = false
            };
            this.Controls.Add(lblControlTitle);

            var btnToggleMotor = new Button()
            {
                Name = "btnToggleMotor",
                Text = "Toggle Motor",
                Location = new Point(40, 285),
                Size = new Size(100, 30),
                BackColor = Color.LightBlue,
                UseVisualStyleBackColor = false,
                Enabled = false
            };
            this.Controls.Add(btnToggleMotor);

            var btnResetCounter = new Button()
            {
                Name = "btnResetCounter",
                Text = "Reset Counter",
                Location = new Point(150, 285),
                Size = new Size(100, 30),
                BackColor = Color.LightYellow,
                UseVisualStyleBackColor = false,
                Enabled = false
            };
            this.Controls.Add(btnResetCounter);

            // Log section
            var lblLogTitle = new Label()
            {
                Text = "📝 Activity Log:",
                Location = new Point(20, 325),
                Size = new Size(200, 23),
                Font = new Font("Arial", 10, FontStyle.Bold),
                AutoSize = false
            };
            this.Controls.Add(lblLogTitle);

            var txtLog = new TextBox()
            {
                Name = "txtLog",
                Location = new Point(20, 355),
                Size = new Size(440, 80),
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                ReadOnly = true,
                Font = new Font("Consolas", 8),
                BackColor = Color.Black,
                ForeColor = Color.Lime
            };
            this.Controls.Add(txtLog);

            // Wire up events
            btnConnect.Click += async (s, e) => await BtnConnect_Click(s, e);
            btnDisconnect.Click += (s, e) => BtnDisconnect_Click(s, e);
            btnToggleMotor.Click += async (s, e) => await BtnToggleMotor_Click(s, e);
            btnResetCounter.Click += async (s, e) => await BtnResetCounter_Click(s, e);

            this.ResumeLayout(true);
            this.PerformLayout();
        }

        private void SetupTimer()
        {
            _refreshTimer = new System.Windows.Forms.Timer();
            _refreshTimer.Interval = 1000; // 1 second
            _refreshTimer.Tick += async (s, e) => await RefreshTimer_Tick(s, e);
        }

        private async Task BtnConnect_Click(object? sender, EventArgs e)
        {
            try
            {
                var btnConnect = this.Controls["btnConnect"] as Button;
                var txtAddress = this.Controls["txtAddress"] as TextBox;
                var lblStatus = this.Controls["lblStatus"] as Label;
                var btnDisconnect = this.Controls["btnDisconnect"] as Button;

                if (btnConnect == null || txtAddress == null || lblStatus == null || btnDisconnect == null) return;

                btnConnect.Enabled = false;
                LogMessage("🔌 Connecting to PLC...");

                _plcClient = new EtherNetIpClient();

                bool connected = await Task.Run(() => _plcClient.Connect(txtAddress.Text));

                if (connected)
                {
                    _isConnected = true;
                    lblStatus.Text = "✅ Connected";
                    lblStatus.ForeColor = Color.Green;

                    btnConnect.Enabled = false;
                    btnDisconnect.Enabled = true;
                    txtAddress.Enabled = false;

                    // Enable control buttons
                    if (this.Controls["btnToggleMotor"] is Button btnToggle)
                        btnToggle.Enabled = true;
                    if (this.Controls["btnResetCounter"] is Button btnReset)
                        btnReset.Enabled = true;

                    _refreshTimer?.Start();
                    LogMessage($"✅ Connected! Client ID: {_plcClient.ClientId}");
                }
                else
                {
                    LogMessage("❌ Connection failed!");
                    btnConnect.Enabled = true;
                    _plcClient?.Dispose();
                    _plcClient = null;
                }
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Connection error: {ex.Message}");
                var btnConnect = this.Controls["btnConnect"] as Button;
                if (btnConnect != null) btnConnect.Enabled = true;
            }
        }

        private void BtnDisconnect_Click(object? sender, EventArgs e)
        {
            DisconnectFromPlc();
        }

        private async Task BtnToggleMotor_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            try
            {
                // Read current state
                bool currentState = await Task.Run(() => _plcClient.ReadBool("TestTag"));
                
                // Toggle it
                bool newState = !currentState;
                await Task.Run(() => _plcClient.WriteBool("TestTag", newState));
                
                LogMessage($"✏️ Motor toggled to: {(newState ? "ON" : "OFF")}");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Toggle error: {ex.Message}");
            }
        }

        private async Task BtnResetCounter_Click(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            try
            {
                await Task.Run(() => _plcClient.WriteDint("TestDint", 0));
                LogMessage("✏️ Counter reset to 0");
            }
            catch (Exception ex)
            {
                LogMessage($"❌ Reset error: {ex.Message}");
            }
        }

        private async Task RefreshTimer_Tick(object? sender, EventArgs e)
        {
            if (!_isConnected || _plcClient == null) return;

            try
            {
                await Task.Run(() =>
                {
                    // Read all tags
                    bool motorRunning = _plcClient.ReadBool("TestTag");
                    int counter = _plcClient.ReadDint("TestDint");
                    float temperature = _plcClient.ReadReal("TestReal");

                    // Update UI on main thread
                    this.Invoke(new Action(() =>
                    {
                        if (this.Controls["lblMotorStatus"] is Label lblMotor)
                            lblMotor.Text = $"Motor Status: {(motorRunning ? "🟢 RUNNING" : "🔴 STOPPED")}";

                        if (this.Controls["lblCounter"] is Label lblCounter)
                            lblCounter.Text = $"Counter: {counter:N0}";

                        if (this.Controls["lblTemperature"] is Label lblTemp)
                            lblTemp.Text = $"Temperature: {temperature:F1}°C";
                    }));
                });
            }
            catch (Exception ex)
            {
                this.Invoke(new Action(() => LogMessage($"⚠️ Read error: {ex.Message}")));
            }
        }

        private void DisconnectFromPlc()
        {
            _refreshTimer?.Stop();
            _isConnected = false;

            _plcClient?.Dispose();
            _plcClient = null;

            // Update UI
            if (this.Controls["lblStatus"] is Label lblStatus)
            {
                lblStatus.Text = "❌ Disconnected";
                lblStatus.ForeColor = Color.Red;
            }

            if (this.Controls["btnConnect"] is Button btnConnect)
                btnConnect.Enabled = true;
            if (this.Controls["btnDisconnect"] is Button btnDisconnect)
                btnDisconnect.Enabled = false;
            if (this.Controls["txtAddress"] is TextBox txtAddress)
                txtAddress.Enabled = true;

            // Disable control buttons
            if (this.Controls["btnToggleMotor"] is Button btnToggle)
                btnToggle.Enabled = false;
            if (this.Controls["btnResetCounter"] is Button btnReset)
                btnReset.Enabled = false;

            // Reset displays
            if (this.Controls["lblMotorStatus"] is Label lblMotor)
                lblMotor.Text = "Motor Status: Unknown";
            if (this.Controls["lblCounter"] is Label lblCounter)
                lblCounter.Text = "Counter: Unknown";
            if (this.Controls["lblTemperature"] is Label lblTemp)
                lblTemp.Text = "Temperature: Unknown";

            LogMessage("📤 Disconnected from PLC");
        }

        private void LogMessage(string message)
        {
            if (this.Controls["txtLog"] is TextBox txtLog)
            {
                if (txtLog.InvokeRequired)
                {
                    txtLog.Invoke(new Action(() => LogMessage(message)));
                    return;
                }

                var timestamp = DateTime.Now.ToString("HH:mm:ss");
                txtLog.AppendText($"[{timestamp}] {message}\r\n");
                txtLog.SelectionStart = txtLog.Text.Length;
                txtLog.ScrollToCaret();
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            DisconnectFromPlc();
            base.OnFormClosing(e);
        }
    }
}