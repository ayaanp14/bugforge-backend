/**
 * Runs inside the page, ahead of the composition. Two jobs.
 *
 * Time: the renderer asks for frame i at t = i / fps, in any order and from
 * several pages at once, so a picture has to be a pure function of t. The
 * clocks and timers a composition could lean on are taken away here rather
 * than left to the prompt: a timer throws (a real error the review loop reads),
 * time reads as zero, and Math.random restarts from the same seed every frame.
 * CSS animations and transitions are off in the stylesheet for the same reason.
 *
 * Chrome: the header and the captions are the runtime's, so every video reads
 * as CodeKairo whatever the model draws, and the captions cannot drift from
 * what was actually said.
 */
(() => {
  const DATA = window.__CK_DATA;
  const { timeline, frame, code } = DATA;

  const refuse = (name) => () => {
    throw new Error(`${name} is not available: draw from t inside CK.render(fn)`);
  };
  window.setTimeout = refuse("setTimeout");
  window.setInterval = refuse("setInterval");
  window.requestAnimationFrame = refuse("requestAnimationFrame");
  Date.now = () => 0;
  performance.now = () => 0;
  let seed = 1;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = {
    linear: (p) => p,
    out: (p) => 1 - (1 - p) ** 3,
    inOut: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
    back: (p) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2,
  };
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

  const scene = (id) => {
    const found = timeline.scenes.find((s) => s.id === id);
    if (!found) throw new Error(`no scene "${id}" in this cut`);
    return found;
  };

  /** Seconds at which a phrase starts being said. A phrase not in the narration throws, so a cue cannot silently drift. */
  const cue = (sceneId, phrase) => {
    const s = scene(sceneId);
    const want = norm(phrase);
    const said = s.words.map((w) => norm(w.w).join(" "));
    for (let i = 0; i + want.length <= said.length; i++) {
      if (want.every((w, j) => said[i + j] === w)) return s.words[i].t;
    }
    throw new Error(`cue "${phrase}" is not in the narration of "${sceneId}"`);
  };

  /** 0 to 1 between two times, eased. */
  const p = (t, from, to, curve = ease.out) => (to <= from ? (t >= from ? 1 : 0) : curve(clamp((t - from) / (to - from))));
  const mix = (a, b, v) => a + (b - a) * v;

  /** Fades and lifts an element in from `at`; out from `until`, if given. */
  const reveal = (el, t, at, until = Infinity, rise = 16) => {
    const v = p(t, at, at + 0.4) * (1 - p(t, until, until + 0.3));
    el.style.opacity = v;
    el.style.transform = `translateY(${(1 - v) * rise}px)`;
    return v;
  };

  const typed = (text, v) => text.slice(0, Math.round(clamp(v) * text.length));

  /* ── Motion: one line each, so a moving scene costs the model no more code than a still one ── */
  const PROPS = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rot: 0, scale: 1, opacity: 1 };
  /**
   * Keyframes [{at, ...props}] to the state at t. A key keeps every prop it
   * doesn't name from the key before it, so {at, x: 200} moves only x. Eased in
   * and out between keys, or by a key's own ease ("out", "back", "linear").
   */
  const keyed = (t, keys, base) => {
    const full = [];
    let prev = base;
    for (const k of [...keys].sort((a, b) => a.at - b.at)) full.push((prev = { ...prev, ...k }));
    if (!full.length) return { ...base };
    if (t <= full[0].at) return full[0];
    for (let i = 1; i < full.length; i++) {
      const a = full[i - 1], b = full[i];
      if (t < b.at) {
        const v = (ease[b.ease] || ease.inOut)(clamp((t - a.at) / (b.at - a.at)));
        const out = { ...b };
        for (const key of Object.keys(base)) if (typeof a[key] === "number" && typeof b[key] === "number") out[key] = mix(a[key], b[key], v);
        return out;
      }
    }
    return full[full.length - 1];
  };
  // Each element carries its own perspective, so a tilt reads as depth without
  // the composition keeping preserve-3d on every wrapper.
  const transform = (o) => `perspective(1100px) translate3d(${o.x}px,${o.y}px,${o.z}px) rotateX(${o.rx}deg) rotateY(${o.ry}deg) rotate(${o.rot}deg) scale(${o.scale})`;
  const apply = (el, o) => { el.style.transform = transform(o); el.style.opacity = o.opacity; return o; };
  /** Moves an element through keyframes: x, y, z in px, rx, ry, rot in degrees, scale, opacity. */
  const move = (el, t, keys) => apply(el, keyed(t, keys, PROPS));
  /** Springs an element in from at (scale with overshoot), out from until. */
  const pop = (el, t, at, until = Infinity) => {
    const out = p(t, until, until + 0.3);
    return apply(el, { ...PROPS, scale: mix(0.35, 1, p(t, at, at + 0.5, ease.back)) * (1 - 0.15 * out), opacity: p(t, at, at + 0.18, ease.linear) * (1 - out) });
  };
  /** Swings an element in on its top edge like a card turning over. */
  const flip = (el, t, at, until = Infinity) => {
    const v = p(t, at, at + 0.55, ease.back), out = p(t, until, until + 0.3);
    el.style.transformOrigin = "50% 0";
    return apply(el, { ...PROPS, rx: mix(-95, 0, v) + 60 * out, opacity: p(t, at, at + 0.2, ease.linear) * (1 - out) });
  };
  const FROM = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  /** Slides an element in from a side ("left", "right", "up", "down"), turning to face the viewer. */
  const slide = (el, t, at, from = "left", dist = 160, until = Infinity) => {
    const [dx, dy] = FROM[from] || FROM.left;
    const v = p(t, at, at + 0.5), out = p(t, until, until + 0.3);
    return apply(el, { ...PROPS, x: dx * dist * (1 - v), y: dy * dist * (1 - v), ry: -dx * 35 * (1 - v), rx: dy * 35 * (1 - v), opacity: v * (1 - out) });
  };
  /** Runs an entrance (pop by default) over a list, one after another, gap seconds apart. */
  const stagger = (els, t, at, gap = 0.08, fx = pop) => [...els].forEach((el, i) => fx(el, t, at + i * gap));
  /** A one-shot emphasis factor for scale: 1, rising to 1 + amount just after at, back to 1. */
  const bump = (t, at, amount = 0.16) => { const d = t - at; return d < 0 || d > 0.5 ? 1 : 1 + amount * Math.sin((d / 0.5) * Math.PI); };
  /** A damped shake in px, for a wrong answer or a crossed-out approach. */
  const shake = (t, at, px = 14) => { const d = t - at; return d < 0 || d > 0.6 ? 0 : px * Math.sin(d * 44) * (1 - d / 0.6); };
  /** A gentle idle bob in px, so an element that waits still breathes. */
  const float = (t, amp = 6, period = 3, phase = 0) => amp * Math.sin((t / period + phase) * Math.PI * 2);
  /** Counts a number from one value to another between two times, into el. */
  const count = (el, t, from, to, a, b, decimals = 0) => { el.textContent = mix(from, to, p(t, a, b)).toFixed(decimals); };
  /** Draws an SVG path or line along its length between two times. */
  const trace = (el, t, a, b) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len * (1 - p(t, a, b, ease.inOut));
  };

  /* ── The camera: the runtime's, like the captions ─────────────────────── */
  // Every scene drifts (a slow push in with a turn) and swings in at its cut, so
  // no frame is a still slide even where the model wrote no camera at all; a
  // composition adds its own moves with CK.camera. Bounded so a phone can read
  // it, and the audit measures text with the camera off, so the camera may crop
  // on purpose but can't hide an overflow from the check.
  const shots = new Map();
  const CAM = { zoom: 1, x: 0, y: 0, rx: 0, ry: 0, rz: 0 };
  const camera = (sceneId, keys) => { scene(sceneId); shots.set(sceneId, keys); };
  /** Where an element's centre sits relative to the stage's centre, with no camera on. */
  const offsetOf = (el, section) => {
    const keep = section.style.transform;
    section.style.transform = "none";
    const r = el.getBoundingClientRect(), st = $("ck-stage").getBoundingClientRect();
    section.style.transform = keep;
    return { x: r.left + r.width / 2 - (st.left + st.width / 2), y: r.top + r.height / 2 - (st.top + st.height / 2) };
  };
  function shoot(t, s, index, section) {
    const keys = (shots.get(s.id) || []).map((k) => {
      if (!k.focus) return k;
      const el = typeof k.focus === "string" ? section.querySelector(k.focus) : k.focus;
      if (!el) throw new Error(`CK.camera focus "${k.focus}" is not in scene "${s.id}"`);
      return { zoom: 1.35, ...k, ...offsetOf(el, section) };
    });
    const c = keyed(t, keys, CAM);
    const zoom = clamp(c.zoom, 0.8, 2.2), rx = clamp(c.rx, -25, 25), ry = clamp(c.ry, -25, 25), rz = clamp(c.rz, -10, 10);
    const v = clamp((t - s.start) / Math.max(0.01, s.end - s.start));
    const dir = index % 2 ? -1 : 1;
    // The first scene gets no entrance: a Short's hook must be whole on frame one.
    const enter = index === 0 ? 1 : p(t, s.start, s.start + 0.6, ease.out);
    // The drift breathes around 1 rather than pushing past it, so a headline that fills the stage is never cut.
    const z = zoom * mix(0.975, 1.012, ease.inOut(v)) * mix(0.9, 1, enter);
    const turn = ry + dir * mix(-2.2, 2.2, ease.inOut(v)) + dir * 14 * (1 - enter);
    const tilt = rx + 1.4 * Math.sin(v * Math.PI);
    section.style.transformOrigin = "50% 50%";
    section.style.transform = `perspective(1800px) translate(${-c.x * z}px,${-c.y * z}px) rotateX(${tilt}deg) rotateY(${turn}deg) rotate(${rz}deg) scale(${z})`;
    // The dotted ground drifts on its own and leans against the camera: a little parallax.
    const dots = $("ck-bg-dots");
    if (dots) dots.setAttribute("transform", `translate(${(((t * 14 + turn * 6) % 48) + 48) % 48 - 48} ${(((t * 9 - tilt * 6) % 48) + 48) % 48 - 48})`);
  }

  /* ── Code: the script's own source, never retyped by the model ───────── */
  const KEYWORDS = /^(abstract|boolean|break|byte|case|catch|char|class|const|continue|def|default|do|double|elif|else|enum|except|extends|final|finally|float|for|from|function|if|implements|import|in|instanceof|int|interface|let|long|new|null|package|private|protected|public|return|short|static|super|switch|this|throw|throws|true|false|try|var|void|while|None|True|False)$/;
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const paint = (line) =>
    line.replace(/(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+)\b|\b([A-Za-z_]\w*)\b(\s*\()?|([&<>])/g, (m, comment, str, num, word, call, sym) => {
      if (comment) return `<span style="color:#737C8C;font-style:italic">${esc(comment)}</span>`;
      if (str) return `<span style="color:#0794F9;font-style:italic">${esc(str)}</span>`;
      if (num) return `<span style="color:#D9F0FF">${num}</span>`;
      if (sym) return esc(sym);
      if (KEYWORDS.test(word)) return `<span style="color:#3AA9FF;font-weight:700">${word}</span>${call ?? ""}`;
      if (call) return `<span style="color:#7CC9FF">${word}</span>${call}`;
      if (/^[A-Z]/.test(word)) return `<span style="color:#B9E3FF">${word}</span>`;
      return word;
    });

  /** Fills an element with the script's code, one .ck-line per line. Only lines first..last if given. */
  const codeBlock = (el, { fontSize = 26, first = 1, last = Infinity } = {}) => {
    if (!code) throw new Error("this script has no code");
    el.classList.add("ck-code");
    el.style.fontSize = `${fontSize}px`;
    el.innerHTML = code.source
      .split("\n")
      .map((line, i) => (i + 1 < first || i + 1 > last ? "" : `<div class="ck-line" data-line="${i + 1}">${paint(line) || " "}</div>`))
      .join("");
  };
  /** Lights these 1-based lines and dims the rest; an empty list lights all. */
  const focusLines = (el, lines) => {
    for (const row of el.querySelectorAll(".ck-line")) {
      const on = !lines.length || lines.includes(Number(row.dataset.line));
      row.classList.toggle("ck-on", on && lines.length > 0);
      row.style.opacity = on ? 1 : 0.32;
    }
  };

  /* ── Header and captions ─────────────────────────────────────────────── */
  const MAX_WORDS = frame.w > frame.h ? 11 : 6;
  const CAPTION_LINES = timeline.scenes.map((s) => {
    const out = [];
    let cur = [];
    s.words.forEach((w, i) => {
      cur.push(w);
      const next = s.words[i + 1];
      const pause = /[,:;.?!]$/.test(w.w);
      if (!next || cur.length >= MAX_WORDS || (pause && cur.length >= Math.ceil(MAX_WORDS / 2))) {
        out.push(cur);
        cur = [];
      }
    });
    return out;
  });
  let drawnLine = null;

  function chrome(t, s, index) {
    // A Short's first scene is its hook: nothing but the payoff on screen (src/claude.ts says so to the model).
    $("ck-head").style.visibility = frame.h > frame.w && index === 0 ? "hidden" : "visible";
    $("ck-num").textContent = String(index + 1).padStart(2, "0");
    $("ck-title").textContent = s.title;
    $("ck-progress").style.transform = `scaleX(${clamp(t / timeline.duration)})`;
    const lines = CAPTION_LINES[index];
    const line = lines.find((l, i) => t >= l[0].t && (!lines[i + 1] || t < lines[i + 1][0].t)) ?? null;
    const box = $("ck-captions");
    if (line !== drawnLine) {
      box.textContent = "";
      for (const w of line ?? []) {
        const span = document.createElement("span");
        span.textContent = `${w.w} `;
        box.append(span);
      }
      drawnLine = line;
    }
    if (line) {
      let current = -1;
      line.forEach((w, i) => { if (w.t <= t) current = i; });
      [...box.children].forEach((el, i) => {
        el.style.color = i === current ? "#3AA9FF" : i < current ? "#F5F5F5" : "#8C8C8C";
      });
    }
  }

  /* ── The renderer's handle ───────────────────────────────────────────── */
  let draw = null;
  const sections = () => [...document.querySelectorAll("#ck-stage [data-scene]")];

  function seek(t) {
    seed = 1;
    let index = timeline.scenes.findIndex((s) => t < s.end);
    if (index < 0) index = timeline.scenes.length - 1;
    const s = timeline.scenes[index];
    for (const el of sections()) {
      const on = el.dataset.scene === s.id;
      el.style.display = on ? "" : "none";
      // A hidden section is reset, so nothing it holds depends on which frames came before.
      if (!on) { el.style.transform = ""; continue; }
      // A short dip at each cut: scenes change on the voice, never mid-word. The
      // first scene is on from frame one (a Short's hook is its picture in the feed).
      el.style.opacity = (index === 0 ? 1 : p(t, s.start, s.start + 0.25)) * (1 - p(t, s.end - 0.15, s.end, ease.linear));
    }
    const section = sections().find((el) => el.dataset.scene === s.id);
    chrome(t, s, index);
    if (draw) draw(t, s);
    // After draw, so a focus lands on where the element is in this frame.
    if (section) shoot(t, s, index, section);
  }

  /** What a person would call broken at this moment, for the review loop. */
  function audit() {
    const problems = [];
    // Measured with the camera off: its crop is deliberate, an overflow is not.
    const held = sections().map((el) => [el, el.style.transform]);
    for (const [el] of held) el.style.transform = "none";
    try { return measure(problems); } finally { for (const [el, v] of held) el.style.transform = v; }
  }
  function measure(problems) {
    const stage = $("ck-stage").getBoundingClientRect();
    for (const el of $("ck-stage").querySelectorAll("*")) {
      if (el.tagName === "STYLE" || el.tagName === "SCRIPT") continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const out = r.left < stage.left - 2 || r.right > stage.right + 2 || r.top < stage.top - 2 || r.bottom > stage.bottom + 2;
      const label = el.textContent.trim().slice(0, 40);
      if (out) problems.push(`text "${label}" runs off the stage (x ${Math.round(r.left)}..${Math.round(r.right)}, y ${Math.round(r.top)}..${Math.round(r.bottom)}; stage x ${stage.left}..${stage.right}, y ${stage.top}..${stage.bottom})`);
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== "visible") problems.push(`text "${label}" is clipped by its box`);
    }
    return problems;
  }

  /** Scenes with no section to draw into. */
  const missing = () => timeline.scenes.filter((s) => !sections().some((el) => el.dataset.scene === s.id)).map((s) => s.id);

  window.CK = {
    frame, stage: frame.stage, vertical: frame.h > frame.w, duration: timeline.duration, scenes: timeline.scenes, scene, cue,
    p, mix, clamp, ease, reveal, typed, code: codeBlock, focusLines,
    move, pop, flip, slide, stagger, bump, shake, float, count, trace, camera,
    render: (fn) => { draw = fn; },
  };
  window.__ck = { seek, audit, missing, duration: timeline.duration };
})();
