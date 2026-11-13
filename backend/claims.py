import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

import db
import notify


def _row_to_claim(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    return {
        "id": str(data.get("id") or ""),
        "item_id": str(data.get("item_id") or ""),
        "claimant_name": str(data.get("claimant_name") or ""),
        "answer": str(data.get("answer") or ""),
        "status": str(data.get("status") or "pending"),
        "created_at": str(data.get("created_at") or ""),
    }


def create_claim(item_id: str, claimant_name: str, answer: str) -> dict[str, Any]:
    item = db.get_item(item_id)
    if not item:
        raise ValueError(f"Item not found: {item_id}")

    expected_answer = str(item.get("verification_answer") or "").strip().lower()
    given_answer = str(answer or "").strip().lower()

    if expected_answer and given_answer == expected_answer:
        status = "approved"
    else:
        status = "pending"

    claim_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    with db.get_connection() as conn:
        conn.execute(
            """
            INSERT INTO claims (id, item_id, claimant_name, answer, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (claim_id, item_id, claimant_name.strip(), answer or "", status, created_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
        claim = _row_to_claim(row)

    if status == "approved":
        db.update_item_status(item_id, "claimed")
        if claimant_name.strip():
            notify.create_notification(
                user_name=claimant_name.strip(),
                message=f"Your claim for '{item.get('title', 'item')}' was automatically approved!",
                item_id=item_id,
            )
    else:
        reporter = str(item.get("reporter_name") or "").strip()
        if reporter:
            notify.create_notification(
                user_name=reporter,
                message=f"{claimant_name.strip()} submitted a claim for '{item.get('title', 'item')}' (pending review).",
                item_id=item_id,
            )

    return claim


def get_claim(claim_id: str) -> dict[str, Any] | None:
    with db.get_connection() as conn:
        row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
        if not row:
            return None
        return _row_to_claim(row)


def list_claims() -> list[dict[str, Any]]:
    with db.get_connection() as conn:
        rows = conn.execute("SELECT * FROM claims ORDER BY created_at DESC").fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            c = _row_to_claim(r)
            item = db.get_item(c["item_id"])
            c["item_title"] = item.get("title", "Reported Item") if item else "Reported Item"
            c["item_location"] = item.get("location", "") if item else ""
            out.append(c)
        return out


def update_claim_status(claim_id: str, status: str) -> dict[str, Any] | None:
    normalized = status.strip().lower()
    if normalized not in ("approved", "rejected", "pending"):
        raise ValueError("status must be 'approved' or 'rejected'")

    existing = get_claim(claim_id)
    if not existing:
        return None

    with db.get_connection() as conn:
        conn.execute("UPDATE claims SET status = ? WHERE id = ?", (normalized, claim_id))
        conn.commit()

    updated = get_claim(claim_id)
    if updated and normalized == "approved":
        db.update_item_status(updated["item_id"], "claimed")
        item = db.get_item(updated["item_id"])
        title = item.get("title", "item") if item else "item"
        if updated["claimant_name"]:
            notify.create_notification(
                user_name=updated["claimant_name"],
                message=f"Your claim for '{title}' has been approved!",
                item_id=updated["item_id"],
            )
    elif updated and normalized == "rejected":
        item = db.get_item(updated["item_id"])
        title = item.get("title", "item") if item else "item"
        if updated["claimant_name"]:
            notify.create_notification(
                user_name=updated["claimant_name"],
                message=f"Your claim for '{title}' was rejected.",
                item_id=updated["item_id"],
            )

    return updated

