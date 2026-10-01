/* W1b — device-local comicify (canvas only, no network, no model).
 * Implements docs/comic-avatar-style.md §6 local method with a free offline model:
 * face-centred crop → MediaPipe selfie + hair masks (vendored) → skin / hair / clothes regions
 * → edge-preserving flatten (Kuwahara) → flat region fills (real skin & hair tones, clothes → one accent)
 * → ink lines in --ink → paper + halftone / avatarColor burst background.
 * Output: 512×512 PNG + 128×128 derivative (data URLs). The source photo is never stored.
 */
(function () {
  const INK = [26, 26, 46];          // --ink #1A1A2E (never pure black)
  const PAPER = [255, 248, 231];     // --paper #FFF8E7
  const SIZE = 512;
  const SMALL = 128;
  const MAX_BYTES = 150 * 1024;

  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return [78, 205, 196];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  async function loadBitmap(file) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fall through */ }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
      img.src = url;
    });
  }

  /** Square crop: eyes ≈40% from top, face ≈60% of frame height (§5). */
  async function cropBox(src) {
    const w = src.width, h = src.height;
    if (!w || !h) throw new Error('Empty image.');
    if (typeof FaceDetector === 'function') {
      try {
        const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 2 }).detect(src);
        if (faces && faces.length) {
          const f = faces.sort((a, b) => b.boundingBox.width - a.boundingBox.width)[0].boundingBox;
          let side = Math.min(Math.max(f.height / 0.45, f.width / 0.38), w, h);
          let x = f.x + f.width / 2 - side / 2;
          let y = f.y + f.height * 0.4 - side * 0.4;
          x = Math.max(0, Math.min(w - side, x));
          y = Math.max(0, Math.min(h - side, y));
          return { x, y, side, face: true, faces: faces.length };
        }
      } catch (_) { /* no detector available */ }
    }
    // Heuristic for typical selfies / portraits: subject centred, head in upper part.
    const side = Math.min(w, h);
    const x = (w - side) / 2;
    const y = h > w ? Math.min(h - side, (h - side) * 0.2) : 0;
    return { x, y, side, face: false, faces: 0 };
  }

  const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  /** Kuwahara filter: flattens photo texture while keeping edges sharp. */
  function kuwahara(src, w, h, r) {
    const n = w * h;
    // integral images for r,g,b,l,l²
    const W = w + 1;
    const S = [0, 1, 2, 3, 4].map(() => new Float64Array(W * (h + 1)));
    for (let y = 0; y < h; y++) {
      let a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const R = src[i], G = src[i + 1], B = src[i + 2], L = luma(R, G, B);
        a0 += R; a1 += G; a2 += B; a3 += L; a4 += L * L;
        const j = (y + 1) * W + (x + 1), k = y * W + (x + 1);
        S[0][j] = S[0][k] + a0; S[1][j] = S[1][k] + a1; S[2][j] = S[2][k] + a2;
        S[3][j] = S[3][k] + a3; S[4][j] = S[4][k] + a4;
      }
    }
    const sum = (s, x0, y0, x1, y1) => s[(y1 + 1) * W + (x1 + 1)] - s[y0 * W + (x1 + 1)] - s[(y1 + 1) * W + x0] + s[y0 * W + x0];
    const out = new Uint8ClampedArray(n * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let best = Infinity, br = 0, bg = 0, bb = 0;
        const quads = [[x - r, y - r, x, y], [x, y - r, x + r, y], [x - r, y, x, y + r], [x, y, x + r, y + r]];
        for (const q of quads) {
          const x0 = Math.max(0, q[0]), y0 = Math.max(0, q[1]);
          const x1 = Math.min(w - 1, q[2]), y1 = Math.min(h - 1, q[3]);
          const cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
          const mL = sum(S[3], x0, y0, x1, y1) / cnt;
          const v = sum(S[4], x0, y0, x1, y1) / cnt - mL * mL;
          if (v < best) {
            best = v;
            br = sum(S[0], x0, y0, x1, y1) / cnt;
            bg = sum(S[1], x0, y0, x1, y1) / cnt;
            bb = sum(S[2], x0, y0, x1, y1) / cnt;
          }
        }
        const i = (y * w + x) * 4;
        out[i] = br; out[i + 1] = bg; out[i + 2] = bb; out[i + 3] = 255;
      }
    }
    return out;
  }

  function boxBlurLum(L, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += L[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc / (2 * r + 1);
        acc += L[y * w + Math.min(w - 1, x + r + 1)] - L[y * w + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / (2 * r + 1);
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  function erode(mask, w, h, r) {
    const inv = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) inv[p] = mask[p] ? 0 : 1;
    const d = dilate(inv, w, h, r), out = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) out[p] = d[p] ? 0 : 1;
    return out;
  }

  function dilate(mask, w, h, r) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r) continue;
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) out[yy * w + xx] = 1;
      }
    }
    return out;
  }

  /** Head-and-shoulders guide shape (normalised 0..1); the crop UI draws the same outline. */
  function inGuide(u, v) {
    const ex = (u - 0.5) / 0.31, ey = (v - 0.40) / 0.37;
    if (ex * ex + ey * ey <= 1) return true;
    if (v < 0.68) return false;
    const half = v >= 0.92 ? 0.5 : 0.30 + (v - 0.68) / 0.24 * 0.20;
    return Math.abs(u - 0.5) <= half;
  }

  const ACCENTS = [[255, 230, 109], [255, 107, 53], [78, 205, 196], [255, 107, 157], [167, 139, 250]];
  const shade = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
  const colorDistC = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  const colorDist = (px, p, c) => colorDistC([px[p * 4], px[p * 4 + 1], px[p * 4 + 2]], c);
  const posterize3 = (c) => c.map((v) => (v < 85 ? 40 : v < 170 ? 128 : 220));

  function rgbHsv(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let hh = 0;
    if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(hh * 60 + 360) % 360, mx ? d / mx : 0, mx];
  }

  /** Clothing → nearest palette accent when the garment has colour; dark/neutral garments stay a flat neutral. */
  function pickAccent(c) {
    const [hh, sat, val] = rgbHsv(c);
    if (sat < 0.22 || val < 0.22) {
      const l = luma(c[0], c[1], c[2]);
      const v = l < 70 ? 62 : l < 150 ? 120 : 214;
      return [v, v, v + 14]; // flat ink-tinted neutral (suits, black/white tees)
    }
    let best = ACCENTS[0], bd = 1e9;
    for (const a of ACCENTS) { const ah = rgbHsv(a)[0]; const dh = Math.min(Math.abs(ah - hh), 360 - Math.abs(ah - hh)); if (dh < bd) { bd = dh; best = a; } }
    return best;
  }

  function smoothMask(m, w, h, r) {
    const f = new Float32Array(w * h);
    for (let p = 0; p < w * h; p++) f[p] = m[p] * 255;
    const b = boxBlurLum(f, w, h, r), out = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) out[p] = b[p] >= 128 ? 1 : 0;
    return out;
  }

  /** Label 4-connected components; returns [labels, sizes, bboxes]. */
  function components(m, w, h) {
    const lab = new Int32Array(w * h).fill(-1), sizes = [], boxes = [], st = [];
    for (let s0 = 0; s0 < w * h; s0++) {
      if (!m[s0] || lab[s0] >= 0) continue;
      const id = sizes.length; let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
      st.push(s0); lab[s0] = id;
      while (st.length) {
        const p = st.pop(), x = p % w, y = (p / w) | 0; n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
        for (const q of nb) if (q >= 0 && m[q] && lab[q] < 0) { lab[q] = id; st.push(q); }
      }
      sizes.push(n); boxes.push([x0, y0, x1, y1]);
    }
    return [lab, sizes, boxes];
  }

  /** Remove ink specks: components whose extent is under `minExtent` px or area under `minArea`. */
  function dropSmall(m, w, h, minExtent, minArea) {
    const [lab, sizes, boxes] = components(m, w, h);
    const keep = sizes.map((n, i) => n >= minArea && Math.max(boxes[i][2] - boxes[i][0], boxes[i][3] - boxes[i][1]) + 1 >= minExtent);
    const out = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) if (lab[p] >= 0 && keep[lab[p]]) out[p] = 1;
    return out;
  }

  /** Majority (mode) filter over flat colours inside the figure; kills small islands like logos. */
  function majority(px, fg, w, h, passes) {
    const r = 3;
    for (let k = 0; k < passes; k++) {
      const src = new Uint8ClampedArray(px);
      for (let y = r; y < h - r; y += 1) for (let x = r; x < w - r; x++) {
        const p = y * w + x;
        if (!fg[p]) continue;
        const counts = new Map();
        let bestKey = 0, bestN = 0;
        for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) {
          const q = p + dy * w + dx;
          if (!fg[q]) continue;
          const key = (src[q * 4] << 16) | (src[q * 4 + 1] << 8) | src[q * 4 + 2];
          const n = (counts.get(key) || 0) + 1; counts.set(key, n);
          if (n > bestN) { bestN = n; bestKey = key; }
        }
        if (bestN >= 9) { px[p * 4] = (bestKey >> 16) & 255; px[p * 4 + 1] = (bestKey >> 8) & 255; px[p * 4 + 2] = bestKey & 255; }
      }
    }
  }

  async function exportPng(canvas) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const dataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });
    return { blob, dataUrl, bytes: blob.size };
  }

  function quantize(px, step) {
    for (let i = 0; i < px.length; i += 4) {
      px[i] = Math.round(px[i] / step) * step;
      px[i + 1] = Math.round(px[i + 1] / step) * step;
      px[i + 2] = Math.round(px[i + 2] / step) * step;
    }
  }

  async function load(file) {
    if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Please pick a photo.');
    const src = await loadBitmap(file);
    const box = await cropBox(src);
    return { src, box };
  }

  async function fromFile(file, opts = {}) {
    const { src, box } = await load(file);
    return render(src, opts.crop || box, opts);
  }

  /* ---------- on-device segmentation (MediaPipe selfie + hair segmenters, vendored) ----------
   * selfie_segmenter (~250 KB) gives the person, hair_segmenter (~780 KB) gives hair, so hair vs face never
   * depends on colour. Face/body skin vs clothes is then split by skin colour inside the non-hair person.
   * Loaded lazily from ./vendor/mediapipe/ only when the photo modal opens; never from a CDN.
   * Only the SIMD wasm build ships; a browser without wasm SIMD fails here and keeps the letter avatar. */
  const SEG = { BG: 0, HAIR: 1, BODY: 2, FACE: 3, CLOTH: 4 };
  let segPromise = null;
  function loadSegmenter(baseUrl) {
    if (!segPromise) {
      segPromise = (async () => {
        const abs = new URL(baseUrl || 'vendor/mediapipe/', document.baseURI).href;
        const vision = await import(abs + 'vision_bundle.mjs');
        const fileset = { wasmLoaderPath: abs + 'wasm/vision_wasm_internal.js', wasmBinaryPath: abs + 'wasm/vision_wasm_internal.wasm' };
        const make = (m) => vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: abs + m, delegate: 'CPU' },
          runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false
        });
        const person = await make('selfie_segmenter.tflite');
        const hair = await make('hair_segmenter.tflite');
        return { person, hair };
      })().catch((err) => { segPromise = null; throw err; });
    }
    return segPromise;
  }

  function sampleMask(res, w, h, test) {
    const m = res.categoryMask, raw = m.getAsUint8Array(), mw = m.width, mh = m.height;
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      out[y * w + x] = test(raw[Math.min(mh - 1, (y * mh / h) | 0) * mw + Math.min(mw - 1, (x * mw / w) | 0)]) ? 1 : 0;
    }
    if (res.close) res.close();
    return out;
  }

  /** Fill holes: anything not reachable from the border through non-mask pixels joins the mask. */
  function fillHoles(m, w, h) {
    const seen = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) { st.push(x, (h - 1) * w + x); }
    for (let y = 0; y < h; y++) { st.push(y * w, y * w + w - 1); }
    while (st.length) {
      const p = st.pop();
      if (seen[p] || m[p]) continue;
      seen[p] = 1;
      const x = p % w;
      if (x > 0) st.push(p - 1); if (x < w - 1) st.push(p + 1);
      if (p >= w) st.push(p - w); if (p < w * (h - 1)) st.push(p + w);
    }
    const out = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) out[p] = seen[p] ? 0 : 1;
    return out;
  }

  async function segmentLabels(canvas, w, h, baseUrl) {
    const seg = await loadSegmenter(baseUrl);
    let person = sampleMask(seg.person.segment(canvas), w, h, (v) => v === 0);
    let hair = sampleMask(seg.hair.segment(canvas), w, h, (v) => v === 1);
    person = smoothMask(person, w, h, 3);
    hair = smoothMask(hair, w, h, 2);
    for (let p = 0; p < w * h; p++) if (hair[p]) person[p] = 1;
    // keep the largest person blob (drops stray background specks, e.g. bright patches near shoulders)
    {
      const [labs, sizes] = components(person, w, h);
      let best = 0; for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
      for (let p = 0; p < w * h; p++) if (person[p] && labs[p] !== best) person[p] = 0;
      person = fillHoles(person, w, h);
    }
    const lab = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) lab[p] = !person[p] ? SEG.BG : hair[p] ? SEG.HAIR : SEG.CLOTH;
    return lab;
  }

  /** Smooth a class map with a majority vote so region outlines are clean brush-like curves. */
  function smoothLabels(lab, w, h, r, passes) {
    let cur = lab;
    for (let k = 0; k < passes; k++) {
      const next = new Uint8Array(cur);
      const cnt = new Uint16Array(6);
      for (let y = r; y < h - r; y++) for (let x = r; x < w - r; x++) {
        cnt.fill(0);
        for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) cnt[cur[(y + dy) * w + x + dx]]++;
        let best = cur[y * w + x], bn = 0;
        for (let c = 0; c < 6; c++) if (cnt[c] > bn) { bn = cnt[c]; best = c; }
        next[y * w + x] = best;
      }
      cur = next;
    }
    return cur;
  }

  function medianColor(px, sel) {
    const vals = [];
    for (let p = 0; p < sel.length; p++) if (sel[p]) vals.push([luma(px[p * 4], px[p * 4 + 1], px[p * 4 + 2]), p]);
    if (vals.length < 150) return null;
    vals.sort((a, b) => a[0] - b[0]);
    const lo = Math.floor(vals.length * 0.3), hi = Math.floor(vals.length * 0.8);
    let r = 0, g = 0, b = 0;
    for (let i = lo; i < hi; i++) { const p = vals[i][1]; r += px[p * 4]; g += px[p * 4 + 1]; b += px[p * 4 + 2]; }
    const n = Math.max(1, hi - lo);
    return [r / n, g / n, b / n];
  }

  /** crop = { x, y, side } in source pixels (from the crop UI or the default guess). */
  async function render(src, box, opts = {}) {
    const w = SIZE, h = SIZE, N = w * h;
    const work = document.createElement('canvas');
    work.width = w; work.height = h;
    const ctx = work.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = 'rgb(255,248,231)';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, box.x, box.y, box.side, box.side, 0, 0, w, h);

    // person mask + regions first (on the untouched crop). No mask → caller keeps the letter avatar.
    let lab = await segmentLabels(work, w, h, opts.modelBase);
    lab = smoothLabels(lab, w, h, 3, 2);
    let figure = 0; for (let p = 0; p < N; p++) if (lab[p]) figure++;
    if (figure < N * 0.08) throw new Error('No person found in the photo');

    const raw = ctx.getImageData(0, 0, w, h);
    {
      const d = raw.data, hist = new Uint32Array(256);
      for (let i = 0; i < d.length; i += 4) hist[Math.round(luma(d[i], d[i + 1], d[i + 2]))]++;
      let acc = 0, hi = 255;
      for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= N * 0.02) { hi = v; break; } }
      const gain = Math.min(2.2, Math.max(1, 225 / Math.max(1, hi)));
      if (gain > 1.05) for (let i = 0; i < d.length; i += 4) { d[i] *= gain; d[i + 1] *= gain; d[i + 2] *= gain; }
    }
    let flat = kuwahara(raw.data, w, h, 5);
    flat = kuwahara(flat, w, h, 3);
    const L = new Float32Array(N);
    for (let p = 0; p < N; p++) L[p] = luma(flat[p * 4], flat[p * 4 + 1], flat[p * 4 + 2]);
    const Ls = boxBlurLum(L, w, h, 3);
    const Lwide = boxBlurLum(L, w, h, 14);

    // split the non-hair person into face skin / body skin / clothes by colour, seeded from the face centre
    {
      let hy0 = h, hx0 = w, hx1 = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lab[y * w + x] === SEG.HAIR) { if (y < hy0) hy0 = y; if (x < hx0) hx0 = x; if (x > hx1) hx1 = x; }
      let py0 = h; for (let p = 0; p < N; p++) if (lab[p]) { py0 = Math.floor(p / w); break; }
      const top = Math.min(hy0, py0), cx = hx1 > hx0 ? (hx0 + hx1) / 2 : w / 2;
      const seedSel = new Uint8Array(N);
      const sy0 = Math.round(top + h * 0.14), sy1 = Math.round(top + h * 0.42);
      for (let y = sy0; y < Math.min(h, sy1); y++) for (let x = Math.round(cx - w * 0.12); x < Math.round(cx + w * 0.12); x++) {
        const p = y * w + x; if (x >= 0 && x < w && lab[p] === SEG.CLOTH) seedSel[p] = 1;
      }
      const seed = medianColor(flat, seedSel) || [190, 140, 110];
      const sS = seed[0] + seed[1] + seed[2] + 1, sr = seed[0] / sS, sg = seed[1] / sS, sL = luma(seed[0], seed[1], seed[2]);
      const skinish = new Uint8Array(N);
      for (let p = 0; p < N; p++) {
        if (lab[p] !== SEG.CLOTH) continue;
        const r = flat[p * 4], g = flat[p * 4 + 1], b = flat[p * 4 + 2], S = r + g + b + 1;
        const dc = Math.hypot(r / S - sr, g / S - sg), lr = L[p] / Math.max(1, sL);
        if (dc < 0.07 && lr > 0.3 && lr < 2.0) skinish[p] = 1;
      }
      // clothes = large non-skin areas reaching the bottom edge (shirts, hijabs, collars); non-skin islands
      // inside the face (eyes, glasses, shadows, specular shine) stay skin
      const non = new Uint8Array(N);
      for (let p = 0; p < N; p++) non[p] = lab[p] === SEG.CLOTH && !skinish[p] ? 1 : 0;
      const nonE = erode(smoothMask(non, w, h, 2), w, h, 2);
      const [nl, ns, nb] = components(nonE, w, h);
      const keep = new Uint8Array(ns.length);
      for (let i = 0; i < ns.length; i++) if (nb[i][3] >= h - 3 && ns[i] > N * 0.01) keep[i] = 1;
      let cloth = new Uint8Array(N);
      for (let p = 0; p < N; p++) cloth[p] = nl[p] >= 0 && keep[nl[p]] ? 1 : 0;
      cloth = dilate(cloth, w, h, 2);
      for (let p = 0; p < N; p++) cloth[p] = cloth[p] && non[p] ? 1 : 0;
      const chin0 = Math.round(top + h * 0.62);
      // above the chin, a "clothes" pixel must look like the clothes below the chin rather than lit or shaded skin
      {
        const below = new Uint8Array(N);
        for (let p = chin0 * w; p < N; p++) below[p] = cloth[p];
        const cref = medianColor(flat, below);
        if (cref) {
          const deep = shade(seed, 0.55);
          const d2 = (p, c) => (flat[p * 4] - c[0]) ** 2 + (flat[p * 4 + 1] - c[1]) ** 2 + (flat[p * 4 + 2] - c[2]) ** 2;
          // only between this row's own hair / skin pixels (a face framed by hair), never a hijab beside the face
          for (let y = 0; y < chin0; y++) {
            let x0 = w, x1 = -1;
            for (let x = 0; x < w; x++) { const p = y * w + x; if (lab[p] === SEG.HAIR || (skinish[p] && !cloth[p])) { if (x < x0) x0 = x; x1 = x; } }
            for (let x = x0 + 1; x < x1; x++) { const p = y * w + x; if (cloth[p] && Math.min(d2(p, seed), d2(p, deep)) < d2(p, cref)) cloth[p] = 0; }
          }
        }
      }
      cloth = smoothMask(cloth, w, h, 4);
      for (let p = 0; p < N; p++) cloth[p] = cloth[p] && lab[p] === SEG.CLOTH ? 1 : 0;
      const chin = Math.round(top + h * 0.62);
      let faceM = new Uint8Array(N);
      for (let p = 0; p < N; p++) if (lab[p] === SEG.CLOTH && !cloth[p]) faceM[p] = 1;
      // the face is the skin blob around the seed window; other skin (neck, hands) is body
      const [fl, fs] = components(faceM, w, h);
      const cnt = new Map();
      for (let p = 0; p < N; p++) if (seedSel[p] && fl[p] >= 0) cnt.set(fl[p], (cnt.get(fl[p]) || 0) + 1);
      let faceId = -1, bestN = 0;
      for (const [id, n] of cnt) if (n > bestN) { bestN = n; faceId = id; }
      for (let p = 0; p < N; p++) {
        if (lab[p] !== SEG.CLOTH || cloth[p] || fl[p] < 0) continue;
        if (fl[p] === faceId && p < chin * w) lab[p] = SEG.FACE;
        else if (fs[fl[p]] <= 400 && fl[p] !== faceId) lab[p] = SEG.CLOTH;  // skin-coloured specks on clothes / hijab
        else if (fs[fl[p]] > 400 && p >= Math.round(top + h * 0.35) * w) lab[p] = SEG.BODY;
        else if (fs[fl[p]] > 400) lab[p] = SEG.CLOTH;  // skin-coloured patch up at hair height: fabric, not a neck
        else lab[p] = SEG.FACE;
      }
    }

    const is = (c) => { const m = new Uint8Array(N); for (let p = 0; p < N; p++) m[p] = lab[p] === c ? 1 : 0; return m; };
    const faceM = is(SEG.FACE), bodyM = is(SEG.BODY), hairM = is(SEG.HAIR), clothM = is(SEG.CLOTH);
    const skinM = new Uint8Array(N); for (let p = 0; p < N; p++) skinM[p] = faceM[p] || bodyM[p];

    const skin = medianColor(flat, faceM) || medianColor(flat, skinM) || [190, 140, 110];
    const skinL = luma(skin[0], skin[1], skin[2]);
    const hairC = medianColor(flat, hairM) || shade(skin, 0.45);
    const hairL = luma(hairC[0], hairC[1], hairC[2]);
    const clothMean = medianColor(flat, clothM);
    const clothC = clothMean ? pickAccent(clothMean) : null;
    const SKIN_SH = shade(skin, 0.8), SKIN_DEEP = shade(skin, 0.62); // darkest skin value ≥ ~60% of base
    const TEETH = [238, 230, 212];

    // face interior: an eroded face core so feature ink never touches the silhouette or hairline
    const core = erode(faceM, w, h, 4);
    // teeth: bright, locally contrasting pixels in the lower face, closed into one shape
    let teeth = new Uint8Array(N);
    {
      let fy0 = h, fy1 = 0; for (let p = 0; p < N; p++) if (faceM[p]) { const y = (p / w) | 0; if (y < fy0) fy0 = y; if (y > fy1) fy1 = y; }
      const yMid = fy0 + (fy1 - fy0) * 0.55;
      let fx0 = w, fx1 = 0; for (let p = 0; p < N; p++) if (faceM[p]) { const x = p % w; if (x < fx0) fx0 = x; if (x > fx1) fx1 = x; }
      const fcx = (fx0 + fx1) / 2, fhw = (fx1 - fx0) * 0.22, yLo = fy0 + (fy1 - fy0) * 0.6, yHi = fy0 + (fy1 - fy0) * 0.9;
      for (let p = 0; p < N; p++) {
        const x = p % w, y = (p / w) | 0;
        if (core[p] && y > yLo && y < yHi && Math.abs(x - fcx) < fhw && L[p] > skinL * 1.2 && L[p] > 150 && L[p] - Lwide[p] > 28) teeth[p] = 1;
      }
      teeth = erode(dilate(teeth, w, h, 3), w, h, 3);
      const [tl, ts, tb] = components(teeth, w, h);
      let bi = -1; for (let i = 0; i < ts.length; i++) if (bi < 0 || ts[i] > ts[bi]) bi = i;
      // a smile reads as one wide shape; a lone glint or shine spot is not teeth
      const okT = bi >= 0 && ts[bi] >= 60 && (tb[bi][2] - tb[bi][0]) >= 1.8 * (tb[bi][3] - tb[bi][1] + 1);
      for (let p = 0; p < N; p++) teeth[p] = (okT && tl[p] === bi) ? 1 : 0;
    }
    // interior features (brows, lids, nose underside, mouth line): darker-than-surroundings valleys inside the core
    let valley = new Uint8Array(N);
    {
      const near = boxBlurLum(L, w, h, 1), around = boxBlurLum(L, w, h, 7);
      const dv = []; for (let p = 0; p < N; p += 2) if (core[p]) dv.push(around[p] - near[p]);
      dv.sort((a, b) => a - b);
      const t = Math.max(skinL * 0.08, dv.length ? dv[Math.floor(dv.length * 0.93)] : 8);
      for (let p = 0; p < N; p++) if (core[p] && !teeth[p] && around[p] - near[p] > t) valley[p] = 1;
      valley = dropSmall(valley, w, h, 10, 24);
    }
    // thin features are inked whole; thick ones (open eyes, nostril shadows) get a 3–4 px ink outline
    const featInk = new Uint8Array(N);
    { const inner = erode(valley, w, h, 2); for (let p = 0; p < N; p++) featInk[p] = valley[p] && !inner[p] ? 1 : 0; }
    const teethInk = new Uint8Array(N);
    { const inner = erode(teeth, w, h, 1); for (let p = 0; p < N; p++) teethInk[p] = teeth[p] && !inner[p] ? 1 : 0; }

    // flat fills: skin base / shadow / deep (floor 62%), hair 3 tones, clothes 1 accent
    const toned = new Uint8ClampedArray(N * 4);
    for (let p = 0; p < N; p++) {
      const l = Ls[p], c0 = lab[p];
      let c;
      if (c0 === SEG.BG) c = PAPER;
      else if (c0 === SEG.FACE || c0 === SEG.BODY) {
        if (teeth[p]) c = TEETH;
        else c = l < skinL * 0.66 ? SKIN_DEEP : l < skinL * 0.84 ? SKIN_SH : skin;
      } else if (c0 === SEG.HAIR) c = l < hairL * 0.72 ? shade(hairC, 0.72) : l > hairL * 1.4 ? shade(hairC, 1.22) : hairC;
      else c = clothC || [120, 120, 134];
      toned[p * 4] = c[0]; toned[p * 4 + 1] = c[1]; toned[p * 4 + 2] = c[2]; toned[p * 4 + 3] = 255;
    }
    const fg = new Uint8Array(N); for (let p = 0; p < N; p++) fg[p] = lab[p] ? 1 : 0;
    majority(toned, fg, w, h, 2);
    for (let p = 0; p < N; p++) if (teeth[p]) { toned[p * 4] = TEETH[0]; toned[p * 4 + 1] = TEETH[1]; toned[p * 4 + 2] = TEETH[2]; }

    // hair strand ink (DoG) in hair only; the face gets only the interior feature pass above
    const g1 = boxBlurLum(Ls, w, h, 1), g2 = boxBlurLum(Ls, w, h, 4);
    const dog = new Float32Array(N);
    for (let p = 0; p < N; p++) dog[p] = lab[p] === SEG.HAIR ? g2[p] - g1[p] : 0;
    const dvh = []; for (let p = 0; p < N; p += 3) if (dog[p] > 0) dvh.push(dog[p]);
    dvh.sort((a, b) => a - b);
    const thr = Math.max(6, dvh.length ? dvh[Math.floor(dvh.length * 0.9)] : 6);
    let edges = new Uint8Array(N);
    for (let p = 0; p < N; p++) if (dog[p] > thr) edges[p] = 1;
    edges = dilate(dropSmall(edges, w, h, 12, 30), w, h, 1);
    for (let p = 0; p < N; p++) if (featInk[p] || teethInk[p]) edges[p] = 1;

    // region seams (skin/hair, hair/clothes, skin/clothes) ≈3 px; silhouette ≈7 px
    const seam = new Uint8Array(N), sil = new Uint8Array(N);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x, a = lab[p];
      if (!a) continue;
      for (const q of [p + 1, p + w, p - 1, p - w]) {
        if (!lab[q]) sil[p] = 1;
        else if (lab[q] !== a && !((a === SEG.FACE && lab[q] === SEG.BODY) || (a === SEG.BODY && lab[q] === SEG.FACE))) seam[p] = 1;
      }
    }
    const seamInk = dilate(dropSmall(seam, w, h, 12, 20), w, h, 1);
    const silInk = dilate(sil, w, h, 3);

    // compose: paper + light halftone + soft avatarColor burst; opaque
    const burst = hexToRgb(opts.avatarColor);
    const out = ctx.createImageData(w, h), o = out.data, cell = 8;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, i = p * 4;
      let r, g, b;
      if (fg[p]) {
        r = toned[i]; g = toned[i + 1]; b = toned[i + 2];
        if (edges[p] || seamInk[p]) { r = INK[0]; g = INK[1]; b = INK[2]; }
      } else {
        const dx = x - w * 0.5, dy = y - h * 0.4;
        const d = Math.sqrt(dx * dx + dy * dy) / (w * 0.62);
        const a = Math.max(0, 0.28 * (1 - d));
        r = PAPER[0] * (1 - a) + burst[0] * a; g = PAPER[1] * (1 - a) + burst[1] * a; b = PAPER[2] * (1 - a) + burst[2] * a;
        const cx = (Math.floor(x / cell) + 0.5) * cell, cy = (Math.floor(y / cell) + 0.5) * cell;
        const rad = 1.4 + 0.9 * d;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) { r = r * 0.9 + INK[0] * 0.1; g = g * 0.9 + INK[1] * 0.1; b = b * 0.9 + INK[2] * 0.1; }
      }
      if (silInk[p]) { r = INK[0]; g = INK[1]; b = INK[2]; }
      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
    }

    let step = 6, big;
    const base = new Uint8ClampedArray(o);
    for (let tries = 0; tries < 5; tries++) {
      o.set(base); quantize(o, step); ctx.putImageData(out, 0, 0);
      big = await exportPng(work);
      if (big.bytes <= MAX_BYTES) break;
      step += 6;
    }
    if (big.bytes > MAX_BYTES) throw new Error('Avatar came out too large');
    const sm = document.createElement('canvas');
    sm.width = SMALL; sm.height = SMALL;
    const sctx = sm.getContext('2d');
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(work, 0, 0, SMALL, SMALL);
    const small = await exportPng(sm);
    return {
      png512: big.dataUrl, png128: small.dataUrl,
      report: { size: SIZE, smallSize: SMALL, bytes512: big.bytes, bytes128: small.bytes, opaque: true, ink: '#1A1A2E',
        segmenter: 'mediapipe-selfie+hair', colorStep: step, local: true }
    };
  }

  window.Comicify = { load, render, fromFile, inGuide, loadSegmenter, MAX_BYTES, SIZE, SMALL };
})();
