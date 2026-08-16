from threading import Lock


class InMemoryCache:
    """Tiny process-local cache for deterministic, role-scoped intelligence."""

    def __init__(self):
        self._data: dict = {}
        self._lock = Lock()

    def get_or_set(self, key: str, factory):
        with self._lock:
            if key in self._data:
                return self._data[key]
        value = factory()
        with self._lock:
            self._data[key] = value
        return value

    def invalidate(self, key: str | None = None):
        with self._lock:
            if key is None:
                self._data.clear()
            else:
                self._data.pop(key, None)


calibration_cache = InMemoryCache()
market_cache = InMemoryCache()
