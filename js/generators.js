/* X9 — procedural practice generators for the 10 most-practiced math skills (seeded, difficulty dial).
 * Pure + DOM-free: Generators.generate(skillId, { seed, level, count }) returns questions in the same
 * shape as math.json practice items ({ id, type: 'mc'|'fill', prompt, choices?, answer, accept?, hint,
 * feedbackCorrect, feedbackWrong }), so the existing lesson player can grade them unchanged.
 * Same seed + level + count → the same set, every time. level: 1 easy · 2 medium · 3 hard.
 * Each item also carries `gen` ({ skill, level, seed, terms }) so tests can re-derive the answer. */
(function (root) {
  'use strict';

  /** mulberry32: tiny, fast, deterministic 32-bit PRNG → floats in [0, 1). */
  function rng(seed) {
    let a = (Number(seed) >>> 0) || 1;
    const next = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)); // inclusive
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.shuffle = (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };
    return next;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const clampLevel = (l) => Math.min(3, Math.max(1, Math.round(Number(l) || 1)));

  /** Whole-number mc choices: the answer + 3 distinct plausible near-misses (never negative). */
  function numberChoices(r, answer, nearMisses) {
    const seen = new Set([String(answer)]);
    const out = [String(answer)];
    const pool = nearMisses.concat([answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 3]);
    for (const n of pool) {
      if (out.length >= 4) break;
      if (!Number.isInteger(n) || n < 0 || seen.has(String(n))) continue;
      seen.add(String(n));
      out.push(String(n));
    }
    let k = 4;
    while (out.length < 4) { const n = answer + k++; if (!seen.has(String(n))) { seen.add(String(n)); out.push(String(n)); } }
    return r.shuffle(out);
  }

  function item(r, base, numeric, nearMisses) {
    const asMc = r() < 0.5;
    const q = Object.assign({}, base);
    if (asMc) {
      q.type = 'mc';
      q.choices = numberChoices(r, numeric, nearMisses || []);
    } else {
      q.type = 'fill';
      q.accept = [String(numeric)];
    }
    q.answer = String(numeric);
    return q;
  }

  // ---- fractions -----------------------------------------------------------------------------
  function simplify(n, d) { const g = gcd(n, d) || 1; return [n / g, d / g]; }
  function fracStr(n, d) { return d === 1 ? String(n) : n + '/' + d; }
  /** Every written form a kid might give for n/d: simplest, the lcm form, the product form, mixed if > 1. */
  function fracForms(n, d, extraDens) {
    const [sn, sd] = simplify(n, d);
    const forms = new Set([fracStr(sn, sd)]);
    for (const den of extraDens) if (den % sd === 0) forms.add((sn * den / sd) + '/' + den);
    if (sn > sd) {
      const whole = Math.floor(sn / sd), rem = sn % sd;
      forms.add(rem ? whole + ' ' + rem + '/' + sd : String(whole));
    }
    return Array.from(forms);
  }

  // ---- the 10 skills -------------------------------------------------------------------------
  const SKILLS = [
    {
      id: 'add-within-20', label: 'Add within 20', track: 'ages-5-6', standard: 'K.OA.5, 1.OA.6',
      lessonIds: ['k-add-within-10', 'k-add-within-20', 'k-make-10-add'],
      make(r, level) {
        let a, b;
        if (level === 1) { a = r.int(0, 9); b = r.int(0, 10 - a); }
        else if (level === 2) { a = r.int(10, 17); b = r.int(1, 19 - a); } // teen + ones, no new ten
        else { a = r.int(5, 9); b = r.int(11 - a, 9); }                  // crosses ten: make-10
        const s = a + b;
        return item(r, {
          prompt: a + ' + ' + b + ' = ?', terms: [a, b],
          hint: level === 3 ? 'Make a 10 first: ' + a + ' + ' + (10 - a) + ' = 10, then add the rest.' : 'Start at ' + Math.max(a, b) + ' and count on ' + Math.min(a, b) + '.',
          feedbackCorrect: a + ' + ' + b + ' = ' + s + '!',
          feedbackWrong: a + ' + ' + b + ' makes ' + s + '.'
        }, s, [s + 10, Math.abs(a - b)]);
      }
    },
    {
      id: 'sub-within-20', label: 'Subtract within 20', track: 'ages-5-6', standard: 'K.OA.5, 1.OA.6',
      lessonIds: ['k-sub-within-10', 'k-related-facts'],
      make(r, level) {
        let a, b;
        if (level === 1) { a = r.int(2, 10); b = r.int(0, a); }
        else if (level === 2) { a = r.int(11, 19); b = r.int(1, a - 10); } // stays in the teens
        else { a = r.int(11, 18); b = r.int(a - 9, 9); }                   // crosses back over ten
        const d = a - b;
        return item(r, {
          prompt: a + ' − ' + b + ' = ?', terms: [a, b],
          hint: level === 3 ? 'Take ' + (a - 10) + ' to get to 10, then take ' + (b - (a - 10)) + ' more.' : 'Think: ' + b + ' + ? = ' + a + '.',
          feedbackCorrect: a + ' − ' + b + ' = ' + d + '!',
          feedbackWrong: a + ' − ' + b + ' leaves ' + d + ' (check: ' + b + ' + ' + d + ' = ' + a + ').'
        }, d, [a + b]);
      }
    },
    {
      id: 'compare-2-digit', label: 'Compare 2-digit numbers', track: 'ages-5-6', standard: '1.NBT.3',
      lessonIds: ['k-compare-2digit'],
      make(r, level) {
        let a, b;
        if (level === 1) { do { a = r.int(10, 99); b = r.int(10, 99); } while (Math.floor(a / 10) === Math.floor(b / 10)); }
        else if (level === 2) { const t = r.int(1, 9); a = t * 10 + r.int(0, 9); do { b = t * 10 + r.int(0, 9); } while (b === a && r() < 0.8); }
        else {
          const x = r.int(1, 9); let y = r.int(1, 9); if (y === x) y = (x % 9) + 1;
          const roll = r();
          if (roll < 0.5) { a = x * 10 + y; b = y * 10 + x; }   // swapped digits: 47 vs 74
          else if (roll < 0.75) { a = b = x * 10 + y; }       // equal
          else { a = r.int(10, 99); b = r.int(10, 99); }
        }
        const sign = a > b ? '>' : a < b ? '<' : '=';
        return {
          type: 'mc', prompt: 'Which sign makes it true?  ' + a + ' __ ' + b, terms: [a, b],
          choices: r.shuffle(['<', '>', '=']), answer: sign,
          hint: 'Compare the tens first. Only if the tens match, compare the ones.',
          feedbackCorrect: a + ' ' + sign + ' ' + b + '!',
          feedbackWrong: a + ' ' + sign + ' ' + b + ' — look at the tens digit first.'
        };
      }
    },
    {
      id: 'add-2-digit-1-digit', label: 'Add tens & ones', track: 'ages-5-6', standard: '1.NBT.4–5',
      lessonIds: ['k-add-2digit-1digit', 'k-ten-more-less'],
      make(r, level) {
        let a, b;
        if (level === 1) { a = r.int(1, 8) * 10 + r.int(0, 5); b = r.int(1, 9 - (a % 10)); }       // no new ten
        else if (level === 2) { a = r.int(1, 8) * 10; a += r.int(0, 9); b = r.int(1, 9) * 10; if (a + b > 99) b = 10; } // + tens
        else { a = r.int(1, 8) * 10 + r.int(5, 9); b = r.int(10 - (a % 10), 9); }               // makes a new ten
        const s = a + b;
        return item(r, {
          prompt: a + ' + ' + b + ' = ?', terms: [a, b],
          hint: level === 2 ? 'Adding tens: only the tens digit changes.' : level === 3 ? 'The ones make a new ten — add it to the tens!' : 'Add the ones; the tens stay the same.',
          feedbackCorrect: a + ' + ' + b + ' = ' + s + '!',
          feedbackWrong: a + ' + ' + b + ' = ' + s + '.'
        }, s, [s - 10, s + 10]);
      }
    },
    {
      id: 'add-sub-within-100', label: 'Add & subtract within 100', track: 'ages-7-8', standard: '2.NBT.5',
      lessonIds: ['as-add-within-100', 'as-sub-within-100', 'as-add-regroup', 'as-sub-regroup', 'as-add-fluency'],
      make(r, level) {
        const sub = r() < 0.5;
        let a, b;
        if (!sub) {
          if (level === 1) { do { a = r.int(10, 80); b = r.int(10, 99 - a); } while ((a % 10) + (b % 10) > 9); }
          else { do { a = r.int(15, 79); b = r.int(11, 99 - a); } while ((a % 10) + (b % 10) < 10 && level === 3); }
        } else {
          if (level === 1) { do { a = r.int(20, 99); b = r.int(10, a); } while ((a % 10) < (b % 10)); }
          else { do { a = r.int(30, 99); b = r.int(11, a - 1); } while ((a % 10) >= (b % 10) && level === 3); }
        }
        const ans = sub ? a - b : a + b;
        const op = sub ? '−' : '+';
        return item(r, {
          prompt: a + ' ' + op + ' ' + b + ' = ?', terms: [a, b, sub ? '-' : '+'],
          hint: sub ? 'Subtract the ones, then the tens. Not enough ones? Trade a ten for 10 ones.' : 'Add the ones, then the tens. 10 ones make a new ten!',
          feedbackCorrect: a + ' ' + op + ' ' + b + ' = ' + ans + '!',
          feedbackWrong: a + ' ' + op + ' ' + b + ' = ' + ans + '.'
        }, ans, [ans + 10, ans - 10]);
      }
    },
    {
      id: 'mult-facts', label: 'Multiplication facts', track: 'ages-7-8', standard: '3.OA.7',
      lessonIds: ['md-facts-2-5-10', 'md-facts-3-4', 'md-facts-6-9', 'md-equal-groups'],
      make(r, level) {
        const f = r.pick(level === 1 ? [2, 5, 10] : level === 2 ? [3, 4] : [6, 7, 8, 9]);
        const g = r.int(level === 1 ? 1 : 2, 10);
        const [a, b] = r() < 0.5 ? [f, g] : [g, f];
        const p = a * b;
        return item(r, {
          prompt: a + ' × ' + b + ' = ?', terms: [a, b],
          hint: f === 9 ? '9 groups = 10 groups minus one group.' : f >= 6 ? f + 's: use 5 groups, then add ' + (f - 5) + ' more group' + (f - 5 > 1 ? 's' : '') + '.' : 'Skip-count by ' + f + 's.',
          feedbackCorrect: a + ' × ' + b + ' = ' + p + '!',
          feedbackWrong: a + ' × ' + b + ' = ' + p + '.'
        }, p, [p + f, p - f, a + b]);
      }
    },
    {
      id: 'div-unknown-factor', label: 'Division as a missing factor', track: 'ages-7-8', standard: '3.OA.4, 3.OA.6',
      lessonIds: ['md-div-unknown-factor', 'md-arrays-div', 'md-quotative'],
      make(r, level) {
        const d = r.pick(level === 1 ? [2, 5, 10] : level === 2 ? [3, 4] : [6, 7, 8, 9]);
        const qt = r.int(level === 1 ? 1 : 2, 10);
        const n = d * qt;
        const style = r() < 0.5;
        return item(r, {
          prompt: style ? n + ' ÷ ' + d + ' = ?' : '? × ' + d + ' = ' + n, terms: [n, d],
          hint: 'Think: what times ' + d + ' makes ' + n + '?',
          feedbackCorrect: qt + ' × ' + d + ' = ' + n + ', so ' + n + ' ÷ ' + d + ' = ' + qt + '!',
          feedbackWrong: qt + ' × ' + d + ' = ' + n + ', so the missing number is ' + qt + '.'
        }, qt, [qt + 1, qt - 1, n - d]);
      }
    },
    {
      id: 'area-rows-columns', label: 'Area with rows × columns', track: 'ages-7-8', standard: '3.MD.7',
      lessonIds: ['ar-unit-squares', 'ar-rows-columns', 'ar-area-vs-perimeter'],
      make(r, level) {
        if (level < 3) {
          const max = level === 1 ? 5 : 10;
          const rows = r.int(2, max), cols = r.int(2, max);
          const A = rows * cols;
          return item(r, {
            prompt: 'A rectangle has ' + rows + ' rows of ' + cols + ' unit squares. What is its area (square units)?', terms: [rows, cols],
            hint: 'Area = rows × columns.',
            feedbackCorrect: rows + ' × ' + cols + ' = ' + A + ' square units!',
            feedbackWrong: rows + ' rows × ' + cols + ' columns = ' + A + ' square units.'
          }, A, [2 * (rows + cols), rows + cols]);
        }
        // L-shape: two rectangles side by side → additive area (3.MD.7c–d)
        const r1 = r.int(2, 6), c1 = r.int(2, 6), r2 = r.int(2, 6), c2 = r.int(2, 6);
        const A = r1 * c1 + r2 * c2;
        return item(r, {
          prompt: 'An L-shape splits into a ' + r1 + ' × ' + c1 + ' rectangle and a ' + r2 + ' × ' + c2 + ' rectangle. Total area (square units)?', terms: [r1, c1, r2, c2],
          hint: 'Find each rectangle\'s area, then add.',
          feedbackCorrect: r1 * c1 + ' + ' + r2 * c2 + ' = ' + A + ' square units!',
          feedbackWrong: r1 + '×' + c1 + ' = ' + r1 * c1 + ' and ' + r2 + '×' + c2 + ' = ' + r2 * c2 + ', so ' + A + '.'
        }, A, [Math.max(r1 * c1, r2 * c2), (r1 + r2) * (c1 + c2), A + Math.min(r1, c1)]);
      }
    },
    {
      id: 'multi-digit-mult', label: 'Multi-digit multiplication', track: 'ages-9-10', standard: '4.NBT.5',
      lessonIds: ['g4-multi-mult', 'g4-long-mult'],
      make(r, level) {
        let a, b;
        if (level === 1) { a = r.int(12, 99); b = r.int(2, 9); }
        else if (level === 2) { a = r.int(102, 999); b = r.int(2, 9); }
        else { a = r.int(11, 99); b = r.int(11, 99); }
        const p = a * b;
        const ones = b % 10, tens = b - ones;
        return item(r, {
          prompt: a + ' × ' + b + ' = ?', terms: [a, b],
          hint: level === 3 ? 'Break it apart: ' + a + ' × ' + tens + ' + ' + a + ' × ' + ones + '.' : 'Break ' + a + ' into place values, multiply each by ' + b + ', then add.',
          feedbackCorrect: a + ' × ' + b + ' = ' + p + '!',
          feedbackWrong: a + ' × ' + b + ' = ' + p + '.'
        }, p, [p + 10 * b, p - b, p + a]);
      }
    },
    {
      id: 'frac-unlike-addsub', label: 'Add & subtract unlike fractions', track: 'ages-9-10', standard: '5.NF.1–2',
      lessonIds: ['g5-frac-common-den', 'g5-frac-unlike-addsub', 'g5-frac-unlike-wp'],
      make(r, level) {
        let d1, d2;
        if (level === 1) { const pair = r.pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [5, 10], [3, 9]]); [d1, d2] = pair; }
        else if (level === 2) { [d1, d2] = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]); }
        else { [d1, d2] = r.pick([[4, 6], [6, 8], [6, 9], [4, 10], [8, 12], [6, 10], [3, 8]]); }
        if (r() < 0.5) [d1, d2] = [d2, d1];
        let n1 = r.int(1, d1 - 1), n2 = r.int(1, d2 - 1);
        const sub = r() < 0.5;
        if (level < 3 && !sub) { while (n1 * d2 + n2 * d1 >= d1 * d2) { if (n1 > 1) n1--; else if (n2 > 1) n2--; else break; } }
        if (sub && n1 * d2 < n2 * d1) { [n1, d1, n2, d2] = [n2, d2, n1, d1]; }
        if (sub && n1 * d2 === n2 * d1) { n1 = d1 - 1; n2 = 1; if (n1 * d2 <= n2 * d1) { [n1, d1, n2, d2] = [n2, d2, n1, d1]; } }
        const L = lcm(d1, d2);
        const num = sub ? n1 * (L / d1) - n2 * (L / d2) : n1 * (L / d1) + n2 * (L / d2);
        const [sn, sd] = simplify(num, L);
        const op = sub ? '−' : '+';
        const answer = fracStr(sn, sd);
        const accept = fracForms(num, L, [L, d1 * d2]);
        const base = {
          prompt: n1 + '/' + d1 + ' ' + op + ' ' + n2 + '/' + d2 + ' = ?', terms: [n1, d1, n2, d2, sub ? '-' : '+'],
          hint: 'Make same-size pieces: rewrite both as ' + L + 'ths, then ' + (sub ? 'subtract' : 'add') + ' the tops.',
          feedbackCorrect: answer + '!',
          feedbackWrong: n1 + '/' + d1 + ' = ' + n1 * (L / d1) + '/' + L + ' and ' + n2 + '/' + d2 + ' = ' + n2 * (L / d2) + '/' + L + ', so ' + num + '/' + L + (answer !== num + '/' + L ? ' = ' + answer : '') + '.'
        };
        if (r() < 0.5) {
          // mc with the classic add-the-bottoms distractor
          const wrongs = [];
          const tops = sub ? Math.abs(n1 - n2) : n1 + n2, bots = sub ? Math.abs(d1 - d2) : d1 + d2;
          if (bots > 0) wrongs.push(fracStr(tops, bots));
          wrongs.push(fracStr(sub ? Math.abs(n1 - n2) : n1 + n2, L));
          wrongs.push(fracStr(num + 1, L), fracStr(Math.max(1, num - 1), L), fracStr(num, L + d1));
          const seenVal = new Set([sn / sd]);
          const choices = [answer];
          for (const w of wrongs) {
            if (choices.length >= 4) break;
            const [wn, wd] = w.includes('/') ? w.split('/').map(Number) : [Number(w), 1];
            const v = wn / wd;
            if (!wd || !(v > 0 && v < 2) || seenVal.has(v) || choices.includes(w)) continue;
            seenVal.add(v); choices.push(w);
          }
          return Object.assign(base, { type: 'mc', choices: r.shuffle(choices), answer });
        }
        return Object.assign(base, { type: 'fill', answer, accept });
      }
    }
  ];

  const BY_ID = {};
  SKILLS.forEach((s) => { BY_ID[s.id] = s; });
  const BY_LESSON = {};
  SKILLS.forEach((s) => s.lessonIds.forEach((l) => { if (!BY_LESSON[l]) BY_LESSON[l] = s.id; }));

  function generate(skillId, opts) {
    const s = BY_ID[skillId];
    if (!s) return [];
    const o = opts || {};
    const level = clampLevel(o.level);
    const seed = (Number(o.seed) >>> 0) || 1;
    const count = Math.max(1, Math.min(50, Math.round(Number(o.count) || 5)));
    const r = rng(seed * 31 + level);
    const out = [];
    const seenPrompts = new Set();
    let guard = 0;
    while (out.length < count && guard++ < count * 20) {
      const q = s.make(r, level);
      if (seenPrompts.has(q.prompt) && guard < count * 10) continue; // prefer no repeats inside one set
      seenPrompts.add(q.prompt);
      const terms = q.terms; delete q.terms;
      q.id = 'gen-' + s.id + '-' + seed + '-' + level + '-' + out.length;
      q.gen = { skill: s.id, level, seed, terms };
      out.push(q);
    }
    return out;
  }

  const Generators = {
    VERSION: 1,
    LEVELS: [{ id: 1, label: 'Easy' }, { id: 2, label: 'Medium' }, { id: 3, label: 'Hard' }],
    SKILLS: SKILLS.map((s) => ({ id: s.id, label: s.label, track: s.track, standard: s.standard, lessonIds: s.lessonIds.slice() })),
    rng,
    skillForLesson: (lessonId) => BY_LESSON[lessonId] || null,
    skillsForTrack: (trackId) => SKILLS.filter((s) => s.track === trackId).map((s) => s.id),
    generate,
    /** Fresh seed for a new set (callers that want a repeatable set pass their own). */
    newSeed: () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Generators;
  if (root) root.Generators = Generators;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
