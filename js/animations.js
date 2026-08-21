/* =====================================================================
   Chandan Gupta — Portfolio
   js/animations.js
   ---------------------------------------------------------------------
   Every scroll-driven and entrance animation on the page, in one place.

   Design rules this file follows:
     · CSS owns the *hidden* state ([data-reveal] starts at opacity 0),
       JS owns the *reveal*. That way the page degrades to a fallback
       IntersectionObserver path, or to "everything visible" if both
       GSAP and IntersectionObserver are missing.
     · Any element whose stylesheet declares its own `transform` (hover
       lifts, the 3D tilt helper, the ambient CSS keyframes) must not be
       left with an inline transform — GSAP tweens clear it on complete.
     · prefers-reduced-motion skips all of it and simply shows content.

   Exposes: window.Portfolio.animations = { init, refresh, revealAll }
   ===================================================================== */
(function () {
  "use strict";

  var Portfolio = window.Portfolio = window.Portfolio || {};
  var utils = Portfolio.utils || {};

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var hasGSAP = !!(gsap && ScrollTrigger);

  /* ===================================================================
     SMALL HELPERS
     =================================================================== */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function esc(str) {
    if (typeof utils.esc === "function") return utils.esc(str);
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function reducedMotion() {
    if (typeof utils.prefersReducedMotion === "function") return utils.prefersReducedMotion();
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ===================================================================
     TEXT SPLITTING
     ---------------------------------------------------------------------
     Each word becomes an overflow-hidden mask; each character (or the
     whole word, for data-split="words") becomes a slice that slides up
     inside it. The original string is kept as an aria-label and the
     visual pieces are hidden from assistive tech, so screen readers
     never spell text out letter by letter.
     =================================================================== */
  function splitElement(el) {
    if (el.classList.contains("is-split")) return $$(".split__char", el);

    var mode = el.getAttribute("data-split") === "words" ? "words" : "chars";
    var text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return [];

    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", text);

    var html = text.split(" ").map(function (word) {
      var inner;
      if (mode === "chars") {
        inner = word.split("").map(function (ch) {
          return '<span class="split__char">' + esc(ch) + "</span>";
        }).join("");
      } else {
        inner = '<span class="split__char">' + esc(word) + "</span>";
      }
      return '<span class="split__word">' + inner + "</span>";
    }).join(" ");

    el.innerHTML = '<span aria-hidden="true">' + html + "</span>";
    el.classList.add("is-split");
    return $$(".split__char", el);
  }

  function splitAll() {
    var map = [];
    $$("[data-split]").forEach(function (el) {
      map.push({ el: el, chars: splitElement(el) });
    });
    return map;
  }

  /* ===================================================================
     REVEAL-ALL (reduced motion, or no animation support at all)
     =================================================================== */
  function revealAll() {
    $$("[data-reveal]").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.classList.add("is-visible");
      Array.prototype.forEach.call(el.children, function (kid) {
        kid.style.opacity = "1";
        kid.style.transform = "none";
      });
    });

    $$("[data-split]").forEach(function (el) {
      el.classList.add("is-visible");
      $$(".split__char", el).forEach(function (c) { c.style.transform = "none"; });
    });

    $$(".timeline__item").forEach(function (item) { item.classList.add("is-reached"); });

    var timeline = $("#timeline");
    if (timeline) timeline.style.setProperty("--timeline-progress", "1");

    var rotator = $("#role-rotator");
    if (rotator) { rotator.style.opacity = "1"; rotator.style.transform = "none"; }

    var scroll = $(".hero__scroll");
    if (scroll) { scroll.style.opacity = "1"; scroll.style.transform = "none"; }
  }

  /* ===================================================================
     GSAP PATH
     =================================================================== */

  /* Elements animated by the hero intro must be excluded from the
     generic scroll-reveal pass, or two tweens fight over them. */
  function heroRevealSet() {
    var hero = $(".hero");
    return hero ? $$("[data-reveal]", hero) : [];
  }

  /* Finishing a reveal is a two-step job.

     Clearing the inline transform is required — CSS :hover lifts and the
     3D tilt helper both declare `transform` in the stylesheet, and an
     inline transform left behind by GSAP would override them. But simply
     clearing it hands the element straight back to the base rule
     ([data-reveal="fade-up"] { transform: translateY(28px) }), which
     would leave it sitting 28px low forever.

     So retire the attribute first: once it is renamed, neither the
     opacity nor the offset rule matches any more, and the element sits at
     its natural position with no inline styles at all. */
  function finishReveal(el, targets) {
    return function () {
      var kind = el.getAttribute("data-reveal");
      if (kind !== null) {
        el.setAttribute("data-revealed", kind);
        el.removeAttribute("data-reveal");
      }
      gsap.set(targets, { clearProps: "opacity,transform" });
    };
  }

  /* For elements with no [data-reveal] base state of their own. */
  function clearTransform(targets) {
    return function () { gsap.set(targets, { clearProps: "transform" }); };
  }

  /* Split characters start hidden via the stylesheet
   (`.is-split .split__char { transform: translateY(115%) }`) so text never
   flashes before JS runs. GSAP normalises that percentage into its own
   transform cache as a *pixel* y offset — 44px for a 38px line — and
   tracks yPercent as a separate channel. Tweening yPercent alone therefore
   finishes with the pixel offset still applied, leaving every character one
   line-height low: invisible inside its overflow-hidden word mask.

   Pinning y to 0 on both ends of the tween overrides that baked value, so
   the CSS hidden state and the GSAP hidden state describe the same offset
   instead of stacking. */
  var SPLIT_FROM = { yPercent: 115, y: 0 };

  function splitTo(extra) {
    var vars = { yPercent: 0, y: 0 };
    for (var k in extra) if (extra.hasOwnProperty(k)) vars[k] = extra[k];
    return vars;
  }

  function buildHeroIntro(splitMap) {
    var hero = $(".hero");
    if (!hero) return;

    var greeting = $(".hero__greeting");
    var greetChars = [];
    splitMap.forEach(function (entry) {
      if (entry.el === greeting) greetChars = entry.chars;
    });

    var eyebrow = $(".hero__eyebrow");
    var rotator = $("#role-rotator");
    var lead = $(".hero__lead");
    var actions = $(".hero__actions");
    var meta = $(".hero__meta");
    var scrollCue = $(".hero__scroll");

    /* Pre-set the pieces CSS does not already hide, so nothing flashes
       between first paint and the loader handing over. */
    if (rotator) gsap.set(rotator, { opacity: 0, y: 18 });
    if (scrollCue) gsap.set(scrollCue, { opacity: 0, y: 14 });

    var played = false;

    function play() {
      if (played) return;
      played = true;

      var tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });

      if (eyebrow) {
        tl.fromTo(eyebrow, { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, onComplete: finishReveal(eyebrow, eyebrow) }, 0);
      }

      if (greetChars.length) {
        tl.fromTo(greetChars, SPLIT_FROM,
          splitTo({ duration: 1.1, stagger: 0.028, ease: "power4.out" }), 0.12);
      }

      if (rotator) {
        tl.to(rotator, { opacity: 1, y: 0, duration: 0.8, onComplete: clearTransform(rotator) }, 0.55);
      }

      [lead, actions, meta].forEach(function (el, i) {
        if (!el) return;
        tl.fromTo(el, { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.85, onComplete: finishReveal(el, el) }, 0.7 + i * 0.11);
      });

      if (scrollCue) {
        tl.to(scrollCue, { opacity: 1, y: 0, duration: 0.7, onComplete: clearTransform(scrollCue) }, 1.15);
      }

      /* Layout has settled by now — re-measure every scroll trigger. */
      tl.add(function () { ScrollTrigger.refresh(); });
    }

    /* main.js fires this once the loader has wiped away. If the loader
       already finished (cached reload, or it failed open), play now. */
    if (document.body.classList.contains("is-loaded")) play();
    else window.addEventListener("portfolio:loaded", play, { once: true });

    /* Failsafe: never let the hero sit invisible because an event was
       missed for any reason. */
    window.setTimeout(play, 6000);
  }

  function buildScrollReveals() {
    var skip = heroRevealSet();

    $$("[data-reveal]").forEach(function (el) {
      if (skip.indexOf(el) !== -1) return;

      var kind = el.getAttribute("data-reveal");
      var trigger = { trigger: el, start: "top 88%", once: true };

      if (kind === "stagger") {
        var kids = Array.prototype.slice.call(el.children);
        if (!kids.length) return;
        gsap.fromTo(kids, { opacity: 0, y: 26 }, {
          opacity: 1, y: 0, duration: 0.85, stagger: 0.075, ease: "power3.out",
          scrollTrigger: trigger, onComplete: finishReveal(el, kids)
        });
        return;
      }

      if (kind === "fade") {
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: 1, duration: 1.05, ease: "power2.out",
          scrollTrigger: trigger, onComplete: finishReveal(el, el)
        });
        return;
      }

      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.95, ease: "power3.out",
        scrollTrigger: trigger, onComplete: finishReveal(el, el)
      });
    });

    /* The traits list is rendered by main.js without a reveal attribute
       so it can cascade independently of the card that holds it. */
    var traits = $$("#traits-list > *");
    if (traits.length) {
      gsap.fromTo(traits, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "power3.out",
        scrollTrigger: { trigger: "#traits-list", start: "top 88%", once: true },
        onComplete: function () { gsap.set(traits, { clearProps: "opacity,transform" }); }
      });
    }
  }

  function buildSplitReveals(splitMap) {
    var greeting = $(".hero__greeting");

    splitMap.forEach(function (entry) {
      if (entry.el === greeting || !entry.chars.length) return;

      gsap.fromTo(entry.chars, SPLIT_FROM, splitTo({
        duration: 1,
        stagger: entry.el.getAttribute("data-split") === "words" ? 0.06 : 0.022,
        ease: "power4.out",
        scrollTrigger: { trigger: entry.el, start: "top 90%", once: true }
      }));
    });
  }

  function buildCounters() {
    $$("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (!isFinite(target)) return;

      /* Keep whatever suffix the config added ("+", "%", …). */
      var suffix = (el.textContent || "").trim().replace(/^-?[\d.,]+/, "");
      var decimals = (String(target).split(".")[1] || "").length;
      var proxy = { value: 0 };

      el.textContent = (0).toFixed(decimals) + suffix;

      gsap.to(proxy, {
        value: target,
        duration: 1.7,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 94%", once: true },
        onUpdate: function () { el.textContent = proxy.value.toFixed(decimals) + suffix; },
        onComplete: function () { el.textContent = target.toFixed(decimals) + suffix; }
      });
    });
  }

  function buildJourney() {
    var timeline = $("#timeline");
    if (!timeline) return;

    /* Line fill follows scroll position through the timeline block. */
    ScrollTrigger.create({
      trigger: timeline,
      start: "top 72%",
      end: "bottom 78%",
      onUpdate: function (self) {
        timeline.style.setProperty("--timeline-progress", self.progress.toFixed(4));
      },
      onLeave: function () { timeline.style.setProperty("--timeline-progress", "1"); },
      onLeaveBack: function () { timeline.style.setProperty("--timeline-progress", "0"); }
    });

    /* Markers light up as each entry is reached. */
    $$(".timeline__item", timeline).forEach(function (item) {
      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        onEnter: function () { item.classList.add("is-reached"); },
        onLeaveBack: function () { item.classList.remove("is-reached"); }
      });
    });
  }

  function buildParallax() {
    var hero = $(".hero");
    var content = $(".hero__content");
    var canvas = $("#hero-canvas");

    /* Only elements with no stylesheet transform of their own are
       parallaxed — the ambient glows run CSS keyframes on transform and
       project glyphs move on hover, so both are deliberately left alone. */
    if (hero && content) {
      gsap.to(content, {
        yPercent: -12, opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.5 }
      });
    }

    if (hero && canvas) {
      gsap.to(canvas, {
        yPercent: -7, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.8 }
      });
    }

    $$(".section__head").forEach(function (head) {
      gsap.fromTo(head, { y: 26 }, {
        y: -18, ease: "none",
        scrollTrigger: { trigger: head, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });
  }

  /* Re-measure after anything that can change document height. */
  function bindRefreshHooks() {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });

    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); }).catch(function () {});
    }

    /* Project artwork images are lazy — each one that lands can shift
       the grid, and any that fail are removed by main.js. */
    $$("img[data-fallback-art]").forEach(function (img) {
      if (img.complete) return;
      img.addEventListener("load", function () { ScrollTrigger.refresh(); });
      img.addEventListener("error", function () { ScrollTrigger.refresh(); });
    });

    window.addEventListener("portfolio:loaded", function () {
      window.setTimeout(function () { ScrollTrigger.refresh(); }, 120);
    });
  }

  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    /* Mobile browsers resize the viewport when the URL bar hides; without
       this every trigger re-measures mid-scroll and content jumps. */
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: "power3.out", duration: 0.9 });

    var splitMap = splitAll();

    if (reducedMotion()) {
      revealAll();
      return;
    }

    buildHeroIntro(splitMap);
    buildScrollReveals();
    buildSplitReveals(splitMap);
    buildCounters();
    buildJourney();
    buildParallax();
    bindRefreshHooks();
  }

  /* ===================================================================
     FALLBACK PATH — no GSAP on the page
     ---------------------------------------------------------------------
     The stylesheet's `.no-gsap` rules give [data-reveal] / [data-split]
     CSS transitions that trip on an `.is-visible` class, so all this has
     to do is hand out that class at the right moment.
     =================================================================== */
  function initFallback() {
    splitAll();

    if (reducedMotion() || typeof window.IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    $$("[data-reveal], [data-split]").forEach(function (el) { observer.observe(el); });

    /* Hero copy is above the fold — show it as soon as the loader goes. */
    function showHero() {
      var hero = $(".hero");
      if (!hero) return;
      $$("[data-reveal], [data-split]", hero).forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
    if (document.body.classList.contains("is-loaded")) showHero();
    else window.addEventListener("portfolio:loaded", showHero, { once: true });

    fallbackCounters();
    fallbackJourney();
  }

  function fallbackCounters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (!isFinite(target)) return;

      var suffix = (el.textContent || "").trim().replace(/^-?[\d.,]+/, "");
      var decimals = (String(target).split(".")[1] || "").length;
      var start = 0;
      var duration = 1600;

      function step(now) {
        if (!start) start = now;
        var p = Math.min((now - start) / duration, 1);
        /* easeOutCubic */
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (typeof window.IntersectionObserver === "undefined") {
      nodes.forEach(run);
      return;
    }

    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.2 });

    nodes.forEach(function (el) { io.observe(el); });
  }

  function fallbackJourney() {
    var timeline = $("#timeline");
    if (!timeline) return;

    var items = $$(".timeline__item", timeline);
    var ticking = false;

    function update() {
      ticking = false;
      var rect = timeline.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var startY = vh * 0.72;
      var span = rect.height + (vh * 0.72 - vh * 0.22);
      var progress = span > 0 ? (startY - rect.top) / span : 0;
      progress = Math.min(Math.max(progress, 0), 1);
      timeline.style.setProperty("--timeline-progress", progress.toFixed(4));

      items.forEach(function (item) {
        var r = item.getBoundingClientRect();
        if (r.top < vh * 0.8) item.classList.add("is-reached");
        else item.classList.remove("is-reached");
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ===================================================================
     PUBLIC API
     =================================================================== */
  Portfolio.animations = {
    init: function () {
      if (hasGSAP) initGSAP();
      else initFallback();
    },

    refresh: function () {
      if (hasGSAP && ScrollTrigger) ScrollTrigger.refresh();
    },

    revealAll: revealAll
  };
})();
