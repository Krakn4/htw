# Findly – Smart Campus Lost & Found Portal
**Role:** Member 4 – UI/UX and Frontend Design (B.Tech Hackathon Project)

Findly is an AI-powered lost and found web portal tailored for university campuses. It replaces chaotic campus noticeboards and WhatsApp groups with automated visual feature matching (colors, silhouettes, logos) and secure ownership verification.

---

## 🚀 Quick Start

### Option 1: Instant Zero-Setup Preview (Recommended for quick testing)
Simply double-click or open `preview.html` in your browser (Chrome, Edge, Firefox). All 5 pages, live filters, modals, and AI match simulation run instantly with zero dependencies!

### Option 2: Full React + Vite Development Server
```bash
# Navigate to the project directory
cd findly

# Install dependencies (Node 18+)
npm install

# Start Vite live-reload dev server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 📁 Project Architecture & Components

```
findly/
│
├── public/                     # Static assets
│   └── images/
│
├── src/
│   ├── assets/                 # SVGs and logos
│   │
│   ├── components/
│   │   ├── Navbar.jsx          # Brand logo, page navigation, unread bell, user chip
│   │   ├── Sidebar.jsx         # Dashboard tab navigation & campus security badge
│   │   ├── ItemCard.jsx        # Lost/Found cards with status badges and AI tags
│   │   ├── SearchBar.jsx       # Real-time search query & category/type pills
│   │   ├── UploadImage.jsx     # Drag-and-drop file upload with sample presets
│   │   ├── Notification.jsx    # Slide-over notification drawer
│   │   ├── ItemDetailModal.jsx # Detailed modal with privacy safety protections
│   │   └── ClaimModal.jsx      # Anti-fraud verification prompt before claiming
│   │
│   ├── pages/
│   │   ├── Home.jsx            # Page 1: Hero, search bar, recent cards, how it works
│   │   ├── Dashboard.jsx       # Page 2: Student stats, active reports, match alert banner
│   │   ├── ReportLost.jsx      # Page 3A: Missing item form with photo & secret detail
│   │   ├── ReportFound.jsx     # Page 3B: Found item form with custody location picker
│   │   ├── BrowseItems.jsx     # Page 4: Filterable campus directory with search pills
│   │   └── MatchResults.jsx    # Page 5: Star feature! Side-by-side comparison & 94% AI gauge
│   │
│   ├── services/
│   │   └── api.js              # REST endpoints with automatic high-fidelity mock fallback
│   │
│   ├── styles/
│   │   └── global.css          # Design system: colors, typography, buttons, grid, cards
│   │
│   ├── App.jsx                 # Top-level state orchestrator & modal controller
│   └── main.jsx                # React DOM entrypoint
│
├── index.html                  # Vite application host HTML
├── preview.html                # Standalone instant browser preview
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies and run scripts
```

---

## 🔌 Connecting with Your Teammates (Backend & AI)

All backend communication is centralized in [`src/services/api.js`](file:///C:/Users/DELL%207420/.gemini/antigravity/scratch/findly/src/services/api.js):

| Endpoint | HTTP Method | Frontend Action | Teammate's Responsibility |
|---|---|---|---|
| `/api/items` | `POST` | Submitting Lost / Found report | Stores item metadata & image into database |
| `/api/items` | `GET` | Loading Browse & Dashboard cards | Returns JSON list of campus items |
| `/api/items/:id` | `GET` | Clicking "Details" on an item card | Returns full item info and custody status |
| `/api/matches` | `POST` | Matching newly reported item | Calls teammate's Python/Gemini vision model |
| `/api/notifications` | `GET` | Loading student bell alerts | Returns notifications & match announcements |

> **Pro-Tip for Hackathon:** If your backend teammate is still finishing their database, `api.js` has `USE_MOCK_FALLBACK = true` by default. You can demo the entire working flow right away! When their backend is ready, switch `USE_MOCK_FALLBACK = false` to connect live.

---

## 🏆 Presentation & Pitching Tips for Judges
1. **Highlight the AI Match Results page (`MatchResults.jsx`)**: Show the 94% similarity score and the breakdown (Color 96%, Silhouette 92%, Brand 95%). This proves why Findly is superior to static forms.
2. **Stress Anti-Fraud Verification**: Mention that students cannot steal items by just clicking "Claim" — they must answer a hidden question only the owner knows (e.g., sticker under calculator, keychain detail).
3. **Show Mobile Responsiveness**: Resize the browser window to show that the cards and navigation adapt smoothly to mobile phones.
