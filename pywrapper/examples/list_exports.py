import importlib.util
import sys
from pathlib import Path

# Find the .pyd file
pyd_path = Path(__file__).parent.parent / 'python' / 'rust_ethernet_ip' / 'rust_ethernet_ip.cp312-win_amd64.pyd'
spec = importlib.util.spec_from_file_location('rust_ethernet_ip_ext', str(pyd_path))
ext = importlib.util.module_from_spec(spec)
sys.modules['rust_ethernet_ip_ext'] = ext
spec.loader.exec_module(ext)

print(sorted(dir(ext))) 