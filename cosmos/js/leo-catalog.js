/**
 * Einstein Math Space Lab (C3, v2.6.0): LEO catalog toggles — pure data + Kepler math (no THREE, no DOM),
 * re-exported by leo.js so the Space Lab LEO view and Node tests share one source.
 *
 * Kepler's third law for a circular orbit: T = 2π √(a³ / μ), with a = Earth radius + altitude.
 */

export const EARTH_RADIUS_KM = 6371; // mean Earth radius
export const MU_EARTH_KM3_S2 = 398600; // Earth's gravitational parameter μ = GM (km³/s²)

/** Orbital period in minutes for a circular orbit `altKm` above the surface. */
export function orbitalPeriodMin(altKm) {
  const a = EARTH_RADIUS_KM + altKm;
  return (2 * Math.PI * Math.sqrt((a * a * a) / MU_EARTH_KM3_S2)) / 60;
}

/** Orbital speed in km/s for a circular orbit (v = √(μ/a)). */
export function orbitalSpeedKmS(altKm) {
  return Math.sqrt(MU_EARTH_KM3_S2 / (EARTH_RADIUS_KM + altKm));
}

export const LEO_TOGGLES = [
  {
    id: "hubble",
    name: "Hubble",
    icon: "🔭",
    kind: "single",
    color: 0x93c5fd,
    // NASA, "A NASA Refresher on Hubble Facts for the 25th Anniversary" (2015): altitude 547 km (340 mi),
    // inclined 28.5° to the equator, ~95 min per orbit —
    // https://science.nasa.gov/centers-and-facilities/goddard/a-nasa-refresher-on-hubble-facts-for-the-25th-anniversary/
    // Hubble has no thrusters and its orbit slowly sinks (NASA "About Hubble" now says ~483 km / ~95 min —
    // https://science.nasa.gov/mission/hubble/overview/about-hubble/). We teach with 540 km, its typical
    // operating height in the 2010s, which still gives the published ~95 min.
    altKm: 540,
    inclinationDeg: 28.5,
    publishedPeriodMin: 95,
    blurb: "A space telescope above the blurry air — it takes sharp pictures of galaxies.",
  },
  {
    id: "starlink-550",
    name: "Starlink · 550 km shell",
    icon: "🛰️",
    kind: "shell",
    color: 0xa5b4fc,
    // FCC Order DA 19-1294 (Dec 19, 2019), SpaceX lower shell: 1,584 satellites at 550 km, 53°,
    // 72 orbital planes × 22 satellites — https://docs.fcc.gov/public/attachments/DA-19-1294A1.pdf
    // (inclination 53° restated in FCC 21-48, https://docs.fcc.gov/public/attachments/fcc-21-48a1.pdf).
    altKm: 550,
    inclinationDeg: 53,
    planes: 72,
    satsPerPlane: 22,
    publishedPeriodMin: 95, // "about 95 minutes" — ~15 laps of Earth a day, like every orbit ~550 km up
    blurb: "1,584 internet satellites in 72 rings, all at the same height.",
  },
];

/** Kid-friendly chip data for a toggle: altitude, inclination, period (Kepler). */
export function leoChips(entry) {
  const T = orbitalPeriodMin(entry.altKm);
  const chips = [
    { key: "alt", label: "Altitude", value: `${entry.altKm} km` },
    { key: "inc", label: "Inclination", value: `${entry.inclinationDeg}°` },
    { key: "period", label: "Period", value: `${T.toFixed(1)} min` },
  ];
  if (entry.kind === "shell") chips.push({ key: "count", label: "Satellites", value: `${(entry.planes * entry.satsPerPlane).toLocaleString("en-US")}` });
  return chips;
}

/** Tiny on/off state for the LEO toggles (all off at start). */
export function createLeoToggleState(entries = LEO_TOGGLES) {
  const ids = new Set(entries.map((e) => e.id));
  const on = new Set();
  return {
    isOn: (id) => on.has(id),
    set(id, value) {
      if (!ids.has(id)) return false;
      if (value) on.add(id);
      else on.delete(id);
      return on.has(id);
    },
    toggle(id) { return this.set(id, !on.has(id)); },
    list: () => entries.filter((e) => on.has(e.id)).map((e) => e.id),
  };
}
