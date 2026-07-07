from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session


ID_PREFIX_WIDTH: dict[str, int] = {
    "USR": 4,
    "ROL": 3,
    "SUP": 4,
    "ING": 4,
    "PO": 6,
    "POD": 6,
    "WAR": 4,
    "INV": 6,
    "TO": 6,
    "TOD": 6,
    "FAC": 4,
    "PRO": 4,
    "REC": 4,
    "WO": 6,
    "STO": 4,
    "SO": 6,
    "SOD": 6,
}


def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password


def _max_id_suffix(ids: list[str], prefix: str) -> int:
    max_num = 0
    for row_id in ids:
        if not row_id.startswith(prefix):
            continue
        suffix = row_id[len(prefix) :]
        if suffix.isdigit():
            max_num = max(max_num, int(suffix))
    return max_num


def generate_next_id(db: Session, model: Any, id_column_name: str, prefix: str) -> str:
    width = ID_PREFIX_WIDTH.get(prefix, 4)
    id_column = getattr(model, id_column_name)
    rows = db.scalars(select(id_column).where(id_column.like(f"{prefix}%"))).all()
    pending = [
        getattr(obj, id_column_name)
        for obj in db.new
        if isinstance(obj, model) and getattr(obj, id_column_name, None)
    ]
    max_num = _max_id_suffix([*rows, *pending], prefix)
    return f"{prefix}{str(max_num + 1).zfill(width)}"


def paginate[T](
    db: Session,
    stmt: Select[tuple[T]],
    *,
    page: int,
    page_size: int,
) -> tuple[list[T], int]:
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    items = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    return items, total
