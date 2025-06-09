import tkinter as tk
from tkinter import messagebox
from rust_ethernet_ip import PyEipClient, PyPlcValue

class EipClientUI:
    def __init__(self, root):
        self.root = root
        self.root.title("EtherNet/IP Client UI")
        self.client = None
        self.setup_ui()

    def setup_ui(self):
        # Connect button
        self.connect_button = tk.Button(self.root, text="Connect", command=self.connect)
        self.connect_button.pack(pady=5)

        # Read button
        self.read_button = tk.Button(self.root, text="Read Tag", command=self.read_tag)
        self.read_button.pack(pady=5)

        # Write button
        self.write_button = tk.Button(self.root, text="Write Tag", command=self.write_tag)
        self.write_button.pack(pady=5)

    def connect(self):
        try:
            self.client = PyEipClient(addr="192.168.0.1:44818")
            messagebox.showinfo("Success", "Connected to PLC")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to connect: {e}")

    def read_tag(self):
        if not self.client:
            messagebox.showerror("Error", "Not connected")
            return
        try:
            value = self.client.read_tag("TestDINT")
            messagebox.showinfo("Read Result", f"Read TestDINT: {value}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to read tag: {e}")

    def write_tag(self):
        if not self.client:
            messagebox.showerror("Error", "Not connected")
            return
        try:
            new_value = PyPlcValue.dint(42)
            result = self.client.write_tag("TestDINT", new_value)
            if result:
                messagebox.showinfo("Success", "Successfully wrote new value")
            else:
                messagebox.showerror("Error", "Failed to write value")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to write tag: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = EipClientUI(root)
    root.mainloop() 