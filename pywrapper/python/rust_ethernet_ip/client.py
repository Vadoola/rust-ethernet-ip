import asyncio
from typing import Any, List, Tuple, Optional, Union

# Import the Rust extension module (must be built with maturin or setuptools-rust)
try:
    from .rust_ethernet_ip import (
        PyEipClient,
        PyPlcValue,
        PySubscriptionOptions,
    )
except ImportError as e:
    raise ImportError("The Rust extension module 'rust_ethernet_ip' could not be imported. Build it with maturin or setuptools-rust.") from e

class EipClient:
    """
    Async EtherNet/IP client for Allen-Bradley PLCs (Python wrapper for Rust).
    """
    def __init__(self, inner: Any):
        self._inner = inner

    @classmethod
    async def connect(cls, address: str) -> 'EipClient':
        loop = asyncio.get_running_loop()
        inner = await loop.run_in_executor(None, lambda: PyEipClient(addr=address))
        return cls(inner)

    async def read_tag(self, tag_name: str) -> PyPlcValue:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.read_tag(tag_name))

    async def write_tag(self, tag_name: str, value: PyPlcValue) -> None:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.write_tag(tag_name, value))

    async def read_tags_batch(self, tag_names: List[str]) -> List[Tuple[str, Union[PyPlcValue, Exception]]]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.read_tags_batch(tag_names))

    async def write_tags_batch(self, tag_values: List[Tuple[str, PyPlcValue]]) -> List[Tuple[str, Union[None, Exception]]]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.write_tags_batch(tag_values))

    async def unregister_session(self) -> None:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._inner.unregister_session)

    async def subscribe_to_tag(self, tag_name: str, options: Optional[PySubscriptionOptions] = None) -> None:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.subscribe_to_tag(tag_name, options))

    async def subscribe_to_tags(self, tags: List[Tuple[str, PySubscriptionOptions]]) -> None:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self._inner.subscribe_to_tags(tags))

# Re-export types for convenience
PlcValue = PyPlcValue
SubscriptionOptions = PySubscriptionOptions

__all__ = [
    'EipClient',
    'PlcValue',
    'SubscriptionOptions',
] 