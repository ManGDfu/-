from typing import Any, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    keyword: str = ""


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
