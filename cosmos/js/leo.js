/* Einstein Math Space Lab note (v2.5.0): this richer LEO mission catalog (Hubble, Starlink trains, F9 ASDS landing,
 * Starship catch/loop, Falcon cadence) was never imported by main.js in the original Cosmos repo either. It is kept
 * here un-loaded as source for ticket C3 (LEO toggles) and C1/C2 (recovery sims). The live LEO view comes from earth.js. */
/**
 * Earth LEO drill-down — rockets, ISS, satellites, Apollo, Falcon & Starship.
 * Educational / cinematic scale (sizes exaggerated for visibility).
 */
import * as THREE from "three";

// Earth radius in LEO scene units
export const EARTH_R = 10;
const KM = EARTH_R / 6371; // 1 km → scene units
const LEO_ALT = 420 * KM; // ISS-ish
const GEO_ALT = 35786 * KM;

function daysSinceEpoch(dateStr, epoch) {
  const d = new Date(dateStr + (dateStr.length <= 10 ? "T12:00:00Z" : ""));
  return (d - epoch) / 86400000;
}

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

/** Mission catalog — calendar windows with 0–1 phase trajectories */
export const MISSIONS = [
  {
    id: "apollo11",
    name: "Apollo 11",
    blurb: "Saturn V → TLI → lunar landing (Eagle) → return. July 1969.",
    start: "1969-07-16T13:32:00Z",
    end: "1969-07-24T16:50:00Z",
    kind: "apollo",
    color: 0xf5f5f4,
  },
  {
    id: "hubble",
    name: "Hubble",
    blurb: "Hubble Space Telescope — LEO observatory since 1990.",
    start: "1990-04-24T12:33:00Z",
    end: "2099-01-01T00:00:00Z",
    kind: "hubble",
    color: 0x93c5fd,
    continuous: true,
  },
  {
    id: "iss",
    name: "ISS",
    blurb: "International Space Station — continuous LEO laboratory.",
    start: "1998-11-20T00:00:00Z",
    end: "2099-01-01T00:00:00Z",
    kind: "iss",
    color: 0xe2e8f0,
    continuous: true,
  },
  {
    id: "f9_landing",
    name: "Falcon 9 · first RTLS",
    blurb: "Orbcomm-2 — first orbital-class booster landing (LZ-1), Dec 2015.",
    start: "2015-12-21T01:29:00Z",
    end: "2015-12-21T01:45:00Z",
    kind: "falcon9",
    color: 0x38bdf8,
    landing: "lz1",
  },
  {
    id: "starlink",
    name: "Starlink trains",
    blurb: "Mega-constellation shells in LEO (simplified trains).",
    start: "2019-05-24T00:00:00Z",
    end: "2099-01-01T00:00:00Z",
    kind: "starlink",
    color: 0xa5b4fc,
    continuous: true,
  },
  {
    id: "f9_asds",
    name: "Falcon 9 · ASDS",
    blurb: "Typical GTO mission — booster lands on drone ship.",
    start: "2021-06-03T00:00:00Z",
    end: "2021-06-03T00:20:00Z",
    kind: "falcon9",
    color: 0x22d3ee,
    landing: "asds",
  },
  {
    id: "starship_ift5",
    name: "Starship · tower catch",
    blurb: "Super Heavy catch by Mechazilla chopsticks (IFT-5 era demo).",
    start: "2024-10-13T12:25:00Z",
    end: "2024-10-13T13:10:00Z",
    kind: "starship",
    color: 0xfbbf24,
    catch: true,
  },
  {
    id: "starship_loop",
    name: "Starship demo loop",
    blurb: "Recurring showcase flight when date ≥ 2025 (compressed replay).",
    start: "2025-01-01T00:00:00Z",
    end: "2099-01-01T00:00:00Z",
    kind: "starship_daily",
    color: 0xf59e0b,
    continuous: true,
  },
  {
    id: "f9_daily",
    name: "Falcon cadence",
    blurb: "Modern Falcon 9 flight cadence showcase (post-2020).",
    start: "2020-01-01T00:00:00Z",
    end: "2099-01-01T00:00:00Z",
    kind: "falcon_daily",
    color: 0x60a5fa,
    continuous: true,
  },
];

// ─── Mesh builders ─────────────────────────────────────────────

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.45,
    metalness: opts.metalness ?? 0.35,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function makeExhaust(color = 0xffaa44) {
  const g = new THREE.Group();
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.45, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  flame.rotation.x = Math.PI;
  flame.position.y = -0.28;
  g.add(flame);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffcc88,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.position.y = -0.1;
  g.add(glow);
  g.visible = false;
  g.userData.flame = flame;
  return g;
}

function makeFalcon() {
  const root = new THREE.Group();
  const white = mat(0xf8fafc, { metalness: 0.2, roughness: 0.4 });
  const black = mat(0x1e293b, { metalness: 0.5, roughness: 0.4 });
  const stage1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 1.4, 16), white);
  stage1.position.y = 0.7;
  root.add(stage1);
  const inter = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.12, 12), black);
  inter.position.y = 1.46;
  root.add(inter);
  const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 14), white);
  stage2.position.y = 1.8;
  root.add(stage2);
  const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 14), white);
  fairing.position.y = 2.28;
  root.add(fairing);
  // grid fins
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), black);
    const a = (i / 4) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.16, 1.15, Math.sin(a) * 0.16);
    fin.rotation.y = a;
    root.add(fin);
  }
  // legs folded
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.35, 0.03), black);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    leg.position.set(Math.cos(a) * 0.14, 0.15, Math.sin(a) * 0.14);
    leg.rotation.z = Math.cos(a) * 0.3;
    root.add(leg);
  }
  const exhaust = makeExhaust();
  exhaust.position.y = 0;
  root.add(exhaust);
  root.userData.exhaust = exhaust;
  root.userData.stage1 = stage1;
  root.userData.stage2 = stage2;
  root.userData.fairing = fairing;
  root.scale.setScalar(0.55);
  return root;
}

function makeStarshipStack() {
  const root = new THREE.Group();
  const steel = mat(0xc4c4c0, { metalness: 0.75, roughness: 0.28 });
  const dark = mat(0x3f3f46, { metalness: 0.5, roughness: 0.4 });
  // Super Heavy
  const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.2, 20), steel);
  booster.position.y = 1.1;
  root.add(booster);
  // Ship
  const ship = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 1.5, 18), steel);
  ship.position.y = 2.95;
  root.add(ship);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 16), steel);
  nose.position.y = 3.95;
  root.add(nose);
  // flaps
  for (const s of [-1, 1]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.35), dark);
    flap.position.set(s * 0.32, 3.2, 0);
    root.add(flap);
  }
  const exhaust = makeExhaust(0x88ccff);
  root.add(exhaust);
  root.userData.exhaust = exhaust;
  root.userData.booster = booster;
  root.userData.ship = ship;
  root.userData.nose = nose;
  root.scale.setScalar(0.5);
  return root;
}

function makeISS() {
  const root = new THREE.Group();
  const truss = mat(0xcbd5e1, { metalness: 0.6, roughness: 0.35 });
  const gold = mat(0xfbbf24, { metalness: 0.5, roughness: 0.4 });
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.22), truss);
  root.add(core);
  // solar arrays
  for (const s of [-1, 1]) {
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), truss);
    boom.position.x = s * 0.65;
    root.add(boom);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.35), gold);
    panel.position.set(s * 0.65, 0, 0);
    root.add(panel);
  }
  // modules
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 10), truss);
    m.rotation.z = Math.PI / 2;
    m.position.set((i - 1) * 0.2, -0.15, 0.12);
    root.add(m);
  }
  root.scale.setScalar(0.9);
  return root;
}

function makeHubble() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.55, 14),
    mat(0xe2e8f0, { metalness: 0.55, roughness: 0.3 })
  );
  body.rotation.z = Math.PI / 2;
  root.add(body);
  const aperture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14),
    mat(0x0f172a, { metalness: 0.2, roughness: 0.8 })
  );
  aperture.rotation.z = Math.PI / 2;
  aperture.position.x = 0.3;
  root.add(aperture);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.2), mat(0x38bdf8));
  door.position.set(0, 0.14, 0);
  root.add(door);
  root.scale.setScalar(0.7);
  return root;
}

function makeSaturnV() {
  const root = new THREE.Group();
  const white = mat(0xfafafa);
  const black = mat(0x171717);
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.3, 16), white);
  s1.position.y = 0.65;
  root.add(s1);
  // black/white bands
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.12, 16), black);
    band.position.y = 0.35 + i * 0.35;
    root.add(band);
  }
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 14), white);
  s2.position.y = 1.65;
  root.add(s2);
  const s3 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.5, 14), white);
  s3.position.y = 2.25;
  root.add(s3);
  const csm = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 12), white);
  csm.position.y = 2.7;
  root.add(csm);
  const exhaust = makeExhaust(0xff8844);
  root.add(exhaust);
  root.userData.exhaust = exhaust;
  root.scale.setScalar(0.65);
  return root;
}

function makeLander() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xe7e5e4, { metalness: 0.4, roughness: 0.45 })
  );
  root.add(body);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 10), mat(0xa8a29e));
  base.position.y = -0.05;
  root.add(base);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), mat(0xd6d3d1));
    leg.position.set(Math.cos(a) * 0.16, -0.18, Math.sin(a) * 0.16);
    leg.rotation.z = Math.cos(a) * 0.4;
    leg.rotation.x = Math.sin(a) * 0.4;
    root.add(leg);
  }
  const exhaust = makeExhaust(0xffcc66);
  exhaust.scale.setScalar(0.5);
  root.add(exhaust);
  root.userData.exhaust = exhaust;
  return root;
}

function makeTower() {
  const root = new THREE.Group();
  const steel = mat(0x64748b, { metalness: 0.7, roughness: 0.3 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), steel);
  tower.position.y = 1.6;
  root.add(tower);
  // chopsticks
  const armL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.12), steel);
  armL.position.set(-0.55, 2.4, 0.3);
  root.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.12), steel);
  armR.position.set(0.55, 2.4, 0.3);
  root.add(armR);
  root.userData.armL = armL;
  root.userData.armR = armR;
  return root;
}

function makePad() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.0, 0.12, 24),
    mat(0x334155, { metalness: 0.3, roughness: 0.7 })
  );
  pad.position.y = 0.06;
  g.add(pad);
  return g;
}

function makeDroneShip() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.7), mat(0x1e3a5f));
  deck.position.y = 0.1;
  g.add(deck);
  const mark = new THREE.Mesh(new THREE.CircleGeometry(0.25, 16), mat(0xf8fafc));
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = 0.17;
  g.add(mark);
  return g;
}

// ─── LEO System ────────────────────────────────────────────────

export function createLeoSystem(THREE_NS = THREE) {
  const root = new THREE.Group();
  root.name = "leo-system";
  root.visible = false;

  // Starfield local
  const starPos = new Float32Array(2000 * 3);
  for (let i = 0; i < 2000; i++) {
    const r = 80 + Math.random() * 120;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(starPos, 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true })
  );
  root.add(stars);

  // Sun light for LEO
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
  sunLight.position.set(40, 10, 20);
  root.add(sunLight);
  root.add(new THREE.AmbientLight(0x334466, 0.35));

  // Earth
  const earthGroup = new THREE.Group();
  const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64);
  // Procedural-ish earth colors via vertex colors
  const colors = [];
  const pos = earthGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / EARTH_R;
    const x = pos.getX(i) / EARTH_R;
    const z = pos.getZ(i) / EARTH_R;
    // fake continents
    const n = Math.sin(x * 4 + z * 3) * Math.cos(y * 5 + x * 2);
    if (Math.abs(y) > 0.85) {
      colors.push(0.92, 0.94, 0.98); // ice
    } else if (n > 0.15) {
      colors.push(0.18, 0.42, 0.22); // land
    } else if (n > 0.05) {
      colors.push(0.35, 0.4, 0.2);
    } else {
      colors.push(0.08, 0.22, 0.55); // ocean
    }
  }
  earthGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const earth = new THREE.Mesh(
    earthGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    })
  );
  earthGroup.add(earth);

  // Atmosphere
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.045, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4da3ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  earthGroup.add(atmo);

  // Clouds
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.015, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 1,
      depthWrite: false,
    })
  );
  earthGroup.add(clouds);

  // City lights night side (subtle)
  const lights = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.002, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffaa55,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  earthGroup.add(lights);

  root.add(earthGroup);

  // Moon (local, compressed distance for drama)
  const moonDist = EARTH_R * 12;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 0.27, 32, 32),
    mat(0xbababa, { roughness: 0.95, metalness: 0 })
  );
  moon.position.set(moonDist, EARTH_R * 0.5, -moonDist * 0.2);
  root.add(moon);

  // Launch sites (Florida-ish + Boca Chica-ish on surface)
  function surfacePoint(latDeg, lonDeg, alt = 0) {
    const lat = THREE.MathUtils.degToRad(latDeg);
    const lon = THREE.MathUtils.degToRad(lonDeg);
    const r = EARTH_R + alt;
    return new THREE.Vector3(
      r * Math.cos(lat) * Math.cos(lon),
      r * Math.sin(lat),
      r * Math.cos(lat) * Math.sin(lon)
    );
  }

  const cape = surfacePoint(28.5, -80.6);
  const boca = surfacePoint(25.99, -97.15);
  const lz1 = surfacePoint(28.49, -80.58, 0.02);

  const padCape = makePad();
  orientOnSurface(padCape, cape);
  root.add(padCape);

  const padBoca = makePad();
  orientOnSurface(padBoca, boca);
  root.add(padBoca);

  const tower = makeTower();
  orientOnSurface(tower, boca.clone().add(boca.clone().normalize().multiplyScalar(0.05)));
  root.add(tower);

  const droneship = makeDroneShip();
  // Atlantic ASDS position (visual)
  const asdsPos = surfacePoint(28.4, -74.0, 0.05);
  // Raise to "ocean" near surface
  droneship.position.copy(asdsPos);
  droneship.lookAt(0, 0, 0);
  droneship.rotateX(-Math.PI / 2);
  root.add(droneship);

  // Trajectory ribbons
  const trajGroup = new THREE.Group();
  root.add(trajGroup);

  // Vehicles pool
  const vehicles = {
    falcon: makeFalcon(),
    falcon2: makeFalcon(),
    starship: makeStarshipStack(),
    starship2: makeStarshipStack(),
    iss: makeISS(),
    hubble: makeHubble(),
    saturn: makeSaturnV(),
    lander: makeLander(),
    apolloCsm: makeFalcon(), // reuse slim craft as CSM approx - replace with simple capsule
  };
  // Better CSM
  {
    const csm = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), mat(0xf5f5f4));
    csm.add(cone);
    const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12), mat(0x1e293b));
    sm.position.y = -0.2;
    csm.add(sm);
    vehicles.apolloCsm = csm;
  }

  for (const v of Object.values(vehicles)) {
    v.visible = false;
    root.add(v);
  }

  // Starlink dots
  const slCount = 120;
  const slPos = new Float32Array(slCount * 3);
  const slGeo = new THREE.BufferGeometry();
  slGeo.setAttribute("position", new THREE.BufferAttribute(slPos, 3));
  const starlink = new THREE.Points(
    slGeo,
    new THREE.PointsMaterial({
      color: 0xa5b4fc,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    })
  );
  starlink.visible = false;
  root.add(starlink);

  // ISS orbit ring
  const issOrbit = makeOrbitRing(EARTH_R + LEO_ALT, 0x94a3b8, 0.35);
  root.add(issOrbit);

  // Labels sprite helper
  const labelSprites = [];

  const api = {
    root,
    earthGroup,
    clouds,
    moon,
    vehicles,
    trajGroup,
    starlink,
    tower,
    padCape,
    padBoca,
    droneship,
    issOrbit,
    cape,
    boca,
    lz1,
    asdsPos,
    moonDist,
    activeMissionId: null,
    _trajLines: [],
  };

  return api;
}

function orientOnSurface(obj, point) {
  obj.position.copy(point);
  obj.lookAt(0, 0, 0);
  obj.rotateX(-Math.PI / 2);
}

function makeOrbitRing(radius, color, opacity) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  // tilt LEO inclination ~51.6° for ISS
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.LineLoop(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  line.rotation.x = THREE.MathUtils.degToRad(51.6);
  return line;
}

function clearTrajectories(leo) {
  for (const l of leo._trajLines) {
    leo.trajGroup.remove(l);
    l.geometry?.dispose?.();
    l.material?.dispose?.();
  }
  leo._trajLines = [];
}

function addTrajectory(leo, points, color, opacity = 0.55) {
  if (points.length < 2) return;
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  leo.trajGroup.add(line);
  leo._trajLines.push(line);
}

function setExhaust(vehicle, on, scale = 1) {
  const ex = vehicle?.userData?.exhaust;
  if (!ex) return;
  ex.visible = !!on;
  if (on) {
    const f = ex.userData.flame;
    if (f) f.scale.set(1, 0.8 + Math.random() * 0.5, 1);
    ex.scale.setScalar(scale);
  }
}

function hideAllVehicles(leo) {
  for (const v of Object.values(leo.vehicles)) {
    v.visible = false;
    setExhaust(v, false);
  }
  leo.starlink.visible = false;
}

/** Place object at altitude on Earth with lat/lon and optional along-track angle */
function placeOrbiting(obj, radius, angle, inclinationDeg = 51.6, raan = 0) {
  const i = THREE.MathUtils.degToRad(inclinationDeg);
  const O = THREE.MathUtils.degToRad(raan);
  // orbital plane coords
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  const y = 0;
  // rotate by inclination about X, then RAAN about Y
  const p = new THREE.Vector3(x, y, z);
  p.applyAxisAngle(new THREE.Vector3(1, 0, 0), i);
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), O);
  obj.position.copy(p);
  // face velocity-ish
  const next = new THREE.Vector3(radius * Math.cos(angle + 0.05), 0, radius * Math.sin(angle + 0.05));
  next.applyAxisAngle(new THREE.Vector3(1, 0, 0), i);
  next.applyAxisAngle(new THREE.Vector3(0, 1, 0), O);
  obj.lookAt(next);
}

function launchDirection(padPos) {
  // Eastward + up from pad
  const up = padPos.clone().normalize();
  const east = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  if (east.lengthSq() < 0.1) east.set(1, 0, 0);
  return { up, east };
}

/**
 * Falcon 9 profile t∈[0,1]: pad → MECO → sep → stage1 boostback → landing, stage2→orbit
 */
function falconProfile(t, pad, landingPos, leo) {
  const { up, east } = launchDirection(pad);
  const f9 = leo.vehicles.falcon;
  const upper = leo.vehicles.falcon2;
  f9.visible = true;

  const points = [];
  // Build path samples for trajectory
  for (let s = 0; s <= 40; s++) {
    const u = s / 40;
    points.push(sampleFalconPos(u, pad, landingPos, up, east, "booster"));
  }
  addTrajectory(leo, points, 0x38bdf8, 0.5);
  const orbPts = [];
  for (let s = 0; s <= 40; s++) {
    orbPts.push(sampleFalconPos(s / 40, pad, landingPos, up, east, "upper"));
  }
  addTrajectory(leo, orbPts, 0x94a3b8, 0.35);

  // Animate
  if (t < 0.12) {
    // liftoff
    const u = t / 0.12;
    const h = smoothstep(u) * EARTH_R * 0.35;
    const downrange = u * u * EARTH_R * 0.15;
    f9.position.copy(pad).add(up.clone().multiplyScalar(h)).add(east.clone().multiplyScalar(downrange));
    f9.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up.clone().multiplyScalar(1 - u * 0.3).add(east.clone().multiplyScalar(u * 0.5)).normalize());
    setExhaust(f9, true, 1.2);
    upper.visible = false;
  } else if (t < 0.28) {
    // ascent + MECO
    const u = (t - 0.12) / 0.16;
    const h = EARTH_R * (0.35 + u * 0.45);
    const downrange = EARTH_R * (0.15 + u * 0.8);
    f9.position.copy(pad).add(up.clone().multiplyScalar(h)).add(east.clone().multiplyScalar(downrange));
    const face = up.clone().multiplyScalar(0.4).add(east.clone().multiplyScalar(0.9)).normalize();
    f9.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), face);
    setExhaust(f9, true, 1);
    upper.visible = false;
  } else if (t < 0.35) {
    // separation
    const u = (t - 0.28) / 0.07;
    const base = pad.clone().add(up.clone().multiplyScalar(EARTH_R * 0.8)).add(east.clone().multiplyScalar(EARTH_R * 0.95));
    f9.position.copy(base).add(up.clone().multiplyScalar(-u * 0.3));
    upper.visible = true;
    upper.position.copy(base).add(east.clone().multiplyScalar(u * 0.5)).add(up.clone().multiplyScalar(u * 0.4));
    upper.quaternion.copy(f9.quaternion);
    setExhaust(f9, false);
    setExhaust(upper, true, 0.7);
  } else if (t < 0.7) {
    // booster return + upper continues
    const u = (t - 0.35) / 0.35;
    const start = pad.clone().add(up.clone().multiplyScalar(EARTH_R * 0.75)).add(east.clone().multiplyScalar(EARTH_R * 0.9));
    f9.position.lerpVectors(start, landingPos, smoothstep(u));
    // flip for entry
    const face = landingPos.clone().sub(f9.position).normalize();
    if (face.lengthSq() > 0.01) {
      f9.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), face.clone().multiplyScalar(-1).normalize());
    }
    setExhaust(f9, u > 0.7, 0.8);
    upper.visible = true;
    placeOrbiting(upper, EARTH_R + LEO_ALT * (0.5 + u * 0.5), u * Math.PI, 28, 0);
    setExhaust(upper, u < 0.5, 0.5);
  } else {
    // landing burn + landed
    const u = (t - 0.7) / 0.3;
    f9.position.copy(landingPos).add(up.clone().multiplyScalar(Math.max(0, (1 - smoothstep(u)) * 0.8)));
    f9.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    setExhaust(f9, u < 0.85, 0.9);
    upper.visible = true;
    placeOrbiting(upper, EARTH_R + LEO_ALT, t * Math.PI * 2, 28, 0.2);
    setExhaust(upper, false);
  }
}

function sampleFalconPos(t, pad, landing, up, east, which) {
  if (which === "upper") {
    if (t < 0.3) {
      const u = t / 0.3;
      return pad
        .clone()
        .add(up.clone().multiplyScalar(EARTH_R * 0.2 * u))
        .add(east.clone().multiplyScalar(EARTH_R * 0.1 * u * u));
    }
    const ang = ((t - 0.3) / 0.7) * Math.PI * 1.2;
    const r = EARTH_R + LEO_ALT * Math.min(1, (t - 0.25) * 2);
    return new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang * 0.3) * r * 0.2, Math.sin(ang) * r);
  }
  // booster
  if (t < 0.35) {
    const u = t / 0.35;
    return pad
      .clone()
      .add(up.clone().multiplyScalar(EARTH_R * 0.85 * smoothstep(u)))
      .add(east.clone().multiplyScalar(EARTH_R * 0.9 * u * u));
  }
  const u = (t - 0.35) / 0.65;
  const start = pad.clone().add(up.clone().multiplyScalar(EARTH_R * 0.75)).add(east.clone().multiplyScalar(EARTH_R * 0.9));
  return start.clone().lerp(landing, smoothstep(u));
}

function starshipProfile(t, pad, towerPos, leo, doCatch) {
  const { up, east } = launchDirection(pad);
  const stack = leo.vehicles.starship;
  const shipOnly = leo.vehicles.starship2;
  stack.visible = true;

  const ascent = [];
  for (let s = 0; s <= 30; s++) {
    const u = s / 30;
    ascent.push(
      pad
        .clone()
        .add(up.clone().multiplyScalar(EARTH_R * 1.2 * smoothstep(u)))
        .add(east.clone().multiplyScalar(EARTH_R * 0.4 * u * u))
    );
  }
  addTrajectory(leo, ascent, 0xfbbf24, 0.55);

  if (t < 0.2) {
    const u = t / 0.2;
    stack.position
      .copy(pad)
      .add(up.clone().multiplyScalar(EARTH_R * 0.5 * smoothstep(u)))
      .add(east.clone().multiplyScalar(EARTH_R * 0.05 * u));
    stack.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    setExhaust(stack, true, 1.4);
    shipOnly.visible = false;
    // chopsticks open
    if (leo.tower.userData.armL) {
      leo.tower.userData.armL.rotation.z = -0.4;
      leo.tower.userData.armR.rotation.z = 0.4;
    }
  } else if (t < 0.4) {
    // hot stage / sep visual
    const u = (t - 0.2) / 0.2;
    const high = pad.clone().add(up.clone().multiplyScalar(EARTH_R * 1.1)).add(east.clone().multiplyScalar(EARTH_R * 0.35));
    stack.position.copy(high).add(up.clone().multiplyScalar(-u * 0.4));
    shipOnly.visible = true;
    shipOnly.position.copy(high).add(up.clone().multiplyScalar(u * 0.6)).add(east.clone().multiplyScalar(u * 0.3));
    // hide booster mesh parts on shipOnly - show only upper by scaling
    shipOnly.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      up.clone().multiplyScalar(0.5).add(east.clone().multiplyScalar(0.8)).normalize()
    );
    setExhaust(stack, u < 0.3, 1);
    setExhaust(shipOnly, true, 0.9);
  } else if (t < 0.75) {
    // booster return to tower
    const u = (t - 0.4) / 0.35;
    const high = pad.clone().add(up.clone().multiplyScalar(EARTH_R * 0.9)).add(east.clone().multiplyScalar(EARTH_R * 0.3));
    stack.position.lerpVectors(high, towerPos, smoothstep(u));
    stack.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    setExhaust(stack, u > 0.75, 1.1);
    shipOnly.visible = true;
    placeOrbiting(shipOnly, EARTH_R + LEO_ALT * 1.5, u * Math.PI, 28, 1.2);
    setExhaust(shipOnly, false);
    if (leo.tower.userData.armL) {
      const open = lerp(0.5, 0.05, smoothstep(u));
      leo.tower.userData.armL.rotation.z = -open;
      leo.tower.userData.armR.rotation.z = open;
    }
  } else {
    // catch
    const u = (t - 0.75) / 0.25;
    stack.position.copy(towerPos).add(up.clone().multiplyScalar(0.15 * (1 - smoothstep(u))));
    stack.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    setExhaust(stack, u < 0.5 && doCatch, 0.7);
    shipOnly.visible = true;
    placeOrbiting(shipOnly, EARTH_R + LEO_ALT * 2, Math.PI + u, 28, 1.2);
    if (leo.tower.userData.armL) {
      const pinch = lerp(0.05, 0.0, smoothstep(u));
      leo.tower.userData.armL.rotation.z = -pinch;
      leo.tower.userData.armR.rotation.z = pinch;
    }
  }
}

function apolloProfile(t, pad, leo) {
  // t 0-1 over full mission week
  const { up, east } = launchDirection(pad);
  const saturn = leo.vehicles.saturn;
  const csm = leo.vehicles.apolloCsm;
  const lander = leo.vehicles.lander;
  const moonPos = leo.moon.position.clone();

  // trajectory Earth → Moon
  const translunar = [];
  for (let s = 0; s <= 48; s++) {
    const u = s / 48;
    translunar.push(new THREE.Vector3().lerpVectors(
      pad.clone().add(up.clone().multiplyScalar(EARTH_R * 0.5)),
      moonPos,
      smoothstep(u)
    ));
  }
  addTrajectory(leo, translunar, 0xf5f5f4, 0.45);

  if (t < 0.08) {
    // launch
    const u = t / 0.08;
    saturn.visible = true;
    csm.visible = false;
    lander.visible = false;
    saturn.position
      .copy(pad)
      .add(up.clone().multiplyScalar(EARTH_R * 0.6 * smoothstep(u)))
      .add(east.clone().multiplyScalar(EARTH_R * 0.2 * u * u));
    saturn.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      up.clone().multiplyScalar(1 - u * 0.4).add(east.clone().multiplyScalar(u * 0.6)).normalize()
    );
    setExhaust(saturn, true, 1.3);
  } else if (t < 0.15) {
    // Earth orbit / TLI prep
    const u = (t - 0.08) / 0.07;
    saturn.visible = false;
    csm.visible = true;
    lander.visible = false;
    placeOrbiting(csm, EARTH_R + LEO_ALT * 0.8, u * Math.PI * 2, 28.5, 0);
    setExhaust(csm, false);
  } else if (t < 0.55) {
    // translunar coast
    const u = (t - 0.15) / 0.4;
    saturn.visible = false;
    csm.visible = true;
    lander.visible = t > 0.45;
    const p = new THREE.Vector3().lerpVectors(
      pad.clone().add(up.clone().multiplyScalar(EARTH_R * 1.2)),
      moonPos,
      smoothstep(u)
    );
    csm.position.copy(p);
    csm.lookAt(moonPos);
    if (lander.visible) {
      lander.position.copy(p).add(new THREE.Vector3(0.3, -0.2, 0));
    }
  } else if (t < 0.72) {
    // lunar orbit + landing
    const u = (t - 0.55) / 0.17;
    csm.visible = true;
    lander.visible = true;
    saturn.visible = false;
    const moonR = EARTH_R * 0.27;
    const ang = u * Math.PI * 2;
    const orbitR = moonR * 2.2;
    csm.position.set(
      moonPos.x + Math.cos(ang) * orbitR,
      moonPos.y + Math.sin(ang * 0.3) * orbitR * 0.2,
      moonPos.z + Math.sin(ang) * orbitR
    );
    // lander descends
    const landPos = moonPos.clone().add(new THREE.Vector3(moonR * 0.9, 0.1, 0.2));
    const high = moonPos.clone().add(new THREE.Vector3(orbitR, 0.3, 0));
    lander.position.lerpVectors(high, landPos, smoothstep(u));
    setExhaust(lander, u > 0.3 && u < 0.95, 0.4);
  } else if (t < 0.88) {
    // surface stay + ascent rendezvous simplified
    csm.visible = true;
    lander.visible = true;
    const moonR = EARTH_R * 0.27;
    const landPos = moonPos.clone().add(new THREE.Vector3(moonR * 0.9, 0.1, 0.2));
    lander.position.copy(landPos);
    setExhaust(lander, false);
    const ang = ((t - 0.72) / 0.16) * Math.PI;
    const orbitR = moonR * 2.2;
    csm.position.set(
      moonPos.x + Math.cos(ang) * orbitR,
      moonPos.y,
      moonPos.z + Math.sin(ang) * orbitR
    );
  } else {
    // return to Earth
    const u = (t - 0.88) / 0.12;
    lander.visible = false;
    csm.visible = true;
    const moonR = EARTH_R * 0.27;
    const start = moonPos.clone().add(new THREE.Vector3(moonR * 2, 0, 0));
    const splash = surfacePointApprox(leo, 15, -150); // Pacific-ish
    csm.position.lerpVectors(start, splash, smoothstep(u));
    setExhaust(csm, false);
  }
}

function surfacePointApprox(leo, lat, lon) {
  const latR = THREE.MathUtils.degToRad(lat);
  const lonR = THREE.MathUtils.degToRad(lon);
  const r = EARTH_R + 0.05;
  return new THREE.Vector3(
    r * Math.cos(latR) * Math.cos(lonR),
    r * Math.sin(latR),
    r * Math.cos(latR) * Math.sin(lonR)
  );
}

function updateContinuous(leo, absDate, simDays) {
  // Earth rotation
  leo.earthGroup.rotation.y = simDays * 2 * Math.PI; // 1 rev/day visual
  leo.clouds.rotation.y = simDays * 2 * Math.PI * 1.05;

  const ms = absDate.getTime();

  // ISS
  if (ms >= new Date("1998-11-20Z").getTime()) {
    leo.vehicles.iss.visible = true;
    const periodMin = 92.5;
    const ang = ((simDays * 1440) / periodMin) * Math.PI * 2;
    placeOrbiting(leo.vehicles.iss, EARTH_R + LEO_ALT, ang, 51.6, 20);
    leo.issOrbit.visible = true;
  } else {
    leo.vehicles.iss.visible = false;
  }

  // Hubble
  if (ms >= new Date("1990-04-24Z").getTime()) {
    leo.vehicles.hubble.visible = true;
    const ang = ((simDays * 1440) / 95) * Math.PI * 2 + 1.2;
    placeOrbiting(leo.vehicles.hubble, EARTH_R + 540 * KM, ang, 28.5, 80);
  } else {
    leo.vehicles.hubble.visible = false;
  }

  // Starlink
  if (ms >= new Date("2019-05-24Z").getTime()) {
    leo.starlink.visible = true;
    const pos = leo.starlink.geometry.attributes.position.array;
    const shells = 3;
    const per = Math.floor(pos.length / 3 / shells);
    let idx = 0;
    for (let s = 0; s < shells; s++) {
      const r = EARTH_R + (550 + s * 80) * KM;
      const inc = 53 + s * 5;
      for (let i = 0; i < per && idx < pos.length / 3; i++, idx++) {
        const ang = (i / per) * Math.PI * 2 + simDays * (2 + s * 0.3) + s;
        const iR = THREE.MathUtils.degToRad(inc);
        const x = r * Math.cos(ang);
        const z = r * Math.sin(ang);
        const p = new THREE.Vector3(x, 0, z);
        p.applyAxisAngle(new THREE.Vector3(1, 0, 0), iR);
        p.applyAxisAngle(new THREE.Vector3(0, 1, 0), s * 0.8);
        pos[idx * 3] = p.x;
        pos[idx * 3 + 1] = p.y;
        pos[idx * 3 + 2] = p.z;
      }
    }
    leo.starlink.geometry.attributes.position.needsUpdate = true;
  } else {
    leo.starlink.visible = false;
  }
}

function missionPhase(m, absDate) {
  const t0 = new Date(m.start).getTime();
  const t1 = new Date(m.end).getTime();
  const t = absDate.getTime();
  if (t < t0 || t > t1) return null;
  return clamp01((t - t0) / (t1 - t0));
}

/** Daily looping showcase: map time-of-day fraction to flight t */
function dailyPhase(absDate, seedHours = 0) {
  const h = absDate.getUTCHours() + absDate.getUTCMinutes() / 60 + seedHours;
  // two flights per day windows
  const dayFrac = (h % 12) / 12;
  return dayFrac;
}

/**
 * Update LEO scene for absolute Date and simDays.
 * Returns { active: Mission[], caption }
 */
export function updateLeo(leo, absDate, simDays, opts = {}) {
  if (!leo.root.visible) return { active: [], caption: null };

  clearTrajectories(leo);
  // Don't hide continuous every frame before re-show — reset flight vehicles
  for (const id of ["falcon", "falcon2", "starship", "starship2", "saturn", "lander", "apolloCsm"]) {
    if (leo.vehicles[id]) {
      leo.vehicles[id].visible = false;
      setExhaust(leo.vehicles[id], false);
    }
  }

  updateContinuous(leo, absDate, simDays);

  const active = [];
  let caption = null;
  const focusId = opts.focusMissionId;

  for (const m of MISSIONS) {
    if (m.continuous && m.kind === "iss") continue;
    if (m.continuous && m.kind === "hubble") continue;
    if (m.continuous && m.kind === "starlink") continue;

    if (m.kind === "falcon_daily") {
      if (absDate.getTime() < new Date(m.start).getTime()) continue;
      if (focusId && focusId !== m.id && focusId !== "f9_landing" && focusId !== "f9_asds") {
        // still run unless focused on something else exclusive
      }
      const t = dailyPhase(absDate, 2);
      // only show if no exclusive historical falcon is playing hard
      const hist = MISSIONS.filter((x) => x.kind === "falcon9");
      let histPlaying = false;
      for (const h of hist) {
        if (missionPhase(h, absDate) != null) histPlaying = true;
      }
      if (!histPlaying) {
        falconProfile(t, leo.cape, leo.lz1, leo);
        active.push(m);
        caption = caption || `${m.name} · flight ${(t * 100).toFixed(0)}%`;
      }
      continue;
    }

    if (m.kind === "starship_daily") {
      if (absDate.getTime() < new Date(m.start).getTime()) continue;
      const hist = missionPhase(
        MISSIONS.find((x) => x.id === "starship_ift5"),
        absDate
      );
      if (hist == null) {
        const t = dailyPhase(absDate, 5);
        const towerPos = leo.boca.clone().add(leo.boca.clone().normalize().multiplyScalar(0.35));
        starshipProfile(t, leo.boca, towerPos, leo, true);
        active.push(m);
        caption = caption || `${m.name} · ${(t * 100).toFixed(0)}%`;
      }
      continue;
    }

    const phase = missionPhase(m, absDate);
    if (phase == null) continue;
    active.push(m);

    if (m.kind === "falcon9") {
      const land = m.landing === "asds" ? leo.asdsPos : leo.lz1;
      falconProfile(phase, leo.cape, land, leo);
      caption = `${m.name} · T+ ${(phase * 16).toFixed(1)} min (compressed)`;
    } else if (m.kind === "starship") {
      const towerPos = leo.boca.clone().add(leo.boca.clone().normalize().multiplyScalar(0.35));
      starshipProfile(phase, leo.boca, towerPos, leo, m.catch);
      caption = `${m.name} · ${(phase * 100).toFixed(0)}% · ${phase > 0.75 ? "CATCH" : "flight"}`;
    } else if (m.kind === "apollo") {
      apolloProfile(phase, leo.cape, leo);
      caption = `${m.name} · mission day ~${(phase * 8).toFixed(1)}`;
    }
  }

  return { active, caption };
}

export function getLeoAbsoluteDate(epoch, simDays) {
  return new Date(epoch.getTime() + simDays * 86400000);
}

export function simDaysForDate(epoch, dateStr) {
  return daysSinceEpoch(dateStr, epoch);
}

export function listLeoJumpTargets() {
  return [
    { id: "apollo11", label: "Apollo 11", date: "1969-07-16T14:00:00Z", speed: 0.15 },
    { id: "hubble", label: "Hubble era", date: "1995-06-01T00:00:00Z", speed: 5 },
    { id: "iss", label: "ISS", date: "2012-06-01T00:00:00Z", speed: 2 },
    { id: "f9_landing", label: "F9 landing", date: "2015-12-21T01:29:00Z", speed: 0.002 },
    { id: "starlink", label: "Starlink", date: "2022-01-15T00:00:00Z", speed: 3 },
    { id: "f9_asds", label: "F9 ASDS", date: "2021-06-03T00:00:00Z", speed: 0.002 },
    { id: "starship_ift5", label: "Tower catch", date: "2024-10-13T12:25:00Z", speed: 0.002 },
    { id: "modern", label: "2026 cadence", date: "2026-03-01T08:00:00Z", speed: 0.05 },
  ];
}
