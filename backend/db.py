import json
import os
import sqlite3
from urllib.parse import urlparse, unquote
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DB_MODE = os.getenv("DB_MODE", "postgres").strip().lower()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/findit").strip()
DB_PATH = BASE_DIR / "findit.db"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _parse_pg_url(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    return {
        "user": unquote(parsed.username or "postgres"),
        "password": unquote(parsed.password or "postgres"),
        "host": parsed.hostname or "localhost",
        "port": int(parsed.port or 5432),
        "database": (parsed.path or "/findit").lstrip("/") or "findit",
    }


class _CursorResult:
    def __init__(self, rows: list[dict[str, Any]]) -> None:
        self._rows = rows

    def fetchone(self) -> dict[str, Any] | None:
        return self._rows[0] if self._rows else None

    def fetchall(self) -> list[dict[str, Any]]:
        return self._rows


class _PostgresConnectionWrapper:
    def __init__(self, raw_conn: Any) -> None:
        self._conn = raw_conn

    def __enter__(self) -> "_PostgresConnectionWrapper":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        try:
            if exc_type is None:
                self._conn.commit()
            else:
                self._conn.rollback()
        finally:
            self._conn.close()

    def execute(self, sql: str, params: tuple[Any, ...] | list[Any] = ()) -> _CursorResult:
        pg_sql = sql.replace("?", "%s")
        cur = self._conn.cursor()
        if params:
            cur.execute(pg_sql, tuple(params))
        else:
            cur.execute(pg_sql)

        rows: list[dict[str, Any]] = []
        if cur.description is not None:
            col_names = [col[0] for col in cur.description]
            for r in cur.fetchall():
                rows.append(dict(zip(col_names, r)))
        cur.close()
        return _CursorResult(rows)

    def commit(self) -> None:
        self._conn.commit()


def _ensure_postgres_database_exists() -> None:
    import pg8000.dbapi  # type: ignore

    cfg = _parse_pg_url(DATABASE_URL)
    target_db = cfg["database"]
    conn = pg8000.dbapi.connect(
        user=cfg["user"],
        password=cfg["password"],
        host=cfg["host"],
        port=cfg["port"],
        database="postgres",
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
    exists = cur.fetchone() is not None
    if not exists:
        cur.execute(f'CREATE DATABASE "{target_db}"')
    cur.close()
    conn.close()


def get_connection() -> Any:
    if DB_MODE in ("postgres", "postgresql"):
        import pg8000.dbapi  # type: ignore

        cfg = _parse_pg_url(DATABASE_URL)
        raw_conn = pg8000.dbapi.connect(
            user=cfg["user"],
            password=cfg["password"],
            host=cfg["host"],
            port=cfg["port"],
            database=cfg["database"],
        )
        return _PostgresConnectionWrapper(raw_conn)

    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    global DB_MODE
    if DB_MODE in ("postgres", "postgresql"):
        try:
            _ensure_postgres_database_exists()
        except Exception as exc:
            print(f"[db.py] Notice: Could not connect to PostgreSQL ({exc}); falling back to SQLite until DATABASE_URL is set in .env.")
            DB_MODE = "sqlite"

    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT '',
                brand TEXT NOT NULL DEFAULT '',
                location TEXT NOT NULL DEFAULT '',
                item_date TEXT NOT NULL DEFAULT '',
                image_url TEXT NOT NULL DEFAULT '',
                embedding TEXT NOT NULL DEFAULT '[]',
                verification_question TEXT NOT NULL DEFAULT '',
                verification_answer TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'open',
                reporter_name TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS claims (
                id TEXT PRIMARY KEY,
                item_id TEXT NOT NULL,
                claimant_name TEXT NOT NULL,
                answer TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY (item_id) REFERENCES items(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_name TEXT NOT NULL,
                message TEXT NOT NULL,
                item_id TEXT NOT NULL DEFAULT '',
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                roll_number TEXT NOT NULL DEFAULT '',
                department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
                hostel TEXT NOT NULL DEFAULT 'Hostel Block 4',
                role TEXT NOT NULL DEFAULT 'student',
                wallet_balance REAL NOT NULL DEFAULT 150.0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()

    # Seed default campus users if users table is empty
    with get_connection() as conn:
        existing_user = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
        if not existing_user:
            now = datetime.now(timezone.utc).isoformat()
            default_users = [
                (
                    "user-aarav",
                    "arjun@univ.edu",
                    "campus123",
                    "Aarav Sharma",
                    "24BCE1042",
                    "B.Tech Computer Science & Engineering",
                    "Hostel Block 4",
                    "student",
                    150.0,
                    now,
                ),
                (
                    "user-priya",
                    "priya@univ.edu",
                    "campus123",
                    "Priya Patel",
                    "24BCE1108",
                    "B.Tech Electronics & Communication",
                    "Hostel Block 2",
                    "student",
                    200.0,
                    now,
                ),
                (
                    "user-staff",
                    "library_staff@univ.edu",
                    "staff123",
                    "Pooja Verma (Custodian)",
                    "STAFF-LIB-04",
                    "Central Library & Security Desk",
                    "Library Circulation Desk #2",
                    "staff",
                    500.0,
                    now,
                ),
            ]
            for u in default_users:
                conn.execute(
                    """
                    INSERT INTO users (id, email, password, name, roll_number, department, hostel, role, wallet_balance, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    u,
                )
            conn.commit()


def _row_to_item(row: Any) -> dict[str, Any]:
    data = dict(row)
    raw_emb = data.get("embedding", "[]")
    if isinstance(raw_emb, str):
        try:
            data["embedding"] = [float(x) for x in json.loads(raw_emb)]
        except Exception:
            data["embedding"] = [0.0] * 512
    elif isinstance(raw_emb, list):
        data["embedding"] = [float(x) for x in raw_emb]
    else:
        data["embedding"] = [0.0] * 512

    data["date"] = data.get("item_date") or ""
    return data


def to_public_item(item: dict[str, Any]) -> dict[str, Any]:
    """Strip verification_answer, embedding, and internal fields to match Section 5 Item contract."""
    return {
        "id": str(item.get("id") or ""),
        "type": str(item.get("type") or ""),
        "title": str(item.get("title") or ""),
        "description": str(item.get("description") or ""),
        "category": str(item.get("category") or ""),
        "color": str(item.get("color") or ""),
        "brand": str(item.get("brand") or ""),
        "location": str(item.get("location") or ""),
        "date": str(item.get("date") or item.get("item_date") or ""),
        "image_url": str(item.get("image_url") or ""),
        "verification_question": str(item.get("verification_question") or ""),
        "status": str(item.get("status") or "open"),
        "reporter_name": str(item.get("reporter_name") or ""),
        "created_at": str(item.get("created_at") or ""),
    }


def insert_item(row: dict[str, Any]) -> dict[str, Any]:
    item_id = str(row.get("id") or uuid.uuid4())
    item_type = str(row.get("type") or "lost").lower()
    title = str(row.get("title") or "")
    description = str(row.get("description") or "")
    category = str(row.get("category") or "")
    color = str(row.get("color") or "")
    brand = str(row.get("brand") or "")
    location = str(row.get("location") or "")
    item_date = str(row.get("date") or row.get("item_date") or datetime.now(timezone.utc).date().isoformat())
    image_url = str(row.get("image_url") or "")

    emb = row.get("embedding")
    if emb is None:
        emb_json = json.dumps([0.0] * 512)
    elif isinstance(emb, str):
        emb_json = emb
    else:
        emb_json = json.dumps([float(x) for x in emb])

    verification_question = str(row.get("verification_question") or "")
    verification_answer = str(row.get("verification_answer") or "")
    status = str(row.get("status") or "open")
    reporter_name = str(row.get("reporter_name") or "")
    created_at = str(row.get("created_at") or datetime.now(timezone.utc).isoformat())

    with get_connection() as conn:
        conn.execute("DELETE FROM claims WHERE item_id = ?", (item_id,))
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.execute(
            """
            INSERT INTO items (
                id, type, title, description, category, color, brand,
                location, item_date, image_url, embedding,
                verification_question, verification_answer, status,
                reporter_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                item_type,
                title,
                description,
                category,
                color,
                brand,
                location,
                item_date,
                image_url,
                emb_json,
                verification_question,
                verification_answer,
                status,
                reporter_name,
                created_at,
            ),
        )
        conn.commit()

    return get_item(item_id)  # type: ignore[return-value]


def get_item(item_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            return None
        return _row_to_item(row)


def list_items(type: str | None = None, status: str | None = "open") -> list[dict[str, Any]]:
    query = "SELECT * FROM items WHERE 1=1"
    params: list[Any] = []
    if type is not None:
        query += " AND type = ?"
        params.append(type.lower())
    if status is not None:
        query += " AND status = ?"
        params.append(status.lower())
    query += " ORDER BY created_at DESC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [_row_to_item(r) for r in rows]


def update_item_status(item_id: str, status: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        conn.execute("UPDATE items SET status = ? WHERE id = ?", (status, item_id))
        conn.commit()
    return get_item(item_id)


def _row_to_user(row: Any) -> dict[str, Any]:
    d = dict(row)
    d.pop("password", None)
    return d


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (email.strip(), password),
        ).fetchone()
        if not row:
            return None
        return _row_to_user(row)


def create_user(
    email: str,
    password: str,
    name: str,
    roll_number: str = "",
    department: str = "B.Tech Computer Science",
    hostel: str = "Campus Hostel",
    role: str = "student",
) -> dict[str, Any]:
    with get_connection() as conn:
        existing = conn.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),)).fetchone()
        if existing:
            raise ValueError("An account with this university email already exists.")
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO users (id, email, password, name, roll_number, department, hostel, role, wallet_balance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 150.0, ?)
            """,
            (
                user_id,
                email.strip().lower(),
                password,
                name.strip(),
                roll_number.strip() or "24BCE1099",
                department.strip() or "B.Tech Computer Science",
                hostel.strip() or "Hostel Block 1",
                role.strip().lower() or "student",
                now,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _row_to_user(row)


def list_users() -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM users ORDER BY created_at ASC").fetchall()
        return [_row_to_user(r) for r in rows]


init_db()
