// v6 (adds lazy 3D map): network-first for pages/scripts (with timeout), cache only as offline fallback.
const C = 'melb-cafe-v10', OCR = 'melb-cafe-ocr-v1'; // OCR files (vendor/tesseract, ~7MB) are never precached: cached on first use
const A = ['./', './index.html', './style.css', './app.js', './data.js', './config.js', './maps.js', './sketchmap.js', './integrations.js', './map3d.js', './icon.svg', './manifest.webmanifest', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css', './jrpg.js', './jrpg.css', './valley.js', './valley.css', './beans.js', './pixelmap.js', './vendor/fonts/fusion-pixel-12-zh_hans.subset.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(A)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== OCR).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
function netFirst(req, ms) {
  return new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    const t = setTimeout(() => fallback().then(r => { if (!done && r) { done = true; resolve(r); } }), ms);
    fetch(req, {cache: 'no-store'}).then(r => {
      if (r && r.ok) { const cl = r.clone(); caches.open(C).then(c => c.put(req, cl)).catch(() => {}); }
      if (!done) { done = true; clearTimeout(t); resolve(r); }
    }).catch(() => fallback().then(r => { if (!done) { done = true; clearTimeout(t); resolve(r || Response.error()); } }));
  });
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // never touch cross-origin (fonts, tiles, APIs)
  if (u.pathname.includes('/vendor/tesseract/')) { e.respondWith(caches.open(OCR).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()).catch(() => {}); return r; })))); return; }
  e.respondWith(netFirst(e.request, e.request.mode === 'navigate' ? 4000 : 6000));
});
