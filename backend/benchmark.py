from typing import Any

import db
import matching
import seed


def rank_clip_only(lost_item: dict[str, Any], found_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rank open found items purely by image embedding cosine similarity (CLIP-only baseline)."""
    q_emb = lost_item.get("embedding") or [0.0] * 512
    scored: list[tuple[float, dict[str, Any]]] = []
    for cand in found_items:
        c_emb = cand.get("embedding") or [0.0] * 512
        sim = matching.cosine_similarity(q_emb, c_emb)
        scored.append((sim, cand))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"id": c["id"], "title": c["title"], "score": round(sim, 4)} for sim, c in scored]


def run_benchmark() -> dict[str, Any]:
    seed.seed_demo_data()
    found_items = db.list_items(type="found", status="open")

    total = len(seed.GROUND_TRUTH_PAIRS)
    clip_top1 = 0
    clip_top3 = 0
    full_top1 = 0
    full_top3 = 0

    print("=" * 86)
    print("FindIt AI Matching Benchmark: Image-Only (CLIP Baseline) vs Full Hybrid + Vision Pipeline")
    print("=" * 86)
    print(f"{'Lost Query Item':<28} | {'CLIP-Only Top-1':<26} | {'Full Pipeline Top-1':<26}")
    print("-" * 86)

    for lost_id, expected_found_id in seed.GROUND_TRUTH_PAIRS:
        lost_item = db.get_item(lost_id)
        if not lost_item:
            continue

        # 1. CLIP-only ranking
        clip_ranked = rank_clip_only(lost_item, found_items)
        clip_ids = [r["id"] for r in clip_ranked]
        c_hit1 = bool(clip_ids and clip_ids[0] == expected_found_id)
        c_hit3 = expected_found_id in clip_ids[:3]
        if c_hit1:
            clip_top1 += 1
        if c_hit3:
            clip_top3 += 1

        # 2. Full Pipeline ranking (Image + Text + Category/Color + Location + Time + Vision Re-rank)
        full_matches = matching.find_matches(lost_item, top_k=5)
        full_ids = [m["item"]["id"] for m in full_matches]
        f_hit1 = bool(full_ids and full_ids[0] == expected_found_id)
        f_hit3 = expected_found_id in full_ids[:3]
        if f_hit1:
            full_top1 += 1
        if f_hit3:
            full_top3 += 1

        c_mark = "OK" if c_hit1 else "MISS"
        f_mark = "OK" if f_hit1 else "MISS"
        c_top_str = f"[{c_mark}] {clip_ids[0] if clip_ids else 'none'}"
        f_top_str = f"[{f_mark}] {full_ids[0] if full_ids else 'none'}"
        print(f"{lost_id:<28} | {c_top_str:<26} | {f_top_str:<26}")

    clip_top1_pct = (clip_top1 / total) * 100.0
    clip_top3_pct = (clip_top3 / total) * 100.0
    full_top1_pct = (full_top1 / total) * 100.0
    full_top3_pct = (full_top3 / total) * 100.0

    print("=" * 86)
    print(f"SUMMARY METRICS (n = {total} queries across {len(found_items)} candidate found items):")
    print(f"  - Image-Only (CLIP Baseline) : Top-1 Accuracy = {clip_top1}/{total} ({clip_top1_pct:5.1f}%) | Top-3 Accuracy = {clip_top3}/{total} ({clip_top3_pct:5.1f}%)")
    print(f"  - Full FindIt AI Pipeline    : Top-1 Accuracy = {full_top1}/{total} ({full_top1_pct:5.1f}%) | Top-3 Accuracy = {full_top3}/{total} ({full_top3_pct:5.1f}%)")
    print("=" * 86)

    return {
        "total": total,
        "clip_top1": clip_top1_pct,
        "clip_top3": clip_top3_pct,
        "full_top1": full_top1_pct,
        "full_top3": full_top3_pct,
    }


if __name__ == "__main__":
    run_benchmark()

