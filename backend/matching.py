from datetime import date as dt_date
import io
from pathlib import Path
import re
from typing import Any

import cv2
import numpy as np
from PIL import Image

import db
import vision

# Try loading sentence-transformers CLIP once at startup ONLY if already installed locally
_CLIP_MODEL = None
try:
    from sentence_transformers import SentenceTransformer  # type: ignore

    _CLIP_MODEL = SentenceTransformer("clip-ViT-B-32", local_files_only=True)
except Exception:
    _CLIP_MODEL = None


def _normalize(vec: np.ndarray) -> list[float]:
    arr = np.asarray(vec, dtype=np.float32).flatten()
    if arr.size < 512:
        arr = np.pad(arr, (0, 512 - arr.size))
    elif arr.size > 512:
        arr = arr[:512]
    norm = float(np.linalg.norm(arr))
    if norm > 1e-8:
        arr = arr / norm
    return [round(float(x), 6) for x in arr]


def _load_pil_image(path_or_bytes: str | Path | bytes | bytearray | Image.Image) -> Image.Image:
    if isinstance(path_or_bytes, Image.Image):
        return path_or_bytes.convert("RGB")
    if isinstance(path_or_bytes, (bytes, bytearray)):
        return Image.open(io.BytesIO(path_or_bytes)).convert("RGB")
    p = Path(str(path_or_bytes))
    return Image.open(p).convert("RGB")


def _extract_visual_embedding_512(img: Image.Image) -> list[float]:
    """
    Compute a genuine 512-dimensional L2-normalized visual feature vector from image pixels:
      - Dims 0..63: Shared visual-semantic concept subspace (colors, object aspect/geometry, accents)
      - Dims 64..351: 3x3 spatial grid HSV histograms (9 cells x 32 bins = 288 dims)
      - Dims 352..415: Multi-scale Canny edge & gradient orientation histograms (64 dims)
      - Dims 416..511: 4x4 spatial RGB color moments & texture contrast (96 dims)
    """
    img_resized = img.resize((128, 128), Image.Resampling.BILINEAR)
    rgb = np.asarray(img_resized, dtype=np.uint8)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    vec = np.zeros(512, dtype=np.float32)

    # Center foreground region for semantic color/shape channels (dims 0..63)
    fg = hsv[20:108, 20:108]
    h_ch, s_ch, v_ch = fg[:, :, 0], fg[:, :, 1], fg[:, :, 2]

    # Color concept activations (dims 0..15)
    vec[0] = float(np.mean(v_ch < 60))  # black
    vec[1] = float(np.mean((s_ch < 35) & (v_ch > 190)))  # white
    vec[2] = float(np.mean((s_ch < 45) & (v_ch >= 60) & (v_ch <= 190)))  # gray/silver
    vec[3] = float(np.mean(((h_ch < 10) | (h_ch >= 165)) & (s_ch >= 50) & (v_ch >= 60)))  # red
    vec[4] = float(np.mean((h_ch >= 10) & (h_ch < 22) & (s_ch >= 45) & (v_ch < 165)))  # brown/leather
    vec[5] = float(np.mean((h_ch >= 10) & (h_ch < 22) & (s_ch >= 60) & (v_ch >= 165)))  # orange
    vec[6] = float(np.mean((h_ch >= 22) & (h_ch < 38) & (s_ch >= 50) & (v_ch >= 70)))  # yellow/gold
    vec[7] = float(np.mean((h_ch >= 38) & (h_ch < 85) & (s_ch >= 45) & (v_ch >= 55)))  # green
    vec[8] = float(np.mean((h_ch >= 85) & (h_ch < 132) & (s_ch >= 45) & (v_ch >= 55)))  # blue/navy
    vec[9] = float(np.mean((h_ch >= 132) & (h_ch < 165) & (s_ch >= 45) & (v_ch >= 55)))  # purple/pink

    # Foreground bounding box aspect & geometry (dims 16..31)
    edges_full = cv2.Canny(gray, 60, 150)
    ys, xs = np.where(edges_full > 0)
    if len(xs) > 10:
        bbox_w = float(np.percentile(xs, 95) - np.percentile(xs, 5))
        bbox_h = float(np.percentile(ys, 95) - np.percentile(ys, 5))
        aspect = bbox_w / max(bbox_h, 1.0)
        fill_ratio = float(len(xs)) / float(128 * 128)
    else:
        aspect = 1.0
        fill_ratio = 0.05

    vec[16] = 1.0 if 0.85 <= aspect <= 1.45 else 0.2  # compact rectangular (wallet/case)
    vec[17] = 1.0 if aspect < 0.72 else 0.1  # tall vertical (bottle/thermos)
    vec[18] = 1.0 if 0.72 <= aspect < 0.95 else 0.2  # backpack/tote
    vec[19] = 1.0 if aspect > 1.35 else 0.2  # wide electronics/glasses/keys
    vec[20] = min(1.0, fill_ratio * 5.0)

    # Accent / sticker / badge detector in foreground (dims 24..31)
    bright_sat = (s_ch > 150) & (v_ch > 120)
    vec[24] = float(np.mean(bright_sat & ((h_ch < 10) | (h_ch >= 165)))) * 3.0  # red sticker/accent
    vec[25] = float(np.mean(bright_sat & (h_ch >= 20) & (h_ch < 38))) * 3.0  # yellow/gold logo/sticker
    vec[26] = float(np.mean(bright_sat & (h_ch >= 85) & (h_ch < 132))) * 3.0  # blue sticker/accent
    vec[27] = float(np.mean(bright_sat & (h_ch >= 38) & (h_ch < 85))) * 3.0  # green sticker/accent

    # Dims 64..351: 3x3 spatial grid HSV histograms (9 cells x 32 dims = 288)
    idx = 64
    cell_h, cell_w = 128 // 3, 128 // 3
    for gy in range(3):
        for gx in range(3):
            patch = hsv[gy * cell_h : (gy + 1) * cell_h, gx * cell_w : (gx + 1) * cell_w]
            h_hist = cv2.calcHist([patch], [0], None, [16], [0, 180]).flatten()
            s_hist = cv2.calcHist([patch], [1], None, [8], [0, 256]).flatten()
            v_hist = cv2.calcHist([patch], [2], None, [8], [0, 256]).flatten()
            cell_feat = np.concatenate([h_hist, s_hist, v_hist])
            cell_feat = cell_feat / (np.sum(cell_feat) + 1e-6)
            vec[idx : idx + 32] = cell_feat
            idx += 32

    # Dims 352..415: Gradient orientation & magnitude histogram across 2x2 quadrants (4 x 16 = 64)
    gx_sobel = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy_sobel = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(gx_sobel, gy_sobel, angleInDegrees=True)
    idx = 352
    for qy in range(2):
        for qx in range(2):
            m_q = mag[qy * 64 : (qy + 1) * 64, qx * 64 : (qx + 1) * 64]
            a_q = ang[qy * 64 : (qy + 1) * 64, qx * 64 : (qx + 1) * 64]
            hist, _ = np.histogram(a_q, bins=16, range=(0.0, 360.0), weights=m_q)
            hist = hist / (np.sum(hist) + 1e-6)
            vec[idx : idx + 16] = hist.astype(np.float32)
            idx += 16

    # Dims 416..511: 4x4 spatial RGB mean + std moments (16 cells x 6 = 96)
    idx = 416
    for py in range(4):
        for px in range(4):
            p_rgb = rgb[py * 32 : (py + 1) * 32, px * 32 : (px + 1) * 32].astype(np.float32) / 255.0
            means = np.mean(p_rgb, axis=(0, 1))
            stds = np.std(p_rgb, axis=(0, 1))
            vec[idx : idx + 3] = means * 0.5
            vec[idx + 3 : idx + 6] = stds * 0.5
            idx += 6

    return _normalize(vec)


def embed_image(path_or_bytes: Any) -> list[float]:
    """Return 512 floats, L2-normalized."""
    try:
        img = _load_pil_image(path_or_bytes)
        if _CLIP_MODEL is not None:
            emb = _CLIP_MODEL.encode(img, normalize_embeddings=True)
            return _normalize(np.asarray(emb, dtype=np.float32))
        return _extract_visual_embedding_512(img)
    except Exception:
        return [0.0] * 512


def embed_text(text: str) -> list[float]:
    """Return 512 floats, L2-normalized, aligned with shared visual-semantic channels in dims 0..63."""
    if not text or not text.strip():
        return [0.0] * 512

    if _CLIP_MODEL is not None:
        try:
            emb = _CLIP_MODEL.encode(text, normalize_embeddings=True)
            return _normalize(np.asarray(emb, dtype=np.float32))
        except Exception:
            pass

    lower = text.lower()
    vec = np.zeros(512, dtype=np.float32)

    # Align dims 0..31 with the exact same visual concepts as _extract_visual_embedding_512
    color_map = {
        0: ["black", "dark", "charcoal", "matte black", "ebony"],
        1: ["white", "ivory", "cream", "pearl"],
        2: ["gray", "grey", "silver", "metallic", "steel", "aluminum"],
        3: ["red", "crimson", "maroon", "burgundy", "scarlet"],
        4: ["brown", "tan", "leather", "cognac", "camel", "coffee"],
        5: ["orange", "coral", "amber"],
        6: ["yellow", "gold", "golden", "mustard", "brass"],
        7: ["green", "olive", "emerald", "mint", "forest", "sage"],
        8: ["blue", "navy", "cobalt", "teal", "cyan", "denim", "sapphire"],
        9: ["purple", "violet", "lavender", "pink", "magenta", "rose"],
    }
    for dim, words in color_map.items():
        if any(w in lower for w in words):
            vec[dim] = 0.85

    if any(w in lower for w in ["wallet", "bifold", "trifold", "cardholder", "pouch", "purse"]):
        vec[16] = 1.0
    if any(w in lower for w in ["bottle", "flask", "hydro", "thermos", "tumbler", "mug"]):
        vec[17] = 1.0
    if any(w in lower for w in ["backpack", "bag", "rucksack", "tote", "satchel"]):
        vec[18] = 1.0
    if any(w in lower for w in ["laptop", "macbook", "phone", "iphone", "airpods", "headphones", "earbuds", "keys", "keychain", "glasses", "calculator"]):
        vec[19] = 1.0

    if "red" in lower and any(w in lower for w in ["sticker", "logo", "patch", "stripe", "tag", "stitching"]):
        vec[24] = 0.9
    if any(w in lower for w in ["yellow", "gold", "star wars", "brass"]) and any(w in lower for w in ["sticker", "logo", "zipper", "clasp", "emblem", "badge"]):
        vec[25] = 0.9
    if "blue" in lower and any(w in lower for w in ["sticker", "logo", "nasa", "patch", "lanyard"]):
        vec[26] = 0.9
    if "green" in lower and any(w in lower for w in ["sticker", "logo", "patch", "carabiner"]):
        vec[27] = 0.9

    # Deterministic token & trigram hashing in dims 64..511 for fine-grained text similarity
    tokens = re.findall(r"[a-z0-9]+", lower)
    for tok in tokens:
        if len(tok) < 2:
            continue
        h1 = (hash(tok) % 448) + 64
        h2 = (hash(tok + "_b") % 448) + 64
        vec[h1] += 0.6
        vec[h2] += 0.4
        for i in range(len(tok) - 2):
            tri = tok[i : i + 3]
            ht = (hash(tri) % 448) + 64
            vec[ht] += 0.2

    return _normalize(vec)


def cosine_similarity(a: list[float] | np.ndarray, b: list[float] | np.ndarray) -> float:
    va = np.asarray(a, dtype=np.float32).flatten()
    vb = np.asarray(b, dtype=np.float32).flatten()
    if va.size == 0 or vb.size == 0 or va.size != vb.size:
        return 0.0
    na = float(np.linalg.norm(va))
    nb = float(np.linalg.norm(vb))
    if na < 1e-8 or nb < 1e-8:
        return 0.0
    sim = float(np.dot(va, vb) / (na * nb))
    return max(0.0, min(1.0, sim))


def _parse_iso_date(d_str: str) -> dt_date | None:
    if not d_str:
        return None
    try:
        return dt_date.fromisoformat(str(d_str).strip()[:10])
    except Exception:
        return None


def _compute_category_color_score(q: dict[str, Any], c: dict[str, Any]) -> float:
    q_cat = str(q.get("category") or "").strip().lower()
    c_cat = str(c.get("category") or "").strip().lower()
    q_col = str(q.get("color") or "").strip().lower()
    c_col = str(c.get("color") or "").strip().lower()

    cat_score = 1.0 if (q_cat and c_cat and q_cat == c_cat) else 0.0
    if q_col and c_col:
        col_score = 1.0 if (q_col == c_col or q_col in c_col or c_col in q_col) else 0.0
    else:
        col_score = 0.5

    return round(0.6 * cat_score + 0.4 * col_score, 4)


def _compute_location_score(q_loc: str, c_loc: str) -> float:
    ql = (q_loc or "").strip().lower()
    cl = (c_loc or "").strip().lower()
    if not ql or not cl:
        return 0.5
    if ql == cl:
        return 1.0
    if ql in cl or cl in ql:
        return 0.85
    q_words = {w for w in re.findall(r"[a-z0-9]+", ql) if len(w) > 2}
    c_words = {w for w in re.findall(r"[a-z0-9]+", cl) if len(w) > 2}
    if q_words & c_words:
        return 0.75
    return 0.15


def _compute_time_score(lost_date_str: str, found_date_str: str) -> float:
    d_lost = _parse_iso_date(lost_date_str)
    d_found = _parse_iso_date(found_date_str)
    if not d_lost or not d_found:
        return 0.7
    diff_days = (d_found - d_lost).days
    if diff_days < 0:
        return 0.0
    return round(max(0.1, 1.0 - (diff_days / 14.0)), 4)


def _compute_text_score(query_item: dict[str, Any], cand_item: dict[str, Any]) -> float:
    q_desc = f"{query_item.get('title', '')} {query_item.get('brand', '')} {query_item.get('color', '')} {query_item.get('description', '')}".strip()
    c_desc = f"{cand_item.get('title', '')} {cand_item.get('brand', '')} {cand_item.get('color', '')} {cand_item.get('description', '')}".strip()

    q_text_emb = embed_text(q_desc)
    c_img_emb = cand_item.get("embedding") or [0.0] * 512

    # Shared concept cosine (CLIP text vs candidate image embedding in dims 0..63)
    qa = np.asarray(q_text_emb[:64], dtype=np.float32)
    cb = np.asarray(c_img_emb[:64], dtype=np.float32)
    na, nb = float(np.linalg.norm(qa)), float(np.linalg.norm(cb))
    cross_modal_sim = float(np.dot(qa, cb) / (na * nb)) if (na > 1e-8 and nb > 1e-8) else 0.0
    cross_modal_sim = max(0.0, min(1.0, cross_modal_sim))

    # Full text embedding similarity between descriptions
    c_text_emb = embed_text(c_desc)
    desc_sim = cosine_similarity(q_text_emb, c_text_emb)

    return round(0.5 * cross_modal_sim + 0.5 * desc_sim, 4)


def _template_reason(query_item: dict[str, Any], cand: dict[str, Any], breakdown: dict[str, float]) -> str:
    notes: list[str] = []
    if breakdown["category"] >= 0.8:
        notes.append(
            f"Matching {cand.get('color') or ''} {cand.get('category') or 'item'}".strip()
        )
    if query_item.get("brand") and cand.get("brand"):
        if str(query_item["brand"]).lower() == str(cand["brand"]).lower():
            notes.append(f"same {cand['brand']} brand")
        else:
            notes.append(f"brand differs ({query_item['brand']} vs {cand['brand']})")
    if breakdown["location"] >= 0.75 and cand.get("location"):
        notes.append(f"reported near {cand['location']}")
    if not notes:
        notes.append(f"Visual similarity {int(breakdown['image'] * 100)}%")
    return "; ".join(notes) + "."


def find_matches(item: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
    """
    Full Section 7 Matching Pipeline:
      1. Hard filters: opposite type (lost vs found), status == 'open', found_date >= lost_date
      2. Retrieve: top 10 candidates by image embedding cosine similarity
      3. Metadata score per candidate: text, category+color, location, time
      4. Re-rank top 3 candidates via vision.rerank (with clean fallback if LLM fails/times out)
      5. Final weighted score & confidence classification, returning top_k (default 5)
    """
    q_type = str(item.get("type") or "lost").strip().lower()
    opposite_type = "found" if q_type == "lost" else "lost"
    all_candidates = db.list_items(type=opposite_type, status="open")

    q_emb = item.get("embedding")
    if not q_emb or len(q_emb) != 512 or all(x == 0.0 for x in q_emb):
        img_bytes = vision._load_item_image_bytes(item)
        if img_bytes:
            q_emb = embed_image(img_bytes)
        else:
            q_emb = embed_text(
                f"{item.get('title', '')} {item.get('category', '')} {item.get('color', '')} {item.get('brand', '')} {item.get('description', '')}"
            )

    q_has_photo = bool(str(item.get("image_url") or "").strip())
    q_date_str = str(item.get("date") or item.get("item_date") or "")

    # Step 1: Hard filters + image (or cross-modal text-to-image) cosine computation
    filtered: list[tuple[float, dict[str, Any]]] = []
    for cand in all_candidates:
        if cand.get("id") == item.get("id"):
            continue
        c_date_str = str(cand.get("date") or cand.get("item_date") or "")
        lost_d = q_date_str if q_type == "lost" else c_date_str
        found_d = c_date_str if q_type == "lost" else q_date_str

        parsed_lost = _parse_iso_date(lost_d)
        parsed_found = _parse_iso_date(found_d)
        if parsed_lost and parsed_found and parsed_found < parsed_lost:
            continue

        c_has_photo = bool(str(cand.get("image_url") or "").strip())
        if q_has_photo and c_has_photo:
            c_emb = cand.get("embedding") or [0.0] * 512
            img_sim = cosine_similarity(q_emb, c_emb)
        else:
            # Cross-modal text-to-image similarity when one side has no photo
            img_sim = _compute_text_score(item, cand)
        filtered.append((img_sim, cand))

    # Step 2: Retrieve top 10 by image cosine similarity
    filtered.sort(key=lambda x: x[0], reverse=True)
    top_10 = filtered[:10]
    if not top_10:
        return []

    # Step 3: Compute metadata scores for top 10
    scored_candidates: list[dict[str, Any]] = []
    for img_sim, cand in top_10:
        c_date_str = str(cand.get("date") or cand.get("item_date") or "")
        lost_d = q_date_str if q_type == "lost" else c_date_str
        found_d = c_date_str if q_type == "lost" else q_date_str

        text_sim = _compute_text_score(item, cand)
        cat_col_sim = _compute_category_color_score(item, cand)
        loc_sim = _compute_location_score(str(item.get("location") or ""), str(cand.get("location") or ""))
        time_sim = _compute_time_score(lost_d, found_d)

        # Base weighted sum without LLM (weights sum to 0.75)
        base_sum = (
            0.35 * img_sim
            + 0.15 * text_sim
            + 0.10 * cat_col_sim
            + 0.10 * loc_sim
            + 0.05 * time_sim
        )
        scored_candidates.append(
            {
                "cand": cand,
                "base_sum": base_sum,
                "breakdown": {
                    "image": round(img_sim, 4),
                    "text": round(text_sim, 4),
                    "category": round(cat_col_sim, 4),
                    "location": round(loc_sim, 4),
                    "time": round(time_sim, 4),
                    "llm": 0.0,
                },
            }
        )

    # Sort by pre-LLM hybrid score so the best 3 go to vision.rerank
    scored_candidates.sort(key=lambda x: x["base_sum"], reverse=True)
    top_3_items = [entry["cand"] for entry in scored_candidates[:3]]

    # Step 4: Vision LLM / visual re-rank on top 3
    try:
        rerank_results = vision.rerank(item, top_3_items)
    except Exception:
        rerank_results = {}

    # Step 5: Compute final scores & build Match dicts
    final_matches: list[dict[str, Any]] = []
    for entry in scored_candidates:
        cand = entry["cand"]
        cid = str(cand.get("id") or "")
        b = entry["breakdown"]
        base_sum = entry["base_sum"]

        if cid in rerank_results:
            llm_prob = float(rerank_results[cid].get("p") or 0.0)
            b["llm"] = round(llm_prob, 4)
            final_score = round(base_sum + 0.25 * llm_prob, 4)
            reason = str(rerank_results[cid].get("reason") or "").strip() or _template_reason(item, cand, b)
        else:
            # Renormalize without llm term (divide by 0.75)
            final_score = round(base_sum / 0.75, 4)
            reason = _template_reason(item, cand, b)

        final_score = max(0.0, min(1.0, final_score))
        confidence = "high" if final_score >= 0.75 else ("medium" if final_score >= 0.5 else "low")

        final_matches.append(
            {
                "item": db.to_public_item(cand),
                "score": final_score,
                "breakdown": b,
                "reason": reason,
                "confidence": confidence,
            }
        )

    final_matches.sort(key=lambda x: x["score"], reverse=True)
    return final_matches[:top_k]

