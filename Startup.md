# 项目启动指南

## 当前数据库连接


| 配置项      | 值                                |
| -------- | -------------------------------- |
| 数据库类型    | Microsoft SQL Server             |
| 实例名称     | `SQLEXPRESS`                     |
| 服务器地址    | `localhost\SQLEXPRESS`           |
| 当前连接的数据库 | `master`                         |
| 认证方式     | Windows 身份验证（Trusted Connection） |
| ODBC 驱动  | ODBC Driver 18 for SQL Server    |


连接配置位于 `[backend/.env](backend/.env)`，如需切换数据库，修改其中的 `DATABASE_URL` 即可（将 `DATABASE=master` 改为目标库名）。

---

## 环境要求

- Conda 环境：`database`（Python 3.14）
- Node.js / npm（前端）
- SQL Server 服务 `MSSQL$SQLEXPRESS` 需处于运行状态

首次使用或依赖变更时，安装后端依赖：

```powershell
conda activate database
pip install -r backend/requirements.txt
```

首次使用前端时，安装 npm 依赖：

```powershell
cd frontend
npm install
```

---

## 启动步骤

需要打开 **两个终端**，均在项目根目录 `tjr到此一游` 下操作。

### 终端 1 — 启动后端（FastAPI）

```powershell
conda activate database
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 终端 2 — 启动前端（React + Vite）

```powershell
cd frontend
npm run dev
```

---

## 访问地址


| 服务              | 地址                                                                         |
| --------------- | -------------------------------------------------------------------------- |
| 前端页面            | [http://localhost:5173](http://localhost:5173)                             |
| 后端 API          | [http://127.0.0.1:8000](http://127.0.0.1:8000)                             |
| API 文档（Swagger） | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)                   |
| 健康检查            | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)       |
| 数据库连通检查         | [http://127.0.0.1:8000/api/health/db](http://127.0.0.1:8000/api/health/db) |


---

## 常见问题

**端口 8000 被占用 / 启动报 WinError 10013 或 10048**

先查看占用端口的进程并结束：

```powershell
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
Stop-Process -Id <进程ID> -Force
```

然后重新启动后端。

**数据库连接失败**

确认 SQL Server 服务已启动：

```powershell
Get-Service -Name "MSSQL*"
```

使用 sqlcmd 测试连接：

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -E -C -Q "SELECT @@VERSION"
```

