/* =====================================================================
   Chandan Gupta — Portfolio
   js/three-scene.js
   ---------------------------------------------------------------------
   Two lightweight WebGL scenes, built with core Three.js only (no addon
   modules), so the page runs from a plain <script> tag — even from
   file://. There is no post-processing pass: the bloom look is faked
   with additive fresnel shells and a radial glow plane, which costs a
   fraction of what an EffectComposer chain would.

     · Hero    — displaced glass orb, wireframe shells, orbiting
                 particles, parallax starfield
     · Contact — slowly turning wireframe torus knot + particle halo

   Both scenes share one requestAnimationFrame loop, pause when scrolled
   out of view or when the tab is hidden, and scale their particle counts
   to the device tier reported by main.js.
   ===================================================================== */
(function () {
  "use strict";

  if (typeof window.THREE === "undefined") return;

  var THREE = window.THREE;
  window.Portfolio = window.Portfolio || {};

  /* ===================================================================
     TUNING PER DEVICE TIER
     =================================================================== */
  var TIERS = {
    low:  { orbit: 520,  stars: 700,  detail: 3, shell: 2, contactPts: 260, contactSeg: 96,  pixelRatio: 1.5, antialias: false, fps: 32 },
    mid:  { orbit: 1100, stars: 1600, detail: 4, shell: 3, contactPts: 520, contactSeg: 128, pixelRatio: 1.75, antialias: true,  fps: 60 },
    high: { orbit: 1700, stars: 2500, detail: 5, shell: 3, contactPts: 760, contactSeg: 160, pixelRatio: 2,    antialias: true,  fps: 60 }
  };

  var COLORS = {
    cyan: new THREE.Color("#22d3ee"),
    blue: new THREE.Color("#4d7cfe"),
    purple: new THREE.Color("#a855f7"),
    deep: new THREE.Color("#0a1030")
  };

  /* ===================================================================
     SHADERS
     =================================================================== */

  /* ---- Orb core: layered-sine displacement + fresnel glass rim ---- */
  var ORB_VERT = [
    "uniform float uTime;",
    "uniform float uAmp;",
    "uniform float uBurst;",
    "varying vec3 vNormal;",
    "varying vec3 vViewPos;",
    "varying float vDisp;",

    /* Cheap organic wobble: three sines beat against each other. */
    "float wob(vec3 p, float t) {",
    "  return sin(p.x * 2.2 + t * 0.9) * sin(p.y * 2.6 - t * 0.7) * sin(p.z * 2.4 + t * 0.55);",
    "}",

    "void main() {",
    "  vec3 p = position;",
    "  float n = wob(p, uTime) + wob(p * 2.15 + 4.0, uTime * 1.35) * 0.45;",
    "  float d = n * uAmp * (1.0 + uBurst * 2.2);",
    "  vDisp = n;",
    "  vec3 displaced = p + normal * d;",
    "  vNormal = normalize(normalMatrix * normal);",
    "  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);",
    "  vViewPos = mv.xyz;",
    "  gl_Position = projectionMatrix * mv;",
    "}"
  ].join("\n");

  var ORB_FRAG = [
    "uniform vec3 uColorA;",
    "uniform vec3 uColorB;",
    "uniform vec3 uColorC;",
    "uniform float uBurst;",
    "varying vec3 vNormal;",
    "varying vec3 vViewPos;",
    "varying float vDisp;",

    "void main() {",
    "  vec3 V = normalize(-vViewPos);",
    "  float fres = pow(1.0 - clamp(dot(normalize(vNormal), V), 0.0, 1.0), 2.3);",
    "  float t = clamp(vDisp * 1.6 + 0.5, 0.0, 1.0);",
    "  vec3 base = mix(uColorA, uColorB, t);",
    "  base = mix(base, uColorC, fres * 0.8);",
    /* Dark glassy interior, bright neon edge. */
    "  float interior = 0.05 + 0.13 * t;",
    "  vec3 col = base * (interior + fres * 1.55) + uColorC * uBurst * 0.5;",
    "  float alpha = clamp(0.26 + fres * 0.92, 0.0, 1.0);",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  /* ---- Additive fresnel shell: stands in for a bloom pass ---- */
  var SHELL_VERT = [
    "varying vec3 vNormal;",
    "varying vec3 vViewPos;",
    "void main() {",
    "  vNormal = normalize(normalMatrix * normal);",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  vViewPos = mv.xyz;",
    "  gl_Position = projectionMatrix * mv;",
    "}"
  ].join("\n");

  var SHELL_FRAG = [
    "uniform vec3 uColor;",
    "uniform float uStrength;",
    "uniform float uPower;",
    "varying vec3 vNormal;",
    "varying vec3 vViewPos;",
    "void main() {",
    "  vec3 V = normalize(-vViewPos);",
    "  float f = pow(1.0 - clamp(dot(normalize(vNormal), V), 0.0, 1.0), uPower);",
    "  gl_FragColor = vec4(uColor, f * uStrength);",
    "}"
  ].join("\n");

  /* ---- Particles: soft round sprites, twinkling, size-attenuated ---- */
  var PARTICLE_VERT = [
    "attribute float aSize;",
    "attribute float aSeed;",
    "uniform float uTime;",
    "uniform float uPixelRatio;",
    "uniform float uBurst;",
    "uniform float uDrift;",
    "uniform float uScale;",
    "uniform float uMaxPx;",
    "varying float vAlpha;",
    "varying float vSeed;",
    "void main() {",
    "  vec3 p = position;",
    "  float t = uTime * 0.3 + aSeed * 6.2831;",
    "  p += vec3(sin(t), cos(t * 1.27), sin(t * 0.73)) * uDrift;",
    "  p *= 1.0 + uBurst * 0.55;",
    "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
    "  gl_Position = projectionMatrix * mv;",
    /* Perspective attenuation is 1/z, and the near edge of the orbit cloud
       sits ~2.4 units from the camera while the far edge is ~12 — a 5x
       spread. Without the clamp the nearest sprites blow up into blobs
       big enough to wash out the hero copy, so the size is capped in CSS
       pixels and only then scaled to device pixels. */
    "  float px = aSize * uScale / max(-mv.z, 0.001);",
    "  gl_PointSize = clamp(px, 0.85, uMaxPx) * uPixelRatio;",
    "  vAlpha = 0.32 + 0.68 * (0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 24.0));",
    "  vSeed = aSeed;",
    "}"
  ].join("\n");

  var PARTICLE_FRAG = [
    "uniform vec3 uColorA;",
    "uniform vec3 uColorB;",
    "uniform float uOpacity;",
    "varying float vAlpha;",
    "varying float vSeed;",
    "void main() {",
    "  vec2 uv = gl_PointCoord - 0.5;",
    "  float d = length(uv);",
    "  if (d > 0.5) discard;",
    "  float glow = smoothstep(0.5, 0.0, d);",
    "  vec3 c = mix(uColorA, uColorB, vSeed);",
    "  gl_FragColor = vec4(c, glow * glow * vAlpha * uOpacity);",
    "}"
  ].join("\n");

  /* ---- Radial glow plane behind the orb ---- */
  var GLOW_VERT = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  var GLOW_FRAG = [
    "uniform vec3 uColorA;",
    "uniform vec3 uColorB;",
    "uniform float uTime;",
    "uniform float uStrength;",
    "varying vec2 vUv;",
    "void main() {",
    "  float d = length(vUv - 0.5) * 2.0;",
    "  float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.7);",
    "  float pulse = 0.86 + 0.14 * sin(uTime * 0.9);",
    "  vec3 c = mix(uColorA, uColorB, clamp(d, 0.0, 1.0));",
    "  gl_FragColor = vec4(c, a * uStrength * pulse);",
    "}"
  ].join("\n");

  /* ===================================================================
     HELPERS
     =================================================================== */

  /* Points distributed through a spherical shell (inner → outer radius) */
  function shellPoints(count, rMin, rMax, sizeMin, sizeMax, flatten) {
    var positions = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    var seeds = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      /* Even spherical distribution */
      var u = Math.random() * 2 - 1;
      var theta = Math.random() * Math.PI * 2;
      var s = Math.sqrt(1 - u * u);
      var r = rMin + Math.random() * (rMax - rMin);

      positions[i * 3] = Math.cos(theta) * s * r;
      positions[i * 3 + 1] = u * r * (flatten || 1);
      positions[i * 3 + 2] = Math.sin(theta) * s * r;

      sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      seeds[i] = Math.random();
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }

  /* Points spread through a box — used for the background starfield */
  function boxPoints(count, spread, depth) {
    var positions = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    var seeds = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.75;
      positions[i * 3 + 2] = -Math.random() * depth - 2;
      sizes[i] = 0.7 + Math.random() * 2.1;
      seeds[i] = Math.random();
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }

  /* opts: { scale, maxPx } — scale sets the world-to-pixel factor and
     maxPx the CSS-pixel ceiling for the sprites nearest the camera. */
  function particleMaterial(colorA, colorB, opacity, drift, pixelRatio, opts) {
    opts = opts || {};
    return new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uBurst: { value: 0 },
        uDrift: { value: drift },
        uOpacity: { value: opacity },
        uScale: { value: opts.scale || 12 },
        uMaxPx: { value: opts.maxPx || 4.5 },
        uColorA: { value: colorA.clone() },
        uColorB: { value: colorB.clone() }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  function fresnelShell(radius, detail, color, strength, power) {
    return new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, detail),
      new THREE.ShaderMaterial({
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
        uniforms: {
          uColor: { value: color.clone() },
          uStrength: { value: strength },
          uPower: { value: power }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    );
  }

  function wireShell(radius, detail, color, opacity) {
    return new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(radius, detail)),
      new THREE.LineBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
  }

  /* ===================================================================
     SCENE STATE
     =================================================================== */
  var state = {
    running: false,
    tier: "mid",
    conf: TIERS.mid,
    reducedMotion: false,
    /* Scene clock. `sceneTime` is advanced by the frame loop instead of read
       from a THREE.Clock so that `timeScale` can slow every animated quantity
       at once — see frame(). */
    sceneTime: 0,
    timeScale: 1,
    mobile: false,
    pixelRatio: 1,
    rafId: 0,
    lastFrame: 0,
    burst: 0,
    burstDecay: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    scenes: [],
    ready: false
  };

  /* ===================================================================
     HERO SCENE
     =================================================================== */
  function buildHero(canvas, conf) {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: conf.antialias,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(state.pixelRatio);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
    camera.position.set(0, 0, 7);

    /* ---- Orb assembly ---- */
    var orb = new THREE.Group();

    var coreMat = new THREE.ShaderMaterial({
      vertexShader: ORB_VERT,
      fragmentShader: ORB_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.14 },
        uBurst: { value: 0 },
        uColorA: { value: COLORS.deep.clone() },
        uColorB: { value: COLORS.blue.clone() },
        uColorC: { value: COLORS.cyan.clone() }
      },
      transparent: true
    });

    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, conf.detail), coreMat);
    orb.add(core);

    /* Two additive shells read as a soft bloom around the core */
    var glowShell = fresnelShell(1.42, conf.shell, COLORS.cyan, 0.5, 3.0);
    var wideShell = fresnelShell(1.85, conf.shell, COLORS.purple, 0.22, 2.2);
    orb.add(glowShell, wideShell);

    /* Wireframe cages, counter-rotating */
    var wireA = wireShell(1.98, 1, COLORS.cyan, 0.16);
    var wireB = wireShell(2.55, 0, COLORS.purple, 0.13);
    orb.add(wireA, wireB);

    /* Vertex dots on an outer shell */
    var dotsGeo = new THREE.IcosahedronGeometry(2.22, 2);
    var dotsMat = particleMaterial(COLORS.cyan, COLORS.blue, 0.7, 0.0, state.pixelRatio,
      { scale: 9, maxPx: 3.2 });
    var dotCount = dotsGeo.attributes.position.count;
    var dotSizes = new Float32Array(dotCount);
    var dotSeeds = new Float32Array(dotCount);
    for (var d = 0; d < dotCount; d++) {
      dotSizes[d] = 1.1 + Math.random() * 1.2;
      dotSeeds[d] = Math.random();
    }
    dotsGeo.setAttribute("aSize", new THREE.BufferAttribute(dotSizes, 1));
    dotsGeo.setAttribute("aSeed", new THREE.BufferAttribute(dotSeeds, 1));
    var dots = new THREE.Points(dotsGeo, dotsMat);
    orb.add(dots);

    /* Orbiting particle cloud */
    var orbitGeo = shellPoints(conf.orbit, 2.3, 4.6, 0.9, 2.6, 0.72);
    var orbitMat = particleMaterial(COLORS.cyan, COLORS.purple, 0.5, 0.05, state.pixelRatio,
      { scale: 12, maxPx: 4.6 });
    var orbitPoints = new THREE.Points(orbitGeo, orbitMat);
    orb.add(orbitPoints);

    /* Fake-bloom glow plane, always behind the orb */
    var glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0.42 },
        uColorA: { value: COLORS.blue.clone() },
        uColorB: { value: COLORS.purple.clone() }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    var glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), glowMat);
    glowPlane.position.z = -1.6;
    orb.add(glowPlane);

    /* Everything in the orb is transparent, and transparent draw order in
       Three.js is a distance sort — every child shares the same centre, so
       that sort is a tie. Pin the order explicitly: the core must write
       depth before the additive shells test against it, otherwise the
       "bloom" leaks over the front of the orb instead of hugging its edge. */
    glowPlane.renderOrder = -1;
    core.renderOrder = 0;
    glowShell.renderOrder = 1;
    wideShell.renderOrder = 2;
    wireA.renderOrder = 3;
    wireB.renderOrder = 3;
    dots.renderOrder = 4;
    orbitPoints.renderOrder = 5;

    scene.add(orb);

    /* Vertical rest position, rewritten by layout() per breakpoint. */
    var baseY = 0;

    /* ---- Starfield (parallax layer, independent of the orb) ---- */
    var starGeo = boxPoints(conf.stars, 46, 34);
    var starMat = particleMaterial(new THREE.Color("#ffffff"), COLORS.cyan, 0.38, 0.02, state.pixelRatio,
      { scale: 11, maxPx: 2.2 });
    var stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* Subtle real lights so the composition has physical depth cues even
       though most materials are shader-driven. */
    var key = new THREE.PointLight(COLORS.cyan.getHex(), 18, 24, 2);
    key.position.set(3, 2.5, 4);
    var rim = new THREE.PointLight(COLORS.purple.getHex(), 14, 24, 2);
    rim.position.set(-3.5, -2, 2.5);
    scene.add(key, rim, new THREE.AmbientLight(0x223055, 0.6));

    var entry = {
      name: "hero",
      canvas: canvas,
      renderer: renderer,
      scene: scene,
      camera: camera,
      visible: true,
      materials: [coreMat, orbitMat, dotsMat, starMat, glowMat],
      burstTargets: [coreMat, orbitMat, dotsMat],

      layout: function (w, h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);

        /* Composition: orb sits to the right of the copy on wide screens,
           centred and lifted above the text on phones. */
        var narrow = w < 900;
        orb.position.x = narrow ? 0 : Math.min(Math.max(camera.aspect * 1.32, 1.15), 2.85);
        orb.position.z = narrow ? -0.6 : 0;
        orb.scale.setScalar(narrow ? (w < 560 ? 0.66 : 0.8) : 1);
        baseY = narrow ? 0.85 : 0;
        glowMat.uniforms.uStrength.value = narrow ? 0.3 : 0.42;
      },

      update: function (t, dt, pointer) {
        coreMat.uniforms.uTime.value = t;
        glowMat.uniforms.uTime.value = t;
        orbitMat.uniforms.uTime.value = t;
        dotsMat.uniforms.uTime.value = t;
        starMat.uniforms.uTime.value = t;

        core.rotation.y = t * 0.14;
        core.rotation.x = t * 0.06;
        wireA.rotation.y = -t * 0.1;
        wireA.rotation.z = t * 0.05;
        wireB.rotation.y = t * 0.07;
        wireB.rotation.x = -t * 0.04;
        dots.rotation.y = t * 0.05;
        orbitPoints.rotation.y = -t * 0.045;
        orbitPoints.rotation.z = t * 0.02;

        /* Float + mouse-led tilt, both eased toward the layout rest point.
           Only the float is time-driven, so it slows with the scene clock
           under reduced motion; the tilt stays responsive because it answers
           the pointer rather than animating on its own. */
        orb.position.y += (baseY + Math.sin(t * 0.6) * 0.13 - orb.position.y) * 0.06;
        orb.rotation.y += (pointer.x * 0.4 - orb.rotation.y) * 0.05;
        orb.rotation.x += (-pointer.y * 0.28 - orb.rotation.x) * 0.05;

        stars.rotation.y = t * 0.012;
        stars.position.x = -pointer.x * 1.1;
        stars.position.y = pointer.y * 0.7;

        camera.position.x += (pointer.x * 0.42 - camera.position.x) * 0.045;
        camera.position.y += (-pointer.y * 0.3 - camera.position.y) * 0.045;
        camera.lookAt(0, 0, 0);
      },

      dispose: function () {
        [core, glowShell, wideShell, wireA, wireB, dots, orbitPoints, glowPlane, stars]
          .forEach(function (obj) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
      }
    };

    return entry;
  }

  /* ===================================================================
     CONTACT SCENE — wireframe torus knot + halo
     =================================================================== */
  function buildContact(canvas, conf) {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: conf.antialias,
      alpha: true,
      powerPreference: "default"
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(state.pixelRatio, 1.75));
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
    camera.position.set(0, 0, 6.4);

    var group = new THREE.Group();

    var knotGeo = new THREE.TorusKnotGeometry(1.5, 0.42, conf.contactSeg, 12, 2, 3);
    var knot = new THREE.LineSegments(
      new THREE.WireframeGeometry(knotGeo),
      new THREE.LineBasicMaterial({
        color: COLORS.blue.getHex(),
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    group.add(knot);

    var knotGlow = new THREE.Mesh(
      knotGeo,
      new THREE.ShaderMaterial({
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
        uniforms: {
          uColor: { value: COLORS.cyan.clone() },
          uStrength: { value: 0.3 },
          uPower: { value: 2.6 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    group.add(knotGlow);

    var haloGeo = shellPoints(conf.contactPts, 2.6, 5.4, 0.8, 2.4, 0.55);
    var haloMat = particleMaterial(COLORS.purple, COLORS.cyan, 0.5, 0.04, state.pixelRatio,
      { scale: 12, maxPx: 4 });
    var halo = new THREE.Points(haloGeo, haloMat);
    group.add(halo);

    scene.add(group);

    return {
      name: "contact",
      canvas: canvas,
      renderer: renderer,
      scene: scene,
      camera: camera,
      visible: false,
      materials: [haloMat],
      burstTargets: [haloMat],

      layout: function (w, h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        var narrow = w < 900;
        group.scale.setScalar(narrow ? 0.72 : 1);
      },

      update: function (t, dt, pointer) {
        haloMat.uniforms.uTime.value = t;

        group.rotation.y = t * 0.11;
        group.rotation.x = Math.sin(t * 0.22) * 0.32;
        halo.rotation.y = -t * 0.05;

        camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.35 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      },

      dispose: function () {
        [knot, knotGlow, halo].forEach(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
        knotGeo.dispose();
      }
    };
  }

  /* ===================================================================
     SHARED LOOP / LIFECYCLE
     =================================================================== */
  function sizeOf(canvas) {
    var r = canvas.getBoundingClientRect();
    return {
      w: Math.max(1, Math.round(r.width || canvas.clientWidth || window.innerWidth)),
      h: Math.max(1, Math.round(r.height || canvas.clientHeight || window.innerHeight))
    };
  }

  function layoutAll() {
    state.scenes.forEach(function (s) {
      var size = sizeOf(s.canvas);
      s.layout(size.w, size.h);
      s.materials.forEach(function (m) {
        if (m.uniforms && m.uniforms.uPixelRatio) {
          m.uniforms.uPixelRatio.value = state.pixelRatio;
        }
      });
    });
  }

  function frame(now) {
    state.rafId = window.requestAnimationFrame(frame);
    if (!state.running) return;

    /* Frame pacing — low-tier devices render at a capped rate, and a
       reduced-motion visitor is looking at a near-static image, so there is
       nothing to gain from spending 60fps of battery on it. */
    var fps = state.reducedMotion ? Math.min(state.conf.fps, 30) : state.conf.fps;
    var minDelta = 1000 / fps;
    if (fps < 60 && now - state.lastFrame < minDelta - 1) return;
    var dt = Math.min((now - state.lastFrame) / 1000, 0.1);
    state.lastFrame = now;

    /* One scaled clock drives every animated quantity in both scenes —
       rotations, the orb's float, and the `uTime` uniform behind the shader
       twinkle and particle drift. Scaling here rather than at each call site
       is what makes `prefers-reduced-motion` actually quiet the canvas: the
       previous per-rotation multiplier left the shaders running at full
       speed, so the dust still shimmered. */
    state.sceneTime += dt * state.timeScale;
    var t = state.sceneTime;

    /* Ease the pointer so nothing snaps */
    state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.07;
    state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.07;

    /* Burst decays back to zero after the easter egg fires */
    if (state.burst > 0.001) {
      state.burst = Math.max(0, state.burst - dt * state.burstDecay);
    } else {
      state.burst = 0;
    }

    state.scenes.forEach(function (s) {
      if (!s.visible) return;
      s.burstTargets.forEach(function (m) {
        if (m.uniforms && m.uniforms.uBurst) m.uniforms.uBurst.value = state.burst;
      });
      s.update(t, dt, state.pointer);
      s.renderer.render(s.scene, s.camera);
    });

    if (!state.ready) {
      state.ready = true;
      state.scenes.forEach(function (s) { s.canvas.classList.add("is-ready"); });
      window.dispatchEvent(new CustomEvent("portfolio:scene-ready"));
    }
  }

  function observeVisibility(entry) {
    if (typeof window.IntersectionObserver === "undefined") {
      entry.visible = true;
      return;
    }
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (e) { entry.visible = e.isIntersecting; });
    }, { rootMargin: "120px" });
    io.observe(entry.canvas);
  }

  function bindPointer() {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      state.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* Gyro-free touch fallback: follow the finger while it is down */
    window.addEventListener("touchmove", function (e) {
      if (!e.touches || !e.touches.length) return;
      state.pointer.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      state.pointer.ty = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* Recentre when the cursor leaves the window */
    document.addEventListener("mouseleave", function () {
      state.pointer.tx = 0;
      state.pointer.ty = 0;
    });
  }

  var resizeTimer = null;
  function bindResize() {
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        state.pixelRatio = Math.min(window.devicePixelRatio || 1, state.conf.pixelRatio);
        state.scenes.forEach(function (s) {
          s.renderer.setPixelRatio(s.name === "contact"
            ? Math.min(state.pixelRatio, 1.75)
            : state.pixelRatio);
        });
        layoutAll();
      }, 160);
    });

    /* Pause everything while the tab is in the background */
    document.addEventListener("visibilitychange", function () {
      state.running = !document.hidden;
      if (state.running) state.lastFrame = performance.now();
    });
  }

  function guardContextLoss(entry) {
    entry.canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      entry.visible = false;
      if (window.console && console.warn) {
        console.warn("[portfolio] WebGL context lost for the " + entry.name + " scene.");
      }
    });

    entry.canvas.addEventListener("webglcontextrestored", function () {
      entry.visible = true;
      layoutAll();
    });
  }

  /* ===================================================================
     PUBLIC API
     =================================================================== */
  window.Portfolio.scene = {
    init: function (opts) {
      opts = opts || {};
      if (state.scenes.length) return;

      state.tier = TIERS[opts.tier] ? opts.tier : "mid";
      state.conf = TIERS[state.tier];
      state.reducedMotion = !!opts.reducedMotion;
      /* Not zero: a completely frozen orb reads as a failed render rather
         than a still image. 8% keeps it perceptibly alive over tens of
         seconds without any motion the eye tracks. */
      state.timeScale = state.reducedMotion ? 0.08 : 1;
      state.mobile = !!opts.mobile;
      state.pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        Math.min(opts.maxPixelRatio || 2, state.conf.pixelRatio)
      );

      var heroCanvas = document.getElementById("hero-canvas");
      var contactCanvas = document.getElementById("contact-canvas");

      if (heroCanvas) {
        var hero = buildHero(heroCanvas, state.conf);
        state.scenes.push(hero);
        observeVisibility(hero);
        guardContextLoss(hero);
      }

      /* The contact scene is a nice-to-have: skipped on low-tier devices
         so phones spend their budget on the hero. */
      if (contactCanvas && state.tier !== "low") {
        var contact = buildContact(contactCanvas, state.conf);
        state.scenes.push(contact);
        observeVisibility(contact);
        guardContextLoss(contact);
      }

      if (!state.scenes.length) return;

      state.lastFrame = performance.now();
      state.running = true;

      layoutAll();
      bindPointer();
      bindResize();

      /* Schedule rather than render inline: rendering here would dispatch
         portfolio:scene-ready synchronously, before main.js has finished
         booting and attached its loader listener. */
      state.rafId = window.requestAnimationFrame(frame);
    },

    /* Easter egg hook — expands the orb and scatters the particles */
    burst: function () {
      state.burst = 1;
      state.burstDecay = 0.7;
    },

    /* Not used by the page, but keeps the module honest for reuse */
    destroy: function () {
      state.running = false;
      window.cancelAnimationFrame(state.rafId);
      state.scenes.forEach(function (s) {
        s.dispose();
        s.renderer.dispose();
      });
      state.scenes = [];
      state.ready = false;
    },

    isRunning: function () { return state.running; },
    tier: function () { return state.tier; }
  };
})();
