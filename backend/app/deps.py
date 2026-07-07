from collections.abc import Generator

from fastapi import Depends, Header
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import UnauthorizedError
from app.database import SessionLocal
from app.models.security import SysUser
from app.schemas.auth import UserOut


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> SysUser:
    if not x_user_id:
        raise UnauthorizedError("Missing X-User-Id header")
    user = (
        db.query(SysUser)
        .options(joinedload(SysUser.role))
        .filter(SysUser.user_id == x_user_id)
        .first()
    )
    if user is None:
        raise UnauthorizedError("Invalid user")
    return user


def get_current_user_out(current_user: SysUser = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
