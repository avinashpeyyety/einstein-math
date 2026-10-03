#!/usr/bin/env node
/* v2.5.0 Space Lab (former Cosmos app) integration tests — plain Node, no deps.
 * Run: node tests/space-lab.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(ROOT, f));
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

const SpaceLab = require(path.join(ROOT, 'js/space.js'));

t('catalog: 4 working sections deep-link into cosmos/, stubs have notes and no link', () => {
  assert.deepStrictEqual(SpaceLab.working().map((s) => s.mode), ['solar', 'earth', 'leo', 'stars']);
  for (const s of SpaceLab.working()) assert.strictEqual(SpaceLab.url(s), 'cosmos/?mode=' + s.mode);
  assert.ok(SpaceLab.stubs().length >= 2);
  for (const s of SpaceLab.stubs()) { assert.strictEqual(SpaceLab.url(s), null); assert.ok(/coming soon/i.test(s.note)); }
  assert.ok(SpaceLab.stubs().some((s) => s.id === 'landings'));
});

t('cards html: links for working, coming-soon for stubs, escaped', () => {
  const full = SpaceLab.cardsHtml();
  assert.strictEqual((full.match(/href="cosmos\/\?mode=/g) || []).length, 4);
  assert.strictEqual((full.match(/Coming soon<\/span>/g) || []).length, SpaceLab.stubs().length);
  const compact = SpaceLab.cardsHtml({ compact: true });
  assert.strictEqual((compact.match(/>GO</g) || []).length, 4);
  assert.strictEqual((compact.match(/>SOON</g) || []).length, SpaceLab.stubs().length);
  assert.ok(!/<script/i.test(full));
});

t('cosmos page uses vendored Three.js (no CDN code) and every import resolves', () => {
  const html = read('cosmos/index.html');
  assert.ok(!/unpkg|jsdelivr|cdnjs/.test(html), 'no CDN script imports');
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const resolve = (spec, fromDir) => {
    if (spec === 'three') return path.normalize(path.join('cosmos', map.three));
    if (spec.startsWith('three/addons/')) return path.normalize(path.join('cosmos', map['three/addons/'], spec.slice(13)));
    return path.normalize(path.join(fromDir, spec));
  };
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return; seen.add(file);
    assert.ok(exists(file), 'missing module ' + file);
    const src = read(file);
    for (const m of src.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) walk(resolve(m[1], path.dirname(file)));
  };
  walk('cosmos/js/main.js');
  assert.ok(seen.has(path.normalize('vendor/three/build/three.module.js')));
  assert.ok(exists('vendor/three/LICENSE') && /MIT License/.test(read('vendor/three/LICENSE')));
  assert.ok(/href="\.\.\/#space"/.test(html), 'back link to the hub');
});

t('recovery sims are stubbed: stub missions exist in the mission list', () => {
  const earth = read('cosmos/js/earth.js');
  assert.ok(/export const RECOVERY_STUBBED = true/.test(earth));
  for (const id of ['f9-rtls', 'starship-ift5']) assert.ok(earth.includes(`id: "${id}"`) && earth.includes(`"${id}":`), id);
  const main = read('cosmos/js/main.js');
  assert.ok(/STUB_MISSIONS\[missionId\]\) return/.test(main), 'stub missions cannot start');
  assert.ok(/function applyUrlParams/.test(main));
});

t('app wiring: nav button, screen, Home teaser, script tag; SW lazy-caches cosmos + three, nav never overwrites shell', () => {
  const html = read('index.html');
  assert.ok(html.includes('data-nav="space"') && html.includes('id="screen-space"') && html.includes('id="btn-open-space"'));
  assert.ok(html.indexOf('js/space.js') > 0 && html.indexOf('js/space.js') < html.indexOf('js/app.js'));
  const app = read('js/app.js');
  assert.ok(/t === 'space'\) renderSpace\(\)/.test(app) && /spaceUnitCardHtml\(\)/.test(app));
  const sw = read('sw.js');
  assert.ok(sw.includes("'./js/space.js'"));
  assert.ok(/isSpace \? spaceKey : '\.\/index\.html'/.test(sw));
  assert.ok(sw.includes("/vendor/three/"));
  assert.ok(!/'\.\/cosmos\//.test(sw) && !/'\.\/vendor\/three/.test(sw), 'cosmos + three are not precached');
});

t('history archive: cosmos git bundle + old URL recorded', () => {
  assert.ok(exists('_archive/cosmos-history/cosmos.bundle'));
  assert.ok(/avinashpeyyety\.github\.io\/pixelloid\/cosmos/.test(read('_archive/cosmos-history/README.md')));
});

console.log(`\n${pass} passed`);
