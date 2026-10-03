/**
 * Earth theater — separate from solar system.
 *
 * Modes:
 *   surface  — hyper-clear globe; launch-site markers only
 *   site     — zoomed pad + ultra-modern launch / ascent / orbit / beyond
 *   leo      — clean LEO orbital theater (stations, shells)
 */
import * as THREE from "three";

export const EARTH_R = 12;
const KM = EARTH_R / 6371;

// ─── Catalog ───────────────────────────────────────────────────

/** Key sites on the historical launch timeline */
export const LAUNCH_SITES = [
  {
    id: "cape",
    name: "Cape Canaveral / KSC",
    short: "Cape",
    lat: 28.57,
    lon: -80.65,
    era: "1950s–now",
    blurb: "NASA & Space Force — Mercury through Artemis, Falcon, Shuttle.",
    color: 0x38bdf8,
  },
  {
    id: "vandenberg",
    name: "Vandenberg SFB",
    short: "Vandenberg",
    lat: 34.74,
    lon: -120.57,
    era: "1958–now",
    blurb: "Polar & sun-sync West Coast corridor — NRO, Falcon, Delta.",
    color: 0x22d3ee,
  },
  {
    id: "boca",
    name: "Starbase · Boca Chica",
    short: "Starbase",
    lat: 25.997,
    lon: -97.157,
    era: "2019–now",
    blurb: "SpaceX Starship / Super Heavy — tower catch era.",
    color: 0xfbbf24,
  },
  {
    id: "baikonur",
    name: "Baikonur Cosmodrome",
    short: "Baikonur",
    lat: 45.97,
    lon: 63.3,
    era: "1957–now",
    blurb: "Sputnik, Gagarin, Soyuz — longest-running spaceport.",
    color: 0xf472b6,
  },
  {
    id: "kourou",
    name: "Guiana Space Centre",
    short: "Kourou",
    lat: 5.23,
    lon: -52.77,
    era: "1968–now",
    blurb: "ESA near-equator site — Ariane, Vega, Soyuz-ST.",
    color: 0xa78bfa,
  },
  {
    id: "jiuquan",
    name: "Jiuquan Satellite LC",
    short: "Jiuquan",
    lat: 40.96,
    lon: 100.29,
    era: "1958–now",
    blurb: "China’s first spaceport — Shenzhou human spaceflight.",
    color: 0xfb7185,
  },
];

/**
 * Missions playable at a site.
 * phases: timeline of named beats (t 0–1 of the whole flight).
 */
/** Einstein Math Space Lab (v2.5.0): booster recovery (RTLS landing, tower catch) is stubbed until rebuilt (C1/C2). */
export const RECOVERY_STUBBED = true;
/** Missions shown as visible "coming soon" chips instead of playable sequences (recovery sims not working well yet). */
export const STUB_MISSIONS = {
  "f9-rtls": "Booster landing (RTLS) sim is being rebuilt — the booster currently drifts to an off-pad point instead of a real boostback + landing burn.",
  "starship-ift5": "Tower catch sim is being rebuilt — the tower is hidden by the time Super Heavy returns, so the catch can't be seen.",
};

export const LAUNCH_MISSIONS = [
  {
    id: "mercury-redstone",
    siteId: "cape",
    name: "Mercury-Redstone 3",
    date: "1961-05-05",
    vehicle: "redstone",
    beyond: false,
    durationSec: 28,
    blurb: "Shepard — first American in space (suborbital arc).",
    color: 0xe2e8f0,
  },
  {
    id: "apollo11",
    siteId: "cape",
    name: "Apollo 11",
    date: "1969-07-16",
    vehicle: "saturnv",
    beyond: true,
    durationSec: 48,
    blurb: "Saturn V → Earth orbit → TLI → Moon.",
    color: 0xf8fafc,
  },
  {
    id: "sts-1",
    siteId: "cape",
    name: "STS-1 Columbia",
    date: "1981-04-12",
    vehicle: "shuttle",
    beyond: false,
    durationSec: 36,
    blurb: "First orbital Space Shuttle flight.",
    color: 0xffffff,
  },
  {
    id: "f9-rtls",
    siteId: "cape",
    name: "Falcon 9 · first RTLS",
    date: "2015-12-21",
    vehicle: "falcon9",
    beyond: false,
    durationSec: 40,
    blurb: "Orbcomm-2 — first orbital-class booster landing.",
    color: 0x38bdf8,
  },
  {
    id: "f9-starlink",
    siteId: "cape",
    name: "Falcon 9 · Starlink",
    date: "2024-01-01",
    vehicle: "falcon9",
    beyond: false,
    durationSec: 36,
    blurb: "Modern cadence — fairing, stage sep, LEO insertion.",
    color: 0x60a5fa,
  },
  {
    id: "f9-vandy",
    siteId: "vandenberg",
    name: "Falcon 9 · polar",
    date: "2023-06-01",
    vehicle: "falcon9",
    beyond: false,
    durationSec: 36,
    blurb: "West-coast polar ascent into sun-sync LEO.",
    color: 0x22d3ee,
  },
  {
    id: "starship-ift5",
    siteId: "boca",
    name: "Starship · tower catch",
    date: "2024-10-13",
    vehicle: "starship",
    beyond: true,
    durationSec: 44,
    blurb: "Super Heavy catch + ship toward the edge of space.",
    color: 0xfbbf24,
  },
  {
    id: "soyuz-gagarin",
    siteId: "baikonur",
    name: "Vostok 1",
    date: "1961-04-12",
    vehicle: "soyuz",
    beyond: false,
    durationSec: 32,
    blurb: "Gagarin — first human in orbit.",
    color: 0xf472b6,
  },
  {
    id: "ariane5",
    siteId: "kourou",
    name: "Ariane 5",
    date: "2023-04-14",
    vehicle: "ariane",
    beyond: false,
    durationSec: 34,
    blurb: "Heavy lift from the equator — GTO / LEO profiles.",
    color: 0xa78bfa,
  },
  {
    id: "shenzhou",
    siteId: "jiuquan",
    name: "Shenzhou",
    date: "2023-05-30",
    vehicle: "longmarch",
    beyond: false,
    durationSec: 34,
    blurb: "Crew launch into inclined LEO.",
    color: 0xfb7185,
  },
];

// ─── Math helpers ──────────────────────────────────────────────

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function smoothstep(t) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}
function smootherstep(t) {
  t = clamp01(t);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function surfacePoint(latDeg, lonDeg, alt = 0, earthR = EARTH_R) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const r = earthR + alt;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.sin(lon)
  );
}

function orientOnSurface(obj, point) {
  obj.position.copy(point);
  const up = point.clone().normalize();
  // Local +Y = surface up
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  obj.quaternion.copy(q);
}

function launchBasis(padPos) {
  const up = padPos.clone().normalize();
  let east = new THREE.Vector3(0, 1, 0).cross(up);
  if (east.lengthSq() < 1e-6) east = new THREE.Vector3(1, 0, 0);
  east.normalize();
  const north = up.clone().cross(east).normalize();
  return { up, east, north };
}

// ─── Earth textures (procedural, offline, high clarity) ────────

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct = 5) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise2(x * f, y * f);
    a *= 0.5;
    f *= 2;
  }
  return v;
}

/** Crisp day map + night lights + specular mask (canvas, no network) */
function buildEarthMaps(size = 2048) {
  const day = document.createElement("canvas");
  day.width = day.height = size;
  const night = document.createElement("canvas");
  night.width = night.height = size;
  const dctx = day.getContext("2d");
  const nctx = night.getContext("2d");
  const dimg = dctx.createImageData(size, size);
  const nimg = nctx.createImageData(size, size);
  const dd = dimg.data;
  const nd = nimg.data;

  for (let j = 0; j < size; j++) {
    const v = j / (size - 1);
    const lat = (0.5 - v) * Math.PI;
    const cosLat = Math.cos(lat);
    for (let i = 0; i < size; i++) {
      const u = i / (size - 1);
      const lon = (u - 0.5) * Math.PI * 2;
      // spherical sample for continents
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      // multi-scale land mask
      const n =
        fbm(x * 2.2 + 3.1, z * 2.2 - 1.7, 6) * 0.55 +
        fbm(x * 5.5, y * 4.2, 4) * 0.3 +
        fbm(z * 8.0, y * 6.0, 3) * 0.15;
      const ice = Math.abs(y) > 0.78 + n * 0.08;
      const land = n > 0.48 + Math.abs(y) * 0.04;

      let r, g, b;
      if (ice) {
        r = 232;
        g = 240;
        b = 252;
      } else if (land) {
        // biomes
        const elev = fbm(x * 6, z * 6, 3);
        if (Math.abs(y) > 0.55) {
          r = 90 + elev * 40;
          g = 110 + elev * 30;
          b = 70;
        } else if (elev > 0.62) {
          r = 72;
          g = 98;
          b = 48;
        } else {
          r = 46 + elev * 50;
          g = 110 + elev * 40;
          b = 52;
        }
        // deserts
        if (Math.abs(y) < 0.35 && fbm(x * 3 + 9, z * 3, 3) > 0.62) {
          r = 194;
          g = 168;
          b = 110;
        }
      } else {
        // deep → shallow ocean
        const depth = n;
        r = 8 + depth * 18;
        g = 40 + depth * 70;
        b = 110 + depth * 90;
      }

      // cloud streaks (baked soft white)
      const cloud = fbm(x * 3.5 + 20, z * 3.5 - y * 2, 4);
      if (cloud > 0.58) {
        const c = (cloud - 0.58) * 2.2;
        r = lerp(r, 255, c * 0.55);
        g = lerp(g, 255, c * 0.55);
        b = lerp(b, 255, c * 0.5);
      }

      const idx = (j * size + i) * 4;
      dd[idx] = r;
      dd[idx + 1] = g;
      dd[idx + 2] = b;
      dd[idx + 3] = 255;

      // night lights on land
      let nr = 4,
        ng = 6,
        nb = 18;
      if (land && !ice) {
        const city = fbm(x * 40 + 2, z * 40 - 5, 2);
        if (city > 0.72) {
          const glow = (city - 0.72) * 4;
          nr = 255;
          ng = 180 + glow * 40;
          nb = 80;
        } else if (city > 0.62) {
          nr = 120;
          ng = 90;
          nb = 40;
        }
      }
      nd[idx] = nr;
      nd[idx + 1] = ng;
      nd[idx + 2] = nb;
      nd[idx + 3] = 255;
    }
  }
  dctx.putImageData(dimg, 0, 0);
  nctx.putImageData(nimg, 0, 0);

  const dayMap = new THREE.CanvasTexture(day);
  dayMap.colorSpace = THREE.SRGBColorSpace;
  dayMap.anisotropy = 8;
  const nightMap = new THREE.CanvasTexture(night);
  nightMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.anisotropy = 4;
  return { dayMap, nightMap };
}

function makeEarthGlobe() {
  const group = new THREE.Group();
  const { dayMap, nightMap } = buildEarthMaps(1536);

  const earthMat = new THREE.MeshStandardMaterial({
    map: dayMap,
    roughness: 0.72,
    metalness: 0.08,
    emissiveMap: nightMap,
    emissive: new THREE.Color(0xffcc88),
    emissiveIntensity: 0.55,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 128, 128), earthMat);
  group.add(earth);

  // Cloud shell
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = cloudCanvas.height = 1024;
  const cctx = cloudCanvas.getContext("2d");
  const cimg = cctx.createImageData(1024, 1024);
  for (let j = 0; j < 1024; j++) {
    for (let i = 0; i < 1024; i++) {
      const u = i / 1024;
      const v = j / 1024;
      const n = fbm(u * 8, v * 4, 5);
      const a = n > 0.55 ? Math.min(255, (n - 0.55) * 600) : 0;
      const idx = (j * 1024 + i) * 4;
      cimg.data[idx] = 255;
      cimg.data[idx + 1] = 255;
      cimg.data[idx + 2] = 255;
      cimg.data[idx + 3] = a * 0.55;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  const cloudMap = new THREE.CanvasTexture(cloudCanvas);
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.012, 96, 96),
    new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    })
  );
  group.add(clouds);

  // Atmosphere glow
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.06, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x4da3ff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.4);
          float core = smoothstep(0.0, 0.6, fresnel);
          gl_FragColor = vec4(glowColor, core * 0.55);
        }
      `,
    })
  );
  group.add(atmo);

  // Thin limb ring for clarity
  const limb = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.002, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(limb);

  return { group, earth, clouds, atmo, dayMap };
}

// ─── Site markers ──────────────────────────────────────────────

function makeSiteMarker(site) {
  const root = new THREE.Group();
  root.userData.siteId = site.id;

  const col = new THREE.Color(site.color);

  // Ground ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.28, 48),
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  // Pulse disc
  const pulse = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 32),
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.03;
  root.add(pulse);

  // Beacon stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.55, 10),
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.3,
    })
  );
  stem.position.y = 0.3;
  root.add(stem);

  // Top jewel
  const jewel = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: col,
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.2,
    })
  );
  jewel.position.y = 0.62;
  root.add(jewel);

  // Soft halo sprite
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.35, `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},0.45)`);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    })
  );
  halo.scale.set(1.4, 1.4, 1);
  halo.position.y = 0.62;
  root.add(halo);

  // Label sprite
  const label = makeLabel(site.short, "#" + col.getHexString());
  label.position.y = 1.05;
  label.scale.set(2.4, 0.6, 1);
  root.add(label);

  root.userData.pulse = pulse;
  root.userData.halo = halo;
  root.userData.jewel = jewel;
  root.userData.label = label;
  root.userData.baseScale = 1;
  return root;
}

function makeLabel(text, color = "#eef1f7") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = "700 42px DM Sans, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = Math.min(480, ctx.measureText(text).width + 48);
  ctx.fillStyle = "rgba(5,8,16,0.72)";
  roundRect(ctx, 256 - w / 2, 28, w, 72, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ─── Vehicles (clear, modern scale for site view) ──────────────

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.35,
    metalness: opts.metalness ?? 0.45,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function makePlume() {
  const g = new THREE.Group();
  // Core flame
  const core = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.9, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffe9a8,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  core.rotation.x = Math.PI;
  core.position.y = -0.45;
  g.add(core);
  // Outer plume
  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 1.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff6b2c,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  outer.rotation.x = Math.PI;
  outer.position.y = -0.55;
  g.add(outer);
  // Shock diamond glow
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.position.y = -0.12;
  g.add(glow);
  g.visible = false;
  g.userData.core = core;
  g.userData.outer = outer;
  g.userData.glow = glow;
  return g;
}

function setPlume(vehicle, on, intensity = 1) {
  const p = vehicle?.userData?.plume;
  if (!p) return;
  p.visible = !!on;
  if (!on) return;
  const flicker = 0.85 + Math.random() * 0.3;
  p.userData.core.scale.set(1, flicker * intensity, 1);
  p.userData.outer.scale.set(1.05, flicker * intensity * 1.1, 1.05);
  p.userData.glow.material.opacity = 0.35 + Math.random() * 0.35 * intensity;
}

function makeFalcon9() {
  const root = new THREE.Group();
  const white = mat(0xf8fafc, { metalness: 0.25, roughness: 0.35 });
  const black = mat(0x0f172a, { metalness: 0.55, roughness: 0.35 });
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 2.4, 24), white);
  s1.position.y = 1.2;
  root.add(s1);
  // US flag band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.242, 0.242, 0.12, 24), black);
  band.position.y = 1.9;
  root.add(band);
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.9, 20), white);
  s2.position.y = 2.85;
  root.add(s2);
  const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 20), white);
  fairing.position.y = 3.55;
  root.add(fairing);
  // Grid fins
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.22), black);
    fin.position.set(Math.cos(a) * 0.28, 2.0, Math.sin(a) * 0.28);
    fin.rotation.y = a;
    root.add(fin);
  }
  // Legs
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), black);
    leg.position.set(Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22);
    root.add(leg);
  }
  const plume = makePlume();
  root.add(plume);
  root.userData.plume = plume;
  root.userData.stage1 = s1;
  root.userData.stage2 = s2;
  root.userData.fairing = fairing;
  return root;
}

function makeStarship() {
  const root = new THREE.Group();
  const steel = mat(0xc8c8c4, { metalness: 0.82, roughness: 0.22 });
  const dark = mat(0x27272a, { metalness: 0.5, roughness: 0.4 });
  const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 3.4, 28), steel);
  booster.position.y = 1.7;
  root.add(booster);
  // engine skirt ring
  const skirt = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 28), dark);
  skirt.rotation.x = Math.PI / 2;
  skirt.position.y = 0.08;
  root.add(skirt);
  const ship = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 2.2, 24), steel);
  ship.position.y = 4.5;
  root.add(ship);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 24), steel);
  nose.position.y = 6.0;
  root.add(nose);
  for (const s of [-1, 1]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.45), dark);
    flap.position.set(s * 0.48, 4.8, 0);
    root.add(flap);
  }
  const plume = makePlume();
  plume.scale.setScalar(1.6);
  root.add(plume);
  root.userData.plume = plume;
  root.userData.booster = booster;
  root.userData.ship = ship;
  return root;
}

function makeSaturnV() {
  const root = new THREE.Group();
  const white = mat(0xfafafa, { roughness: 0.4, metalness: 0.15 });
  const black = mat(0x171717);
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 2.2, 24), white);
  s1.position.y = 1.1;
  root.add(s1);
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 24), black);
    band.position.y = 0.4 + i * 0.45;
    root.add(band);
  }
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 1.1, 20), white);
  s2.position.y = 2.75;
  root.add(s2);
  const s3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.75, 18), white);
  s3.position.y = 3.7;
  root.add(s3);
  const csm = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 16), white);
  csm.position.y = 4.4;
  root.add(csm);
  const plume = makePlume();
  plume.scale.setScalar(1.5);
  root.add(plume);
  root.userData.plume = plume;
  return root;
}

function makeGenericRocket(color = 0xe2e8f0) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 2.6, 20),
    mat(color, { metalness: 0.35, roughness: 0.4 })
  );
  body.position.y = 1.3;
  root.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 16), mat(0xf8fafc));
  nose.position.y = 2.9;
  root.add(nose);
  const plume = makePlume();
  root.add(plume);
  root.userData.plume = plume;
  return root;
}

function makeShuttle() {
  const root = new THREE.Group();
  const white = mat(0xf8fafc, { roughness: 0.4 });
  const orange = mat(0xea580c, { roughness: 0.7, metalness: 0.1 });
  const black = mat(0x1e293b);
  // ET
  const et = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.8, 20), orange);
  et.position.set(0, 1.5, 0);
  root.add(et);
  // SRBs
  for (const s of [-1, 1]) {
    const srb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 2.4, 14), white);
    srb.position.set(s * 0.42, 1.3, 0);
    root.add(srb);
  }
  // Orbiter
  const orb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 1.5), white);
  orb.position.set(0, 1.6, 0.35);
  root.add(orb);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.7), white);
  wing.position.set(0, 1.45, 0.5);
  root.add(wing);
  const plume = makePlume();
  plume.scale.setScalar(1.3);
  root.add(plume);
  root.userData.plume = plume;
  return root;
}


/** Soft radial alpha for pad-local ground fog (not scene.fog). */
function makeSoftRadialTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(210,220,232,0.65)");
  g.addColorStop(0.4, "rgba(170,185,205,0.28)");
  g.addColorStop(1, "rgba(100,120,145,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Pad-local atmosphere: short ground fog discs + a few floodlight beams.
 * Parent under siteStage; intensity driven by pad-local phase (localUntil).
 */
function makePadAtmosphere() {
  const root = new THREE.Group();
  root.name = "pad-atmosphere";
  const fogTex = makeSoftRadialTexture(128);
  const fogMats = [];
  const beamMats = [];

  const fogMat = new THREE.MeshBasicMaterial({
    map: fogTex,
    color: 0xd8e2ec,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  fogMats.push(fogMat);
  const fog = new THREE.Mesh(new THREE.CircleGeometry(3.3, 40), fogMat);
  fog.rotation.x = -Math.PI / 2;
  fog.position.y = 0.15;
  fog.renderOrder = 2;
  root.add(fog);

  const fogMat2 = fogMat.clone();
  fogMat2.opacity = 0.26;
  fogMats.push(fogMat2);
  const fog2 = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), fogMat2);
  fog2.rotation.x = -Math.PI / 2;
  fog2.position.y = 0.38;
  fog2.renderOrder = 2;
  root.add(fog2);

  // Beam length in local pad units (cylinder along +Y, open-ended)
  const beamLen = 2.15;
  const lampSpots = [
    [-1.6, 1.85, 1.2],
    [1.6, 1.85, 1.2],
    [-1.55, 1.7, -1.15],
    [1.55, 1.7, -1.15],
  ];
  const aim = new THREE.Vector3(0, 0.12, 0);
  for (const [lx, ly, lz] of lampSpots) {
    const geo = new THREE.CylinderGeometry(0.025, 0.68, beamLen, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff1d6,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    beamMats.push(mat);
    const beam = new THREE.Mesh(geo, mat);
    const from = new THREE.Vector3(lx, ly, lz);
    const dir = aim.clone().sub(from);
    const len = Math.max(0.5, dir.length());
    const unit = dir.clone().normalize();
    beam.scale.set(1, len / beamLen, 1);
    beam.position.copy(from).addScaledVector(unit, len * 0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit);
    root.add(beam);
  }

  root.userData.fogMats = fogMats;
  root.userData.beamMats = beamMats;
  root.userData.baseFog = [0.5, 0.26];
  root.userData.baseBeam = 0.13;
  root.visible = false;
  return root;
}

/** @param {number} intensity 0–1; fades with pad→chase localBlend */
function setPadAtmosphere(api, intensity) {
  const atmo = api.padAtmosphere;
  if (!atmo) return;
  const k = clamp01(intensity);
  if (k < 0.02) {
    atmo.visible = false;
    return;
  }
  atmo.visible = true;
  const bases = atmo.userData.baseFog;
  atmo.userData.fogMats.forEach((m, i) => {
    m.opacity = (bases[i] ?? bases[0]) * k;
  });
  const bb = atmo.userData.baseBeam;
  atmo.userData.beamMats.forEach((m) => {
    m.opacity = bb * k;
  });
}

function makePadComplex() {
  const g = new THREE.Group();
  // Concrete apron
  const apron = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.6, 0.12, 48),
    mat(0x334155, { roughness: 0.85, metalness: 0.15 })
  );
  apron.position.y = 0.06;
  g.add(apron);
  // Flame trench
  const trench = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.35, 1.8),
    mat(0x1e293b, { roughness: 0.9 })
  );
  trench.position.set(0, 0.1, -0.9);
  g.add(trench);
  // Tower
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 4.2, 0.35),
    mat(0x64748b, { metalness: 0.7, roughness: 0.3 })
  );
  tower.position.set(0.85, 2.1, 0);
  g.add(tower);
  // Cross beams
  for (let i = 0; i < 5; i++) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.06, 0.06),
      mat(0x94a3b8, { metalness: 0.6 })
    );
    beam.position.set(0.55, 0.6 + i * 0.7, 0);
    g.add(beam);
  }
  // Floodlight poles (front + rear) — beams live in padAtmosphere
  const lampPosts = [
    [1.6, 1.2, 1.8, 1.85],
    [-1.6, 1.2, 1.8, 1.85],
    [1.55, -1.15, 1.6, 1.7],
    [-1.55, -1.15, 1.6, 1.7],
  ];
  for (const [x, z, poleH, lampY] of lampPosts) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, poleH, 8),
      mat(0x475569)
    );
    pole.position.set(x, poleH * 0.5, z);
    g.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff7ed })
    );
    lamp.position.set(x, lampY, z);
    g.add(lamp);
  }
  // Chopsticks (Starbase style, used when needed)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.14), mat(0x94a3b8, { metalness: 0.75 }));
  armL.position.set(-0.5, 3.5, 0.4);
  g.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.14), mat(0x94a3b8, { metalness: 0.75 }));
  armR.position.set(0.5, 3.5, 0.4);
  g.add(armR);
  g.userData.armL = armL;
  g.userData.armR = armR;
  return g;
}

function makeISS() {
  const root = new THREE.Group();
  const truss = mat(0xcbd5e1, { metalness: 0.65, roughness: 0.3 });
  const gold = mat(0xfbbf24, { metalness: 0.5, roughness: 0.35 });
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.28), truss));
  for (const s of [-1, 1]) {
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.05), truss);
    boom.position.x = s * 0.9;
    root.add(boom);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.45), gold);
    panel.position.x = s * 0.9;
    root.add(panel);
  }
  return root;
}

function placeOrbiting(obj, radius, angle, inclinationDeg = 51.6, raan = 0) {
  const i = THREE.MathUtils.degToRad(inclinationDeg);
  const O = THREE.MathUtils.degToRad(raan);
  const p = new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  p.applyAxisAngle(new THREE.Vector3(1, 0, 0), i);
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), O);
  obj.position.copy(p);
  const next = new THREE.Vector3(
    radius * Math.cos(angle + 0.04),
    0,
    radius * Math.sin(angle + 0.04)
  );
  next.applyAxisAngle(new THREE.Vector3(1, 0, 0), i);
  next.applyAxisAngle(new THREE.Vector3(0, 1, 0), O);
  obj.up.copy(p.clone().normalize());
  obj.lookAt(next);
}

// ─── Build system ──────────────────────────────────────────────

export function createEarthTheater() {
  const root = new THREE.Group();
  root.name = "earth-theater";
  root.visible = false;

  // Local starfield
  const starPos = new Float32Array(3500 * 3);
  for (let i = 0; i < 3500; i++) {
    const r = 90 + Math.random() * 160;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  root.add(
    new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(starPos, 3)),
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.28,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    )
  );

  // Lighting — cinematic key + rim
  const sun = new THREE.DirectionalLight(0xfff4e5, 2.2);
  sun.position.set(60, 20, 30);
  root.add(sun);
  root.add(new THREE.AmbientLight(0x1e293b, 0.28));
  const rim = new THREE.DirectionalLight(0x60a5fa, 0.35);
  rim.position.set(-40, -10, -30);
  root.add(rim);

  const globe = makeEarthGlobe();
  root.add(globe.group);

  // Markers layer
  const markers = new THREE.Group();
  root.add(markers);
  const siteMarkers = new Map();
  for (const site of LAUNCH_SITES) {
    const m = makeSiteMarker(site);
    const p = surfacePoint(site.lat, site.lon, 0.02);
    orientOnSurface(m, p);
    // scale markers up slightly for visibility
    m.scale.setScalar(1.15);
    markers.add(m);
    siteMarkers.set(site.id, { mesh: m, site, pos: p });
  }

  // Site-local stage (large pad + vehicle) — parented at surface point when active
  const siteStage = new THREE.Group();
  siteStage.visible = false;
  root.add(siteStage);
  const pad = makePadComplex();
  siteStage.add(pad);
  const padAtmosphere = makePadAtmosphere();
  siteStage.add(padAtmosphere);

  // Vehicles
  const vehicles = {
    falcon9: makeFalcon9(),
    starship: makeStarship(),
    saturnv: makeSaturnV(),
    shuttle: makeShuttle(),
    soyuz: makeGenericRocket(0xf8fafc),
    ariane: makeGenericRocket(0xe2e8f0),
    longmarch: makeGenericRocket(0xffffff),
    redstone: makeGenericRocket(0xf5f5f4),
    upper: makeGenericRocket(0xcbd5e1),
    iss: makeISS(),
  };
  // second stage / ship-only for sep
  vehicles.shipOnly = makeStarship();
  // hide booster parts-ish by scaling down lower cylinder — visual hack
  if (vehicles.shipOnly.userData.booster) vehicles.shipOnly.userData.booster.visible = false;

  for (const v of Object.values(vehicles)) {
    v.visible = false;
    siteStage.add(v);
  }
  // ISS lives in root for LEO mode
  root.add(vehicles.iss);
  vehicles.iss.visible = false;

  // Orbit rings (LEO mode)
  const leoRing = makeOrbitRing(EARTH_R + 420 * KM * 40, 0x7dd3fc, 0.4); // exaggerated alt for clarity
  // Use clearer visual LEO altitude
  const LEO_VIS = EARTH_R * 1.12;
  const issRing = makeOrbitRing(LEO_VIS, 0x94a3b8, 0.45);
  issRing.rotation.x = THREE.MathUtils.degToRad(51.6);
  issRing.visible = false;
  root.add(issRing);

  // Trajectory ribbon
  const trajGroup = new THREE.Group();
  root.add(trajGroup);

  // Exhaust smoke particles (site stage)
  const smokeCount = 80;
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
  const smoke = new THREE.Points(
    smokeGeo,
    new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  smoke.visible = false;
  siteStage.add(smoke);

  const api = {
    root,
    globe,
    markers,
    siteMarkers,
    siteStage,
    pad,
    padAtmosphere,
    vehicles,
    trajGroup,
    issRing,
    smoke,
    smokePos,
    smokeCount,
    sun,
    // runtime
    mode: "surface", // surface | site | leo
    selectedSiteId: null,
    activeMission: null,
    launchT: 0, // 0–1 progress
    launchPlaying: false,
    phaseLabel: "Select a launch site",
    _trajLines: [],
    LEO_VIS,
  };

  return api;
}

function makeOrbitRing(radius, color, opacity) {
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  );
}

function clearTraj(api) {
  for (const l of api._trajLines) {
    api.trajGroup.remove(l);
    l.geometry?.dispose?.();
    l.material?.dispose?.();
  }
  api._trajLines = [];
}

function addTraj(api, points, color, opacity = 0.7) {
  if (points.length < 2) return;
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  api.trajGroup.add(line);
  api._trajLines.push(line);
}

// ─── Mode control ──────────────────────────────────────────────

export function setEarthMode(api, mode) {
  api.mode = mode;
  api.issRing.visible = mode === "leo";
  api.markers.visible = mode === "surface";
  api.siteStage.visible = mode === "site";
  api.globe.group.visible = true;
  api.globe.clouds.visible = mode !== "site";

  if (mode === "surface") {
    hideVehicles(api);
    setPadAtmosphere(api, 0);
    clearTraj(api);
    api.activeMission = null;
    api.launchPlaying = false;
    api.launchT = 0;
    api.phaseLabel = "Select a launch site";
    // restore marker scales
    for (const { mesh } of api.siteMarkers.values()) {
      mesh.visible = true;
      mesh.scale.setScalar(1.15);
    }
  } else if (mode === "leo") {
    hideVehicles(api);
    setPadAtmosphere(api, 0);
    clearTraj(api);
    api.siteStage.visible = false;
    api.markers.visible = false;
    api.vehicles.iss.visible = true;
    api.phaseLabel = "Low Earth Orbit";
  } else if (mode === "site") {
    api.markers.visible = false;
    api.issRing.visible = false;
    api.vehicles.iss.visible = false;
  }
}

export function selectSite(api, siteId) {
  const entry = api.siteMarkers.get(siteId);
  if (!entry) return null;
  api.selectedSiteId = siteId;
  // Highlight
  for (const [id, { mesh }] of api.siteMarkers) {
    const on = id === siteId;
    mesh.userData.jewel.material.emissiveIntensity = on ? 2.2 : 1.0;
    mesh.scale.setScalar(on ? 1.45 : 1.15);
  }
  // Place site stage at pad
  setEarthMode(api, "site");
  api.siteStage.visible = true;
  orientOnSurface(api.siteStage, entry.pos.clone().add(entry.pos.clone().normalize().multiplyScalar(0.04)));
  // Scale stage so rocket is readable (~local theater)
  api.siteStage.scale.setScalar(0.42);

  // Park vehicle on pad — pad-local fog/beams on while on/near pad
  hideVehicles(api);
  setPadAtmosphere(api, 1);
  api.phaseLabel = `${entry.site.name} — pick a mission`;
  return entry.site;
}

export function missionsForSite(siteId) {
  return LAUNCH_MISSIONS.filter((m) => m.siteId === siteId);
}

export function startLaunch(api, missionId) {
  const mission = LAUNCH_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return null;
  const site = LAUNCH_SITES.find((s) => s.id === mission.siteId);
  if (!site) return null;

  if (api.selectedSiteId !== mission.siteId) selectSite(api, mission.siteId);

  api.activeMission = mission;
  api.launchT = 0;
  api.launchPlaying = true;
  api.phaseLabel = "T−0 · Ignition";
  clearTraj(api);

  hideVehicles(api);
  // Re-parent craft onto the pad stage for a clear local liftoff
  for (const key of Object.keys(api.vehicles)) {
    if (key === "iss") continue;
    const craft = api.vehicles[key];
    if (craft.parent !== api.siteStage) api.siteStage.attach(craft);
    craft.position.set(0, 0, 0);
    craft.rotation.set(0, 0, 0);
    craft.scale.setScalar(1);
    craft.quaternion.identity();
  }
  const v = vehicleFor(api, mission.vehicle);
  if (v) {
    v.visible = true;
    v.position.set(0, 0, 0);
    v.rotation.set(0, 0, 0);
    v.scale.setScalar(1);
  }
  // Pre-draw planned trajectory in world space
  drawPlannedTrajectory(api, mission, site);
  return mission;
}

function vehicleFor(api, kind) {
  return api.vehicles[kind] || api.vehicles.falcon9;
}

function hideVehicles(api) {
  for (const [k, v] of Object.entries(api.vehicles)) {
    if (k === "iss") continue;
    v.visible = false;
    setPlume(v, false);
  }
  api.smoke.visible = false;
}

function drawPlannedTrajectory(api, mission, site) {
  clearTraj(api);
  const pad = surfacePoint(site.lat, site.lon, 0.05);
  const { up, east } = launchBasis(pad);
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    pts.push(sampleAscentWorld(t, pad, up, east, mission));
  }
  addTraj(api, pts, mission.color, 0.55);
  // orbit arc
  if (!mission.beyond || mission.vehicle !== "apollo") {
    const orb = [];
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 1.4;
      const r = api.LEO_VIS;
      const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * 0.15 * r, Math.sin(a) * r);
      // rotate toward east of pad
      orb.push(p);
    }
    addTraj(api, orb, 0x64748b, 0.25);
  }
}

function sampleAscentWorld(t, pad, up, east, mission) {
  const hMax = mission.beyond ? EARTH_R * 2.8 : EARTH_R * 1.35;
  const downMax = EARTH_R * (mission.beyond ? 2.2 : 1.6);
  const h = smootherstep(Math.min(1, t * 1.15)) * hMax;
  const down = t * t * downMax;
  return pad.clone().add(up.clone().multiplyScalar(h)).add(east.clone().multiplyScalar(down));
}


/** Schematic HUD numbers — visual path is exaggerated; values are illustrative only. */
function schematicAscentTelemetry(t, mission) {
  const u = clamp01(t);
  const beyond = !!mission?.beyond;
  let altKm;
  if (u < 0.12) {
    altKm = smootherstep(u / 0.12) * 4.2;
  } else if (u < 0.38) {
    const v = (u - 0.12) / 0.26;
    altKm = 4.2 + smootherstep(v) * 68;
  } else if (u < 0.55) {
    const v = (u - 0.38) / 0.17;
    altKm = 72 + smootherstep(v) * 130;
  } else if (u < 0.75) {
    const v = (u - 0.55) / 0.2;
    altKm = beyond ? 202 + smootherstep(v) * 800 : 202 + smootherstep(v) * 210;
  } else {
    altKm = beyond ? 1000 + (u - 0.75) * 4000 : 410 + (u - 0.75) * 40;
  }

  let velKms;
  if (u < 0.02) velKms = 0;
  else if (u < 0.38) velKms = smootherstep(u / 0.38) * 2.4;
  else if (u < 0.55) {
    const v = (u - 0.38) / 0.17;
    velKms = 2.4 + smootherstep(v) * 5.1;
  } else if (u < 0.75) {
    const v = (u - 0.55) / 0.2;
    velKms = beyond ? 7.5 + smootherstep(v) * 3.5 : 7.5 + smootherstep(v) * 0.28;
  } else {
    velKms = beyond ? 10.9 : 7.67;
  }
  return { altKm, velKms };
}

/** Visible through ascent / insertion; hidden after insertion and when not launching. */
function buildAscentHud(api, t) {
  if (api.mode !== "site" || !api.activeMission) return { visible: false };
  if (t >= 0.75) return { visible: false };
  const { altKm, velKms } = schematicAscentTelemetry(t, api.activeMission);
  return { visible: true, altKm, velKms };
}

// ─── Per-frame update ──────────────────────────────────────────

/**
 * @returns {{ phaseLabel: string, cameraHint?: object, ascentHud?: { visible: boolean, altKm?: number, velKms?: number } }}
 */
export function updateEarthTheater(api, dt, opts = {}) {
  const { autoPlay = true } = opts;

  // Globe spin (slow, readable)
  if (api.mode === "surface" || api.mode === "leo") {
    api.globe.earth.rotation.y += dt * 0.04;
    api.globe.clouds.rotation.y += dt * 0.048;
  }

  // Marker pulse
  if (api.mode === "surface") {
    const t = performance.now() * 0.001;
    for (const { mesh } of api.siteMarkers.values()) {
      const s = 1 + Math.sin(t * 2.5 + mesh.position.x) * 0.12;
      mesh.userData.pulse.scale.setScalar(s);
      mesh.userData.halo.material.opacity = 0.55 + Math.sin(t * 3) * 0.2;
    }
  }

  // LEO continuous
  if (api.mode === "leo") {
    const ang = performance.now() * 0.00015;
    placeOrbiting(api.vehicles.iss, api.LEO_VIS, ang, 51.6, 20);
    api.vehicles.iss.visible = true;
    api.vehicles.iss.scale.setScalar(0.55);
    api.phaseLabel = "ISS · 51.6° · LEO";
    return { phaseLabel: api.phaseLabel, ascentHud: { visible: false } };
  }

  // Launch animation
  if (api.mode === "site" && api.activeMission && api.launchPlaying && autoPlay) {
    const dur = api.activeMission.durationSec || 36;
    api.launchT = Math.min(1, api.launchT + dt / dur);
    const hint = animateLaunch(api, api.launchT);
    if (api.launchT >= 1) {
      api.launchPlaying = false;
      api.phaseLabel = "Mission complete · scrub or pick another";
    }
    return {
      phaseLabel: api.phaseLabel,
      cameraHint: hint,
      ascentHud: buildAscentHud(api, api.launchT),
    };
  }

  if (api.mode === "site" && api.activeMission) {
    animateLaunch(api, api.launchT);
    return {
      phaseLabel: api.phaseLabel,
      ascentHud: buildAscentHud(api, api.launchT),
    };
  } else if (api.mode === "site") {
    // Site selected, vehicle on/near pad — keep pad-local atmosphere
    setPadAtmosphere(api, 1);
  }

  return { phaseLabel: api.phaseLabel, ascentHud: { visible: false } };
}

function animateLaunch(api, t) {
  const mission = api.activeMission;
  const site = LAUNCH_SITES.find((s) => s.id === mission.siteId);
  const padWorld = surfacePoint(site.lat, site.lon, 0.05);
  const { up, east } = launchBasis(padWorld);
  const vehicle = vehicleFor(api, mission.vehicle);
  const upper = api.vehicles.upper;
  const shipOnly = api.vehicles.shipOnly;

  // Prefer world-space animation for clarity after liftoff leaves the tower
  // Phase labels (staging / SECO named so HUD beats are readable)
  if (t < 0.02) api.phaseLabel = "T−0 · Ignition";
  else if (t < 0.12) api.phaseLabel = "Liftoff";
  else if (t < 0.28) api.phaseLabel = "Max-Q · Ascent";
  else if (t < 0.38) api.phaseLabel = "Staging · MECO";
  else if (t < 0.55) api.phaseLabel = "SECO · Second stage";
  else if (t < 0.75) api.phaseLabel = mission.beyond ? "Beyond LEO" : "Orbital insertion";
  else if (t < 0.9) api.phaseLabel = mission.vehicle === "starship" ? "Booster return / catch" : "On orbit";
  else api.phaseLabel = "Mission complete";

  // Switch: early flight in site-local frame (readable), then world frame
  const localUntil = 0.18;
  // Pad fog/beams: full early, fade with camera localBlend, off after pad-local phase
  const padAtmo =
    t < localUntil
      ? 1 - smootherstep(clamp01((t - 0.06) / Math.max(1e-6, localUntil - 0.06)))
      : 0;
  setPadAtmosphere(api, padAtmo);
  hideVehicles(api);

  if (t < localUntil) {
    // Local pad theater
    api.siteStage.visible = true;
    vehicle.visible = true;
    vehicle.position.set(0, 0, 0);
    vehicle.rotation.set(0, 0, 0);
    const u = t / localUntil;
    const h = smootherstep(u) * 6.5;
    vehicle.position.y = h;
    // slight tilt downrange
    vehicle.rotation.z = -u * 0.25;
    setPlume(vehicle, true, 1.1 + u * 0.4);
    // smoke at pad
    api.smoke.visible = true;
    updateSmoke(api, u);
    // Camera: ease pad theater → ascent follow (no hard cut at localUntil)
    const craftWorld = padWorld.clone().add(up.clone().multiplyScalar(h));
    const faceEarly = up
      .clone()
      .multiplyScalar(1 - u * 0.2)
      .add(east.clone().multiplyScalar(u * 0.25))
      .normalize();
    return buildLaunchCamHint({
      t,
      padWorld,
      up,
      east,
      face: faceEarly,
      focus: craftWorld,
      companion: null,
      localBlend: 1 - smootherstep(clamp01((t - 0.06) / Math.max(1e-6, localUntil - 0.06))),
    });
  }

  // World-space ascent
  api.siteStage.visible = t < 0.35; // hide pad later
  vehicle.visible = true;
  // Detach vehicle from siteStage for world placement: reparent trick via world matrix
  // We keep vehicle in siteStage but set world by countering parent — cleaner: move vehicle to root
  ensureWorldVehicle(api, vehicle);

  const pos = sampleAscentWorld(t, padWorld, up, east, mission);
  vehicle.position.copy(pos);

  // Attitude: pitch over
  const pitch = smootherstep(clamp01((t - 0.1) / 0.35));
  const face = up
    .clone()
    .multiplyScalar(1 - pitch * 0.75)
    .add(east.clone().multiplyScalar(pitch))
    .normalize();
  vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), face);
  setPlume(vehicle, t < 0.72, t < 0.35 ? 1.3 : 0.7);

  // Stage separation visual
  if (t >= 0.32 && mission.vehicle === "falcon9") {
    ensureWorldVehicle(api, upper);
    upper.visible = true;
    upper.scale.setScalar(0.55);
    const sep = clamp01((t - 0.32) / 0.1);
    upper.position.copy(pos).add(face.clone().multiplyScalar(0.4 + sep * 0.8));
    upper.quaternion.copy(vehicle.quaternion);
    setPlume(upper, t < 0.6, 0.8);
    // booster falls back / lands
    if (t > 0.45) {
      if (RECOVERY_STUBBED) {
        // Einstein Math Space Lab: the schematic booster "landing" (a straight lerp that ends off-pad) is a
        // coming-soon stub — the spent booster simply drops out of the shot. See docs/EXPANSION_PLAN.md (C1).
        vehicle.visible = false;
      } else {
        const u = clamp01((t - 0.45) / 0.4);
        const land = padWorld.clone().add(east.clone().multiplyScalar(EARTH_R * 0.15));
        vehicle.position.lerpVectors(pos, land, smootherstep(u));
        vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
        setPlume(vehicle, u > 0.7 && u < 0.95, 0.9);
      }
      // upper to orbit
      placeOrbiting(upper, api.LEO_VIS, (t - 0.45) * Math.PI * 2, 28.5, 0);
      setPlume(upper, t < 0.65, 0.5);
    }
  }

  if (t >= 0.3 && mission.vehicle === "starship") {
    ensureWorldVehicle(api, shipOnly);
    shipOnly.visible = true;
    if (shipOnly.userData.booster) shipOnly.userData.booster.visible = false;
    const sep = clamp01((t - 0.3) / 0.15);
    shipOnly.position.copy(pos).add(face.clone().multiplyScalar(sep * 1.2));
    shipOnly.quaternion.copy(vehicle.quaternion);
    setPlume(shipOnly, t < 0.7, 1);
    if (t > 0.55) {
      placeOrbiting(shipOnly, api.LEO_VIS * 1.15, (t - 0.55) * Math.PI, 28, 1);
      // booster return to tower
      const u = clamp01((t - 0.55) / 0.4);
      vehicle.position.lerpVectors(pos, padWorld.clone().add(up.clone().multiplyScalar(0.3)), smootherstep(u));
      vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      setPlume(vehicle, u > 0.75 && u < 0.95, 1.1);
      if (api.pad.userData.armL) {
        const pinch = lerp(0.45, 0.02, smootherstep(u));
        api.pad.userData.armL.rotation.z = -pinch;
        api.pad.userData.armR.rotation.z = pinch;
      }
    }
  }

  if (mission.beyond && mission.vehicle === "saturnv" && t > 0.55) {
    // push toward "moon" direction
    const moonDir = new THREE.Vector3(1, 0.2, 0.3).normalize();
    const u = clamp01((t - 0.55) / 0.45);
    const far = padWorld.clone().add(moonDir.multiplyScalar(EARTH_R * (2 + u * 8)));
    vehicle.position.lerpVectors(pos, far, smootherstep(u));
    setPlume(vehicle, t < 0.7, 0.6);
  }

  // On-orbit parking for generic rockets
  if (t > 0.6 && !["falcon9", "starship", "saturnv"].includes(mission.vehicle)) {
    placeOrbiting(vehicle, api.LEO_VIS, (t - 0.6) * Math.PI * 2, 28, 0.5);
    setPlume(vehicle, false);
  }

  // Camera: follow ascending stack; during staging/SECO frame both stages then ease to upper
  let focus = vehicle.position.clone();
  let companion = null;
  if (mission.vehicle === "falcon9" && t >= 0.32 && upper.visible) {
    companion = upper.position.clone();
    // Sep window: look between stages so the stack never leaves frame, then ease to upper
    const sepU = smootherstep(clamp01((t - 0.32) / 0.2));
    const mid = focus.clone().lerp(companion, 0.45);
    focus = mid.clone().lerp(companion, sepU);
  } else if (mission.vehicle === "starship" && t >= 0.3 && shipOnly.visible) {
    companion = shipOnly.position.clone();
    const sepU = smootherstep(clamp01((t - 0.3) / 0.22));
    const mid = focus.clone().lerp(companion, 0.45);
    focus = mid.clone().lerp(companion, sepU);
  }

  // Pad→chase blend already reaches 0 by localUntil; stay on chase thereafter
  return buildLaunchCamHint({
    t,
    padWorld,
    up,
    east,
    face,
    focus,
    companion,
    localBlend: 0,
  });
}

/**
 * Continuous launch follow-cam. Blends pad theater → chase → orbital pullback.
 * When companion (separating stage) is set, pulls back so both stay in frame.
 */
function buildLaunchCamHint({ t, padWorld, up, east, face, focus, companion, localBlend }) {
  const north = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  const alt = Math.max(0, focus.clone().sub(padWorld).dot(up));

  // Pad-local theater (readable ignition / early liftoff)
  const padCam = padWorld
    .clone()
    .add(up.clone().multiplyScalar(2.2 + alt * 0.15))
    .add(east.clone().multiplyScalar(-3.5))
    .add(north.clone().multiplyScalar(2.5));
  const padLook = padWorld.clone().add(up.clone().multiplyScalar(alt * 0.5 + 0.5));

  // Chase offset behind / beside the stack
  let chaseBack = 1.5;
  let chaseSide = 2.8 + t * 2;
  let chaseUp = 1.2;
  if (companion) {
    const sepDist = focus.distanceTo(companion);
    // Pull back with stage separation so neither stage leaves frame
    const frame = smootherstep(clamp01(sepDist / 2.5));
    chaseBack += 1.2 + frame * 3.5;
    chaseSide += 0.8 + frame * 2.2;
    chaseUp += 0.4 + frame * 1.2;
  }

  const chaseCam = focus
    .clone()
    .add(up.clone().multiplyScalar(chaseUp))
    .add(east.clone().multiplyScalar(-chaseSide))
    .add(face.clone().multiplyScalar(-chaseBack));

  // Ease orbital pullback (no hard cut past t=0.4)
  const pull = smootherstep(clamp01((t - 0.38) / 0.45));
  if (pull > 0) {
    const orbitCam = focus.clone().normalize().multiplyScalar(EARTH_R * (2.0 + pull * 1.8));
    chaseCam.lerp(orbitCam, pull);
  }

  const lb = clamp01(localBlend);
  const camPos = chaseCam.clone().lerp(padCam, lb);
  const look = focus.clone().lerp(padLook, lb);

  // Widen distance clamps during staging / high altitude so OrbitControls can't clip the stack
  const stagingWiden = companion ? 1 : 0;
  const minDist = lerp(0.45, 0.8, stagingWiden);
  const maxDist = EARTH_R * (18 + pull * 10 + stagingWiden * 4);
  return { position: camPos, target: look, minDist, maxDist };
}

function ensureWorldVehicle(api, vehicle) {
  if (vehicle.parent !== api.root) {
    api.root.attach(vehicle);
  }
}

function updateSmoke(api, u) {
  const arr = api.smokePos;
  for (let i = 0; i < api.smokeCount; i++) {
    const a = (i / api.smokeCount) * Math.PI * 2;
    const r = (0.3 + (i % 7) * 0.12) * (0.5 + u);
    const h = ((i * 17) % 10) * 0.08 * u;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = h + Math.random() * 0.1;
    arr[i * 3 + 2] = Math.sin(a) * r - 0.5;
  }
  api.smoke.geometry.attributes.position.needsUpdate = true;
  api.smoke.material.opacity = 0.35 + u * 0.4;
}

/** Raycast site markers — returns site id or null */
export function pickLaunchSite(api, raycaster) {
  const meshes = [];
  for (const { mesh } of api.siteMarkers.values()) {
    mesh.traverse((c) => {
      if (c.isMesh) meshes.push(c);
    });
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return null;
  let o = hits[0].object;
  while (o && !o.userData.siteId) o = o.parent;
  return o?.userData.siteId || null;
}

export function getSiteCameraFrame(api, siteId) {
  const entry = api.siteMarkers.get(siteId);
  if (!entry) return null;
  const up = entry.pos.clone().normalize();
  const { east } = launchBasis(entry.pos);
  const target = entry.pos.clone().add(up.clone().multiplyScalar(0.4));
  const position = entry.pos
    .clone()
    .add(up.clone().multiplyScalar(1.8))
    .add(east.clone().multiplyScalar(-3.2));
  return { position, target, minDist: 0.4, maxDist: 40 };
}

export function getSurfaceCameraFrame() {
  return {
    position: new THREE.Vector3(EARTH_R * 2.4, EARTH_R * 1.1, EARTH_R * 2.6),
    target: new THREE.Vector3(0, 0, 0),
    minDist: EARTH_R * 1.12,
    maxDist: EARTH_R * 12,
  };
}

export function getLeoCameraFrame() {
  return {
    position: new THREE.Vector3(EARTH_R * 2.0, EARTH_R * 0.9, EARTH_R * 2.2),
    target: new THREE.Vector3(0, 0, 0),
    minDist: EARTH_R * 1.15,
    maxDist: EARTH_R * 8,
  };
}

// Back-compat shims used by older main (optional)
export function listLeoJumpTargets() {
  return LAUNCH_MISSIONS.map((m) => ({
    id: m.id,
    label: m.name,
    date: m.date,
    speed: 1,
  }));
}

export function simDaysForDate(epoch, dateStr) {
  const d = new Date(dateStr.length <= 10 ? dateStr + "T12:00:00Z" : dateStr);
  return (d - epoch) / 86400000;
}

export function getLeoAbsoluteDate(epoch, simDays) {
  return new Date(epoch.getTime() + simDays * 86400000);
}
