# Chandan Gupta — Portfolio

A premium, 3D-interactive developer portfolio built with vanilla HTML, CSS and JavaScript.
No framework, no build step. With [Real-time Chat](#real-time-chat) enabled, it also
includes a production-ready, minimal Node server.

- **Hero** — a live WebGL orb (Three.js) with a particle halo and star field that reacts to the pointer
- **Motion** — GSAP + ScrollTrigger drive the reveals, the split-text headlines and the timeline
- **Sections** — Hero · About · Skills · Projects · Journey · Services · Contact
- **Live Chat** — a docked chat panel that opens when you click the "Let's talk" button in the navbar
- **Details** — custom cursor, glass navbar, full-screen project modal, animated counters, scroll progress bar, loading screen, and a hidden easter egg

Everything you would want to edit lives in **one clearly marked block** at the top of
[`js/main.js`](js/main.js) — see [Configuration](#configuration).

---

## Tech stack

| | |
|---|---|
| Markup / styling | HTML5, CSS3 (custom properties, grid, `clamp()` fluid type) |
| Scripting | Vanilla JavaScript (ES5-compatible syntax, no bundler) |
| 3D | [Three.js](https://threejs.org/) `r159` — hand-written GLSL shader materials |
| Animation | [GSAP](https://gsap.com/) `3.12.5` + ScrollTrigger |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Google Fonts |

All libraries load from a CDN, so there is nothing to install and nothing to compile.

---

## File structure

```
portfolio/
├── index.html              # All markup — semantic sections, no inline styles or scripts
├── css/
│   └── style.css           # Every style, organised by a numbered table of contents
├── js/
│   ├── main.js             # ⚙️ CONFIG + content rendering, nav, cursor, loader, modal, tilt
│   ├── three-scene.js      # WebGL scenes (hero orb + contact torus knot)
│   ├── animations.js       # GSAP timelines and ScrollTrigger reveals
│   └── chat.js             # Live chat widget (opens from navbar)
├── assets/
│   ├── images/
│   │   └── og-cover.png    # Social sharing preview (1200×630)
│   └── icons/
│       ├── favicon.svg
│       ├── favicon-32.png
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── icon-512-maskable.png
│       └── site.webmanifest
├── server/                 # Real-time chat backend (Node.js + Express + WebSocket)
│   ├── src/                # Server source
│   ├── public/admin/       # Admin inbox UI
│   ├── .env                # Your config (gitignored)
│   └── README.md           # Chat setup & deployment guide
└── README.md
```

---

## Quick start

**Option 1 — just open it.** Double-click `index.html`. It works from `file://`; the libraries
come from the CDN, so you need an internet connection on first load.

**Option 2 — run a local server** (recommended, avoids browser `file://` restrictions):

```bash
python -m http.server 5580
```

Then visit `http://localhost:5580`. Any static server works — `npx serve`, `php -S`, the
VS Code Live Server extension, etc.

---

## Configuration

Open [`js/main.js`](js/main.js). The first ~300 lines are a single `portfolioConfig` object
between two banner comments:

```
╔═══════════════════════════════════════════════════════════════════╗
║  ✏️  EDIT EVERYTHING HERE — THIS IS THE ONLY FILE YOU NEED        ║
╚═══════════════════════════════════════════════════════════════════╝
```

Nothing below the closing banner needs to change for normal use.

### Placeholders you must replace

The site ships with **placeholders, not invented data**. Every value written in
`YOUR_SCREAMING_CASE` is a stub. Until you replace one, the link that uses it stays safe:
it renders with a small amber dot, points at `#contact` instead of a dead URL, and shows a
toast naming the exact config key to edit. Nothing 404s and nothing looks broken while you
fill these in.

| Config key | Replace with | Used by |
|---|---|---|
| `email` | your email address (plain, no `mailto:`) | Contact + footer buttons |
| `github` | your GitHub profile URL | Contact, footer, social links |
| `linkedin` | your LinkedIn profile URL | Contact, footer, social links |
| `instagram` | your Instagram profile URL | Contact, footer, social links |
| `resume` | a link to your résumé (PDF or Drive) | Button on the About card |
| `location` | e.g. `"Delhi, India"` | "BASED IN" fact in the hero |
| `projects[].live` | each project's live URL | "Live Demo" button |
| `projects[].repo` | each project's repository URL | "GitHub" button |

Also worth reviewing before you publish:

- **`timeline[].date`** — every date reads `"2021 · PLACEHOLDER"` and similar. Replace the
  years and drop the ` · PLACEHOLDER` suffix.
- **`stats[]`** — `10+ Projects`, `5+ Technologies`, `100% Curiosity`, `∞ Ideas`. Change the
  `value` and `suffix` to whatever is true for you.
- **`index.html`** — the `<title>`, `<meta name="description">` and the Open Graph
  `og:url` / `og:image` tags. Set `og:url` to your real domain once you deploy.

### Editing content

Every list in the config is rendered by JavaScript, so adding or removing an entry is enough —
no HTML to touch.

| What | Where | Notes |
|---|---|---|
| Rotating hero titles | `roles: [...]` | Add or remove freely; the hero reserves height for the longest one automatically |
| Marquee strip | `marquee: [...]` | Any number of phrases |
| About profile card | `traits: [...]` | `icon` is a Font Awesome class |
| Skill groups | `skills: [...]` | The grid re-balances itself; 5 categories are the default |
| Projects | `projects: [...]` | See below |
| Journey timeline | `timeline: [...]` | Renders top-to-bottom in array order |
| Services | `services: [...]` | Three cards by default |
| Footer links | `footerNav: [...]` | |

**Projects** carry the most fields. Each one drives both the card and the modal:

```js
{
  title: "VibeFlow",
  category: "Music Player",
  glyph: "VF",                                 // 2 letters for the generated artwork
  colors: ["rgba(34,211,238,0.55)", "rgba(77,124,254,0.45)"],
  image: "",                                   // optional; see note below
  description: "...",                          // shown on the card
  tech: ["HTML", "CSS", "JavaScript"],         // tag chips
  live: "YOUR_PROJECT_URL",
  repo: "YOUR_GITHUB_REPO_URL",
  liveLabel: "Live Demo",                      // button text
  features: ["...", "..."],                    // modal bullet list
  challenges: "...",                           // modal paragraph
  solution: "..."                              // modal paragraph
}
```

Project artwork is **generated in the browser** from `colors` and `glyph`, so the site never
depends on an image file that might be missing. Set `image` to a path or URL to use your own
screenshot instead — and if that image fails to load, the generated artwork is restored
automatically.

### Tuning

```js
options: {
  rotateInterval: 2800,     // ms between hero role changes
  easterEggClicks: 5,       // logo clicks needed for the hidden animation
  enable3D: true,           // master switch for both WebGL scenes
  enable3DOnMobile: true,   // lighter scene on phones; false disables it there
  maxPixelRatio: 2          // caps renderer resolution on retina screens
}
```

### Colors and type

Design tokens are CSS custom properties at the top of [`css/style.css`](css/style.css) under
`01. DESIGN TOKENS`:

```css
:root {
  --bg: #050505;                          /* page background */
  --bg-2: #0b0b0f;                        /* secondary surface */
  --card: rgba(255, 255, 255, 0.05);      /* glass fill */
  --border: rgba(255, 255, 255, 0.1);     /* glass edge */
  --text: #ffffff;
  --muted: #a1a1aa;                       /* secondary text */
  --cyan: #22d3ee;
  --blue: #4d7cfe;
  --purple: #a855f7;
}
```

Change a value there and it propagates everywhere, including the gradients. The 3D scene
keeps its own copy of the accent colors in the `COLORS` object at the top of
[`js/three-scene.js`](js/three-scene.js) — update both if you re-brand.

---

## Replacing the assets

The favicons, PWA icons and social preview in `assets/` are simple generated placeholders in
the site's own colors. Swap them for your own whenever you like — keep the filenames and
nothing else needs to change:

| File | Size | Purpose |
|---|---|---|
| `assets/images/og-cover.png` | 1200×630 | Link preview on social platforms |
| `assets/icons/favicon.svg` | vector | Modern browser tab icon |
| `assets/icons/favicon-32.png` | 32×32 | Fallback tab icon |
| `assets/icons/apple-touch-icon.png` | 180×180 | iOS home screen |
| `assets/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | as named | `site.webmanifest` |

---

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and one `h1`
- Full keyboard navigation, a skip link, and visible focus rings on every interactive element
- The project modal traps focus, closes on `Escape`, locks background scroll and restores
  focus to the card that opened it
- `aria-expanded` / `aria-controls` on the mobile menu; the rotating hero title exposes one
  stable accessible name instead of flickering
- Decorative canvases are `aria-hidden`
- **`prefers-reduced-motion: reduce`** is fully respected: scroll animations are replaced by
  an instant reveal, counters jump to their final values, the title rotator and marquee stop,
  the custom cursor is disabled, and the WebGL scene drops to a near-static frame at a capped
  frame rate
- Text contrast is kept above the WCAG AA threshold; a veil sits between the 3D scene and the
  hero copy so the orb never competes with the text

---

## Performance

- Device-tier detection (`low` / `mid` / `high`) scales particle counts, geometry detail and
  the frame-rate cap
- Renderer pixel ratio is capped (default `2`) so retina screens don't render 4× the pixels
- Both WebGL scenes render only while on screen (`IntersectionObserver`) and pause entirely
  when the tab is backgrounded
- Resize handling is debounced; WebGL context loss is caught and recovered instead of throwing
- Scroll work is batched into `requestAnimationFrame`
- Images use `loading="lazy"` and `decoding="async"`; project artwork is generated locally, so
  the layout never depends on a remote image

### Graceful degradation

The page is built to survive its own dependencies failing:

- **No JavaScript** — a `<noscript>` stylesheet forces every section visible
- **No GSAP** — an `IntersectionObserver` + CSS-transition fallback handles the reveals
- **No WebGL / no Three.js** — the canvases stay hidden and the gradient background carries
  the hero
- **A thrown error during boot** — every section is force-revealed rather than left invisible

---

## Browser support

Current Chrome, Edge, Firefox and Safari on desktop, iOS and Android. Layout is verified at
**1440 / 1200 / 992 / 768 / 576 / 400 px**, with a genuinely different mobile layout rather
than a squeezed desktop one: the orb moves behind the copy, buttons go full-width, the
timeline collapses to a single left rail, and the nav becomes a slide-down panel.

> **Note on the Three.js version.** The project pins `r159`, the last release that ships a
> UMD build exposing a global `THREE`. That is what lets `index.html` run straight from
> `file://`, where ES modules are blocked by CORS. The trade-off is no `examples/js` add-ons
> (no `OrbitControls`, no post-processing), so the bloom is faked with additive fresnel shells
> — which is cheaper anyway. The console shows one deprecation warning from Three.js about
> this; it is expected and harmless.

---

## Deployment

The folder is already a static site — no build command, no output directory.

**Netlify** — drag the folder onto the Netlify dashboard, or connect the repo and leave the
build command empty with the publish directory set to `/`.

**Vercel** — `vercel` in the project root and accept the defaults (framework: *Other*).

**GitHub Pages** — push to a repository, then in **Settings → Pages** choose the branch and
the `/ (root)` folder.

After deploying, update `og:url` in `index.html` to the live URL so link previews resolve
correctly.

---

## Real-time Chat

The portfolio includes an optional live-chat widget so visitors can open a conversation from
the "Let's talk" button in the navbar. It needs a small Node.js server — the code lives in
the `server/` folder.

### Quick start (local development)

```bash
cd server
npm install
npm start
```

The server starts on **http://localhost:8787**. The chat widget auto-detects this URL, so you
do not need to edit any config for local testing.

- **Visitor API** — `GET /api/chat/config`, `POST /api/chat/session`, `POST /api/chat/message`,
  `GET /api/chat/messages`, `WS /ws?role=visitor`
- **Admin inbox** — visit **http://localhost:8787/admin** and sign in with the password from
  `server/.env` (`ADMIN_PASSWORD`)

### Production deployment

1.  **Set the server URL in the widget.** Open [`js/main.js`](js/main.js) and change

    ```js
    chat: { serverUrl: "YOUR_CHAT_SERVER_URL", ... }
    ```

    to your deployed server origin, e.g. `https://chandan-chat.onrender.com`. If your site and
    chat share the same domain, use an empty string `""`.

2.  **Deploy the server.** Any host that supports WebSockets works (Render, Railway, Fly.io,
    a VPS). **Vercel/Netlify serverless functions do not support WebSockets** — deploy the
    server as a long-running Node process, not as a serverless function.

3.  **Configure secrets.** Copy `server/.env.example` to `server/.env` and set:

    - `ADMIN_PASSWORD` — at least 10 characters
    - `SESSION_SECRET` — a random 64-hex string (`openssl rand -hex 32`)
    - `PORT` — usually 8080 or as your host requires

4.  **Storage (optional).** By default, conversations are stored in JSON files under
    `server/data/`. To use MongoDB instead, set `MONGODB_URI` in `.env` — the server switches
    drivers automatically.

### How it works

- **First open:** the panel shows a short intro form (name + optional email/message). On submit
  it calls `POST /api/chat/session` and receives a one-time token.
- **Persistence:** the token and conversation ID are saved to `localStorage` under
  `cg_chat_v1`. Reloading the page restores the thread via `POST /api/chat/resume`.
- **Transport:** the widget prefers a WebSocket (`/ws?role=visitor`). If the upgrade fails
  (corporate proxies, captive networks), it silently falls back to REST polling.
- **Admin side:** the inbox at `/admin` shows all conversations, their online status, typing
  indicators, and unread counts. Replies are pushed to the visitor instantly.

### Files

```
server/
├── src/
│   ├── server.js          # Express app + WebSocket attach
│   ├── config.js          # env parsing, defaults
│   ├── auth.js            # HMAC-signed admin tokens, cookies, password check
│   ├── util.js            # rate limiter, cleaners, helpers
│   ├── hub.js             # tracks sockets, broadcasts
│   ├── notify.js          # optional webhook for new messages
│   ├── ws.js              # WebSocket frame handler
│   ├── routes/
│   │   ├── chat.js        # visitor REST API
│   │   └── admin.js       # admin REST API
│   └── store/
│       ├── index.js       # unified driver (file or mongo)
│       ├── file.js        # JSON-file persistence
│       ├── mongo.js       # MongoDB persistence
│       └── shape.js       # data shapes & serializers
├── public/
│   └── admin/
│       ├── index.html     # admin inbox UI
│       ├── admin.js       # inbox client
│       └── admin.css
├── .env.example           # documented template
├── .env                   # your actual config (gitignored)
├── package.json
└── README.md              # detailed setup & deployment guide
```

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Chat panel shows "Chat is offline" | `serverUrl` is still `YOUR_CHAT_SERVER_URL` or the server is not running |
| Visitor messages never arrive | WebSocket blocked; the widget should fall back to REST — check browser console |
| Admin cannot log in | `ADMIN_PASSWORD` mismatch or too short (<10 chars) |
| Sessions lost on restart | `SESSION_SECRET` not set; a random one is generated per boot |

For the full protocol spec, rate limits, and deployment notes, see
[`server/README.md`](server/README.md).

---

## Credits

Designed & built by **Chandan Gupta**.

Third-party: [Three.js](https://threejs.org/), [GSAP](https://gsap.com/),
[Font Awesome](https://fontawesome.com/), [Google Fonts](https://fonts.google.com/).
