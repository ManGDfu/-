from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "mssql+pyodbc:///?odbc_connect="
        "DRIVER%3D%7BODBC+Driver+18+for+SQL+Server%7D%3B"
        "SERVER%3Dlocalhost%5CSQLEXPRESS%3B"
        "DATABASE%3Dmaster%3B"
        "Trusted_Connection%3Dyes%3B"
        "TrustServerCertificate%3Dyes"
    )
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
