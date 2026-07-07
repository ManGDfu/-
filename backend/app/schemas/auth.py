from pydantic import BaseModel, ConfigDict, Field


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_id: str
    role_name: str
    permission_desc: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    role_id: str
    username: str
    real_name: str
    contact_phone: str
    role: RoleOut | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user: UserOut
    role: RoleOut


class UserCreate(BaseModel):
    role_id: str
    username: str = Field(min_length=1, max_length=50)
    login_password: str = Field(min_length=1, max_length=100)
    real_name: str = Field(min_length=1, max_length=50)
    contact_phone: str = Field(min_length=1, max_length=20)


class UserUpdate(BaseModel):
    role_id: str | None = None
    username: str | None = Field(default=None, min_length=1, max_length=50)
    login_password: str | None = Field(default=None, min_length=1, max_length=100)
    real_name: str | None = Field(default=None, min_length=1, max_length=50)
    contact_phone: str | None = Field(default=None, min_length=1, max_length=20)
