from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import claims
import db
import notify

app = FastAPI(title="FindIt AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(db.UPLOADS_DIR)), name="uploads")


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail, "detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"error": "Invalid request parameters", "detail": str(exc)})


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})


# --- Dev B interface bridges with safe fallbacks until Dev B merges ---


def _embed_image_safe(image_bytes: bytes, file_path: Path) -> list[float]:
    try:
        import matching  # type: ignore

        if hasattr(matching, "embed_image"):
            try:
                emb = matching.embed_image(image_bytes)
            except Exception:
                emb = matching.embed_image(str(file_path))
            if isinstance(emb, list) and len(emb) == 512:
                return [float(x) for x in emb]
    except Exception:
        pass
    return [0.0] * 512


def _embed_text_safe(text: str) -> list[float]:
    try:
        import matching  # type: ignore

        if hasattr(matching, "embed_text"):
            emb = matching.embed_text(text)
            if isinstance(emb, list) and len(emb) == 512:
                return [float(x) for x in emb]
    except Exception:
        pass
    return [0.0] * 512


def _infer_tags_from_text(title: str, description: str, category: str, color: str, brand: str) -> tuple[str, str, str]:
    combined = f"{title} {description}".lower()
    if not color.strip():
        for c in ("black", "blue", "navy", "silver", "gray", "grey", "white", "red", "brown", "green", "yellow", "gold", "pink", "purple", "orange"):
            if c in combined:
                color = "gray" if c == "grey" else ("blue" if c == "navy" else c)
                break
    if not brand.strip():
        for b in ("Fossil", "Herschel", "Hydro Flask", "Stanley", "The North Face", "North Face", "JanSport", "Apple", "MacBook", "Dell", "Casio", "Boat", "Sony", "Samsung", "Nike"):
            if b.lower() in combined:
                brand = "The North Face" if b == "North Face" else ("Apple" if b == "MacBook" else b)
                break
    if not category.strip():
        if any(w in combined for w in ("wallet", "bifold", "cardholder", "purse")):
            category = "wallet"
        elif any(w in combined for w in ("bottle", "flask", "thermos", "tumbler")):
            category = "bottle"
        elif any(w in combined for w in ("backpack", "bag", "rucksack")):
            category = "backpack"
        elif any(w in combined for w in ("laptop", "macbook", "phone", "airpods", "earbuds", "headphones", "calculator")):
            category = "electronics"
        elif any(w in combined for w in ("key", "keychain", "lanyard")):
            category = "keys"
    return category, color, brand


def _autotag_safe(image_bytes: bytes) -> dict[str, str]:
    try:
        import vision  # type: ignore

        if hasattr(vision, "autotag"):
            res = vision.autotag(image_bytes)
            if isinstance(res, dict):
                return res
    except Exception:
        pass
    return {}


def _generate_verification_question_safe(image_bytes: bytes) -> dict[str, str]:
    try:
        import vision  # type: ignore

        if hasattr(vision, "generate_verification_question"):
            res = vision.generate_verification_question(image_bytes)
            if isinstance(res, dict):
                return res
    except Exception:
        pass
    return {}


def _fallback_find_matches(item: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
    """Stub matcher used only before Dev B's matching.py is present."""
    opposite_type = "found" if item.get("type") == "lost" else "lost"
    candidates = db.list_items(type=opposite_type, status="open")
    results: list[dict[str, Any]] = []

    item_date = str(item.get("date") or item.get("item_date") or "")
    for cand in candidates:
        if cand.get("id") == item.get("id"):
            continue
        cand_date = str(cand.get("date") or cand.get("item_date") or "")
        lost_date = item_date if item.get("type") == "lost" else cand_date
        found_date = cand_date if item.get("type") == "lost" else item_date
        if lost_date and found_date and found_date < lost_date:
            continue

        cat_match = 1.0 if (
            item.get("category")
            and cand.get("category")
            and str(item.get("category")).strip().lower() == str(cand.get("category")).strip().lower()
        ) else 0.0
        loc_match = 1.0 if (
            item.get("location")
            and cand.get("location")
            and str(item.get("location")).strip().lower() == str(cand.get("location")).strip().lower()
        ) else 0.5
        time_score = 1.0 if lost_date == found_date else 0.7

        score = round(0.10 * cat_match + 0.10 * loc_match + 0.05 * time_score, 4)
        confidence = "high" if score >= 0.75 else ("medium" if score >= 0.5 else "low")
        results.append(
            {
                "item": db.to_public_item(cand),
                "score": score,
                "breakdown": {
                    "image": 0.0,
                    "text": 0.0,
                    "category": cat_match,
                    "location": loc_match,
                    "time": time_score,
                    "llm": 0.0,
                },
                "reason": "Matched on item metadata (waiting for AI vision pipeline).",
                "confidence": confidence,
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


def _find_matches_safe(item: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
    try:
        import matching  # type: ignore

        if hasattr(matching, "find_matches"):
            raw_matches = matching.find_matches(item, top_k=top_k)
            if isinstance(raw_matches, list):
                return raw_matches[:top_k]
    except Exception:
        pass
    return _fallback_find_matches(item, top_k=top_k)


def _format_public_item(item: dict[str, Any], request: Request) -> dict[str, Any]:
    pub = db.to_public_item(item)
    img_url = pub.get("image_url") or ""
    if img_url and not img_url.startswith(("http://", "https://")):
        base = str(request.base_url).rstrip("/")
        path_part = img_url if img_url.startswith("/") else f"/{img_url}"
        pub["image_url"] = f"{base}{path_part}"
    return pub


def _format_match(match: dict[str, Any], request: Request) -> dict[str, Any]:
    raw_item = match.get("item") or {}
    raw_breakdown = match.get("breakdown") or {}
    score = round(float(match.get("score") or 0.0), 4)
    confidence = str(match.get("confidence") or ("high" if score >= 0.75 else "medium" if score >= 0.5 else "low"))
    return {
        "item": _format_public_item(raw_item, request),
        "score": score,
        "breakdown": {
            "image": round(float(raw_breakdown.get("image") or 0.0), 4),
            "text": round(float(raw_breakdown.get("text") or 0.0), 4),
            "category": round(float(raw_breakdown.get("category") or 0.0), 4),
            "location": round(float(raw_breakdown.get("location") or 0.0), 4),
            "time": round(float(raw_breakdown.get("time") or 0.0), 4),
            "llm": round(float(raw_breakdown.get("llm") or 0.0), 4),
        },
        "reason": str(match.get("reason") or ""),
        "confidence": confidence,
    }


# --- API Routes (Section 5 Contract) ---


@app.post("/items")
async def create_item(
    request: Request,
    type: str = Form(...),
    title: str = Form(""),
    description: str = Form(""),
    category: str = Form(""),
    location: str = Form(""),
    date: str = Form(""),
    image: UploadFile | None = File(None),
    verification_question: str = Form(""),
    verification_answer: str = Form(""),
    reporter_name: str = Form(""),
    color: str = Form(""),
    brand: str = Form(""),
) -> dict[str, Any]:
    item_type = type.strip().lower()
    if item_type not in ("lost", "found"):
        raise HTTPException(status_code=400, detail="type must be 'lost' or 'found'")

    if not reporter_name.strip():
        reporter_name = request.headers.get("X-User-Name", "").strip() or "anonymous"

    image_bytes = b""
    image_url = ""
    saved_path = db.UPLOADS_DIR / "placeholder.jpg"

    if image is not None and image.filename:
        image_bytes = await image.read()
        ext = Path(image.filename).suffix.lower() or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        saved_path = db.UPLOADS_DIR / filename
        saved_path.write_bytes(image_bytes)
        base_url = str(request.base_url).rstrip("/")
        image_url = f"{base_url}/uploads/{filename}"

    # Section 8: Auto-tagging on upload if category or description is empty
    if image_bytes and (not category.strip() or not description.strip() or not color.strip() or not brand.strip()):
        tags = _autotag_safe(image_bytes)
        if not category.strip():
            category = str(tags.get("category") or "")
        if not description.strip():
            description = str(tags.get("description") or "")
        if not color.strip():
            color = str(tags.get("color") or "")
        if not brand.strip():
            brand = str(tags.get("brand") or "")

    # Infer missing category/color/brand from text description as well (especially when no photo is uploaded)
    category, color, brand = _infer_tags_from_text(title, description, category, color, brand)

    # Section 8: AI verification question for found items without a question
    if item_type == "found":
        if image_bytes and not verification_question.strip():
            vq = _generate_verification_question_safe(image_bytes)
            verification_question = str(vq.get("question") or "")
            if not verification_answer.strip():
                verification_answer = str(vq.get("answer") or "")
    else:
        verification_question = ""
        verification_answer = ""

    if image_bytes:
        embedding = _embed_image_safe(image_bytes, saved_path)
    else:
        # Cross-modal text-to-image embedding when user reports an item without a photo
        embedding = _embed_text_safe(f"{title} {category} {color} {brand} {description}")
    iso_date = date.strip() or datetime.now(timezone.utc).date().isoformat()

    created = db.insert_item(
        {
            "type": item_type,
            "title": title.strip(),
            "description": description.strip(),
            "category": category.strip(),
            "color": color.strip(),
            "brand": brand.strip(),
            "location": location.strip(),
            "date": iso_date,
            "image_url": image_url,
            "embedding": embedding,
            "verification_question": verification_question.strip(),
            "verification_answer": verification_answer.strip(),
            "status": "open",
            "reporter_name": reporter_name.strip(),
        }
    )

    # Section 8: After creating an item, run find_matches; if top score >= 0.6, notify the other side's reporter
    try:
        matches = _find_matches_safe(created, top_k=5)
        notify.notify_if_top_match(created, matches)
    except Exception:
        pass

    return _format_public_item(created, request)


@app.get("/items")
def get_items(request: Request, type: str | None = Query(None)) -> list[dict[str, Any]]:
    if type is not None and type.strip().lower() not in ("lost", "found"):
        raise HTTPException(status_code=400, detail="type query parameter must be 'lost' or 'found'")
    normalized_type = type.strip().lower() if type else None
    items = db.list_items(type=normalized_type, status=None)
    return [_format_public_item(item, request) for item in items]


@app.get("/items/{item_id}")
def get_item_by_id(item_id: str, request: Request) -> dict[str, Any]:
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _format_public_item(item, request)


@app.get("/matches/{item_id}")
def get_matches_for_item(item_id: str, request: Request) -> list[dict[str, Any]]:
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    raw_matches = _find_matches_safe(item, top_k=5)
    return [_format_match(m, request) for m in raw_matches[:5]]


class CreateClaimRequest(BaseModel):
    item_id: str
    claimant_name: str = ""
    answer: str = ""


class UpdateClaimRequest(BaseModel):
    status: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    roll_number: str = ""
    department: str = "B.Tech Computer Science & Engineering"
    hostel: str = "Hostel Block 4"
    role: str = "student"


@app.post("/auth/login")
def login_user(payload: LoginRequest) -> dict[str, Any]:
    user = db.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@app.post("/auth/signup")
def signup_user(payload: SignupRequest) -> dict[str, Any]:
    try:
        return db.create_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
            roll_number=payload.roll_number,
            department=payload.department,
            hostel=payload.hostel,
            role=payload.role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/auth/users")
def get_demo_users() -> list[dict[str, Any]]:
    return db.list_users()


@app.get("/claims")
def get_all_claims() -> list[dict[str, Any]]:
    return claims.list_claims()


@app.post("/claims")
def post_claim(payload: CreateClaimRequest, request: Request) -> dict[str, str]:
    claimant = payload.claimant_name.strip() or request.headers.get("X-User-Name", "").strip() or "anonymous"
    try:
        created = claims.create_claim(
            item_id=payload.item_id,
            claimant_name=claimant,
            answer=payload.answer,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"id": created["id"], "status": created["status"]}


@app.patch("/claims/{claim_id}")
def patch_claim(claim_id: str, payload: UpdateClaimRequest) -> dict[str, Any]:
    try:
        updated = claims.update_claim_status(claim_id=claim_id, status=payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not updated:
        raise HTTPException(status_code=404, detail="Claim not found")
    return updated


@app.get("/notifications")
def get_user_notifications(request: Request, user: str | None = Query(None)) -> list[dict[str, Any]]:
    target_user = user if user is not None else request.headers.get("X-User-Name")
    return notify.get_notifications(user_name=target_user)

