import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

import db


def _row_to_notification(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    return {
        "id": str(data.get("id") or ""),
        "user_name": str(data.get("user_name") or ""),
        "message": str(data.get("message") or ""),
        "item_id": str(data.get("item_id") or ""),
        "read": bool(data.get("read", 0)),
        "created_at": str(data.get("created_at") or ""),
    }


def create_notification(user_name: str, message: str, item_id: str = "") -> dict[str, Any]:
    notif_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with db.get_connection() as conn:
        conn.execute(
            """
            INSERT INTO notifications (id, user_name, message, item_id, read, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
            """,
            (notif_id, user_name.strip(), message, item_id, created_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM notifications WHERE id = ?", (notif_id,)).fetchone()
        return _row_to_notification(row)


def get_notifications(user_name: str | None = None) -> list[dict[str, Any]]:
    with db.get_connection() as conn:
        if user_name and user_name.strip():
            rows = conn.execute(
                "SELECT * FROM notifications WHERE LOWER(user_name) = LOWER(?) ORDER BY created_at DESC",
                (user_name.strip(),),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM notifications ORDER BY created_at DESC").fetchall()
        return [_row_to_notification(r) for r in rows]


def notify_if_top_match(new_item: dict[str, Any], matches: list[dict[str, Any]]) -> dict[str, Any] | None:
    """If the top match score is >= 0.6, insert a notification for the other side's reporter."""
    if not matches:
        return None
    top = matches[0]
    score = float(top.get("score") or 0.0)
    if score < 0.6:
        return None

    matched_item = top.get("item") or {}
    other_reporter = str(matched_item.get("reporter_name") or "").strip()
    if not other_reporter:
        return None

    matched_title = matched_item.get("title") or "your item"
    new_title = new_item.get("title") or "an item"
    pct = int(round(score * 100))
    msg = f"Potential match ({pct}% confidence) found for '{matched_title}': '{new_title}'."
    target_item_id = str(matched_item.get("id") or new_item.get("id") or "")
    return create_notification(user_name=other_reporter, message=msg, item_id=target_item_id)

