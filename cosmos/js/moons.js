/**
 * Solar system moons — major named moons + minor swarms to match known counts.
 * Distances (a_planet) are cinematic scene units around the parent mesh, not km.
 * periodDays ≈ sidereal orbital periods.
 */

function m(id, name, color, visualRadius, a_planet, periodDays, opts = {}) {
  return {
    id,
    name,
    color,
    visualRadius,
    a_planet,
    periodDays,
    inclinationDeg: opts.i ?? 0,
    major: opts.major ?? false,
  };
}

/** Fill remaining count with tiny irregular moons */
export function minorSwarm(prefix, count, color, aMin, aMax, pMin, pMax) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const a = aMin + (aMax - aMin) * (0.15 + 0.85 * t) + (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.15;
    const p = pMin + (pMax - pMin) * ((i * 7) % 11) / 10;
    out.push(
      m(
        `${prefix}-minor-${i + 1}`,
        `${prefix} ${i + 1}`,
        color,
        0.018 + (i % 5) * 0.004,
        a,
        Math.max(0.3, p),
        { i: ((i * 37) % 60) - 20 }
      )
    );
  }
  return out;
}

export const EARTH_MOONS = [
  m("luna", "Luna", 0xcfd4dc, 0.16, 2.4, 27.322, { major: true }),
];

export const MARS_MOONS = [
  m("phobos", "Phobos", 0x9a8b7a, 0.06, 1.15, 0.319, { major: true }),
  m("deimos", "Deimos", 0x8a7d6e, 0.04, 1.75, 1.263, { major: true }),
];

// Jupiter: 4 Galileans + inner + named irregulars + swarm → ~95
const JUPITER_NAMED = [
  m("metis", "Metis", 0xb0a090, 0.035, 1.55, 0.295),
  m("adrastea", "Adrastea", 0xa89888, 0.03, 1.62, 0.298),
  m("amalthea", "Amalthea", 0xc07050, 0.055, 1.75, 0.498, { major: true }),
  m("thebe", "Thebe", 0xa88878, 0.04, 1.95, 0.675),
  m("io", "Io", 0xf0c040, 0.14, 2.35, 1.769, { major: true }),
  m("europa", "Europa", 0xd8c8a8, 0.13, 2.95, 3.551, { major: true }),
  m("ganymede", "Ganymede", 0xb0a090, 0.18, 3.75, 7.155, { major: true }),
  m("callisto", "Callisto", 0x6a6058, 0.16, 4.85, 16.69, { major: true }),
  m("themisto", "Themisto", 0x888888, 0.03, 5.4, 130),
  m("leda", "Leda", 0x909090, 0.028, 5.7, 241),
  m("himalia", "Himalia", 0xa09080, 0.06, 5.95, 250.6, { major: true }),
  m("lysithea", "Lysithea", 0x8a8a8a, 0.035, 6.15, 259),
  m("elara", "Elara", 0x959595, 0.04, 6.35, 259.6),
  m("dia", "Dia", 0x858585, 0.025, 6.55, 287),
  m("carpo", "Carpo", 0x7a7a7a, 0.025, 6.9, 456),
  m("ananke", "Ananke", 0x707070, 0.03, 7.3, 630, { i: 148 }),
  m("carme", "Carme", 0x6a6a6a, 0.03, 7.6, 702, { i: 165 }),
  m("pasiphae", "Pasiphae", 0x656565, 0.035, 7.9, 744, { i: 151 }),
  m("sinope", "Sinope", 0x606060, 0.03, 8.15, 759, { i: 158 }),
];

export const JUPITER_MOONS = [
  ...JUPITER_NAMED,
  ...minorSwarm("J", 95 - JUPITER_NAMED.length, 0x6b6560, 5.2, 8.8, 120, 800),
];

// Saturn: big ices + ring shepherds + swarm → ~146
const SATURN_NAMED = [
  m("pan", "Pan", 0xc8c0b0, 0.03, 1.55, 0.575),
  m("daphnis", "Daphnis", 0xc0b8a8, 0.025, 1.62, 0.594),
  m("atlas", "Atlas", 0xc4bcac, 0.03, 1.68, 0.602),
  m("prometheus", "Prometheus", 0xcac2b2, 0.035, 1.75, 0.613),
  m("pandora", "Pandora", 0xc6beae, 0.035, 1.82, 0.629),
  m("epimetheus", "Epimetheus", 0xb8b0a0, 0.04, 1.95, 0.694),
  m("janus", "Janus", 0xbab2a2, 0.045, 2.0, 0.695),
  m("mimas", "Mimas", 0xd0d0d0, 0.07, 2.25, 0.942, { major: true }),
  m("enceladus", "Enceladus", 0xf0f4f8, 0.08, 2.55, 1.37, { major: true }),
  m("tethys", "Tethys", 0xe0e0e0, 0.09, 2.9, 1.888, { major: true }),
  m("telesto", "Telesto", 0xc8c8c8, 0.03, 2.95, 1.888),
  m("calypso", "Calypso", 0xc4c4c4, 0.03, 2.85, 1.888),
  m("dione", "Dione", 0xd8d8d8, 0.09, 3.3, 2.737, { major: true }),
  m("helene", "Helene", 0xc0c0c0, 0.03, 3.35, 2.737),
  m("polydeuces", "Polydeuces", 0xb8b8b8, 0.025, 3.25, 2.737),
  m("rhea", "Rhea", 0xcacaca, 0.11, 3.85, 4.518, { major: true }),
  m("titan", "Titan", 0xe8a050, 0.2, 4.9, 15.95, { major: true }),
  m("hyperion", "Hyperion", 0xb09070, 0.06, 5.4, 21.28, { major: true }),
  m("iapetus", "Iapetus", 0x706050, 0.12, 6.4, 79.32, { major: true }),
  m("phoebe", "Phoebe", 0x504840, 0.06, 8.2, 550.3, { major: true, i: 175 }),
  m("kiviuq", "Kiviuq", 0x6a6a6a, 0.025, 7.0, 449),
  m("ijiraq", "Ijiraq", 0x656565, 0.025, 7.15, 451),
  m("paaliaq", "Paaliaq", 0x606060, 0.028, 7.4, 687),
  m("skathi", "Skathi", 0x5a5a5a, 0.025, 7.7, 728, { i: 153 }),
  m("albiorix", "Albiorix", 0x707070, 0.03, 7.9, 783),
  m("suttungr", "Suttungr", 0x555555, 0.025, 8.0, 1017, { i: 176 }),
  m("erriapus", "Erriapus", 0x6a6a6a, 0.025, 7.6, 871),
  m("tarvos", "Tarvos", 0x686868, 0.025, 7.75, 926),
  m("mundilfari", "Mundilfari", 0x585858, 0.022, 8.1, 953, { i: 167 }),
  m("narvi", "Narvi", 0x5c5c5c, 0.022, 8.25, 1004, { i: 146 }),
  m("siarnaq", "Siarnaq", 0x6e6e6e, 0.035, 7.5, 896),
  m("thrymr", "Thrymr", 0x545454, 0.022, 8.35, 1092, { i: 176 }),
  m("ymir", "Ymir", 0x5a5a5a, 0.025, 8.5, 1315, { i: 173 }),
];

export const SATURN_MOONS = [
  ...SATURN_NAMED,
  ...minorSwarm("S", 146 - SATURN_NAMED.length, 0x8a8580, 5.5, 9.0, 200, 1400),
];

// Uranus 28
const URANUS_NAMED = [
  m("cordelia", "Cordelia", 0xa0c0c0, 0.03, 1.45, 0.335),
  m("ophelia", "Ophelia", 0xa0c0c0, 0.03, 1.5, 0.376),
  m("bianca", "Bianca", 0xa8c4c4, 0.03, 1.55, 0.435),
  m("cressida", "Cressida", 0xa8c4c4, 0.03, 1.6, 0.464),
  m("desdemona", "Desdemona", 0xa8c4c4, 0.03, 1.65, 0.474),
  m("juliet", "Juliet", 0xb0c8c8, 0.032, 1.7, 0.493),
  m("portia", "Portia", 0xb0c8c8, 0.035, 1.78, 0.513),
  m("rosalind", "Rosalind", 0xa8c0c0, 0.03, 1.85, 0.558),
  m("cupid", "Cupid", 0xa0b8b8, 0.025, 1.9, 0.618),
  m("belinda", "Belinda", 0xa8c0c0, 0.03, 1.95, 0.624),
  m("perdita", "Perdita", 0xa0b8b8, 0.025, 2.0, 0.638),
  m("puck", "Puck", 0x90b0b0, 0.05, 2.15, 0.762, { major: true }),
  m("mab", "Mab", 0xa0b8b8, 0.025, 2.25, 0.923),
  m("miranda", "Miranda", 0xc0d0d0, 0.08, 2.5, 1.413, { major: true }),
  m("ariel", "Ariel", 0xd0e0e0, 0.09, 2.95, 2.52, { major: true }),
  m("umbriel", "Umbriel", 0x708090, 0.09, 3.4, 4.144, { major: true }),
  m("titania", "Titania", 0xc8d4d8, 0.12, 4.1, 8.706, { major: true }),
  m("oberon", "Oberon", 0xa8b0b8, 0.11, 4.75, 13.46, { major: true }),
  m("francisco", "Francisco", 0x709090, 0.025, 5.3, 267, { i: 147 }),
  m("caliban", "Caliban", 0x608080, 0.03, 5.6, 580, { i: 141 }),
  m("stephano", "Stephano", 0x658585, 0.025, 5.85, 677, { i: 144 }),
  m("trinculo", "Trinculo", 0x608080, 0.022, 6.1, 749, { i: 167 }),
  m("sycorax", "Sycorax", 0x557070, 0.04, 6.4, 1288, { major: true, i: 159 }),
  m("margaret", "Margaret", 0x658585, 0.022, 6.7, 1687, { i: 57 }),
  m("prospero", "Prospero", 0x5a7878, 0.028, 7.0, 1978, { i: 152 }),
  m("setebos", "Setebos", 0x5a7878, 0.028, 7.3, 2225, { i: 158 }),
  m("ferdinand", "Ferdinand", 0x557070, 0.025, 7.6, 2887, { i: 170 }),
];

export const URANUS_MOONS = [
  ...URANUS_NAMED,
  ...minorSwarm("U", Math.max(0, 28 - URANUS_NAMED.length), 0x6a9090, 5.0, 7.8, 300, 2000),
];

// Neptune 16
export const NEPTUNE_MOONS = [
  m("naiad", "Naiad", 0x8090b0, 0.03, 1.45, 0.294),
  m("thalassa", "Thalassa", 0x8090b0, 0.03, 1.52, 0.311),
  m("despina", "Despina", 0x8595b5, 0.035, 1.6, 0.335),
  m("galatea", "Galatea", 0x8595b5, 0.035, 1.7, 0.429),
  m("larissa", "Larissa", 0x8a9aba, 0.04, 1.85, 0.555),
  m("hippocamp", "Hippocamp", 0x7a8aaa, 0.03, 2.0, 0.95),
  m("proteus", "Proteus", 0x6a7080, 0.07, 2.35, 1.122, { major: true }),
  m("triton", "Triton", 0xd0c8c0, 0.16, 3.4, 5.877, { major: true, i: 157 }),
  m("nereid", "Nereid", 0xa0a8b0, 0.06, 5.8, 360.1, { major: true, i: 7 }),
  m("halimede", "Halimede", 0x708090, 0.03, 6.2, 1879, { i: 134 }),
  m("sao", "Sao", 0x708090, 0.028, 6.5, 2914, { i: 48 }),
  m("laomedeia", "Laomedeia", 0x708090, 0.028, 6.8, 3168, { i: 35 }),
  m("psamathe", "Psamathe", 0x657585, 0.025, 7.2, 9116, { i: 137 }),
  m("neso", "Neso", 0x657585, 0.03, 7.6, 9374, { i: 132 }),
  m("s2002n5", "S/2002 N 5", 0x607080, 0.022, 6.0, 9), // placeholder period visual
  m("s2021n1", "S/2021 N 1", 0x607080, 0.022, 7.0, 100),
];

// Pluto system
export const PLUTO_MOONS = [
  m("charon", "Charon", 0xb0a8a0, 0.14, 1.85, 6.387, { major: true }),
  m("styx", "Styx", 0x908880, 0.04, 2.4, 20.2),
  m("nix", "Nix", 0xa09890, 0.05, 2.85, 24.9, { major: true }),
  m("kerberos", "Kerberos", 0x888078, 0.04, 3.25, 32.2),
  m("hydra", "Hydra", 0xa09890, 0.05, 3.7, 38.2, { major: true }),
];

export function moonCountLabel(moons) {
  const n = moons?.length ?? 0;
  return String(n);
}
