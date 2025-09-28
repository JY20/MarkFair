from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    environment: str = "development"

    # Database (required)
    database_url: str

    # Clerk (required except audience which may be empty)
    clerk_jwks_url: str
    clerk_issuer: str
    clerk_audience: str | None = None
    clerk_secret_key: str | None = None

    # YouTube (required for stats)
    youtube_api_key: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


settings = Settings()  # loaded at import;


