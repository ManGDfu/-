from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError, UnauthorizedError
from app.core.security import generate_next_id, paginate, verify_password
from app.models.security import SysRole, SysUser
from app.schemas.auth import LoginRequest, LoginResponse, RoleOut, UserCreate, UserOut, UserUpdate


def _to_user_out(user: SysUser) -> UserOut:
    return UserOut.model_validate(user)


def login(db: Session, payload: LoginRequest) -> LoginResponse:
    user = (
        db.query(SysUser)
        .options(joinedload(SysUser.role))
        .filter(SysUser.username == payload.username)
        .first()
    )
    if user is None or not verify_password(payload.password, user.login_password):
        raise UnauthorizedError("Invalid username or password")
    role = RoleOut.model_validate(user.role)
    return LoginResponse(user=_to_user_out(user), role=role)


def get_me(user: SysUser) -> UserOut:
    return _to_user_out(user)


def list_roles(db: Session) -> list[RoleOut]:
    roles = db.scalars(select(SysRole).order_by(SysRole.role_id)).all()
    return [RoleOut.model_validate(role) for role in roles]


def list_users(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[UserOut], int]:
    stmt = select(SysUser).options(joinedload(SysUser.role)).order_by(SysUser.user_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                SysUser.username.like(pattern),
                SysUser.real_name.like(pattern),
                SysUser.contact_phone.like(pattern),
            )
        )
    users, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_user_out(user) for user in users], total


def get_user(db: Session, user_id: str) -> UserOut:
    user = (
        db.query(SysUser)
        .options(joinedload(SysUser.role))
        .filter(SysUser.user_id == user_id)
        .first()
    )
    if user is None:
        raise NotFoundError("User not found")
    return _to_user_out(user)


def create_user(db: Session, payload: UserCreate) -> UserOut:
    role = db.get(SysRole, payload.role_id)
    if role is None:
        raise BadRequestError("Invalid role_id")

    existing = db.scalar(select(SysUser).where(SysUser.username == payload.username))
    if existing is not None:
        raise ConflictError("Username already exists")

    user = SysUser(
        user_id=generate_next_id(db, SysUser, "user_id", "USR"),
        role_id=payload.role_id,
        username=payload.username,
        login_password=payload.login_password,
        real_name=payload.real_name,
        contact_phone=payload.contact_phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user = (
        db.query(SysUser)
        .options(joinedload(SysUser.role))
        .filter(SysUser.user_id == user.user_id)
        .first()
    )
    assert user is not None
    return _to_user_out(user)


def update_user(db: Session, user_id: str, payload: UserUpdate) -> UserOut:
    user = db.get(SysUser, user_id)
    if user is None:
        raise NotFoundError("User not found")

    if payload.role_id is not None:
        role = db.get(SysRole, payload.role_id)
        if role is None:
            raise BadRequestError("Invalid role_id")
        user.role_id = payload.role_id

    if payload.username is not None and payload.username != user.username:
        existing = db.scalar(select(SysUser).where(SysUser.username == payload.username))
        if existing is not None:
            raise ConflictError("Username already exists")
        user.username = payload.username

    if payload.login_password is not None:
        user.login_password = payload.login_password
    if payload.real_name is not None:
        user.real_name = payload.real_name
    if payload.contact_phone is not None:
        user.contact_phone = payload.contact_phone

    db.commit()
    user = (
        db.query(SysUser)
        .options(joinedload(SysUser.role))
        .filter(SysUser.user_id == user_id)
        .first()
    )
    assert user is not None
    return _to_user_out(user)


def delete_user(db: Session, user_id: str) -> None:
    user = db.get(SysUser, user_id)
    if user is None:
        raise NotFoundError("User not found")
    db.delete(user)
    db.commit()
