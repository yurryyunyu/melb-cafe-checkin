// 🏰 "城镇" theme kit: warm pastoral, painterly low-poly look. Original SVG art drawn in code (no assets).
// Little isometric cottages for cafes (built = visited, blueprint ghost = not yet), resource icons, title card.
(() => {
'use strict';
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const ROOFS = [['#c8643c', '#a24c2c'], ['#d9a441', '#b5832c'], ['#7d8fa3', '#5f7084'], ['#a85a48', '#86422f'], ['#8a9a4a', '#6c7a36']];
const WALLS = [['#f3e2bf', '#dcc69c'], ['#ead2a4', '#cfb383'], ['#f0dcc8', '#d4bba3'], ['#e2cfa8', '#c7b085']];
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
// isometric cottage, viewBox 64x64. built=false → translucent blueprint "placement ghost"
function building(id, built = true, opt = {}) {
  const h = hash(id), [rf, rd] = ROOFS[h % ROOFS.length], [wl, wr] = WALLS[(h >>> 3) % WALLS.length];
  const H = 12 + (h >>> 5) % 7, RH = 15 + (h >>> 8) % 7, chim = (h >>> 11) % 3 !== 0, tower = (h >>> 13) % 5 === 0;
  const L = [12, 40], F = [32, 50], Rr = [52, 40], B = [32, 30], up = ([x, y], k) => `${x},${y - k}`, P = a => a.map(p => typeof p === 'string' ? p : p.join(',')).join(' ');
  const g = built ? {wl, wr, rf, rd, st: '#5a3c22', op: 1} : {wl: 'rgba(170,205,235,.55)', wr: 'rgba(140,180,220,.55)', rf: 'rgba(190,220,245,.6)', rd: 'rgba(150,190,230,.6)', st: '#4c7fb0', op: .95};
  const dash = built ? '' : ' stroke-dasharray="3 2"', sw = built ? 1.2 : 1.4;
  const apex = `32,${40 - H - RH}`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="fd-bld${built ? ' built' : ' ghost'}">`;
  s += `<ellipse cx="32" cy="51" rx="23" ry="7" fill="${built ? 'rgba(70,60,20,.22)' : 'rgba(76,127,176,.18)'}"/>`;
  if (!built) s += `<polygon points="${P([[8, 40], [32, 52], [56, 40], [32, 28]])}" fill="rgba(120,170,220,.18)" stroke="#4c7fb0" stroke-width="1" stroke-dasharray="2 2"/>`;
  s += `<polygon points="${P([L, F, up(F, H), up(L, H)])}" fill="${g.wl}" stroke="${g.st}" stroke-width="${sw}"${dash} stroke-linejoin="round"/>`;
  s += `<polygon points="${P([F, Rr, up(Rr, H), up(F, H)])}" fill="${g.wr}" stroke="${g.st}" stroke-width="${sw}"${dash} stroke-linejoin="round"/>`;
  if (built) { // timber frame, door, window, cafe sign
    s += `<path d="M12 ${40 - H / 2} L32 ${50 - H / 2} M32 ${50 - H / 2} L52 ${40 - H / 2}" stroke="${shade(wr, .7)}" stroke-width="1"/>`;
    s += `<polygon points="38,${47} 43,${44.5} 43,${44.5 - 7} 38,${47 - 7}" fill="#7a4a28"/>`;
    s += `<polygon points="18,${41.5 - H * .55} 24,${44.5 - H * .55} 24,${44.5 - H * .55 - 4} 18,${41.5 - H * .55 - 4}" fill="${opt.lit ? '#ffd877' : '#9cc8dc'}" stroke="#5a3c22" stroke-width=".8"/>`;
    s += `<g transform="translate(45 ${37 - H * .4})"><rect x="0" y="0" width="7" height="6" rx="1" fill="#f6ead0" stroke="#5a3c22" stroke-width=".8"/><path d="M2 2h3v2.5a1.5 1.5 0 0 1-3 0z" fill="#7a4a28"/></g>`; }
  s += `<polygon points="${P([up(L, H), up(F, H), apex])}" fill="${g.rf}" stroke="${g.st}" stroke-width="${sw}"${dash} stroke-linejoin="round"/>`;
  s += `<polygon points="${P([up(F, H), up(Rr, H), apex])}" fill="${g.rd}" stroke="${g.st}" stroke-width="${sw}"${dash} stroke-linejoin="round"/>`;
  if (chim) s += `<polygon points="40,${36 - H - RH * .3} 44,${34 - H - RH * .3} 44,${28 - H - RH * .3} 40,${30 - H - RH * .3}" fill="${built ? '#9a7a62' : g.wr}" stroke="${g.st}" stroke-width="1"${dash}/>`;
  if (tower) s += `<polygon points="14,${40 - H} 20,${43 - H} 20,${30 - H} 14,${27 - H}" fill="${g.wl}" stroke="${g.st}" stroke-width="1"${dash}/><polygon points="13,${27 - H} 21,${30 - H} 17,${18 - H}" fill="${g.rf}" stroke="${g.st}" stroke-width="1"${dash}/>`;
  if (built && opt.flag) s += `<path d="M32 ${40 - H - RH} v-9" stroke="#5a3c22" stroke-width="1"/><path d="M32 ${31 - H - RH} l8 2.5 -8 2.5z" fill="#d94f3a"/>`;
  return s + '</svg>';
}
const url = (id, built, opt) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(building(id, built, opt));
// resource icons (16x16, flat painterly)
const ICON = {
  coin: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#e8b84a" stroke="#8a6420" stroke-width="1.2"/><circle cx="8" cy="8" r="3.6" fill="none" stroke="#fff2c2" stroke-width="1"/></svg>',
  heart: '<svg viewBox="0 0 16 16"><path d="M8 14S2 10 2 5.8A3 3 0 0 1 8 4.2a3 3 0 0 1 6 1.6C14 10 8 14 8 14z" fill="#d9644e" stroke="#7a2c1e" stroke-width="1"/></svg>',
  star: '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3l-4 2.2 1-4.4-3.4-3 4.5-.5z" fill="#f1cf6a" stroke="#8a6420" stroke-width="1"/></svg>',
  house: '<svg viewBox="0 0 16 16"><path d="M2 8l6-5 6 5v6H2z" fill="#f3e2bf" stroke="#5a3c22" stroke-width="1"/><path d="M1 8.5L8 2.5l7 6" fill="none" stroke="#c8643c" stroke-width="2"/><rect x="6.5" y="10" width="3" height="4" fill="#7a4a28"/></svg>',
  cal: '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="1.5" fill="#f6ead0" stroke="#5a3c22"/><rect x="2" y="3" width="12" height="3" fill="#c8643c"/><path d="M5 1.5v3M11 1.5v3" stroke="#5a3c22" stroke-width="1.2"/></svg>'};
const icon = k => `<i class="fd-ic">${ICON[k] || ''}</i>`;
// 🏰 title card: painted valley, cottages rising along a winding road (skipped in automation unless ?splash)
function splash(force) {
  try { if (!force && (sessionStorage.getItem('mcc.splash') || navigator.webdriver)) return; sessionStorage.setItem('mcc.splash', '1'); } catch (e) { if (!force) return; }
  const el = document.createElement('div'); el.id = 'fdSplash'; el.setAttribute('aria-hidden', 'true');
  const houses = ['a', 'bb', 'ccc', 'dd', 'e', 'ff', 'g'].map((k, i) => `<img src="${url('splash' + k, true, {flag: i === 3})}" style="left:${8 + i * 12.5}%;bottom:${18 + Math.abs(3 - i) * 3.5}%;animation-delay:${.25 + i * .12}s" alt="">`).join('');
  el.innerHTML = `<div class="fs-sky"></div><div class="fs-sun"></div><div class="fs-hill h1"></div><div class="fs-hill h2"></div><div class="fs-road"></div><div class="fs-town">${houses}</div><div class="fs-hill h3"></div>
    <div class="fs-card"><div class="fs-kicker">MELBOURNE · CAFE CHRONICLE</div><div class="fs-title">墨尔本咖啡小镇</div><div class="fs-sub">一杯一杯，建起你的城镇</div><div class="fs-bar"><i></i></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), force ? 2800 : 1600);
  setTimeout(() => el.remove(), force ? 3400 : 2200);
}
window.FD = {building, url, icon, ICON, splash, hash};
})();
