/**
 * Einstein Math Space Lab (C1): Falcon 9 booster recovery — a simple, kid-level model.
 * Pure (no THREE, no DOM) so it can be unit-tested in Node.
 *
 * u = 0..1 is the booster's return window (from stage separation to touchdown).
 * Output is normalised: downrange 1 / alt 1 = where the booster was at separation;
 * downrange 0 = the launch site. RTLS lands on a landing zone (LZ) next to the pad;
 * a droneship waits further downrange (no boostback needed).
 * tilt is radians from straight up (+ = nose leaning downrange, − = nose pointing back home).
 */

export const RECOVERY_PHASES = ["separation", "flip", "boostback", "coast", "entry", "descent", "landing", "landed"];

const LABELS = {
  separation: "Stage separation",
  flip: "Flip around",
  boostback: "Boostback burn · heading home",
  coast: "Coasting · grid fins out",
  entry: "Entry burn · slowing down",
  descent: "Falling · grid fins steer",
  landing: "Landing burn · legs out",
  landed: "Touchdown · The Falcon has landed!",
};
const BURNS = { boostback: "boostback", entry: "entry", landing: "landing" };

// Phase start points along u (each phase runs until the next one starts).
const PHASE_AT = [0, 0.06, 0.14, 0.3, 0.55, 0.7, 0.88, 1];

/** Landing targets: downrange of the touchdown point (in separation-downrange units). */
export const DRONESHIP_DOWNRANGE = 1.6;

const PROFILES = {
  // Return to launch site: the boostback burn turns the booster around.
  lz: {
    x: [1, 1.06, 1.09, 0.85, 0.32, 0.16, 0.015, 0],
    tilt: [1.33, 1.2, -1.0, -1.0, 0, 0, 0, 0],
    burns: ["boostback", "entry", "landing"],
  },
  // Droneship: it keeps flying downrange to the ship waiting in the ocean — no boostback.
  droneship: {
    x: [1, 1.06, 1.12, 1.28, 1.48, 1.56, 1.596, DRONESHIP_DOWNRANGE],
    tilt: [1.33, 1.2, 0.35, 0.2, 0, 0, 0, 0],
    burns: ["entry", "landing"],
  },
};
// Altitude is the same arc for both: a little climb (still moving up after MECO), then down.
const ALT = [1, 1.04, 1.08, 1.12, 0.8, 0.62, 0.1, 0];

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/** Monotone cubic (Fritsch–Carlson) tangents; the last tangent is forced to 0 (soft touchdown). */
function tangents(xs, ys) {
  const n = xs.length;
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n);
  m[0] = d[0];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  m[n - 1] = 0;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return m;
}

function hermite(xs, ys, ms, u) {
  let i = 0;
  while (i < xs.length - 2 && u > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i];
  const s = (u - xs[i]) / h;
  const s2 = s * s, s3 = s2 * s;
  const v = (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * ms[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * ms[i + 1];
  const dv = ((6 * s2 - 6 * s) * ys[i] + (3 * s2 - 4 * s + 1) * h * ms[i] + (-6 * s2 + 6 * s) * ys[i + 1] + (3 * s2 - 2 * s) * h * ms[i + 1]) / h;
  return [v, dv];
}

function smooth(xs, ys, u) {
  let i = 0;
  while (i < xs.length - 2 && u > xs[i + 1]) i++;
  const s = clamp01((u - xs[i]) / (xs[i + 1] - xs[i]));
  const k = s * s * (3 - 2 * s);
  return ys[i] + (ys[i + 1] - ys[i]) * k;
}

const CACHE = {};
function curves(target) {
  if (!CACHE[target]) {
    const p = PROFILES[target] || PROFILES.lz;
    const mx = tangents(PHASE_AT, p.x), ma = tangents(PHASE_AT, ALT);
    const sp0 = Math.hypot(hermite(PHASE_AT, p.x, mx, 0)[1], hermite(PHASE_AT, ALT, ma, 0)[1]);
    CACHE[target] = { p, mx, ma, sp0 };
  }
  return CACHE[target];
}

/**
 * @param {number} u 0..1 through the booster's return
 * @param {"lz"|"droneship"} [target]
 * @returns {{phase:string,label:string,burn:null|"boostback"|"entry"|"landing",downrange:number,alt:number,speed:number,tilt:number,target:string}}
 */
export function boosterRecovery(u, target = "lz") {
  u = clamp01(Number(u) || 0);
  const tgt = PROFILES[target] ? target : "lz";
  const { p, mx, ma, sp0 } = curves(tgt);
  let idx = 0;
  while (idx < PHASE_AT.length - 2 && u >= PHASE_AT[idx + 1]) idx++;
  let phase = u >= 1 ? "landed" : RECOVERY_PHASES[idx];
  // A droneship flight has no boostback: that stretch is just a coast.
  if (phase === "boostback" && !p.burns.includes("boostback")) phase = "coast";
  const burn = BURNS[phase] && p.burns.includes(BURNS[phase]) ? BURNS[phase] : null;
  const [x, dx] = hermite(PHASE_AT, p.x, mx, u);
  const [a, da] = hermite(PHASE_AT, ALT, ma, u);
  const done = u >= 1;
  const label = phase === "coast" && tgt === "droneship" ? "Coasting to the droneship" : phase === "landed" && tgt === "droneship" ? "Touchdown on the droneship!" : LABELS[phase];
  return {
    phase,
    label,
    burn,
    downrange: done ? (tgt === "droneship" ? DRONESHIP_DOWNRANGE : 0) : x,
    alt: done ? 0 : Math.max(0, a),
    speed: done ? 0 : Math.hypot(dx, da) / sp0,
    tilt: done ? 0 : smooth(PHASE_AT, p.tilt, u),
    target: tgt,
  };
}
