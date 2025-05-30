// Form1.cs - Complete Windows Forms Example (No Designer)
using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using RustEtherNetIp;

namespace WinFormsExample
{
    public partial class Form1 : Form
    {
        private EtherNetIpClient? _client;
        private string _plcAddress = "192.168.0.1:44818";

        public Form1()
        {
            InitializeControls();
        }

        private void InitializeControls()
        {
            // Create controls
            var connectButton = new Button
            {
                Text = "Connect",
                Location = new System.Drawing.Point(10, 10),
                Size = new System.Drawing.Size(100, 30)
            };
            connectButton.Click += ConnectButton_Click;

            var addressTextBox = new TextBox
            {
                Text = _plcAddress,
                Location = new System.Drawing.Point(120, 10),
                Size = new System.Drawing.Size(200, 30)
            };
            addressTextBox.TextChanged += (s, e) => _plcAddress = addressTextBox.Text;

            var tagNameTextBox = new TextBox
            {
                Location = new System.Drawing.Point(10, 50),
                Size = new System.Drawing.Size(200, 30),
                PlaceholderText = "Enter tag name"
            };

            var discoverButton = new Button
            {
                Text = "Discover Tag",
                Location = new System.Drawing.Point(220, 50),
                Size = new System.Drawing.Size(100, 30)
            };
            discoverButton.Click += (s, e) => DiscoverTag(tagNameTextBox.Text);

            var valueTextBox = new TextBox
            {
                Location = new System.Drawing.Point(10, 90),
                Size = new System.Drawing.Size(200, 30),
                PlaceholderText = "Enter value to write"
            };

            var writeButton = new Button
            {
                Text = "Write Value",
                Location = new System.Drawing.Point(220, 90),
                Size = new System.Drawing.Size(100, 30)
            };
            writeButton.Click += (s, e) => WriteTag(tagNameTextBox.Text, valueTextBox.Text);

            var logTextBox = new TextBox
            {
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                Location = new System.Drawing.Point(10, 130),
                Size = new System.Drawing.Size(310, 200),
                ReadOnly = true
            };

            // Add controls to form
            Controls.AddRange(new Control[] 
            { 
                connectButton, 
                addressTextBox, 
                tagNameTextBox, 
                discoverButton,
                valueTextBox,
                writeButton,
                logTextBox
            });

            // Store log textbox for later use
            Tag = logTextBox;
        }

        private void Log(string message)
        {
            if (Tag is TextBox logBox)
            {
                logBox.AppendText($"{DateTime.Now:HH:mm:ss} - {message}{Environment.NewLine}");
            }
        }

        private void ConnectButton_Click(object? sender, EventArgs e)
        {
            try
            {
                _client = new EtherNetIpClient();
                _client.Connect(_plcAddress);
                Log($"Connected to PLC at {_plcAddress}");
            }
            catch (Exception ex)
            {
                Log($"Error connecting to PLC: {ex.Message}");
                _client = null;
            }
        }

        private void DiscoverTag(string tagName)
        {
            if (_client == null)
            {
                Log("Not connected to PLC");
                return;
            }

            try
            {
                // Try to read the tag to determine its type
                try
                {
                    var boolValue = _client.ReadBool(tagName);
                    Log($"Tag {tagName} is BOOL type, current value: {boolValue}");
                    return;
                }
                catch { }

                try
                {
                    var dintValue = _client.ReadDint(tagName);
                    Log($"Tag {tagName} is DINT type, current value: {dintValue}");
                    return;
                }
                catch { }

                try
                {
                    var realValue = _client.ReadReal(tagName);
                    Log($"Tag {tagName} is REAL type, current value: {realValue}");
                    return;
                }
                catch { }

                try
                {
                    var stringValue = _client.ReadString(tagName);
                    Log($"Tag {tagName} is STRING type, current value: {stringValue}");
                    return;
                }
                catch { }

                Log($"Could not determine type for tag {tagName}");
            }
            catch (Exception ex)
            {
                Log($"Error discovering tag: {ex.Message}");
            }
        }

        private void WriteTag(string tagName, string value)
        {
            if (_client == null)
            {
                Log("Not connected to PLC");
                return;
            }

            if (string.IsNullOrEmpty(tagName))
            {
                Log("Please enter a tag name");
                return;
            }

            if (string.IsNullOrEmpty(value))
            {
                Log("Please enter a value to write");
                return;
            }

            try
            {
                // Try to write as different types
                try
                {
                    if (bool.TryParse(value, out bool boolValue))
                    {
                        _client.WriteBool(tagName, boolValue);
                        Log($"Successfully wrote BOOL value {boolValue} to tag {tagName}");
                        return;
                    }
                }
                catch { }

                try
                {
                    if (int.TryParse(value, out int dintValue))
                    {
                        _client.WriteDint(tagName, dintValue);
                        Log($"Successfully wrote DINT value {dintValue} to tag {tagName}");
                        return;
                    }
                }
                catch { }

                try
                {
                    if (float.TryParse(value, out float realValue))
                    {
                        _client.WriteReal(tagName, realValue);
                        Log($"Successfully wrote REAL value {realValue} to tag {tagName}");
                        return;
                    }
                }
                catch { }

                try
                {
                    _client.WriteString(tagName, value);
                    Log($"Successfully wrote STRING value {value} to tag {tagName}");
                    return;
                }
                catch { }

                Log($"Could not write value {value} to tag {tagName}");
            }
            catch (Exception ex)
            {
                Log($"Error writing to tag: {ex.Message}");
            }
        }
    }
}