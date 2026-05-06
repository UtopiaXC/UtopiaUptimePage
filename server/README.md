# Utopia Kuma Server

A lightweight Python FastAPI server that provides:
1. **Database Mode** — Direct access to Uptime Kuma's database for enhanced monitoring data
2. **CORS Proxy** — Relay requests to Kuma's public API to solve cross-origin issues

## Why?

- Uptime Kuma's built-in public status page API only returns the last 100 heartbeats
- Kuma's public API doesn't set CORS headers, blocking direct browser access from different origins
- This server solves both problems

## Quick Start

### 1. Install dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Create `.env` file

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `KUMA_DB_TYPE` | `sqlite` | Database type: `sqlite` or `mysql` |
| `KUMA_DB_PATH` | `./data/kuma.db` | SQLite database file path |
| `KUMA_DB_HOST` | `localhost` | MySQL/MariaDB host |
| `KUMA_DB_PORT` | `3306` | MySQL/MariaDB port |
| `KUMA_DB_USER` | `root` | MySQL/MariaDB username |
| `KUMA_DB_PASS` | | MySQL/MariaDB password |
| `KUMA_DB_NAME` | `kuma` | MySQL/MariaDB database name |
| `UTOPIA_PORT` | `8000` | Server port |
| `UTOPIA_HOST` | `0.0.0.0` | Server bind address |
| `RATE_LIMIT_RPM` | `60` | Rate limit: requests per minute per IP |
| `CORS_ORIGINS` | `*` | Comma-separated allowed CORS origins |
| `ENABLE_DB_MODE` | `true` | Set to `false` for proxy-only mode |
| `ALLOWED_PROXY_TARGETS` | *(empty)* | Comma-separated allowed Kuma URLs for proxy |

### 4. Run

```bash
# Full mode (database + proxy)
python server.py

# Proxy-only mode (no database needed)
ENABLE_DB_MODE=false python server.py
```

## API Endpoints

### Database Endpoints (requires `ENABLE_DB_MODE=true`)

#### `GET /api/monitors`
Returns all active monitors with tags, groups, and current status.

#### `GET /api/monitors/{monitor_id}/heartbeats`
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `range_days` | int | 7 | Days to look back (1-365) |
| `limit` | int | 500 | Max records (10-5000) |

### CORS Proxy

#### `GET /api/proxy/kuma?target=<URL>`
Proxies a GET request to the specified Kuma API URL and returns the response with proper CORS headers.

Example:
```
GET /api/proxy/kuma?target=http://192.168.2.6:3001/api/status-page/jp
```

> **Security**: Set `ALLOWED_PROXY_TARGETS` in `.env` to restrict which URLs can be proxied.

### `GET /api/health`
Health check endpoint.

## Frontend Configuration

### For "Uptime Kuma" source type:
If your Kuma instance has CORS issues, add a `proxyUrl` in the config:
```js
{
    sourceType: "kuma",
    sourceName: "My Kuma",
    pageUrl: "http://192.168.2.6:3001/status/jp",
    proxyUrl: "http://localhost:8000",  // This server's address
    refreshInterval: 300
}
```

### For "Kuma Utopia Server" source type:
```js
{
    sourceType: "kuma-server",
    sourceName: "Kuma Direct",
    serverUrl: "http://localhost:8000",
    rangeDays: 7,
    refreshInterval: 300
}
```
