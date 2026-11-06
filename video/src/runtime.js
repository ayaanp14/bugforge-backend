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
  const $ = (id) => document.getElementById(id);
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
      // A short dip at each cut: scenes change on the voice, never mid-word.
      if (on) el.style.opacity = p(t, s.start, s.start + 0.25) * (1 - p(t, s.end - 0.15, s.end, ease.linear));
    }
    chrome(t, s, index);
    if (draw) draw(t, s);
  }

  /** What a person would call broken at this moment, for the review loop. */
  function audit() {
    const problems = [];
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
    render: (fn) => { draw = fn; },
  };
  window.__ck = { seek, audit, missing, duration: timeline.duration };
})();
