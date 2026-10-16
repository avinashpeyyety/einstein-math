#!/usr/bin/env node
/* C3 (v2.6.0): LEO catalog toggles (cosmos/js/leo-catalog.js, re-exported by leo.js) — plain Node, no deps.
 * Run: node tests/leo-toggles.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  const L = await import(pathToFileURL(path.join(ROOT, 'cosmos/js/leo-catalog.js')).href);
  let pass = 0;
  const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
  const byId = (id) => L.LEO_TOGGLES.find((e) => e.id === id);

  t('Kepler constants and a sanity orbit (ISS ~420 km ≈ 92.8 min)', () => {
    assert.strictEqual(L.EARTH_RADIUS_KM, 6371);
    assert.strictEqual(L.MU_EARTH_KM3_S2, 398600);
    assert.ok(Math.abs(L.orbitalPeriodMin(420) - 92.8) < 0.2);
    const a = 6371 + 550;
    assert.ok(Math.abs(L.orbitalPeriodMin(550) - (2 * Math.PI * Math.sqrt(a ** 3 / 398600)) / 60) < 1e-9);
  });

  t('Hubble: ~535–547 km, 28.5°, period within 1 min of the published ~95 min', () => {
    const h = byId('hubble');
    assert.ok(h.altKm >= 535 && h.altKm <= 547);
    assert.strictEqual(h.inclinationDeg, 28.5);
    assert.ok(Math.abs(L.orbitalPeriodMin(h.altKm) - 95) < 1);
    assert.ok(Math.abs(L.orbitalPeriodMin(h.altKm) - h.publishedPeriodMin) < 1);
  });

  t('Starlink shell: FCC 550 km / 53° / 72 × 22, period ~95.5 min', () => {
    const s = byId('starlink-550');
    assert.deepStrictEqual([s.altKm, s.inclinationDeg, s.planes, s.satsPerPlane], [550, 53, 72, 22]);
    assert.ok(Math.abs(L.orbitalPeriodMin(s.altKm) - 95.5) < 0.1);
    assert.ok(Math.abs(L.orbitalPeriodMin(s.altKm) - s.publishedPeriodMin) < 1);
  });

  t('chips: altitude, inclination, period (+ satellite count for the shell)', () => {
    assert.deepStrictEqual(L.leoChips(byId('hubble')).map((c) => [c.label, c.value]), [['Altitude', '540 km'], ['Inclination', '28.5°'], ['Period', '95.3 min']]);
    assert.deepStrictEqual(L.leoChips(byId('starlink-550')).map((c) => [c.label, c.value]), [['Altitude', '550 km'], ['Inclination', '53°'], ['Period', '95.5 min'], ['Satellites', '1,584']]);
  });

  t('toggle state: all off at start, on/off per id, unknown ids ignored', () => {
    const st = L.createLeoToggleState();
    assert.deepStrictEqual(st.list(), []);
    assert.strictEqual(st.toggle('hubble'), true);
    assert.strictEqual(st.toggle('starlink-550'), true);
    assert.deepStrictEqual(st.list(), ['hubble', 'starlink-550']);
    assert.strictEqual(st.toggle('hubble'), false);
    assert.deepStrictEqual(st.list(), ['starlink-550']);
    assert.strictEqual(st.set('nope', true), false);
    assert.strictEqual(st.isOn('nope'), false);
  });

  t('sources cited in code; leo.js re-exports the catalog; main.js + earth.js wire it into the LEO view', () => {
    const cat = read('cosmos/js/leo-catalog.js');
    assert.ok(cat.includes('science.nasa.gov') && cat.includes('docs.fcc.gov/public/attachments/DA-19-1294A1.pdf'));
    assert.ok(/export \{[^}]*LEO_TOGGLES[^}]*\} from "\.\/leo-catalog\.js"/.test(read('cosmos/js/leo.js')));
    const main = read('cosmos/js/main.js');
    assert.ok(/from "\.\/leo\.js"/.test(main) && /setLeoToggle\(/.test(main) && /initLeoCatalog\(/.test(main));
    const earth = read('cosmos/js/earth.js');
    assert.ok(/export function initLeoCatalog/.test(earth) && /export function setLeoToggle/.test(earth));
    assert.ok(read('cosmos/index.html').includes('id="leo-toggles"'));
  });

  console.log(`\n${pass} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
