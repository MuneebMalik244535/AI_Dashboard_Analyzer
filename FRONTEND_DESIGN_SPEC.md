# 🎨 NeuralDash — Frontend Design Specification
### Stack: Next.js 14 · React 18 · Tailwind CSS · Framer Motion · GSAP · Plotly.js

---

## 📌 Backend Functionality (What the API Does)

Backend has these real API endpoints — **frontend must map each one to a UI interaction:**

| Endpoint | What it does | Returns |
|---|---|---|
| `POST /upload` | Accept a CSV (up to 16MB) | `session_id`, `filename`, column names, shape |
| `POST /chat` | User asks a question, agents analyze | Charts (Plotly JSON), insights, narrative text, follow-up questions, confidence score |
| `GET /insights/{session_id}` | Auto-generate insights on upload | Same as `/chat` response |
| `GET /agents/status` | Are all 4 agents online? | `{planner: "Active", ...}` |
| `GET /data/summary/{session_id}` | Dataset statistics | Row count, column types, null values |
| `DELETE /sessions/{session_id}` | Remove a session | Success message |
| `GET /health` | Health check | Status + timestamp |

**4 AI Agents (no OpenAI — pure Python ML):**
1. **Planner Agent** → reads query, decides analysis type, extracts column names
2. **Data Worker Agent** → runs pandas: stats, regression, correlations, outliers (IQR + Z-score + DBSCAN)
3. **Chart Agent** → builds Plotly charts (line, bar, scatter, heatmap, histogram, box, pie)
4. **Explainer Agent** → writes plain-English narrative, key findings, recommendations

---

## 🖥️ Pages to Build

- **Page 1:** Landing Page — `/` (marketing + showcase)
- **Page 2:** Dashboard — `/dashboard` (the actual app)

---

## 🌐 Page 1: Landing Page `/`

### 1.1 — Navbar (Sticky, Glassmorphism)

**Visual:**
- Frosted glass: `rgba(3,7,18,0.75)` + `backdrop-filter: blur(20px)`
- Logo left: animated Brain icon + "Neural**Dash**" (violet gradient on Dash)
- Links: Home · Features · How It Works · **[Dashboard]** (violet button with ⚡)
- Right: `⚡ 4 Agents Active 🟢` pill badge + mobile hamburger

**Framer Motion entrance:**
```js
initial: { y: -100, opacity: 0 }
animate: { y: 0, opacity: 1 }
transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
```
- Logo `whileHover` → rotates 360° in 0.6s
- On scroll > 20px → border + deeper blur appears

---

### 1.2 — Hero Section

**Visual:**
- Full screen (`min-h-screen`), dark `#030712`
- 3 large blurred floating orbs (violet, cyan, emerald) — drift slowly
- Very faint grid pattern overlay
- Headline: `Turn Any CSV Into a **Talking Analyst**`
- "Talking Analyst" = violet-to-cyan gradient text
- Subtext + 2 CTA buttons + stats bar at bottom

**GSAP — headline word stagger (on mount):**
```js
gsap.fromTo(".word",
  { opacity: 0, y: 60, rotateX: -30 },
  { opacity: 1, y: 0, rotateX: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", delay: 0.3 }
)
```

**GSAP — orbs follow mouse:**
```js
window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / innerWidth - 0.5) * 30;
  const y = (e.clientY / innerHeight - 0.5) * 30;
  gsap.to(orb1, { x: x * 1.2, y: y * 0.8, duration: 2, ease: "power1.out" });
  gsap.to(orb2, { x: -x * 0.8, y: -y * 1.2, duration: 2.5 });
});
```

**Stats bar — 4 cards (Framer Motion stagger):**
- `10K+ Queries` · `50K+ Charts` · `8 hrs Saved/Week` · `5K+ Files Analyzed`

---

### 1.3 — Feature Carousel

**Visual:**
- Section title: "Powerful Features, **Zero Complexity**"
- Desktop: 3 cards visible (center = full, sides = 60% opacity + smaller)
- Mobile: 1 card + swipe
- Auto-plays every 3.5s, pauses on hover
- Dot indicators — active dot = wider colored pill

**6 Feature Cards (mapped to backend):**

| Card | Backend Maps To |
|---|---|
| ⬆ Drag & Drop Upload | `POST /upload` |
| 💬 Natural Language Chat | `POST /chat` |
| 📊 AI-Powered Charts | Chart Agent output |
| 🧠 Multi-Agent Pipeline | All 4 agents |
| 📈 Smart Insights | Data Worker stats |
| 📄 Plain-English Reports | Explainer Agent narrative |

**Framer Motion direction-aware slide:**
```js
variants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.95 })
}
transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
```

---

### 1.4 — How It Works (Agent Pipeline Visualization)

**Visual:**
- Title: "4 Agents, **One Answer**"
- Steps alternate left-right (zigzag) on desktop
- Vertical connecting line in center — fills gradient as user scrolls
- Each step = glass card with icon + agent name + title + description

**4 Steps:**
1. 🧠 **Planner Agent** (Violet) — "Breaks your question into structured steps, detects analysis type, extracts column names"
2. 💾 **Data Worker Agent** (Cyan) — "Runs pandas: regression, correlations, outlier detection (IQR + DBSCAN), groupBy operations"
3. 📊 **Chart Agent** (Emerald) — "Picks best chart type and renders interactive Plotly visualization"
4. 📖 **Explainer Agent** (Amber) — "Writes narrative, extracts findings, gives recommendations + 3 follow-up questions"

**GSAP scroll-triggered line:**
```js
gsap.fromTo(lineRef,
  { scaleY: 0, transformOrigin: "top center" },
  { scaleY: 1, scrollTrigger: { scrub: 0.5, start: "top 60%", end: "bottom 40%" } }
)
```

**Framer Motion card entrance:**
```js
initial: { opacity: 0, x: isRight ? 40 : -40 }
whileInView: { opacity: 1, x: 0 }
viewport: { once: true, margin: "-80px" }
transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
```

---

## 🖥️ Page 2: Dashboard `/dashboard`

**Layout: Fixed full screen, no body scroll**

```
┌────────────────────────────────────────────┐
│  TOPBAR  (56px — glassmorphism)            │
├──────────────┬─────────────────────────────┤
│              │  TABS: Chat | Charts | Insights │
│  SIDEBAR     ├─────────────────────────────┤
│  (280px)     │                             │
│              │   CONTENT AREA              │
│  A) Upload   │   (switches per tab)        │
│  B) Sessions │                             │
│  C) Stats    │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
```

---

### 2.1 — Top Navbar (Dashboard)

- Glassmorphism `h-14`
- Left: logo → links back to `/`
- Right: `Agents Online 🟢` + sidebar collapse button
- Animation: slides in from top on mount

---

### 2.2 — Sidebar (Collapsible)

**Desktop:** `280px`, slides in/out with Framer Motion width animation
**Mobile:** Full overlay drawer from left + dark backdrop

#### A) File Upload Zone
**Maps to `POST /upload`**
- Dashed border drop zone
- Idle state: Upload icon + "Drag & drop CSV" + example tag pills
- **On drag enter:** border glows violet, violet background tint, icon tilts 5°
- **While uploading:** spinner + animated shimmer progress bar
- **Success:** green card with filename + pulsing dot

**Framer Motion drag animation:**
```js
animate={{
  borderColor: isDrag ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.08)",
  boxShadow: isDrag ? "0 0 40px rgba(124,58,237,0.2)" : "none",
  scale: isDrag ? 1.01 : 1,
}}
```

#### B) Session List
**Maps to sessions object (in-memory on backend)**
- Collapsible list with ChevronDown animation
- Each item: file icon + filename + upload time + hover-reveal trash button
- Active session: violet border + violet icon
- Stagger animation on list items

#### C) Dataset Stats
**Maps to `POST /upload` → `info.shape`**
- Rows (violet) + Columns (cyan) in large mono font
- Appears with fade-in after upload

---

### 2.3 — Tab Bar (Chat | Charts | Insights)

- 3 tabs with icon + label
- Charts tab shows count badge when charts available
- **Active:** violet background + border + text
- **Switching animation:**
```js
// AnimatePresence required for exit
initial: { opacity: 0, x: 20 }
animate: { opacity: 1, x: 0 }
exit: { opacity: 0, x: -20 }
transition: { duration: 0.25 }
```

---

### 2.4 — Chat Tab
**Maps to `POST /chat`**

**Message Bubbles:**
- User: right-aligned, violet tinted, `rounded-tr-sm`
- AI: left-aligned, dark glass, Brain avatar, `rounded-tl-sm`
- Loading: 3 bouncing dots

**Framer Motion per message:**
```js
hidden: { opacity: 0, y: 16, scale: 0.97 }
visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } }
```

**Below each AI message:**
1. **Confidence bar** → `confidence_score * 100%` animated fill
2. **Key Findings** → `final_response.insights.key_findings` (cyan dots)
3. **Follow-up chips** → `followup_questions` (clickable, auto-fills input)

**Agent Pipeline Tracker** (shows while loading):
- 4 mini step cards inline
- Active: spinner + colored bg
- Done: green checkmark
- Connectors turn green as steps complete
- Disappears after response arrives (`AnimatePresence` height collapse)

**Empty state:**
- Sparkles icon + 4 example question buttons in 2×2 grid
- Each button: glass pill, hover = violet border, click = fills input

**Input bar:**
- Disabled when no session (`opacity-50`, cursor `not-allowed`)
- Send button: violet circle with arrow, `whileHover scale(1.05)`, `whileTap scale(0.95)`
- Auto-scrolls to bottom on new message

---

### 2.5 — Charts Tab
**Maps to `final_response.charts` from `POST /chat`**

**Dark Plotly theme:**
```js
layout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(13,17,23,0.3)",
  font: { color: "#94a3b8", family: "Inter" },
  gridcolor: "rgba(255,255,255,0.04)",
}
// Lines/bars: violet #7c3aed
// Gradient: violet → cyan → emerald
```

**Interactions:**
- Hover chart → fullscreen button appears (top-right)
- Click → `AnimatePresence` modal slides in with `scale(0.9)` → `scale(1)`
- Multiple charts → tab pills at top to switch

**Empty state:** BarChart3 icon + "Charts appear after analysis"

---

### 2.6 — Insights Tab

**4 Staggered Glass Cards:**

| Card | Color | Maps to |
|---|---|---|
| Dataset Overview | Violet | `info.shape` + `info.columns` from upload |
| Key Findings | Cyan | `final_response.insights.key_findings` |
| Recommendations | Emerald | `final_response.insights.recommendations` |
| Data Quality | Amber | `final_response.insights.data_quality` |

**Stagger animation:**
```js
variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
}
```

---

## 🎨 Design System

### Colors
```
Background:  #030712   (deep space)
Surface:     #0d1117   (card)
Surface-2:   #161b22   (elevated)
Violet:      #7c3aed   (primary)
Cyan:        #22d3ee   (secondary)
Emerald:     #34d399   (success)
Amber:       #fbbf24   (warning)
Rose:        #fb7185   (error)
Text:        #f1f5f9 / #94a3b8 / #475569
```

### Fonts
```
Inter         → Body text, UI labels
Space Grotesk → Headings, numbers, display
JetBrains Mono → Metrics, code, badges
```

### Reusable CSS Classes
```css
.glass        → dark glass card (blur + border)
.glass-light  → lighter version for overlays
.gradient-text-violet → violet-to-cyan gradient text
.glow-violet  → violet box-shadow glow
.glow-cyan    → cyan box-shadow glow
```

---

## ⚡ When to Use GSAP vs Framer Motion

| GSAP | Framer Motion |
|---|---|
| Hero headline word stagger | Page/tab transitions |
| Mouse-tracking orb parallax | Message bubble entrances |
| Scroll-triggered line fill | Modal open/close |
| SVG path drawing | Card hover states |
| One-shot mount animations | Component interactions |

---

## 🔌 Frontend ↔ Backend Flow

```
User drags CSV
   → FileUpload → POST /api/upload
   → session_id saved in React state
   → Auto-call GET /api/insights/{id} → populate Charts + Insights tabs

User types question
   → ChatInterface → POST /api/chat { query, session_id }
   → Agent pipeline tracker shows live steps
   → Response → render bubble + charts + findings + follow-up chips

User clicks follow-up chip
   → auto-fills input → re-submits POST /api/chat

User clicks session in sidebar
   → load that session's data, clear messages
```

**`next.config.ts` proxy:**
```ts
rewrites: [{ source: "/api/:path*", destination: "http://localhost:8000/:path*" }]
```

---

## 🚀 Run Commands

```bash
# Backend (Terminal 1)
cd AI_Data_Dashboard/backend
uvicorn main:app --reload --port 8000

# Frontend (Terminal 2)
cd AI_Data_Dashboard/frontend
npm run dev
# → http://localhost:3000
```
