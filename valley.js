// 🌾 Cozy valley theme kit (farm-life pixel RPG feel). Everything here is original art drawn in code.
// Melbourne clock → season/day-night, seasonal tiles, cute shop buildings, procedural barista villagers,
// item sprites with quality stars, critters & weather for the map, harvest popup and end-of-day summary.
(() => {
'use strict';
const J = window.JRPG; if (!J) return; // needs the pixel kit (rng/hash/SFX/say)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {rng, hash} = J;
const pick = (R, a) => a[(R() * a.length) | 0];

// ---------- pixel buffer with automatic outline ----------
function Pix(w, h) {
  const a = new Array(w * h).fill(null);
  const P = {w, h, a,
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : null; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) P.set(x + i, y + j, c); },
    ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) P.set(x, y, c); } },
    outline(c) { const b = a.slice(), solid = v => v && v.slice(0, 4) !== 'rgba';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (b[y * w + x]) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && solid(b[Y * w + X]); })) a[y * w + x] = c; } },
    canvas() { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      for (let i = 0; i < a.length; i++) if (a[i]) { g.fillStyle = a[i]; g.fillRect(i % w, (i / w) | 0, 1, 1); } return cv; }};
  return P;
}
const OUT = '#3a2414';

// ---------- 🕰️ Melbourne clock → season & time of day ----------
const SEASON = {
  spring: {zh: '春', icon: '🌸', from: 9}, summer: {zh: '夏', icon: '☀️', from: 12},
  autumn: {zh: '秋', icon: '🍂', from: 3}, winter: {zh: '冬', icon: '❄️', from: 6}};
const WK = {Sun: '周日', Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六'};
function seasonOf(m) { return m >= 9 && m <= 11 ? 'spring' : (m === 12 || m <= 2) ? 'summer' : m <= 5 ? 'autumn' : 'winter'; }
function clock() {
  const d = window.__valleyNow != null ? new Date(window.__valleyNow) : new Date();
  let p = {};
  try { new Intl.DateTimeFormat('en-US', {timeZone: 'Australia/Melbourne', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23', weekday: 'short'})
    .formatToParts(d).forEach(x => { p[x.type] = x.value; }); if (!p.year) throw 0; }
  catch (e) { p = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}; }
  const y = +p.year, m = +p.month, day = +p.day, h = (+p.hour) % 24, mi = +p.minute, season = seasonOf(m), S = SEASON[season];
  const sy = season === 'summer' && m <= 2 ? y - 1 : y, dayOf = Math.floor((Date.UTC(y, m - 1, day) - Date.UTC(sy, S.from - 1, 1)) / 864e5) + 1;
  const phase = h >= 19 || h < 5 ? 'night' : h >= 17 ? 'dusk' : h < 7 ? 'dawn' : 'day';
  return {y, m, day, h, mi, season, zh: S.zh, icon: S.icon, dayOf, phase, wk: WK[p.weekday] || '', hhmm: String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'),
    lit: phase === 'night' || phase === 'dusk', sky: phase === 'night' ? '🌙' : phase === 'dusk' ? '🌇' : phase === 'dawn' ? '🌅' : '☀️'};
}

// ---------- seasonal palette ----------
const PALS = {
  spring: {grass: ['#7ccf5a', '#68bb48', '#95de70', '#57a83c'], leaf: ['#f6b3cd', '#e98fb3', '#ffd9e7', '#c76a91'], fl: ['#ff9ec4', '#fff3f7', '#ffd85e', '#b58bff'], ground: '#5aa83c'},
  summer: {grass: ['#5fbf3f', '#4ea833', '#7bd458', '#3f8f2b'], leaf: ['#4fae3c', '#3b912e', '#7acf5a', '#2b6e23'], fl: ['#ffd23f', '#ff7b54', '#ffffff', '#ff5e8a'], ground: '#3f8f2b'},
  autumn: {grass: ['#a9b84b', '#94a53f', '#c4c95d', '#7e8e35'], leaf: ['#f08a2c', '#d6641e', '#ffb648', '#a5431a'], fl: ['#e2552a', '#f2a03d', '#9a4ab0', '#ffd96a'], ground: '#7e8e35'},
  winter: {grass: ['#eef4fa', '#dde8f2', '#ffffff', '#c3d3e2'], leaf: null, fl: ['#d33a3a', '#2f7a3a', '#ffffff', '#b02a2a'], ground: '#c3d3e2'}};

const tileCache = {};
function tiles(season = 'spring', lit = false) {
  const key = season + lit; if (tileCache[key]) return tileCache[key];
  const S = PALS[season] || PALS.spring, W = season === 'winter', T = {};
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g, (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }]; };
  const tile = fn => { const [c, g, px] = mk(); fn(px, g); return c; };
  const grass = (px, seed) => { const r = rng(seed * 131 + 7); px(0, 0, 16, 16, S.grass[0]);
    for (let i = 0; i < 18; i++) px((r() * 16) | 0, (r() * 16) | 0, 1, 1, r() < .5 ? S.grass[1] : S.grass[2]);
    for (let i = 0; i < 3; i++) { const x = (r() * 13) | 0, y = (r() * 12 + 3) | 0; if (W) { px(x, y, 1, 1, '#9fb8a0'); px(x + 1, y - 1, 1, 1, '#9fb8a0'); } else { px(x, y, 1, 2, S.grass[3]); px(x + 2, y, 1, 2, S.grass[3]); px(x + 1, y - 1, 1, 2, S.grass[3]); } }
    if (season === 'spring' && r() < .5) px((r() * 15) | 0, (r() * 15) | 0, 1, 1, '#ffc1d8');
    if (season === 'autumn') for (let i = 0; i < 2; i++) px((r() * 15) | 0, (r() * 15) | 0, 2, 1, r() < .5 ? '#e0742a' : '#c9501e'); };
  T.grass = [1, 2, 3, 4].map(s => tile(px => grass(px, s)));
  T.flowers = [5, 6].map(s => tile(px => { grass(px, s); const r = rng(s * 17);
    for (let i = 0; i < 5; i++) { const x = 1 + (r() * 13) | 0, y = 2 + (r() * 11) | 0, col = S.fl[i % 4];
      if (W) { px(x, y + 1, 3, 2, '#2f6a3a'); px(x + 1, y + 1, 1, 1, '#d33a3a'); px(x, y, 3, 1, '#fff'); }
      else { px(x, y + 2, 1, 2, S.grass[3]); px(x - 1 + 1, y, 1, 1, col); px(x - 1, y + 1, 3, 1, col); px(x, y + 1, 1, 1, season === 'summer' ? '#8a5a20' : '#fff3a0'); } } }));
  T.bush = tile(px => { grass(px, 8); px(2, 13, 12, 2, 'rgba(30,50,10,.3)');
    const c = W ? ['#5f8a6a', '#4a7356', '#fff'] : season === 'autumn' ? ['#c9602a', '#9e4420', '#f0a050'] : ['#3f9a3a', '#2e7a2c', '#6cc458'];
    px(2, 6, 12, 8, OUT); px(3, 5, 10, 10, OUT); px(3, 6, 10, 7, c[0]); px(4, 5, 8, 9, c[0]); px(4, 6, 4, 2, c[2]); px(9, 10, 3, 2, c[1]); px(4, 11, 4, 1, c[1]);
    if (season === 'spring') { px(5, 9, 1, 1, '#ff9ec4'); px(10, 7, 1, 1, '#fff'); px(8, 12, 1, 1, '#ff9ec4'); }
    if (W) { px(4, 5, 8, 2, '#fff'); px(3, 6, 2, 1, '#fff'); } });
  T.trunk = tile(px => { grass(px, 11); px(3, 13, 10, 2, 'rgba(30,50,10,.32)'); px(6, 5, 4, 10, OUT); px(7, 5, 2, 10, '#8a5a33'); px(7, 6, 1, 8, '#a8743f'); px(5, 14, 6, 1, OUT); });
  // canopy (drawn on the swaying layer, 16x16 transparent)
  T.canopy = (() => { const P = Pix(16, 16);
    if (!S.leaf) { // bare winter tree with snow
      [[8, 15, 8, 6], [8, 9, 4, 4], [8, 9, 12, 3], [8, 6, 6, 1], [10, 5, 11, 1]].forEach(([x0, y0, x1, y1]) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) P.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, '#7a5232'); });
      P.rect(7, 9, 2, 7, '#7a5232'); [[3, 3], [5, 0], [11, 2], [12, 2], [6, 5], [10, 4], [4, 4]].forEach(([x, y]) => P.set(x, y, '#ffffff')); P.outline('#4a3020'); return P.canvas(); }
    P.ell(8, 6.5, 7, 6, S.leaf[0]); P.ell(5, 8.5, 4, 3.5, S.leaf[0]); P.ell(11, 8.5, 4, 3.5, S.leaf[0]);
    P.ell(10.5, 9.5, 4, 2.6, S.leaf[1]); P.ell(5.5, 4.5, 2.6, 2, S.leaf[2]);
    const r = rng(season.length * 9); for (let i = 0; i < 7; i++) P.set(2 + r() * 12, 2 + r() * 9, i % 2 ? S.leaf[3] : S.leaf[2]);
    if (season === 'spring') [[4, 7], [9, 4], [12, 8], [7, 10]].forEach(([x, y]) => P.set(x, y, '#fff'));
    if (season === 'summer') [[5, 9], [10, 6]].forEach(([x, y]) => P.set(x, y, '#e8403a')); // little fruit
    P.outline(season === 'autumn' ? '#5a2a10' : season === 'spring' ? '#7a3a55' : '#1f4a1a'); return P.canvas(); })();
  T.pine = tile(px => { grass(px, 12); px(3, 14, 10, 2, 'rgba(30,50,10,.32)'); px(7, 12, 2, 3, '#7a5232');
    const g1 = '#2f6e3a', g2 = '#3f8a46', g3 = '#5aa860';
    [[1, 3, 9], [4, 5, 7], [7, 7, 5]].forEach(([y, hw, n]) => { for (let i = 0; i < n; i++) px(8 - Math.min(hw, i + 1), y + i, Math.min(hw, i + 1) * 2, 1, i === n - 1 ? g1 : g2); });
    px(6, 2, 2, 2, g3); px(5, 6, 2, 1, g3); px(4, 10, 2, 1, g3);
    if (W) { px(7, 1, 2, 2, '#fff'); px(4, 6, 3, 1, '#fff'); px(9, 7, 3, 1, '#fff'); px(3, 11, 3, 1, '#fff'); px(10, 12, 3, 1, '#fff'); } });
  T.dirt = tile(px => { const r = rng(21); px(0, 0, 16, 16, W ? '#e9e2da' : '#dcae6e'); for (let i = 0; i < 18; i++) px((r() * 16) | 0, (r() * 16) | 0, 1, 1, W ? (r() < .6 ? '#c8b8a6' : '#ffffff') : (r() < .6 ? '#c8955a' : '#ecc68c'));
    px(3, 4, 2, 1, W ? '#b8a690' : '#b88850'); px(10, 11, 2, 1, W ? '#b8a690' : '#b88850'); });
  T.stone = tile(px => { px(0, 0, 16, 16, '#8f826e'); const r = rng(31);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -3 : 0; x < 16; x += 6) { const c = r() < .5 ? '#cdbfa6' : '#bdae94'; px(x + 1, y + 1, 5, 3, c); px(x + 2, y, 3, 1, c); px(x + 2, y + 1, 3, 1, '#e2d6c0'); px(x + 1, y + 3, 5, 1, '#a39279'); if (W && r() < .45) px(x + 2, y + 1, 2, 1, '#fff'); } });
  T.water = [0, 1].map(f => tile(px => { if (W) { px(0, 0, 16, 16, '#cfe8f3'); px(2 + f * 3, 4, 5, 1, '#a9d0e2'); px(6, 5, 1, 3, '#a9d0e2'); px(9, 11, 4, 1, '#a9d0e2'); px(4, 9, 1, 1, '#fff'); px(12, 3, 1, 1, '#fff'); return; }
    px(0, 0, 16, 16, '#4fa2d8'); for (let y = 2; y < 16; y += 5) for (let x = (y + f * 4) % 8; x < 16; x += 8) { px(x, y, 3, 1, '#8fd2f2'); px(x + 3, y + 1, 2, 1, '#73bde8'); }
    if (f && season !== 'autumn') { px(9, 9, 4, 3, '#4f9a3a'); px(10, 8, 3, 1, '#4f9a3a'); px(11, 10, 1, 1, '#4fa2d8'); if (season === 'spring' || season === 'summer') px(10, 9, 1, 1, '#ffb3d0'); }
    if (f && season === 'autumn') { px(4, 6, 2, 1, '#e0742a'); px(11, 12, 2, 1, '#c9501e'); } }));
  const ROOF = [['#c9503c', '#a03a2c'], ['#3f7fbf', '#2f5f99'], ['#5f9e4a', '#477a36'], ['#8a5ab8', '#6a4090'], ['#d98a2b', '#b06a1a'], ['#c95a8a', '#a0406a']];
  T.house = ROOF.map(([rf, rd], i) => tile(px => { grass(px, 14 + i); px(1, 15, 14, 1, 'rgba(30,50,10,.3)');
    px(1, 2, 14, 1, OUT); for (let y = 3; y < 8; y++) px(0 + (y < 4 ? 1 : 0), y, 16 - (y < 4 ? 2 : 0), 1, y % 2 ? rf : rd); px(0, 8, 16, 1, OUT);
    if (W) { px(1, 3, 14, 2, '#fff'); px(3, 5, 1, 1, '#fff'); px(10, 5, 1, 1, '#fff'); }
    px(2, 9, 12, 6, '#e8c999'); px(2, 11, 12, 1, '#d4b07a'); px(1, 9, 1, 6, OUT); px(14, 9, 1, 6, OUT); px(1, 14, 14, 1, OUT);
    px(7, 10, 3, 4, '#7a4a25'); const win = lit && (i % 3 !== 1) ? '#ffd56b' : lit ? '#3d4a6e' : '#9fd4ea'; px(3, 10, 3, 2, win); px(11, 10, 2, 2, win); px(3, 12, 3, 1, '#6b3f1d'); }));
  T.fence = tile(px => { grass(px, 15); px(0, 7, 16, 2, OUT); px(0, 11, 16, 2, OUT); px(0, 7, 16, 1, '#c98f5a'); px(0, 11, 16, 1, '#c98f5a');
    for (let x = 1; x < 16; x += 7) { px(x - 1, 4, 4, 11, OUT); px(x, 5, 2, 9, '#d9a066'); px(x, 5, 2, 1, '#e8bc84'); if (W) px(x - 1, 3, 4, 2, '#fff'); } });
  T.crop = tile(px => { px(0, 0, 16, 16, W ? '#a07850' : '#8a5a33'); for (let y = 1; y < 16; y += 4) { px(0, y + 2, 16, 1, W ? '#8a6440' : '#6e4526'); px(0, y, 16, 1, W ? '#b8926a' : '#a06c40'); }
    for (let y = 1; y < 16; y += 4) for (let x = 2; x < 16; x += 5) {
      if (season === 'spring') { px(x, y, 1, 2, '#6cc24a'); px(x - 1, y, 1, 1, '#8ade62'); px(x + 1, y - 1, 1, 1, '#8ade62'); }
      else if (season === 'summer') { px(x, y - 1, 1, 3, '#3f8f2b'); px(x - 1, y, 1, 1, '#5fbf3f'); px(x + 1, y - 1, 1, 2, '#5fbf3f'); px(x + 1, y, 1, 1, '#e8403a'); }
      else if (season === 'autumn') { px(x - 1, y - 1, 3, 2, '#e8862a'); px(x, y - 1, 1, 2, '#c8661a'); px(x, y - 2, 1, 1, '#4f7a2a'); }
      else { px(x, y, 2, 1, '#fff'); } } });
  T.planter = tile(px => { grass(px, 16); px(1, 14, 14, 2, 'rgba(30,50,10,.3)');
    for (let x = 3; x < 13; x += 3) { const col = S.fl[(x / 3) % 4 | 0]; if (W) { px(x, 6, 2, 3, '#2f6a3a'); px(x, 6, 2, 1, '#fff'); } else { px(x, 6, 1, 3, '#3f8f2b'); px(x - 1, 4, 3, 2, col); px(x, 4, 1, 1, '#fff3a0'); } }
    px(1, 8, 14, 7, OUT); px(2, 9, 12, 5, '#b87a45'); px(2, 9, 12, 1, '#d49a5e'); px(2, 11, 12, 1, '#9a6234'); });
  T.lamp = tile(px => { grass(px, 17); px(6, 14, 4, 2, 'rgba(30,50,10,.3)'); px(7, 5, 2, 10, '#3a3040'); px(6, 14, 4, 1, '#3a3040');
    px(5, 1, 6, 5, OUT); px(6, 2, 4, 3, lit ? '#ffe28a' : '#e8e0c8'); px(7, 3, 2, 1, lit ? '#fff6c8' : '#fff'); px(5, 0, 6, 1, OUT); if (W) px(5, 0, 6, 1, '#fff'); });
  T.edgeR = '#7d705c'; T.edgeD = W ? '#b8a690' : '#b88850'; T.sand = W ? '#e8f2f8' : '#f0dca0'; T.ground = S.ground;
  return (tileCache[key] = T);
}

// ---------- 🏪 cute cafe shop (32x32) ----------
const ROOFS = [['#c9503c', '#a03a2c'], ['#3f7fbf', '#2f5f99'], ['#5f9e4a', '#477a36'], ['#8a5ab8', '#6a4090'], ['#d98a2b', '#b06a1a'], ['#c95a8a', '#a0406a'], ['#2f8a8a', '#1f6a6a']];
const WALLS = ['#e8c999', '#f3dcb4', '#d9a878', '#f0d0c8', '#cfe0c0', '#e0d0f0', '#f5e6c8'];
const AWN = ['#e85a5a', '#3f8fd0', '#4fae5a', '#f0a030', '#c060b0', '#2fa0a0'];
const shopCache = {};
function shop(id, lit, season = 'spring', night = false) {
  const key = [id, lit, season, night].join('|'); if (shopCache[key]) return shopCache[key];
  const R = rng(hash(id) ^ 0x51ed), [rf, rd] = pick(R, ROOFS), wall = pick(R, WALLS), awn = pick(R, AWN), P = Pix(32, 32), W = season === 'winter';
  P.rect(22, 2, 4, 6, '#a5503a'); P.rect(22, 2, 4, 1, '#c86a50'); // chimney
  for (let y = 5; y <= 13; y++) { const inset = Math.round((13 - y) * 0.85); P.rect(1 + inset, y, 30 - inset * 2, 1, y % 2 ? rf : rd); }
  P.rect(2, 13, 28, 1, rd);
  if (W) { for (let y = 5; y <= 7; y++) { const inset = Math.round((13 - y) * 0.85); P.rect(1 + inset, y, 30 - inset * 2, 1, '#ffffff'); } [4, 9, 15, 20, 26].forEach(x => P.set(x, 8 + (x % 2), '#ffffff')); P.rect(22, 1, 4, 1, '#fff'); }
  P.rect(10, 8, 12, 5, '#f6e7c1'); P.rect(10, 8, 12, 1, '#fffaf0'); P.rect(14, 9, 3, 3, '#7a4a25'); P.set(17, 10, '#7a4a25'); P.rect(14, 9, 3, 1, '#c98f5a'); // sign with cup
  P.rect(3, 14, 26, 16, wall); for (let y = 16; y < 30; y += 3) P.rect(3, y, 26, 1, 'rgba(0,0,0,0)') ; // keep
  for (let y = 16; y < 30; y += 3) for (let x = 3; x < 29; x++) P.set(x, y, shade(wall, -18));
  for (let x = 2; x < 30; x++) for (let y = 14; y < 18; y++) P.set(x, y, ((x >> 1) % 2) ? awn : '#fff6e0');
  for (let x = 2; x < 30; x += 2) P.set(x, 18, ((x >> 1) % 2) ? awn : '#fff6e0');
  const glass = lit && night ? '#ffd56b' : night ? '#3d4a6e' : '#a8dcef', glow = lit && night ? '#fff3b8' : night ? '#4d5a80' : '#e8f8ff';
  P.rect(5, 20, 10, 7, '#6b3f1d'); P.rect(6, 21, 8, 5, glass); P.rect(9, 21, 2, 5, '#6b3f1d'); P.set(7, 22, glow); P.set(12, 22, glow); if (lit && night) { P.rect(6, 25, 8, 1, '#ffe9a0'); }
  P.rect(4, 27, 12, 1, '#8a5a33'); // window box
  P.rect(18, 20, 8, 10, '#6b3f1d'); P.rect(19, 21, 6, 9, '#8a5a33'); P.rect(20, 22, 4, 2, glass); P.set(24, 26, '#f5c542'); P.rect(19, 25, 6, 1, '#7a4a25');
  const fl = (PALS[season] || PALS.spring).fl;
  [[4, fl[0]], [7, fl[1]], [10, fl[2]], [13, fl[0]]].forEach(([x, c]) => { P.set(x, 26, W ? '#fff' : c); P.set(x + 1, 26, W ? '#2f6a3a' : '#3f8f2b'); });
  P.rect(27, 26, 3, 4, '#c0603a'); P.rect(27, 24, 3, 2, W ? '#2f6a3a' : '#3f9a3a'); P.set(28, 23, W ? '#d33a3a' : fl[3]);
  P.outline(OUT);
  P.rect(16, 31, 11, 1, '#b3a58f'); P.rect(2, 31, 14, 1, 'rgba(30,40,10,.28)'); P.rect(27, 31, 4, 1, 'rgba(30,40,10,.28)');
  return (shopCache[key] = P.canvas());
}
function shade(hex, d) { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v + d)); return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }

// ---------- 🧑‍🍳 barista villagers (procedural portraits, original) ----------
const NAMES = ['小麦', '阿栗', '芋圆', '桃桃', '年糕', '布丁', '麻薯', '可可', '青柠', '豆花', '杏仁', '阿柚', '小枫', '糯米', '奶盖', '焦糖', '蜜桃', '南瓜', '松饼', '芝麻', '雪梨', '柠檬', '奶糖', '小橘',
  '黑豆', '芒果', '麦芽', '花生', '汤圆', '糖霜', '肉桂', '椰子', '枫糖', '白桃', '阿梅', '小米', '酥酥', '团子', '栗子', '山楂', '话梅', '薄荷', '乌龙', '玄米', '豆浆', '桂花', '杏子', '葡萄', '米糕', '红豆', '奶茶', '可颂', '蛋挞'];
const SKINS = [['#f7d2b0', '#e0ad86'], ['#f0c39a', '#d49c72'], ['#d9a070', '#b87e52'], ['#b07850', '#8e5a38'], ['#8a5a3c', '#6c4128'], ['#fbe0c8', '#e6bc9c']];
const HAIRS = [['#3a2418', '#24160e'], ['#7a4a25', '#5a3418'], ['#c98a3a', '#a06a24'], ['#e8c070', '#c09a48'], ['#a03a2c', '#7a2a1e'], ['#2a2a3a', '#16161f'], ['#d07090', '#a85070'], ['#5a7ad0', '#4058a8'], ['#e8e0d8', '#bcb4ac']];
const SHIRTS = ['#4f86c6', '#7ab55c', '#e07a5f', '#8a6ac0', '#e8b84a', '#5ab0b0', '#c05a7a', '#f0ede0'];
const APRONS = ['#6b3f1d', '#2f4a6a', '#8a3a3a', '#3f6a3a', '#5a4a7a', '#c98f5a'];
const vilCache = {};
function villager(id, idx) {
  if (vilCache[id]) return vilCache[id];
  const R = rng(hash(id) ^ 0xba7a), name = NAMES[(idx != null ? idx * 7 + (hash(id) & 3) : hash(id) >>> 0) % NAMES.length];
  const [sk, skD] = pick(R, SKINS), [hr, hrD] = pick(R, HAIRS), shirt = pick(R, SHIRTS), apron = pick(R, APRONS);
  const style = (R() * 6) | 0, glasses = R() < .28, freckles = R() < .3, beard = (style === 0 || style === 1) && R() < .3, cap = pick(R, ['#e85a5a', '#4f86c6', '#f0a030', '#5f9e4a']);
  const P = Pix(32, 32);
  if (style === 3) P.rect(8, 8, 16, 18, hr); // long hair behind
  P.ell(16, 33, 13, 9, shirt); P.rect(10, 25, 12, 7, apron); P.rect(10, 24, 2, 2, apron); P.rect(20, 24, 2, 2, apron);
  P.rect(14, 27, 4, 3, '#fff8e8'); P.set(18, 28, '#fff8e8'); P.rect(15, 28, 2, 1, '#8a5a33'); // cup on apron
  P.rect(14, 19, 4, 5, skD);
  P.ell(16, 13, 7.5, 8, sk); P.rect(8, 13, 1, 3, sk); P.rect(23, 13, 1, 3, sk);
  if (style === 5) { P.ell(16, 7, 8.6, 5, cap); P.rect(7, 9, 18, 2, shade(cap, -40)); P.set(16, 2, '#fff'); }
  else {
    P.ell(16, 7, 8.2, 4.8, hr); P.rect(8, 7, 2, 6, hr); P.rect(22, 7, 2, 6, hr);
    if (style === 1) { [9, 12, 15, 18, 21].forEach((x, i) => P.rect(x, 1 + (i % 2), 2, 3, hr)); for (let x = 10; x < 22; x += 3) P.rect(x, 9, 2, 2, hr); }
    else P.rect(10, 9, 12, 2, hr);
    if (style === 2 || style === 3) { P.rect(7, 9, 3, 11, hr); P.rect(22, 9, 3, 11, hr); }
    if (style === 4) { P.ell(16, 2.5, 3.5, 2.6, hr); P.set(15, 1, shade(hr, 40)); }
    P.rect(11, 4, 4, 1, shade(hr, 35));
  }
  P.rect(11, 12, 3, 1, hrD); P.rect(18, 12, 3, 1, hrD);
  P.rect(12, 14, 2, 2, '#2a1a10'); P.rect(18, 14, 2, 2, '#2a1a10'); P.set(12, 14, '#ffffff'); P.set(18, 14, '#ffffff');
  if (glasses) { [[10, 13], [17, 13]].forEach(([x, y]) => { P.rect(x, y, 5, 1, '#3a2a20'); P.rect(x, y + 3, 5, 1, '#3a2a20'); P.rect(x, y, 1, 4, '#3a2a20'); P.rect(x + 4, y, 1, 4, '#3a2a20'); }); P.rect(15, 14, 2, 1, '#3a2a20'); }
  if (freckles) [[11, 17], [12, 18], [20, 17], [19, 18]].forEach(([x, y]) => P.set(x, y, skD));
  if (beard) { P.ell(16, 19.5, 6, 3, hr); P.rect(10, 16, 1, 3, hr); P.rect(21, 16, 1, 3, hr); }
  P.rect(10, 17, 2, 1, '#f29a9a'); P.rect(20, 17, 2, 1, '#f29a9a');
  P.set(14, 18, '#8a3a2a'); P.rect(15, 19, 2, 1, '#8a3a2a'); P.set(17, 18, '#8a3a2a');
  P.outline(OUT);
  return (vilCache[id] = {id, name, title: '咖啡师', portrait: P.canvas(), bg: pick(R, ['#f6d8a8', '#cfe6c0', '#f2c8c8', '#d6d2f0', '#f4e0b0', '#c8e2ec'])});
}
const LINES = [
  ['欢迎光临！第一次来吗？我是{n}，推荐你试试 {sig}。', '哇，新面孔！今天的豆子刚烘好，要来一杯吗？', '你好呀～我是这里的咖啡师{n}，慢慢看菜单就好。'],
  ['又见面啦！今天也来一杯吗？', '{s}天就该来杯热乎的，对吧？', '上次那杯还喜欢吗？今天换个口味试试？'],
  ['老朋友来了！你的口味我已经记住啦。', '今天的奶泡打得特别绵，给你多拉一颗心～', '你来得正好，刚出炉的点心还热着呢。'],
  ['你是我们店最重要的客人！这杯算我请～', '有你常来，这条街都变温暖了。', '要是哪天你没来，我会想你的。']];
function greeting(v, hearts, cafeId, clk = clock()) {
  const tier = hearts <= 0 ? 0 : hearts <= 3 ? 1 : hearts <= 7 ? 2 : 3, R = rng(hash(v.id) + clk.day * 31 + hearts), L = LINES[tier];
  const sig = (window.menuFor ? (window.menuFor(cafeId)[0] || {}).name : '') || 'Flat White';
  const pre = clk.phase === 'night' ? '这么晚还来，夜猫子呀！' : clk.h < 11 ? '早上好！' : '';
  return pre + L[(R() * L.length) | 0].replace('{n}', v.name).replace('{sig}', sig).replace('{s}', clk.zh + '季的');
}
function heartsHtml(n, max = 10) { return `<span class="vh-row" aria-label="好感 ${n}/${max}">${Array.from({length: max}, (_, i) => `<i class="vh ${i < n ? 'on' : ''}"></i>`).join('')}</span>`; }

// ---------- 🥤 items + quality ----------
const KINDS = [[/iced|冰|cold/i, 'iced'], [/matcha|抹茶/i, 'matcha'], [/chai|tea|茶/i, 'chai'], [/choc|可可|mocha|摩卡/i, 'choc'], [/filter|pour|batch|v60|手冲|single origin/i, 'filter'],
  [/long\s*black|espresso|americano|浓缩|美式|长黑/i, 'black'], [/croissant|pain|kouign|cruffin|可颂/i, 'croissant'], [/french\s*toast|hotcake|pancake|松饼|班戟/i, 'hotcake'], [/banana\s*bread|bread|面包/i, 'bread'],
  [/toast|avo|吐司|牛油果/i, 'toast'], [/egg|benedict|蛋/i, 'egg'], [/bowl|碗|沙拉|salad/i, 'bowl'], [/dacquoise|cake|蛋糕|甜点|cookie|饼/i, 'cake']];
const FOOD = new Set(['croissant', 'hotcake', 'bread', 'toast', 'egg', 'bowl', 'cake']);
const kindOf = name => { const k = KINDS.find(([re]) => re.test(String(name || ''))); return k ? k[1] : 'latte'; };
const isFood = name => FOOD.has(kindOf(name));
const itemCache = {};
function itemSprite(name) {
  const kind = kindOf(name); if (itemCache[kind]) return itemCache[kind];
  const P = Pix(16, 16), cup = (top, body = '#fdf7ec', art) => {
    P.rect(1, 13, 14, 1, '#e6dccb'); P.rect(2, 14, 12, 1, '#d2c6b2'); // saucer
    P.rect(3, 6, 9, 7, body); P.rect(4, 12, 7, 1, body); P.rect(10, 7, 2, 5, shade(body, -26)); P.rect(12, 7, 2, 1, body); P.rect(13, 8, 1, 3, body); P.rect(12, 10, 1, 1, body);
    P.rect(3, 5, 9, 2, top); P.rect(4, 4, 7, 1, top); if (art) { P.set(6, 5, art); P.set(8, 5, art); P.rect(6, 6, 3, 1, art); P.set(7, 4, top); }
    P.set(6, 1, 'rgba(255,255,255,.7)'); P.set(7, 2, 'rgba(255,255,255,.7)'); P.set(9, 0, 'rgba(255,255,255,.6)'); P.set(9, 2, 'rgba(255,255,255,.6)'); };
  ({latte: () => cup('#b77a45', '#fdf7ec', '#fff6e8'), black: () => { cup('#3b2416'); P.rect(4, 5, 7, 1, '#8a5a33'); }, matcha: () => cup('#8bc34a', '#fdf7ec', '#e8f6c8'),
    chai: () => { cup('#d9935a', '#5f9ec9'); P.set(6, 5, '#8a4a20'); P.set(9, 4, '#8a4a20'); }, choc: () => { cup('#6b3a1f', '#d0503c'); P.rect(5, 4, 2, 2, '#fff'); P.rect(8, 4, 2, 2, '#ffc1d8'); },
    iced: () => { P.rect(4, 3, 8, 12, '#d8f0f8'); P.rect(5, 6, 6, 8, '#a8703f'); P.rect(5, 6, 6, 2, '#ead2ac'); P.rect(5, 8, 2, 2, '#ffffff'); P.rect(8, 10, 2, 2, '#ffffff'); P.rect(9, 0, 2, 7, '#e86a6a'); P.set(9, 0, '#ff9a9a'); },
    filter: () => { P.rect(3, 1, 10, 2, '#a8693a'); P.rect(4, 3, 8, 2, '#d8eef5'); P.rect(6, 5, 4, 2, '#a8693a'); P.ell(8, 11, 5, 4, '#d8eef5'); P.ell(8, 12, 4.2, 2.8, '#7a4a25'); P.set(5, 9, '#ffffff'); P.rect(2, 15, 12, 1, 'rgba(60,40,20,.25)'); },
    croissant: () => { P.ell(8, 9, 7, 4.5, '#e8a54a'); P.ell(8, 11.5, 4, 2.2, null); [4, 7, 10].forEach(x => P.rect(x, 6, 1, 6, '#c27a2a')); P.rect(5, 6, 2, 1, '#f6c878'); P.rect(9, 6, 2, 1, '#f6c878'); },
    bread: () => { P.rect(2, 6, 12, 8, '#b8743a'); P.rect(3, 5, 10, 1, '#b8743a'); P.rect(3, 6, 10, 2, '#8a5228'); P.rect(9, 9, 5, 5, '#f0d090'); P.rect(9, 9, 1, 5, '#b8743a'); P.set(11, 11, '#6b3f1d'); P.set(12, 12, '#6b3f1d'); },
    toast: () => { P.rect(2, 4, 12, 10, '#a8693a'); P.rect(3, 5, 10, 8, '#e8bc78'); P.ell(8, 8.5, 4.5, 3, '#8cc04a'); P.set(6, 8, '#6a9a30'); P.set(9, 9, '#c8e070'); P.set(10, 7, '#e85a3a'); P.set(5, 10, '#e85a3a'); },
    hotcake: () => { P.ell(8, 13, 7, 2, '#ffffff'); [11, 9, 7].forEach(y => { P.ell(8, y, 6, 1.8, '#e8b060'); P.rect(3, y, 10, 1, '#c88a3a'); }); P.rect(6, 5, 4, 2, '#fff2a0'); P.rect(4, 7, 1, 3, '#a8501a'); P.rect(11, 7, 1, 4, '#a8501a'); P.rect(5, 6, 6, 1, '#a8501a'); },
    egg: () => { P.ell(8, 9, 7.2, 5.2, '#f4f0e8'); P.ell(8, 9, 5, 3.4, '#ffffff'); P.ell(7.5, 8.5, 2.2, 2, '#ffc22a'); P.set(7, 8, '#fff0a0'); P.rect(12, 6, 2, 1, '#6cbf4a'); },
    bowl: () => { P.ell(8, 9, 7, 5, '#c9503c'); P.ell(8, 7, 6.2, 2.3, '#8cc04a'); P.set(5, 6, '#e85a3a'); P.set(10, 7, '#ffd23f'); P.set(8, 6, '#ffffff'); P.rect(3, 10, 10, 1, '#a03a2c'); },
    cake: () => { P.rect(3, 6, 10, 8, '#fbe0e8'); P.rect(3, 9, 10, 1, '#f08aa8'); P.rect(3, 12, 10, 1, '#f08aa8'); P.rect(3, 5, 10, 1, '#ffffff'); P.rect(7, 2, 2, 3, '#e83a4a'); P.set(8, 1, '#3f8f2b'); }}[kind] || (() => cup('#b77a45')))();
  P.outline(OUT);
  return (itemCache[kind] = P.canvas());
}
const QUAL = [null, {k: 'bronze', zh: '铜星'}, {k: 'bronze', zh: '铜星'}, {k: 'silver', zh: '银星'}, {k: 'gold', zh: '金星'}, {k: 'iris', zh: '紫晶星'}];
const quality = r => QUAL[r | 0] || null;
const ZH = [[/flat\s*white/i, '馥芮白'], [/iced\s*latte/i, '冰拿铁'], [/chai/i, '印度拉茶'], [/latte/i, '拿铁'], [/cappuccino/i, '卡布奇诺'], [/long\s*black/i, '长黑'], [/espresso/i, '意式浓缩'], [/piccolo/i, '短笛拿铁'], [/magic/i, '魔法咖啡'],
  [/batch/i, '批量手冲'], [/filter|pour/i, '手冲咖啡'], [/hot\s*choc/i, '热可可'], [/banana\s*bread/i, '香蕉面包'], [/avo/i, '牛油果吐司'], [/almond\s*croissant/i, '杏仁可颂'], [/pain\s*au/i, '巧克力可颂'], [/croissant/i, '可颂'],
  [/kouign/i, '焦糖酥'], [/cruffin/i, '可芬'], [/french\s*toast/i, '法式吐司'], [/hotcake/i, '松饼'], [/baked\s*eggs/i, '烤蛋'], [/benedict/i, '班尼迪克蛋'], [/bowl/i, '早餐碗'], [/dacquoise/i, '达克瓦兹']];
const itemZh = name => { const n = String(name || ''); const z = ZH.find(([re]) => re.test(n)); return z ? z[1] : (/[\u4e00-\u9fff]/.test(n) ? n : ''); };

let _coin = null;
function coinIcon() { if (_coin) return _coin; const P = Pix(9, 9); P.ell(4.5, 4.5, 4.5, 4.5, '#c98a1a'); P.ell(4.5, 4.5, 3.4, 3.4, '#f5c542'); P.rect(4, 2, 1, 5, '#c98a1a'); P.set(3, 2, '#fff2a0'); P.set(2, 3, '#fff2a0');
  return (_coin = P.canvas().toDataURL()); }
const coinImg = () => `<img class="vl-coin" src="${coinIcon()}" alt="金币">`;

// ---------- 🧑‍🌾 farmer hero (recoloured pixel hero + straw hat) ----------
let _sheet = null;
function heroSheet() {
  if (_sheet) return _sheet;
  const src = J.heroSheet(), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data, map = {'3b5dc9': [79, 134, 198], '29366f': [47, 90, 140], 'b13e53': [224, 122, 95], '5d3a1a': [107, 74, 43], 'ffcd75': [245, 197, 66]};
  for (let i = 0; i < d.length; i += 4) { const k = [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (map[k]) [d[i], d[i + 1], d[i + 2]] = map[k]; }
  g.putImageData(img, 0, 0);
  for (let f = 0; f < 3; f++) for (let r = 0; r < 4; r++) { const ox = f * 16, oy = r * 16, px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(ox + x, oy + y, w, h); };
    px(5, 0, 6, 1, OUT); px(4, 1, 8, 2, '#e8c060'); px(5, 1, 6, 1, '#f6d880'); px(4, 3, 8, 1, '#c0503c'); px(2, 4, 12, 1, '#d4a640'); px(1, 4, 1, 1, OUT); px(14, 4, 1, 1, OUT); px(2, 5, 12, 1, OUT); px(3, 1, 1, 3, OUT); px(12, 1, 1, 3, OUT); }
  return (_sheet = c);
}
const DIRS = {down: 0, left: 1, right: 2, up: 3};
function drawHero(canvas, dir = 'down', frame = 0) { const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 16, 16); g.drawImage(heroSheet(), frame * 16, DIRS[dir] * 16, 16, 16, 0, 0, 16, 16); }

// ---------- 🐔 critters ----------
function critter(type, frame) {
  const P = Pix(14, 12);
  if (type === 'chicken') { P.ell(7, 7.5, 4.5, 3.5, '#ffffff'); P.ell(10, frame ? 6 : 4, 2.3, 2.3, '#ffffff'); P.rect(10, frame ? 3 : 1, 2, 1, '#e8403a'); P.set(12, frame ? 6 : 4, '#f0a030'); P.set(13, frame ? 6 : 4, '#f0a030'); P.set(10, frame ? 5 : 3, '#2a1a10');
    P.rect(3, 6, 2, 2, '#e8e0d0'); P.set(6, 8, '#e8e0d0'); P.rect(6, 11, 1, 1, '#f0a030'); P.rect(8, 11, 1, 1, '#f0a030'); }
  else { const fur = '#f0a050', dk = '#c87a30'; P.ell(6.5, 8, 4.5, 2.6, fur); P.ell(10.5, 5.5, 2.8, 2.6, fur); P.set(9, 2, fur); P.set(12, 2, fur); P.set(9, 3, fur); P.set(12, 3, fur); P.set(10, 5, '#2a1a10'); P.set(12, 5, '#2a1a10'); P.set(11, 6, '#e87a8a');
    P.rect(3, 7, 2, 1, dk); P.rect(6, 7, 2, 1, dk); if (frame) { P.rect(1, 3, 1, 4, fur); P.set(2, 7, fur); } else { P.rect(0, 6, 2, 1, fur); P.rect(1, 7, 2, 1, fur); } P.rect(4, 10, 1, 1, fur); P.rect(8, 10, 1, 1, fur); P.set(frame ? 5 : 3, 11, fur); }
  P.outline(OUT); return P.canvas();
}

// ---------- map kit used by PixelMap (skin) ----------
function kit(clk = clock()) {
  const season = clk.season, night = clk.lit, T = tiles(season, night);
  return {name: 'valley', season, phase: clk.phase, tiles: T, cafeSize: 32,
    cafeSprite: (id, lit) => shop(id, lit, season, night), drawHero,
    decorate: ctx => decorate(ctx, T, clk)};
}
function decorate({world, M, W, H, sprites, getS, visited, TS, walk}, T, clk) {
  const {G, cols, rows} = M, timers = [], R = rng(hash(M.id || 'v') ^ 0xc0ffee), night = clk.lit, season = clk.season;
  world.dataset.season = season; world.dataset.phase = clk.phase; world.classList.add('vl-world', 'vl-' + season, 'vl-' + clk.phase);
  // swaying canopies: two copies, 1px apart, alternating
  const layer = cls => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'px-ground px-layer vl-canopy ' + cls; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; world.appendChild(c); return g; };
  const ga = layer('a'), gb = layer('b');
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (G[r][c] === 't') { const X = c * TS, Y = r * TS - 9, o = ((c * 7 + r * 3) % 3) - 1; ga.drawImage(T.canopy, X, Y); gb.drawImage(T.canopy, X + (o || 1), Y); }
  const add = (el, x, y, w, h, z) => { world.appendChild(el); const o = {el, x, y, w, h, ax: w / 2, ay: h / 2, z}; sprites.push(o); return o; };
  // tint for time of day
  const tint = document.createElement('div'); tint.className = 'vl-tint ' + clk.phase; world.appendChild(tint);
  // warm glows (lamps + lit shops) at dusk / night
  if (night) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (G[r][c] === 'm') { const gl = document.createElement('i'); gl.className = 'vl-glow lamp'; add(gl, c * TS + 8, r * TS + 3, 44, 44, 9001); }
    sprites.filter(o => o.id && visited.has(o.id)).forEach(o => { const gl = document.createElement('i'); gl.className = 'vl-glow shop'; add(gl, o.x - 4, o.y - 6, 52, 40, 9001); });
  }
  // weather / ambient particles
  const fx = document.createElement('div'); fx.className = 'vl-fx'; world.appendChild(fx);
  const kinds = night ? (season === 'winter' ? ['snow'] : ['firefly']) : {spring: ['petal', 'butterfly'], summer: ['butterfly', 'butterfly'], autumn: ['leaf'], winter: ['snow']}[season];
  const n = kinds[0] === 'butterfly' ? 6 : kinds[0] === 'firefly' ? 14 : 26;
  for (let i = 0; i < n; i++) { const k = kinds[i % kinds.length], p = document.createElement('i'); p.className = 'vl-p ' + k;
    p.style.left = (R() * 100).toFixed(1) + '%'; p.style.top = (R() * 100).toFixed(1) + '%'; p.style.animationDelay = (-R() * 12).toFixed(2) + 's'; p.style.animationDuration = (k === 'snow' ? 7 + R() * 6 : k === 'butterfly' ? 6 + R() * 5 : k === 'firefly' ? 3 + R() * 3 : 8 + R() * 6).toFixed(2) + 's';
    if (k === 'butterfly') p.style.setProperty('--bc', pick(R, ['#ffffff', '#ffd23f', '#ff9ec4', '#8fd0ff', '#f0a030']));
    if (k === 'leaf') p.style.setProperty('--bc', pick(R, ['#e0742a', '#c9501e', '#f0a030', '#a5431a']));
    fx.appendChild(p); }
  // wandering chickens & a cat
  const grassy = (c, r) => G[r] && ['g', 'f'].includes(G[r][c]);
  const spots = []; for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) if (grassy(c, r)) spots.push({c, r});
  const nearType = (t, d) => spots.filter(s => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (G[s.r + j] && G[s.r + j][s.c + i] === t) return true; return false; });
  const types = night ? ['cat'] : ['chicken', 'chicken', 'cat'];
  const crit = [];
  types.forEach((type, i) => {
    const pool = type === 'chicken' ? (nearType('k', 2).length ? nearType('k', 2) : spots) : (nearType('c', 3).length ? nearType('c', 3) : spots); if (!pool.length) return;
    const s = pool[(R() * pool.length) | 0], el = document.createElement('div'); el.className = 'vl-critter ' + type; el.dataset.type = type;
    const f0 = critter(type, 0), f1 = critter(type, 1), cv = document.createElement('canvas'); cv.width = 14; cv.height = 12; cv.getContext('2d').drawImage(f0, 0, 0); el.appendChild(cv);
    const o = add(el, s.c * TS + 8, s.r * TS + 10, 14, 12); o.ay = 11; o.tile = s; o.frames = [f0, f1]; o.cv = cv; crit.push(o); });
  const step = () => crit.forEach(o => {
    const g = o.cv.getContext('2d'); if (Math.random() < .45) { g.clearRect(0, 0, 14, 12); g.drawImage(o.frames[(o.f = 1 - (o.f || 0))], 0, 0); }
    if (Math.random() < .4) return;
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => ({c: o.tile.c + dc, r: o.tile.r + dr, dc})).filter(t => o.el.dataset.type === 'cat' ? walk(t.c, t.r) : grassy(t.c, t.r));
    if (!opts.length) return; const t = opts[(Math.random() * opts.length) | 0]; if (t.dc) o.el.classList.toggle('flip', t.dc < 0);
    o.tile = t; o.x = t.c * TS + 8; o.y = t.r * TS + 10; const s = getS(); o.el.style.left = Math.round((o.x - o.ax) * s) + 'px'; o.el.style.top = Math.round((o.y - o.ay) * s) + 'px'; o.el.style.zIndex = Math.round(o.y) + 10; });
  timers.push(setInterval(step, 900));
  return {critters: crit.length, particles: n, remove() { timers.forEach(clearInterval); }};
}

// ---------- 💬 dialogue with villager portrait ----------
const town = () => villager('__town', 0);
function say(msg, ms, who) { const v = who || town(); J.say(msg, ms, who ? `${v.title} ${v.name}` : '镇民 小豆', v.portrait, v.bg); }
function portraitEl(v, s = 3) { const c = J.scaled(v.portrait, s); c.classList.add('vl-face'); c.style.background = v.bg; return c; }

// ---------- 🧺 harvest popup (check-in reward) ----------
// data: {isNew, cafe, item, quality, coins, xp, villager, heartsFrom, heartsTo, newEntry, lines:[]}
function harvest(el, data, onClose) {
  const q = data.quality, zh = itemZh(data.item), en = data.item || 'Coffee';
  el.className = 'vl-cel';
  el.innerHTML = `<div class="vl-sparkles">${'<i></i>'.repeat(12)}</div><div class="vwin vl-pop">
    <div class="vl-pop-title">${data.isNew ? '🌱 新店解锁！' : '🧺 收获！'}</div>${data.cafe ? `<div class="vl-pop-cafe">${esc(data.cafe)}</div>` : ''}
    <div class="vl-item"><div class="vl-slot"></div>${q ? `<i class="vq ${q.k}" title="${q.zh}品质"></i>` : ''}</div>
    <div class="vl-item-name">${esc(zh || en)}${zh && zh !== en ? ` <small>${esc(en)}</small>` : ''}</div>
    <div class="vl-q ${q ? q.k : 'none'}">${q ? `<i class="vq ${q.k}"></i> ${q.zh}品质` : '普通品质'}</div>
    <div class="vl-gains"><span class="g-coin">${coinImg()} +${data.coins}</span><span class="g-xp">XP +${data.xp}</span></div>
    ${data.villager ? `<div class="vl-friend"><div class="vf-face"></div><div class="vf-main"><b>${esc(data.villager.title)} ${esc(data.villager.name)}</b>${heartsHtml(data.heartsFrom)}<small>${data.heartsTo > data.heartsFrom ? '好感度 +1 ❤' : '好感度已满！'}</small></div></div>` : ''}
    <div class="vl-lines">${data.newEntry ? `<div class="vl-line new">📖 收藏新条目：${esc(zh || en)}</div>` : ''}${data.lines.join('')}</div>
    <button class="vbtn" id="celOk">好的！</button></div>`;
  el.querySelector('.vl-slot').appendChild(J.scaled(itemSprite(data.item), 5));
  if (data.villager) el.querySelector('.vf-face').appendChild(portraitEl(data.villager, 2));
  el.classList.remove('hidden'); J.SFX.play('harvest');
  setTimeout(() => { const hs = el.querySelectorAll('.vh'); if (data.heartsTo > data.heartsFrom && hs[data.heartsTo - 1]) { hs[data.heartsTo - 1].classList.add('on', 'pop'); J.SFX.play('heart'); } }, 700);
  setTimeout(() => J.SFX.play('coin'), 380);
  el.querySelector('#celOk').onclick = () => { J.SFX.play('confirm'); onClose(); };
}
// ---------- 🌱 seed packet obtained (bean saved) — costs no 咖啡因 ----------
function seedPacket(el, data, onClose) {
  const b = data.bean || {}, hue = Math.abs([...(b.origin || b.name || 'x')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 360;
  el.className = 'vl-cel vl-seed';
  el.innerHTML = `<div class="vl-sparkles">${'<i></i>'.repeat(12)}</div><div class="vwin vl-pop">
    <div class="vl-pop-title">🌱 获得种子包！</div>
    <div class="vl-packet big" style="--ph:${hue}"><span class="pk-top">${esc(b.origin || '咖啡种子')}</span><span class="pk-spr"></span><b>${esc(b.name || '未命名')}</b><small>${esc([b.process, b.roast].filter(Boolean).join(' · ') || b.roaster || '')}</small></div>
    <div class="vl-gains"><span class="g-coin">${coinImg()} +${data.coins}</span></div>
    <div class="vl-lines"><div class="vl-line">📜 标签文字已记进种子袋，可随时复制/分享</div><div class="vl-line">⚡ 不消耗咖啡因</div></div>
    <button class="vbtn" id="celOk">收下！</button></div>`;
  const spr = window.Beans && Beans.beanSprite && Beans.beanSprite(); if (spr) el.querySelector('.pk-spr').appendChild(J.scaled(spr, 4)); else el.querySelector('.pk-spr').textContent = '🫘';
  el.classList.remove('hidden'); J.SFX.play('harvest'); setTimeout(() => J.SFX.play('coin'), 380);
  el.querySelector('#celOk').onclick = () => { J.SFX.play('confirm'); onClose(); };
}
// ---------- 🌙 end-of-day summary (level up) ----------
// info: {from, to, title, clk, rows:[[label, value]], friends:[{v, from, to}]}
function daySummary(el, info, onClose) {
  const c = info.clk || clock();
  el.className = 'vl-cel vl-night';
  el.innerHTML = `<div class="vl-stars">${'<i></i>'.repeat(18)}</div><div class="vl-moon"></div><div class="vwin vl-day">
    <div class="vd-head">${c.icon} ${c.zh}季 第 ${c.dayOf} 天 · 今日小结</div>
    <div class="vd-rows">${info.rows.map(([k, v]) => `<div class="vd-row"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    ${(info.friends || []).map(f => `<div class="vd-row friend"><span>❤ ${esc(f.v.name)}</span>${heartsHtml(f.to)}</div>`).join('')}
    <div class="vd-lv"><div class="vd-lv-t">🌟 等级提升！</div><div class="vd-hero"></div><div class="vd-lv-n">Lv.${info.from} ▶ <b>Lv.${info.to}</b></div><div class="vd-title">称号：${esc(info.title)}</div>
      <div class="vd-perk">☕ 咖啡因上限 +10　🍰 品味 +2　🧭 好奇心 +1</div></div>
    <button class="vbtn" id="lvOk">🛏️ 睡一觉，迎接新的一天</button></div>`;
  const hc = document.createElement('canvas'); hc.width = hc.height = 16; drawHero(hc, 'down', 0); el.querySelector('.vd-hero').appendChild(J.scaled(hc, 4));
  el.classList.remove('hidden'); J.SFX.play('sleep');
  el.querySelector('#lvOk').onclick = () => { J.SFX.play('confirm'); onClose(); };
}

window.Valley = {clock, seasonOf, SEASON, tiles, shop, villager, greeting, heartsHtml, itemSprite, itemZh, kindOf, isFood, quality, coinIcon, coinImg, heroSheet, drawHero, critter, kit, say, portraitEl, harvest, daySummary, seedPacket, Pix};
})();
