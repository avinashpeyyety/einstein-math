/**
 * Einstein Math Space Lab (C1): Falcon 9 booster recovery — a simple, kid-level model.
 * Pure (no THREE, no DOM) so it can be unit-tested in Node.
 *
 * u = 0..1 is the booster's return window (from stage separation to touchdown).
 * Output is normalised: downrange 1 / alt 1 = where the booster was at separation;
 * downrange 0 = the launch site. RTLS lands on a landing zone (LZ) next to the pad;
 * a droneship waits further downrange (no boostback needed).
 * tilt is radians from straight up (+ = nose leaning downrange, − = nose pointing back home).
 *
 * C2 (v2.6.1): target "tower" = Starship's Super Heavy flying back to the launch tower ("Mechazilla").
 * It does a boostback burn but no entry burn (it falls back slowly enough), then a landing burn that
 * ends in a hover between the tower's chopstick arms; the arms close (armClose 0 → 1) BEFORE it settles
 * onto them. alt 0 / downrange 0 = held at the catch point on the arms.
 */

export const RECOVERY_PHASES = ["separation", "flip", "boostback", "coast", "entry", "descent", "landing", "landed"];
/** C2: Super Heavy tower catch phases (no entry burn; hover between the arms, then caught). */
export const CATCH_PHASES = ["separation", "flip", "boostback", "coast", "descent", "landing", "hover", "caught"];

const LABELS = {
  separation: "Stage separation",
  flip: "Flip around",
  boostback: "Boostback burn · heading home",
  coast: "Coasting · grid fins out",
  entry: "Entry burn · slowing down",
  descent: "Falling · grid fins steer",
  landing: "Landing burn · legs out",
  landed: "Touchdown · The Falcon has landed!",
  hover: "Hovering · chopsticks closing",
  caught: "Caught! The tower grabbed the booster",
};
const BURNS = { boostback: "boostback", entry: "entry", landing: "landing" };

// Phase start points along u (each phase runs until the next one starts).
const PHASE_AT = [0, 0.06, 0.14, 0.3, 0.55, 0.7, 0.88, 1];

/** Landing targets: downrange of the touchdown point (in separation-downrange units). */
export const DRONESHIP_DOWNRANGE = 1.6;

// C2 tower catch: its own timing (no entry burn). Arms close over ARM_CLOSE_AT, contact at CATCH_CONTACT_U.
const CATCH_AT = [0, 0.06, 0.14, 0.3, 0.5, 0.74, 0.88, 0.97];
export const CATCH_CONTACT_U = 0.97;
export const ARM_CLOSE_AT = [0.86, 0.95];

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
  tower: {
    at: CATCH_AT,
    phases: CATCH_PHASES,
    x: [1, 1.06, 1.09, 0.85, 0.32, 0.1, 0.01, 0],
    alt: [1, 1.04, 1.08, 1.12, 0.78, 0.36, 0.035, 0],
    tilt: [1.33, 1.2, -1.0, -1.0, 0, 0, 0, 0],
    burns: ["boostback", "landing"],
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
    const at = p.at || PHASE_AT, alt = p.alt || ALT;
    const mx = tangents(at, p.x), ma = tangents(at, alt);
    const sp0 = Math.hypot(hermite(at, p.x, mx, 0)[1], hermite(at, alt, ma, 0)[1]);
    CACHE[target] = { p, at, alt, mx, ma, sp0 };
  }
  return CACHE[target];
}

/**
 * @param {number} u 0..1 through the booster's return
 * @param {"lz"|"droneship"|"tower"} [target]
 * @returns {{phase:string,label:string,burn:null|"boostback"|"entry"|"landing",downrange:number,alt:number,speed:number,tilt:number,target:string,armClose:number}}
 *   armClose (tower only, else 0): 0 = chopsticks wide open, 1 = closed around the booster.
 */
export function boosterRecovery(u, target = "lz") {
  u = clamp01(Number(u) || 0);
  const tgt = PROFILES[target] ? target : "lz";
  const { p, at, alt: altKeys, mx, ma, sp0 } = curves(tgt);
  const phases = p.phases || RECOVERY_PHASES;
  const endU = tgt === "tower" ? CATCH_CONTACT_U : 1;
  const done = u >= endU;
  let idx = 0;
  while (idx < at.length - 2 && u >= at[idx + 1]) idx++;
  let phase = done ? phases[phases.length - 1] : phases[idx];
  // A droneship flight has no boostback: that stretch is just a coast.
  if (phase === "boostback" && !p.burns.includes("boostback")) phase = "coast";
  // the landing burn keeps firing while Super Heavy hovers between the arms
  const burn = phase === "hover" ? "landing" : BURNS[phase] && p.burns.includes(BURNS[phase]) ? BURNS[phase] : null;
  const [x, dx] = hermite(at, p.x, mx, Math.min(u, endU));
  const [a, da] = hermite(at, altKeys, ma, Math.min(u, endU));
  const label = phase === "coast" && tgt === "droneship" ? "Coasting to the droneship" : phase === "landed" && tgt === "droneship" ? "Touchdown on the droneship!" : LABELS[phase];
  const armClose = tgt !== "tower" ? 0 : done ? 1 : smooth([0, ARM_CLOSE_AT[0], ARM_CLOSE_AT[1], 1], [0, 0, 1, 1], u);
  return {
    phase,
    label,
    burn,
    downrange: done ? (tgt === "droneship" ? DRONESHIP_DOWNRANGE : 0) : x,
    alt: done ? 0 : Math.max(0, a),
    speed: done ? 0 : Math.hypot(dx, da) / sp0,
    tilt: done ? 0 : smooth(at, p.tilt, u),
    target: tgt,
    armClose,
  };
}

/** C1b: room left around vehicle + pad, as a multiple of their bounding-sphere radius. */
export const LANDING_FIT_PAD = 1.35;

/**
 * C1b: distance and look-point lift (in world units, along screen-up) that fit a bounding sphere of `radius`
 * inside the screen band left free by the top bar (topInset) and the bottom dock (bottomInset), both 0..1 of
 * the viewport height, with LANDING_FIT_PAD of margin. Pure, so the framing can be asserted in Node.
 */
export function landingFit({ radius, aspect = 16 / 9, fovDeg = 50, topInset = 0, bottomInset = 0 }) {
  const c01 = (x) => Math.min(1, Math.max(0, x || 0));
  const top = c01(topInset);
  const bottom = c01(bottomInset);
  const free = Math.max(0.2, 1 - top - bottom);
  const tanV = Math.tan(((fovDeg / 2) * Math.PI) / 180);
  const tanFit = Math.min(tanV * free, tanV * aspect); // usable half-height vs half-width
  const dist = (radius * LANDING_FIT_PAD) / tanFit + radius;
  return { dist, lift: dist * tanV * (top - bottom) }; // lift centres the sphere in the free band
}
