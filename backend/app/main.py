from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.exceptions import AppException
from app.routers import (
    auth,
    dashboard,
    health,
    production,
    purchase,
    sales,
    users,
    warehouse,
)

settings = get_settings()

app = FastAPI(title="PreMade Food Management API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.roles_router, prefix="/api")
app.include_router(users.users_router, prefix="/api")
app.include_router(purchase.router, prefix="/api")
app.include_router(warehouse.router, prefix="/api")
app.include_router(production.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "PreMade Food Management API is running"}
