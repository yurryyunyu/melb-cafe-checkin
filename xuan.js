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
function pavilion(id, lit, closed = false, k = 1) {
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
const _url = {};
const iconUrl = (id, lit, closed) => { const k = id + (lit ? 1 : 0) + (closed ? 'c' : ''); return _url[k] || (_url[k] = pavilion(id, lit, closed, 2).toDataURL()); };

// ---------- 🗡️ hero: a young wanderer in an indigo robe (32x32 per frame, original) ----------
function drawHero(cv, dir = 'down', frame = 0) {
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
function portrait() { if (_face) return _face; const [c, g] = mk(128, 128); g.scale(2, 2); paperTex(g, 64, 64, 9); mountains(g, 0, 64, 40, 18, 3, 2);
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

// ---------- 🗺️ ink-wash ground for the region map (2x res of the 16px tile grid) ----------
function paintGround(M, TS) {
  const P = TS * 2, {G, cols, rows} = M, W = cols * P, H = rows * P, [cv, g] = mk(W, H); cv.className = 'px-ground px-layer xu-ground';
  const R = rng(hash(M.id) ^ 0x3c3c), at = (c, r) => (G[r] && G[r][c]) || 'x', land = t => t !== 'w' && t !== 'x';
  paperTex(g, W, H, hash(M.id));
  // celadon meadow washes (pale, uneven like 没骨 colour)
  for (let i = 0; i < cols * rows / 3; i++) { const c = (R() * cols) | 0, r = (R() * rows) | 0; if (!land(at(c, r)) || at(c, r) === 'r' || at(c, r) === 'd') continue; blob(g, (c + .5) * P, (r + .5) * P, P * (1 + R() * 1.6), R() < .88 ? 'rgba(147,180,160,A)' : 'rgba(185,138,76,A)', .2 + R() * .14); }
  // shanshui ridge across the top edge + misty hills in the far corners
  mountains(g, 0, W, P * 3.1, P * 3.2, hash(M.id) ^ 0x71, 3);
  mountains(g, -P, P * 5, H - P * .2, P * 2.2, hash(M.id) ^ 0x19, 2, [C.celL, C.cel]);
  // water: indigo-celadon wash with ink ripple lines and shore contour
  const wc = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (at(c, r) === 'w') wc.push([c, r]);
  g.save(); g.beginPath(); wc.forEach(([c, r]) => { g.moveTo((c + .5) * P + P * .78, (r + .5) * P); g.arc((c + .5) * P, (r + .5) * P, P * .78, 0, Math.PI * 2); }); g.fillStyle = '#a9c0bf'; g.fill();
  g.clip(); for (let i = 0; i < wc.length / 2; i++) { const [c, r] = wc[(R() * wc.length) | 0]; blob(g, (c + .5) * P, (r + .5) * P, P * 1.6, 'rgba(58,86,112,A)', .22); }
  g.strokeStyle = 'rgba(58,86,112,.55)'; g.lineWidth = 1; wc.forEach(([c, r], i) => { if (i % 2) return; const x = c * P + R() * P * .4, y = r * P + P * (.3 + R() * .4); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + P * .3, y - 3, x + P * .5, y + 3, x + P * .9, y); g.stroke(); });
  g.restore();
  g.strokeStyle = C.inkW + '.6)'; g.lineWidth = 1.3; wc.forEach(([c, r]) => { const x = c * P, y = r * P; [[0, -1, x, y, x + P, y], [0, 1, x, y + P, x + P, y + P], [-1, 0, x, y, x, y + P], [1, 0, x + P, y, x + P, y + P]].forEach(([dc, dr, ax, ay, bx, by]) => {
    if (!land(at(c + dc, r + dr))) return; g.beginPath(); g.moveTo(ax + dr * 0 + dc * -P * .22, ay + dr * -P * .22); g.quadraticCurveTo((ax + bx) / 2 - dc * P * .3, (ay + by) / 2 - dr * P * .3, bx + dc * -P * .22, by + dr * -P * .22); g.stroke(); }); });
  // stone paths: packed earth bed + flagstones with ink outlines
  const road = t => t === 'r' || t === 'd' || t === 'c';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const t = at(c, r); if (t !== 'r' && t !== 'd') continue; g.fillStyle = t === 'r' ? '#ddd2b6' : '#e2d3ad'; g.fillRect(c * P - 1, r * P - 1, P + 2, P + 2); }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const t = at(c, r); if (t !== 'r' && t !== 'd') continue; const n = t === 'r' ? 3 : 1;
    for (let i = 0; i < n; i++) { const sx = c * P + 3 + R() * (P - 12), sy = r * P + 3 + R() * (P - 12), w = 7 + R() * 7, h = 5 + R() * 5;
      g.fillStyle = ['#c9c1ab', '#bdb59f', '#d2cab4', '#b3ab96'][(R() * 4) | 0]; g.beginPath(); g.ellipse(sx + w / 2, sy + h / 2, w / 2, h / 2, R() * .6, 0, 7); g.fill(); g.strokeStyle = C.inkW + '.35)'; g.lineWidth = .7; g.stroke(); }
    g.strokeStyle = C.inkW + '.5)'; g.lineWidth = 1.1; const X = c * P, Y = r * P; // path edge lines where it meets land
    [[0, -1, X, Y, X + P, Y], [0, 1, X, Y + P, X + P, Y + P], [-1, 0, X, Y, X, Y + P], [1, 0, X + P, Y, X + P, Y + P]].forEach(([dc, dr, ax, ay, bx, by]) => { if (road(at(c + dc, r + dr)) || at(c + dc, r + dr) === 'x') return; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx + (R() - .5) * 2, by + (R() - .5) * 2); g.stroke(); }); }
  // houses (粉墙黛瓦), bamboo fences, grass tufts, plum blossoms, trees
  const items = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) items.push([r, c, at(c, r)]);
  items.forEach(([r, c, t]) => { const X = c * P, Y = r * P, top = r < 3;
    if (t === 'h') { const w = P * .78, h = P * .38, x = X + P * .11, y = Y + P * .5; g.fillStyle = 'rgba(40,30,20,.18)'; g.fillRect(x + 2, y + h, w, 3); g.fillStyle = '#f2ecdc'; g.fillRect(x, y, w, h); g.strokeStyle = C.ink2; g.lineWidth = .8; g.strokeRect(x, y, w, h);
      g.fillStyle = C.wood; g.fillRect(x + w * .42, y + h * .35, w * .16, h * .65); roof(g, X + P / 2, Y + P * .24, P * .86, P * .28, [C.tile, C.tileL], 3); }
    else if (t === 'n') { g.strokeStyle = '#7d8a4e'; g.lineWidth = 1.2; for (let x = X + 3; x < X + P; x += 6) { g.beginPath(); g.moveTo(x, Y + P * .8); g.lineTo(x, Y + P * .35); g.stroke(); } g.beginPath(); g.moveTo(X, Y + P * .5); g.lineTo(X + P, Y + P * .52); g.stroke(); }
    else if (t === 'q') { g.strokeStyle = C.inkW + '.55)'; g.lineWidth = .8; for (let i = 0; i < 5; i++) { const x = X + R() * P, y = Y + P * .5 + R() * P * .4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2, y - 5, x + 4 + R() * 3, y - 8); g.stroke(); } }
    else if (t === 'f') { for (let i = 0; i < 4; i++) { g.fillStyle = R() < .5 ? 'rgba(196,87,77,.8)' : 'rgba(240,226,200,.95)'; g.beginPath(); g.arc(X + R() * P, Y + R() * P, 1.4, 0, 7); g.fill(); } }
    else if ((t === 't' || t === 'p') && !top) { inkTree(g, X + P * .5, Y + P * .9, 1.15, R, t === 'p' ? 'pine' : (R() < .1 ? 'plum' : 'dot')); if (R() < .4) inkTree(g, X + P * (.2 + R() * .6), Y + P * .75, .8, R, 'dot'); } });
  // mist bands (云气) + aged-paper vignette
  for (let i = 0; i < 3; i++) { const y = H * (.3 + i * .25) + (R() - .5) * P * 2, gr = g.createLinearGradient(0, y - P, 0, y + P); gr.addColorStop(0, 'rgba(250,246,234,0)'); gr.addColorStop(.5, 'rgba(250,246,234,.42)'); gr.addColorStop(1, 'rgba(250,246,234,0)'); g.fillStyle = gr; g.fillRect(0, y - P, W, P * 2); }
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(120,90,50,0)'); vg.addColorStop(1, 'rgba(120,90,50,.28)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return cv;
}
// animated layer: drifting mist + a pair of cranes (pure CSS on DOM nodes)
function decorate({world}) {
  const d = document.createElement('div'); d.className = 'xu-sky px-layer';
  d.innerHTML = '<i class="xu-mist m1"></i><i class="xu-mist m2"></i><i class="xu-mist m3"></i><svg class="xu-crane c1" viewBox="0 0 40 16"><path d="M2 9 Q10 2 19 8 Q28 2 38 7 M19 8 l2 3" fill="none" stroke="#1f1a17" stroke-width="1.6" stroke-linecap="round"/></svg><svg class="xu-crane c2" viewBox="0 0 40 16"><path d="M2 9 Q10 2 19 8 Q28 2 38 7 M19 8 l2 3" fill="none" stroke="#1f1a17" stroke-width="1.6" stroke-linecap="round"/></svg>';
  world.appendChild(d); return {critters: 0, remove() { d.remove(); }};
}
function kit() { return {name: 'xuan', cafeSize: 42, cafeSprite: (id, lit) => pavilion(id, lit, false, 2), drawHero, heroRes: 48, paintGround, decorate, cozy: false, tiles: undefined}; }

// ---------- 📜 title screen: a scroll unrolls over a painted landscape ----------
function splash(force) {
  try { if (!force && (sessionStorage.getItem('mcc.splash') || navigator.webdriver)) return; sessionStorage.setItem('mcc.splash', '1'); } catch (e) { if (!force) return; }
  const el = document.createElement('div'); el.id = 'xuSplash'; el.setAttribute('aria-hidden', 'true');
  const w = Math.min(window.innerWidth || 390, 520), h = window.innerHeight || 844, [cv, g] = mk(w * 2, h * 2); cv.className = 'xs-paint'; g.scale(2, 2);
  paperTex(g, w, h, 21); blob(g, w * .72, h * .2, 34, 'rgba(179,52,43,A)', .85); g.fillStyle = 'rgba(179,52,43,.88)'; g.beginPath(); g.arc(w * .72, h * .2, 22, 0, 7); g.fill(); // red sun
  mountains(g, 0, w, h * .52, h * .2, 41, 3); mountains(g, 0, w, h * .74, h * .14, 43, 3, [C.cel, C.celD, C.ind]);
  const R = rng(77); for (let i = 0; i < 6; i++) inkTree(g, 20 + R() * (w - 40), h * .8 + R() * 30, 1.8, R, i % 3 ? 'pine' : 'dot');
  const pv = pavilion('title-teahouse', true, false, 3); g.drawImage(pv, w * .12, h * .62, 96, 96);
  g.strokeStyle = C.ink; g.lineWidth = 1.6; [[.2, .3], [.28, .27]].forEach(([fx, fy]) => { const x = w * fx, y = h * fy; g.beginPath(); g.moveTo(x - 9, y + 3); g.quadraticCurveTo(x - 4, y - 3, x, y + 2); g.quadraticCurveTo(x + 4, y - 3, x + 9, y + 2); g.stroke(); });
  el.appendChild(cv);
  el.insertAdjacentHTML('beforeend', `<div class="xs-scroll"><div class="xs-title">咖啡游记</div><div class="xs-sub">墨尔本 · 寻香卷</div><div class="xs-seal">寻<br>香</div></div>
    <div class="xs-en">MELBOURNE CAFE · A WANDERER'S SCROLL</div><div class="xs-press">— 轻触开卷 —</div>`);
  document.body.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 700); };
  el.addEventListener('click', close); setTimeout(close, force ? 60000 : 3200);
}
window.Xuan = {on, C, SERIF, pavilion, iconUrl, drawHero, portrait, box, paintGround, decorate, kit, splash, mountains, paperTex};
})();
