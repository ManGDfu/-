from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Unicode
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    pass


class SysRole(Base):
    __tablename__ = "sys_role"

    role_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    role_name: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    permission_desc: Mapped[str | None] = mapped_column(Unicode(200))

    users: Mapped[list[SysUser]] = relationship(back_populates="role")


class SysUser(Base):
    __tablename__ = "sys_user"

    user_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    role_id: Mapped[str] = mapped_column(String(20), ForeignKey("sys_role.role_id"), nullable=False)
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    login_password: Mapped[str] = mapped_column(String(100), nullable=False)
    real_name: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    role: Mapped[SysRole] = relationship(back_populates="users")
