import importlib.util
import sys
import os

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../python')))

# Import the extension module
import rust_ethernet_ip.rust_ethernet_ip as ext

print("Available attributes in rust_ethernet_ip.rust_ethernet_ip:")
for name in sorted(dir(ext)):
    if not name.startswith('__'):
        attr = getattr(ext, name)
        print(f"{name}: {type(attr).__name__}") 