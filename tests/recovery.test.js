#!/usr/bin/env node
/* C1 (v2.5.8): Falcon 9 booster recovery model (cosmos/js/recovery.js) — plain Node, no deps.
 * Run: node tests/recovery.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  const R = await import(pathToFileURL(path.join(ROOT, 'cosmos/js/recovery.js')).href);
  let pass = 0;
  const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
  const run = (target, n = 400) => Array.from({ length: n + 1 }, (_, i) => R.boosterRecovery(i / n, target));
  const order = (xs) => xs.filter((x, i) => x && x !== xs[i - 1]);

  t('RTLS: phases happen in order and every phase appears', () => {
    const seen = order(run('lz').map((s) => s.phase));
    assert.deepStrictEqual(seen, R.RECOVERY_PHASES);
  });

  t('RTLS: boostback → entry → landing burns, in that order, with the plume only during burns', () => {
    const burns = order(run('lz').map((s) => s.burn));
    assert.deepStrictEqual(burns, ['boostback', 'entry', 'landing']);
    for (const s of run('lz')) assert.strictEqual(!!s.burn, ['boostback', 'entry', 'landing'].includes(s.phase));
  });

  t('RTLS: boostback turns the booster back toward the launch site; entry burn slows it', () => {
    const s = run('lz');
    const bb = s.filter((x) => x.phase === 'boostback');
    assert.ok(bb[bb.length - 1].downrange < bb[0].downrange - 0.15, 'heading home');
    assert.ok(bb.every((x) => x.tilt < 0), 'nose points home during boostback');
    const en = s.filter((x) => x.phase === 'entry');
    assert.ok(Math.min(...en.map((x) => x.speed)) < en[0].speed * 0.8, 'entry burn slows the booster');
  });

  t('RTLS: lands upright on the pad with ~0 speed', () => {
    const end = R.boosterRecovery(1, 'lz');
    assert.strictEqual(end.phase, 'landed');
    assert.strictEqual(end.downrange, 0);
    assert.strictEqual(end.alt, 0);
    assert.strictEqual(end.tilt, 0);
    assert.ok(end.speed < 0.05);
    const near = R.boosterRecovery(0.99, 'lz');
    assert.ok(near.speed < 0.15 && near.alt < 0.01 && Math.abs(near.downrange) < 0.01, 'soft, on-target final approach');
  });

  t('motion is continuous (no teleports) and altitude never goes below the ground', () => {
    for (const target of ['lz', 'droneship']) {
      const s = run(target, 1000);
      for (let i = 1; i < s.length; i++) {
        assert.ok(Math.abs(s[i].downrange - s[i - 1].downrange) < 0.01, `${target} downrange jump at ${i}`);
        assert.ok(Math.abs(s[i].alt - s[i - 1].alt) < 0.01, `${target} alt jump at ${i}`);
        assert.ok(s[i].alt >= 0);
      }
    }
  });

  t('droneship: no boostback, entry + landing burns, lands on the ship downrange', () => {
    assert.deepStrictEqual(order(run('droneship').map((s) => s.burn)), ['entry', 'landing']);
    const end = R.boosterRecovery(1, 'droneship');
    assert.strictEqual(end.downrange, R.DRONESHIP_DOWNRANGE);
    assert.ok(end.alt === 0 && end.speed < 0.05 && end.tilt === 0);
  });

  t('mission wiring: f9-rtls is not stubbed and lands on the LZ; starlink uses the droneship; earth.js draws both', () => {
    const earth = read('cosmos/js/earth.js');
    const stubs = earth.slice(earth.indexOf('export const STUB_MISSIONS'), earth.indexOf('export const LAUNCH_MISSIONS'));
    assert.ok(!stubs.includes('f9-rtls'));
    const block = (id) => earth.slice(earth.indexOf(`id: "${id}"`), earth.indexOf('}', earth.indexOf(`id: "${id}"`)));
    assert.ok(/recovery: "lz"/.test(block('f9-rtls')));
    assert.ok(/recovery: "droneship"/.test(block('f9-starlink')));
    assert.ok(/function makeLandingZone/.test(earth) && /function makeDroneship/.test(earth));
    assert.ok(/from "\.\/recovery\.js"/.test(earth));
  });

  console.log(`\n${pass} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
