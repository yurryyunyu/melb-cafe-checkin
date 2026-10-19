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
    window.gm_authFailure = () => { console.warn('Google Maps key rejected, falling back to OSM'); MapKit.provider = 'osm'; };
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
        label: o.label ? {text: o.label, fontFamily: 'Caveat, cursive', fontSize: '17px', fontWeight: '700', color: '#222'} : null, zIndex: done ? 1000 : 1});
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
function leafletMap(el, center, zoom) {
  const map = L.map(el, {zoomControl: false}).setView(center, zoom);
  L.control.zoom({position: 'topright'}).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, className: 'base-tiles', attribution: '© OpenStreetMap'}).addTo(map);
  let me = null, ring = null, removed = false; const markers = [];
  const icon = (done, o = {}) => L.divIcon({className: '', html: `<div class="rmk"><span class="num ${done ? 'done' : ''}">${o.no || (done ? '✓' : '·')}</span>${o.label ? `<span class="cafe-label">${String(o.label).replace(/[<>&]/g, '')}</span>` : ''}</div>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14]});
  const zc = () => { el.classList.toggle('zoom-lo', map.getZoom() < 15); };
  map.on('zoomend', zc); zc();
  return {
    addMarker(lat, lng, done, html, o) { const m = L.marker([lat, lng], {icon: icon(done, o), zIndexOffset: done ? 1000 : 0}).addTo(map).bindPopup(html); markers.push({m, lat, lng}); return m; },
    openAt(lat, lng) { const x = markers.find(k => k.lat === lat && k.lng === lng); if (x) x.m.openPopup(); },
    setView(p, z) { if (!removed) map.setView(p, z, {animate: false}); },
    fit(pts) { map.fitBounds(pts, {paddingTopLeft: [30, 60], paddingBottomRight: [30, 20], maxZoom: 15}); },
    showMe(p, radius) {
      if (me) me.remove(); if (ring) ring.remove();
      ring = L.circle(p, {radius, className: 'range-ring', color: '#3aa0ff', weight: 2, fillColor: '#3aa0ff', fillOpacity: .15, interactive: false}).addTo(map);
      me = L.marker(p, {zIndexOffset: 3000, interactive: false, icon: L.divIcon({className: '', html: '<div class="avatar"><div class="avatar-pulse"></div><div class="avatar-body">🧑</div><div class="avatar-shadow"></div></div>', iconSize: [48, 56], iconAnchor: [24, 50]})}).addTo(map);
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
  gmapsLink: c => c.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${encodeURIComponent(c.placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + ', ' + c.address)}`,
};
})();
