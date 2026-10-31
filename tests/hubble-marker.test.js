#!/usr/bin/env node
/* C3b (v2.6.13): Hubble is easy to spot in the LEO view — halo + "HUBBLE" tag, phone framing keeps its orbit
 * between the bar and the dock. Plain Node, no deps. Pixel checks (Hubble on screen, not under the bar / panel /
 * dock, 0 JS errors at 360/1024/1280px) run in the headless-Chrome smoke via window.__spaceLab.hubbleBox().
 * Run: node tests/hubble-marker.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  const { landingFit } = await import(pathToFileURL(path.join(ROOT, 'cosmos/js/recovery.js')).href);
  const earth = read('cosmos/js/earth.js');
  const main = read('cosmos/js/main.js');
  const css = read('cosmos/css/styles.css');
  let pass = 0;
  const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

  t('Hubble craft gets a halo + name tag', () => {
    assert.match(earth, /addHubbleMarker\(craft, e\.color\)/);
    assert.match(earth, /fillText\("HUBBLE"/);
  });
  t('marker is screen-sized and drawn over the globe, dimmed (not hidden) behind it', () => {
    const fn = earth.slice(earth.indexOf('function addHubbleMarker'), earth.indexOf('/** Build the toggle objects once'));
    assert.equal((fn.match(/sizeAttenuation: false, depthTest: false/g) || []).length, 2);
    assert.match(fn, /hit > 0 && hit < L \? 0\.5 : 1/);
  });
  t('marker is ≥ 32 px at 740 px tall (fov 50°)', () => {
    const scale = +earth.match(/const HUBBLE_HALO_SCALE = ([\d.]+)/)[1];
    const px = scale / Math.tan(25 * Math.PI / 180) * 740 / 2;
    assert.ok(px >= 32, `${px.toFixed(1)}px`);
  });
  t('portrait LEO camera fits Hubble\'s orbit with landingFit; main passes the bar/dock insets', () => {
    assert.match(earth, /export function getLeoCameraFrame\(view\)[\s\S]*?view\.aspect < 1[\s\S]*?landingFit\(/);
    assert.match(main, /getLeoCameraFrame\(leoView\(\)\)/);
    assert.match(earth, /maxDist: EARTH_R \* 24/); // OrbitControls must not clamp the pull-back
  });
  t('360×740 framing: Hubble orbit sphere sits inside the band between bar and dock', () => {
    const H = 740, top = 462 / H, bottom = 153 / H, fov = 50, tanV = Math.tan(25 * Math.PI / 180);
    const radius = 1.2;
    const { dist, lift } = landingFit({ radius, aspect: 360 / H, fovDeg: fov, topInset: top, bottomInset: bottom });
    assert.ok(dist / 1 <= 24 * 1, 'within maxDist (EARTH_R units, radius in EARTH_R)');
    const cy = H / 2 + (lift / dist) / tanV * H / 2;
    assert.ok(cy > top * H && cy < (1 - bottom) * H, `centre ${cy.toFixed(0)} in band`);
  });
  t('phones shorten the LEO bar (caption / phase / labels hidden, toggles + facts stay)', () => {
    const m = css.slice(css.indexOf('C3b: shorter LEO bar'));
    assert.match(m, /body\.leo-mode \.earth-bar \.earth-phase,\s*body\.leo-mode \.earth-bar \.earth-caption/);
    assert.doesNotMatch(m.split('}')[0], /leo-toggle-row|meta-chip/);
  });
  t('smoke hook exposes Hubble\'s screen box', () => {
    assert.match(earth, /export function hubbleScreenBox/);
    assert.match(main, /hubbleBox: \(\) =>/);
  });
  console.log(`\n${pass} hubble-marker checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
