// Map provider abstraction: Google Maps JS API when a key is configured, Leaflet/OSM otherwise.
(() => {
'use strict';
const KEY = ((window.APP_CONFIG || {}).GOOGLE_MAPS_API_KEY || '').trim();
const MAP_ID = ((window.APP_CONFIG || {}).GOOGLE_MAP_ID || '').trim(); // optional cloud-based map style
const AVATAR_URL = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56"><ellipse cx="24" cy="52" rx="12" ry="3.5" fill="#000" opacity=".25"/><circle cx="24" cy="24" r="21" fill="#3aa0ff" stroke="#fff" stroke-width="4"/><text x="24" y="32" font-size="22" text-anchor="middle">🧑</text></svg>');
let gPromise = null;
function loadGoogle() {
  if (!KEY) return Promise.resolve(false);
  if (gPromise) return gPromise;
  gPromise = new Promise(res => {
    window.__gmReady = () => res(true);
    window.gm_authFailure = () => { console.warn('Google Maps key rejected, falling back to OSM'); window.__gmAuthFailed = true; MapKit.provider = 'osm'; };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&libraries=places&language=zh-CN&region=AU&loading=async&callback=__gmReady`;
    s.async = true; s.onerror = () => res(false);
    document.head.appendChild(s);
    setTimeout(() => res(!!(window.google && google.maps && google.maps.Map)), 10000);
  });
  return gPromise;
}
// Game-world style for Google Maps (used when no cloud mapId is set)
const GAME_STYLE = [ // sketch/paper style: paper background, slate-blue roads, no POIs/labels clutter
  {elementType:'geometry',stylers:[{color:'#f4f1ea'}]},
  {elementType:'labels',stylers:[{visibility:'off'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#8fa5b8'}]},
  {featureType:'road.local',elementType:'geometry',stylers:[{color:'#b9c8d4'}]},
  {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#6f879c'},{weight:.6}]},
  {featureType:'road.arterial',elementType:'labels.text',stylers:[{visibility:'on'}]},
  {featureType:'road.highway',elementType:'labels.text',stylers:[{visibility:'on'}]},
  {featureType:'road',elementType:'labels.text.fill',stylers:[{color:'#ffffff'}]},
  {featureType:'road',elementType:'labels.text.stroke',stylers:[{color:'#6f879c'},{weight:2}]},
  {featureType:'poi',stylers:[{visibility:'off'}]},
  {featureType:'transit',stylers:[{visibility:'off'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#dfe6ea'}]},
  {featureType:'landscape.natural',elementType:'geometry',stylers:[{color:'#efebe0'}]},
  {featureType:'administrative',stylers:[{visibility:'off'}]}
];
const pinSvg = (done, no) => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="13" fill="${done ? '#ef6f8f' : '#f7f4ec'}" stroke="#c94a6b" stroke-width="2.4"/><text x="18" y="23" font-size="15" font-family="Caveat,cursive" font-weight="700" text-anchor="middle" fill="${done ? '#fff' : '#c94a6b'}">${no || (done ? '✓' : '')}</text></svg>`);

function googleMap(el, center, zoom) {
  const map = new google.maps.Map(el, {center: {lat: center[0], lng: center[1]}, zoom, disableDefaultUI: true, zoomControl: true, clickableIcons: false, gestureHandling: 'greedy', ...(MAP_ID ? {mapId: MAP_ID} : {styles: GAME_STYLE})});
  const iw = new google.maps.InfoWindow();
  let me = null, ring = null; const markers = [];
  return {
    addMarker(lat, lng, done, html, o = {}) {
      const m = new google.maps.Marker({position: {lat, lng}, map, icon: {url: pinSvg(done, o.no), scaledSize: new google.maps.Size(36, 36), anchor: new google.maps.Point(18, 18), labelOrigin: new google.maps.Point(18, 44)},
        label: o.label ? {text: o.label, fontFamily: 'Caveat, cursive', fontSize: '17px', fontWeight: '700', color: '#222'} : null, zIndex: o.closed ? 0 : done ? 1000 : 1, opacity: o.closed ? 0.4 : 1});
      m.addListener('click', () => { iw.setContent(html); iw.open({map, anchor: m}); });
      markers.push({m, lat, lng, html}); return m;
    },
    openAt(lat, lng) { const x = markers.find(k => k.lat === lat && k.lng === lng); if (x) { iw.setContent(x.html); iw.open({map, anchor: x.m}); } },
    setView(p, z) { map.setCenter({lat: p[0], lng: p[1]}); map.setZoom(z); },
    fit(pts) { const b = new google.maps.LatLngBounds(); pts.forEach(p => b.extend({lat: p[0], lng: p[1]})); map.fitBounds(b, 40); google.maps.event.addListenerOnce(map, 'idle', () => map.getZoom() > 15 && map.setZoom(15)); },
    showMe(p, radius) {
      if (me) me.setMap(null); if (ring) ring.setMap(null);
      ring = new google.maps.Circle({map, center: {lat: p[0], lng: p[1]}, radius, strokeColor: '#3aa0ff', strokeOpacity: .9, strokeWeight: 2, fillColor: '#3aa0ff', fillOpacity: .15, clickable: false});
      let t = 0; clearInterval(this._pulse); this._pulse = setInterval(() => { t = (t + 1) % 30; ring && ring.setOptions({fillOpacity: .22 - t / 200, radius: radius * (0.85 + t / 200)}); }, 60);
      me = new google.maps.Marker({position: {lat: p[0], lng: p[1]}, map, zIndex: 3000, icon: {url: AVATAR_URL, scaledSize: new google.maps.Size(48, 56), anchor: new google.maps.Point(24, 52)}});
    },
    resize() {}, remove() { clearInterval(this._pulse); markers.forEach(k => k.m.setMap(null)); if (me) me.setMap(null); if (ring) ring.setMap(null); el.innerHTML = ''; }
  };
}
// 🎨 valley skin: the same OSM tiles, pixelated + palette-quantized on a canvas in the browser (no API key, no extra requests).
// Each tile is fetched exactly once by the normal Leaflet grid (no prefetch); if CORS ever blocks pixel access we show the plain tinted tile.
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
const isValley = () => document.documentElement.dataset.skin === 'valley' && document.documentElement.dataset.theme === 'jrpg';
// OSM carto key colours → valley palette [main, alt] (alt = 1-px texture variant)
const PXPAL = [
  [[242, 239, 233], [[150, 200, 96], [140, 190, 88]]], [[224, 223, 223], [[160, 204, 104], [150, 196, 96]]], // land / residential → grass
  [[217, 208, 201], [[214, 160, 106], [198, 146, 94]]], [[196, 182, 171], [[150, 98, 58], [150, 98, 58]]], // buildings → tan roofs, outline → brown
  [[255, 255, 255], [[246, 228, 178], [240, 220, 168]]], [[247, 250, 191], [[246, 228, 178], [240, 220, 168]]], // minor roads → cream path
  [[252, 214, 164], [[214, 196, 160], [206, 188, 150]]], [[249, 178, 156], [[196, 180, 150], [188, 172, 142]]], [[232, 146, 162], [[176, 162, 140], [168, 154, 132]]], // primary/trunk/motorway → stone
  [[200, 250, 204], [[104, 170, 70], [96, 160, 64]]], [[205, 235, 176], [[118, 182, 76], [108, 172, 70]]], [[173, 209, 158], [[72, 138, 56], [64, 128, 50]]], [[170, 224, 203], [[96, 168, 92], [88, 160, 86]]], // parks / grass / forest / pitch
  [[170, 211, 223], [[79, 162, 216], [70, 150, 206]]], // water
  [[242, 218, 217], [[226, 176, 120], [218, 168, 112]]], [[255, 214, 209], [[232, 170, 128], [224, 162, 120]]], [[235, 219, 232], [[196, 168, 150], [188, 160, 142]]], [[255, 255, 229], [[236, 220, 160], [230, 212, 150]]], // commercial/retail/industrial/school
  [[250, 128, 114], [[214, 110, 80], [214, 110, 80]]], [[112, 112, 112], [[110, 96, 86], [110, 96, 86]]], [[187, 187, 187], [[176, 162, 140], [168, 154, 132]]], // footway / rail / grey
  [[0, 0, 0], [[58, 36, 20], [58, 36, 20]]], [[80, 80, 80], [[74, 50, 30], [74, 50, 30]]]]; // label text → dark brown
const pxCache = new Map();
function quantize(d) { for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2], k = (r << 16) | (g << 8) | b; let out = pxCache.get(k);
  if (!out) { let best = 0, bd = 1e9; for (let j = 0; j < PXPAL.length; j++) { const c = PXPAL[j][0], dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } } out = PXPAL[best][1]; if (pxCache.size < 60000) pxCache.set(k, out); }
  const p = (i >> 2), x = p & 127, y = p >> 7, c = out[((x * 7 + y * 13) ^ (x >> 1)) % 5 === 0 ? 1 : 0]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; } }
const pxStats = window.__pxTiles = {ok: 0, fallback: 0};
const PixelTiles = window.L && L.GridLayer.extend({
  createTile(coords, done) {
    const tile = document.createElement('div'); tile.className = 'px-tile'; const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
    const fallback = () => { const f = new Image(); f.className = 'px-fallback'; f.alt = ''; f.onload = () => done(null, tile); f.onerror = () => done(new Error('tile'), tile); f.src = img.src; tile.appendChild(f); pxStats.fallback++; tile.classList.add('fallback'); const m = this._map && this._map.getContainer(); if (m) m.classList.remove('px-tiles'); }; // back to the tinted look
    img.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d', {willReadFrequently: true}); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 128, 128);
        const id = g.getImageData(0, 0, 128, 128); quantize(id.data); g.putImageData(id, 0, 0); tile.appendChild(c); pxStats.ok++; done(null, tile); } catch (e) { fallback(); } };
    img.onerror = () => { if (!img._retry) { img._retry = 1; img.removeAttribute('crossorigin'); img.crossOrigin = null; fallback(); } };
    img.src = L.Util.template(OSM_URL, {...coords, z: this._getZoomForUrl ? this._getZoomForUrl() : coords.z}); return tile; }});
function leafletMap(el, center, zoom) {
  const map = L.map(el, {zoomControl: false}).setView(center, zoom);
  L.control.zoom({position: 'topright'}).addTo(map);
  const px = isValley() && PixelTiles; el.classList.toggle('px-tiles', !!px);
  (px ? new PixelTiles({maxZoom: 19, className: 'base-tiles px-layer', attribution: OSM_ATTR}) : L.tileLayer(OSM_URL, {maxZoom: 19, className: 'base-tiles', attribution: OSM_ATTR})).addTo(map);
  let me = null, ring = null, removed = false; const markers = [];
  const shopImg = (done, o) => px && o.id && window.PixUI ? `<img class="rmk-shop" src="${PixUI.shopUrl(o.id, done, !!o.closed)}" alt="">` : '';
  const icon = (done, o = {}) => L.divIcon({className: '', html: `<div class="rmk${o.closed ? ' closed' : ''}${shopImg(done, o) ? ' px' : ''}">${shopImg(done, o)}<span class="num ${done ? 'done' : ''}">${o.no || (done ? '✓' : '·')}</span>${o.label ? `<span class="cafe-label">${String(o.label).replace(/[<>&]/g, '')}</span>` : ''}</div>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14]});
  const heroImg = () => { if (!px || !window.Valley) return '🧑'; try { const c = document.createElement('canvas'); c.width = c.height = 16; Valley.drawHero(c, 'down', 0); return `<img class="px-me" src="${c.toDataURL()}" alt="">`; } catch (e) { return '🧑'; } };
  const zc = () => { el.classList.toggle('zoom-lo', map.getZoom() < 15); };
  map.on('zoomend', zc); zc();
  return {
    addMarker(lat, lng, done, html, o) { const m = L.marker([lat, lng], {icon: icon(done, o), zIndexOffset: o && o.closed ? -500 : done ? 1000 : 0}).addTo(map).bindPopup(html); markers.push({m, lat, lng}); return m; },
    openAt(lat, lng) { const x = markers.find(k => k.lat === lat && k.lng === lng); if (x) x.m.openPopup(); },
    setView(p, z) { if (!removed) map.setView(p, z, {animate: false}); },
    fit(pts) { map.fitBounds(pts, {paddingTopLeft: [30, 60], paddingBottomRight: [30, 20], maxZoom: 15}); },
    showMe(p, radius) {
      if (me) me.remove(); if (ring) ring.remove();
      ring = L.circle(p, {radius, className: 'range-ring', color: '#3aa0ff', weight: 2, fillColor: '#3aa0ff', fillOpacity: .15, interactive: false}).addTo(map);
      me = L.marker(p, {zIndexOffset: 3000, interactive: false, icon: L.divIcon({className: '', html: `<div class="avatar"><div class="avatar-pulse"></div><div class="avatar-body">${heroImg()}</div><div class="avatar-shadow"></div></div>`, iconSize: [48, 56], iconAnchor: [24, 50]})}).addTo(map);
    },
    resize() { setTimeout(() => { if (!removed) map.invalidateSize(); }, 50); }, remove() { removed = true; try { map.stop(); map.off(); map.remove(); } catch (e) {} }
  };
}

// Places API (New): nearby cafes around a point. Returns [] when no key / failure.
async function nearbyCafes(pos, radius = 300) {
  if (!(await loadGoogle()) || MapKit.provider !== 'google') return [];
  try {
    const {Place} = await google.maps.importLibrary('places');
    const {places} = await Place.searchNearby({
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
      locationRestriction: {center: {lat: pos[0], lng: pos[1]}, radius},
      includedPrimaryTypes: ['cafe', 'coffee_shop'], maxResultCount: 10, rankPreference: 'DISTANCE', language: 'en', region: 'au'});
    return (places || []).map(p => {
      const loc = (p.addressComponents || []).find(c => (c.types || []).includes('locality'));
      return {placeId: p.id, name: p.displayName, address: p.formattedAddress || '', suburb: loc ? (loc.longText || loc.long_name) : 'Melbourne', lat: p.location.lat(), lng: p.location.lng()};
    });
  } catch (e) { console.warn('Places nearby failed', e); return []; }
}

window.MapKit = {
  provider: KEY ? 'google' : 'osm',
  hasKey: !!KEY,
  async create(el, center, zoom) {
    if (KEY && MapKit.provider === 'google' && await loadGoogle() && MapKit.provider === 'google') return googleMap(el, center, zoom);
    MapKit.provider = 'osm';
    return leafletMap(el, center, zoom);
  },
  nearbyCafes,
  loadGoogle, // lazy: only called when a Google map or the Google review panel is actually needed
  gmapsLink: c => window.GReviews ? GReviews.url(c) : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([c.name, c.address].filter(Boolean).join(', ')) + (c.placeId ? '&query_place_id=' + encodeURIComponent(c.placeId) : ''),
};
})();
