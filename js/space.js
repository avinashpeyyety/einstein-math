/* Space Lab (v2.5.0) — the former Cosmos app (github.com/avinashpeyyety/cosmos) now lives inside Einstein Math under
 * cosmos/ (Three.js r170 vendored in vendor/three/, MIT). This file is the catalog the hub uses to link into it:
 * every working Cosmos section is a card that deep-links cosmos/?mode=…; sections that aren't working well yet are
 * visible "coming soon" stubs with notes for the rebuild tickets (docs/EXPANSION_PLAN.md C1–C4).
 * Pure data + HTML helpers (no DOM access) so tests/space-lab.test.js can run it in Node. */
const SpaceLab = {
  BASE: 'cosmos/',

  SECTIONS: [
    { id: 'solar', status: 'working', icon: '🪐', title: 'Solar System', mode: 'solar',
      blurb: 'Orbit the Sun with all 8 planets, Pluto, their moons, comets with tails and the asteroid belt. Speed up time, click a world to fly there.',
      topics: ['orbits', 'planets & moons', 'comets', 'time scales'] },
    { id: 'earth', status: 'working', icon: '🚀', title: 'Launch Sites & Liftoff', mode: 'earth',
      blurb: '6 historic launch sites on a spinning Earth. Pick a site, then a mission — Mercury, Apollo 11, STS-1, Vostok, Ariane 5, Shenzhou, Falcon 9 — with live altitude & speed.',
      topics: ['rockets', 'gravity', 'speed & altitude', 'history of spaceflight'] },
    { id: 'leo', status: 'working', icon: '🛰️', title: 'Low Earth Orbit', mode: 'leo',
      blurb: 'Hover above Earth and watch the ISS track around its 51.6° orbit.',
      topics: ['orbits', 'satellites'] },
    { id: 'stars', status: 'working', icon: '✨', title: 'Life of a Star', mode: 'stars',
      blurb: 'Scrub cosmic time from a gas cloud to a red giant — then pick the ending: white dwarf, neutron star or black hole.',
      topics: ['stars', 'gravity', 'deep time'] },
    { id: 'landings', status: 'stub', icon: '🛬', title: 'Rocket Landings',
      blurb: 'Falcon 9 booster landing (RTLS / droneship) and Starship tower catch.',
      note: 'Coming soon — the old landing sims slid the booster in a straight line to an off-pad spot and hid the tower before the catch. Rebuild with boostback → entry → landing burn on a visible pad/droneship (C1) and a visible tower catch (C2).' },
    { id: 'leo-missions', status: 'stub', icon: '🔭', title: 'LEO Missions: Hubble & Starlink',
      blurb: 'Hubble, Starlink trains, Starship demo loop and Falcon launch cadence as LEO toggles.',
      note: 'Coming soon — the catalog exists (cosmos/js/leo.js) but was never wired into the app. Wire as clean on/off toggles with altitude/inclination/period chips (C3).' },
  ],

  working() { return this.SECTIONS.filter((s) => s.status === 'working'); },
  stubs() { return this.SECTIONS.filter((s) => s.status === 'stub'); },

  url(section) {
    const s = typeof section === 'string' ? this.SECTIONS.find((x) => x.id === section) : section;
    if (!s || s.status !== 'working') return null;
    return this.BASE + '?mode=' + encodeURIComponent(s.mode);
  },

  _esc(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  /** Cards for the Space Lab screen (full) or a compact list for the Physics Mission Map unit card. */
  cardsHtml(opts = {}) {
    const e = (v) => this._esc(v);
    if (opts.compact) {
      return `<ul class="lesson-list space-list">${this.SECTIONS.map((s) => s.status === 'working'
        ? `<li><span>${s.icon} ${e(s.title)}<span class="sim-tag" title="3D space lab">🔭 Space</span></span><a class="badge space-go" href="${e(this.url(s))}">GO</a></li>`
        : `<li class="space-soon"><span>${s.icon} ${e(s.title)}</span><span class="badge locked" title="${e(s.note)}">SOON</span></li>`).join('')}</ul>`;
    }
    return this.SECTIONS.map((s) => s.status === 'working'
      ? `<a class="unit-card space-card" href="${e(this.url(s))}" data-space="${s.id}" style="border-top: 8px solid #7C5CFF">
          <div class="unit-icon">${s.icon}</div><h3>${e(s.title)}</h3><p>${e(s.blurb)}</p>
          <p class="unit-mastery-line">${(s.topics || []).map(e).join(' · ')}</p>
          <span class="btn btn-cyan btn-sm">Launch ▶</span></a>`
      : `<div class="unit-card space-card subject-soon-card space-soon" data-space="${s.id}" style="border-top: 8px dashed #A78BFA" aria-disabled="true">
          <div class="unit-icon">${s.icon}</div><h3>${e(s.title)} <span class="rec-pill">Coming soon</span></h3><p>${e(s.blurb)}</p>
          <p class="muted space-note">${e(s.note)}</p></div>`).join('');
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = SpaceLab;
