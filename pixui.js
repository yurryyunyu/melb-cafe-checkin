// 🎮 Pixel UI kit for the valley theme: original 16×16 icons drawn in code, a pixel scene banner for cafe pages,
// shop thumbnails for list cards, and the title / loading screen. No external assets.
(() => {
'use strict';
const V = window.Valley, J = window.JRPG; if (!V || !J) return;
const {Pix} = V, OUT = '#3a2414';
const cache = {};
// ---------- icons ----------
const ICONS = {
  cup() { const P = Pix(16, 16);
    P.rect(2, 6, 10, 8, '#fdf7ec'); P.rect(3, 14, 8, 1, '#fdf7ec'); P.rect(2, 6, 10, 2, '#b77a45'); P.rect(4, 6, 2, 1, '#e8c08a'); P.rect(9, 8, 3, 6, '#e0d4bf');
    P.rect(12, 8, 2, 1, '#fdf7ec'); P.rect(13, 9, 1, 3, '#fdf7ec'); P.rect(12, 11, 1, 1, '#fdf7ec'); P.rect(4, 10, 3, 2, '#e85a5a'); P.set(5, 12, '#e85a5a');
    P.outline(OUT); [[4, 3], [5, 2], [4, 1], [5, 0], [8, 3], [9, 2], [8, 1], [9, 0]].forEach(([x, y]) => P.set(x, y, 'rgba(255,255,255,.85)')); return P; },
  map() { const P = Pix(16, 16);
    P.rect(1, 3, 5, 11, '#f6e7c1'); P.rect(6, 2, 5, 11, '#ecd6a4'); P.rect(11, 3, 4, 11, '#f6e7c1');
    P.rect(2, 9, 3, 3, '#7ccf5a'); P.rect(11, 5, 3, 3, '#7ccf5a'); P.rect(7, 4, 3, 2, '#4fa2d8');
    [[2, 6], [4, 7], [6, 8], [8, 9], [10, 9]].forEach(([x, y]) => P.set(x, y, '#a86b38'));
    P.set(12, 9, '#e8403a'); P.set(14, 9, '#e8403a'); P.set(13, 10, '#e8403a'); P.set(12, 11, '#e8403a'); P.set(14, 11, '#e8403a');
    P.outline(OUT); return P; },
  book() { const P = Pix(16, 16);
    P.rect(2, 1, 12, 14, '#a8503a'); P.rect(2, 1, 2, 14, '#7a3020'); P.rect(12, 2, 2, 12, '#fbf3dc'); P.rect(13, 2, 1, 12, '#e2cc9c');
    P.rect(6, 4, 5, 4, '#f6e7c1'); P.rect(7, 5, 3, 1, '#a86b38'); P.rect(7, 6, 2, 1, '#a86b38');
    P.rect(9, 0, 2, 4, '#f5c542'); P.set(9, 4, '#f5c542'); P.set(5, 12, '#f5c542'); P.set(10, 12, '#f5c542');
    P.outline(OUT); return P; },
  boot() { const P = Pix(16, 16);
    P.rect(4, 1, 6, 9, '#8a5a33'); P.rect(4, 1, 6, 2, '#6b3f1d'); P.rect(5, 3, 1, 6, '#a8743f');
    P.rect(3, 9, 11, 4, '#8a5a33'); P.rect(10, 10, 4, 3, '#8a5a33'); P.rect(3, 13, 11, 2, '#4a2c14'); P.rect(6, 4, 3, 1, '#f5c542'); P.rect(6, 6, 3, 1, '#f5c542'); P.set(12, 10, '#a8743f');
    P.outline(OUT); return P; },
  camera() { const P = Pix(16, 16);
    P.rect(1, 4, 14, 10, '#8a8f9a'); P.rect(1, 4, 14, 2, '#5a5f6a'); P.rect(4, 2, 5, 2, '#5a5f6a'); P.rect(11, 3, 3, 1, '#e8403a');
    P.ell(8, 9.5, 4, 4, '#3a3040'); P.ell(8, 9.5, 2.8, 2.8, '#4f86c6'); P.rect(6, 8, 2, 1, '#bfe4ff'); P.set(6, 9, '#bfe4ff'); P.rect(2, 7, 2, 1, '#c9ced8');
    P.outline(OUT); return P; },
  search() { const P = Pix(16, 16);
    P.ell(6.5, 6.5, 5, 5, '#c98f55'); P.ell(6.5, 6.5, 3.6, 3.6, '#bfe4ff'); P.rect(4, 4, 2, 1, '#ffffff'); P.set(4, 5, '#ffffff');
    for (let i = 0; i < 5; i++) { P.rect(10 + i, 10 + i, 2, 2, '#8a5a33'); }
    P.outline(OUT); return P; },
  gear() { const P = Pix(16, 16);
    P.ell(8, 8, 5.5, 5.5, '#9aa0aa'); [[7, 0, 2, 3], [7, 13, 2, 3], [0, 7, 3, 2], [13, 7, 3, 2], [2, 2, 2, 2], [12, 2, 2, 2], [2, 12, 2, 2], [12, 12, 2, 2]].forEach(([x, y, w, h]) => P.rect(x, y, w, h, '#9aa0aa'));
    P.ell(8, 8, 2, 2, '#5a5f6a'); P.rect(5, 5, 2, 1, '#d0d4dc'); P.outline(OUT); return P; },
  bean() { const P = Pix(16, 16);
    P.ell(8, 8, 5.5, 6.5, '#8a4a25'); P.ell(7, 6.5, 3, 3.5, '#a8603a'); for (let y = 3; y < 14; y++) P.set(8 + Math.round(Math.sin(y * .7)), y, '#4a2412');
    P.set(6, 4, '#d08a5a'); P.outline(OUT); return P; },
  scroll() { const P = Pix(16, 16);
    P.rect(3, 2, 10, 12, '#fbf3dc'); P.rect(1, 1, 14, 2, '#c98f55'); P.rect(1, 13, 14, 2, '#c98f55'); P.rect(1, 1, 1, 2, '#a86b38'); P.rect(14, 13, 1, 2, '#a86b38');
    [5, 7, 9, 11].forEach((y, i) => P.rect(5, y, i % 2 ? 4 : 6, 1, '#a86b38')); P.set(11, 11, '#e8403a');
    P.outline(OUT); return P; },
  chest() { const P = Pix(16, 16);
    P.rect(1, 4, 14, 4, '#a8603a'); P.rect(2, 3, 12, 1, '#a8603a'); P.rect(1, 8, 14, 6, '#8a4a25'); P.rect(1, 7, 14, 1, '#5e3519');
    P.rect(3, 4, 1, 10, '#f5c542'); P.rect(12, 4, 1, 10, '#f5c542'); P.rect(7, 6, 2, 4, '#f5c542'); P.set(7, 8, '#3a2414');
    P.outline(OUT); return P; },
  heart() { const P = Pix(16, 16);
    P.ell(5, 6, 3.5, 3.5, '#e8403a'); P.ell(11, 6, 3.5, 3.5, '#e8403a'); for (let y = 6; y < 14; y++) P.rect(2 + (y - 6), y, 12 - (y - 6) * 2, 1, '#e8403a');
    P.rect(3, 4, 2, 2, '#ff9a90'); P.outline(OUT); return P; },
  photo() { const P = Pix(16, 16);
    P.rect(1, 3, 14, 11, '#fbf3dc'); P.rect(2, 4, 12, 7, '#8fd2f2'); P.rect(2, 9, 12, 2, '#7ccf5a'); P.rect(5, 7, 3, 2, '#7ccf5a'); P.rect(10, 5, 2, 2, '#ffe08a');
    P.outline(OUT); return P; },
  quill() { const P = Pix(16, 16);
    for (let i = 0; i < 9; i++) P.rect(4 + i, 11 - i, 2, 2, i < 3 ? '#3a3040' : '#fbf3dc'); P.rect(9, 3, 3, 2, '#e2cc9c'); P.rect(11, 1, 3, 2, '#fbf3dc');
    P.rect(2, 14, 8, 1, '#4a2c14'); P.outline(OUT); return P; },
  sound() { const P = Pix(16, 16);
    P.rect(2, 6, 3, 4, '#c98f55'); for (let i = 0; i < 4; i++) P.rect(5 + i, 5 - i, 1, 6 + i * 2, '#c98f55');
    [[11, 6, 1, 4], [13, 4, 1, 8]].forEach(([x, y, w, h]) => P.rect(x, y, w, h, '#4f9a2e')); P.outline(OUT); return P; },
  mute() { const P = Pix(16, 16);
    P.rect(2, 6, 3, 4, '#c98f55'); for (let i = 0; i < 4; i++) P.rect(5 + i, 5 - i, 1, 6 + i * 2, '#c98f55');
    for (let i = 0; i < 4; i++) { P.set(11 + i, 6 + i, '#e8403a'); P.set(14 - i, 6 + i, '#e8403a'); } P.outline(OUT); return P; },
  note() { const P = Pix(16, 16); // ♫ music on
    P.rect(5, 2, 9, 2, '#3a3040'); P.rect(5, 2, 2, 10, '#3a3040'); P.rect(12, 2, 2, 9, '#3a3040'); P.ell(4.5, 12, 2.6, 2, '#f5c542'); P.ell(11.5, 11, 2.6, 2, '#f5c542'); P.set(4, 11, '#fff2a0'); P.set(11, 10, '#fff2a0'); P.outline(OUT); return P; },
  notex() { const P = Pix(16, 16); // ♫ music off
    P.rect(5, 2, 9, 2, '#8a7a6a'); P.rect(5, 2, 2, 10, '#8a7a6a'); P.rect(12, 2, 2, 9, '#8a7a6a'); P.ell(4.5, 12, 2.6, 2, '#c9b89a'); P.ell(11.5, 11, 2.6, 2, '#c9b89a');
    for (let i = 0; i < 12; i++) P.set(2 + i, 2 + i, '#e8403a'), P.set(3 + i, 2 + i, '#e8403a'); P.outline(OUT); return P; },
  star() { const P = Pix(16, 16);
    const pts = [[8, 1], [10, 6], [15, 6], [11, 9], [13, 14], [8, 11], [3, 14], [5, 9], [1, 6], [6, 6]];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside; } if (inside) P.set(x, y, y < 7 ? '#fff2a0' : '#f5c542'); }
    P.outline(OUT); return P; },
};
function icon(name) { const k = 'i:' + name; if (cache[k]) return cache[k]; const f = ICONS[name]; if (!f) return null; return (cache[k] = f().canvas()); }
function url(name) { const k = 'u:' + name; if (cache[k]) return cache[k]; const c = icon(name); return (cache[k] = c ? c.toDataURL() : ''); }
const img = (name, cls = '') => `<img class="pi ${cls}" src="${url(name)}" alt="" aria-hidden="true">`;
function installVars() { const s = document.documentElement.style; Object.keys(ICONS).forEach(n => s.setProperty('--pi-' + n, `url("${url(n)}")`)); }

// ---------- shop thumbnail for list cards ----------
function shopUrl(id, lit, closed) { const k = ['s', id, lit, closed].join('|'); if (cache[k]) return cache[k];
  const clk = V.clock(), src = V.shop(id, lit, clk.season, false), c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0);
  if (closed) boards(g, 18, 20); return (cache[k] = c.toDataURL()); }
function boards(g, x, y) { const px = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(a, b, w, h); };
  for (let i = 0; i < 8; i++) { px(x + i, y + 1 + i, 2, 2, '#c98f55'); px(x + 7 - i, y + 1 + i, 2, 2, '#a86b38'); } px(x - 1, y + 3, 11, 2, '#d9a066'); px(x - 1, y + 5, 11, 1, OUT); }

// ---------- 🏡 cafe scene banner (128×56 px, scaled up crisp) ----------
function scene(id, {visited = false, closed = false, clk = V.clock()} = {}) {
  const W = 128, H = 56, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const night = clk.phase === 'night', dusk = clk.phase === 'dusk', dawn = clk.phase === 'dawn', season = clk.season, T = V.tiles(season, clk.lit), R = J.rng(J.hash(id) ^ 0x5ce4e);
  const sky = night ? ['#1c2150', '#2a3070', '#3a3f86'] : dusk ? ['#f08a5a', '#f8b07a', '#ffd6a0'] : dawn ? ['#f6b8c8', '#ffd8d8', '#fff0d8'] : season === 'winter' ? ['#9cc4e4', '#b8d6ee', '#d4e8f6'] : ['#6ec0f0', '#8fd2f6', '#b8e4fa'];
  px(0, 0, W, 12, sky[0]); px(0, 12, W, 10, sky[1]); px(0, 22, W, 14, sky[2]);
  if (night) { for (let i = 0; i < 26; i++) px((R() * W) | 0, (R() * 26) | 0, 1, 1, R() < .3 ? '#fff6c8' : '#c8d0ff'); px(104, 5, 7, 7, '#fff3c0'); px(106, 5, 5, 5, '#2a3070'); px(103, 6, 1, 5, '#fff3c0'); }
  else { px(14, 6, 6, 6, '#fff6b0'); px(13, 7, 8, 4, '#fff6b0'); px(15, 7, 3, 2, '#ffffff'); // sun
    [[30, 8], [78, 4], [104, 12]].forEach(([x, y]) => { px(x, y + 2, 16, 3, '#ffffff'); px(x + 3, y, 8, 3, '#ffffff'); px(x + 8, y + 1, 6, 2, '#ffffff'); px(x + 1, y + 5, 14, 1, '#dbeef8'); }); }
  // hills
  const hill = season === 'winter' ? ['#d8e6f0', '#c0d4e4'] : season === 'autumn' ? ['#b8a050', '#9a8a40'] : ['#5aa83c', '#4a9a32'];
  for (let x = 0; x < W; x++) { const h1 = 30 + Math.round(Math.sin(x / 13) * 2 + Math.sin(x / 5.3) * 1), h2 = 33 + Math.round(Math.sin(x / 9 + 2) * 1.5); px(x, h1, 1, 40 - h1, night ? '#2f4a3a' : hill[1]); px(x, h2, 1, 40 - h2, night ? '#3a5a44' : hill[0]); }
  // ground tiles
  for (let y = 36; y < H; y += 16) for (let x = 0; x < W; x += 16) g.drawImage((R() < .22 ? T.flowers[(R() * 2) | 0] : T.grass[(R() * 4) | 0]), x, y);
  // path from door
  for (let y = 46; y < H; y += 16) g.drawImage(T.dirt, 64, y); px(62, 46, 2, 10, T.edgeD); px(80, 46, 2, 10, T.edgeD);
  // trees + bushes + fence + lamp
  const tree = x => { g.drawImage(T.trunk, x, 32); g.drawImage(T.canopy, x, 22); };
  tree(4); tree(22); tree(100); g.drawImage(T.bush, 86, 38); g.drawImage(T.fence, 32, 40); g.drawImage(T.lamp, 84, 30);
  // shop
  const s = V.shop(id, visited, season, clk.lit); g.drawImage(s, 48, 14);
  if (closed) boards(g, 66, 34);
  if (clk.lit && visited && !closed) { const gr = g.createRadialGradient(64, 40, 2, 64, 40, 34); gr.addColorStop(0, 'rgba(255,220,120,.45)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gr; g.fillRect(28, 10, 72, 46); }
  if (night || dusk) { g.fillStyle = night ? 'rgba(40,50,120,.28)' : 'rgba(255,140,80,.12)'; g.fillRect(0, 0, W, H); }
  return c;
}
function sceneHtml(c, opts) { return `<div class="vl-scene${opts.closed ? ' closed' : ''}" id="vlScene" aria-hidden="true"></div>`; }
function mountScene(el, id, opts) { if (!el) return; const cv = scene(id, opts); cv.className = 'vl-scene-cv'; el.appendChild(cv);
  if (!opts.closed && !(opts.clk || V.clock()).lit) { // a chicken pecks around the yard
    const ck = document.createElement('div'); ck.className = 'vl-scene-ck'; const a = V.critter('chicken', 0), b = V.critter('chicken', 1), cc = document.createElement('canvas'); cc.width = 14; cc.height = 12; cc.getContext('2d').drawImage(a, 0, 0); ck.appendChild(cc); el.appendChild(ck);
    let f = 0; const t = setInterval(() => { if (!ck.isConnected) return clearInterval(t); const g = cc.getContext('2d'); g.clearRect(0, 0, 14, 12); g.drawImage((f = 1 - f) ? b : a, 0, 0); }, 420); }
}

// ---------- 🎬 title / loading screen (once per session; skipped under automation unless ?splash) ----------
function splash(force) {
  try { if (!force && (sessionStorage.getItem('mcc.splash') || navigator.webdriver)) return; sessionStorage.setItem('mcc.splash', '1'); } catch (e) { if (!force) return; }
  const el = document.createElement('div'); el.id = 'vlSplash'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="sp-sky"></div><div class="sp-logo"><div class="sp-t1">墨尔本咖啡</div><div class="sp-t2">打卡物语</div><div class="sp-en">MELBOURNE CAFE VALLEY</div></div>
    <div class="sp-stage"></div><div class="sp-load"><div class="sp-bar"><i></i></div><div class="sp-tip">正在烘焙咖啡豆…</div></div>`;
  const st = el.querySelector('.sp-stage'), clk = V.clock();
  const sc = scene('splash-town', {visited: true, clk: {...clk, phase: 'day', lit: false}}); sc.className = 'sp-scene'; st.appendChild(sc);
  const hc = document.createElement('canvas'); hc.width = hc.height = 16; hc.className = 'sp-hero'; st.appendChild(hc); let f = 0;
  const tips = ['正在烘焙咖啡豆…', '正在给小镇浇花…', '咖啡师正在打奶泡…'];
  const t = setInterval(() => { V.drawHero(hc, 'right', [0, 1, 0, 2][f++ % 4]); }, 140); V.drawHero(hc, 'right', 0);
  setTimeout(() => { const tip = el.querySelector('.sp-tip'); if (tip) tip.textContent = tips[1 + ((Math.random() * 2) | 0)]; }, 700);
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), force ? 2600 : 1500);
  setTimeout(() => { clearInterval(t); el.remove(); }, force ? 3100 : 2000);
}
window.PixUI = {icon, url, img, installVars, shopUrl, scene, sceneHtml, mountScene, splash, ICONS};
})();
