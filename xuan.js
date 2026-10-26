// ⚔️ 古风 (ink-wash wuxia RPG) skin for the JRPG theme — ORIGINAL procedural art only (canvas paths, no sprites / logos / UI art from any game).
// Hand-painted 2.5D look: aged xuan paper, celadon & indigo washes, shanshui mountains in mist, stone paths, pavilions/teahouses with tiled roofs + lanterns.
(() => {
'use strict';
const C = {paper: '#ece0c4', paper2: '#e2d3ae', paperD: '#cdb98e', ink: '#1f1a17', ink2: '#3b332c', inkW: 'rgba(31,26,23,', cel: '#93b4a0', celD: '#5f8775', celL: '#bcd2bd',
  ind: '#3a5670', indL: '#7f9bb0', och: '#b98a4c', ochD: '#8a5f2e', cin: '#b3342b', cinD: '#7e1f1a', gold: '#c9a45a', wood: '#3a2418', woodL: '#6b4426', tile: '#3d4852', tileL: '#5d6a74', jade: '#7fae95'};
const on = () => document.documentElement.dataset.xuan === '1';
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const SERIF = '"Kaiti SC","STKaiti","KaiTi","BiauKai","Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC","Noto Serif SC",serif';
// ---------- 🎨 painted raster assets (original, generated for this app; img/xuan/*.webp, lazy per area) ----------
const BASE = 'img/xuan/', KINDS = ['teahouse', 'inn', 'pavilion', 'shop', 'water', 'tower'], BG = {city: 'city', richmond: 'richmond', northmel: 'northmel', brunswick: 'brunswick'};
const IMG = {}, ok = im => !!im && im.complete && im.naturalWidth > 0;
function img(name) { if (IMG[name]) return IMG[name]; const im = new Image(); im.decoding = 'async'; im.src = BASE + name + '.webp'; IMG[name] = im; return im; }
const mix = id => { let h = hash(id) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b) >>> 0; h ^= h >>> 13; return h >>> 0; };
const kindOf = id => KINDS[mix(id) % KINDS.length], flip = id => ((mix(id) >>> 5) & 1) === 1;
let _pre = false; function preload() { if (_pre) return; _pre = true; KINDS.forEach(k => img('b-' + k)); img('hero').addEventListener('load', () => heroCanvases.forEach((a, cv) => drawHero(cv, a[0], a[1]))); img('keeper'); }
const heroCanvases = new Map();

// ---------- brush helpers ----------
function blob(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
const rgba = hex => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},A)`; };
function paperTex(g, w, h, seed = 5) { const R = rng(seed); g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 2600; i++) blob(g, R() * w, R() * h, 20 + R() * 90, R() < .5 ? 'rgba(205,185,142,A)' : 'rgba(246,238,218,A)', .25 + R() * .25);
  for (let i = 0; i < (w * h) / 90; i++) { g.fillStyle = `rgba(${R() < .5 ? '120,95,60' : '255,250,235'},${R() * .09})`; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1); } }
// shanshui ridge: layered peaks fading into mist at their base
function mountains(g, x0, x1, base, hMax, seed, layers = 3, cols = [C.celL, C.cel, C.ind]) {
  const R = rng(seed);
  for (let L = 0; L < layers; L++) {
    const top = base - hMax * (1 - L * .22), col = cols[Math.min(L, cols.length - 1)], pts = [];
    let x = x0 - 20; while (x < x1 + 20) { const w = 30 + R() * 70, pk = top + R() * hMax * .45 + L * hMax * .12; pts.push([x, base], [x + w * (.35 + R() * .3), pk], [x + w, base - R() * hMax * .15]); x += w * (.55 + R() * .3); }
    g.save(); g.beginPath(); g.moveTo(x0 - 20, base + 4); pts.forEach(([px, py], i) => { if (i % 3 === 1) { const [ax] = pts[i - 1], [bx, by] = pts[i + 1]; g.quadraticCurveTo(px - (px - ax) * .2, py, px, py); g.quadraticCurveTo(px + (bx - px) * .25, py + (by - py) * .1, bx, by); } });
    g.lineTo(x1 + 20, base + 4); g.closePath();
    const gr = g.createLinearGradient(0, top, 0, base); gr.addColorStop(0, rgba(col).replace('A', .95 - L * .12)); gr.addColorStop(.55, rgba(col).replace('A', .55 - L * .08)); gr.addColorStop(1, rgba(C.paper).replace('A', 0));
    g.fillStyle = gr; g.fill();
    g.strokeStyle = C.inkW + (.55 - L * .12) + ')'; g.lineWidth = 1.4 - L * .3; g.stroke(); // ink contour (勾)
    // texture strokes (皴): short dry-brush ticks on the slopes
    g.clip(); g.strokeStyle = C.inkW + (.22 - L * .05) + ')'; g.lineWidth = .8;
    for (let i = 0; i < (x1 - x0) / 7; i++) { const sx = x0 + R() * (x1 - x0), sy = top + R() * (base - top) * .7; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 3, sy + 4, sx + 1 + R() * 4, sy + 7 + R() * 6); g.stroke(); }
    g.restore();
  }
  const mg = g.createLinearGradient(0, base - hMax * .35, 0, base + 6); mg.addColorStop(0, 'rgba(250,246,234,0)'); mg.addColorStop(1, 'rgba(250,246,234,.95)'); g.fillStyle = mg; g.fillRect(x0 - 20, base - hMax * .35, x1 - x0 + 40, hMax * .35 + 8); // mist
}
function inkTree(g, x, y, s, R, kind = 'dot') { // 点叶 / 松
  g.strokeStyle = C.ink2; g.lineWidth = 1.6 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - .5) * 4 * s, y - 6 * s, x + (R() - .5) * 3 * s, y - 11 * s); g.stroke();
  if (kind === 'pine') { for (let i = 0; i < 4; i++) { const yy = y - 6 * s - i * 3.6 * s, w = (9 - i * 1.6) * s; g.fillStyle = i % 2 ? '#2f4a3c' : '#3f5e4a'; g.beginPath(); g.ellipse(x, yy, w, 2.2 * s, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.inkW + '.5)'; g.lineWidth = .6; g.stroke(); } return; }
  const cols = kind === 'plum' ? ['#c4574d', '#d98a80', '#b3342b'] : ['#4f6e58', '#3d5a47', '#6f8f73', '#2e463a'];
  for (let i = 0; i < 22; i++) { const a = R() * Math.PI * 2, r = R() * 7 * s; g.fillStyle = rgba(cols[(R() * cols.length) | 0]).replace('A', .55 + R() * .4); g.beginPath(); g.ellipse(x + Math.cos(a) * r, y - 12 * s + Math.sin(a) * r * .75, (1.4 + R() * 1.6) * s, (1 + R()) * s, R() * 3, 0, Math.PI * 2); g.fill(); }
}
// ---------- 🏯 pavilion / teahouse / inn (64x64, painted) ----------
const _pav = {};
function roof(g, cx, y, w, h, col, curl = 5) { // upturned eaves
  g.beginPath(); g.moveTo(cx - w / 2 - curl, y + h - curl * .9); g.quadraticCurveTo(cx - w / 2 + 2, y + h + 1, cx - w * .3, y + h * .55); g.quadraticCurveTo(cx - w * .16, y + 1, cx, y); g.quadraticCurveTo(cx + w * .16, y + 1, cx + w * .3, y + h * .55);
  g.quadraticCurveTo(cx + w / 2 - 2, y + h + 1, cx + w / 2 + curl, y + h - curl * .9); g.quadraticCurveTo(cx, y + h * 1.25, cx - w / 2 - curl, y + h - curl * .9); g.closePath();
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col[1]); gr.addColorStop(1, col[0]); g.fillStyle = gr; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.1; g.stroke();
  g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = .8; for (let x = cx - w / 2; x < cx + w / 2; x += 3.2) { g.beginPath(); g.moveTo(cx + (x - cx) * .25, y + 1); g.lineTo(x, y + h + 2); g.stroke(); } g.restore();
  g.fillStyle = C.ink; g.fillRect(cx - w * .18, y - 1.2, w * .36, 2); g.beginPath(); g.arc(cx - w * .19, y - .5, 1.5, 0, 7); g.arc(cx + w * .19, y - .5, 1.5, 0, 7); g.fill(); // ridge + ornaments
}
function lantern(g, x, y, lit, s = 1) { g.strokeStyle = C.ink; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y - 3 * s); g.lineTo(x, y - 1.5 * s); g.stroke();
  if (lit) blob(g, x, y + 1.5 * s, 9 * s, 'rgba(255,190,90,A)', .55);
  g.fillStyle = lit ? '#d8432f' : '#7a3a30'; g.beginPath(); g.ellipse(x, y + 1.6 * s, 2.6 * s, 3.1 * s, 0, 0, 7); g.fill(); g.strokeStyle = C.ink; g.stroke();
  g.fillStyle = C.gold; g.fillRect(x - 1.6 * s, y - 1.6 * s, 3.2 * s, .9 * s); g.fillRect(x - 1.6 * s, y + 4.4 * s, 3.2 * s, .9 * s); g.fillRect(x - .3, y + 5.2 * s, .6, 2 * s); }
function pavilionProc(id, lit, closed = false, k = 1) {
  const key = id + '|' + (lit ? 1 : 0) + (closed ? 'c' : '') + k; if (_pav[key]) return _pav[key];
  const R = rng(hash(id) ^ 0x5a17), kind = (Math.abs(hash(id)) >> 2) % 3, [c, g] = mk(64 * k, 64 * k); g.scale(k, k);
  const roofC = [[C.tile, C.tileL], ['#2f4b46', '#557a70'], ['#4a3a2e', '#7a604a']][(R() * 3) | 0], pillar = lit ? C.cin : '#8a5a4e', wall = lit ? '#f3e7c9' : '#d9ccb0';
  blob(g, 32, 58, 26, 'rgba(40,30,20,A)', .32); // ink-wash ground shadow
  g.fillStyle = '#a49c8a'; g.beginPath(); g.moveTo(9, 55); g.lineTo(55, 55); g.lineTo(52, 59); g.lineTo(12, 59); g.closePath(); g.fill(); g.strokeStyle = C.ink2; g.lineWidth = .8; g.stroke(); // stone plinth
  g.fillStyle = '#c9c0aa'; g.fillRect(10, 52.5, 44, 3); g.strokeRect(10, 52.5, 44, 3);
  const body = (x, y, w, h) => { g.fillStyle = wall; g.fillRect(x, y, w, h); g.strokeStyle = C.ink; g.lineWidth = .9; g.strokeRect(x, y, w, h);
    // lattice windows (paper glow when lit)
    const ww = (w - 10) / 2; [[x + 3, y + 3], [x + w - 3 - ww, y + 3]].forEach(([wx, wy]) => { g.fillStyle = lit ? '#ffe2a2' : '#bfb397'; g.fillRect(wx, wy, ww, h - 7); g.strokeStyle = C.woodL; g.lineWidth = .6;
      for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(wx + ww * i / 3, wy); g.lineTo(wx + ww * i / 3, wy + h - 7); g.stroke(); } for (let j = 1; j < 3; j++) { g.beginPath(); g.moveTo(wx, wy + (h - 7) * j / 3); g.lineTo(wx + ww, wy + (h - 7) * j / 3); g.stroke(); } g.strokeStyle = C.ink; g.strokeRect(wx, wy, ww, h - 7); });
    g.fillStyle = pillar; g.fillRect(x - 1, y, 2.4, h); g.fillRect(x + w - 1.4, y, 2.4, h); g.fillRect(x + w / 2 - 1.2, y, 2.4, h);
    g.fillStyle = C.wood; g.fillRect(x + w / 2 - 4, y + h - 9, 8, 9); g.fillStyle = lit ? '#6b4426' : '#4a3a30'; g.fillRect(x + w / 2 - 3, y + h - 8, 6, 8); };
  if (kind === 0) { // two-storey teahouse (重檐)
    body(14, 40, 36, 13); roof(g, 32, 31, 46, 10, roofC, 5); body(19, 24, 26, 8); roof(g, 32, 14, 36, 11, roofC, 5);
    lantern(g, 12, 41, lit); lantern(g, 52, 41, lit);
  } else if (kind === 1) { // inn with tea banner (旗)
    body(12, 38, 40, 15); roof(g, 32, 26, 50, 13, roofC, 6);
    g.strokeStyle = C.ink2; g.lineWidth = 1.4; g.beginPath(); g.moveTo(56, 53); g.lineTo(56, 12); g.stroke();
    g.fillStyle = lit ? '#efe2bf' : '#cfc3a6'; g.beginPath(); g.moveTo(56, 14); g.lineTo(45, 15); g.quadraticCurveTo(46, 23, 44.5, 32); g.lineTo(56, 31); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.lineWidth = .7; g.stroke();
    g.fillStyle = C.cin; g.fillRect(44.6, 14.5, 11.4, 2); g.fillStyle = C.ink; g.font = `bold 9px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('茶', 50.5, 24);
    lantern(g, 16, 39, lit); lantern(g, 40, 39, lit);
  } else { // open pavilion (亭) on a terrace
    g.fillStyle = pillar; [14, 23, 41, 50].forEach(x => g.fillRect(x - 1.2, 30, 2.6, 23)); g.fillStyle = C.wood; g.fillRect(12, 46, 40, 2.4); g.fillRect(12, 50, 40, 1.4);
    g.fillStyle = 'rgba(255,226,162,' + (lit ? .55 : .15) + ')'; g.fillRect(15, 32, 34, 14);
    g.fillStyle = C.wood; g.fillRect(27, 40, 10, 6); g.fillStyle = '#f3efe4'; g.beginPath(); g.ellipse(32, 39.6, 3, 1.4, 0, 0, 7); g.fill(); // tea table + cup
    roof(g, 32, 13, 50, 18, roofC, 6); g.fillStyle = C.gold; g.beginPath(); g.moveTo(32, 6); g.lineTo(34, 12); g.lineTo(30, 12); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.stroke();
    lantern(g, 9, 33, lit); lantern(g, 55, 33, lit);
  }
  if (lit) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .9; for (let i = 0; i < 2; i++) { const sx = 20 + i * 22; g.beginPath(); g.moveTo(sx, 9); g.quadraticCurveTo(sx + 3, 5, sx, 2); g.stroke(); } } // tea steam
  if (closed) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(120,110,95,.45)'; g.fillRect(0, 0, 64 * k, 64 * k); g.globalCompositeOperation = 'source-over'; }
  return (_pav[key] = c);
}
// painted building on a canvas (dex / encounter); unlit = ink-grey with a paper tint. Falls back to the procedural pavilion until the art has loaded.
const _paint = {};
function pavilion(id, lit, closed = false, k = 1) {
  preload(); const im = img('b-' + kindOf(id)); if (!ok(im)) return pavilionProc(id, lit, closed, k);
  const key = id + '|' + (lit ? 1 : 0) + (closed ? 'c' : '') + k; if (_paint[key]) return _paint[key];
  const S = 64 * k, [c, g] = mk(S, S);
  g.fillStyle = 'rgba(40,28,14,.22)'; g.beginPath(); g.ellipse(S / 2, S * .93, S * .38, S * .06, 0, 0, 7); g.fill();
  if (flip(id)) { g.translate(S, 0); g.scale(-1, 1); } g.drawImage(im, 0, 0, S, S); g.setTransform(1, 0, 0, 1, 0, 0);
  if (!lit || closed) { // ink-grey wash for not-yet-visited (per-pixel, keeps transparency intact on every engine)
    try { const d = g.getImageData(0, 0, S, S), p = d.data, keep = closed ? 0 : .2, tr = closed ? [128, 118, 104] : [236, 226, 204], ta = closed ? .4 : .22;
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const y = p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11;
      for (let c = 0; c < 3; c++) p[i + c] = (y + (p[i + c] - y) * keep) * (1 - ta) + tr[c] * ta; }
    g.putImageData(d, 0, 0); } catch (e) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(200,192,176,.55)'; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; } }
  return (_paint[key] = c);
}
const iconUrl = (id) => BASE + 'b-' + kindOf(id) + '.webp'; // real map: the painted building itself (unvisited ones are desaturated in CSS)

// ---------- 🗡️ hero: a young wanderer in an indigo robe (32x32 per frame, original) ----------
function drawHero(cv, dir = 'down', frame = 0) {
  preload(); heroCanvases.set(cv, [dir, frame]); if (heroCanvases.size > 24) heroCanvases.delete(heroCanvases.keys().next().value);
  const hi = img('hero'); if (ok(hi)) { const g = cv.getContext('2d'), S = cv.width; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, cv.height);
    g.fillStyle = 'rgba(30,20,10,.3)'; g.beginPath(); g.ellipse(S / 2, S * .955, S * .22, S * .045, 0, 0, 7); g.fill();
    const bob = frame ? (frame === 1 ? -S * .025 : S * .01) : 0, tilt = frame ? (frame === 1 ? .05 : -.05) : 0; g.translate(S / 2, S * .96); g.rotate(tilt); if (dir === 'left') g.scale(-1, 1);
    if (dir === 'up') g.globalAlpha = .96; g.drawImage(hi, -S / 2, -S * .96 + bob, S, S); g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); return; }
  drawHeroProc(cv, dir, frame); }
function drawHeroProc(cv, dir = 'down', frame = 0) {
  const k = cv.width / 32, g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.scale(k, k);
  const flip = dir === 'left'; if (flip) { g.translate(32, 0); g.scale(-1, 1); }
  const side = dir === 'left' || dir === 'right', back = dir === 'up', st = frame ? (frame === 1 ? 1 : -1) : 0;
  g.fillStyle = 'rgba(30,20,10,.28)'; g.beginPath(); g.ellipse(16, 30, 8, 2.2, 0, 0, 7); g.fill();
  g.fillStyle = C.ink; g.fillRect(12 + st * 1.5, 25, 3, 5); g.fillRect(17 - st * 1.5, 25, 3, 5); // boots
  g.fillStyle = back ? '#2c4258' : C.ind; g.beginPath(); g.moveTo(10, 14); g.lineTo(22, 14); g.lineTo(24 + (side ? 1 : 0), 27); g.lineTo(8, 27); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.lineWidth = .9; g.stroke(); // robe
  if (!back) { g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(13, 14); g.lineTo(16, 19); g.lineTo(19, 14); g.closePath(); g.fill(); } // collar
  g.fillStyle = C.cin; g.fillRect(9.5, 19, 13, 2.2); g.fillRect(side ? 9 : 19, 21, 1.6, 4); // sash
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.5; g.beginPath(); if (side) { g.moveTo(9, 22); g.lineTo(3, 17); } else { g.moveTo(22, 15); g.lineTo(26, 26); } g.stroke(); // sword scabbard
  g.fillStyle = '#f1cfa8'; g.beginPath(); g.arc(16, 9, 5.2, 0, 7); g.fill(); g.strokeStyle = C.ink; g.lineWidth = .8; g.stroke(); // face
  g.fillStyle = C.ink; g.beginPath(); if (back) g.arc(16, 9, 5.4, 0, 7); else { g.arc(16, 8, 5.4, Math.PI * 1.02, Math.PI * 1.98); } g.fill(); g.beginPath(); g.arc(16, 2.6, 2.4, 0, 7); g.fill(); // hair + topknot
  g.fillStyle = C.cin; g.fillRect(13.5, 4, 5, 1.2); // headband
  if (!back) { g.fillStyle = C.ink; if (side) g.fillRect(18.5, 9, 1.3, 1.6); else { g.fillRect(13.4, 9, 1.3, 1.6); g.fillRect(17.4, 9, 1.3, 1.6); } }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// ---------- dialogue portrait: teahouse keeper (64x64) ----------
let _face = null;
function portrait() { preload(); const ki = img('keeper'); if (ok(ki)) { if (_face && _face.width === 256) return _face; const [c, g] = mk(256, 256); g.drawImage(ki, 0, 0, 256, 256); return (_face = c); }
  return portraitProc(); }
function portraitProc() { if (_face) return _face; const [c, g] = mk(128, 128); g.scale(2, 2); paperTex(g, 64, 64, 9); mountains(g, 0, 64, 40, 18, 3, 2);
  g.fillStyle = C.celD; g.beginPath(); g.moveTo(8, 64); g.quadraticCurveTo(14, 42, 32, 40); g.quadraticCurveTo(50, 42, 56, 64); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(25, 42); g.lineTo(32, 54); g.lineTo(39, 42); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#f1cfa8'; g.beginPath(); g.ellipse(32, 28, 11, 13, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = C.ink; g.beginPath(); g.ellipse(32, 20, 12.5, 8, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(32, 10, 5.5, 0, 7); g.fill();
  g.strokeStyle = C.gold; g.lineWidth = 1.4; g.beginPath(); g.moveTo(24, 9); g.lineTo(41, 11); g.stroke(); g.fillStyle = C.cin; g.beginPath(); g.arc(41, 11, 1.8, 0, 7); g.fill(); // hairpin
  g.strokeStyle = C.ink; g.lineWidth = 1.3; g.beginPath(); g.moveTo(25, 28); g.quadraticCurveTo(28, 26, 30, 28.5); g.moveTo(34, 28.5); g.quadraticCurveTo(36, 26, 39, 28); g.stroke();
  g.fillStyle = '#c4574d'; g.beginPath(); g.ellipse(32, 35.5, 2.4, 1.1, 0, 0, 7); g.fill();
  return (_face = c); }
// ---------- 宝匣 reward box (64x64) ----------
function box(open, k = 1) { const [c, g] = mk(64 * k, 64 * k); g.scale(k, k); blob(g, 32, 56, 26, 'rgba(40,30,20,A)', .3);
  if (open) { blob(g, 32, 26, 26, 'rgba(255,214,120,A)', .8); g.fillStyle = C.cinD; g.beginPath(); g.moveTo(12, 30); g.lineTo(52, 30); g.lineTo(46, 12); g.lineTo(18, 12); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.stroke(); }
  g.fillStyle = C.cin; g.fillRect(12, 32, 40, 22); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.strokeRect(12, 32, 40, 22);
  g.strokeStyle = C.gold; g.lineWidth = 1.4; g.strokeRect(15, 35, 34, 16); g.beginPath(); g.arc(32, 43, 4, 0, 7); g.stroke();
  if (!open) { g.fillStyle = C.cinD; g.fillRect(10, 26, 44, 7); g.strokeStyle = C.ink; g.strokeRect(10, 26, 44, 7); g.fillStyle = C.gold; g.fillRect(29, 30, 6, 6); }
  return c; }

// ---------- 🗺️ painted region map: hand-painted backdrop + soft earthen paths (canvas at 3x the 16px grid) ----------
const GK = 3;
function bgPaint(g, im, W, H) { // cover, anchored low so the mountains crown the top edge
  const r = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.06, w = im.naturalWidth * r, h = im.naturalHeight * r;
  g.drawImage(im, (W - w) / 2, (H - h) * .78, w, h);
}
function paintPaths(g, region, M, TS, k) {
  if (!region || !region.streets) return;
  const P = k * TS / 32, tx = x => (x - M.vx) * P, ty = y => (M.vy !== undefined ? (y - M.vy) * P : y);
  const R = rng(hash(M.id) ^ 0x2b2b), sts = region.streets.filter(st => st.pts && st.pts.length > 1);
  const trace = st => { g.beginPath(); st.pts.forEach(([x, y], i) => { const X = tx(x), Y = ty(y); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); };
  const wid = st => Math.max(10, st.w * .82) * P;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // 1 soft trodden shoulder (blurred via shadow so WebKit gets it too) + a slightly wobbly earthen bed
  g.shadowColor = 'rgba(60,44,22,.4)'; g.shadowBlur = 8 * k;
  sts.forEach(st => { trace(st); g.strokeStyle = 'rgba(110,88,52,.20)'; g.lineWidth = wid(st) * 1.15; g.stroke(); });
  g.shadowBlur = 5 * k; g.shadowColor = 'rgba(206,186,140,.8)';
  sts.forEach(st => { trace(st); g.strokeStyle = 'rgba(200,180,134,.62)'; g.lineWidth = wid(st) * .78; g.stroke(); });
  g.shadowBlur = 0;
  sts.forEach(st => { g.save(); g.translate((R() - .5) * 2 * k, (R() - .5) * 2 * k); trace(st); g.strokeStyle = 'rgba(226,212,178,.42)'; g.lineWidth = wid(st) * .42; g.stroke(); g.restore(); });
  // 2 flagstones / pebbles scattered along each path
  sts.forEach(st => { const big = st.w >= 28; for (let i = 1; i < st.pts.length; i++) { const [ax, ay] = st.pts[i - 1], [bx, by] = st.pts[i], L = Math.hypot(bx - ax, by - ay) * P, n = L / (big ? 7 : 11) / k * 2;
    for (let j = 0; j < n; j++) { const t = R(), off = (R() - .5) * wid(st) * .8, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
      const X = tx(ax + (bx - ax) * t) + nx / nl * off, Y = ty(ay + (by - ay) * t) + ny / nl * off, w = (big ? 3.2 : 2.4) * k * (.6 + R() * .7);
      g.fillStyle = ['rgba(168,150,118,.55)', 'rgba(150,134,104,.5)', 'rgba(190,174,140,.6)', 'rgba(120,104,80,.35)'][(R() * 4) | 0];
      g.beginPath(); g.ellipse(X, Y, w, w * .62, R() * 3, 0, 7); g.fill(); } } });
  // 3 grass tufts nibbling the edges so the paths sit IN the painting
  g.strokeStyle = 'rgba(70,98,52,.55)'; g.lineWidth = .9 * k;
  sts.forEach(st => { for (let i = 1; i < st.pts.length; i++) { const [ax, ay] = st.pts[i - 1], [bx, by] = st.pts[i], L = Math.hypot(bx - ax, by - ay) * P, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
    for (let j = 0; j < L / (9 * k); j++) { const t = R(), sd = R() < .5 ? -1 : 1, X = tx(ax + (bx - ax) * t) + nx / nl * sd * wid(st) * .5, Y = ty(ay + (by - ay) * t) + ny / nl * sd * wid(st) * .5;
      for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(X + q * k, Y); g.quadraticCurveTo(X + q * k + k, Y - 2 * k, X + q * k + (R() - .3) * 3 * k, Y - (3 + R() * 3) * k); g.stroke(); } } } });
  g.restore();
}
function grade(g, W, H) { // warm key light from the upper-left + gentle vignette so everything feels lit
  const lg = g.createRadialGradient(W * .18, H * .08, 0, W * .18, H * .08, Math.max(W, H) * .9); lg.addColorStop(0, 'rgba(255,226,170,.22)'); lg.addColorStop(.5, 'rgba(255,226,170,.06)'); lg.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .42, W / 2, H * .55, Math.max(W, H) * .78); vg.addColorStop(0, 'rgba(40,30,18,0)'); vg.addColorStop(1, 'rgba(40,30,18,.34)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
function paintGround(M, TS, region) {
  const {cols, rows} = M, W = cols * TS * GK, H = rows * TS * GK, [cv, g] = mk(W, H); cv.className = 'px-ground px-layer xu-ground';
  paperTex(g, W, H, hash(M.id)); // placeholder while the painting streams in
  const im = img('bg-' + (BG[M.id] || 'city'));
  const paint = () => { g.clearRect(0, 0, W, H); bgPaint(g, im, W, H); paintPaths(g, region, M, TS, GK); grade(g, W, H); cv.dataset.painted = '1'; };
  if (ok(im)) paint(); else { im.addEventListener('load', paint, {once: true}); im.addEventListener('error', () => { mountains(g, 0, W, H * .3, H * .25, 7, 3); paintPaths(g, region, M, TS, GK); }, {once: true}); }
  return cv;
}
// painted building for a cafe (DOM <img>, so the browser decodes at full device resolution)
function cafeNode(id, lit) {
  const im = document.createElement('img'); im.className = 'px-cafe xu-b' + (flip(id) ? ' flip' : ''); im.alt = ''; im.draggable = false; im.decoding = 'async';
  im.src = BASE + 'b-' + kindOf(id) + '.webp'; return im;
}
// animated layer + label/overlap management
function decorate({world, M, W, H, sprites, visited}) {
  const CS = KIT_CS, cafes = sprites.filter(o => o.id), hero = sprites.find(o => o.hero);
  // 1) relax clustered buildings apart so none sit on top of each other
  for (let it = 0; it < 60; it++) { let moved = false;
    for (let i = 0; i < cafes.length; i++) for (let j = i + 1; j < cafes.length; j++) { const a = cafes[i], b = cafes[j], dx = b.x - a.x, dy = b.y - a.y, mx = CS * .78, my = CS * .56;
      if (Math.abs(dx) < mx && Math.abs(dy) < my) { const px = mx - Math.abs(dx), py = my - Math.abs(dy);
        if (px / mx < py / my) { const d = (dx >= 0 ? 1 : -1) * px / 2 * .6; a.x -= d; b.x += d; } else { const d = (dy >= 0 ? 1 : -1) * py / 2 * .6; a.y -= d; b.y += d; } moved = true; } }
    cafes.forEach(o => { o.x = Math.max(CS * .42, Math.min(W - CS * .42, o.x)); o.y = Math.max(CS * .9, Math.min(H - 6, o.y)); }); if (!moved) break; }
  // 2) a proper-sized hero
  if (hero) { hero.w = hero.h = 30; hero.ax = 15; hero.ay = 27; }
  // 3) name plaques: seal number + name on one silk tag; long Latin names shrink instead of sprawling
  world.querySelectorAll('.px-mk').forEach(mkEl => { const no = mkEl.querySelector('.px-no'), nm = mkEl.querySelector('.px-name'); if (!no || !nm) return;
    const t = document.createElement('span'); t.className = 'xu-plq'; mkEl.appendChild(t); t.appendChild(no); t.appendChild(nm); const len = nm.textContent.length; if (len > 14) t.classList.add('long'); if (len > 20) t.classList.add('xlong');
    const glow = document.createElement('i'); glow.className = 'xu-glow'; mkEl.prepend(glow); });
  world.querySelectorAll('.px-street').forEach(l => { l.textContent = l.textContent.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\bStreet\b/, 'St').replace(/\bRoad\b/, 'Rd').replace(/\bParade\b/, 'Pde'); });
  // 4) atmosphere: drifting mist banks, falling petals, god-rays, cranes
  const d = document.createElement('div'); d.className = 'xu-sky px-layer'; const R = rng(hash(M.id) ^ 0x1717);
  let petals = ''; for (let i = 0; i < 14; i++) petals += `<i class="xu-pt" style="left:${(R() * 100).toFixed(1)}%;animation-delay:${(-R() * 16).toFixed(1)}s;animation-duration:${(11 + R() * 9).toFixed(1)}s;--dx:${(20 + R() * 60).toFixed(0)}px;--sc:${(.6 + R() * .7).toFixed(2)}"></i>`;
  d.innerHTML = '<i class="xu-rays"></i><i class="xu-mist m1"></i><i class="xu-mist m2"></i><i class="xu-mist m3"></i>' + petals + '<svg class="xu-crane c1" viewBox="0 0 40 16"><path d="M2 9 Q10 2 19 8 Q28 2 38 7 M19 8 l2 3" fill="none" stroke="#2a2018" stroke-width="1.6" stroke-linecap="round"/></svg><svg class="xu-crane c2" viewBox="0 0 40 16"><path d="M2 9 Q10 2 19 8 Q28 2 38 7 M19 8 l2 3" fill="none" stroke="#2a2018" stroke-width="1.6" stroke-linecap="round"/></svg>';
  world.appendChild(d);
  // collision-avoided plaque placement (runs after every layout / zoom)
  const place = s => {
    const boxes = cafes.map(o => { const w = CS * s, h = CS * s, x = (o.x - CS / 2) * s, y = (o.y - (CS - 4)) * s; return {x: x + w * .12, y: y + h * .08, w: w * .76, h: h * .86}; });
    if (hero) boxes.push({x: (hero.x - hero.ax) * s, y: (hero.y - hero.ay) * s, w: hero.w * s, h: hero.h * s}); // keep the hero's face clear too
    const plq = []; const area = (r, b) => Math.max(0, Math.min(r.x + r.w, b.x + b.w) - Math.max(r.x, b.x)) * Math.max(0, Math.min(r.y + r.h, b.y + b.h) - Math.max(r.y, b.y));
    const cost = (r, own) => boxes.reduce((a, b, k) => a + (k === own ? 0 : area(r, b)), 0) + plq.reduce((a, b) => a + area({x: r.x - 2, y: r.y - 1, w: r.w + 4, h: r.h + 2}, b) * 12, 0);
    const order = cafes.map((o, i) => i).sort((a, b) => cafes[a].y - cafes[b].y);
    order.forEach(i => { const o = cafes[i], t = o.el.querySelector('.xu-plq'); if (!t) return; const pw = t.offsetWidth || 60, ph = t.offsetHeight || 18, bw = CS * s, bh = CS * s, ox = (o.x - CS / 2) * s, oy = (o.y - (CS - 4)) * s;
      const cx = bw / 2 - pw / 2, cand = [];
      [[bh - ph * .35, 0], [-ph * .55, 0], [bh + ph * .75, 0], [-ph * 1.6, 0]].forEach(([ly, pr]) => [0, -.35, .35, -.7, .7].forEach(f => cand.push([cx + f * pw, ly, Math.abs(f) * 3 + pr])));
      [[bw * .82, bh * .5 - ph / 2], [bw * .18 - pw, bh * .5 - ph / 2], [bw * .82, bh * .2], [bw * .18 - pw, bh * .2], [bw * .82, bh * .8 - ph / 2], [bw * .18 - pw, bh * .8 - ph / 2]].forEach(([lx, ly]) => cand.push([lx, ly, 2]));
      let best = null, bs = 1e12; cand.forEach(([lx, ly, pen], ci) => { let x = ox + lx, y = oy + ly; x = Math.max(2, Math.min(W * s - pw - 2, x)); y = Math.max(2, Math.min(H * s - ph - 2, y)); const r = {x, y, w: pw, h: ph}, sc = cost(r, i) + pen * 40 + ci * .5; if (sc < bs) { bs = sc; best = r; } });
      t.style.left = Math.round(best.x - ox) + 'px'; t.style.top = Math.round(best.y - oy) + 'px'; plq.push(best); });
  };
  let lastS = 1, gone = false; const run = () => { if (gone || !world.isConnected) return; place(lastS); world.dataset.plq = '1'; };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(run)); // re-place once Kaiti/Songti metrics are final
  return {critters: 0, layout: s => { lastS = s; requestAnimationFrame(run); }, remove() { gone = true; d.remove(); }};
}
const KIT_CS = 50;
function kit() { preload(); return {name: 'xuan', cafeSize: KIT_CS, cover: true, cafeSprite: (id, lit) => pavilion(id, lit, false, 2), cafeNode, drawHero, heroRes: 96, paintGround, decorate, cozy: false, tiles: undefined}; }

// ---------- 🧊 3D: the same painting as a ground texture + a standing mountain backdrop ----------
const loaded = im => ok(im) ? Promise.resolve() : new Promise(r => { im.addEventListener('load', r, {once: true}); im.addEventListener('error', r, {once: true}); setTimeout(r, 6000); });
function sceneCanvas(region, w = 1536, pad = 60) { // pad: the diorama sheet extends 60 svg units past the viewBox
  const [vx0, vy0, vw0, vh0] = region.vb, vx = vx0 - pad, vy = vy0 - pad, vw = vw0 + pad * 2, vh = vh0 + pad * 2, H = Math.round(w * vh / vw), [cv, g] = mk(w, H), im = img('bg-' + (BG[region.id] || 'city'));
  return loaded(im).then(() => { if (ok(im)) bgPaint(g, im, w, H); else paperTex(g, w, H, 3); paintPaths(g, region, {vx, vy, id: region.id}, 16, w / vw * 2); grade(g, w, H); return cv; });
}
function skyCanvas(region) {
  const im = img('bg-' + (BG[region.id] || 'city'));
  return loaded(im).then(() => { if (!ok(im)) return null; const iw = im.naturalWidth, ih = im.naturalHeight, [cv, g] = mk(1024, 440);
    g.drawImage(im, 0, 0, iw, ih * .46, 0, 0, 1024, 440);
    g.globalCompositeOperation = 'destination-out'; const fd = g.createLinearGradient(0, 220, 0, 440); fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fd; g.fillRect(0, 0, 1024, 440);
    const sx = g.createLinearGradient(0, 0, 1024, 0); sx.addColorStop(0, 'rgba(0,0,0,.9)'); sx.addColorStop(.12, 'rgba(0,0,0,0)'); sx.addColorStop(.88, 'rgba(0,0,0,0)'); sx.addColorStop(1, 'rgba(0,0,0,.9)'); g.fillStyle = sx; g.fillRect(0, 0, 1024, 440);
    g.globalCompositeOperation = 'source-over'; return cv; });
}

// ---------- 📜 title screen: painted key art + a hanging title scroll ----------
function splash(force) {
  try { if (!force && (sessionStorage.getItem('mcc.splash') || navigator.webdriver)) return; sessionStorage.setItem('mcc.splash', '1'); } catch (e) { if (!force) return; }
  const el = document.createElement('div'); el.id = 'xuSplash'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<img class="xs-paint" src="${BASE}title.webp" alt=""><i class="xs-veil"></i><i class="xs-mist"></i><div class="xs-scroll"><div class="xs-title">咖啡游记</div><div class="xs-sub">墨尔本 · 寻香卷</div><div class="xs-seal">寻<br>香</div></div>
    <div class="xs-foot"><div class="xs-en">MELBOURNE CAFÉ · A WANDERER'S SCROLL</div><div class="xs-press">轻触开卷</div></div>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 700); };
  el.addEventListener('click', close); setTimeout(close, force ? 60000 : 3600);
}
if (on()) preload();
window.Xuan = {on, C, SERIF, pavilion, iconUrl, drawHero, portrait, box, paintGround, decorate, kit, splash, mountains, paperTex, preload, img: n => BASE + n + '.webp', kindOf, sceneCanvas, skyCanvas, ready: () => Promise.all(['hero', 'keeper', ...KINDS.map(k => 'b-' + k)].map(n => { const im = img(n); return ok(im) ? 1 : new Promise(r => { im.addEventListener('load', r, {once: true}); im.addEventListener('error', r, {once: true}); }); }))};
})();
