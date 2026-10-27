// 🛒 Coin shop catalog + cosmetics: farmer hats & outfits, decorations/pets for the pixel town. All art drawn in code (original).
(() => {
'use strict';
const V = window.Valley, J = window.JRPG; if (!V || !J) return;
const {Pix} = V, OUT = '#3a2414', SK = 'mcc.shop';
// price curve vs income (~50–100 coins per check-in, ~120–190 per day from quests):
// small decor ≈ 1–2 check-ins, mid items ≈ a day or two, premium ≈ 1–2 weeks of play.
const ITEMS = [
  {id: 'straw', kind: 'hat', name: '草帽', price: 0, desc: '出门必备的旧草帽', free: true},
  {id: 'beanie', kind: 'hat', name: '毛线帽', price: 150, desc: '冬天早上排队买咖啡用'},
  {id: 'beret', kind: 'hat', name: '贝雷帽', price: 300, desc: '画家风，适合手冲'},
  {id: 'flower', kind: 'hat', name: '花环', price: 420, desc: '春天限定心情'},
  {id: 'chef', kind: 'hat', name: '厨师帽', price: 650, desc: '自己也能烤可颂了'},
  {id: 'cowboy', kind: 'hat', name: '牛仔帽', price: 800, desc: '走遍墨尔本的冒险家'},
  {id: 'crown', kind: 'hat', name: '咖啡王冠', price: 1500, desc: '墨尔本咖啡之王'},
  {id: 'mortar', kind: 'hat', name: '咖啡学士帽', price: 0, edu: 8, desc: '咖啡课主线毕业礼物'},
  {id: 'classic', kind: 'outfit', name: '蓝色背带裤', price: 0, desc: '默认工作服', free: true, cols: null},
  {id: 'forest', kind: 'outfit', name: '森林绿', price: 300, desc: '和草地一个颜色', cols: [[95, 158, 74], [63, 110, 50]]},
  {id: 'berry', kind: 'outfit', name: '莓果红', price: 400, desc: '像一杯莓果奶昔', cols: [[208, 82, 112], [140, 50, 80]]},
  {id: 'barista', kind: 'outfit', name: '咖啡师围裙', price: 550, desc: '深焙色，耐脏', cols: [[140, 92, 52], [92, 58, 30]]},
  {id: 'lavender', kind: 'outfit', name: '薰衣草紫', price: 600, desc: '傍晚散步专用', cols: [[150, 112, 204], [100, 70, 150]]},
  {id: 'cupcoat', kind: 'outfit', name: '杯测白袍', price: 0, edu: 7, desc: '咖啡课第 7 章奖励', cols: [[236, 236, 228], [176, 176, 168]]},
  {id: 'wandercoat', kind: 'outfit', name: '雨巷旅人外套', price: 0, story: 5, desc: '主线第 5 章奖励', cols: [[92, 108, 132], [58, 70, 92]]},
  {id: 'oldapron', kind: 'outfit', name: '旧帆布围裙', price: 0, npc: 'master', desc: '隐藏角色白先生的礼物', cols: [[120, 132, 100], [78, 88, 64]]},
  {id: 'gold', kind: 'outfit', name: '金色礼服', price: 1200, desc: '全镇最闪亮的人', cols: [[240, 192, 64], [190, 132, 24]]},
  {id: 'bench', kind: 'decor', name: '木长椅', price: 80, desc: '坐下来喝完这杯', w: 16, h: 16},
  {id: 'flowerbed', kind: 'decor', name: '花坛', price: 120, desc: '一年四季都开花', w: 16, h: 16},
  {id: 'lantern', kind: 'decor', name: '小路灯', price: 250, desc: '晚上会亮起来', w: 16, h: 16, glow: true},
  {id: 'scarecrow', kind: 'decor', name: '稻草人', price: 350, desc: '守护咖啡豆田', w: 16, h: 16},
  {id: 'grinder', kind: 'decor', name: '手摇磨豆机', price: 0, edu: 3, desc: '咖啡课第 3 章奖励', w: 16, h: 16},
  {id: 'recipe', kind: 'decor', name: '老焙的食谱簿', price: 0, story: 9, desc: '主线终章奖励', w: 16, h: 16},
  {id: 'bunting', kind: 'decor', name: '节日彩旗串', price: 0, npc: 'fest', desc: '隐藏角色彩彩的礼物', w: 16, h: 16},
  {id: 'dog', kind: 'decor', name: '小狗 Latte', price: 900, desc: '会在小镇里跑来跑去', w: 14, h: 12, pet: true},
  {id: 'fountain', kind: 'decor', name: '许愿喷泉', price: 1200, desc: '小镇广场的中心', w: 32, h: 32, frames: 2},
];
const byId = id => ITEMS.find(i => i.id === id);
// ---------- state ----------
function load() { let s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {} s = s && typeof s === 'object' ? s : {};
  return {owned: Array.isArray(s.owned) ? s.owned.filter(byId) : [], hat: byId(s.hat) ? s.hat : 'straw', outfit: byId(s.outfit) ? s.outfit : 'classic', decor: Array.isArray(s.decor) ? s.decor.filter(byId) : []}; }
let S = load();
const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} applyLook(); };
const eduOk = it => !!(it.edu && window.Edu && Edu.rank() >= it.edu); // coffee-course rewards: owned once the chapter is passed
const npcOk = it => !!(it.npc && window.Npc && Npc.met(it.npc)); // hidden-NPC gifts: owned once that NPC has been met
const storyOk = it => !!(it.story && window.Story && Story.done(it.story)); // main-story rewards: owned once that chapter is finished
const owns = id => { const it = byId(id); return !!it && (it.free || eduOk(it) || npcOk(it) || storyOk(it) || S.owned.includes(id)); };
const spent = () => S.owned.filter(id => { const it = byId(id) || {}; return !it.edu && !it.npc && !it.story; }).reduce((t, id) => t + ((byId(id) || {}).price || 0), 0);
const equipped = id => { const it = byId(id); return !!it && (it.kind === 'hat' ? S.hat === id : it.kind === 'outfit' ? S.outfit === id : S.decor.includes(id)); };
function buy(id) { const it = byId(id); if (!it || owns(id) || it.edu || it.npc || it.story) return false; S.owned.push(id); if (it.kind === 'decor') { if (!S.decor.includes(id)) S.decor.push(id); } else S[it.kind] = id; save(); return true; }
function toggle(id) { const it = byId(id); if (!it || !owns(id)) return;
  if (it.kind === 'decor') S.decor = S.decor.includes(id) ? S.decor.filter(x => x !== id) : [...S.decor, id];
  else S[it.kind] = S[it.kind] === id ? (it.kind === 'hat' ? 'straw' : 'classic') : id; save(); }
function applyLook() { window.__heroLook = {hat: S.hat, outfit: S.outfit}; }
applyLook();

// ---------- 🎩 hats: drawn into rows 0–5 of the 16×16 farmer, replacing the straw hat ----------
const hatCache = {};
function hatCanvas(id) { if (hatCache[id]) return hatCache[id]; const P = Pix(16, 8);
  const H = {
    beanie() { P.ell(8, 4.6, 5.2, 4, '#4f9a2e'); P.rect(3, 4, 10, 2, '#3f7a22'); [4, 6, 8, 10, 12].forEach(x => P.set(x, 5, '#7cc458')); P.ell(8, 0.9, 1.6, 1.4, '#fff6e0'); P.set(6, 2, '#7cc458'); },
    beret() { P.ell(8, 3.6, 6.4, 2.4, '#c8403a'); P.rect(3, 5, 10, 1, '#8a2a24'); P.rect(8, 0, 1, 2, '#c8403a'); P.set(5, 2, '#e8705a'); P.set(6, 2, '#e8705a'); },
    flower() { P.rect(4, 2, 8, 4, '#7a4a25'); P.rect(5, 1, 6, 1, '#7a4a25'); P.rect(3, 4, 10, 2, '#3f8f2b'); [[3, 4, '#ff9ec4'], [6, 3, '#fff3a0'], [9, 3, '#ff9ec4'], [12, 4, '#b58bff'], [8, 5, '#ffffff']].forEach(([x, y, c]) => { P.set(x, y, c); P.set(x + 1, y, c); P.set(x, y + 1, c); }); },
    chef() { P.rect(4, 3, 8, 3, '#ffffff'); P.ell(5, 2, 2.6, 2.2, '#ffffff'); P.ell(8, 1.6, 2.8, 2, '#ffffff'); P.ell(11, 2, 2.6, 2.2, '#ffffff'); P.rect(4, 5, 8, 1, '#e0dcd0'); P.set(6, 1, '#f0ece4'); },
    cowboy() { P.rect(5, 1, 6, 4, '#a8693a'); P.rect(6, 0, 4, 1, '#a8693a'); P.rect(5, 3, 6, 1, '#5e3519'); P.rect(1, 5, 14, 1, '#8a5528'); P.rect(1, 4, 2, 1, '#8a5528'); P.rect(13, 4, 2, 1, '#8a5528'); P.set(7, 1, '#c98f55'); },
    mortar() { P.rect(5, 3, 6, 3, '#2a2a34'); P.rect(1, 2, 14, 2, '#3a3a48'); P.rect(2, 1, 12, 1, '#4a4a5a'); P.rect(7, 1, 2, 1, '#f5c542'); P.rect(12, 3, 1, 3, '#f5c542'); P.set(6, 4, '#4a4a5a'); },
    crown() { P.rect(4, 3, 8, 3, '#f5c542'); [[4, 1], [6, 2], [8, 0], [10, 2], [11, 1]].forEach(([x, y]) => P.rect(x, y, 1, 3 - y + 1, '#f5c542')); P.set(8, 0, '#fff2a0'); P.set(6, 4, '#e8403a'); P.set(8, 4, '#3f7fbf'); P.set(10, 4, '#4f9a2e'); P.rect(4, 5, 8, 1, '#c98a1a'); },
  }[id]; if (!H) return null; H(); P.outline(OUT);
  const c = P.canvas(), o = document.createElement('canvas'); o.width = 16; o.height = 6; o.getContext('2d').drawImage(c, 0, 0, 16, 6, 0, 0, 16, 6); return (hatCache[id] = o); }
function drawHat(g, id, dir) { const h = hatCanvas(id); if (!h) return; g.clearRect(0, 0, 16, 5); g.save(); if (dir === 'left') { g.translate(16, 0); g.scale(-1, 1); } g.drawImage(h, 0, 0); g.restore(); }

// ---------- 🌷 decorations ----------
const decoCache = {};
function decoFrames(id, season = 'spring', night = false) { const k = id + season + night; if (decoCache[k]) return decoCache[k]; const it = byId(id); if (!it) return [];
  const one = f => { const P = Pix(it.w, it.h);
    if (id === 'bench') { P.rect(1, 6, 14, 2, '#c98f55'); P.rect(1, 9, 14, 2, '#b07840'); P.rect(1, 6, 14, 1, '#e0ae74'); P.rect(2, 11, 2, 4, '#7a4a25'); P.rect(12, 11, 2, 4, '#7a4a25'); P.rect(2, 3, 1, 4, '#7a4a25'); P.rect(13, 3, 1, 4, '#7a4a25'); P.rect(1, 3, 14, 2, '#c98f55'); }
    else if (id === 'flowerbed') { P.rect(1, 9, 14, 6, '#a8693a'); P.rect(1, 9, 14, 1, '#c98f55'); P.rect(2, 7, 12, 3, '#3f8f2b'); [[3, '#ff6e8a'], [6, '#ffd23f'], [9, '#ffffff'], [12, '#b58bff']].forEach(([x, c], i) => { P.rect(x, 4 + (i % 2), 2, 2, c); P.set(x, 6 + (i % 2), '#2f6e23'); P.set(x + 1, 3 + (i % 2), '#fff3a0'); }); P.rect(2, 12, 12, 1, '#8a5528'); }
    else if (id === 'lantern') { P.rect(7, 6, 2, 9, '#3a3040'); P.rect(5, 14, 6, 1, '#3a3040'); P.rect(5, 1, 6, 5, '#3a3040'); P.rect(6, 2, 4, 3, night ? '#ffe28a' : '#f0e0b0'); P.rect(4, 0, 8, 1, '#c8403a'); P.set(7, 3, night ? '#fff6c8' : '#ffffff'); }
    else if (id === 'scarecrow') { P.rect(7, 4, 2, 11, '#8a5a33'); P.rect(2, 7, 12, 2, '#8a5a33'); P.rect(5, 6, 6, 5, '#4f86c6'); P.rect(6, 7, 1, 3, '#e8c060'); P.rect(9, 8, 1, 2, '#e8c060'); P.ell(8, 3, 2.6, 2.4, '#f0d8a0'); P.set(7, 3, OUT); P.set(9, 3, OUT); P.rect(4, 0, 8, 2, '#e8c060'); P.rect(3, 1, 10, 1, '#d4a640'); P.set(2, 8, '#e8c060'); P.set(13, 8, '#e8c060'); }
    else if (id === 'fountain') { P.ell(16, 24, 15, 7, '#bdae94'); P.ell(16, 23, 13, 5.5, f ? '#5fb0e0' : '#4fa2d8'); P.rect(14, 10, 4, 12, '#cdbfa6'); P.ell(16, 11, 6, 2.4, '#bdae94'); P.ell(16, 10.5, 4.8, 1.6, '#5fb0e0');
      const sp = f ? [[15, 4], [17, 5], [13, 7], [19, 7], [12, 9], [20, 10]] : [[16, 3], [14, 5], [18, 6], [12, 8], [20, 8], [11, 10]]; sp.forEach(([x, y]) => { P.set(x, y, '#bfe8ff'); P.set(x, y + 1, '#8fd2f2'); });
      [[8, 22], [20, 25], [24, 21], [12, 26]].forEach(([x, y], i) => P.set(x + (f ? 1 : 0), y, i % 2 ? '#ffffff' : '#bfe8ff')); P.rect(4, 27, 24, 1, '#a39279'); }
    else if (id === 'grinder') { P.rect(4, 8, 8, 7, '#a8693a'); P.rect(4, 8, 8, 1, '#c98f55'); P.rect(6, 11, 4, 2, '#7a4a25'); P.set(8, 12, '#f5c542'); P.rect(5, 5, 6, 3, '#b8b8c0'); P.rect(6, 4, 4, 1, '#d8d8e0'); P.rect(7, 2, 2, 2, '#8a8a94'); P.rect(9, 1, 4, 1, '#8a8a94'); P.rect(12, 0, 2, 2, '#7a4a25'); P.rect(4, 15, 8, 1, '#7a4a25'); }
    else if (id === 'recipe') { P.rect(3, 13, 10, 2, '#5a3418'); P.rect(7, 10, 2, 3, '#7a4a25'); P.rect(1, 4, 7, 6, '#f4ead0'); P.rect(8, 4, 7, 6, '#fff8e8'); P.rect(1, 10, 14, 1, '#8a4a2a'); P.rect(7, 4, 2, 6, '#c98f55');
      [[2, 5], [2, 7], [2, 8]].forEach(([x, y]) => P.rect(x, y, 4, 1, '#b8a888')); [[9, 5], [9, 6], [9, 8]].forEach(([x, y]) => P.rect(x, y, 4, 1, '#c8b898')); P.ell(12, 8.5, 1.4, 1, '#6b3f1d'); P.set(12, 8, '#4a2a10'); P.set(13, 3, '#e8403a'); P.rect(13, 3, 1, 3, '#e8403a'); }
    else if (id === 'bunting') { P.rect(1, 3, 1, 13, '#7a4a25'); P.rect(14, 3, 1, 13, '#7a4a25'); P.rect(1, 2, 2, 1, '#a8693a'); P.rect(13, 2, 2, 1, '#a8693a'); [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(x => P.set(x, 4 + (x > 4 && x < 11 ? 1 : 0), '#5a3418'));
      [[2, '#e8403a'], [5, '#ffd23f'], [8, '#4f86c6'], [11, '#7ab55c']].forEach(([x, c], i) => { const y = 5 + (i === 1 || i === 2 ? 1 : 0); P.rect(x, y, 3, 1, c); P.rect(x, y + 1, 2, 1, c); P.set(x, y + 2, c); }); P.rect(0, 15, 16, 1, '#5e3519'); }
    else if (id === 'dog') { const fur = '#e8c08a', dk = '#b88850'; P.ell(6.5, 8, 4.5, 2.6, fur); P.ell(10.5, 5.5, 2.8, 2.6, fur); P.rect(8, 3, 2, 3, dk); P.rect(12, 3, 1, 3, dk); P.set(11, 5, OUT); P.set(13, 6, OUT); P.set(12, 7, '#e87a8a');
      P.rect(4, 6, 3, 1, '#ffffff'); P.rect(3, 9, 1, 2, fur); P.rect(9, 9, 1, 2, fur); P.set(f ? 5 : 4, 11, fur); P.set(f ? 8 : 9, 11, fur); if (f) { P.rect(1, 5, 1, 3, fur); } else { P.rect(0, 7, 2, 1, fur); } P.rect(9, 7, 3, 1, '#e8403a'); }
    P.outline(OUT); return P.canvas(); };
  return (decoCache[k] = Array.from({length: it.pet ? 2 : it.frames || 1}, (_, f) => one(f))); }
function mapDecor(season, night) { return S.decor.map(byId).filter(Boolean).map(it => ({...it, frames: decoFrames(it.id, season, night)})); }
function preview(id) { const it = byId(id); if (!it) return null;
  if (it.kind === 'decor') return decoFrames(id)[0];
  const c = document.createElement('canvas'); c.width = c.height = 16; const prev = window.__heroLook; window.__heroLook = {hat: it.kind === 'hat' ? id : S.hat, outfit: it.kind === 'outfit' ? id : S.outfit}; V.drawHero(c, 'down', 0); window.__heroLook = prev; return c; }
const outfitCols = id => (byId(id) || {}).cols || null;
window.PixShop = {ITEMS, byId, owns, equipped, buy, toggle, spent, get state() { return S; }, reload() { S = load(); applyLook(); }, drawHat, hatCanvas, decoFrames, mapDecor, preview, outfitCols};
})();
