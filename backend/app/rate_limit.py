import asyncio
import time
from collections import defaultdict, deque


class InMemoryRateLimiter:
    """Simple per-process sliding-window limiter for a single API instance."""

    def __init__(self, max_requests: int, window_seconds: int):
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def allow(self, client_id: str) -> bool:
        now = time.monotonic()
        cutoff = now - self._window_seconds
        async with self._lock:
            if len(self._requests) > 1000:
                expired_clients = [
                    client_id
                    for client_id, timestamps in self._requests.items()
                    if not timestamps or timestamps[-1] <= cutoff
                ]
                for expired_client in expired_clients:
                    self._requests.pop(expired_client, None)
            if client_id not in self._requests and len(self._requests) >= 5000:
                self._requests.pop(next(iter(self._requests)))
            requests = self._requests[client_id]
            while requests and requests[0] <= cutoff:
                requests.popleft()
            if len(requests) >= self._max_requests:
                return False
            requests.append(now)
            return True