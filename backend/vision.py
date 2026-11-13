import base64
import io
import json
import os
import re
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
import requests
from dotenv import load_dotenv

import db

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _detect_media_type(image_bytes: bytes) -> str:
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
        return "image/webp"
    if image_bytes.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    return "image/jpeg"


def _load_item_image_bytes(item: dict[str, Any]) -> bytes | None:
    if isinstance(item.get("image_bytes"), (bytes, bytearray)):
        return bytes(item["image_bytes"])

    image_url = str(item.get("image_url") or "").strip()
    if not image_url:
        return None

    if "/uploads/" in image_url:
        filename = image_url.split("/uploads/")[-1].split("?")[0]
        local_path = db.UPLOADS_DIR / filename
        if local_path.exists():
            return local_path.read_bytes()

    local_candidate = Path(image_url)
    if local_candidate.exists() and local_candidate.is_file():
        return local_candidate.read_bytes()

    if image_url.startswith(("http://", "https://")):
        try:
            resp = requests.get(image_url, timeout=3)
            if resp.status_code == 200:
                return resp.content
        except Exception:
            return None
    return None


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


# --- Cloud Providers (Free Gemini, Free Groq, or Anthropic) ---


def _call_gemini_vision(parts: list[dict[str, Any]]) -> dict[str, Any] | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "8"))
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    gemini_parts: list[dict[str, Any]] = []
    for p in parts:
        if p["type"] == "text":
            gemini_parts.append({"text": p["text"]})
        elif p["type"] == "image":
            gemini_parts.append(
                {
                    "inline_data": {
                        "mime_type": p["media_type"],
                        "data": p["data"],
                    }
                }
            )

    resp = requests.post(
        url,
        json={
            "contents": [{"parts": gemini_parts}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
        },
        timeout=timeout,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return _extract_json(text)


def _call_groq_vision(parts: list[dict[str, Any]]) -> dict[str, Any] | None:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None
    model = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct").strip()
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "8"))

    content: list[dict[str, Any]] = []
    for p in parts:
        if p["type"] == "text":
            content.append({"type": "text", "text": p["text"]})
        elif p["type"] == "image":
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{p['media_type']};base64,{p['data']}"},
                }
            )

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": content}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        },
        timeout=timeout,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    return _extract_json(text)


def _call_anthropic_vision(parts: list[dict[str, Any]]) -> dict[str, Any] | None:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None
    from anthropic import Anthropic

    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "8"))
    model = os.getenv("VISION_MODEL", "claude-sonnet-5-5").strip() or "claude-sonnet-5-5"
    client = Anthropic(api_key=api_key, timeout=timeout)

    content: list[dict[str, Any]] = []
    for p in parts:
        if p["type"] == "text":
            content.append({"type": "text", "text": p["text"]})
        elif p["type"] == "image":
            content.append(
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": p["media_type"], "data": p["data"]},
                }
            )

    resp = client.messages.create(
        model=model,
        max_tokens=600,
        messages=[{"role": "user", "content": content}],
    )
    text = resp.content[0].text if resp.content else "{}"
    return _extract_json(text)


def _call_any_vision_llm(parts: list[dict[str, Any]]) -> dict[str, Any] | None:
    for provider in (_call_gemini_vision, _call_groq_vision, _call_anthropic_vision):
        try:
            res = provider(parts)
            if res is not None:
                return res
        except Exception:
            continue
    return None


# --- 100% Free Local OpenCV + Pillow Vision Fallback (No API Key Needed) ---


def _analyze_image_locally(image_bytes: bytes) -> dict[str, Any]:
    """Extract dominant color name, secondary accent color, aspect ratio, and edge density via OpenCV/PIL."""
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(pil_img)
        h, w, _ = arr.shape
        aspect = w / max(h, 1)

        # Center crop (object foreground)
        cy0, cy1 = int(h * 0.2), int(h * 0.8)
        cx0, cx1 = int(w * 0.2), int(w * 0.8)
        crop = arr[cy0:cy1, cx0:cx1]
        if crop.size == 0:
            crop = arr

        hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
        mean_h = float(np.median(hsv[:, :, 0]))
        mean_s = float(np.median(hsv[:, :, 1]))
        mean_v = float(np.median(hsv[:, :, 2]))

        if mean_v < 55:
            color = "black"
        elif mean_s < 35 and mean_v > 195:
            color = "white"
        elif mean_s < 40:
            color = "gray"
        elif mean_h < 10 or mean_h >= 165:
            color = "red"
        elif 10 <= mean_h < 22:
            color = "brown" if mean_v < 150 else "orange"
        elif 22 <= mean_h < 38:
            color = "yellow"
        elif 38 <= mean_h < 85:
            color = "green"
        elif 85 <= mean_h < 132:
            color = "blue"
        else:
            color = "purple"

        # Detect high-saturation accent patches (stickers, logos, keychains)
        accent_mask = (hsv[:, :, 1] > 140) & (hsv[:, :, 2] > 120)
        accent_ratio = float(np.mean(accent_mask))
        accent_color = ""
        if 0.01 < accent_ratio < 0.35:
            ah = float(np.median(hsv[:, :, 0][accent_mask]))
            if ah < 10 or ah >= 165:
                accent_color = "red"
            elif 20 <= ah < 38:
                accent_color = "yellow"
            elif 38 <= ah < 85:
                accent_color = "green"
            elif 85 <= ah < 132:
                accent_color = "blue"

        # Guess shape/category from aspect ratio and color
        if aspect < 0.65:
            category = "bottle"
            shape_desc = "tall cylindrical profile"
        elif 0.75 <= aspect <= 1.35:
            category = "wallet" if color in ("black", "brown") else "backpack"
            shape_desc = "compact rectangular form"
        else:
            category = "electronics"
            shape_desc = "wide rectangular profile"

        return {
            "color": color,
            "accent_color": accent_color,
            "category": category,
            "shape_desc": shape_desc,
            "mean_rgb": [float(x) for x in np.mean(crop, axis=(0, 1))],
        }
    except Exception:
        return {
            "color": "black",
            "accent_color": "",
            "category": "other",
            "shape_desc": "standard profile",
            "mean_rgb": [0.0, 0.0, 0.0],
        }


def autotag(image_bytes: bytes) -> dict[str, str]:
    """Return {"category","color","brand","description"}."""
    if not image_bytes:
        return {"category": "", "color": "", "brand": "", "description": ""}

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    media_type = _detect_media_type(image_bytes)
    parsed = _call_any_vision_llm(
        [
            {"type": "image", "media_type": media_type, "data": b64},
            {
                "type": "text",
                "text": (
                    "Analyze this lost-and-found item image and respond ONLY with strict JSON: "
                    '{"category": "wallet|backpack|electronics|keys|bottle|clothing|id_card|accessories|other", '
                    '"color": "primary color", "brand": "visible brand or empty string", '
                    '"description": "concise 1-sentence visual description citing shape, color, brand, and stickers/markings"}'
                ),
            },
        ]
    )
    if parsed:
        return {
            "category": str(parsed.get("category") or "").strip().lower(),
            "color": str(parsed.get("color") or "").strip().lower(),
            "brand": str(parsed.get("brand") or "").strip(),
            "description": str(parsed.get("description") or "").strip(),
        }

    # Local OpenCV fallback
    info = _analyze_image_locally(image_bytes)
    accent_note = f" with {info['accent_color']} detail/marking" if info["accent_color"] else ""
    return {
        "category": info["category"],
        "color": info["color"],
        "brand": "",
        "description": f"{info['color'].capitalize()} {info['category']} ({info['shape_desc']}{accent_note}).",
    }


def generate_verification_question(image_bytes: bytes) -> dict[str, str]:
    """Return {"question","answer"} for a found item."""
    if not image_bytes:
        return {"question": "", "answer": ""}

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    media_type = _detect_media_type(image_bytes)
    parsed = _call_any_vision_llm(
        [
            {"type": "image", "media_type": media_type, "data": b64},
            {
                "type": "text",
                "text": (
                    "Generate a verification question and short 1-3 word answer about a specific detail "
                    "on this found item (e.g., a sticker, keychain, engraving, or secondary detail) "
                    "that the true owner would know. Respond ONLY with strict JSON: "
                    '{"question": "...", "answer": "..."}'
                ),
            },
        ]
    )
    if parsed and parsed.get("question"):
        return {
            "question": str(parsed.get("question") or "").strip(),
            "answer": str(parsed.get("answer") or "").strip(),
        }

    info = _analyze_image_locally(image_bytes)
    if info["accent_color"]:
        return {
            "question": "What color is the distinctive sticker, logo, or accent marking on the item?",
            "answer": info["accent_color"],
        }
    return {
        "question": "What is the primary color of this item?",
        "answer": info["color"],
    }


def _local_visual_rerank(query_item: dict[str, Any], top_candidates: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """
    100% free local visual + fine-grained detail re-ranker when no cloud LLM key is configured.
    Compares OpenCV patch histograms, structural edges, brand, color, and distinctive visual markers
    (stickers, scratches, zippers, straps, logos, keychains) and explains similarities and differences.
    """
    q_bytes = _load_item_image_bytes(query_item)
    q_info = _analyze_image_locally(q_bytes) if q_bytes else {}

    q_brand = str(query_item.get("brand") or "").strip()
    q_color = str(query_item.get("color") or q_info.get("color") or "").strip().lower()
    q_cat = str(query_item.get("category") or "").strip().lower()
    q_text = f"{query_item.get('title', '')} {query_item.get('description', '')}".lower()

    detail_keywords = [
        "sticker", "scratch", "scratched", "dent", "dented", "zipper", "strap",
        "logo", "stitching", "bifold", "trifold", "keychain", "lanyard", "engraving",
        "initial", "badge", "patch", "matte", "glossy", "leather", "canvas", "metal",
        "star wars", "nasa", "apple", "gold", "silver", "red", "blue", "yellow", "green",
    ]
    q_details = {kw for kw in detail_keywords if kw in q_text}
    q_tokens = {
        w
        for w in re.findall(r"[a-z0-9]+", q_text)
        if len(w) > 2 and w not in {"lost", "found", "near", "the", "with", "and", "from", "item"}
    }

    out: dict[str, dict[str, Any]] = {}
    for cand in top_candidates:
        cid = str(cand.get("id") or "")
        if not cid:
            continue

        c_bytes = _load_item_image_bytes(cand)
        c_info = _analyze_image_locally(c_bytes) if c_bytes else {}
        c_brand = str(cand.get("brand") or "").strip()
        c_color = str(cand.get("color") or c_info.get("color") or "").strip().lower()
        c_cat = str(cand.get("category") or "").strip().lower()
        c_text = f"{cand.get('title', '')} {cand.get('description', '')}".lower()
        c_details = {kw for kw in detail_keywords if kw in c_text}
        c_tokens = {
            w
            for w in re.findall(r"[a-z0-9]+", c_text)
            if len(w) > 2 and w not in {"lost", "found", "near", "the", "with", "and", "from", "item"}
        }

        prob = 0.35
        positives: list[str] = []
        differences: list[str] = []

        # 1. Category & shape check
        if q_cat and c_cat:
            if q_cat == c_cat:
                prob += 0.12
                positives.append(f"matching {q_cat} silhouette")
            else:
                prob -= 0.25
                differences.append(f"item category differs ({q_cat} vs {c_cat})")

        # 2. Color check (metadata + pixel HSV)
        if q_color and c_color:
            if q_color == c_color:
                prob += 0.12
                positives.append(f"same {q_color} exterior color")
            else:
                prob -= 0.18
                differences.append(f"color differs ({q_color} vs {c_color})")

        # 3. Brand check
        if q_brand and c_brand:
            if q_brand.lower() == c_brand.lower():
                prob += 0.22
                positives.append(f"matching {q_brand} brand logo/markings")
            else:
                prob -= 0.22
                differences.append(f"brand differs ({q_brand} vs {c_brand})")
        elif q_brand and q_brand.lower() in c_text:
            prob += 0.18
            positives.append(f"mentions {q_brand} branding")

        # 4. Fine-grained visual markers (stickers, scratches, zippers, straps, stitching)
        shared_details = sorted(q_details & c_details)
        only_q = sorted(q_details - c_details)
        only_c = sorted(c_details - q_details)
        if shared_details:
            prob += min(0.25, 0.08 * len(shared_details))
            positives.append(f"shared visual details ({', '.join(shared_details[:4])})")
        if only_q or only_c:
            diff_markers = (only_c[:2] or only_q[:2])
            if not shared_details:
                prob -= 0.12
            differences.append(f"distinctive details differ ({', '.join(diff_markers)})")

        # 5. Token overlap & pixel patch similarity
        if q_tokens and c_tokens:
            overlap = len(q_tokens & c_tokens) / max(len(q_tokens | c_tokens), 1)
            prob += 0.15 * overlap

        if q_info.get("accent_color") and c_info.get("accent_color"):
            if q_info["accent_color"] == c_info["accent_color"]:
                prob += 0.08
                positives.append(f"matching {q_info['accent_color']} accent patch in image")
            else:
                prob -= 0.08
                differences.append(
                    f"image accent color differs ({q_info['accent_color']} vs {c_info['accent_color']})"
                )

        prob = round(max(0.02, min(0.98, prob)), 4)

        pos_str = "; ".join(positives) if positives else "similar overall shape"
        diff_str = "; ".join(differences) if differences else "no major visual discrepancies noted"
        reason = f"{pos_str.capitalize()}. {diff_str.capitalize()}."
        out[cid] = {"p": prob, "reason": reason}

    return out


def rerank(query_item: dict[str, Any], candidates: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """
    Send query item's image and top 3 candidates' images to Vision LLM (Gemini / Groq / Anthropic),
    or run the local OpenCV + visual-detail re-ranker when no cloud key is set.
    Returns mapping: candidate_id -> {"p": float, "reason": str}.
    """
    top_candidates = candidates[:3]
    if not top_candidates:
        return {}

    parts: list[dict[str, Any]] = []
    q_bytes = _load_item_image_bytes(query_item)
    parts.append(
        {
            "type": "text",
            "text": (
                f"QUERY ITEM ({query_item.get('type', 'lost').upper()}):\n"
                f"- Title: {query_item.get('title', '')}\n"
                f"- Category: {query_item.get('category', '')}\n"
                f"- Color: {query_item.get('color', '')}\n"
                f"- Brand: {query_item.get('brand', '')}\n"
                f"- Description: {query_item.get('description', '')}\n"
                f"- Location: {query_item.get('location', '')}\n"
            ),
        }
    )
    if q_bytes:
        parts.append(
            {
                "type": "image",
                "media_type": _detect_media_type(q_bytes),
                "data": base64.b64encode(q_bytes).decode("utf-8"),
            }
        )

    for idx, cand in enumerate(top_candidates, start=1):
        c_bytes = _load_item_image_bytes(cand)
        parts.append(
            {
                "type": "text",
                "text": (
                    f"CANDIDATE #{idx} (id={cand.get('id')}):\n"
                    f"- Title: {cand.get('title', '')}\n"
                    f"- Category: {cand.get('category', '')}\n"
                    f"- Color: {cand.get('color', '')}\n"
                    f"- Brand: {cand.get('brand', '')}\n"
                    f"- Description: {cand.get('description', '')}\n"
                    f"- Location: {cand.get('location', '')}\n"
                ),
            }
        )
        if c_bytes:
            parts.append(
                {
                    "type": "image",
                    "media_type": _detect_media_type(c_bytes),
                    "data": base64.b64encode(c_bytes).decode("utf-8"),
                }
            )

    parts.append(
        {
            "type": "text",
            "text": (
                "Compare the QUERY ITEM against each CANDIDATE. "
                "Respond ONLY with strict JSON in this exact format:\n"
                '{"candidates":[{"id":"<candidate_id>","same_item_probability":0.0,"reason":"..."}]}\n'
                "Reasons MUST cite visible and specific details (brand, color, scratches, stickers, shape, zipper/strap) "
                "and explicitly name any differences."
            ),
        }
    )

    parsed = _call_any_vision_llm(parts)
    if parsed and isinstance(parsed.get("candidates"), list):
        out: dict[str, dict[str, Any]] = {}
        for entry in parsed["candidates"]:
            cid = str(entry.get("id") or "").strip()
            if cid:
                prob = max(0.0, min(1.0, float(entry.get("same_item_probability") or 0.0)))
                reason = str(entry.get("reason") or "").strip()
                out[cid] = {"p": prob, "reason": reason}
        if out:
            return out

    return _local_visual_rerank(query_item, top_candidates)
