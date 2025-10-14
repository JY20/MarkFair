from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    environment: str = "development"
    test_mode: bool = False  # Enable test mode to bypass JWT auth with X-Test-User-ID header

    # Database (required)
    database_url: str

    # Clerk (required except audience which may be empty)
    clerk_jwks_url: str
    clerk_issuer: str
    clerk_audience: str | None = None
    clerk_secret_key: str | None = None

    # YouTube (required for stats)
    youtube_api_key: str
    
    # Starknet Contract Addresses
    kolescrow_contract_address: str = "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a"

    # Starknet config
    starknet_rpc_url: str | None = None
    starknet_contract_address: str | None = None
    starknet_account_address: str | None = None
    starknet_private_key: str | None = None
    attester_pubkey: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


settings = Settings()  # loaded at import;
