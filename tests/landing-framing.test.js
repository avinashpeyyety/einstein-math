#!/usr/bin/env node
/* C1b (v2.6.11): the final landing camera keeps the whole vehicle + pad/tower on screen, with margin, in the band
 * left free by the Earth bar and the time dock — plain Node, no deps. Pixel margins at 360/1024/1440px are
 * measured by the headless-Chrome touchdown smoke (window.__spaceLab.landingBox()).
 * Run: node tests/landing-framing.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  const { landingFit, LANDING_FIT_PAD } = await import(pathToFileURL(path.join(ROOT, 'cosmos/js/recovery.js')).href);
  let pass = 0;
  const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

  // Pinhole projection of a sphere seen from `dist` along the view axis, look-point lifted by `lift` (screen-up).
  // Returns the sphere's screen extent in pixels, and the free band it must sit in.
  const frame = (W, H, fovDeg, topInset, bottomInset, radius) => {
    const aspect = W / H;
    const { dist, lift } = landingFit({ radius, aspect, fovDeg, topInset, bottomInset });
    const tanV = Math.tan((fovDeg / 2) * Math.PI / 180);
    const depth = dist; // sphere centre sits on the view axis, `lift` above the look point
    const angR = Math.asin(Math.min(1, radius / depth));
    const halfPx = H / 2 / tanV;
    const cy = H / 2 + (lift / depth) * halfPx; // sphere centre is below the look point by `lift` → lower on screen
    const r = Math.tan(angR) * halfPx;
    return { x0: W / 2 - r, x1: W / 2 + r, y0: cy - r, y1: cy + r, bandTop: topInset * H, bandBottom: (1 - bottomInset) * H };
  };

  const cases = [
    // [W, H, topInset, bottomInset] — insets from the touchdown smoke (bar bottom / dock top) after C1b
    [360, 740, 430 / 740, 153 / 740],
    [1024, 768, 378 / 768, 126 / 768],
    [1440, 900, 337 / 900, 126 / 900],
    [1280, 800, 0.4, 0.15],
    [390, 844, 0.5, 0.2],
  ];
  for (const [W, H, top, bottom] of cases) {
    for (const radius of [0.3, 1, 4]) {
      t(`fits vehicle+pad in free band with margin at ${W}x${H} (r=${radius})`, () => {
        const f = frame(W, H, 50, top, bottom, radius);
        const margin = Math.min(f.x0, W - f.x1, f.y0 - f.bandTop, f.bandBottom - f.y1);
        assert.ok(margin >= 8, `min margin ${margin.toFixed(1)}px < 8px`);
        // and it isn't a speck: the pair fills a fair share of the free band
        assert.ok((f.y1 - f.y0) >= 0.4 * (f.bandBottom - f.bandTop) || (f.x1 - f.x0) >= 0.4 * W, 'too far out');
      });
    }
  }
  t('margin pad is real breathing room', () => assert.ok(LANDING_FIT_PAD >= 1.2));
  t('bigger top bar → camera pulls back further', () => {
    const a = landingFit({ radius: 1, aspect: 0.5, topInset: 0.2, bottomInset: 0.2 }).dist;
    const b = landingFit({ radius: 1, aspect: 0.5, topInset: 0.55, bottomInset: 0.2 }).dist;
    assert.ok(b > a);
  });

  const earth = read('cosmos/js/earth.js');
  t('RTLS/droneship final camera uses the fit on booster + pad', () => {
    assert.match(earth, /fitLandingCam\(api, \[booster, marker\]/);
    assert.match(earth, /landingFit\(\{ radius: sphere\.radius, \.\.\.\(api\.view \|\| \{\}\) \}\)/);
  });
  t('tower catch camera stays inset-aware', () => {
    assert.match(earth, /function towerCatchCam[\s\S]*?topInset[\s\S]*?bottomInset/);
  });
  t('smoke hook exposes the landing screen box', () => {
    assert.match(earth, /export function landingScreenBox/);
    assert.match(read('cosmos/js/main.js'), /landingBox/);
  });
  t('phones compact the bar during a flight', () => {
    assert.match(read('cosmos/css/styles.css'), /\.earth-bar\.is-ascent \.earth-caption,\s*\.earth-bar\.is-ascent \.earth-missions-label/);
  });
  console.log(`\n${pass} landing-framing checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
