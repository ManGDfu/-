export interface Role {
  role_id: string
  role_name: string
  permission_desc?: string | null
}

export interface User {
  user_id: string
  role_id: string
  username: string
  real_name: string
  contact_phone: string
  role?: Role | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  role: Role
}

export interface UserCreate {
  role_id: string
  username: string
  login_password: string
  real_name: string
  contact_phone: string
}

export interface UserUpdate {
  role_id?: string
  username?: string
  login_password?: string
  real_name?: string
  contact_phone?: string
}
