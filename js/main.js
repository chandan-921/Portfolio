/* =====================================================================
   Chandan Gupta — Portfolio
   js/main.js
   ---------------------------------------------------------------------
   Core application: configuration, content rendering, navigation,
   custom cursor, loader, project modal, 3D tilt, scroll progress.
   Scene code lives in three-scene.js, scroll animation in animations.js.
   ===================================================================== */

/* =====================================================================
   ╔═══════════════════════════════════════════════════════════════════╗
   ║  ✏️  EDIT EVERYTHING HERE — THIS IS THE ONLY FILE YOU NEED        ║
   ║                                                                   ║
   ║  Anything written as YOUR_SOMETHING is a placeholder. Replace it   ║
   ║  with your real value. Until you do, the matching link shows a     ║
   ║  small amber dot and a reminder toast instead of breaking.         ║
   ╚═══════════════════════════════════════════════════════════════════╝
   ===================================================================== */
const portfolioConfig = {
  /* ---------- Identity ---------- */
  name: "Chandan Gupta",
  initials: "CG",
  initialsDot: "CG.",
  role: "Full Stack Developer & Creative Developer",
  greeting: "Hi, I'm Chandan.",
  availability: "AVAILABLE FOR CREATIVE & DEVELOPMENT PROJECTS",
  intro:
    "I build modern web experiences, interactive applications, and creative digital products that combine clean engineering with immersive design.",
  heroTagline: "I create digital experiences where code meets creativity.",

  /* Rotating hero titles — edit / add / remove freely */
  roles: [
    "FULL STACK DEVELOPER",
    "CREATIVE DEVELOPER",
    "PROBLEM SOLVER",
    "TECH ENTHUSIAST"
  ],

  /* Small hero facts */
  focus: "Web & Product Engineering",
  location: "LUCKNOW",
  stackShort: "JS · Node · Mongo",

  /* ---------- Links (placeholders — replace with your own) ---------- */
  email: "chandan916169@gmail.com",
  github: "https://github.com/chandan-921",
  linkedin: "https://www.linkedin.com/in/chandan-gupta-521134378",
  instagram: "https://www.instagram.com/chandan_0485",
  resume: "assets/Resume.pdf",

  /* ---------- Scrolling marquee strip ---------- */
  marquee: [
    "Full Stack Development",
    "Creative Development",
    "Web Applications",
    "Interactive Interfaces",
    "REST APIs",
    "Open to Work"
  ],

  /* ---------- About: animated statistics (numbers are editable) ---------- */
  stats: [
    { value: "10", suffix: "+", label: "Projects" },
    { value: "5", suffix: "+", label: "Technologies" },
    { value: "100", suffix: "%", label: "Curiosity" },
    { value: "∞", suffix: "", label: "Ideas" }
  ],

  /* ---------- About: interactive profile card ---------- */
  traits: [
    { icon: "fa-solid fa-code", title: "Developer", desc: "Ships clean, maintainable, well-structured code." },
    { icon: "fa-solid fa-puzzle-piece", title: "Problem Solver", desc: "Breaks messy requirements into simple systems." },
    { icon: "fa-solid fa-wand-magic-sparkles", title: "Creative Thinker", desc: "Designs interfaces that feel considered." },
    { icon: "fa-solid fa-seedling", title: "Continuous Learner", desc: "Always one project deep into something new." }
  ],

  /* ---------- Skills ---------- */
  skills: [
    {
      category: "Frontend",
      icon: "fa-solid fa-code",
      items: ["HTML", "CSS", "JavaScript", "Bootstrap", "Responsive Design"],
      note: "Semantic markup, modern layout systems, and interfaces that hold their shape on every screen size."
    },
    {
      category: "Backend",
      icon: "fa-solid fa-server",
      items: ["Node.js", "Express.js", "REST APIs"],
      note: "Routing, middleware, authentication flows, and APIs designed to be predictable to consume."
    },
    {
      category: "Database",
      icon: "fa-solid fa-database",
      items: ["MongoDB", "MongoDB Atlas"],
      note: "Schema design, queries, and cloud-hosted clusters wired into production apps."
    },
    {
      category: "Programming",
      icon: "fa-solid fa-microchip",
      items: ["C", "Java", "Python", "JavaScript"],
      note: "Fundamentals first — data structures, logic, and problem solving across languages."
    },
    {
      category: "Tools",
      icon: "fa-solid fa-screwdriver-wrench",
      items: ["Git", "GitHub", "VS Code", "Android Studio"],
      note: "Version control, branching, code review habits, and a workflow that stays out of the way."
    }
  ],

  /* ---------- Projects ----------
     colors : [from, to] used for the generated artwork + hover glow
     image  : optional path/URL. Leave empty to use the generated artwork.
              If set and it fails to load, the artwork shows instead.
     live / repo : replace the placeholders with real URLs             */
  projects: [
    {
      title: "VibeFlow",
      category: "Music Player",
      glyph: "VF",
      colors: ["rgba(34,211,238,0.55)", "rgba(77,124,254,0.45)"],
      image: "",
      description:
        "A modern music streaming interface focused on immersive playback and smooth user interaction.",
      tech: ["HTML", "CSS", "JavaScript", "REST API"],
      live: "https://vibeflow-rose.vercel.app/",
      repo: "https://github.com/chandan-921/VibeFlow",
      liveLabel: "Live Demo",
      features: [
        "Full playback controls with seek, volume, shuffle and repeat",
        "Search backed by a REST music API with debounced requests",
        "Animated now-playing view with artwork and progress states",
        "Queue and playlist handling kept in sync with the player",
        "Responsive layout that works from desktop down to phones"
      ],
      challenges:
        "Audio state lives in one place but is displayed in many — the player bar, the queue, the now-playing view and the track list all have to agree. Naive event wiring quickly turned into duplicated state and UI that drifted out of sync.",
      solution:
        "I centralised playback in a single state object and rendered every view from it, so one update propagates everywhere. API calls are debounced and cached, and the UI animates between states instead of re-rendering from scratch."
    },
{ 
  title: "JARVIS AI",
  category: "AI Chatbot",
  glyph: "JA",
  colors: ["rgba(139,92,246,0.55)", "rgba(59,130,246,0.45)"],
  image: "",
  description:
    "An intelligent AI-powered chatbot designed to provide conversational assistance, answer questions, and help users with study and productivity tasks through a modern interactive interface.",
  tech: ["HTML", "CSS", "JavaScript", "AI API"],
  live: "https://novaai-yfkj.onrender.com/",
  repo: "https://github.com/chandan-921/Jarvis-AI",
  liveLabel: "Live Demo",
  features: [
    "Real-time conversational chat interface with AI-generated responses",
    "Context-aware interaction for natural and continuous conversations",
    "Dedicated tools for generating study plans, quizzes and learning assistance",
    "Preset prompts and quick actions for common AI tasks",
    "Responsive interface designed to work smoothly across desktop and mobile devices"
  ],
  challenges:
    "The main challenge was creating a smooth conversational experience while keeping the interface responsive and preventing unnecessary or duplicate requests. Different chatbot features such as normal conversations, study plans and quiz generation also needed to work consistently without making the UI feel complicated.",
  solution:
    "I built a reusable chat interface around a central message and request flow, allowing different AI features to use the same interaction system. Preset prompts, dynamic responses and loading states were handled through JavaScript, while the responsive UI keeps the experience consistent across different screen sizes."
},
    {
      title: "Expense Tracker",
      category: "Full Stack Web App",
      glyph: "ET",
      colors: ["rgba(77,124,254,0.55)", "rgba(34,211,238,0.4)"],
      image: "",
      description:
        "A responsive expense management application with authentication, dashboard analytics, charts, and database integration.",
      tech: ["HTML", "CSS", "JavaScript", "Node.js", "Express", "MongoDB"],
      live: "YOUR_PROJECT_URL",
      repo: "https://github.com/chandan-921/Expenses-Tracker",
      liveLabel: "Live Demo",
      features: [
        "Account sign-up and login with session-based authentication",
        "Dashboard summarising spend by category and by month",
        "Charts that update as transactions are added or edited",
        "Full CRUD on expenses with server-side validation",
        "MongoDB models designed for fast aggregate queries"
      ],
      challenges:
        "Analytics needed to feel instant while the dataset grew, and money handling leaves no room for rounding mistakes or half-written records.",
      solution:
        "Aggregation happens in MongoDB rather than in JavaScript, so the dashboard reads pre-summarised results. Amounts are stored as integers in the smallest unit, and every write is validated on the server before it reaches the database."
    },
    {
      title: "Canteen Kart",
      category: "Web Application",
      glyph: "CK",
      colors: ["rgba(34,211,238,0.5)", "rgba(168,85,247,0.45)"],
      image: "",
      description:
        "An online canteen ordering interface designed for simple and efficient food ordering.",
      tech: ["HTML", "CSS", "JavaScript"],
      live: "YOUR_PROJECT_URL",
      repo: "YOUR_GITHUB_REPO_URL",
      liveLabel: "Live Demo",
      features: [
        "Browsable menu with categories and live item search",
        "Cart with quantity controls and a running order total",
        "Order summary and confirmation flow before checkout",
        "Cart contents persisted so a refresh never loses an order",
        "Built mobile-first for use while standing in a queue"
      ],
      challenges:
        "The whole point is speed — anything that added taps or made the cart hard to reach defeated the purpose, and there was no backend to fall back on for state.",
      solution:
        "Ordering collapses into a few taps with the cart always one tap away. State lives in a small store mirrored to localStorage, so the app is fast, offline-tolerant and needs no server to demo."
    }
  ],

  /* ---------- Journey / experience (dates are placeholders) ---------- */
  timeline: [
    {
      date: "2024 · PLACEHOLDER",
      title: "Started Coding",
      tag: "Foundation",
      desc: "Wrote my first programs and got hooked on the loop of writing something, running it, and watching it work."
    },
    {
      date: "2025 · PLACEHOLDER",
      title: "Built First Web Projects",
      tag: "Frontend",
      desc: "Moved from tutorials to real pages — layouts, forms, and small sites built from scratch with HTML and CSS."
    },
    {
      date: "2025 · PLACEHOLDER",
      title: "Learned JavaScript Properly",
      tag: "JavaScript",
      desc: "Went past copy-paste snippets into the DOM, events, async behaviour, and how the language actually works."
    },
    {
      date: "2026 · PLACEHOLDER",
      title: "Started Backend Development",
      tag: "Node.js",
      desc: "Picked up Node and Express, built my first REST APIs, and learned how a server thinks about requests."
    },
    {
      date: "2026 · PLACEHOLDER",
      title: "Built Full-Stack Applications",
      tag: "Full Stack",
      desc: "Connected frontend, backend and MongoDB into complete products with authentication and real data."
    },
    {
      date: "2026 · PLACEHOLDER",
      title: "Explored AI and APIs",
      tag: "AI / APIs",
      desc: "Started integrating third-party and AI-backed services, including a FastAPI service behind an Android app."
    },
    {
      date: "2026 · PLACEHOLDER",
      title: "Building Bigger Projects",
      tag: "Now",
      desc: "Focused on larger, more ambitious builds — better architecture, better interfaces, more interactive experiences."
    }
  ],

  /* ---------- Services ---------- */
  services: [
    {
      icon: "fa-solid fa-layer-group",
      title: "Web Development",
      desc: "Modern responsive websites and web applications.",
      list: ["Landing pages & marketing sites", "Component-driven interfaces", "Performance and accessibility passes"]
    },
    {
      icon: "fa-solid fa-server",
      title: "Full Stack Development",
      desc: "Frontend + backend + database solutions.",
      list: ["REST API design and implementation", "Authentication and dashboards", "MongoDB data modelling"]
    },
    {
      icon: "fa-solid fa-wand-magic-sparkles",
      title: "Creative Development",
      desc: "Interactive, animated, and immersive digital experiences.",
      list: ["Scroll-driven storytelling", "WebGL and Three.js scenes", "Micro-interactions and motion design"]
    }
  ],

  /* ---------- Footer navigation ---------- */
  footerNav: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" }
  ],

  /* ---------- Live chat ----------
     The "Let's talk" button in the navbar opens a chat panel. It needs the
     small Node server in the `server/` folder of this project — see
     server/README.md for the five-minute setup.

     serverUrl: the origin your chat server runs on, with no trailing slash.
       • Leave it as YOUR_CHAT_SERVER_URL and the panel still opens, but it
         shows an "email me instead" card rather than a broken chat.
       • On localhost the widget auto-detects a server on port 8787, so you
         can develop without editing this at all.
       • In production use the https:// URL of your deployed server, e.g.
         "https://chandan-chat.onrender.com".
       • If the site and the server share an origin, use "" (empty string). */
  chat: {
    serverUrl: "YOUR_CHAT_SERVER_URL",

    /* Panel copy */
    title: "Chat with Chandan",
    subtitle: "Usually replies within a few hours",
    intro: "Tell me your name and what you're working on — I'll get back to you here.",
    askEmail: true,               // show the optional email field on the intro form
    emailNote: "Optional — so I can reply by email if you close the tab.",
    placeholder: "Write a message…",
    startLabel: "Start chatting",

    /* Shown when the server is unreachable or not configured yet */
    offlineTitle: "Chat is offline",
    offlineText: "The live chat isn't running right now. Email is the fastest way to reach me.",

    /* Small print under the intro form. Set to "" to hide it. */
    privacy: "No account needed. Your name and messages are only visible to me."
  },

  /* ---------- Tuning ---------- */
  options: {
    rotateInterval: 2800,       // ms between hero role changes
    easterEggClicks: 5,         // logo clicks needed for the hidden animation
    enable3D: true,             // master switch for both WebGL scenes
    enable3DOnMobile: true,     // lighter scene on phones; false disables it
    maxPixelRatio: 2            // caps renderer resolution on retina screens
  }
};

/* =====================================================================
   ╔═══════════════════════════════════════════════════════════════════╗
   ║  END OF CONFIGURATION — no need to edit below this line           ║
   ╚═══════════════════════════════════════════════════════════════════╝
   ===================================================================== */

/* Shared namespace: three-scene.js and animations.js hang off this. */
window.Portfolio = window.Portfolio || {};
window.Portfolio.config = portfolioConfig;
window.portfolioConfig = portfolioConfig;

(function () {
  "use strict";

  var CFG = portfolioConfig;
  var OPT = CFG.options;

  /* ===================================================================
     UTILITIES
     =================================================================== */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  var hasGSAP = typeof window.gsap !== "undefined";
  var hasThree = typeof window.THREE !== "undefined";

  var reducedMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointerMQ = window.matchMedia("(hover: hover) and (pointer: fine)");

  function prefersReducedMotion() { return reducedMotionMQ.matches; }
  function isFinePointer() { return finePointerMQ.matches; }
  function isTouch() { return !isFinePointer(); }

  function isMobileViewport() { return window.innerWidth <= 768; }

  /* Rough device capability tier — drives particle counts in three-scene.js */
  function deviceTier() {
    if (prefersReducedMotion()) return "low";
    var cores = navigator.hardwareConcurrency || 4;
    if (window.innerWidth <= 768 || cores <= 4) return "low";
    if (cores <= 8) return "mid";
    return "high";
  }

  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Resolve a dotted path against the config: get("options.rotateInterval") */
  function get(path) {
    return String(path).split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, CFG);
  }

  /* Anything shaped like YOUR_SOMETHING is an unedited placeholder. */
  function isPlaceholder(value) {
    return typeof value !== "string" || value === "" || /^YOUR_[A-Z0-9_]*$/.test(value.trim());
  }

  function toHref(kind, value) {
    if (isPlaceholder(value)) return null;
    var v = value.trim();
    if (kind === "email") {
      if (/^mailto:/i.test(v)) return v;
      return v.indexOf("@") > -1 ? "mailto:" + v : v;
    }
    if (/^(https?:|mailto:|tel:|\/|#|\.)/i.test(v)) return v;
    return "https://" + v;
  }

  /* Swap the alpha channel of an rgba()/rgb() string. */
  function withAlpha(color, alpha) {
    var m = /rgba?\(([^)]+)\)/i.exec(color || "");
    if (!m) return color;
    var parts = m[1].split(",").map(function (p) { return p.trim(); });
    return "rgba(" + parts[0] + "," + parts[1] + "," + parts[2] + "," + alpha + ")";
  }

  function raf(fn) { return window.requestAnimationFrame(fn); }

  /* ===================================================================
     TOASTS — used when a placeholder link is clicked
     =================================================================== */
  var toastHost = $("#toasts");
  var toastTimers = [];

  function toast(message, ms) {
    if (!toastHost) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = message;
    toastHost.appendChild(el);
    raf(function () { raf(function () { el.classList.add("is-visible"); }); });

    var t = window.setTimeout(function () {
      el.classList.remove("is-visible");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 400);
    }, ms || 4200);

    toastTimers.push(t);
    /* Never stack more than three at once */
    while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
  }

  function placeholderToast(what) {
    toast(
      'Add your <code>' + esc(what) + '</code> in <code>js/main.js</code> → <code>portfolioConfig</code>.'
    );
  }

  /* ===================================================================
     CONFIG BINDING — [data-config] text + [data-link] hrefs
     =================================================================== */
  function bindConfigText() {
    $$("[data-config]").forEach(function (el) {
      var value = get(el.getAttribute("data-config"));
      if (value !== undefined && value !== null && value !== "") el.textContent = value;
    });
  }

  var LINK_META = {
    email: { key: "email", label: "email address" },
    github: { key: "github", label: "GitHub URL" },
    linkedin: { key: "linkedin", label: "LinkedIn URL" },
    instagram: { key: "instagram", label: "Instagram URL" },
    resume: { key: "resume", label: "résumé URL" }
  };

  /* Applies a config link to an <a>. Unedited placeholders keep a safe
     in-page fallback and explain themselves instead of 404-ing. */
  function applyLink(anchor, kind, rawValue, labelOverride) {
    var meta = LINK_META[kind] || { label: labelOverride || kind };
    var value = rawValue !== undefined ? rawValue : CFG[meta.key || kind];
    var href = toHref(kind, value);

    if (href) {
      anchor.setAttribute("href", href);
      anchor.removeAttribute("data-placeholder");
      if (/^https?:/i.test(href)) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
      return true;
    }

    /* Placeholder path */
    anchor.setAttribute("data-placeholder", "true");
    anchor.setAttribute("title", "Placeholder — set " + (labelOverride || meta.label) + " in js/main.js");
    if (!anchor.getAttribute("href")) anchor.setAttribute("href", "#contact");
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      placeholderToast(typeof value === "string" && value ? value : String(labelOverride || meta.label));
    });
    return false;
  }

  function bindConfigLinks() {
    $$("[data-link]").forEach(function (el) {
      applyLink(el, el.getAttribute("data-link"));
    });
  }

  /* ===================================================================
     CONTENT RENDERING
     =================================================================== */

  /* ---- Marquee ---- */
  function renderMarquee() {
    var track = $("#marquee-track");
    if (!track) return;
    var items = (CFG.marquee || []).map(function (text) {
      return '<span class="marquee__item">' + esc(text) + "</span>";
    }).join("");
    /* Duplicated once so the -50% keyframe loops seamlessly */
    track.innerHTML = items + items;
  }

  /* ---- About: stats ---- */
  function renderStats() {
    var host = $("#stats-grid");
    if (!host) return;
    host.innerHTML = (CFG.stats || []).map(function (s) {
      var numeric = /^-?\d+(\.\d+)?$/.test(String(s.value));
      return (
        '<li class="stat">' +
          '<span class="stat__num"' + (numeric ? ' data-count="' + esc(s.value) + '"' : "") + ">" +
            esc(s.value) + esc(s.suffix || "") +
          "</span>" +
          '<span class="stat__label">' + esc(s.label) + "</span>" +
        "</li>"
      );
    }).join("");
  }

  /* ---- About: traits ---- */
  function renderTraits() {
    var host = $("#traits-list");
    if (!host) return;
    host.innerHTML = (CFG.traits || []).map(function (t) {
      return (
        '<li class="trait">' +
          '<span class="trait__icon"><i class="' + esc(t.icon) + '" aria-hidden="true"></i></span>' +
          '<span class="trait__body">' +
            '<span class="trait__title">' + esc(t.title) + "</span>" +
            '<span class="trait__desc">' + esc(t.desc) + "</span>" +
          "</span>" +
        "</li>"
      );
    }).join("");
  }

  /* ---- Skills ---- */
  function renderSkills() {
    var host = $("#skills-grid");
    if (!host) return;
    host.innerHTML = (CFG.skills || []).map(function (group, i) {
      var chips = (group.items || []).map(function (item) {
        return '<li class="chip">' + esc(item) + "</li>";
      }).join("");
      return (
        '<article class="skill-card" data-tilt data-tilt-max="7" tabindex="0">' +
          '<span class="skill-card__glow" aria-hidden="true"></span>' +
          '<div class="skill-card__top">' +
            '<span class="skill-card__icon"><i class="' + esc(group.icon) + '" aria-hidden="true"></i></span>' +
            '<span class="skill-card__count">' + String(i + 1).padStart(2, "0") + "</span>" +
          "</div>" +
          '<h3 class="skill-card__title">' + esc(group.category) + "</h3>" +
          '<ul class="skill-card__items">' + chips + "</ul>" +
          '<p class="skill-card__note">' + esc(group.note || "") + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /* ---- Projects ---- */
  function projectArt(project, glyphClass) {
    var a = (project.colors && project.colors[0]) || "rgba(77,124,254,0.5)";
    var b = (project.colors && project.colors[1]) || "rgba(168,85,247,0.45)";
    return (
      '<span class="project-card__art" style="--pa:' + a + ";--pb:" + b + '" aria-hidden="true"></span>' +
      '<span class="' + glyphClass + '" aria-hidden="true">' + esc(project.glyph || project.title.slice(0, 2)) + "</span>"
    );
  }

  function renderProjects() {
    var host = $("#projects-grid");
    if (!host) return;

    host.innerHTML = (CFG.projects || []).map(function (p, i) {
      var num = String(i + 1).padStart(2, "0");
      var a = (p.colors && p.colors[0]) || "rgba(77,124,254,0.5)";
      var b = (p.colors && p.colors[1]) || "rgba(168,85,247,0.45)";
      var tags = (p.tech || []).map(function (t) {
        return '<li class="chip">' + esc(t) + "</li>";
      }).join("");

      var img = p.image
        ? '<img class="project-card__img" src="' + esc(p.image) + '" alt="' + esc(p.title) +
          ' project preview" loading="lazy" decoding="async" data-fallback-art>'
        : "";

      return (
        '<article class="project-card" data-project="' + i + '" data-cursor="view" data-cursor-label="Open" ' +
          'style="--pa:' + a + ";--pb:" + b + ";--pborder:" + withAlpha(a, 0.45) + '" data-reveal="fade-up">' +
          '<span class="project-card__cursor-glow" aria-hidden="true"></span>' +
          '<div class="project-card__visual">' +
            projectArt(p, "project-card__glyph") +
            img +
            '<span class="project-card__num">' + num + "</span>" +
          "</div>" +
          '<div class="project-card__body">' +
            '<p class="project-card__meta">' + esc(p.category) + "</p>" +
            '<h3 class="project-card__title">' +
              '<button class="project-card__open" type="button" data-open-project="' + i + '" ' +
                'aria-haspopup="dialog">' + esc(p.title) + "</button>" +
              '<span class="project-card__arrow" aria-hidden="true">' +
                '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg>' +
              "</span>" +
            "</h3>" +
            '<p class="project-card__desc">' + esc(p.description) + "</p>" +
            '<ul class="project-card__tags">' + tags + "</ul>" +
            '<div class="project-card__actions">' +
              '<a class="project-link" data-project-live="' + i + '" href="#projects">' +
                '<svg class="icon" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>' +
                "<span>" + esc(p.liveLabel || "Live Demo") + "</span>" +
              "</a>" +
              '<a class="project-link" data-project-repo="' + i + '" href="#projects">' +
                '<i class="fa-brands fa-github" aria-hidden="true"></i><span>GitHub</span>' +
              "</a>" +
              '<button class="project-link" type="button" data-open-project="' + i + '" aria-haspopup="dialog">' +
                '<svg class="icon" viewBox="0 0 24 24"><path d="M4 12h16M12 4v16"/></svg>' +
                "<span>Details</span>" +
              "</button>" +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    /* Wire per-project links (placeholder aware) */
    (CFG.projects || []).forEach(function (p, i) {
      var live = $('[data-project-live="' + i + '"]', host);
      var repo = $('[data-project-repo="' + i + '"]', host);
      if (live) applyLink(live, "live", p.live, p.title + " live URL");
      if (repo) applyLink(repo, "repo", p.repo, p.title + " GitHub URL");
    });

    /* If an optional image 404s, drop it and keep the generated artwork. */
    $$("[data-fallback-art]", host).forEach(function (img) {
      img.addEventListener("error", function () {
        if (img.parentNode) img.parentNode.removeChild(img);
      });
    });
  }

  /* ---- Timeline ---- */
  function renderTimeline() {
    var host = $("#timeline-list");
    if (!host) return;
    host.innerHTML = (CFG.timeline || []).map(function (item) {
      return (
        '<li class="timeline__item" data-reveal="fade-up">' +
          '<span class="timeline__marker" aria-hidden="true"></span>' +
          '<div class="timeline__card">' +
            '<span class="timeline__date">' + esc(item.date) + "</span>" +
            '<h3 class="timeline__title">' + esc(item.title) + "</h3>" +
            '<p class="timeline__desc">' + esc(item.desc) + "</p>" +
            (item.tag ? '<span class="timeline__tag">' + esc(item.tag) + "</span>" : "") +
          "</div>" +
        "</li>"
      );
    }).join("");
  }

  /* ---- Services ---- */
  function renderServices() {
    var host = $("#services-grid");
    if (!host) return;
    host.innerHTML = (CFG.services || []).map(function (s, i) {
      var list = (s.list || []).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("");
      return (
        '<article class="service-card" data-tilt data-tilt-max="8">' +
          '<span class="service-card__glow" aria-hidden="true"></span>' +
          '<p class="service-card__index">SERVICE / ' + String(i + 1).padStart(2, "0") + "</p>" +
          '<span class="service-card__icon"><i class="' + esc(s.icon) + '" aria-hidden="true"></i></span>' +
          '<h3 class="service-card__title">' + esc(s.title) + "</h3>" +
          '<p class="service-card__desc">' + esc(s.desc) + "</p>" +
          '<ul class="service-card__list">' + list + "</ul>" +
        "</article>"
      );
    }).join("");
  }

  /* ---- Contact links ---- */
  function renderContactLinks() {
    var host = $("#contact-links");
    if (!host) return;

    var defs = [
      { kind: "email", label: "Email Me", icon: "fa-solid fa-envelope", primary: true },
      { kind: "github", label: "GitHub", icon: "fa-brands fa-github" },
      { kind: "linkedin", label: "LinkedIn", icon: "fa-brands fa-linkedin-in" },
      { kind: "instagram", label: "Instagram", icon: "fa-brands fa-instagram" }
    ];

    host.innerHTML = defs.map(function (d) {
      return (
        '<a class="contact-link' + (d.primary ? " contact-link--primary" : "") + '" ' +
          'data-contact="' + d.kind + '" href="#contact" data-cursor="pointer">' +
          '<i class="' + d.icon + '" aria-hidden="true"></i><span>' + esc(d.label) + "</span>" +
        "</a>"
      );
    }).join("");

    defs.forEach(function (d) {
      var el = $('[data-contact="' + d.kind + '"]', host);
      if (el) applyLink(el, d.kind);
    });
  }

  /* ---- Footer ---- */
  function renderFooter() {
    var nav = $("#footer-nav");
    if (nav) {
      nav.innerHTML = (CFG.footerNav || []).map(function (l) {
        return (
          "<li>" +
            '<a class="footer__link" href="' + esc(l.href) + '" data-cursor="pointer">' +
              '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>' +
              "<span>" + esc(l.label) + "</span>" +
            "</a>" +
          "</li>"
        );
      }).join("");
    }

    var social = $("#footer-social");
    if (social) {
      var defs = [
        { kind: "github", label: "GitHub", icon: "fa-brands fa-github" },
        { kind: "linkedin", label: "LinkedIn", icon: "fa-brands fa-linkedin-in" },
        { kind: "instagram", label: "Instagram", icon: "fa-brands fa-instagram" },
        { kind: "email", label: "Email", icon: "fa-solid fa-envelope" }
      ];
      social.innerHTML = defs.map(function (d) {
        return (
          "<li>" +
            '<a class="footer__link" data-social="' + d.kind + '" href="#contact" data-cursor="pointer">' +
              '<i class="' + d.icon + '" aria-hidden="true"></i><span>' + esc(d.label) + "</span>" +
            "</a>" +
          "</li>"
        );
      }).join("");

      defs.forEach(function (d) {
        var el = $('[data-social="' + d.kind + '"]', social);
        if (el) applyLink(el, d.kind);
      });
    }

    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ===================================================================
     SCROLLBAR WIDTH — keeps fixed elements from shifting when we lock
     the page (loader / modal / mobile menu).
     =================================================================== */
  function measureScrollbar() {
    var w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", (w > 0 ? w : 0) + "px");
  }

  /* ===================================================================
     LOADING SCREEN
     Progress is driven by real milestones (fonts, window load, scene
     ready) with a hard failsafe so it can never hang.
     =================================================================== */
  var loaderState = { finished: false };

  function initLoader() {
    var loader = $("#loader");
    var percentEl = $("#loader-percent");
    var barEl = $("#loader-bar");

    if (!loader) {
      document.body.classList.remove("is-loading");
      finishLoad();
      return;
    }

    var shown = 0;
    var target = 10;
    var started = (window.performance && performance.now) ? performance.now() : Date.now();
    var MIN_MS = 620;          // avoid a jarring one-frame flash
    var FAILSAFE_MS = 4500;    // never trap the visitor behind the loader

    function bump(v) { target = Math.max(target, Math.min(v, 100)); }

    /* Milestones */
    bump(hasThree ? 26 : 34);
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
      document.fonts.ready.then(function () { bump(58); })["catch"](function () { bump(58); });
    } else {
      bump(58);
    }
    window.addEventListener("portfolio:scene-ready", function () { bump(88); });
    window.addEventListener("load", function () { bump(100); });
    /* If the window already finished loading, the event will not fire again. */
    if (document.readyState === "complete") bump(100);

    var failsafe = window.setTimeout(function () { bump(100); }, FAILSAFE_MS);

    function paint() {
      var v = Math.round(shown);
      if (percentEl) percentEl.textContent = v + "%";
      if (barEl) barEl.style.width = v + "%";
    }

    function tick() {
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      shown = lerp(shown, target, 0.14);
      if (target >= 100 && shown > 99.2) shown = 100;
      paint();

      if (shown >= 100 && now - started >= MIN_MS) {
        window.clearTimeout(failsafe);
        exit(loader);
        return;
      }
      raf(tick);
    }

    raf(tick);
  }

  function exit(loader) {
    if (loaderState.finished) return;
    loaderState.finished = true;

    function cleanup() {
      loader.style.display = "none";
      loader.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-loading");
      finishLoad();
    }

    loader.classList.add("is-done");

    if (hasGSAP && !prefersReducedMotion()) {
      var tl = window.gsap.timeline({ onComplete: cleanup });
      tl.to(".loader__inner", { opacity: 0, y: -18, duration: 0.35, ease: "power2.in" })
        .to(loader, {
          clipPath: "inset(0% 0% 100% 0%)",
          webkitClipPath: "inset(0% 0% 100% 0%)",
          duration: 0.9,
          ease: "expo.inOut"
        }, "-=0.05");
    } else {
      loader.classList.add("is-hidden");
      window.setTimeout(cleanup, prefersReducedMotion() ? 0 : 620);
    }
  }

  /* Announce that the page is interactive — animations.js plays the
     hero intro from here. */
  function finishLoad() {
    document.body.classList.add("is-loaded");
    var progress = $("#scroll-progress");
    if (progress) progress.classList.add("is-visible");
    window.dispatchEvent(new CustomEvent("portfolio:loaded"));
  }

  /* ===================================================================
     SCROLL PROGRESS BAR
     =================================================================== */
  function initScrollProgress() {
    var bar = $("#scroll-progress");
    if (!bar) return;
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = clamp(window.pageYOffset / max, 0, 1);
      doc.style.setProperty("--scroll", String(p));
      bar.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    }

    function onScroll() {
      if (!ticking) { ticking = true; raf(update); }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ===================================================================
     NAVIGATION — glass state, active section, mobile menu, smooth scroll
     =================================================================== */
  function navHeight() {
    var inner = $(".nav__inner");
    return inner ? inner.getBoundingClientRect().height + 22 : 86;
  }

  /* While a programmatic scroll is running we keep the navbar pinned, so
     jumping to a section never looks like the bar is fighting the scroll. */
  var pinNavUntil = 0;

  function smoothScrollTo(target) {
    var el = typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target;
    if (!el) return;
    var isTop = el.id === "home";
    var y = isTop ? 0 : el.getBoundingClientRect().top + window.pageYOffset - navHeight();
    y = Math.max(0, y);

    pinNavUntil = Date.now() + 1100;

    if (prefersReducedMotion() || !("scrollBehavior" in document.documentElement.style)) {
      window.scrollTo(0, y);
    } else {
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  function initNav() {
    var nav = $("#navbar");
    var toggle = $("#nav-toggle");
    var menu = $("#nav-menu");
    var links = $$(".nav-link");
    var sections = links.map(function (l) {
      return document.getElementById(l.getAttribute("data-section"));
    }).filter(Boolean);

    var lastY = window.pageYOffset;
    var ticking = false;

    function closeMenu() {
      if (!nav || !nav.classList.contains("is-open")) return;
      nav.classList.remove("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    }

    function openMenu() {
      if (!nav) return;
      nav.classList.add("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
      }
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        if (nav.classList.contains("is-open")) closeMenu(); else openMenu();
      });
    }

    /* Outside click + Escape close the mobile menu */
    document.addEventListener("click", function (e) {
      if (!nav || !nav.classList.contains("is-open")) return;
      if (!nav.contains(e.target)) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    /* Smooth scrolling for every in-page anchor */
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href || href === "#" || link.hasAttribute("data-placeholder")) return;
      var el = document.getElementById(href.slice(1));
      if (!el) return;

      e.preventDefault();
      closeMenu();
      smoothScrollTo(el);

      /* Keep the URL shareable without triggering a second jump */
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", href);
      }
    });

    function setActive() {
      var probe = window.pageYOffset + window.innerHeight * 0.32;
      var current = sections[0];

      sections.forEach(function (sec) {
        if (sec.offsetTop <= probe) current = sec;
      });

      /* Bottom of the page always highlights the last nav target */
      if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1] || current;
      }

      links.forEach(function (l) {
        var on = current && l.getAttribute("data-section") === current.id;
        l.classList.toggle("is-active", !!on);
        if (on) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset;

      if (nav) {
        nav.classList.toggle("is-stuck", y > 28);

        /* Auto-hide while scrolling down, reveal on the way back up */
        var canHide = !nav.classList.contains("is-open") &&
                      !document.body.classList.contains("is-locked") &&
                      Date.now() > pinNavUntil &&
                      y > 560;
        if (canHide && y > lastY + 6) nav.classList.add("is-hidden");
        else if (y < lastY - 6 || !canHide) nav.classList.remove("is-hidden");
      }

      setActive();
      lastY = y;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; raf(update); }
    }, { passive: true });

    window.addEventListener("resize", function () {
      measureScrollbar();
      if (window.innerWidth > 992) closeMenu();
      update();
    });

    update();
  }

  /* ===================================================================
     CUSTOM CURSOR (desktop, fine pointer, motion allowed)
     =================================================================== */
  function initCursor() {
    var cursor = $("#cursor");
    var dot = $("#cursor-dot");
    var ring = $("#cursor-ring");
    var label = $("#cursor-label");
    if (!cursor || !dot || !ring) return;

    if (!isFinePointer() || prefersReducedMotion()) return;

    document.body.classList.add("has-cursor");

    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var dotPos = { x: mouse.x, y: mouse.y };
    var ringPos = { x: mouse.x, y: mouse.y };
    var visible = false;
    var STATES = ["is-pointer", "is-view", "is-close", "is-canvas"];

    function setState(kind, text) {
      STATES.forEach(function (c) { cursor.classList.remove(c); });
      if (kind) cursor.classList.add("is-" + kind);
      if (label) label.textContent = text || "";
    }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) { visible = true; cursor.style.opacity = "1"; }
    }, { passive: true });

    document.addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    document.addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });

    document.addEventListener("pointerover", function (e) {
      var el = e.target.closest ? e.target.closest("[data-cursor]") : null;
      if (!el) { setState(null); return; }
      var kind = el.getAttribute("data-cursor");
      setState(kind, el.getAttribute("data-cursor-label") || (kind === "close" ? "Close" : "View"));
    }, { passive: true });

    document.addEventListener("pointerout", function (e) {
      if (!e.relatedTarget) setState(null);
    }, { passive: true });

    window.addEventListener("blur", function () { cursor.style.opacity = "0"; visible = false; });
    document.addEventListener("mouseleave", function () { cursor.style.opacity = "0"; visible = false; });

    cursor.style.opacity = "0";
    cursor.style.transition = "opacity .3s ease";

    (function loop() {
      dotPos.x = lerp(dotPos.x, mouse.x, 0.4);
      dotPos.y = lerp(dotPos.y, mouse.y, 0.4);
      ringPos.x = lerp(ringPos.x, mouse.x, 0.15);
      ringPos.y = lerp(ringPos.y, mouse.y, 0.15);

      dot.style.transform = "translate3d(" + dotPos.x + "px," + dotPos.y + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + ringPos.x + "px," + ringPos.y + "px,0) translate(-50%,-50%)";

      raf(loop);
    })();
  }

  /* ===================================================================
     REUSABLE 3D TILT
     Writes CSS custom properties; the transform itself lives in CSS.
     =================================================================== */
  function attachTilt(el) {
    var max = parseFloat(el.getAttribute("data-tilt-max")) || 8;
    var scale = parseFloat(el.getAttribute("data-tilt-scale")) || 1.015;
    var pending = false;
    var last = { x: 0, y: 0 };

    function apply() {
      pending = false;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;

      var px = clamp((last.x - r.left) / r.width, 0, 1);
      var py = clamp((last.y - r.top) / r.height, 0, 1);

      el.style.setProperty("--tilt-ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--tilt-rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--tilt-scale", String(scale));
      el.style.setProperty("--mx", (px * 100).toFixed(2) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(2) + "%");
    }

    function onMove(e) {
      last.x = e.clientX;
      last.y = e.clientY;
      if (!pending) { pending = true; raf(apply); }
    }

    function onEnter() { el.classList.add("is-tilting"); }

    function onLeave() {
      el.classList.remove("is-tilting");
      el.style.setProperty("--tilt-rx", "0deg");
      el.style.setProperty("--tilt-ry", "0deg");
      el.style.setProperty("--tilt-scale", "1");
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "50%");
    }

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("blur", onLeave);
  }

  function initTilt() {
    if (isTouch() || prefersReducedMotion()) return;
    $$("[data-tilt]").forEach(attachTilt);
  }

  /* ===================================================================
     PROJECT MODAL
     =================================================================== */
  var modalState = { open: false, lastFocus: null, index: -1 };

  function modalMarkup(p, index) {
    var a = (p.colors && p.colors[0]) || "rgba(77,124,254,0.5)";
    var b = (p.colors && p.colors[1]) || "rgba(168,85,247,0.45)";

    var features = (p.features || []).map(function (f) {
      return "<li>" + esc(f) + "</li>";
    }).join("");

    var tags = (p.tech || []).map(function (t) {
      return '<li class="chip">' + esc(t) + "</li>";
    }).join("");

    var img = p.image
      ? '<img class="project-card__img" src="' + esc(p.image) + '" alt="' + esc(p.title) +
        ' project preview" data-fallback-art>'
      : "";

    return (
      '<div class="modal__hero" style="--pa:' + a + ";--pb:" + b + '">' +
        projectArt(p, "modal__hero-glyph") +
        img +
        '<span class="modal__hero-fade" aria-hidden="true"></span>' +
        '<div class="modal__hero-meta">' +
          '<p class="modal__category">' + esc(p.category) + "</p>" +
          '<h2 class="modal__title" id="modal-title">' + esc(p.title) + "</h2>" +
        "</div>" +
      "</div>" +

      '<div class="modal__content">' +
        "<div>" +
          '<p class="modal__lead">' + esc(p.description) + "</p>" +

          '<section class="modal__block">' +
            '<h3 class="modal__block-title">Features</h3>' +
            '<ul class="modal__list">' + features + "</ul>" +
          "</section>" +

          '<section class="modal__block">' +
            '<h3 class="modal__block-title">The Challenge</h3>' +
            '<p class="modal__text">' + esc(p.challenges) + "</p>" +
          "</section>" +

          '<section class="modal__block">' +
            '<h3 class="modal__block-title">The Solution</h3>' +
            '<p class="modal__text">' + esc(p.solution) + "</p>" +
          "</section>" +
        "</div>" +

        '<aside class="modal__side">' +
          '<div class="modal__panel-box">' +
            '<h3 class="modal__block-title">Project</h3>' +
            '<p class="modal__text">' + String(index + 1).padStart(2, "0") + " / " +
              String((CFG.projects || []).length).padStart(2, "0") + " · " + esc(p.category) + "</p>" +
          "</div>" +

          '<div class="modal__panel-box">' +
            '<h3 class="modal__block-title">Technologies</h3>' +
            '<ul class="modal__tags">' + tags + "</ul>" +
          "</div>" +

          '<div class="modal__actions">' +
            '<a class="btn btn--primary btn--block" data-modal-live href="#projects">' +
              "<span>" + esc(p.liveLabel || "Live Demo") + "</span>" +
              '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>' +
            "</a>" +
            '<a class="btn btn--outline btn--block" data-modal-repo href="#projects">' +
              '<i class="fa-brands fa-github" aria-hidden="true"></i><span>View Source</span>' +
            "</a>" +
          "</div>" +
        "</aside>" +
      "</div>"
    );
  }

  function openModal(index) {
    var modal = $("#modal");
    var body = $("#modal-body");
    var p = (CFG.projects || [])[index];
    if (!modal || !body || !p) return;

    modalState.lastFocus = document.activeElement;
    modalState.index = index;
    body.innerHTML = modalMarkup(p, index);

    var live = $("[data-modal-live]", body);
    var repo = $("[data-modal-repo]", body);
    if (live) applyLink(live, "live", p.live, p.title + " live URL");
    if (repo) applyLink(repo, "repo", p.repo, p.title + " GitHub URL");

    $$("[data-fallback-art]", body).forEach(function (img) {
      img.addEventListener("error", function () {
        if (img.parentNode) img.parentNode.removeChild(img);
      });
    });

    measureScrollbar();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    modalState.open = true;
    body.scrollTop = 0;

    var panel = $("#modal-panel");
    var backdrop = $("#modal-backdrop");

    if (hasGSAP && !prefersReducedMotion()) {
      var g = window.gsap;
      g.killTweensOf([panel, backdrop]);
      g.set(backdrop, { opacity: 0 });
      g.set(panel, { opacity: 0, y: 44, scale: 0.965 });
      g.to(backdrop, { opacity: 1, duration: 0.35, ease: "power2.out" });
      g.to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "expo.out" });
      g.from(body.querySelectorAll(".modal__hero-meta, .modal__lead, .modal__block, .modal__panel-box, .modal__actions"), {
        y: 26, opacity: 0, duration: 0.6, stagger: 0.06, delay: 0.12, ease: "power3.out", clearProps: "all"
      });
    } else {
      modal.classList.add("is-open");
    }

    /* Focus lands inside the dialog for screen reader + keyboard users */
    window.setTimeout(function () {
      var close = $("#modal-close");
      if (close) close.focus();
    }, 60);
  }

  function closeModal() {
    var modal = $("#modal");
    if (!modal || !modalState.open) return;
    var panel = $("#modal-panel");
    var backdrop = $("#modal-backdrop");

    function done() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      modalState.open = false;
      if (modalState.lastFocus && modalState.lastFocus.focus) modalState.lastFocus.focus();
    }

    if (hasGSAP && !prefersReducedMotion()) {
      var g = window.gsap;
      g.killTweensOf([panel, backdrop]);
      g.to(panel, { opacity: 0, y: 30, scale: 0.97, duration: 0.35, ease: "power2.in" });
      g.to(backdrop, { opacity: 0, duration: 0.35, ease: "power2.in", onComplete: done });
    } else {
      modal.classList.remove("is-open");
      window.setTimeout(done, prefersReducedMotion() ? 0 : 320);
    }
  }

  function initModal() {
    var modal = $("#modal");
    if (!modal) return;

    /* Open: title button, "Details" button, or the card visual itself */
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-open-project]") : null;
      if (trigger) {
        e.preventDefault();
        openModal(parseInt(trigger.getAttribute("data-open-project"), 10));
        return;
      }

      var card = e.target.closest ? e.target.closest(".project-card") : null;
      if (card && !e.target.closest("a, button")) {
        openModal(parseInt(card.getAttribute("data-project"), 10));
      }
    });

    /* Keyboard: Enter/Space on a focused card (cards are focusable only
       when a tabindex has been added — the title button is the default
       control, so this is a convenience path, not the only one). */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var active = document.activeElement;
      if (!active || !active.classList || !active.classList.contains("project-card")) return;
      e.preventDefault();
      openModal(parseInt(active.getAttribute("data-project"), 10));
    });

    var closeBtn = $("#modal-close");
    var backdrop = $("#modal-backdrop");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);

    /* Escape closes; Tab is trapped inside the dialog */
    document.addEventListener("keydown", function (e) {
      if (!modalState.open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key !== "Tab") return;

      var focusables = $$(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        modal
      ).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
      if (!focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ===================================================================
     EASTER EGG — tap the logo a few times
     =================================================================== */
  function initEasterEgg() {
    var logo = $("#logo");
    var egg = $("#easter-egg");
    if (!logo || !egg) return;

    var needed = OPT.easterEggClicks || 5;
    var count = 0;
    var resetTimer = null;
    var busy = false;

    logo.addEventListener("click", function () {
      if (busy) return;
      count++;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () { count = 0; }, 1100);

      if (count >= needed - 2 && count < needed) {
        logo.style.setProperty("filter", "brightness(1.6)");
        window.setTimeout(function () { logo.style.removeProperty("filter"); }, 220);
      }

      if (count < needed) return;

      count = 0;
      busy = true;
      egg.classList.add("is-active");

      /* Ask the 3D scene for a burst, if it is running */
      if (window.Portfolio.scene && typeof window.Portfolio.scene.burst === "function") {
        window.Portfolio.scene.burst();
      }

      var core = $(".egg__core", egg);

      if (hasGSAP && !prefersReducedMotion()) {
        var g = window.gsap;
        g.fromTo(egg, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
        g.fromTo(core, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" });
        g.to(egg, {
          opacity: 0, duration: 0.5, delay: 1.5, ease: "power2.in",
          onComplete: function () {
            egg.classList.remove("is-active");
            egg.style.removeProperty("opacity");
            busy = false;
          }
        });
      } else {
        window.setTimeout(function () {
          egg.classList.remove("is-active");
          busy = false;
        }, 1400);
      }

      toast("Nice find. <code>Konami-lite</code> — the grid says hello.", 3200);
    });
  }

  /* ===================================================================
     HERO ROLE ROTATOR
     =================================================================== */
  function initRoleRotator() {
    var host = $("#role-rotator");
    if (!host) return;

    var roles = (CFG.roles && CFG.roles.length) ? CFG.roles : ["FULL STACK DEVELOPER"];

    host.innerHTML = roles.map(function (r, i) {
      return '<span class="hero__role-text' + (i === 0 ? " is-active" : "") + '">' + esc(r) + "</span>";
    }).join("");

    var items = $$(".hero__role-text", host);
    var parent = host.parentNode;
    /* One stable label for assistive tech — the visual text rotates, the
       accessible name does not flicker with it. */
    if (parent && parent.setAttribute) parent.setAttribute("aria-label", roles[0]);

    if (items.length < 2 || prefersReducedMotion()) return;

    var index = 0;
    var interval = OPT.rotateInterval || 2800;

    function show(next) {
      var current = items[index];
      var upcoming = items[next];

      if (hasGSAP) {
        var g = window.gsap;
        g.to(current, {
          yPercent: -55, opacity: 0, filter: "blur(6px)", duration: 0.45, ease: "power3.in",
          onComplete: function () {
            current.classList.remove("is-active");
            g.set(current, { yPercent: 0, filter: "blur(0px)" });
          }
        });
        upcoming.classList.add("is-active");
        /* The short delay matters: the roles are stacked in one grid cell,
           so a simultaneous crossfade double-exposes two lines of neon
           gradient text and neither is legible. Letting the outgoing role
           clear most of the way first reads as a hand-off instead. */
        g.fromTo(upcoming,
          { yPercent: 55, opacity: 0, filter: "blur(6px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, delay: 0.22, ease: "expo.out" }
        );
      } else {
        current.classList.remove("is-active");
        upcoming.classList.add("is-active");
      }

      index = next;
    }

    var timer = window.setInterval(function () {
      if (document.hidden) return;
      show((index + 1) % items.length);
    }, interval);

    /* Pause while the tab is hidden so we do not queue up transitions */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        if (document.hidden) return;
        show((index + 1) % items.length);
      }, interval);
    });
  }

  /* ===================================================================
     BOOT
     =================================================================== */
  function renderAll() {
    bindConfigText();
    renderMarquee();
    renderStats();
    renderTraits();
    renderSkills();
    renderProjects();
    renderTimeline();
    renderServices();
    renderContactLinks();
    renderFooter();
    bindConfigLinks();   /* after render so generated anchors are covered */
  }

  function boot() {
    measureScrollbar();
    document.documentElement.classList.add(hasGSAP ? "gsap-ready" : "no-gsap");
    if (!hasThree) document.documentElement.classList.add("no-three");

    renderAll();
    initRoleRotator();
    initNav();
    initCursor();
    initTilt();
    initModal();
    initScrollProgress();
    initEasterEgg();

    /* Live chat (chat.js). It only wires up the panel here — no network
       request is made until the visitor actually opens it. */
    if (window.Portfolio.chat && typeof window.Portfolio.chat.init === "function") {
      try {
        window.Portfolio.chat.init();
      } catch (err) {
        if (window.console && console.warn) console.warn("[portfolio] chat disabled:", err);
      }
    }

    /* 3D scenes (three-scene.js) */
    var allow3D = hasThree && OPT.enable3D !== false &&
                  (!isMobileViewport() || OPT.enable3DOnMobile !== false);

    if (allow3D && window.Portfolio.scene && typeof window.Portfolio.scene.init === "function") {
      try {
        window.Portfolio.scene.init({
          tier: deviceTier(),
          reducedMotion: prefersReducedMotion(),
          maxPixelRatio: OPT.maxPixelRatio || 2,
          mobile: isMobileViewport()
        });
      } catch (err) {
        /* A WebGL failure must never take the page down with it */
        if (window.console && console.warn) console.warn("[portfolio] 3D scene disabled:", err);
      }
    }

    /* Scroll animations (animations.js) */
    if (window.Portfolio.animations && typeof window.Portfolio.animations.init === "function") {
      try {
        window.Portfolio.animations.init();
      } catch (err) {
        if (window.console && console.warn) console.warn("[portfolio] animations disabled:", err);
        /* Make sure nothing stays invisible */
        $$("[data-reveal]").forEach(function (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      }
    }

    initLoader();
  }

  /* Shared helpers for the other modules */
  window.Portfolio.utils = {
    $: $, $$: $$, clamp: clamp, lerp: lerp, esc: esc,
    prefersReducedMotion: prefersReducedMotion,
    isFinePointer: isFinePointer,
    isTouch: isTouch,
    isMobileViewport: isMobileViewport,
    deviceTier: deviceTier,
    toast: toast,
    smoothScrollTo: smoothScrollTo
  };
  window.Portfolio.openProject = openModal;
  window.Portfolio.closeProject = closeModal;

  /* Boot ordering matters: main.js, three-scene.js and animations.js are
     all `defer`, and a deferred script runs when document.readyState is
     already "interactive" — not "loading". Testing for "loading" would
     therefore boot immediately, before the other two files have
     registered Portfolio.scene / Portfolio.animations, and both would be
     silently skipped. Waiting for DOMContentLoaded guarantees every
     deferred script has run. */
  var booted = false;
  function start() {
    if (booted) return;
    booted = true;
    boot();
  }

  if (document.readyState === "complete") {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
    /* Safety net for the case where DOMContentLoaded has already fired
       (e.g. this file injected dynamically) — load always comes later. */
    window.addEventListener("load", start);
  }
})();
