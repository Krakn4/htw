from pathlib import Path
from typing import Any
from PIL import Image, ImageDraw

import db
import matching
import notify


def _draw_wallet_image(
    path: Path,
    bg_color: tuple[int, int, int],
    body_color: tuple[int, int, int],
    accent_color: tuple[int, int, int] | None = None,
    stripe_color: tuple[int, int, int] | None = None,
    shift_x: int = 0,
) -> None:
    img = Image.new("RGB", (256, 256), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Wallet body (compact rectangle)
    x0, y0, x1, y1 = 44 + shift_x, 64, 212 + shift_x, 192
    draw.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=body_color, outline=(50, 50, 50), width=3)
    # Stitching line
    draw.rounded_rectangle([x0 + 8, y0 + 8, x1 - 8, y1 - 8], radius=10, outline=(80, 80, 80), width=1)
    if stripe_color:
        draw.rectangle([x0 + 10, y0 + 55, x1 - 10, y0 + 72], fill=stripe_color)
    if accent_color:
        # Distinctive badge / sticker / logo corner
        draw.ellipse([x1 - 46, y1 - 46, x1 - 16, y1 - 16], fill=accent_color)
    img.save(path, format="JPEG", quality=92)


def _draw_bottle_image(
    path: Path,
    bg_color: tuple[int, int, int],
    body_color: tuple[int, int, int],
    sticker_color: tuple[int, int, int] | None = None,
    shift_x: int = 0,
) -> None:
    img = Image.new("RGB", (256, 256), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Cap
    draw.rectangle([104 + shift_x, 26, 152 + shift_x, 54], fill=(35, 35, 35))
    # Tall cylindrical body
    draw.rounded_rectangle([82 + shift_x, 54, 174 + shift_x, 228], radius=16, fill=body_color, outline=(40, 40, 40), width=3)
    if sticker_color:
        draw.rectangle([98 + shift_x, 125, 158 + shift_x, 165], fill=sticker_color)
    img.save(path, format="JPEG", quality=92)


def _draw_backpack_image(
    path: Path,
    bg_color: tuple[int, int, int],
    body_color: tuple[int, int, int],
    pocket_color: tuple[int, int, int],
    patch_color: tuple[int, int, int] | None = None,
    shift_x: int = 0,
) -> None:
    img = Image.new("RGB", (256, 256), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Main pack
    draw.rounded_rectangle([58 + shift_x, 42, 198 + shift_x, 218], radius=24, fill=body_color, outline=(30, 30, 30), width=3)
    # Front zipper pocket
    draw.rounded_rectangle([76 + shift_x, 124, 180 + shift_x, 202], radius=12, fill=pocket_color, outline=(60, 60, 60), width=2)
    if patch_color:
        draw.polygon([(128 + shift_x, 68), (110 + shift_x, 98), (146 + shift_x, 98)], fill=patch_color)
    img.save(path, format="JPEG", quality=92)


def _draw_electronics_image(
    path: Path,
    bg_color: tuple[int, int, int],
    body_color: tuple[int, int, int],
    sticker_color: tuple[int, int, int] | None = None,
    shift_x: int = 0,
) -> None:
    img = Image.new("RGB", (256, 256), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Wide laptop / case profile
    draw.rounded_rectangle([32 + shift_x, 72, 224 + shift_x, 188], radius=10, fill=body_color, outline=(70, 70, 70), width=3)
    if sticker_color:
        draw.ellipse([60 + shift_x, 96, 98 + shift_x, 134], fill=sticker_color)
    img.save(path, format="JPEG", quality=92)


REAL_PHOTO_URLS: dict[str, str] = {
    "lost_wallet_fossil.jpg": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    "found_wallet_fossil.jpg": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=580&q=80",
    "lost_wallet_herschel.jpg": "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?auto=format&fit=crop&w=600&q=80",
    "found_wallet_herschel.jpg": "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?auto=format&fit=crop&w=580&q=80",
    "lost_bottle_hydro.jpg": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    "found_bottle_hydro.jpg": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=580&q=80",
    "lost_bottle_stanley.jpg": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80",
    "found_bottle_stanley.jpg": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=580&q=80",
    "lost_backpack_northface.jpg": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    "found_backpack_northface.jpg": "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80",
    "found_backpack_jansport.jpg": "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=600&q=80",
    "lost_laptop_macbook.jpg": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    "found_laptop_macbook.jpg": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80",
    "found_laptop_dell.jpg": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
}


def _ensure_real_photo(path: Path) -> bool:
    """Keep existing real photo if > 5KB, or fetch from Unsplash if online."""
    if path.exists() and path.stat().st_size > 5000:
        return True
    url = REAL_PHOTO_URLS.get(path.name)
    if not url:
        return False
    try:
        import io
        import requests

        resp = requests.get(url, timeout=6)
        if resp.status_code == 200 and len(resp.content) > 5000:
            img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            img.save(path, format="JPEG", quality=90)
            return True
    except Exception:
        pass
    return False


# Ground-truth pairs for benchmark.py: (lost_id, true_found_id)
GROUND_TRUTH_PAIRS: list[tuple[str, str]] = [
    ("lost-wallet-fossil", "found-wallet-fossil"),
    ("lost-wallet-herschel", "found-wallet-herschel"),
    ("lost-bottle-hydro", "found-bottle-hydro"),
    ("lost-bottle-stanley", "found-bottle-stanley"),
    ("lost-backpack-northface", "found-backpack-northface"),
    ("lost-laptop-macbook", "found-laptop-macbook"),
]


def seed_demo_data(base_url: str = "http://localhost:8000") -> list[dict[str, Any]]:
    """
    Populate SQLite database and uploads/ folder with realistic campus Lost & Found items,
    specifically including near-duplicate pairs (two black wallets, two blue bottles, etc.)
    where naive image-only matching gets confused by lighting/background, while the full
    hybrid + Vision re-ranking pipeline ranks the true match #1.
    """
    db.init_db()
    with db.get_connection() as conn:
        conn.execute("DELETE FROM notifications")
        conn.execute("DELETE FROM claims")
        conn.execute("DELETE FROM items")
        conn.commit()

    uploads = db.UPLOADS_DIR
    uploads.mkdir(parents=True, exist_ok=True)

    # Only draw synthetic fallback images if real photos are not present in uploads/
    for fname in REAL_PHOTO_URLS:
        _ensure_real_photo(uploads / fname)

    if not (uploads / "lost_wallet_fossil.jpg").exists() or (uploads / "lost_wallet_fossil.jpg").stat().st_size <= 5000:
        _draw_wallet_image(
            uploads / "lost_wallet_fossil.jpg",
            bg_color=(215, 195, 165),
            body_color=(25, 25, 28),
            accent_color=(215, 175, 45),
        )
    if not (uploads / "found_wallet_fossil.jpg").exists() or (uploads / "found_wallet_fossil.jpg").stat().st_size <= 5000:
        _draw_wallet_image(
            uploads / "found_wallet_fossil.jpg",
            bg_color=(238, 242, 248),
            body_color=(28, 28, 32),
            accent_color=(215, 175, 45),
            shift_x=10,
        )
    if not (uploads / "lost_wallet_herschel.jpg").exists() or (uploads / "lost_wallet_herschel.jpg").stat().st_size <= 5000:
        _draw_wallet_image(
            uploads / "lost_wallet_herschel.jpg",
            bg_color=(238, 242, 248),
            body_color=(24, 24, 26),
            stripe_color=(195, 35, 35),
        )
    if not (uploads / "found_wallet_herschel.jpg").exists() or (uploads / "found_wallet_herschel.jpg").stat().st_size <= 5000:
        _draw_wallet_image(
            uploads / "found_wallet_herschel.jpg",
            bg_color=(215, 195, 165),
            body_color=(25, 25, 28),
            stripe_color=(195, 35, 35),
            shift_x=-8,
        )
    if not (uploads / "lost_bottle_hydro.jpg").exists() or (uploads / "lost_bottle_hydro.jpg").stat().st_size <= 5000:
        _draw_bottle_image(
            uploads / "lost_bottle_hydro.jpg",
            bg_color=(210, 210, 200),
            body_color=(25, 95, 185),
            sticker_color=(235, 195, 30),
        )
    if not (uploads / "found_bottle_hydro.jpg").exists() or (uploads / "found_bottle_hydro.jpg").stat().st_size <= 5000:
        _draw_bottle_image(
            uploads / "found_bottle_hydro.jpg",
            bg_color=(240, 245, 250),
            body_color=(28, 98, 190),
            sticker_color=(235, 195, 30),
            shift_x=8,
        )
    if not (uploads / "lost_bottle_stanley.jpg").exists() or (uploads / "lost_bottle_stanley.jpg").stat().st_size <= 5000:
        _draw_bottle_image(
            uploads / "lost_bottle_stanley.jpg",
            bg_color=(240, 245, 250),
            body_color=(30, 100, 188),
            sticker_color=(210, 45, 45),
        )
    if not (uploads / "found_bottle_stanley.jpg").exists() or (uploads / "found_bottle_stanley.jpg").stat().st_size <= 5000:
        _draw_bottle_image(
            uploads / "found_bottle_stanley.jpg",
            bg_color=(210, 210, 200),
            body_color=(26, 96, 184),
            sticker_color=(210, 45, 45),
            shift_x=-6,
        )
    if not (uploads / "lost_backpack_northface.jpg").exists() or (uploads / "lost_backpack_northface.jpg").stat().st_size <= 5000:
        _draw_backpack_image(
            uploads / "lost_backpack_northface.jpg",
            bg_color=(225, 225, 220),
            body_color=(45, 48, 52),
            pocket_color=(35, 38, 42),
            patch_color=(220, 50, 45),
        )
    if not (uploads / "found_backpack_northface.jpg").exists() or (uploads / "found_backpack_northface.jpg").stat().st_size <= 5000:
        _draw_backpack_image(
            uploads / "found_backpack_northface.jpg",
            bg_color=(225, 225, 220),
            body_color=(46, 50, 54),
            pocket_color=(36, 39, 43),
            patch_color=(220, 50, 45),
            shift_x=2,
        )
    if not (uploads / "found_backpack_jansport.jpg").exists() or (uploads / "found_backpack_jansport.jpg").stat().st_size <= 5000:
        _draw_backpack_image(
            uploads / "found_backpack_jansport.jpg",
            bg_color=(242, 244, 248),
            body_color=(44, 47, 50),
            pocket_color=(110, 75, 45),
            patch_color=None,
        )
    if not (uploads / "lost_laptop_macbook.jpg").exists() or (uploads / "lost_laptop_macbook.jpg").stat().st_size <= 5000:
        _draw_electronics_image(
            uploads / "lost_laptop_macbook.jpg",
            bg_color=(215, 215, 210),
            body_color=(185, 190, 196),
            sticker_color=(30, 85, 195),
        )
    if not (uploads / "found_laptop_macbook.jpg").exists() or (uploads / "found_laptop_macbook.jpg").stat().st_size <= 5000:
        _draw_electronics_image(
            uploads / "found_laptop_macbook.jpg",
            bg_color=(215, 215, 210),
            body_color=(188, 192, 198),
            sticker_color=(30, 85, 195),
            shift_x=2,
        )
    if not (uploads / "found_laptop_dell.jpg").exists() or (uploads / "found_laptop_dell.jpg").stat().st_size <= 5000:
        _draw_electronics_image(
            uploads / "found_laptop_dell.jpg",
            bg_color=(242, 245, 250),
            body_color=(184, 189, 195),
            sticker_color=None,
        )

    items_spec: list[dict[str, Any]] = [
        # --- LOST ITEMS ---
        {
            "id": "lost-wallet-fossil",
            "type": "lost",
            "title": "Black Leather Fossil Bifold Wallet",
            "description": "Left my matte black leather Fossil bifold wallet on a study desk on the 2nd floor of the Main Library. It has a small gold Fossil logo emblem on the bottom corner, a light scuff mark on the back, and a Star Wars sticker tucked inside the clear ID window.",
            "category": "wallet",
            "color": "black",
            "brand": "Fossil",
            "location": "Main Library 2nd Floor",
            "date": "2026-11-12",
            "filename": "lost_wallet_fossil.jpg",
            "reporter_name": "arjun@univ.edu",
            "created_at": "2026-11-12T10:15:00+00:00",
        },
        {
            "id": "lost-wallet-herschel",
            "type": "lost",
            "title": "Black Canvas Herschel Cardholder Wallet",
            "description": "Misplaced my slim black canvas Herschel cardholder while grabbing coffee at the Student Union Cafe. It has a wrap-around brass zipper and Herschel's signature red-and-white striped fabric tab inside.",
            "category": "wallet",
            "color": "black",
            "brand": "Herschel",
            "location": "Student Union Cafe",
            "date": "2026-11-12",
            "filename": "lost_wallet_herschel.jpg",
            "reporter_name": "priya@univ.edu",
            "created_at": "2026-11-12T11:30:00+00:00",
        },
        {
            "id": "lost-bottle-hydro",
            "type": "lost",
            "title": "Blue 32oz Hydro Flask Water Bottle",
            "description": "Forgot my cobalt blue 32oz Hydro Flask near the benches in the Campus Gym locker room after evening practice. It has a black flex-strap cap, a small dent near the bottom rim, and a yellow smiley sticker on the side.",
            "category": "bottle",
            "color": "blue",
            "brand": "Hydro Flask",
            "location": "Campus Gym Locker Room",
            "date": "2026-11-11",
            "filename": "lost_bottle_hydro.jpg",
            "reporter_name": "rohan@univ.edu",
            "created_at": "2026-11-11T16:00:00+00:00",
        },
        {
            "id": "lost-bottle-stanley",
            "type": "lost",
            "title": "Blue Insulated Stanley Water Bottle",
            "description": "Left my navy blue insulated Stanley bottle on the lab bench in Science Building Lab 3. It has a black screw-top lid and a round red mountain badge sticker on the front.",
            "category": "bottle",
            "color": "blue",
            "brand": "Stanley",
            "location": "Science Building Lab 3",
            "date": "2026-11-12",
            "filename": "lost_bottle_stanley.jpg",
            "reporter_name": "meera@univ.edu",
            "created_at": "2026-11-12T14:00:00+00:00",
        },
        {
            "id": "lost-backpack-northface",
            "type": "lost",
            "title": "Black North Face Borealis Backpack",
            "description": "Accidentally left my charcoal-black North Face Borealis backpack under the third-row desk in Engineering Hall Room 204. Has the front elastic bungee cord, a red reflective triangle patch, and a small silver compass keychain on the side zipper.",
            "category": "backpack",
            "color": "black",
            "brand": "The North Face",
            "location": "Engineering Hall Room 204",
            "date": "2026-11-12",
            "filename": "lost_backpack_northface.jpg",
            "reporter_name": "kabir@univ.edu",
            "created_at": "2026-11-12T15:20:00+00:00",
        },
        {
            "id": "lost-laptop-macbook",
            "type": "lost",
            "title": "Silver 14-inch Apple MacBook Pro",
            "description": "Left my silver 14-inch MacBook Pro at a quiet study cubicle in the Main Library Reading Room. There is a round blue NASA meatball logo sticker on the top-left corner of the aluminum lid.",
            "category": "electronics",
            "color": "silver",
            "brand": "Apple",
            "location": "Main Library Reading Room",
            "date": "2026-11-12",
            "filename": "lost_laptop_macbook.jpg",
            "reporter_name": "ananya@univ.edu",
            "created_at": "2026-11-12T17:10:00+00:00",
        },
        # --- FOUND ITEMS ---
        {
            "id": "found-wallet-fossil",
            "type": "found",
            "title": "Found Black Leather Fossil Wallet",
            "description": "Turned in at the Main Library 2nd Floor circulation desk. Smooth black leather bifold wallet with a gold Fossil emblem on the corner and a slight scratch on the back.",
            "category": "wallet",
            "color": "black",
            "brand": "Fossil",
            "location": "Main Library 2nd Floor Desk",
            "date": "2026-11-13",
            "filename": "found_wallet_fossil.jpg",
            "verification_question": "What sticker is inside the clear ID window?",
            "verification_answer": "Star Wars",
            "reporter_name": "library_staff@univ.edu",
            "created_at": "2026-11-13T08:30:00+00:00",
        },
        {
            "id": "found-wallet-herschel",
            "type": "found",
            "title": "Found Black Canvas Zipper Wallet",
            "description": "Found on a corner booth table at the Student Union Cafe. Black canvas Herschel cardholder wallet with an exposed brass zipper and red striped interior fabric.",
            "category": "wallet",
            "color": "black",
            "brand": "Herschel",
            "location": "Student Union Cafe",
            "date": "2026-11-13",
            "filename": "found_wallet_herschel.jpg",
            "verification_question": "What color is the striped fabric tab inside the pocket?",
            "verification_answer": "red and white",
            "reporter_name": "cafe_barista@univ.edu",
            "created_at": "2026-11-13T09:00:00+00:00",
        },
        {
            "id": "found-bottle-hydro",
            "type": "found",
            "title": "Found Blue Hydro Flask Water Bottle",
            "description": "Found by the locker room benches in the Campus Gym and held at the front desk. Blue metal Hydro Flask with a yellow smiley sticker on the side and a small dent near the base.",
            "category": "bottle",
            "color": "blue",
            "brand": "Hydro Flask",
            "location": "Campus Gym Front Desk",
            "date": "2026-11-12",
            "filename": "found_bottle_hydro.jpg",
            "verification_question": "What design is on the yellow sticker on the side?",
            "verification_answer": "smiley",
            "reporter_name": "gym_attendant@univ.edu",
            "created_at": "2026-11-12T18:00:00+00:00",
        },
        {
            "id": "found-bottle-stanley",
            "type": "found",
            "title": "Found Blue Insulated Water Bottle",
            "description": "Found outside Lab 3 in the Science Building hallway. Blue metal Stanley bottle with a red mountain badge sticker on the front and a black screw-top lid.",
            "category": "bottle",
            "color": "blue",
            "brand": "Stanley",
            "location": "Science Building Hallway",
            "date": "2026-11-13",
            "filename": "found_bottle_stanley.jpg",
            "verification_question": "What picture is on the red sticker on the front?",
            "verification_answer": "mountain",
            "reporter_name": "lab_ta@univ.edu",
            "created_at": "2026-11-13T09:45:00+00:00",
        },
        {
            "id": "found-backpack-northface",
            "type": "found",
            "title": "Found Black North Face Backpack",
            "description": "Found after lecture in Engineering Hall Room 204. Charcoal-black North Face backpack with front bungee strap, red reflective triangle patch, and a silver keychain on the zipper.",
            "category": "backpack",
            "color": "black",
            "brand": "The North Face",
            "location": "Engineering Hall Room 204",
            "date": "2026-11-13",
            "filename": "found_backpack_northface.jpg",
            "verification_question": "What shape is the silver keychain attached to the side zipper?",
            "verification_answer": "compass",
            "reporter_name": "prof_sharma@univ.edu",
            "created_at": "2026-11-13T10:00:00+00:00",
        },
        {
            "id": "found-backpack-jansport",
            "type": "found",
            "title": "Found Black JanSport Backpack",
            "description": "Found on a bench on the Main Quad. Classic black JanSport daypack with a tan suede leather bottom panel and no external stickers.",
            "category": "backpack",
            "color": "black",
            "brand": "JanSport",
            "location": "Main Quad Bench",
            "date": "2026-11-13",
            "filename": "found_backpack_jansport.jpg",
            "verification_question": "What color notebook is inside the main compartment?",
            "verification_answer": "green",
            "reporter_name": "campus_security@univ.edu",
            "created_at": "2026-11-13T10:15:00+00:00",
        },
        {
            "id": "found-laptop-macbook",
            "type": "found",
            "title": "Found Silver Apple MacBook Pro",
            "description": "Turned in to the Main Library Circulation Desk. Silver 14-inch Apple MacBook Pro with a round blue NASA logo sticker on the top corner of the lid.",
            "category": "electronics",
            "color": "silver",
            "brand": "Apple",
            "location": "Main Library Circulation Desk",
            "date": "2026-11-13",
            "filename": "found_laptop_macbook.jpg",
            "verification_question": "What space agency logo sticker is on the top lid?",
            "verification_answer": "NASA",
            "reporter_name": "library_staff@univ.edu",
            "created_at": "2026-11-13T10:30:00+00:00",
        },
        {
            "id": "found-laptop-dell",
            "type": "found",
            "title": "Found Silver Dell XPS 13 Laptop",
            "description": "Found on a lounge table in the Engineering Hall Lobby. Silver brushed-aluminum Dell XPS laptop with a clean lid and no stickers.",
            "category": "electronics",
            "color": "silver",
            "brand": "Dell",
            "location": "Engineering Hall Lobby",
            "date": "2026-11-13",
            "filename": "found_laptop_dell.jpg",
            "verification_question": "What color is the protective sleeve it was inside?",
            "verification_answer": "navy blue",
            "reporter_name": "it_helpdesk@univ.edu",
            "created_at": "2026-11-13T10:45:00+00:00",
        },
    ]

    inserted_items: list[dict[str, Any]] = []
    base = base_url.rstrip("/")
    for spec in items_spec:
        img_path = uploads / spec["filename"]
        emb = matching.embed_image(img_path)
        row = {
            "id": spec["id"],
            "type": spec["type"],
            "title": spec["title"],
            "description": spec["description"],
            "category": spec["category"],
            "color": spec["color"],
            "brand": spec["brand"],
            "location": spec["location"],
            "date": spec["date"],
            "image_url": f"{base}/uploads/{spec['filename']}",
            "embedding": emb,
            "verification_question": spec.get("verification_question", ""),
            "verification_answer": spec.get("verification_answer", ""),
            "status": "open",
            "reporter_name": spec["reporter_name"],
            "created_at": spec["created_at"],
        }
        inserted = db.insert_item(row)
        inserted_items.append(inserted)

    # Trigger match notifications for found items so notifications endpoint has realistic demo data
    for item in inserted_items:
        if item["type"] == "found":
            matches = matching.find_matches(item, top_k=5)
            notify.notify_if_top_match(item, matches)

    return inserted_items


if __name__ == "__main__":
    seeded = seed_demo_data()
    print(f"Seeded {len(seeded)} items into {db.DB_PATH} and generated images in {db.UPLOADS_DIR}")
    for it in seeded:
        print(f"  - [{it['type'].upper():5s}] {it['id']:26s} | {it['title']} ({it['location']})")
