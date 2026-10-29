#!/usr/bin/env node
/* C4b (v2.6.2) + C4c (v2.6.8): the Earth/LEO bar never overlaps the header, the body list or the right info panel — plain Node, no deps.
 * Static wiring checks; the pixel overlaps (0 at 360–1280px) are measured by the headless-Chrome smoke.
 * Run: node tests/hud-overlap.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const css = read('cosmos/css/styles.css');
const main = read('cosmos/js/main.js');
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
// top-level rules only (outside any @media block)
const topLevel = (() => { let depth = 0, out = '', inMedia = false, mDepth = 0;
  for (let i = 0; i < css.length; i++) { const c = css[i];
    if (!inMedia && css.startsWith('@media', i)) { inMedia = true; mDepth = depth; }
    if (c === '{') depth++; if (c === '}') { depth--; if (inMedia && depth === mDepth) { inMedia = false; continue; } }
    if (!inMedia) out += c; }
  return out; })();
const rule = (src, sel) => { const i = src.indexOf(sel + ' {'); assert.ok(i >= 0, 'missing rule ' + sel); return src.slice(i, src.indexOf('}', i)); };

t('earth bar is placed below the header via --hud-top-bottom (no fixed 78px)', () => {
  const r = rule(topLevel, '.earth-bar');
  assert.match(r, /top:\s*calc\(var\(--hud-top-bottom/);
  assert.doesNotMatch(r, /top:\s*calc\(78px/);
});
t('main.js keeps --hud-top-bottom in sync with the header bottom (resize + ResizeObserver)', () => {
  assert.match(main, /setProperty\("--hud-top-bottom"/);
  assert.match(main, /querySelector\("\.hud-top"\)/);
  assert.match(main, /new ResizeObserver\(sync\)\.observe\(top\)/);
  assert.match(main, /addEventListener\("resize", sync\)/);
});
t('body list is hidden in Earth and LEO at every width (top-level rule, not just <560px)', () => {
  assert.match(topLevel, /body\.earth-mode \.hud-left,\s*body\.leo-mode \.hud-left\s*\{\s*display:\s*none;/);
});
t('solar mode keeps the list: no top-level rule hides .hud-left outside earth/leo/stars', () => {
  assert.doesNotMatch(topLevel, /(^|\n)\.hud-left\s*\{[^}]*display:\s*none/);
});
t('C4 phone picker and C3 44px toggles still present', () => {
  assert.match(css, /\.hud-left \.body-item \{[^}]*min-height: 44px/);
  assert.match(css, /\.leo-toggle-row \.earth-mission \{ min-height: 44px/);
});
t('phones: Earth mode drops the header meta chips so the bar + mission HUD fit (<560px only)', () => {
  const m = css.indexOf('@media (max-width: 560px) {\n  /* C4: compact');
  assert.ok(m >= 0);
  const block = css.slice(m, css.indexOf('\n}\n', m));
  assert.match(block, /body\.earth-mode \.hud-top \.meta-chip \{\s*display: none;/);
  assert.doesNotMatch(topLevel, /body\.earth-mode \.hud-top \.meta-chip/);
});
t('C4c desktop: bar is left-aligned and stops 12px short of the right info panel (>900px only)', () => {
  const m = css.indexOf('@media (min-width: 901px) {\n  .earth-bar {');
  assert.ok(m >= 0, 'missing C4c desktop rule');
  const r = css.slice(m, css.indexOf('}', m));
  assert.match(r, /left:\s*16px/);
  assert.match(r, /transform:\s*none/);
  assert.match(r, /width:\s*min\(960px, calc\(100vw - 16px - 280px - 16px - 12px\)\)/);
  // geometry: panel = right 16px + 280px wide; the bar's right edge must clear it at 1024/1280/1440
  const hr = rule(topLevel, '.hud-right'); assert.match(hr, /right:\s*16px/);
  assert.match(rule(topLevel, '.hud-panel'), /width:\s*min\(280px/);
  for (const vw of [1024, 1280, 1440]) {
    const barRight = 16 + Math.min(960, vw - 16 - 280 - 16 - 12), panelLeft = vw - 16 - 280;
    assert.ok(barRight <= panelLeft - 12, `${vw}px: bar right ${barRight} vs panel left ${panelLeft}`);
  }
  // the panel is hidden at ≤900px, so the C4c rule must not reach that range
  assert.match(css, /@media \(max-width: 900px\) \{\s*\.hud-right \{\s*display: none;/);
});
console.log(`# pass ${pass}`);
