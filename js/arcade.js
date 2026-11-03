/* X11 — Fact-fluency arcade: 60-second timed sprints of basic facts, with streaks and personal bests.
 * DOM-free logic (window.Arcade); the screen lives in app.js (renderArcade). Bests are saved on the
 * explorer as user.arcade["<trackId>:<op>"] = { best, bestStreak, plays, lastAt } so 💾 backup/restore
 * carries them (Storage.mergeArcade keeps the higher best on import). No third-party code. */
(function (root) {
  'use strict';
  const SPRINT_SECONDS = 60;

  // Fact families per age track (ranges follow the standards' fluency targets: 1.OA.6, 2.OA.2, 3.OA.7, 6.NS/7.NS integers)
  const OPS = {
    add: { label: 'Addition', icon: '➕' },
    sub: { label: 'Subtraction', icon: '➖' },
    mul: { label: 'Multiplication', icon: '✖️' },
    div: { label: 'Division', icon: '➗' },
    int: { label: 'Integers ±', icon: '🌡️' },
    mix: { label: 'Mixed', icon: '🎲' }
  };
  const TRACKS = {
    'ages-5-6': { ops: ['add', 'sub', 'mix'], addMax: 10, mulMax: 0 },
    'ages-7-8': { ops: ['add', 'sub', 'mul', 'div', 'mix'], addMax: 20, mulMax: 10 },
    'ages-9-10': { ops: ['add', 'sub', 'mul', 'div', 'mix'], addMax: 20, mulMax: 12 },
    'ages-11-12': { ops: ['mul', 'div', 'int', 'mix'], addMax: 20, mulMax: 12 }
  };

  function trackConfig(trackId) { return TRACKS[trackId] || TRACKS['ages-7-8']; }
  function opsFor(trackId) { return trackConfig(trackId).ops.map(id => ({ id, ...OPS[id] })); }

  /** mulberry32 — small seeded RNG so tests are repeatable. */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const fmtInt = (n) => (n < 0 ? '−' + Math.abs(n) : String(n));
  const paren = (n) => (n < 0 ? '(' + fmtInt(n) + ')' : String(n));

  /** One fact: { op, a, b, text, answer } — answer is always a whole number (integers allowed for 'int'). */
  function makeFact(trackId, op, r) {
    const cfg = trackConfig(trackId);
    if (op === 'mix') {
      const pool = cfg.ops.filter(o => o !== 'mix');
      op = pool[ri(r, 0, pool.length - 1)];
    }
    let a, b, answer, text;
    if (op === 'add') {
      answer = ri(r, 2, cfg.addMax); a = ri(r, 0, answer); b = answer - a; text = `${a} + ${b}`;
    } else if (op === 'sub') {
      a = ri(r, 2, cfg.addMax); b = ri(r, 0, a); answer = a - b; text = `${a} − ${b}`;
    } else if (op === 'mul') {
      const m = cfg.mulMax || 10; a = ri(r, 2, m); b = ri(r, 0, m); answer = a * b; text = `${a} × ${b}`;
    } else if (op === 'div') {
      const m = cfg.mulMax || 10; b = ri(r, 1, m); answer = ri(r, 0, m); a = b * answer; text = `${a} ÷ ${b}`;
    } else if (op === 'int') {
      a = ri(r, -10, 10); b = ri(r, -10, 10);
      if (r() < 0.5) { answer = a + b; text = `${fmtInt(a)} + ${paren(b)}`; }
      else { answer = a - b; text = `${fmtInt(a)} − ${paren(b)}`; op = 'int'; }
    } else {
      throw new Error('unknown op ' + op);
    }
    return { op, a, b, text, answer };
  }

  /** A sprint's worth of facts (no immediate repeats). */
  function makeSet(trackId, op, seed, n = 80) {
    const r = rng(seed);
    const out = [];
    while (out.length < n) {
      const f = makeFact(trackId, op, r);
      if (out.length && out[out.length - 1].text === f.text) continue;
      out.push(f);
    }
    return out;
  }

  /** Parse a typed answer: trims, accepts − (U+2212) or - for negatives; returns null when not a whole number. */
  function parseAnswer(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
    if (!/^-?\d+$/.test(s)) return null;
    return Number(s);
  }
  function isCorrect(fact, raw) {
    const v = parseAnswer(raw);
    return v !== null && v === fact.answer;
  }

  /** Sprint state machine (pure): start → answer()… → finish(). */
  function newSprint(trackId, op, seed) {
    return { trackId, op, seed, facts: makeSet(trackId, op, seed), index: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, done: false };
  }
  function answer(sprint, raw) {
    const fact = sprint.facts[sprint.index % sprint.facts.length];
    const ok = isCorrect(fact, raw);
    if (ok) { sprint.correct++; sprint.streak++; if (sprint.streak > sprint.bestStreak) sprint.bestStreak = sprint.streak; }
    else { sprint.wrong++; sprint.streak = 0; }
    sprint.index++;
    if (sprint.index >= sprint.facts.length) sprint.facts = sprint.facts.concat(makeSet(sprint.trackId, sprint.op, sprint.seed + sprint.index));
    return { ok, fact };
  }
  function current(sprint) { return sprint.facts[sprint.index % sprint.facts.length]; }

  function bestKey(trackId, op) { return `${trackId}:${op}`; }
  function getBest(user, trackId, op) {
    const rec = user && user.arcade && user.arcade[bestKey(trackId, op)];
    return rec ? { best: rec.best | 0, bestStreak: rec.bestStreak | 0, plays: rec.plays | 0, lastAt: rec.lastAt || null } : { best: 0, bestStreak: 0, plays: 0, lastAt: null };
  }
  /** Writes the sprint result onto the user; returns { newBest, newStreak, record }. */
  function recordResult(user, sprint, nowISO) {
    if (!user.arcade || typeof user.arcade !== 'object') user.arcade = {};
    const key = bestKey(sprint.trackId, sprint.op);
    const prev = getBest(user, sprint.trackId, sprint.op);
    const record = {
      best: Math.max(prev.best, sprint.correct),
      bestStreak: Math.max(prev.bestStreak, sprint.bestStreak),
      plays: prev.plays + 1,
      lastAt: nowISO || new Date().toISOString()
    };
    user.arcade[key] = record;
    return { newBest: sprint.correct > prev.best && sprint.correct > 0, newStreak: sprint.bestStreak > prev.bestStreak && sprint.bestStreak > 0, record };
  }

  root.Arcade = { SPRINT_SECONDS, OPS, TRACKS, opsFor, rng, makeFact, makeSet, parseAnswer, isCorrect, newSprint, answer, current, bestKey, getBest, recordResult };
})(typeof window !== 'undefined' ? window : this);
