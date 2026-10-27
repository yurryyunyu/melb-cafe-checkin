// v6 (adds lazy 3D map): network-first for pages/scripts (with timeout), cache only as offline fallback.
const C = 'melb-cafe-v32', OCR = 'melb-cafe-ocr-v1'; // OCR files (vendor/tesseract, ~7MB) are never precached: cached on first use
const A = ['./', './index.html', './style.css', './app.js', './data.js', './signatures.js', './config.js', './maps.js', './greviews.js', './websites.js', './sketchmap.js', './integrations.js', './map3d.js', './icon.svg', './manifest.webmanifest', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css', './jrpg.js', './jrpg.css', './xuan.js', './xuan.css', './story.js', './story.css', './idle.js', './idle.css', './valley.js', './pixui.js', './shop.js', './music.js', './valley.css', './ranch.css', './foundation.css', './festivals.js', './edu.js', './npc.js', './sca.js', './foundation.js', './beans.js', './pixelmap.js', './img/xuan/b-teahouse.webp', './img/xuan/b-inn.webp', './img/xuan/b-pavilion.webp', './img/xuan/b-shop.webp', './img/xuan/b-water.webp', './img/xuan/b-tower.webp', './img/xuan/hero.webp', './img/xuan/keeper.webp', './img/xuan/p-laobei.webp', './img/xuan/p-laobei-full.webp', './img/xuan/p-che.webp', './img/xuan/p-you.webp', './img/xuan/p-you-full.webp', './img/xuan/p-che-full.webp', './img/xuan/p-jin.webp', './img/xuan/p-jin-full.webp', './img/xuan/idle-icons.webp', './img/xuan/pg-sheet.webp', './img/xuan/paper.webp', './vendor/fonts/fusion-pixel-12-zh_hans.subset.woff2'];
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
  // 古风 painted art (img/xuan/*.webp): cache-first — sprites are precached, area backdrops + title art are cached the first time an area is opened
  if (u.pathname.includes('/img/xuan/')) { e.respondWith(caches.open(C).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()).catch(() => {}); return r; })))); return; }
  e.respondWith(netFirst(e.request, e.request.mode === 'navigate' ? 4000 : 6000));
});
