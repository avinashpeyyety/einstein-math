/* Progress safety net (device-local, no accounts):
 *  1. Mirrors every save into IndexedDB and asks the browser to keep storage persistent.
 *  2. If localStorage is wiped but the mirror survives, restores automatically on next load.
 *  3. Progress report file: download any time, or (Chrome/Edge) auto-save to a file you pick.
 *  4. "Restore from a progress file" puts everything back from a downloaded report.
 * Loaded right after storage.js, before app.js.
 */
(function () {
  'use strict';
  if (typeof Storage === 'undefined' || !Storage.saveStore) return;

  const KEY = 'einstein-math-v2';
  const DB_NAME = 'einstein-math-backup';
  const RESTORED_FLAG = 'em-backup-restored';
  const FILE_NAME = 'einstein-math-progress.json';
  const canPickFile = typeof window.showSaveFilePicker === 'function';

  // ---------- IndexedDB (tiny key/value) ----------
  let dbp = null;
  function db() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('no indexedDB'));
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbp;
  }
  function idb(mode, fn) {
    return db().then(d => new Promise((resolve, reject) => {
      const tx = d.transaction('kv', mode);
      const r = fn(tx.objectStore('kv'));
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => reject(tx.error);
    }));
  }
  const idbGet = k => idb('readonly', s => s.get(k));
  const idbPut = (k, v) => idb('readwrite', s => s.put(v, k));
  const idbDel = k => idb('readwrite', s => s.delete(k));
  const idbKeys = () => idb('readonly', s => s.getAllKeys());

  function hasUsers(raw) {
    try { const s = typeof raw === 'string' ? JSON.parse(raw) : raw; return !!(s && s.users && Object.keys(s.users).length); }
    catch { return false; }
  }

  // ---------- 1. keep storage persistent ----------
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* ignore */ }

  // ---------- 2. auto-restore when localStorage was wiped ----------
  // Only when the key is entirely missing (cleared), never when the user deleted explorers on purpose.
  if (localStorage.getItem(KEY) === null && !sessionStorage.getItem(RESTORED_FLAG)) {
    idbGet('latest').then(snap => {
      if (snap && hasUsers(snap.data) && localStorage.getItem(KEY) === null) {
        localStorage.setItem(KEY, snap.data);
        sessionStorage.setItem(RESTORED_FLAG, String(snap.at || Date.now()));
        location.reload();
      }
    }).catch(() => {});
  }

  // ---------- report content ----------
  function buildReport() {
    const store = Storage.loadStore();
    const payload = Storage.exportAllProfiles(store);
    const explorers = Storage.listUsers(store).map(u => {
      const tracks = Object.entries(u.tracks || {}).map(([tid, tp]) => {
        const lessons = Object.values((tp && tp.lessons) || {});
        return {
          track: tid,
          stars: (tp && tp.stars) || 0,
          lessonsDone: lessons.filter(l => l && l.status === 'done').length,
          mastered: lessons.filter(l => l && l.masteryLevel === 'mastered').length,
          needsReview: lessons.filter(l => l && l.masteryLevel === 'needs_review').length
        };
      });
      return { name: u.displayName, currentTrack: u.trackId, tracks };
    });
    payload.report = {
      title: 'Einstein Math progress report',
      savedAt: new Date().toISOString(),
      howToRestore: 'Open Einstein Math → 💾 Progress → "Restore from a progress file" and pick this file.',
      explorers
    };
    return payload;
  }
  const reportText = () => JSON.stringify(buildReport(), null, 2);

  // ---------- 3a. mirror + auto file save on every save ----------
  let fileHandle = null;
  let filePermission = 'none'; // none | granted | prompt
  let lastMirrorAt = null, lastFileAt = null, mirrorTimer = null;

  idbGet('fileHandle').then(async h => {
    if (!h) return;
    fileHandle = h;
    try { filePermission = (await h.queryPermission({ mode: 'readwrite' })) === 'granted' ? 'granted' : 'prompt'; }
    catch { filePermission = 'prompt'; }
    refreshUi();
  }).catch(() => {});
  idbGet('latest').then(s => { if (s) lastMirrorAt = s.at; refreshUi(); }).catch(() => {});
  idbGet('fileAt').then(t => { if (t) lastFileAt = t; }).catch(() => {});

  async function writeFile() {
    if (!fileHandle || filePermission !== 'granted') return false;
    const w = await fileHandle.createWritable();
    await w.write(reportText());
    await w.close();
    lastFileAt = Date.now();
    idbPut('fileAt', lastFileAt).catch(() => {});
    return true;
  }

  async function mirror() {
    const data = localStorage.getItem(KEY);
    if (data === null) return;
    const at = Date.now();
    try {
      await idbPut('latest', { data, at });
      const day = 'day-' + new Date(at).toISOString().slice(0, 10);
      await idbPut(day, { data, at });
      const days = ((await idbKeys()) || []).filter(k => String(k).startsWith('day-')).sort();
      for (const k of days.slice(0, Math.max(0, days.length - 7))) await idbDel(k);
      lastMirrorAt = at;
    } catch { /* storage unavailable (private mode) */ }
    try { await writeFile(); } catch { filePermission = 'prompt'; }
    refreshUi();
  }

  const origSave = Storage.saveStore.bind(Storage);
  Storage.saveStore = function (store) {
    const r = origSave(store);
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(mirror, 1200);
    return r;
  };
  window.addEventListener('pagehide', () => { if (mirrorTimer) { clearTimeout(mirrorTimer); mirror(); } });
  // First visit after this ships: seed the mirror from what's already saved.
  setTimeout(() => { if (localStorage.getItem(KEY) !== null) mirror(); }, 2500);

  // ---------- 3b/4. actions ----------
  function download() {
    const blob = new Blob([reportText()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = FILE_NAME.replace('.json', '-' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function chooseFile() {
    try {
      const h = await window.showSaveFilePicker({
        suggestedName: FILE_NAME,
        types: [{ description: 'Einstein Math progress', accept: { 'application/json': ['.json'] } }]
      });
      fileHandle = h; filePermission = 'granted';
      await idbPut('fileHandle', h).catch(() => {});
      await writeFile();
    } catch { /* cancelled */ }
    refreshUi();
  }

  async function resumeFile() {
    if (!fileHandle) return chooseFile();
    try {
      const p = await fileHandle.requestPermission({ mode: 'readwrite' });
      filePermission = p === 'granted' ? 'granted' : 'prompt';
      if (filePermission === 'granted') await writeFile();
    } catch { filePermission = 'prompt'; }
    refreshUi();
  }

  async function stopFile() {
    fileHandle = null; filePermission = 'none';
    await idbDel('fileHandle').catch(() => {});
    refreshUi();
  }

  function restoreFromFile(file, statusEl) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = Storage.parseImportPayload(String(reader.result));
        const n = Object.keys(data.users || {}).length;
        const when = (data.report && data.report.savedAt) || data.exportedAt;
        const whenTxt = when ? ' saved ' + new Date(when).toLocaleString() : '';
        const hasLocal = hasUsers(localStorage.getItem(KEY));
        if (hasLocal && !confirm(`Replace the progress on this device with the file's ${n} explorer${n === 1 ? '' : 's'}${whenTxt}?`)) return;
        Storage.replaceAllFromImport(data);
        sessionStorage.setItem(RESTORED_FLAG, String(Date.now()));
        location.reload();
      } catch (err) {
        if (statusEl) statusEl.textContent = 'That file did not work: ' + err.message;
      }
    };
    reader.readAsText(file);
  }

  // ---------- UI ----------
  const ago = t => {
    if (!t) return 'not yet';
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return new Date(t).toLocaleDateString();
  };

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  let modal = null;
  function buildUi() {
    const right = document.querySelector('.top-bar-right');
    if (right && !document.getElementById('btn-backup')) {
      const b = el('<button type="button" class="btn btn-ghost btn-sm" id="btn-backup" title="Save or restore progress">💾 Progress</button>');
      right.insertBefore(b, right.firstChild);
      b.addEventListener('click', openModal);
    }
    modal = el(`
      <div id="backup-modal" class="modal-backdrop hidden">
        <div class="comic-panel modal-panel backup-panel">
          <h2 class="panel-title">Keep progress safe</h2>
          <p class="backup-line">✅ Saved on this device: <strong id="bk-mirror">not yet</strong></p>
          <p class="backup-line" id="bk-file-line"></p>
          <div class="backup-actions">
            <button type="button" class="btn btn-cyan btn-sm" id="bk-download">Download progress report</button>
            <button type="button" class="btn btn-ghost btn-sm" id="bk-file"></button>
            <button type="button" class="btn btn-ghost btn-sm hidden" id="bk-file-stop">Stop auto-save</button>
            <button type="button" class="btn btn-ghost btn-sm" id="bk-restore">Restore from a progress file</button>
            <input type="file" id="bk-restore-input" accept=".json,application/json" class="hidden" />
          </div>
          <p class="backup-status" id="bk-status"></p>
          <p class="privacy-note">Clearing browser data or cookies can erase progress. A progress report file brings everything back on this or any device. Nothing is uploaded.</p>
          <button type="button" class="btn btn-ghost btn-sm" id="bk-close">Close</button>
        </div>
      </div>`);
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modal.querySelector('#bk-close').addEventListener('click', closeModal);
    modal.querySelector('#bk-download').addEventListener('click', () => {
      download(); modal.querySelector('#bk-status').textContent = 'Report downloaded — keep it somewhere safe (Files, Drive, email).';
    });
    modal.querySelector('#bk-file').addEventListener('click', () => (filePermission === 'prompt' ? resumeFile() : chooseFile()));
    modal.querySelector('#bk-file-stop').addEventListener('click', stopFile);
    const input = modal.querySelector('#bk-restore-input');
    modal.querySelector('#bk-restore').addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files[0]) restoreFromFile(input.files[0], modal.querySelector('#bk-status')); input.value = ''; });

    // First-time screen: offer to continue from a file before creating a new explorer.
    const create = document.getElementById('landing-create');
    if (create && !document.getElementById('bk-landing')) {
      const row = el(`<p class="backup-landing" id="bk-landing">Been here before? <button type="button" class="btn btn-ghost btn-sm">Continue from a progress file</button></p>`);
      create.appendChild(row);
      row.querySelector('button').addEventListener('click', () => input.click());
    }

    const restored = sessionStorage.getItem(RESTORED_FLAG);
    if (restored) {
      sessionStorage.removeItem(RESTORED_FLAG);
      toast('Progress restored ✨');
    }
    refreshUi();
  }

  function toast(msg) {
    const t = el(`<div class="backup-toast">${msg}</div>`);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function refreshUi() {
    if (!modal) return;
    modal.querySelector('#bk-mirror').textContent = ago(lastMirrorAt);
    const line = modal.querySelector('#bk-file-line');
    const btn = modal.querySelector('#bk-file');
    const stop = modal.querySelector('#bk-file-stop');
    if (!canPickFile) {
      line.textContent = 'Tip: download a progress report now and then. (Auto-save to a file needs Chrome or Edge.)';
      btn.classList.add('hidden'); stop.classList.add('hidden');
      return;
    }
    if (fileHandle && filePermission === 'granted') {
      line.innerHTML = `📄 Auto-saving to <strong>${fileHandle.name}</strong> · last write ${ago(lastFileAt)}`;
      btn.textContent = 'Change backup file';
      stop.classList.remove('hidden');
    } else if (fileHandle) {
      line.innerHTML = `📄 Backup file <strong>${fileHandle.name}</strong> is paused until you allow it again.`;
      btn.textContent = 'Resume auto-save';
      stop.classList.remove('hidden');
    } else {
      line.textContent = '📄 No backup file yet — pick one and every save is copied there automatically.';
      btn.textContent = 'Auto-save to a file…';
      stop.classList.add('hidden');
    }
  }

  function openModal() { refreshUi(); modal.classList.remove('hidden'); }
  function closeModal() { modal.classList.add('hidden'); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUi);
  else buildUi();

  window.EMBackup = { download, chooseFile, resumeFile, restoreFromFile, mirror, buildReport };
})();
