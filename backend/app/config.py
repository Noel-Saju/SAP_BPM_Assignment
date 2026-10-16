import os
from dataclasses import dataclass
from urllib.parse import urlsplit


class ConfigurationError(ValueError):
    """Raised when required application configuration is missing or invalid."""


@dataclass(frozen=True)
class Settings:
    api_key: str | None
    model: str
    cors_origins: list[str]
    host: str
    port: int
    provider_timeout_seconds: float
    max_concurrent_analyses: int
    rate_limit_requests: int
    rate_limit_window_seconds: int
    fallback_models: tuple[str, ...] = ()

    @classmethod
    def from_env(cls) -> "Settings":
        origins_value = os.getenv("CORS_ORIGINS", "")
        origins = [origin.strip().rstrip("/") for origin in origins_value.split(",") if origin.strip()]
        if not origins:
            raise ConfigurationError(
                "Set CORS_ORIGINS to the exact browser origin(s) allowed to call the API."
            )

        for origin in origins:
            parsed = urlsplit(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path:
                raise ConfigurationError(f"Invalid CORS origin: {origin}")

        try:
            port = int(os.getenv("PORT", "8000"))
            timeout = float(os.getenv("PROVIDER_TIMEOUT_SECONDS", "60"))
            concurrency = int(os.getenv("MAX_CONCURRENT_ANALYSES", "4"))
            rate_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "5"))
            rate_window = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        except ValueError as exc:
            raise ConfigurationError("Port and request limits must be numeric values.") from exc

        if not 1 <= port <= 65535:
            raise ConfigurationError("PORT must be between 1 and 65535.")
        if timeout <= 0 or concurrency < 1 or rate_requests < 1 or rate_window < 1:
            raise ConfigurationError("Timeout and request limits must be positive.")

        return cls(
            api_key=os.getenv("GEMINI_API_KEY") or None,
            model=os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
            cors_origins=origins,
            host=os.getenv("HOST", "127.0.0.1"),
            port=port,
            provider_timeout_seconds=timeout,
            max_concurrent_analyses=concurrency,
            rate_limit_requests=rate_requests,
            rate_limit_window_seconds=rate_window,
            fallback_models=tuple(
                model.strip()
                for model in os.getenv(
                    "GEMINI_FALLBACK_MODELS",
                    "gemini-3.6-flash,gemini-2.5-flash",
                ).split(",")
                if model.strip()
            ),
        )