"""
Utopia Kuma Server - A FastAPI bridge to read Uptime Kuma data directly from database,
and also provides a CORS proxy for Uptime Kuma's public API.

Supports SQLite, MySQL, and MariaDB.

Usage:
    pip install -r requirements.txt
    python server.py

Configuration via .env file (see .env.example)
"""

import time
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from contextlib import asynccontextmanager

from dotenv import load_dotenv
import os

# Load .env file from the same directory as this script
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, Query, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

# ---- Configuration ----
KUMA_DATA_PATH = os.getenv("KUMA_DATA_PATH", "./data")
UTOPIA_PORT = int(os.getenv("UTOPIA_PORT", "55520"))
UTOPIA_HOST = os.getenv("UTOPIA_HOST", "0.0.0.0")
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "60"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
ENABLE_DB_MODE = os.getenv("ENABLE_DB_MODE", "true").lower() == "true"
ALLOWED_PROXY_TARGETS = os.getenv("ALLOWED_PROXY_TARGETS", "")

DB_TYPE = "sqlite"
DB_PATH = os.path.join(KUMA_DATA_PATH, "kuma.db")
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS = "", 3306, "", "", ""

# Attempt to read db-config.json
import json
db_config_file = os.path.join(KUMA_DATA_PATH, "db-config.json")
if os.path.exists(db_config_file):
    try:
        with open(db_config_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            if cfg.get("dbType") in ["mysql", "mariadb"]:
                DB_TYPE = cfg.get("dbType")
                DB_HOST = cfg.get("hostname", "localhost")
                DB_PORT = int(cfg.get("port", 3306))
                DB_NAME = cfg.get("dbName", "kuma")
                DB_USER = cfg.get("username", "root")
                DB_PASS = cfg.get("password", "")
    except Exception as e:
        print(f"Failed to read db-config.json: {e}")
SERVER_PORT = UTOPIA_PORT
SERVER_HOST = UTOPIA_HOST

CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS.split(",")]
ALLOWED_PROXY_TARGETS = [
    u.strip() for u in ALLOWED_PROXY_TARGETS.split(",") if u.strip()
]


# ---- Rate Limiter ----
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(now)
        return True


rate_limiter = RateLimiter(RATE_LIMIT_RPM)


# ---- Database ----
database = None

if ENABLE_DB_MODE:
    import databases

    if DB_TYPE == "sqlite":
        DATABASE_URL = f"sqlite:///{DB_PATH}"
    else:
        DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    database = databases.Database(DATABASE_URL)


# ---- App Lifecycle ----
@asynccontextmanager
async def lifespan(app: FastAPI):
    if database:
        await database.connect()
        print(f"Connected to database: {DB_TYPE}")
    else:
        print("DB mode disabled, running proxy-only mode")
    yield
    if database:
        await database.disconnect()


# ---- FastAPI App ----
app = FastAPI(
    title="Utopia Kuma Server",
    description="API bridge to Uptime Kuma database + CORS proxy for public Kuma API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all specified origins with all methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Rate Limit Middleware ----
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again later."}
        )
    response = await call_next(request)
    return response


# ---- Helper ----
KUMA_STATUS_MAP = {0: "offline", 1: "online", 2: "retrying", 3: "maintenance"}


def format_heartbeat(row):
    result = {
        "time": str(row["time"]) if row["time"] else None,
        "status": row["status"],
        "ping": row["ping"] if row["ping"] is not None else 0,
    }
    try:
        result["msg"] = row["msg"] or ""
    except (KeyError, IndexError):
        result["msg"] = ""
    return result


# ===========================================================
# Database API Endpoints (only when ENABLE_DB_MODE=true)
# ===========================================================

@app.get("/api/monitors")
async def list_monitors():
    """List all monitors with basic metadata."""
    if not database:
        raise HTTPException(status_code=503, detail="Database mode is not enabled")
    query = "SELECT * FROM monitor WHERE active = 1"
    try:
        rows = await database.fetch_all(query)
    except Exception as e:
        print(f"Error fetching monitors: {e}")
        return {"monitors": []}
    
    # Build group dictionary for lookups
    groups = {row["id"]: dict(row) for row in rows if dict(row).get("type") == "group"}

    # Sort logic matching user request:
    # 1. Grouped items come before default/ungrouped items
    # 2. Group weight ASC
    # 3. Group ID ASC (to keep same-weight groups together)
    # 4. Monitor ID ASC (inside group)
    def get_sort_key(row):
        r = dict(row)
        parent_id = r.get("parent")
        monitor_id = r.get("id") or 0
        
        if parent_id and parent_id in groups:
            group_weight = groups[parent_id].get("weight") or 0
            return (0, group_weight, parent_id, monitor_id)
        else:
            return (1, 0, 0, monitor_id)
            
    sorted_rows = sorted(rows, key=get_sort_key)

    monitors = []
    for row in sorted_rows:
        r = dict(row)
        monitor_type = r.get("type") or ""
        # Skip 'group' type monitors
        if monitor_type == "group":
            continue

        monitor_id = r["id"]

        # Get latest heartbeat for current status
        try:
            latest_hb = await database.fetch_one(
                "SELECT status, ping FROM heartbeat WHERE monitor_id = :mid ORDER BY time DESC LIMIT 1",
                {"mid": monitor_id}
            )
        except Exception:
            latest_hb = None

        # Get tags
        tags = []
        try:
            tag_rows = await database.fetch_all(
                """SELECT t.name, t.color FROM tag t
                   JOIN monitor_tag mt ON mt.tag_id = t.id
                   WHERE mt.monitor_id = :mid""",
                {"mid": monitor_id}
            )
            tags = [{"name": t["name"], "color": t["color"]} for t in tag_rows]
        except Exception:
            pass
            
        # Get group info
        group_name = ""
        parent_id = r.get("parent")
        if parent_id and parent_id in groups:
            group_name = groups[parent_id].get("name", "")

        # Get TLS/cert info (domain expiry + cert expiry)
        cert_expiry_days = None
        domain_expiry_days = None
        try:
            tls_row = await database.fetch_one(
                "SELECT info_json FROM monitor_tls_info WHERE monitor_id = :mid ORDER BY id DESC LIMIT 1",
                {"mid": monitor_id}
            )
            if tls_row and tls_row["info_json"]:
                import json
                tls_info = json.loads(tls_row["info_json"])
                if isinstance(tls_info, dict):
                    # Cert expiry
                    valid_to = tls_info.get("valid_to")
                    if valid_to:
                        try:
                            from datetime import datetime, timezone
                            expiry_date = datetime.fromisoformat(valid_to.replace("Z", "+00:00"))
                            days_left = (expiry_date - datetime.now(timezone.utc)).days
                            cert_expiry_days = max(0, days_left)
                        except (ValueError, TypeError):
                            pass
        except Exception:
            pass  # Table may not exist in older Kuma versions

        # Domain expiry
        domain_expiry_days = None
        try:
            domain_expiry_val = r.get("domain_name_expiry_date")
            if domain_expiry_val:
                from datetime import datetime, timezone
                expiry_date = datetime.fromisoformat(str(domain_expiry_val).replace("Z", "+00:00"))
                days_left = (expiry_date - datetime.now(timezone.utc)).days
                domain_expiry_days = max(0, days_left)
        except Exception:
            pass

        monitors.append({
            "id": monitor_id,
            "name": r.get("name", f"Monitor {monitor_id}"),
            "url": r.get("url"),
            "type": monitor_type,
            "method": r.get("method"),
            "active": r.get("active", 1),
            "interval": r.get("interval", 60),
            "hostname": r.get("hostname"),
            "port": r.get("port"),
            "status": latest_hb["status"] if latest_hb else 0,
            "ping": latest_hb["ping"] if latest_hb else 0,
            "group": group_name,
            "tags": tags,
            "domain_expiry_days": domain_expiry_days,
            "cert_expiry_days": cert_expiry_days
        })

    return {"monitors": monitors}


@app.get("/api/monitors/{monitor_id}/heartbeats")
async def get_heartbeats(
    monitor_id: int,
    range_days: int = Query(default=7, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(default=50000, ge=10, le=100000, description="Maximum number of heartbeat records"),
):
    """
    Get heartbeat data for a specific monitor.
    Returns heartbeats within the last `range_days` days, limited to `limit` records.
    Also returns computed uptime percentage for the range.
    """
    if not database:
        raise HTTPException(status_code=503, detail="Database mode is not enabled")

    monitor = await database.fetch_one(
        "SELECT id, name FROM monitor WHERE id = :mid",
        {"mid": monitor_id}
    )
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    since = datetime.now(timezone.utc) - timedelta(days=range_days)
    since_str = since.strftime("%Y-%m-%d %H:%M:%S")

    query = """
        SELECT time, status, ping
        FROM heartbeat
        WHERE monitor_id = :mid AND time >= :since
        ORDER BY time DESC
        LIMIT :lim
    """
    rows = await database.fetch_all(query, {"mid": monitor_id, "since": since_str, "lim": limit})
    heartbeats = [format_heartbeat(r) for r in reversed(rows)]

    total = len(heartbeats)
    up_count = sum(1 for h in heartbeats if h["status"] == 1)
    uptime = round((up_count / total) * 100, 4) if total > 0 else 0

    return {
        "monitor_id": monitor_id,
        "monitor_name": monitor["name"],
        "range_days": range_days,
        "total_records": total,
        "uptime": uptime,
        "heartbeats": heartbeats
    }


# ===========================================================
# CORS Proxy for Uptime Kuma Public API
# ===========================================================

@app.get("/api/proxy/kuma")
async def proxy_kuma(
    target: str = Query(..., description="Full URL to the Kuma API endpoint to proxy"),
):
    """
    CORS proxy for Uptime Kuma's public status page API.
    Useful when accessing Kuma from a different origin where CORS headers are not set.

    Example: /api/proxy/kuma?target=http://192.168.2.6:3001/api/status-page/jp
    """
    # Security: validate target URL
    if not target.startswith("http://") and not target.startswith("https://"):
        raise HTTPException(status_code=400, detail="Target must be an HTTP(S) URL")

    # Check allowed proxy targets
    if ALLOWED_PROXY_TARGETS:
        allowed = False
        for base in ALLOWED_PROXY_TARGETS:
            if target.startswith(base):
                allowed = True
                break
        if not allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Target URL not in allowed proxy targets. Configure ALLOWED_PROXY_TARGETS in .env"
            )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(target)
            return JSONResponse(
                content=resp.json(),
                status_code=resp.status_code
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream Kuma server timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")


# ===========================================================
# Health Check
# ===========================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    result = {"status": "ok", "db_enabled": ENABLE_DB_MODE, "proxy_enabled": True}
    if database:
        try:
            await database.fetch_one("SELECT 1")
            result["database"] = DB_TYPE
        except Exception as e:
            result["status"] = "degraded"
            result["db_error"] = str(e)
    return result


# ---- Entry Point ----
if __name__ == "__main__":
    import uvicorn
    print(f"Starting Utopia Kuma Server on {SERVER_HOST}:{SERVER_PORT}")
    if ENABLE_DB_MODE:
        print(f"Database: {DB_TYPE} {'(' + DB_PATH + ')' if DB_TYPE == 'sqlite' else ''}")
    else:
        print("Database: disabled (proxy-only mode)")
    print(f"Rate limit: {RATE_LIMIT_RPM} requests/minute per IP")
    print(f"CORS origins: {CORS_ORIGINS}")
    if ALLOWED_PROXY_TARGETS:
        print(f"Allowed proxy targets: {ALLOWED_PROXY_TARGETS}")
    else:
        print("Proxy targets: all URLs allowed (configure ALLOWED_PROXY_TARGETS for security)")
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
