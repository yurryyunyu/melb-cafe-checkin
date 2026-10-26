// 🗡️ JRPG theme kit: original pixel art (drawn in code), 8-bit SFX (WebAudio), typewriter dialogue, encounter / chest / level-up screens.
(() => {
'use strict';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const XU = () => !!(window.Xuan && window.Xuan.on()); // ⚔️ 古风 skin active
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---------- palette + string sprites (all original) ----------
const PAL = {k: '#1a1c2c', h: '#8a4b2a', H: '#c27141', s: '#f7c9a3', S: '#d99a75', w: '#ffffff', b: '#3b5dc9', B: '#29366f', y: '#ffcd75', Y: '#fff3a0',
  p: '#5d3a1a', o: '#333c57', r: '#b13e53', g: '#38b764', G: '#257179', m: '#b13e53', a: '#a05b2c', W: '#b86f50', D: '#733e39', x: '#e4a672', c: '#f4f4f4'};
const HEAD_DOWN = ['................', '.....kkkkkk.....', '....kHHHHHHk....', '...kHhhhhhhhk...', '...khhhhhhhhk...', '...khhsssshhk...', '...kssksskssk...', '...kssksskssk...', '...kSssssssSk...', '....kkSSSSkk....'];
const HEAD_UP = ['................', '.....kkkkkk.....', '....kHHHHHHk....', '...kHhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhhk...', '...kHhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhhk...', '....kkhhhhkk....'];
const HEAD_SIDE = ['................', '.....kkkkkk.....', '....kHHHHHHk....', '...kHhhhhhhhk...', '...khhhhhhhhk...', '...kssshhhhhk...', '...kskssshhhk...', '...kskssshhhk...', '...kSsssshhk....', '....kkSSSkk.....'];
const BODY_FRONT = ['...krrrrrrrrk...', '..kbbbbrrbbbbk..', '..ksbbbyybbbsk..', '...kbbbbbbbbk...'];
const BODY_BACK = ['...krrrrrrrrk...', '..kbbbbbbbbbbk..', '..ksbbbyybbbsk..', '...kbbbbbbbbk...'];
const BODY_SIDE = ['....krrrrrrk....', '....kbbbbbbk....', '....ksbbbbbk....', '....kbbbbbbk....'];
const LEGS_F = [['....kppkkppk....', '....koo..ook....'], ['....kppkkppk....', '....koo..kk.....'], ['....kppkkppk....', '.....kk..ook....']];
const LEGS_S = [['....kppppk......', '....koook.......'], ['...kpp..ppk.....', '...koo...ook....'], ['....kppppk......', '....koook.......']];
const BARISTA = ['................', '.....kkkkkk.....', '....kggggggk....', '...kggGgGgggk...', '...kkkkkkkkkk...', '...khsssssshk...', '...kssksskssk...', '...kssksskssk...', '...kSssmmssSk...', '....kkSSSSkk....',
  '...kwwwwwwwwk...', '..kwwaaaaaawwk..', '..kswaaaaaawsk..', '...kaaaaaaaak...', '...kaaaaaaaak...', '...kkkkkkkkkk...'];
const CHEST = ['................', '................', '................', '...kkkkkkkkkk...', '..kxWWWWWWWWxk..', '..kWWWWWWWWWWk..', '..kyyyyyyyyyyk..', '..kkkkkyykkkkk..', '..kWWWWyyWWWWk..',
  '..kWWWWkkWWWWk..', '..kWWWWWWWWWWk..', '..kyyyyyyyyyyk..', '..kWWWWWWWWWWk..', '..kDDDDDDDDDDk..', '..kkkkkkkkkkkk..', '................'];
const CHEST_OPEN = ['...kkkkkkkkkk...', '..kxWWWWWWWWxk..', '..kWWWWWWWWWWk..', '..kyyyyyyyyyyk..', '..kDDDDDDDDDDk..', '..kkkkkkkkkkkk..', '..kooYYYYYYook..', '..kyyyyyyyyyyk..', '..kWWWWyyWWWWk..',
  '..kWWWWkkWWWWk..', '..kWWWWWWWWWWk..', '..kyyyyyyyyyyk..', '..kWWWWWWWWWWk..', '..kDDDDDDDDDDk..', '..kkkkkkkkkkkk..', '................'];
function paint(g, rows, ox = 0, oy = 0, flip = false) {
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[flip ? row.length - 1 - x : x]; if (ch !== '.' && PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(ox + x, oy + y, 1, 1); } } });
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
function fromRows(rows) { const [c, g] = mk(rows[0].length, rows.length); paint(g, rows); return c; }

// hero sheet: 3 frames (stand, walkA, walkB) x 4 dirs (down, left, right, up), 16x16 each
let _hero = null;
function heroSheet() {
  if (_hero) return _hero;
  const [c, g] = mk(48, 64);
  const dirs = [['down', HEAD_DOWN, BODY_FRONT, LEGS_F, false], ['left', HEAD_SIDE, BODY_SIDE, LEGS_S, false], ['right', HEAD_SIDE, BODY_SIDE, LEGS_S, true], ['up', HEAD_UP, BODY_BACK, LEGS_F, false]];
  dirs.forEach(([, head, body, legs, flip], d) => [0, 1, 2].forEach(f => paint(g, [...head, ...body, ...legs[f]], f * 16, d * 16, flip)));
  return (_hero = c);
}
const DIRS = {down: 0, left: 1, right: 2, up: 3};
function drawHero(canvas, dir = 'down', frame = 0) { const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 16, 16); g.drawImage(heroSheet(), frame * 16, DIRS[dir] * 16, 16, 16, 0, 0, 16, 16); }

// cafe buildings (24x24), procedural: roof colour / awning / lit windows / chimney steam
const ROOFS = [['#b13e53', '#7a2a3d'], ['#3b5dc9', '#29366f'], ['#38b764', '#257179'], ['#a05b2c', '#6b3a1f'], ['#5d275d', '#3d1a3d'], ['#ef7d57', '#b13e53']];
const _cafe = {};
function cafeSprite(id, lit) {
  const key = id + (lit ? 1 : 0); if (_cafe[key]) return _cafe[key];
  const R = rng(hash(id)), [roof, roofD] = ROOFS[(R() * ROOFS.length) | 0], awning = R() < 0.5, [c, g] = mk(24, 24);
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px(3, 22, 18, 2, 'rgba(20,40,20,.35)'); // ground shadow
  px(16, 1, 3, 5, '#5a5a6e'); px(16, 1, 3, 1, PAL.k); // chimney
  if (lit) { px(17, 0, 1, 1, '#fff'); px(18, 0, 1, 1, '#d9e2ff'); }
  px(6, 3, 12, 1, PAL.k); px(4, 4, 16, 1, PAL.k); // roof outline top
  for (let y = 5; y < 12; y++) { const inset = Math.max(0, 4 - (y - 4) * 2); px(1 + inset, y, 22 - inset * 2, 1, (y % 2) ? roof : roofD); }
  px(5, 4, 14, 1, roof); px(1, 12, 22, 1, PAL.k); px(0, 11, 1, 2, PAL.k); px(23, 11, 1, 2, PAL.k);
  px(3, 13, 18, 9, '#f4e4c1'); px(2, 13, 1, 9, PAL.k); px(21, 13, 1, 9, PAL.k); px(2, 21, 20, 1, PAL.k); // walls
  px(3, 13, 18, 1, '#a05b2c');
  const win = lit ? '#ffe066' : '#333c57';
  [[5, 15], [15, 15]].forEach(([x, y]) => { px(x - 1, y - 1, 6, 6, PAL.k); px(x, y, 4, 4, win); px(x + 1, y, 1, 4, PAL.k); px(x, y + 1, 4, 1, PAL.k); if (lit) px(x, y, 1, 1, '#fff8c4'); });
  px(10, 15, 4, 6, PAL.k); px(11, 16, 2, 5, '#5d3a1a'); px(12, 18, 1, 1, PAL.y); // door
  if (awning) for (let x = 9; x < 15; x++) px(x, 14, 1, 1, x % 2 ? '#fff' : roof);
  px(10, 7, 4, 3, '#fff'); px(14, 8, 1, 1, '#fff'); px(11, 8, 2, 1, '#7a4a32'); // cup emblem on roof
  return (_cafe[key] = c);
}

// ---------- tiles (16x16, procedural) ----------
let _tiles = null;
function tiles() {
  if (_tiles) return _tiles;
  const T = {}, R = rng(777);
  const tile = (fn) => { const [c, g] = mk(16, 16); fn(g, (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }); return c; };
  const grassBase = (g, px, seed) => { const r = rng(seed); px(0, 0, 16, 16, '#5fb547'); for (let i = 0; i < 14; i++) px((r() * 16) | 0, (r() * 16) | 0, 1, 1, r() < .5 ? '#4e9e3a' : '#78cc5a'); for (let i = 0; i < 3; i++) { const x = (r() * 14) | 0, y = (r() * 13 + 2) | 0; px(x, y, 1, 2, '#3f8a30'); px(x + 2, y, 1, 2, '#3f8a30'); px(x + 1, y - 1, 1, 2, '#3f8a30'); } };
  T.grass = [1, 2, 3, 4].map(s => tile((g, px) => grassBase(g, px, s)));
  T.flowers = [5, 6].map(s => tile((g, px) => { grassBase(g, px, s); const r = rng(s * 9); for (let i = 0; i < 4; i++) { const x = 2 + (r() * 12) | 0, y = 2 + (r() * 12) | 0, col = ['#f4f4f4', '#ffcd75', '#ef7d57', '#f0a0d0'][i % 4]; px(x, y, 2, 2, col); px(x, y + 2, 1, 1, '#3f8a30'); } }));
  T.tall = tile((g, px) => { grassBase(g, px, 8); for (let x = 1; x < 16; x += 4) for (let y = 3; y < 16; y += 5) { px(x, y, 1, 3, '#2f7a28'); px(x + 1, y - 1, 1, 3, '#3f8a30'); px(x + 2, y, 1, 3, '#2f7a28'); } });
  T.tree = tile((g, px) => { grassBase(g, px, 11); px(3, 13, 10, 2, 'rgba(0,40,0,.35)'); px(7, 10, 2, 4, '#6b4423'); px(2, 2, 12, 9, '#12401b'); px(3, 1, 10, 11, '#12401b'); px(3, 2, 10, 8, '#2f8a3a'); px(4, 1, 8, 10, '#2f8a3a'); px(4, 2, 4, 3, '#49b04f'); px(5, 2, 2, 1, '#7fd67f'); px(9, 7, 3, 2, '#1f6a2c'); px(4, 8, 3, 1, '#1f6a2c'); });
  T.pine = tile((g, px) => { grassBase(g, px, 12); px(7, 12, 2, 3, '#6b4423'); [[1, 7, 2], [3, 5, 6], [6, 3, 10]].forEach(([y0, hw, h]) => { for (let i = 0; i < 4; i++) px(8 - hw + i, y0 + h - 4 + i - 2, (hw - i) * 2, 1, '#1f6a2c'); }); px(5, 4, 6, 8, '#1f6a2c'); px(6, 2, 4, 3, '#2f8a3a'); px(4, 8, 8, 4, '#2f8a3a'); px(6, 5, 2, 2, '#49b04f'); px(4, 11, 8, 1, '#12401b'); });
  T.dirt = tile((g, px) => { px(0, 0, 16, 16, '#d8b878'); const r = rng(21); for (let i = 0; i < 16; i++) px((r() * 16) | 0, (r() * 16) | 0, 1, 1, r() < .6 ? '#c49a5a' : '#ead29c'); });
  T.stone = tile((g, px) => { px(0, 0, 16, 16, '#8c8577'); const r = rng(31); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -2 : 0; x < 16; x += 5) { px(x + 1, y + 1, 4, 3, r() < .5 ? '#c9c2b2' : '#b9b2a4'); px(x + 1, y + 1, 3, 1, '#ddd6c6'); } });
  T.water = [0, 1].map(f => tile((g, px) => { px(0, 0, 16, 16, '#3d7fd9'); for (let y = 2; y < 16; y += 5) for (let x = (y + f * 3) % 8; x < 16; x += 8) { px(x, y, 3, 1, '#8cc4ff'); px(x + 3, y + 1, 2, 1, '#6aa7f0'); } }));
  T.house = ROOFS.map(([roof, roofD]) => tile((g, px) => { grassBase(g, px, 14); px(1, 15, 14, 1, 'rgba(0,40,0,.35)'); px(1, 2, 14, 1, PAL.k); for (let y = 3; y < 8; y++) px(0 + (y < 4 ? 1 : 0), y, 16 - (y < 4 ? 2 : 0), 1, y % 2 ? roof : roofD); px(0, 8, 16, 1, PAL.k);
    px(2, 9, 12, 6, '#f4e4c1'); px(1, 9, 1, 6, PAL.k); px(14, 9, 1, 6, PAL.k); px(1, 14, 14, 1, PAL.k); px(7, 10, 3, 4, '#5d3a1a'); px(3, 10, 3, 2, '#333c57'); px(11, 10, 2, 2, '#333c57'); }));
  T.fence = tile((g, px) => { grassBase(g, px, 15); px(0, 7, 16, 1, '#a05b2c'); px(0, 11, 16, 1, '#a05b2c'); for (let x = 1; x < 16; x += 5) px(x, 5, 2, 9, '#c27141'); });
  return (_tiles = T);
}

// ---------- 8-bit SFX (off by default) ----------
const SFX = {
  on: lsGet('mcc.sound', false), ctx: null,
  set(v) { this.on = !!v; lsSet('mcc.sound', this.on); if (this.on) { this.ensure(); this.play('confirm'); } document.querySelectorAll('[data-snd]').forEach(b => { b.textContent = this.on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', this.on); }); },
  ensure() { try { if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { this.ctx = null; } return this.ctx; },
  tone(f, t, d, type = 'square', v = 0.05) { const c = this.ctx, o = c.createOscillator(), a = c.createGain(); o.type = type; o.frequency.value = f; a.gain.setValueAtTime(v, t); a.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(a).connect(c.destination); o.start(t); o.stop(t + d + 0.02); },
  pluck(f, t, d, v) { const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), a = c.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + .05); o2.frequency.value = f * 2.004;
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + .006); a.gain.exponentialRampToValueAtTime(0.0001, t + d); const a2 = c.createGain(); a2.gain.value = .3; o.connect(a); o2.connect(a2).connect(a); a.connect(c.destination); o.start(t); o2.start(t); o.stop(t + d + .02); o2.stop(t + d + .02); },
  play(name) {
    if (!this.on || !this.ensure()) return; const t = this.ctx.currentTime + 0.01;
    const seq = {blip: [[988, .04]], confirm: [[659, .06], [988, .09]], step: [[180, .03, 'triangle', .03]],
      encounter: [[262, .07], [330, .07], [392, .07], [523, .07], [392, .07], [523, .16]],
      chest: [[523, .07], [659, .07], [784, .07], [1047, .07], [1319, .22]],
      fanfare: [[392, .12], [392, .12], [392, .12], [523, .36], [440, .12], [494, .12], [523, .45]],
      coin: [[988, .05], [1319, .14]], hit: [[220, .05, 'square', .06], [147, .12, 'square', .05]], harvest: [[523, .08], [784, .08], [1047, .16]], heart: [[659, .1], [880, .18]],
      sleep: [[523, .25], [440, .25], [392, .25], [330, .5], [392, .6]]}[name] || [];
    const soft = document.documentElement.dataset.skin === 'valley'; // cozy theme: gentle triangle/sine chimes
    if (XU()) { let at = t; seq.forEach(([f, d, ty, v]) => { this.pluck(f, at, Math.max(.18, d * 2.2), (v || 0.05) * 1.3); at += d; }); return; } // 古风: plucked-zither tones
    let at = t; seq.forEach(([f, d, ty, v]) => { if (soft) { this.tone(f, at, d * 1.4, ty === 'triangle' ? 'triangle' : 'sine', (v || 0.05) * 1.2); if (ty === undefined) this.tone(f * 2, at, d, 'triangle', 0.012); }
      else { this.tone(f, at, d * 0.95, ty, v); if (ty === undefined) this.tone(f / 2, at, d * 0.95, 'triangle', 0.035); } at += d; });
  },
};

// ---------- typewriter dialogue with NPC barista ----------
let dlgTimer = null, dlgHide = null;
function say(msg, ms = 2600, name = '咖啡师 小豆', face = null, faceBg = '') {
  let d = document.getElementById('dlg');
  if (!d) { d = document.createElement('div'); d.id = 'dlg'; d.className = 'jwin'; d.innerHTML = '<canvas class="dlg-face" width="16" height="16"></canvas><div class="dlg-body"><div class="dlg-name"></div><div class="dlg-text"></div></div><span class="dlg-next">▼</span>';
    document.body.appendChild(d);
    d.addEventListener('click', () => { if (d._full && d.querySelector('.dlg-text').textContent !== d._full) { clearInterval(dlgTimer); d.querySelector('.dlg-text').textContent = d._full; d.classList.add('done'); } else d.classList.remove('show'); }); }
  const fc = d.querySelector('.dlg-face'), src = face || (XU() ? window.Xuan.portrait() : fromRows(BARISTA)); fc.width = src.width; fc.height = src.height; const fg = fc.getContext('2d'); fg.imageSmoothingEnabled = false; fg.clearRect(0, 0, fc.width, fc.height); fg.drawImage(src, 0, 0); fc.style.background = faceBg || '';
  const txt = d.querySelector('.dlg-text'); d.querySelector('.dlg-name').textContent = name;
  clearInterval(dlgTimer); clearTimeout(dlgHide); d._at = Date.now(); d._full = String(msg); txt.textContent = ''; d.classList.remove('done'); d.classList.add('show');
  const chars = [...d._full]; let i = 0;
  dlgTimer = setInterval(() => { txt.textContent += chars[i++] || ''; if (i % 3 === 0) SFX.play('blip'); if (i >= chars.length) { clearInterval(dlgTimer); d.classList.add('done'); } }, 32);
  dlgHide = setTimeout(() => d.classList.remove('show'), ms + chars.length * 32);
}
function typeInto(el, text, speed = 34) { return new Promise(res => { const ch = [...text]; let i = 0; el.textContent = ''; const t = setInterval(() => { el.textContent += ch[i++] || ''; if (i >= ch.length) { clearInterval(t); res(); } }, speed); el._skip = () => { clearInterval(t); el.textContent = text; res(); }; }); }

// ---------- overlay screens ----------
function overlay() { let o = document.getElementById('jfx'); if (!o) { o = document.createElement('div'); o.id = 'jfx'; document.body.appendChild(o); } o.className = ''; o.classList.remove('hidden'); return o; }
function scaled(src, s) { const [c, g] = mk(src.width * s, src.height * s); g.drawImage(src, 0, 0, c.width, c.height); c.className = 'pxs'; return c; }

// "发现了 X！" encounter (battle-style intro). Resolves when the player picks ▶ 品尝.
function encounter(cafe, lit) {
  return new Promise(resolve => {
    const o = overlay(); o.className = 'enc';
    o.innerHTML = `<div class="enc-flash"></div><div class="enc-stage"><div class="enc-ground"></div></div>
      <div class="jwin enc-box"><div class="enc-text"></div><div class="jmenu enc-menu"><button class="jmenu-item on" id="encGo">${cafe.closed ? '回忆' : '品尝'}</button><button class="jmenu-item" id="encRun">稍后</button></div></div>`;
    o.querySelector('.enc-stage').appendChild(XU() ? window.Xuan.pavilion(cafe.id, lit, !!cafe.closed, 3) : scaled(cafeSprite(cafe.id, lit), 6));
    SFX.play('encounter');
    const text = o.querySelector('.enc-text');
    setTimeout(() => typeInto(text, cafe.closed ? `${cafe.name} 的旧址……往日的回忆浮现了！` : `发现了 ${cafe.name}！`), 450);
    const done = () => { o.classList.add('hidden'); o.innerHTML = ''; resolve(); };
    o.querySelector('#encGo').onclick = () => { SFX.play('confirm'); done(); };
    o.querySelector('#encRun').onclick = () => { SFX.play('blip'); done(); };
  });
}

const DRINK_ZH = [[/flat\s*white/i, '馥芮白'], [/latte/i, '拿铁'], [/cappuccino|cap\b/i, '卡布奇诺'], [/long\s*black/i, '长黑'], [/espresso/i, '浓缩'], [/piccolo/i, '短笛'], [/magic/i, '魔法'], [/mocha/i, '摩卡'],
  [/batch|filter|pour|v60|hand/i, '手冲'], [/cold\s*brew/i, '冷萃'], [/iced/i, '冰咖'], [/matcha/i, '抹茶'], [/chai/i, '印度奶茶'], [/hot\s*choc/i, '热可可'], [/croissant|可颂/i, '可颂'], [/toast|吐司/i, '吐司'], [/cake|蛋糕/i, '蛋糕'], [/egg|蛋/i, '早餐']];
function itemName(drink) { const d = String(drink || ''); const hit = DRINK_ZH.find(([re]) => re.test(d)); return (hit ? hit[1] : (/[\u4e00-\u9fff]/.test(d) ? d.slice(0, 6) : '咖啡')) + '之证'; }

// treasure chest reward. data: {cafe, gain, item, lines:[], isNew}. Uses #celebrate so the existing close/auto-close flow works.
function chest(el, data, onClose) {
  el.className = 'jrpg-cel';
  el.innerHTML = `<div class="chest-rays"></div><div class="jwin chest-box">
    <div class="cel-title">${data.isNew ? '据点解锁！' : '再次光临！'}</div>${data.cafe ? `<div class="cel-cafe">${esc(data.cafe)}</div>` : ''}
    <div class="chest-stage"></div><div class="chest-text"></div><div class="cel-xp hidden">+${data.gain} XP</div>
    <div class="chest-lines">${data.lines.join('')}</div>
    <div class="jmenu"><button class="jmenu-item on" id="celOk">收下</button></div></div>`;
  const stage = el.querySelector('.chest-stage'), closed = XU() ? window.Xuan.box(false, 2) : scaled(fromRows(CHEST), 5), opened = XU() ? window.Xuan.box(true, 2) : scaled(fromRows(CHEST_OPEN), 5);
  stage.appendChild(closed); stage.classList.add('shake');
  el.classList.remove('hidden');
  setTimeout(() => {
    if (!el.contains(stage)) return; // closed early
    stage.classList.remove('shake'); stage.classList.add('open'); stage.replaceChild(opened, closed); SFX.play('chest');
    el.querySelector('.cel-xp').classList.remove('hidden');
    typeInto(el.querySelector('.chest-text'), `XP +${data.gain}，获得 ${data.item}！`).then(() => el.querySelector('.chest-lines').classList.add('show'));
  }, 750);
  el.querySelector('#celOk').onclick = () => { SFX.play('confirm'); onClose(); };
}
function levelUp(el, info, onClose) {
  el.className = 'jrpg-cel lvup';
  el.innerHTML = `<div class="lv-burst"></div><div class="jwin lv-box"><div class="lv-title">LEVEL UP!</div><div class="lv-hero"></div>
    <div class="lv-row">Lv.${info.from} ▶ <b>Lv.${info.to}</b></div><div class="lv-row">称号：${esc(info.title)}</div>
    <div class="lv-row small">好奇心 +1　品味 +2　(HP 每晚 0 点回满)</div>
    <div class="jmenu"><button class="jmenu-item on" id="lvOk">继续冒险</button></div></div>`;
  const hc = document.createElement('canvas'); hc.width = hc.height = XU() ? 160 : 16; (XU() ? window.Xuan : {drawHero}).drawHero(hc, 'down', 0); el.querySelector('.lv-hero').appendChild(XU() ? hc : scaled(hc, 5));
  el.classList.remove('hidden'); SFX.play('fanfare');
  el.querySelector('#lvOk').onclick = () => { SFX.play('confirm'); onClose(); };
}

// exhausted pose: slump the hero down (sitting) + a sweat drop — works on any 16×16-based hero canvas (also the valley farmer)
function tire(canvas) {
  const w = canvas.width, h = canvas.height, k = w / 16, t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').drawImage(canvas, 0, 0);
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, w, h);
  g.drawImage(t, 0, 0, w, 11 * k, 0, 4 * k, w, 11 * k); // head + torso drop 4px
  g.drawImage(t, 0, 13 * k, w, 3 * k, -1 * k, 13 * k, w + 2 * k, 3 * k); // feet splay out → sitting
  g.fillStyle = '#d8f1ff'; g.fillRect(13 * k, 2 * k, k, k); g.fillStyle = '#7cc4f2'; g.fillRect(13 * k, 3 * k, k, k); g.fillStyle = '#3d8fd1'; g.fillRect(12 * k, 4 * k, 2 * k, k);
  canvas.dataset.tired = '1'; return canvas;
}
window.JRPG = {tire, rng, hash, PAL, fromRows, heroSheet, drawHero, cafeSprite, tiles, SFX, say, typeInto, encounter, chest, levelUp, itemName, scaled, BARISTA};
window.__sfx = SFX;
})();
