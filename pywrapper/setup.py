from setuptools import setup, find_packages

setup(
    name="rust_ethernet_ip",
    version="0.5.1",
    packages=find_packages(where="python"),
    package_dir={"": "python"},
    python_requires=">=3.7",
    install_requires=[],
) 