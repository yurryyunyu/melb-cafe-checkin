// ⭐ Google reviews. Two layers:
// 1) No key (default): a "看 Google 评价" button that opens Google Maps (official Maps URLs: /maps/search/?api=1&query=…[&query_place_id=…]).
// 2) GOOGLE_MAPS_API_KEY set in config.js: lazily (only when a cafe detail page opens) load the Maps JS Places library (Places API New)
//    and show rating, review count and up to 5 reviews, with Google Maps attribution, author names + links and relative times.
// Storage policy: only the place_id is kept long-term (localStorage). Rating/review content lives in sessionStorage for ≤ 30 min.
(() => {
'use strict';
const KEY = ((window.APP_CONFIG || {}).GOOGLE_MAPS_API_KEY || '').trim();
const PID_KEY = 'mcc.gplace', SS = 'mcc.grv.', TTL = 30 * 60 * 1000;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const safeUrl = u => /^https:\/\//i.test(String(u || '')) ? String(u) : '';
const pidMap = () => { try { return JSON.parse(localStorage.getItem(PID_KEY)) || {}; } catch (e) { return {}; } };
const placeIdOf = c => (c && (c.placeId || pidMap()[c.id])) || '';
function rememberPid(c, pid) { if (!c || !pid || c.placeId) return; const m = pidMap(); if (m[c.id] === pid) return; m[c.id] = pid; try { localStorage.setItem(PID_KEY, JSON.stringify(m)); } catch (e) {} }
// official Maps URLs format; query = name + address, plus query_place_id when we know it
function url(c) { const q = [c.name, c.address].filter(Boolean).join(', '), pid = placeIdOf(c);
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) + (pid ? '&query_place_id=' + encodeURIComponent(pid) : ''); }
const btnHtml = (c, cls = '') => `<a class="gr-btn ${cls}" href="${esc(url(c))}" target="_blank" rel="noopener" data-gr="${esc(c.id)}" aria-label="在 Google 地图看 ${esc(c.name)} 的评价"><i class="gr-star" aria-hidden="true"></i>看 Google 评价</a>`;
// inside a list card (which is itself a link) we can't nest <a>: a span that opens the same URL
const chipHtml = c => `<span class="gr-btn chip-sm" role="link" tabindex="0" data-gr-href="${esc(url(c))}" data-gr="${esc(c.id)}" aria-label="在 Google 地图看 ${esc(c.name)} 的评价"><i class="gr-star" aria-hidden="true"></i>看 Google 评价</span>`;
const openChip = el => { const a = document.createElement('a'); a.href = el.dataset.grHref; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }; // new tab, keeps the app open
document.addEventListener('click', e => { const s = e.target.closest('[data-gr-href]'); if (!s) return; e.preventDefault(); e.stopPropagation(); openChip(s); }, true);
document.addEventListener('keydown', e => { const s = e.target.closest && e.target.closest('[data-gr-href]'); if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openChip(s); } });

// ---------- API layer (only with a key) ----------
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const ssGet = pid => { try { const o = JSON.parse(sessionStorage.getItem(SS + pid)); return o && Date.now() - o.t < TTL ? o.d : null; } catch (e) { return null; } };
const ssSet = (pid, d) => { try { sessionStorage.setItem(SS + pid, JSON.stringify({t: Date.now(), d})); } catch (e) {} };
async function lib() { if (!KEY || !window.MapKit || !MapKit.loadGoogle) throw new Error('nokey');
  if (!(await MapKit.loadGoogle()) || window.__gmAuthFailed) throw new Error('auth');
  const L = await withTimeout(google.maps.importLibrary('places'), 10000); if (!L || !L.Place) throw new Error('places'); return L; }
async function fetchReviews(c) {
  let pid = placeIdOf(c); const hit = pid && ssGet(pid); if (hit) return hit;
  const {Place} = await lib(); if (window.__gmAuthFailed) throw new Error('auth');
  if (!pid) { const r = await withTimeout(Place.searchByText({textQuery: [c.name, c.address].filter(Boolean).join(' '), fields: ['id'], locationBias: c.lat ? {lat: c.lat, lng: c.lng} : undefined, maxResultCount: 1, language: 'zh-CN', region: 'au'}), 10000);
    const p = r && r.places && r.places[0]; if (!p || !p.id) throw new Error('notfound'); pid = p.id; rememberPid(c, pid); }
  const place = new Place({id: pid, requestedLanguage: 'zh-CN'});
  await withTimeout(place.fetchFields({fields: ['displayName', 'rating', 'userRatingCount', 'reviews', 'googleMapsURI']}), 10000);
  if (window.__gmAuthFailed) throw new Error('auth');
  const d = {pid, name: place.displayName || c.name, rating: place.rating == null ? null : +place.rating, count: place.userRatingCount || 0, mapsUrl: safeUrl(place.googleMapsURI),
    reviews: (place.reviews || []).slice(0, 5).map(r => { const a = r.authorAttribution || {}; return {author: a.displayName || '匿名用户', authorUrl: safeUrl(a.uri), photo: safeUrl(a.photoURI), rating: r.rating == null ? null : +r.rating, when: r.relativePublishTimeDescription || '', text: String(r.text || r.originalText || '')}; })};
  ssSet(pid, d); return d; }
const starsHtml = n => { const v = Math.max(0, Math.min(5, +n || 0)); return `<span class="gr-stars" aria-label="${v.toFixed(1)} 星">${Array.from({length: 5}, (_, i) => `<i class="${v >= i + .75 ? 'on' : v >= i + .25 ? 'half' : ''}"></i>`).join('')}</span>`; };
function panelHtml(d, c) {
  const more = d.mapsUrl || url(c), n = d.count ? d.count.toLocaleString('en-AU') : '0';
  return `<div class="vwin jwin gr-panel" id="grPanel"><div class="gr-head"><b>Google 评价</b>${d.rating != null ? `<span class="gr-score">${d.rating.toFixed(1)}</span>${starsHtml(d.rating)}` : '<span class="hint">暂无评分</span>'}<small>${n} 条评价</small></div>
    ${d.reviews.length ? d.reviews.map(r => `<div class="gr-rev"><div class="gr-rtop">${r.photo ? `<img class="gr-ava" src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : '<span class="gr-ava none"></span>'}
      ${r.authorUrl ? `<a class="gr-author" href="${esc(r.authorUrl)}" target="_blank" rel="noopener">${esc(r.author)}</a>` : `<span class="gr-author">${esc(r.author)}</span>`}${r.rating != null ? starsHtml(r.rating) : ''}<span class="gr-when">${esc(r.when)}</span></div>
      ${r.text ? `<div class="gr-text">${esc(r.text)}</div>` : ''}</div>`).join('') : '<div class="hint">还没有文字评价</div>'}
    <div class="gr-foot"><a href="${esc(more)}" target="_blank" rel="noopener">在 Google 地图看全部评价 ›</a><span class="gr-attr" translate="no">Google Maps</span></div></div>`; }
const state = {calls: 0, last: null};
async function mount(box, c) {
  if (!box || !c) return; if (!KEY) { state.last = 'nokey'; return; }
  state.calls++; box.innerHTML = '<div class="gr-loading hint">⏳ 正在读取 Google 评价…</div>';
  try { const d = await fetchReviews(c); if (!box.isConnected) return; box.innerHTML = panelHtml(d, c); state.last = 'ok';
    box.querySelectorAll('.gr-text').forEach(t => { const lh = parseFloat(getComputedStyle(t).lineHeight) || 19; if (t.scrollHeight > lh * 4.5) { t.classList.add('clip'); t.title = '点一下展开'; t.onclick = () => t.classList.toggle('open'); } }); }
  catch (e) { console.warn('Google reviews unavailable:', e && e.message); state.last = 'fail:' + (e && e.message); if (box.isConnected) box.innerHTML = `<div class="gr-fail hint">暂时读不到 Google 评价（key 无效、额度用完或网络问题）· 点上面的按钮去 Google 地图看</div>`; } }
window.GReviews = {hasKey: !!KEY, url, btnHtml, chipHtml, mount, placeIdOf, starsHtml, get state() { return state; }};
})();
