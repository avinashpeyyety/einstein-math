#!/usr/bin/env node
/* C2 (v2.6.1): Starship Super Heavy tower catch (cosmos/js/recovery.js "tower" profile) — plain Node, no deps.
 * Run: node tests/tower-catch.test.js   (from repo root) */
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
  const N = 1000;
  const run = Array.from({ length: N + 1 }, (_, i) => ({ u: i / N, ...R.boosterRecovery(i / N, 'tower') }));
  const order = (xs) => xs.filter((x, i) => x && x !== xs[i - 1]);

  t('phases happen in order: separation → flip → boostback → coast → descent → landing → hover → caught', () => {
    assert.deepStrictEqual(order(run.map((s) => s.phase)), R.CATCH_PHASES);
    assert.deepStrictEqual(R.CATCH_PHASES, ['separation', 'flip', 'boostback', 'coast', 'descent', 'landing', 'hover', 'caught']);
  });

  t('burns: boostback, then the landing burn (no entry burn for Super Heavy), engines on through the hover', () => {
    assert.deepStrictEqual(order(run.map((s) => s.burn)), ['boostback', 'landing']);
    assert.ok(run.filter((s) => s.phase === 'hover').every((s) => s.burn === 'landing'));
    assert.ok(run.filter((s) => s.phase === 'caught').every((s) => s.burn === null));
  });

  t('chopsticks: open during flight, close monotonically, fully closed before or at contact', () => {
    const contact = run.find((s) => s.alt === 0 && s.downrange === 0);
    assert.ok(contact, 'booster reaches the catch point');
    assert.ok(Math.abs(contact.u - R.CATCH_CONTACT_U) < 2 / N);
    assert.strictEqual(contact.armClose, 1, 'arms closed at contact');
    for (const s of run) if (s.u < R.ARM_CLOSE_AT[0]) assert.strictEqual(s.armClose, 0);
    for (let i = 1; i < run.length; i++) assert.ok(run[i].armClose >= run[i - 1].armClose - 1e-12);
    const closedAt = run.find((s) => s.armClose >= 1).u;
    assert.ok(closedAt <= contact.u, 'closed no later than contact');
    // the booster is close to the arms (hovering) while they close
    assert.ok(run.filter((s) => s.armClose > 0 && s.armClose < 1).every((s) => s.alt < 0.1 && ['landing', 'hover'].includes(s.phase)));
  });

  t('ends held at the catch point: downrange 0, alt 0, speed 0, upright, label says caught', () => {
    const end = R.boosterRecovery(1, 'tower');
    assert.deepStrictEqual([end.phase, end.downrange, end.alt, end.speed, end.tilt, end.armClose], ['caught', 0, 0, 0, 0, 1]);
    assert.ok(/^Caught! The tower grabbed the booster/.test(end.label));
    for (const s of run.filter((x) => x.phase === 'caught')) assert.ok(s.speed === 0 && s.alt === 0);
    const hover = run.filter((s) => s.phase === 'hover');
    assert.ok(hover[hover.length - 1].speed < 0.1, 'soft settle onto the arms');
  });

  t('motion is continuous and never below the catch point; C1 profiles unchanged', () => {
    for (let i = 1; i < run.length; i++) {
      assert.ok(Math.abs(run[i].alt - run[i - 1].alt) < 0.01 && Math.abs(run[i].downrange - run[i - 1].downrange) < 0.01, 'jump at ' + i);
      assert.ok(run[i].alt >= 0);
    }
    assert.strictEqual(R.boosterRecovery(1, 'lz').phase, 'landed');
    assert.strictEqual(R.boosterRecovery(0.5, 'lz').armClose, 0);
  });

  t('mission wiring: starship-ift5 not stubbed, recovery "tower", chopsticks + camera framing in earth.js', () => {
    const earth = read('cosmos/js/earth.js');
    const stubs = earth.slice(earth.indexOf('export const STUB_MISSIONS'), earth.indexOf('export const LAUNCH_MISSIONS'));
    assert.ok(!stubs.includes('starship-ift5'));
    const block = earth.slice(earth.indexOf('id: "starship-ift5"'), earth.indexOf('}', earth.indexOf('id: "starship-ift5"')));
    assert.ok(/recovery: "tower"/.test(block) && /siteId: "boca"/.test(block));
    assert.ok(/function animateTowerCatch/.test(earth) && /function setChopsticks/.test(earth) && /export function towerScreenBox/.test(earth));
    assert.ok(/boosterRecovery\(u, "tower"\)/.test(earth));
    const space = read('js/space.js');
    assert.ok(!/Coming soon/.test(space.slice(space.indexOf("id: 'landings'"), space.indexOf('working()'))));
  });

  console.log(`\n${pass} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
