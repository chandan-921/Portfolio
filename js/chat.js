/* =====================================================================
   Chandan Gupta — Portfolio
   chat.js — the visitor-facing live chat widget
   ---------------------------------------------------------------------
   Opened by the "Let's talk" button in the navbar. Talks to the small
   Node server in this project's `server/` folder:

     GET  /api/chat/config     is anyone home, and what are the limits
     POST /api/chat/session    start a conversation, receive a token
     POST /api/chat/resume     restore a conversation after a reload
     POST /api/chat/message    send (REST fallback)
     GET  /api/chat/messages   poll (REST fallback)
     POST /api/chat/read       clear the visitor-side unread count
     WS   /ws?role=visitor     the live transport

   Design notes
   ------------
   • Nothing here runs until the visitor actually opens the panel, so a
     visitor who never clicks "Let's talk" pays no network cost at all.
   • The WebSocket is preferred; if it cannot be established the widget
     silently switches to REST polling, so corporate proxies that drop
     upgrades still get a working conversation.
   • When no server is configured (serverUrl left as the placeholder) or
     the server is unreachable, the panel shows an email fallback rather
     than a broken chat.
   • Every string that came from the network is written with textContent.
     There is no innerHTML in this file.

   Configuration lives in js/main.js → portfolioConfig.chat.
   ===================================================================== */
(function () {
  "use strict";

  var P = (window.Portfolio = window.Portfolio || {});
  var CFG = P.config || {};
  var CHAT = CFG.chat || {};
  var U = P.utils || {};

  /* ---- Tuning (rarely needs changing) ---- */
  var RECONNECT_MIN = 1000;     // first WebSocket retry delay, ms
  var RECONNECT_MAX = 20000;    // ceiling for the backoff
  var WS_GIVE_UP = 3;           // failed attempts before falling back to REST
  var POLL_MS = 4000;           // REST polling interval
  var ACK_TIMEOUT = 12000;      // how long a bubble may stay "sending"
  var RUN_GAP_MS = 5 * 60000;   // bubbles further apart than this start a new run
  var TYPING_THROTTLE = 2200;   // min gap between "is typing" frames
  var TYPING_IDLE = 3200;       // stop typing after this long without a keystroke
  var STORE_KEY = "cg_chat_v1";
  var COUNTER_AT = 200;         // show the character counter within N of the cap

  /* =====================================================================
     State
     ===================================================================== */
  var el = {};

  var state = {
    ready: false,
    open: false,
    view: "",
    base: null,          // resolved once, lazily
    started: false,      // has the panel ever been opened
    session: null,       // { id, token, name }

    socket: null,
    connected: false,
    reconnectDelay: RECONNECT_MIN,
    reconnectTimer: null,
    wsFailures: 0,
    manualClose: false,
    usingRest: false,
    pollTimer: null,
    cursor: "",          // last message id seen, for polling

    agentName: "Chandan",
    agentInitials: "",
    agentOnline: false,
    maxChars: 2000,
    maxNameChars: 60,
    status: "open",

    seen: Object.create(null),           // message id → true
    pending: Object.create(null),        // clientId → { text, node, timer }
    lastRender: { role: "", at: 0, day: "", node: null },

    unread: 0,
    atBottom: true,
    typingTimer: null,
    typingSentAt: 0,
    typingIsOn: false,
    resetArmed: false
  };

  /* =====================================================================
     Small helpers
     ===================================================================== */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function reduced() {
    return typeof U.prefersReducedMotion === "function"
      ? U.prefersReducedMotion()
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function toast(msg) {
    if (typeof U.toast === "function") U.toast(msg);
  }

  /* The panel is a docked card on desktop and a full-screen sheet on
     phones. That difference decides two things: whether the page behind
     it should be scroll-locked, and whether it is genuinely modal. */
  function isSheet() {
    return window.matchMedia("(max-width: 40rem)").matches;
  }

  function trimSlash(s) {
    return String(s).replace(/\/+$/, "");
  }

  /* Matches the placeholder convention used everywhere in main.js. */
  function isPlaceholder(v) {
    return typeof v === "string" && /^YOUR_[A-Z0-9_]*$/.test(v.trim());
  }

  function isLocalHost() {
    if (location.protocol === "file:") return true;
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]" || h === "";
  }

  /**
   * Where the chat server lives.
   * @returns {string} an origin with no trailing slash, or "" when the
   *   chat has not been configured and no local server can be guessed.
   */
  function resolveBase() {
    var raw = CHAT.serverUrl;

    /* Explicit same-origin deployment: site and server behind one host. */
    if (raw === "") return trimSlash(location.origin);

    if (typeof raw === "string" && raw.trim() && !isPlaceholder(raw)) {
      return trimSlash(raw.trim());
    }

    /* Still a placeholder. During local development the server is almost
       certainly `npm start` on 8787, so guess that rather than showing an
       "offline" card to the one person who can fix it. */
    if (isLocalHost()) {
      if (location.port === "8787") return trimSlash(location.origin);
      return "http://" + (location.hostname || "localhost") + ":8787";
    }

    return "";
  }

  function apiUrl(path) {
    return state.base + "/api/chat" + path;
  }

  function wsUrl() {
    var base = state.base;
    /* file:// resolves to an http base above, so this always has a scheme. */
    var scheme = base.indexOf("https:") === 0 ? "wss:" : "ws:";
    var host = base.replace(/^https?:/, "");
    return scheme + host + "/ws?role=visitor" +
      "&cid=" + encodeURIComponent(state.session.id) +
      "&token=" + encodeURIComponent(state.session.token);
  }

  /**
   * fetch + JSON with a hard timeout, because a hung request would leave
   * the panel spinning forever.
   * @returns {Promise<{status:number, body:object}>}
   */
  function request(path, options) {
    var opts = options || {};
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, opts.timeout || 12000);

    var init = {
      method: opts.method || "GET",
      headers: { Accept: "application/json" },
      /* No cookies are involved on the visitor side — the token in the
         body is the whole credential — so this stays "omit". */
      credentials: "omit"
    };
    if (ctrl) init.signal = ctrl.signal;
    if (opts.body) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }

    return fetch(apiUrl(path), init).then(
      function (res) {
        window.clearTimeout(timer);
        return res.text().then(function (text) {
          var body = {};
          try {
            body = text ? JSON.parse(text) : {};
          } catch (err) {
            body = {};
          }
          return { status: res.status, body: body };
        });
      },
      function (err) {
        window.clearTimeout(timer);
        throw err;
      }
    );
  }

  /* ---- Time formatting ---- */
  var timeFmt = null;
  try {
    timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  } catch (err) {
    timeFmt = null;
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    if (timeFmt) return timeFmt.format(d);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function dayKey(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function fmtDay(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var today = new Date();
    var y = new Date();
    y.setDate(y.getDate() - 1);

    if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
    if (dayKey(iso) === dayKey(y.toISOString())) return "Yesterday";

    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: d.getFullYear() === today.getFullYear() ? undefined : "numeric"
      }).format(d);
    } catch (err) {
      return d.toDateString();
    }
  }

  function initialsOf(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function agentMonogram() {
    var configured = String(state.agentInitials || "").trim();
    if (configured) return configured.slice(0, 2).toUpperCase();
    return initialsOf(state.agentName);
  }

  function newClientId() {
    return "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /* ---- Persistence ---- */
  function loadSession() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.id || !parsed.token) return null;
      /* A session belongs to one server. If the owner points the widget
         somewhere else, the old token is meaningless — drop it rather
         than sending it to a stranger. */
      if (parsed.base && parsed.base !== state.base) return null;
      return { id: parsed.id, token: parsed.token, name: parsed.name || "" };
    } catch (err) {
      return null;
    }
  }

  function saveSession() {
    try {
      if (!state.session) {
        window.localStorage.removeItem(STORE_KEY);
        return;
      }
      window.localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          id: state.session.id,
          token: state.session.token,
          name: state.session.name,
          base: state.base
        })
      );
    } catch (err) {
      /* Private browsing with storage disabled: the chat still works for
         this page view, it just will not survive a reload. */
    }
  }

  function clearSession() {
    state.session = null;
    saveSession();
  }

  /* =====================================================================
     View switching
     ===================================================================== */
  var VIEWS = {
    intro: "chatIntro",
    thread: "chatThread",
    offline: "chatOffline",
    loading: "chatLoading"
  };

  function setView(name) {
    state.view = name;
    Object.keys(VIEWS).forEach(function (key) {
      var node = el[VIEWS[key]];
      if (node) node.hidden = key !== name;
    });

    if (name === "thread") scrollToEnd(true);
  }

  /* =====================================================================
     Open / close
     ===================================================================== */
  function open() {
    if (!state.ready || state.open) return;

    state.open = true;
    state.lastFocus = document.activeElement;

    el.chat.hidden = false;
    el.trigger.setAttribute("aria-expanded", "true");

    /* Only a full-screen sheet is truly modal; the desktop card leaves
       the page usable, and claiming otherwise misleads screen readers. */
    var sheet = isSheet();
    el.panel.setAttribute("aria-modal", sheet ? "true" : "false");
    if (sheet) document.body.classList.add("is-locked");

    /* One frame so the browser registers the starting transform before
       .is-open flips it — without this the panel appears with no motion. */
    window.requestAnimationFrame(function () {
      el.chat.classList.add("is-open");
    });

    setUnread(0);
    if (!state.started) {
      state.started = true;
      bootstrap();
    } else if (state.view === "thread") {
      markRead();
      scrollToEnd(true);
    }

    window.setTimeout(focusFirst, reduced() ? 0 : 260);
  }

  function close() {
    if (!state.open) return;
    state.open = false;

    el.chat.classList.remove("is-open");
    el.trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
    stopTyping();

    var done = function () {
      if (!state.open) el.chat.hidden = true;
    };
    if (reduced()) done();
    else window.setTimeout(done, 320);

    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  function focusFirst() {
    if (!state.open) return;
    if (state.view === "intro" && el.name) el.name.focus();
    else if (state.view === "thread" && el.input && !isSheet()) el.input.focus();
    else if (el.close) el.close.focus();
  }

  /* =====================================================================
     Bootstrap — runs once, the first time the panel is opened
     ===================================================================== */
  function bootstrap() {
    state.base = resolveBase();

    if (!state.base) {
      showOffline(
        CHAT.offlineText ||
          "The live chat isn't running right now. Email is the fastest way to reach me."
      );
      return;
    }

    state.session = loadSession();
    setView("loading");

    if (state.session) {
      resume();
      return;
    }

    /* No session yet: confirm the server is actually up before showing a
       form that would fail on submit. */
    request("/config")
      .then(function (res) {
        if (res.status !== 200 || !res.body.ok) throw new Error("bad-config");
        applyServerConfig(res.body);
        setView("intro");
        focusFirst();
      })
      .catch(function () {
        showOffline(
          CHAT.offlineText ||
            "The live chat isn't running right now. Email is the fastest way to reach me."
        );
      });
  }

  function resume() {
    request("/resume", {
      method: "POST",
      body: { conversationId: state.session.id, token: state.session.token }
    })
      .then(function (res) {
        if (res.status === 404) {
          /* The conversation was deleted or expired. Start clean. */
          clearSession();
          setView("intro");
          focusFirst();
          return;
        }
        if (res.status !== 200 || !res.body.ok) throw new Error("resume-failed");

        applyServerConfig(res.body);
        enterThread(res.body.conversation);
      })
      .catch(function () {
        showOffline(
          "Couldn't reconnect to the chat just now. Your conversation is safe — try again in a moment."
        );
      });
  }

  function applyServerConfig(body) {
    if (body.agentName) state.agentName = body.agentName;
    if (body.agentInitials) state.agentInitials = body.agentInitials;
    if (typeof body.agentOnline === "boolean") setPresence(body.agentOnline);
    if (body.maxMessageChars) state.maxChars = body.maxMessageChars;
    if (body.maxNameChars) state.maxNameChars = body.maxNameChars;

    if (el.avatar) el.avatar.textContent = agentMonogram();
    if (el.typingAv) el.typingAv.textContent = agentMonogram();
    if (el.typingSr) el.typingSr.textContent = state.agentName + " is typing";
    if (el.name) el.name.maxLength = state.maxNameChars;
    if (el.input) el.input.maxLength = state.maxChars;
    if (el.first) el.first.maxLength = state.maxChars;
  }

  function showOffline(text) {
    if (el.offlineTitle) {
      el.offlineTitle.textContent = CHAT.offlineTitle || "Chat is offline";
    }
    if (el.offlineText) el.offlineText.textContent = text;
    setView("offline");
  }

  /* =====================================================================
     Starting a conversation
     ===================================================================== */
  function submitIntro(event) {
    event.preventDefault();
    if (el.start.getAttribute("aria-busy") === "true") return;

    var name = el.name.value.trim();
    if (!name) {
      formError("Please enter your name so I know who I'm talking to.");
      el.name.classList.add("is-invalid");
      el.name.focus();
      return;
    }

    var email = el.email ? el.email.value.trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      formError("That email address doesn't look right. Leave it blank if you'd rather not share it.");
      el.email.classList.add("is-invalid");
      el.email.focus();
      return;
    }

    formError("");
    el.name.classList.remove("is-invalid");
    if (el.email) el.email.classList.remove("is-invalid");
    el.start.setAttribute("aria-busy", "true");

    request("/session", {
      method: "POST",
      body: {
        name: name,
        email: email,
        message: el.first ? el.first.value.trim() : "",
        locale: navigator.language || "",
        timezone: guessTimezone(),
        referrer: document.referrer || "",
        page: location.pathname + location.hash
      }
    })
      .then(function (res) {
        el.start.removeAttribute("aria-busy");

        if (res.status === 201 && res.body.ok) {
          state.session = {
            id: res.body.conversationId,
            token: res.body.token,
            name: name
          };
          saveSession();
          applyServerConfig(res.body);
          if (el.first) el.first.value = "";
          enterThread(res.body.conversation);
          return;
        }

        if (res.status === 429) {
          formError(res.body.message || "Too many chats started from this connection. Please try again later.");
          return;
        }
        if (res.status === 503) {
          showOffline(res.body.message || "The chat is temporarily full. Please use email instead.");
          return;
        }
        formError(res.body.message || "Couldn't start the chat. Please try again.");
      })
      .catch(function () {
        el.start.removeAttribute("aria-busy");
        formError("Couldn't reach the chat server. Check your connection, or email me instead.");
      });
  }

  function guessTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (err) {
      return "";
    }
  }

  function formError(text) {
    if (!el.formError) return;
    el.formError.textContent = text || "";
    el.formError.hidden = !text;
  }

  /* =====================================================================
     The thread
     ===================================================================== */
  function enterThread(conversation) {
    state.status = (conversation && conversation.status) || "open";
    renderThread((conversation && conversation.messages) || []);
    setView("thread");
    paintFoot();
    connect();
    focusFirst();
  }

  function renderThread(messages) {
    state.seen = Object.create(null);
    state.lastRender = { role: "", at: 0, day: "", node: null };
    el.msgs.textContent = "";

    /* Bulk-render without the per-bubble entrance animation. */
    el.msgs.classList.add("is-bulk");
    for (var i = 0; i < messages.length; i++) appendMessage(messages[i], true);
    window.requestAnimationFrame(function () {
      el.msgs.classList.remove("is-bulk");
    });

    if (messages.length) state.cursor = messages[messages.length - 1].id;
    scrollToEnd(true);
    markRead();
  }

  /**
   * @param {object} m       a publicMessage from the server
   * @param {boolean} [bulk] true while restoring history (no scroll, no badge)
   * @returns {HTMLElement|null} the bubble, or null if it was a duplicate
   */
  function appendMessage(m, bulk) {
    if (!m || !m.id) return null;
    if (state.seen[m.id]) return null;

    /* A message we sent optimistically is coming back with its real id;
       promote the existing bubble instead of adding a second one. */
    if (m.clientId && state.pending[m.clientId]) {
      return resolvePending(m.clientId, m);
    }

    state.seen[m.id] = true;

    var at = new Date(m.at).getTime() || Date.now();
    var day = dayKey(m.at);
    var role = m.role === "agent" ? "agent" : m.role === "system" ? "system" : "visitor";

    if (day && day !== state.lastRender.day) {
      var sep = document.createElement("div");
      sep.className = "chat-msg__day";
      sep.textContent = fmtDay(m.at);
      el.msgs.appendChild(sep);
      state.lastRender.role = "";
      state.lastRender.node = null;
    }

    var node = buildBubble(m, role);

    var sameRun =
      role !== "system" &&
      role === state.lastRender.role &&
      at - state.lastRender.at < RUN_GAP_MS;

    if (sameRun) {
      node.classList.add("is-run");
      if (state.lastRender.node) state.lastRender.node.classList.remove("is-last-of-run");
    }
    node.classList.add("is-last-of-run");

    el.msgs.appendChild(node);

    state.lastRender = { role: role, at: at, day: day || state.lastRender.day, node: node };
    if (m.id.indexOf("v_") !== 0) state.cursor = m.id;

    if (!bulk) {
      if (role === "agent") {
        showTyping(false);
        if (state.open && state.atBottom) {
          scrollToEnd(false);
          markRead();
        } else {
          setUnread(state.unread + 1);
          if (state.open) showJump();
        }
      } else {
        scrollToEnd(false);
      }
    }

    return node;
  }

  function buildBubble(m, role) {
    var wrap = document.createElement("div");
    wrap.className = "chat-msg chat-msg--" + role;
    wrap.setAttribute("data-id", m.id);
    if (m.clientId) wrap.setAttribute("data-client-id", m.clientId);

    var bubble = document.createElement("div");
    bubble.className = "chat-msg__bubble";
    /* textContent, never innerHTML: this string came off the network. */
    bubble.textContent = m.text || "";
    wrap.appendChild(bubble);

    if (role !== "system") {
      var foot = document.createElement("div");
      foot.className = "chat-msg__foot";
      var stamp = document.createElement("span");
      stamp.textContent = fmtTime(m.at);
      foot.appendChild(stamp);
      wrap.appendChild(foot);
    }

    return wrap;
  }

  function systemLine(text) {
    appendMessage({
      id: "sys_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      role: "system",
      text: text,
      at: new Date().toISOString()
    });
  }

  /* ---- Scrolling ---- */
  function scrollToEnd(instant) {
    if (!el.scroll) return;
    var go = function () {
      el.scroll.scrollTop = el.scroll.scrollHeight;
      state.atBottom = true;
      hideJump();
    };
    if (instant || reduced()) go();
    else window.requestAnimationFrame(go);
  }

  function onScroll() {
    if (!el.scroll) return;
    var slack = el.scroll.scrollHeight - el.scroll.scrollTop - el.scroll.clientHeight;
    state.atBottom = slack < 48;
    if (state.atBottom) {
      hideJump();
      if (state.open) markRead();
    }
  }

  function showJump() {
    if (!el.jump) return;
    el.jump.hidden = false;
  }

  function hideJump() {
    if (el.jump) el.jump.hidden = true;
  }

  /* ---- Unread badge on the navbar trigger ---- */
  function setUnread(n) {
    state.unread = Math.max(0, n);
    if (!el.badge) return;
    if (!state.unread) {
      el.badge.hidden = true;
      el.badge.textContent = "0";
      return;
    }
    el.badge.textContent = state.unread > 9 ? "9+" : String(state.unread);
    el.badge.hidden = false;
  }

  /* ---- Presence, banner, footer ---- */
  function setPresence(online) {
    state.agentOnline = !!online;
    if (el.dot) el.dot.classList.toggle("is-online", state.agentOnline);
    paintHeader();
    paintFoot();
  }

  function paintHeader() {
    if (el.title) el.title.textContent = CHAT.title || "Chat with " + state.agentName;
    if (!el.sub) return;
    el.sub.textContent = state.agentOnline
      ? state.agentName + " is online now"
      : CHAT.subtitle || "Usually replies within a few hours";
  }

  function paintFoot() {
    if (!el.footNote) return;
    if (state.status === "closed") {
      el.footNote.textContent = "This conversation was closed.";
      return;
    }
    el.footNote.textContent = state.agentOnline
      ? "Live — " + state.agentName + " is reading this"
      : "Offline — messages are saved and answered later";
  }

  function banner(text, bad) {
    if (!el.banner) return;
    if (!text) {
      el.banner.hidden = true;
      el.banner.textContent = "";
      el.banner.classList.remove("is-bad");
      return;
    }
    el.banner.textContent = text;
    el.banner.classList.toggle("is-bad", !!bad);
    el.banner.hidden = false;
  }

  /* =====================================================================
     WebSocket transport
     ===================================================================== */
  function connect() {
    if (!state.session || !state.base) return;
    if (typeof window.WebSocket !== "function") return startPolling();
    if (state.socket) return;

    state.manualClose = false;

    var socket;
    try {
      socket = new WebSocket(wsUrl());
    } catch (err) {
      return onSocketDead();
    }
    state.socket = socket;

    socket.onopen = function () {
      state.connected = true;
      state.wsFailures = 0;
      state.reconnectDelay = RECONNECT_MIN;
      stopPolling();
      banner("");
      /* A reconnect may have missed messages; the REST list is the source
         of truth, so reconcile rather than assuming we are up to date. */
      catchUp();
    };

    socket.onmessage = function (event) {
      var frame;
      try {
        frame = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      handleFrame(frame);
    };

    socket.onclose = function (event) {
      state.connected = false;
      state.socket = null;
      if (state.manualClose) return;

      /* 1008 means the server rejected our credentials — retrying with the
         same token would loop forever. Treat the session as gone. */
      if (event && event.code === 1008) {
        sessionExpired();
        return;
      }
      onSocketDead();
    };

    socket.onerror = function () {
      /* onclose always follows; the retry logic lives there. */
    };
  }

  function onSocketDead() {
    state.socket = null;
    state.connected = false;
    state.wsFailures += 1;

    if (state.wsFailures >= WS_GIVE_UP) {
      /* Give up on the upgrade and poll instead. This is the path a
         restrictive proxy takes, and the visitor should not notice. */
      startPolling();
      return;
    }

    scheduleReconnect();
  }

  function scheduleReconnect() {
    if (state.reconnectTimer) return;
    var jitter = 0.75 + Math.random() * 0.5;
    var wait = Math.min(RECONNECT_MAX, Math.round(state.reconnectDelay * jitter));
    state.reconnectDelay = Math.min(RECONNECT_MAX, Math.round(state.reconnectDelay * 1.8));

    state.reconnectTimer = window.setTimeout(function () {
      state.reconnectTimer = null;
      connect();
    }, wait);
  }

  function closeSocket() {
    state.manualClose = true;
    if (state.reconnectTimer) {
      window.clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }
    if (state.socket) {
      try {
        state.socket.close();
      } catch (err) {
        /* Already closing. */
      }
      state.socket = null;
    }
    state.connected = false;
  }

  function wsSend(frame) {
    if (!state.socket || state.socket.readyState !== 1) return false;
    try {
      state.socket.send(JSON.stringify(frame));
      return true;
    } catch (err) {
      return false;
    }
  }

  function handleFrame(frame) {
    if (!frame || typeof frame.type !== "string") return;

    switch (frame.type) {
      case "ready":
        applyServerConfig(frame);
        if (frame.limits && frame.limits.maxMessageChars) {
          state.maxChars = frame.limits.maxMessageChars;
          if (el.input) el.input.maxLength = state.maxChars;
        }
        if (frame.conversation) {
          state.status = frame.conversation.status || state.status;
          paintFoot();
        }
        break;

      case "message":
        appendMessage(frame.message);
        break;

      case "ack":
        if (frame.clientId) resolvePending(frame.clientId, frame);
        break;

      case "typing":
        showTyping(frame.isTyping !== false);
        break;

      case "presence":
        setPresence(frame.agentOnline);
        break;

      case "status":
        state.status = frame.status || "open";
        paintFoot();
        if (state.status === "closed") {
          systemLine("Chandan marked this conversation as closed. You can still write — it will reopen.");
        }
        break;

      case "error":
        handleServerError(frame);
        break;

      default:
        /* Unknown frame types are ignored on purpose: the server may add
           new ones and an older cached copy of this file must not break. */
        break;
    }
  }

  function handleServerError(frame) {
    if (frame.code === "gone") {
      sessionExpired();
      return;
    }
    if (frame.code === "rate-limited") {
      banner(frame.message || "Slow down a moment.", true);
      window.setTimeout(function () {
        banner("");
      }, Math.min(8000, (frame.retryAfterMs || 4000) + 1200));
      return;
    }
    if (frame.message) toast(frame.message);
  }

  function sessionExpired() {
    closeSocket();
    stopPolling();
    clearSession();
    banner("");
    setView("intro");
    formError("That conversation is no longer available. Start a new one and I'll pick it up.");
    focusFirst();
  }

  /* =====================================================================
     REST polling fallback
     ===================================================================== */
  function startPolling() {
    if (state.pollTimer || !state.session) return;
    state.usingRest = true;
    closeSocket();
    poll();
    state.pollTimer = window.setInterval(poll, POLL_MS);
  }

  function stopPolling() {
    state.usingRest = false;
    if (state.pollTimer) {
      window.clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function poll() {
    if (!state.session) return;
    /* Polling while the tab is hidden wastes the visitor's battery for
       information they cannot see; the next open catches up. */
    if (document.hidden && !state.open) return;

    var query =
      "?cid=" + encodeURIComponent(state.session.id) +
      "&token=" + encodeURIComponent(state.session.token) +
      (state.cursor ? "&since=" + encodeURIComponent(state.cursor) : "");

    request("/messages" + query, { timeout: 9000 })
      .then(function (res) {
        if (res.status === 404) return sessionExpired();
        if (res.status !== 200 || !res.body.ok) return;

        setPresence(res.body.agentOnline);
        if (res.body.status && res.body.status !== state.status) {
          state.status = res.body.status;
          paintFoot();
        }

        var list = res.body.messages || [];
        for (var i = 0; i < list.length; i++) appendMessage(list[i]);
        if (res.body.cursor) state.cursor = res.body.cursor;
      })
      .catch(function () {
        /* One failed poll is not worth telling the visitor about. */
      });
  }

  /* After a reconnect, pull anything that arrived while we were away. */
  function catchUp() {
    if (!state.session) return;
    var query =
      "?cid=" + encodeURIComponent(state.session.id) +
      "&token=" + encodeURIComponent(state.session.token) +
      (state.cursor ? "&since=" + encodeURIComponent(state.cursor) : "");

    request("/messages" + query, { timeout: 9000 })
      .then(function (res) {
        if (res.status !== 200 || !res.body.ok) return;
        var list = res.body.messages || [];
        for (var i = 0; i < list.length; i++) appendMessage(list[i]);
        if (res.body.cursor) state.cursor = res.body.cursor;
      })
      .catch(function () {});
  }

  function markRead() {
    if (!state.session) return;
    setUnread(0);
    if (wsSend({ type: "read" })) return;
    request("/read", {
      method: "POST",
      body: { conversationId: state.session.id, token: state.session.token }
    }).catch(function () {});
  }

  /* =====================================================================
     Sending
     ===================================================================== */
  function sendMessage(event) {
    if (event) event.preventDefault();
    if (!state.session) return;

    var text = el.input.value.trim();
    if (!text) return;
    if (text.length > state.maxChars) {
      banner("That message is too long — " + text.length + " of " + state.maxChars + " characters.", true);
      return;
    }

    el.input.value = "";
    autoGrow();
    updateCounter();
    stopTyping();
    banner("");

    var clientId = newClientId();
    var node = appendMessage({
      id: clientId,
      role: "visitor",
      text: text,
      at: new Date().toISOString(),
      clientId: clientId
    });
    if (!node) return;
    node.classList.add("is-pending");

    state.pending[clientId] = {
      text: text,
      node: node,
      timer: window.setTimeout(function () {
        markFailed(clientId);
      }, ACK_TIMEOUT)
    };

    if (wsSend({ type: "message", text: text, clientId: clientId })) {
      scrollToEnd(false);
      return;
    }

    /* No socket: POST it. The reply comes back on the next poll. */
    sendOverRest(clientId, text);
    scrollToEnd(false);
  }

  function sendOverRest(clientId, text) {
    request("/message", {
      method: "POST",
      body: {
        conversationId: state.session.id,
        token: state.session.token,
        text: text,
        clientId: clientId
      }
    })
      .then(function (res) {
        if (res.status === 201 && res.body.message) {
          resolvePending(clientId, res.body.message);
          if (!state.usingRest && !state.connected) startPolling();
          return;
        }
        if (res.status === 404) return sessionExpired();
        if (res.status === 429) {
          banner(res.body.message || "Slow down a moment.", true);
        }
        markFailed(clientId);
      })
      .catch(function () {
        markFailed(clientId);
      });
  }

  /**
   * Promote an optimistic bubble to a confirmed one.
   * @returns {HTMLElement|null}
   */
  function resolvePending(clientId, real) {
    var entry = state.pending[clientId];
    if (!entry) return null;

    window.clearTimeout(entry.timer);
    delete state.pending[clientId];

    var node = entry.node;
    node.classList.remove("is-pending", "is-failed");

    if (real && real.id) {
      node.setAttribute("data-id", real.id);
      state.seen[real.id] = true;
      state.cursor = real.id;
    }
    if (real && real.at) {
      var stamp = $(".chat-msg__foot span", node);
      if (stamp) stamp.textContent = fmtTime(real.at);
    }

    /* Drop any "Not sent" affordance left over from a previous attempt. */
    var retry = $(".chat-msg__retry", node);
    if (retry && retry.parentNode) retry.parentNode.removeChild(retry);

    return node;
  }

  function markFailed(clientId) {
    var entry = state.pending[clientId];
    if (!entry) return;
    window.clearTimeout(entry.timer);

    var node = entry.node;
    node.classList.remove("is-pending");
    node.classList.add("is-failed");

    var foot = $(".chat-msg__foot", node);
    if (foot && !$(".chat-msg__retry", foot)) {
      var label = document.createElement("span");
      label.textContent = "Not sent";
      foot.appendChild(label);

      var retry = document.createElement("button");
      retry.type = "button";
      retry.className = "chat-msg__retry";
      retry.textContent = "Retry";
      retry.addEventListener("click", function () {
        node.classList.remove("is-failed");
        node.classList.add("is-pending");
        if (label.parentNode) label.parentNode.removeChild(label);
        if (retry.parentNode) retry.parentNode.removeChild(retry);

        state.pending[clientId] = {
          text: entry.text,
          node: node,
          timer: window.setTimeout(function () {
            markFailed(clientId);
          }, ACK_TIMEOUT)
        };

        if (!wsSend({ type: "message", text: entry.text, clientId: clientId })) {
          sendOverRest(clientId, entry.text);
        }
      });
      foot.appendChild(retry);
    }
  }

  /* =====================================================================
     Composer behaviour
     ===================================================================== */
  function autoGrow() {
    if (!el.input) return;
    el.input.style.height = "auto";
    var max = 120; // px, matches the CSS max-height
    el.input.style.height = Math.min(max, Math.max(38, el.input.scrollHeight)) + "px";
  }

  function updateCounter() {
    if (!el.counter) return;
    var used = el.input.value.length;
    var left = state.maxChars - used;

    if (left > COUNTER_AT) {
      el.counter.textContent = "";
      el.counter.classList.remove("is-warn", "is-over");
    } else {
      el.counter.textContent = String(left);
      el.counter.classList.toggle("is-warn", left <= COUNTER_AT && left >= 0);
      el.counter.classList.toggle("is-over", left < 0);
    }

    el.send.disabled = used === 0 || left < 0;
  }

  function onCompose() {
    autoGrow();
    updateCounter();
    signalTyping();
  }

  function signalTyping() {
    if (!el.input.value) return stopTyping();

    var now = Date.now();
    if (!state.typingIsOn || now - state.typingSentAt > TYPING_THROTTLE) {
      state.typingIsOn = true;
      state.typingSentAt = now;
      wsSend({ type: "typing", isTyping: true });
    }

    window.clearTimeout(state.typingTimer);
    state.typingTimer = window.setTimeout(stopTyping, TYPING_IDLE);
  }

  function stopTyping() {
    window.clearTimeout(state.typingTimer);
    state.typingTimer = null;
    if (!state.typingIsOn) return;
    state.typingIsOn = false;
    wsSend({ type: "typing", isTyping: false });
  }

  function showTyping(on) {
    if (!el.typing) return;
    var wasHidden = el.typing.hidden;
    el.typing.hidden = !on;
    if (on && wasHidden && state.atBottom) scrollToEnd(false);
  }

  /* =====================================================================
     Start over
     ===================================================================== */
  function onReset() {
    if (!state.resetArmed) {
      state.resetArmed = true;
      el.reset.textContent = "Sure? Start over";
      window.setTimeout(function () {
        if (!state.resetArmed) return;
        state.resetArmed = false;
        el.reset.textContent = "Start over";
      }, 4000);
      return;
    }

    state.resetArmed = false;
    el.reset.textContent = "Start over";

    closeSocket();
    stopPolling();
    clearSession();

    state.seen = Object.create(null);
    state.pending = Object.create(null);
    state.lastRender = { role: "", at: 0, day: "", node: null };
    state.cursor = "";
    state.status = "open";
    state.wsFailures = 0;
    state.reconnectDelay = RECONNECT_MIN;
    el.msgs.textContent = "";
    el.input.value = "";
    autoGrow();
    updateCounter();
    banner("");
    showTyping(false);
    setUnread(0);

    /* The old transcript stays on the server — the visitor is only
       starting a new thread, not asking me to forget the last one. */
    setView("intro");
    if (el.name) el.name.value = "";
    formError("");
    focusFirst();
  }

  /* =====================================================================
     Wiring
     ===================================================================== */
  function cacheElements() {
    el.chat = byId("chat");
    el.panel = byId("chat-panel");
    el.backdrop = byId("chat-backdrop");
    el.trigger = byId("chat-open");
    el.close = byId("chat-close");
    el.badge = byId("chat-badge");

    el.avatar = byId("chat-avatar");
    el.dot = byId("chat-dot");
    el.title = byId("chat-title");
    el.sub = byId("chat-sub");

    el.chatIntro = byId("chat-intro");
    el.chatThread = byId("chat-thread");
    el.chatOffline = byId("chat-offline");
    el.chatLoading = byId("chat-loading");

    el.blurb = byId("chat-blurb");
    el.form = byId("chat-form");
    el.name = byId("chat-name");
    el.email = byId("chat-email");
    el.emailField = byId("chat-email-field");
    el.emailNote = byId("chat-email-note");
    el.first = byId("chat-first");
    el.formError = byId("chat-form-error");
    el.start = byId("chat-start");
    el.startLabel = byId("chat-start-label");
    el.privacy = byId("chat-privacy");

    el.banner = byId("chat-banner");
    el.scroll = byId("chat-scroll");
    el.msgs = byId("chat-msgs");
    el.typing = byId("chat-typing");
    el.typingAv = byId("chat-typing-av");
    el.typingSr = byId("chat-typing-sr");
    el.jump = byId("chat-jump");
    el.composer = byId("chat-composer");
    el.input = byId("chat-input");
    el.counter = byId("chat-counter");
    el.send = byId("chat-send");
    el.footNote = byId("chat-foot-note");
    el.reset = byId("chat-reset");

    el.offlineTitle = byId("chat-offline-title");
    el.offlineText = byId("chat-offline-text");
    el.retry = byId("chat-retry");
  }

  function applyCopy() {
    if (el.blurb) {
      el.blurb.textContent =
        CHAT.intro || "Tell me your name and what you're working on — I'll get back to you here.";
    }
    if (el.startLabel) el.startLabel.textContent = CHAT.startLabel || "Start chatting";
    if (el.privacy) el.privacy.textContent = CHAT.privacy || "";
    if (el.emailNote) el.emailNote.textContent = CHAT.emailNote || "";
    if (el.input && CHAT.placeholder) el.input.placeholder = CHAT.placeholder;
    if (el.emailField && CHAT.askEmail === false) el.emailField.hidden = true;
    paintHeader();
  }

  function initChat() {
    cacheElements();
    if (!el.chat || !el.trigger || !el.panel) return;

    applyCopy();

    el.trigger.addEventListener("click", function (e) {
      e.preventDefault();
      toggle();
    });
    el.close.addEventListener("click", close);
    el.backdrop.addEventListener("click", function () {
      /* On desktop the backdrop is decorative and clicks fall through to
         the page; only the sheet treats it as "dismiss". */
      close();
    });

    el.form.addEventListener("submit", submitIntro);
    el.name.addEventListener("input", function () {
      el.name.classList.remove("is-invalid");
      formError("");
    });

    /* Ctrl/Cmd+Enter in the opening message submits the form, matching
       what the composer does once the conversation exists. */
    if (el.first) {
      el.first.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (typeof el.form.requestSubmit === "function") el.form.requestSubmit();
          else submitIntro(new Event("submit"));
        }
      });
    }

    el.composer.addEventListener("submit", sendMessage);
    el.input.addEventListener("input", onCompose);
    el.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    el.input.addEventListener("blur", stopTyping);

    el.scroll.addEventListener("scroll", onScroll, { passive: true });
    el.jump.addEventListener("click", function () {
      scrollToEnd(false);
      markRead();
    });
    el.reset.addEventListener("click", onReset);
    el.retry.addEventListener("click", function () {
      state.started = false;
      state.wsFailures = 0;
      state.reconnectDelay = RECONNECT_MIN;
      setView("loading");
      state.started = true;
      bootstrap();
    });

    /* Esc closes; nothing else in the panel uses it. */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !state.open) return;
      /* The project modal is above the chat in the stack when open, so let
         it handle its own Escape first. */
      var modal = byId("modal");
      if (modal && !modal.hidden) return;
      close();
    });

    /* Keep focus inside the panel while it is a modal sheet. */
    el.panel.addEventListener("keydown", trapTab);

    /* A tab returning to the foreground may have missed messages. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden || !state.session) return;
      if (state.connected) catchUp();
      else if (state.usingRest) poll();
      else if (state.started && state.view === "thread") connect();
    });

    /* Rotating a phone can move between sheet and card layouts. */
    window.addEventListener("resize", function () {
      if (!state.open) return;
      var sheet = isSheet();
      el.panel.setAttribute("aria-modal", sheet ? "true" : "false");
      document.body.classList.toggle("is-locked", sheet);
    });

    updateCounter();
    autoGrow();
    state.ready = true;
  }

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapTab(e) {
    if (e.key !== "Tab" || !state.open || !isSheet()) return;

    var nodes = [];
    var all = el.panel.querySelectorAll(FOCUSABLE);
    for (var i = 0; i < all.length; i++) {
      if (all[i].offsetParent !== null) nodes.push(all[i]);
    }
    if (!nodes.length) return;

    var first = nodes[0];
    var last = nodes[nodes.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* =====================================================================
     Public surface — main.js calls init(); the rest is for the console
     and for anything else that wants to open the chat (a hero button,
     a contact-section link, and so on):

       Portfolio.chat.open();
       Portfolio.chat.close();
     ===================================================================== */
  P.chat = {
    init: initChat,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: function () {
      return state.open;
    }
  };
})();
