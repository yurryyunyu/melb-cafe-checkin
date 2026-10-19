(() => {
'use strict';
// Optional modules must never take the main UI down: stub them if they failed to load.
if (!window.MapKit) window.MapKit = {hasKey: false, provider: 'none', create: () => Promise.reject(new Error('map module unavailable')), nearbyCafes: async () => [], gmapsLink: c => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((c.name || '') + ' ' + (c.address || c.suburb || 'Melbourne'))};
if (!window.Integrations) window.Integrations = {visionOn: false, formOn: false, recognizeFood: async () => null, submitToGoogleForm: async () => ({ok: false})};
if (!window.SketchMap) window.SketchMap = {render: () => ({svg: '<div class="empty">草图地图暂不可用</div>', meIn: false})};

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K = {cafes: 'mcc.customCafes', checkins: 'mcc.checkins'};
const CBD = [-37.8136, 144.9631];
const NEAR_M = 250; // auto-match radius for photo check-in

// ---------- storage ----------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
function save(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch (e) { toast('⚠️ 手机存储空间不足，请删除一些旧照片'); return false; }
}
let customCafes = load(K.cafes, []);
let checkins = load(K.checkins, []);
const allCafes = () => [...SEED_CAFES, ...customCafes];
const cafeById = id => allCafes().find(c => c.id === id);
const saveCheckins = () => save(K.checkins, checkins);
const visitedIds = () => new Set(checkins.filter(c => c.cafeId).map(c => c.cafeId));
const checkinsOf = id => checkins.filter(c => c.cafeId === id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const stars = n => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';

// ---------- utils ----------
function toast(msg, ms = 2400) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
function distM(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLat = r(b[0] - a[0]), dLng = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = m => m < 1000 ? Math.round(m) + ' 米' : (m / 1000).toFixed(1) + ' 公里';
let lastPos = null;
function locate(timeout = 7000) {
  return new Promise(res => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      p => { lastPos = [p.coords.latitude, p.coords.longitude]; res(lastPos); },
      () => res(null), {enableHighAccuracy: true, timeout, maximumAge: 60000});
  });
}
function compressImage(file, max = 900, q = 0.72) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('图片读取失败')); };
    img.src = url;
  });
}
function pickPhoto(useCamera) {
  return new Promise(res => {
    const inp = useCamera ? $('#camInput') : $('#pickInput');
    inp.value = '';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return res(null);
      try { res(await compressImage(f)); } catch (e) { toast(e.message); res(null); }
    };
    inp.click();
  });
}

// ---------- sheet ----------
function openSheet(html, onMount) {
  $('#sheet').innerHTML = html; $('#sheetWrap').classList.remove('hidden');
  onMount && onMount($('#sheet'));
}
function closeSheet() { $('#sheetWrap').classList.add('hidden'); $('#sheet').innerHTML = ''; }
$('#sheetBg').onclick = () => { closeSheet(); render(); };

// ---------- cafe picker ----------
function cafeFromPlace(p) {
  let c = customCafes.find(x => x.placeId === p.placeId);
  if (!c) { c = {id: 'g_' + uid(), name: p.name, suburb: p.suburb, address: p.address, lat: p.lat, lng: p.lng, placeId: p.placeId, tags: ['Google 附近'], custom: true}; customCafes.push(c); save(K.cafes, customCafes); }
  return c.id;
}
function openPicker(onPick, {title = '在哪家咖啡馆？', pos = lastPos, allowLater = true, places = []} = {}) {
  let list = allCafes().map(c => ({c, d: pos ? distM(pos, [c.lat, c.lng]) : null}));
  if (pos) list.sort((a, b) => a.d - b.d); else list.sort((a, b) => a.c.name.localeCompare(b.c.name));
  const item = ({c, d}, i) => `<div class="picker-item ${pos && i === 0 && d < 1000 ? 'near' : ''}" data-id="${c.id}"><div><b>${esc(c.name)}</b><div class="hint" style="margin:2px 0 0">${esc(c.suburb)}</div></div><span class="d">${d != null ? fmtDist(d) : ''}</span></div>`;
  openSheet(`<h3>${title}</h3>
    <div class="search"><input id="pkQ" placeholder="搜索咖啡馆名称或区域" autocomplete="off"></div>
    ${pos ? '<div class="hint">按离你的距离排序</div>' : '<div class="hint">未获取到定位，请手动选择</div>'}
    ${places.length ? `<div class="hint">📍 Google 附近的咖啡馆</div>${places.map((p, i) => `<div class="picker-item" data-place="${i}"><div><b>${esc(p.name)}</b><div class="hint" style="margin:2px 0 0">${esc(p.suburb)}</div></div><span class="d">${pos ? fmtDist(distM(pos, [p.lat, p.lng])) : ''}</span></div>`).join('')}<div class="hint" style="margin-top:12px">收录的据点</div>` : ''}
    <div id="pkList"></div>
    <button class="btn ghost" id="pkAdd">＋ 列表里没有？添加新咖啡馆</button>
    ${allowLater ? '<button class="btn ghost" id="pkLater">稍后再选</button>' : ''}`, el => {
    const draw = q => {
      q = q.trim().toLowerCase();
      const f = list.filter(({c}) => !q || (c.name + ' ' + c.suburb + ' ' + c.address).toLowerCase().includes(q));
      $('#pkList', el).innerHTML = f.map(item).join('') || '<div class="hint">没有找到</div>';
    };
    draw('');
    $('#pkQ', el).oninput = e => draw(e.target.value);
    $('#pkList', el).onclick = e => { const it = e.target.closest('.picker-item'); if (it) onPick(it.dataset.id); };
    el.querySelectorAll('[data-place]').forEach(it => it.onclick = () => onPick(cafeFromPlace(places[+it.dataset.place])));
    $('#pkAdd', el).onclick = () => { closeSheet(); pendingAssign = onPick; location.hash = '#/add'; };
    const later = $('#pkLater', el); if (later) later.onclick = () => { closeSheet(); toast('已保存，可在「记录」里补选咖啡馆'); render(); };
  });
}
let pendingAssign = null;

// ---------- check-in form (new or edit) ----------
function openCheckinForm(ci, isNew) {
  const draft = {...ci};
  const cafe = () => cafeById(draft.cafeId);
  openSheet(`<h3>${isNew ? '打卡 ☕' : '编辑打卡'}</h3>
    <div class="field"><label>照片</label><div class="photo-drop" id="fPhoto"></div></div>
    <div class="field"><label>咖啡馆</label><button class="btn ghost" style="margin:0;text-align:left" id="fCafe"></button></div>
    <div class="field"><label>评分</label><div class="star-input" id="fStars">${[1,2,3,4,5].map(n => `<span data-n="${n}">★</span>`).join('')}</div></div>
    <div class="field"><label>点了什么</label><input id="fDrink" placeholder="例如：Flat White、Magic、手冲埃塞俄比亚" value="${esc(draft.drink)}"><div class="chips" id="fMenu" style="margin-top:6px"></div></div>
    <div class="field"><label>心得</label><textarea id="fNote" rows="3" placeholder="味道、环境、推荐指数…">${esc(draft.note)}</textarea></div>
    <div class="field"><label>日期</label><input type="date" id="fDate" value="${esc(draft.date || today())}"></div>
    <button class="btn" id="fSave">${isNew ? '保存打卡' : '保存'}</button>
    ${isNew ? '' : '<button class="btn danger" id="fDel">删除这条打卡</button>'}`, el => {
    const drawPhoto = () => $('#fPhoto', el).innerHTML = draft.photo ? `<img src="${draft.photo}" alt="">` : '📷 点击添加照片（可选）';
    const drawCafe = () => $('#fCafe', el).innerHTML = cafe() ? `📍 ${esc(cafe().name)} <span class="hint">· 点击更换</span>` : '📍 选择咖啡馆';
    const drawStars = () => el.querySelectorAll('#fStars span').forEach(s => s.classList.toggle('on', +s.dataset.n <= (draft.rating || 0)));
    drawPhoto(); drawCafe(); drawStars();
    if (draft.cafeId) { $('#fMenu', el).innerHTML = menuFor(draft.cafeId).map(m => `<button class="chip" data-item="${esc(m.name)}">${esc(m.name)}</button>`).join('');
      $('#fMenu', el).onclick = e => { const b = e.target.closest('.chip'); if (b) $('#fDrink', el).value = b.dataset.item; }; }
    $('#fPhoto', el).onclick = async () => { const p = await pickPhoto(false); if (p) { draft.photo = p; drawPhoto(); } };
    $('#fStars', el).onclick = e => { const n = +e.target.dataset.n; if (n) { draft.rating = draft.rating === n ? 0 : n; drawStars(); } };
    const collect = () => { draft.drink = $('#fDrink', el).value.trim(); draft.note = $('#fNote', el).value.trim(); draft.date = $('#fDate', el).value || today(); };
    $('#fCafe', el).onclick = () => {
      collect();
      openPicker(id => { draft.cafeId = id; openCheckinForm(draft, isNew); }, {allowLater: false, title: '选择咖啡馆'});
    };
    $('#fSave', el).onclick = () => {
      collect(); const before = snapshot();
      if (!draft.cafeId && isNew) return toast('请先选择咖啡馆');
      const i = checkins.findIndex(c => c.id === draft.id);
      if (i >= 0) checkins[i] = draft; else checkins.unshift(draft);
      if (!saveCheckins()) return;
      closeSheet(); if (isNew) celebrate(before, draft.cafeId); else { toast('已保存'); checkBadges(); render(); }
    };
    const del = $('#fDel', el);
    if (del) del.onclick = () => {
      if (!confirm('确定删除这条打卡吗？')) return;
      checkins = checkins.filter(c => c.id !== draft.id); saveCheckins(); closeSheet(); toast('已删除'); render();
    };
  });
}

// ---------- 📷 photo = check-in ----------
async function quickPhotoCheckin() {
  const posP = locate(8000); // start locating right away, in parallel with the camera
  const photo = await pickPhoto(true);
  if (!photo) return;
  const before = snapshot();
  const ci = {id: uid(), cafeId: null, photo, rating: 0, drink: '', note: '', date: today(), createdAt: Date.now()};
  checkins.unshift(ci);
  if (!saveCheckins()) { checkins.shift(); return; }
  toast('📸 已打卡！正在匹配附近的咖啡馆…');
  if (location.hash !== '#/records') { const hc = new Promise(r => window.addEventListener('hashchange', r, {once: true})); location.hash = '#/records'; await hc; } else render();
  const pos = await posP;
  let near = null;
  if (pos) {
    near = allCafes().map(c => ({c, d: distM(pos, [c.lat, c.lng])})).sort((a, b) => a.d - b.d)[0];
    if (near && near.d > NEAR_M) near = null;
  }
  const assign = id => {
    const x = checkins.find(c => c.id === ci.id); if (!x) return;
    x.cafeId = id; saveCheckins();
    toast(`📍 ${cafeById(id).name}`);
    render(); openRateSheet(x, before); // recognise + rate (optional), then unlock animation
  };
  if (near) return assign(near.c.id);
  const places = pos && MapKit.hasKey ? await MapKit.nearbyCafes(pos, 300) : [];
  openPicker(assign, {pos, places, title: '📸 已保存！在哪家咖啡馆？'});
}
$('#camBtn').onclick = quickPhotoCheckin;

// ---------- 🎮 game layer: XP, levels, celebration ----------
const TITLES = [[1, '咖啡新手'], [3, '拿铁学徒'], [5, 'Flat White 骑士'], [8, '烘焙大师'], [12, '墨尔本咖啡传说']];
function totalXP() {
  const s = stats(); let xp = 0;
  checkins.forEach(c => { xp += 20; if (c.photo) xp += 20; if (c.rating) xp += 10; if (c.drink || c.note) xp += 10; });
  xp += s.cafes * 100;
  xp += BADGES.filter(b => b.test(s)).length * 50;
  xp += regions().filter(r => r.done === r.total).length * 150;
  return xp;
}
const levelStart = n => 50 * n * (n - 1); // Lv1:0 Lv2:100 Lv3:300 Lv4:600 ...
function levelInfo(xp = totalXP()) {
  let lv = 1; while (levelStart(lv + 1) <= xp) lv++;
  const a = levelStart(lv), b = levelStart(lv + 1);
  return {lv, xp, into: xp - a, need: b - a, pct: Math.round((xp - a) / (b - a) * 100), title: TITLES.filter(t => lv >= t[0]).pop()[1]};
}
const REGION_OF = {};
REGIONS.forEach(r => Object.keys(r.cafes).forEach((id, i) => { if (!REGION_OF[id]) REGION_OF[id] = {r, no: i + 1}; }));
const regionOf = id => REGION_OF[id] || {r: REGION_MORE, no: null};
function regions() { // progress per sketch region (+ 更多 for everything else)
  const v = visitedIds();
  const out = REGIONS.map(r => { const ids = Object.keys(r.cafes); return {id: r.id, name: r.name, zh: r.zh, total: ids.length, done: ids.filter(i => v.has(i)).length}; });
  const more = allCafes().filter(c => !REGION_OF[c.id]);
  out.push({id: 'more', name: REGION_MORE.name, zh: REGION_MORE.zh, total: more.length, done: more.filter(c => v.has(c.id)).length});
  return out.filter(r => r.total);
}
function drawHud() {
  const L = levelInfo();
  $('#hud').innerHTML = `<div class="hud-lv">Lv.${L.lv}</div><div class="hud-main"><div class="hud-title">${L.title}</div><div class="xpbar"><i style="width:${L.pct}%"></i></div></div><div class="hud-xp">${L.into}/${L.need}</div>`;
}
function snapshot() { return {xp: totalXP(), lv: levelInfo().lv, badges: new Set(BADGES.filter(b => b.test(stats())).map(b => b.id)), visited: new Set(visitedIds())}; }
function celebrate(before, cafeId, extra = '') {
  const after = snapshot(), c = cafeById(cafeId);
  const isNew = c && !before.visited.has(cafeId);
  const gain = after.xp - before.xp, lvUp = after.lv > before.lv;
  const newBadges = BADGES.filter(b => after.badges.has(b.id) && !before.badges.has(b.id));
  save('mcc.badges', [...after.badges]);
  const reg = c && regions().find(r => r.id === regionOf(c.id).r.id);
  const el = $('#celebrate');
  el.innerHTML = `<div class="cel-rays"></div><div class="confetti">${Array.from({length: 26}, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 7) * .08}s;background:${['#ef6f8f', '#fbd6df', '#8fa5b8', '#f7f4ec', '#c94a6b'][i % 5]}"></i>`).join('')}</div>
    <div class="cel-card">
      <div class="cel-pin"><span>${isNew ? '🔓' : '☕'}</span></div>
      <div class="cel-title">${isNew ? '据点解锁！' : '打卡成功！'}</div>
      ${c ? `<div class="cel-cafe">${esc(c.name)}</div>` : ''}
      <div class="cel-xp">+${gain} XP</div>
      ${lvUp ? `<div class="cel-lv">⬆️ 升级到 Lv.${after.lv} · ${levelInfo().title}</div>` : ''}
      ${reg ? `<div class="cel-reg">🗺️ ${esc(reg.name)} 区域 ${reg.done}/${reg.total}${reg.done === reg.total ? ' 👑 全部收集！' : ''}</div>` : ''}
      ${newBadges.map(b => `<div class="cel-badge">🏆 新成就：${b.e} ${b.name}</div>`).join('')}
      ${extra}
      <button class="btn game-btn" id="celOk">太棒了！</button></div>`;
  el.classList.remove('hidden');
  if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
  const close = () => { el.classList.add('hidden'); el.innerHTML = ''; render(); };
  $('#celOk').onclick = close; clearTimeout(celebrate._t); celebrate._t = setTimeout(() => !el.classList.contains('hidden') && close(), 6000);
  drawHud();
}

// ---------- 🍽️ recognise item + rate it (after photo check-in) ----------
function openRateSheet(ci, before) {
  const c = cafeById(ci.cafeId), menu = menuFor(ci.cafeId);
  const d = {item: ci.drink || '', rating: ci.rating || 0, taste: 0, look: 0, value: 0, note: ci.note || ''};
  const starRow = (k, size) => `<div class="star-input ${size || ''}" data-k="${k}">${[1, 2, 3, 4, 5].map(n => `<span data-n="${n}">★</span>`).join('')}</div>`;
  openSheet(`<h3>🍽️ 这次点了什么？</h3>
    <div class="rate-head">${ci.photo ? `<img src="${ci.photo}" alt="">` : ''}<div><b>${esc(c.name)}</b><div class="hint" id="rcStatus">${Integrations.visionOn ? '🔍 AI 正在识别照片…' : '从菜单里选一个吧'}</div></div></div>
    <div class="chips wrap" id="menuChips">${menu.map(m => `<button class="chip" data-item="${esc(m.name)}">${m.type === 'food' ? '🥐' : '☕'} ${esc(m.name)}</button>`).join('')}<button class="chip" data-item="__other">✏️ 其他</button></div>
    <div class="hint">${MENU_VERIFIED ? '' : '＊示例菜单，非该店官方菜单'}</div>
    <div class="field hidden" id="otherWrap"><input id="otherIn" placeholder="输入你点的东西"></div>
    <div class="field"><label>总评分</label>${starRow('rating')}</div>
    <div class="subrates"><div><label>口味</label>${starRow('taste', 'sm')}</div><div><label>颜值</label>${starRow('look', 'sm')}</div><div><label>性价比</label>${starRow('value', 'sm')}</div></div>
    <div class="field"><textarea id="rNote" rows="2" placeholder="一句话心得（可选）">${esc(d.note)}</textarea></div>
    <button class="btn game-btn" id="rDone">🔓 完成${Integrations.formOn ? '并提交' : ''}</button>
    <button class="btn ghost" id="rSkip">跳过，直接解锁</button>`, el => {
    const drawChips = () => el.querySelectorAll('#menuChips .chip').forEach(b => b.classList.toggle('on', b.dataset.item === d.item || (b.dataset.item === '__other' && d.item && !menu.some(m => m.name === d.item))));
    const drawStars = () => el.querySelectorAll('.star-input').forEach(r => r.querySelectorAll('span').forEach(s => s.classList.toggle('on', +s.dataset.n <= d[r.dataset.k])));
    drawChips(); drawStars();
    $('#menuChips', el).onclick = e => { const b = e.target.closest('.chip'); if (!b) return;
      if (b.dataset.item === '__other') { $('#otherWrap', el).classList.remove('hidden'); $('#otherIn', el).focus(); d.item = $('#otherIn', el).value.trim(); }
      else { d.item = b.dataset.item; $('#otherWrap', el).classList.add('hidden'); } drawChips(); };
    $('#otherIn', el).oninput = e => { d.item = e.target.value.trim(); };
    el.querySelectorAll('.star-input').forEach(r => r.onclick = e => { const n = +e.target.dataset.n; if (n) { d[r.dataset.k] = d[r.dataset.k] === n ? 0 : n; drawStars(); } });
    if (Integrations.visionOn && ci.photo) Integrations.recognizeFood(ci.photo, menu).then(res => {
      const st = $('#rcStatus', el); if (!st) return;
      if (res && res.item) { if (!d.item) { d.item = res.item; if (!res.matched) { $('#otherWrap', el).classList.remove('hidden'); $('#otherIn', el).value = res.item; } drawChips(); }
        st.textContent = `🤖 识别为「${res.item}」${res.confidence ? '（' + Math.round(res.confidence * 100) + '%）' : ''}，不对可以改`; }
      else st.textContent = '没认出来，从菜单里选一个吧';
    });
    const finish = async rated => {
      const x = checkins.find(k => k.id === ci.id);
      if (rated) { Object.assign(x, {drink: d.item, rating: d.rating, taste: d.taste, look: d.look, value: d.value, note: $('#rNote', el).value.trim()}); }
      let extra = '';
      if (rated && Integrations.formOn) {
        const r = await Integrations.submitToGoogleForm({cafe: c.name, suburb: c.suburb, item: x.drink, rating: x.rating || '', taste: x.taste || '', look: x.look || '', value: x.value || '', note: x.note, date: x.date});
        x.formStatus = r; extra = r === 'sent' ? '<div class="cel-reg">📨 已提交到 Google 表单</div>' : '<div class="cel-reg">⚠️ 表单提交失败，已保存在本地</div>';
      }
      saveCheckins(); closeSheet(); celebrate(before, ci.cafeId, extra);
    };
    $('#rDone', el).onclick = () => finish(true);
    $('#rSkip', el).onclick = () => finish(false);
  });
}

// ---------- badges ----------
const BADGES = [
  {id: 'first', e: '🎉', name: '初次打卡', test: s => s.count >= 1},
  {id: 'five', e: '☕', name: '5 家咖啡馆', test: s => s.cafes >= 5},
  {id: 'ten', e: '🏅', name: '10 家咖啡馆', test: s => s.cafes >= 10},
  {id: 'sub3', e: '🧭', name: '3 个区', test: s => s.suburbs >= 3},
  {id: 'cbd', e: '🏙️', name: 'CBD 巷子达人', test: s => s.cbd >= 5},
  {id: 'regular', e: '💛', name: '同店 3 次常客', test: s => s.maxSame >= 3},
  {id: 'photo', e: '📸', name: '10 张照片', test: s => s.photos >= 10},
  {id: 'critic', e: '✍️', name: '写 5 条心得', test: s => s.notes >= 5},
  {id: 'all', e: '👑', name: '全部收集', test: s => s.cafes >= s.total},
];
function stats() {
  const v = visitedIds(), cafes = [...v].map(cafeById).filter(Boolean);
  const per = {}; checkins.forEach(c => c.cafeId && (per[c.cafeId] = (per[c.cafeId] || 0) + 1));
  return {count: checkins.length, cafes: cafes.length, total: allCafes().length,
    suburbs: new Set(cafes.map(c => c.suburb)).size, cbd: cafes.filter(c => /CBD/.test(c.suburb)).length,
    maxSame: Math.max(0, ...Object.values(per)), photos: checkins.filter(c => c.photo).length,
    notes: checkins.filter(c => c.note).length};
}
function checkBadges() {
  const s = stats(), had = new Set(load('mcc.badges', []));
  const now = BADGES.filter(b => b.test(s)).map(b => b.id);
  const fresh = now.filter(id => !had.has(id));
  save('mcc.badges', now);
  if (fresh.length) { const b = BADGES.find(x => x.id === fresh[0]); setTimeout(() => toast(`🏆 新成就：${b.e} ${b.name}`, 3200), 1200); }
  drawHud();
}

// ---------- views ----------
let mapRef = null, mapToken = 0, pendingFocus = null;
const mapState = {region: 'city', zoom: 1};
// ---- 3D map (three.js, lazy-loaded only when opened) ----
const can3D = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; } })();
let map3dFailed = false, map3dMod = null;
mapState.mode = load('mcc.mapMode', null) || (can3D ? '3d' : '2d');
const dynImport = (() => { try { return new Function('u', 'return import(u)'); } catch (e) { return () => Promise.reject(new Error('dynamic import unsupported')); } })();
function loadMap3d() {
  if (map3dMod) return Promise.resolve(map3dMod);
  const url = new URL('map3d.js?v=6', document.baseURI).href;
  return Promise.race([dynImport(url), new Promise((_, rej) => setTimeout(() => rej(new Error('3D 模块加载超时')), 15000))]).then(m => (map3dMod = m));
}
const app = $('#app');
const listState = {q: '', suburb: '', filter: 'all'};

function cafeCard(c) {
  const cis = checkinsOf(c.id), last = cis.find(x => x.photo);
  const d = lastPos ? ' · ' + fmtDist(distM(lastPos, [c.lat, c.lng])) : '';
  const ro = regionOf(c.id);
  return `<a class="card" href="#/cafe/${c.id}">
    <span class="num ${cis.length ? 'done' : ''}" title="${esc(ro.r.name)}">${ro.no || '☕'}</span>
    ${last ? `<img class="thumb" src="${last.photo}" alt="">` : ''}
    <div class="meta"><div class="name">${esc(c.name)}</div><div class="sub">${esc(ro.r.name)} · ${esc(c.suburb)}${d} · ${esc(c.address)}</div></div>
    ${cis.length ? `<span class="badge-done">⭐ ${cis.length}次</span>` : '<span class="badge-new">🔒 未解锁</span>'}</a>`;
}

const views = {
  list() {
    setTop('墨尔本咖啡打卡', '<button id="addCafeBtn">＋ 添加</button>');
    $('#addCafeBtn').onclick = () => location.hash = '#/add';
    const subs = [...new Set(allCafes().map(c => c.suburb))].sort();
    const v = visitedIds();
    app.innerHTML = `<div class="search"><input id="q" placeholder="🔍 搜索咖啡馆" value="${esc(listState.q)}" autocomplete="off">
      <select id="sub"><option value="">全部区域</option>${[...REGIONS, REGION_MORE].map(r => `<option value="${r.id}" ${r.id === listState.suburb ? 'selected' : ''}>${esc(r.name)}${r.zh && r.id !== 'more' ? ' ' + r.zh : ''}</option>`).join('')}</select></div>
      <div class="chips">${[['all', '全部'], ['todo', '未解锁'], ['done', '已解锁'], ['near', '离我最近']].map(([k, t]) => `<button class="chip ${listState.filter === k ? 'on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
      <div class="hint">已解锁 ${v.size} / ${allCafes().length} 家</div><div id="cards"></div>`;
    const draw = () => {
      const q = listState.q.trim().toLowerCase();
      let L = allCafes().filter(c => (!q || (c.name + ' ' + c.address + ' ' + c.suburb + ' ' + (c.tags || []).join(' ')).toLowerCase().includes(q))
        && (!listState.suburb || regionOf(c.id).r.id === listState.suburb)
        && (listState.filter !== 'todo' || !v.has(c.id)) && (listState.filter !== 'done' || v.has(c.id)));
      if (listState.filter === 'near' && lastPos) L.sort((a, b) => distM(lastPos, [a.lat, a.lng]) - distM(lastPos, [b.lat, b.lng]));
      $('#cards').innerHTML = L.map(cafeCard).join('') || '<div class="empty"><div class="e">🫖</div>没有符合条件的咖啡馆</div>';
    };
    draw();
    $('#q').oninput = e => { listState.q = e.target.value; draw(); };
    $('#sub').onchange = e => { listState.suburb = e.target.value; draw(); };
    app.querySelector('.chips').onclick = async e => {
      const f = e.target.dataset.f; if (!f) return;
      listState.filter = f;
      if (f === 'near' && !lastPos) { toast('正在获取定位…'); if (!await locate()) { toast('无法获取定位，请允许定位权限'); } }
      views.list();
    };
  },

  map() {
    setTop('咖啡地图');
    const ms = mapState, v = visitedIds();
    const tabs = [...REGIONS.map(r => [r.id, r.name]), ['real', '🌍 真实地图']];
    const head = `<div class="region-tabs">${tabs.map(([id, t]) => `<button class="chip ${ms.region === id ? 'on' : ''}" data-r="${id}">${esc(t)}</button>`).join('')}</div>`;
    if (ms.region === 'real') {
      app.innerHTML = head + `<div style="position:relative"><div id="map" class="real"></div>
        <div class="map-legend"><span class="lg gold"></span> 已解锁 ${v.size}　<span class="lg grey"></span> 未解锁 ${allCafes().length - v.size}</div>
        <button class="fab-add" id="locBtn">🎯 定位我</button></div>`;
      const token = ++mapToken;
      MapKit.create($('#map'), CBD, 13).then(map => {
        if (token !== mapToken) return map.remove();
        mapRef = map;
        allCafes().forEach(c => {
          const done = v.has(c.id), n = checkinsOf(c.id).length, ro = regionOf(c.id);
          const inRange = lastPos && distM(lastPos, [c.lat, c.lng]) <= NEAR_M;
          map.addMarker(c.lat, c.lng, done, `<div class="pop-name">${esc(c.name)}</div><div class="pop-sub">${esc(ro.r.name)} · ${done ? '✓ 已解锁 · 打卡 ' + n + ' 次' : inRange ? '✨ 就在附近，可解锁！' : '🔒 未解锁'}</div><a class="pop-link" href="#/cafe/${c.id}">查看据点 ›</a>`, {no: ro.no, label: c.short || c.name});
        });
        if (lastPos) { map.showMe(lastPos, NEAR_M); map.setView(lastPos, 15); }
        map.resize();
        if (pendingFocus) { const c = pendingFocus; pendingFocus = null; map.setView([c.lat, c.lng], 16); setTimeout(() => map.openAt(c.lat, c.lng), 300); }
      }).catch(e => { console.warn('real map failed', e); const m = $('#map'); if (m && token === mapToken) m.innerHTML = '<div class="empty" style="padding:40px 16px"><div class="e">🗺️</div>真实地图暂时加载不了（网络问题），可以先用上面的草图区域地图</div>'; });
      $('#locBtn').onclick = async () => { toast('🎯 正在定位…'); const p = await locate(); if (!p) return toast('无法获取定位，请允许定位权限'); if (mapRef) { mapRef.showMe(p, NEAR_M); mapRef.setView(p, 15); } };
    } else {
      const R = REGIONS.find(r => r.id === ms.region) || REGIONS[0];
      const prog = regions().find(r => r.id === R.id);
      const use3d = ms.mode === '3d' && can3D && !map3dFailed;
      const {svg, meIn} = SketchMap.render(R, {visited: v, cafeById, me: lastPos, rangeM: NEAR_M});
      const ids = Object.keys(R.cafes);
      const toggle = `<span class="dim-toggle" id="dimT"><button data-m="2d" class="${use3d ? '' : 'on'}">2D</button><button data-m="3d" class="${use3d ? 'on' : ''}" ${can3D ? '' : 'disabled title="此设备不支持 3D"'}>3D</button></span>`;
      app.innerHTML = head + `<div class="region-head"><div><b>${esc(R.name)}</b> <span class="hint">${esc(R.zh)}</span></div><div class="rg-count">${prog.done}/${prog.total}${prog.done === prog.total ? ' 👑' : ''}</div></div>
        <div class="progress" style="margin:0 14px 6px"><i style="width:${Math.round(prog.done / prog.total * 100)}%"></i></div>
        ${use3d ? `<div class="m3d-wrap" id="m3d" data-region="${R.id}"><div class="m3d-loading">✏️ 正在搭建 3D 小镇…</div><div class="m3d-hint">单指旋转 · 双指缩放/平移</div></div>`
          : `<div class="sk-wrap" id="skWrap"><div class="sk-inner" style="width:${ms.zoom * 100}%">${svg}</div></div>`}
        <div class="sk-tools">${toggle}<button id="zOut">－</button><button id="zIn">＋</button>${use3d ? '<button id="m3dReset" aria-label="重置视角">⟲</button>' : ''}<button id="skLoc">🎯 ${lastPos ? (meIn ? '我在这里' : '不在此区') : '定位我'}</button></div>
        <div class="sk-list">${ids.map(id => cafeById(id)).filter(Boolean).map(cafeCard).join('')}</div>`;
      $('#dimT').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || b.disabled) return; ms.mode = b.dataset.m; save('mcc.mapMode', ms.mode); if (ms.mode === '3d') map3dFailed = false; render(); };
      if (use3d) {
        const token = ++mapToken, wrap = $('#m3d');
        const fail = e => { console.warn('3D map failed, falling back to 2D', e); if (token !== mapToken) return; map3dFailed = true; if (mapRef && mapRef.kind === '3d') { try { mapRef.remove(); } catch (x) {} mapRef = null; } toast('3D 地图暂不可用，已切换为 2D 手绘地图'); render(); };
        const seen = new Set(load('mcc.seen3d', [])), pop = new Set([...v].filter(id => R.cafes[id] && !seen.has(id)));
        loadMap3d().then(mod => mod.create(wrap, R, {visited: v, cafeById, me: lastPos, rangeM: NEAR_M, pop, fitAffine: SketchMap.fitAffine, onOpen: id => { location.hash = '#/cafe/' + id; }, onLost: () => fail(new Error('WebGL context lost'))}))
          .then(m => {
            if (token !== mapToken) return m.remove();
            mapRef = m; const ld = wrap.querySelector('.m3d-loading'); if (ld) ld.remove();
            if (pop.size) { pop.forEach(id => seen.add(id)); save('mcc.seen3d', [...seen]); }
          }).catch(fail);
        $('#zIn').onclick = () => mapRef && mapRef.zoom && mapRef.zoom(0.75); $('#zOut').onclick = () => mapRef && mapRef.zoom && mapRef.zoom(1.33);
        $('#m3dReset').onclick = () => mapRef && mapRef.reset && mapRef.reset();
      } else {
        $('#skWrap').onclick = e => { const g = e.target.closest('[data-id]'); if (g) location.hash = '#/cafe/' + g.dataset.id; };
        const zoom = z => { ms.zoom = Math.min(2.4, Math.max(1, z)); $('.sk-inner').style.width = ms.zoom * 100 + '%'; };
        $('#zIn').onclick = () => zoom(ms.zoom + 0.35); $('#zOut').onclick = () => zoom(ms.zoom - 0.35);
      }
      $('#skLoc').onclick = async () => { toast('🎯 正在定位…'); const p = await locate(); if (!p) return toast('无法获取定位，请允许定位权限');
        const best = REGIONS.map(r => ({r, d: Math.min(...Object.keys(r.cafes).map(id => cafeById(id)).filter(Boolean).map(c => distM(p, [c.lat, c.lng])))})).sort((a, b) => a.d - b.d)[0];
        if (best && best.d < 1500 && best.r.id !== ms.region) { ms.region = best.r.id; toast('📍 你在 ' + best.r.name); } views.map(); };
    }
    app.querySelector('.region-tabs').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; ms.region = b.dataset.r; ms.zoom = 1; render(); };
  },

  records() {
    setTop('打卡记录');
    if (!checkins.length) {
      app.innerHTML = `<div class="empty"><div class="e">📷</div><p>还没有打卡记录</p><p class="hint">点下面中间的「拍照打卡」，拍一张就算打卡！</p></div>`;
      return;
    }
    const sorted = [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
    app.innerHTML = `<div class="hint">共 ${checkins.length} 次打卡</div>` + sorted.map(ci => {
      const c = cafeById(ci.cafeId);
      return `<div class="rec">${ci.photo ? `<img src="${ci.photo}" alt="" loading="lazy">` : ''}
        <div class="body"><div class="top"><span class="cname">${c ? `<a href="#/cafe/${c.id}" style="color:inherit;text-decoration:none">${esc(c.name)}</a>` : '未选择咖啡馆'}</span><span class="date">${esc(ci.date)}</span></div>
        ${c ? `<div class="hint" style="margin:2px 0">${esc(c.suburb)}</div>` : `<button class="warn" data-assign="${ci.id}" style="border:0">📍 点击选择咖啡馆</button>`}
        ${ci.rating ? `<div class="stars">${stars(ci.rating)}</div>` : ''}
        ${ci.drink ? `<div class="note">🥤 ${esc(ci.drink)}</div>` : ''}${ci.taste || ci.look || ci.value ? `<div class="hint" style="margin:2px 0">口味 ${ci.taste || '-'} · 颜值 ${ci.look || '-'} · 性价比 ${ci.value || '-'}</div>` : ''}${ci.note ? `<div class="note">${esc(ci.note)}</div>` : ''}
        <div style="text-align:right;margin-top:6px">${ci.formStatus === 'sent' ? '<span class="hint" style="float:left">📨 已提交表单</span>' : ''}<button class="edit" data-edit="${ci.id}">${ci.rating || ci.note || ci.drink ? '编辑' : '＋ 补充评分/心得'}</button></div></div></div>`;
    }).join('');
    app.onclick = e => {
      const ed = e.target.closest('[data-edit]'), as = e.target.closest('[data-assign]');
      if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false);
      if (as) { const ci = checkins.find(c => c.id === as.dataset.assign);
        openPicker(id => { ci.cafeId = id; saveCheckins(); checkBadges(); closeSheet(); toast('✅ 已更新'); render(); }, {allowLater: false}); }
    };
  },

  footprint() {
    setTop('我的足迹');
    const s = stats(), v = visitedIds(), pct = s.total ? Math.round(s.cafes / s.total * 100) : 0;
    const photos = [...checkins].filter(c => c.photo).slice(0, 9);
    const Lv = levelInfo();
    app.innerHTML = `<div class="player"><div class="player-ava">🧑</div><div class="player-main"><div class="player-name">Lv.${Lv.lv} ${Lv.title}</div><div class="xpbar big"><i style="width:${Lv.pct}%"></i></div><div class="hint" style="margin:3px 0 0">${Lv.into} / ${Lv.need} XP 升到下一级 · 总 ${Lv.xp} XP</div></div></div>
      <div class="hero"><h2>已解锁 ${s.cafes} / ${s.total} 个据点</h2><div class="progress" style="background:rgba(255,255,255,.3)"><i style="width:${pct}%"></i></div><div class="addr">墨尔本咖啡世界探索度 ${pct}%</div></div>
      <div class="stats"><div class="stat"><b>${s.count}</b><small>打卡次数</small></div><div class="stat"><b>${s.cafes}</b><small>据点</small></div><div class="stat"><b>${s.suburbs}</b><small>个区域</small></div></div>
      <div class="section-title">足迹地图 <a href="#/map" style="text-decoration:none">全部地图 ›</a></div><div id="fpMap" class="sk-mini"></div>
      <div class="section-title">区域收集</div><div class="regions">${regions().map(r => `<div class="region ${r.done === r.total ? 'full' : ''}"><div class="rg-top"><b>${r.done === r.total ? '👑 ' : ''}${esc(r.name)}</b><small class="hint" style="margin:0 auto 0 6px">${esc(r.id === 'more' ? '' : r.zh)}</small><span>${r.done}/${r.total}</span></div><div class="progress"><i style="width:${Math.round(r.done / r.total * 100)}%"></i></div></div>`).join('')}</div>
      <div class="section-title">成就</div><div class="badges">${BADGES.map(b => `<div class="bdg ${b.test(s) ? '' : 'off'}"><span class="e">${b.e}</span>${b.name}</div>`).join('')}</div>
      <div class="section-title">照片墙 <a href="#/records" style="font-size:13px;color:var(--brown);font-weight:600;text-decoration:none">全部记录 ›</a></div>
      ${photos.length ? `<div class="grid3">${photos.map(p => `<img src="${p.photo}" alt="" data-edit="${p.id}">`).join('')}</div>` : '<div class="hint">还没有照片，去拍一张吧 📷</div>'}
      <div class="section-title">去过的咖啡馆</div>${[...v].map(cafeById).filter(Boolean).map(cafeCard).join('') || '<div class="hint">还没有去过的咖啡馆</div>'}`;
    const top = regions().filter(r => r.id !== 'more').sort((x, y) => y.done - x.done)[0];
    const TR = REGIONS.find(r => r.id === (top && top.done ? top.id : 'city'));
    $('#fpMap').innerHTML = SketchMap.render(TR, {visited: v, cafeById}).svg;
    $('#fpMap').onclick = e => { const g = e.target.closest('[data-id]'); if (g) { location.hash = '#/cafe/' + g.dataset.id; return; } mapState.region = TR.id; location.hash = '#/map'; };
    app.onclick = e => { const ed = e.target.closest('[data-edit]'); if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false); };
  },

  cafe(id) {
    const c = cafeById(id);
    if (!c) { app.innerHTML = '<div class="empty">找不到这家咖啡馆</div>'; return; }
    setTop(c.name, '', true);
    const cis = checkinsOf(id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const hero = cis.find(x => x.photo);
    const avg = cis.filter(x => x.rating).length ? (cis.reduce((s, x) => s + (x.rating || 0), 0) / cis.filter(x => x.rating).length).toFixed(1) : null;
    const d = lastPos ? fmtDist(distM(lastPos, [c.lat, c.lng])) : null;
    app.innerHTML = `${hero ? `<img class="hero-photo" src="${hero.photo}" alt="">` : ''}
      <div class="hero"><div class="hero-reg">${regionOf(c.id).no ? `<span class="num">${regionOf(c.id).no}</span> ` : ''}${esc(regionOf(c.id).r.name)}</div><h2>${esc(c.name)}</h2><div class="addr">📍 ${esc(c.address)}</div><div class="addr" style="margin-top:4px">${esc(c.suburb)}${d ? ' · 距你 ' + d : ''}${avg ? ' · 我的评分 ' + avg + ' ★' : ''}</div></div>
      <div>${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${c.custom ? '<span class="tag">我添加的</span>' : ''}</div>
      <button class="btn" id="ciBtn">☕ 在这里打卡</button>
      <div class="row"><a class="btn ghost" target="_blank" rel="noopener" id="gmLink" href="${MapKit.gmapsLink(c)}">🧭 在 Google 地图中打开</a>
      <button class="btn ghost" id="mapBtn">🗺️ 地图上看</button></div>
      <div class="section-title">我的打卡（${cis.length}）</div>
      ${cis.map(ci => `<div class="rec">${ci.photo ? `<img src="${ci.photo}" alt="">` : ''}<div class="body"><div class="top"><span class="stars">${stars(ci.rating) || '<span class="hint">未评分</span>'}</span><span class="date">${esc(ci.date)}</span></div>${ci.drink ? `<div class="note">🥤 ${esc(ci.drink)}</div>` : ''}${ci.note ? `<div class="note">${esc(ci.note)}</div>` : ''}<div style="text-align:right"><button class="edit" data-edit="${ci.id}">编辑</button></div></div></div>`).join('') || '<div class="hint">还没在这里打过卡</div>'}
      ${c.custom ? '<button class="btn danger" id="delCafe">删除这家咖啡馆</button>' : ''}`;
    $('#ciBtn').onclick = () => openCheckinForm({id: uid(), cafeId: id, photo: '', rating: 0, drink: '', note: '', date: today(), createdAt: Date.now()}, true);
    $('#mapBtn').onclick = () => { const ro = regionOf(c.id); if (ro.no) mapState.region = ro.r.id; else { mapState.region = 'real'; pendingFocus = c; } location.hash = '#/map'; };
    app.onclick = e => { const ed = e.target.closest('[data-edit]'); if (ed) openCheckinForm(checkins.find(x => x.id === ed.dataset.edit), false); };
    const dc = $('#delCafe');
    if (dc) dc.onclick = () => { if (!confirm('删除这家咖啡馆？相关打卡会变成「未选择咖啡馆」')) return;
      customCafes = customCafes.filter(x => x.id !== id); save(K.cafes, customCafes);
      checkins.forEach(x => { if (x.cafeId === id) x.cafeId = null; }); saveCheckins(); location.hash = '#/list'; };
  },

  add() {
    setTop('添加咖啡馆', '', true);
    const subs = [...new Set(allCafes().map(c => c.suburb))].sort();
    let pos = null;
    app.innerHTML = `<div class="field"><label>名称 *</label><input id="aName" placeholder="例如：Pentimento"></div>
      <div class="field"><label>区域 (Suburb) *</label><input id="aSub" list="subList" placeholder="例如：Fitzroy"><datalist id="subList">${subs.map(s => `<option value="${esc(s)}">`).join('')}</datalist></div>
      <div class="field"><label>地址</label><input id="aAddr" placeholder="例如：234 Brunswick St, Fitzroy"></div>
      <div class="field"><label>位置</label><button class="btn ghost" style="margin:0" id="aLoc">📍 使用我当前的位置</button><div class="hint" id="aLocHint">如果你现在就在店里，点上面最准；否则会根据地址自动查找位置。</div></div>
      <button class="btn" id="aSave">保存</button>`;
    $('#aLoc').onclick = async () => { $('#aLocHint').textContent = '定位中…'; pos = await locate();
      $('#aLocHint').textContent = pos ? `✓ 已获取位置 (${pos[0].toFixed(5)}, ${pos[1].toFixed(5)})` : '无法获取定位，将根据地址查找'; };
    $('#aSave').onclick = async () => {
      const name = $('#aName').value.trim(), suburb = $('#aSub').value.trim(), address = $('#aAddr').value.trim();
      if (!name || !suburb) return toast('请填写名称和区域');
      let ll = pos;
      if (!ll) {
        $('#aSave').textContent = '查找位置中…';
        try {
          const q = encodeURIComponent(`${address || name}, ${suburb}, Victoria, Australia`);
          const r = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q=${q}`)).json();
          if (r[0]) ll = [+r[0].lat, +r[0].lon];
        } catch {}
      }
      if (!ll) { ll = CBD; toast('没找到准确位置，暂时放在 CBD，可之后再改'); }
      const c = {id: 'c_' + uid(), name, suburb, address: address || suburb, lat: ll[0], lng: ll[1], tags: [], custom: true};
      customCafes.push(c); save(K.cafes, customCafes);
      toast('已添加 ' + name);
      if (pendingAssign) { const f = pendingAssign; pendingAssign = null; window.addEventListener('hashchange', () => setTimeout(() => f(c.id), 0), {once: true}); location.hash = '#/records'; }
      else location.hash = '#/cafe/' + c.id;
    };
  },
};

function setTop(title, right = '', back = false) {
  $('#title').textContent = title; $('#topRight').innerHTML = right;
  $('#backBtn').classList.toggle('hidden', !back);
  $('#hud').classList.toggle('hidden', back); drawHud();
}
$('#backBtn').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/list');

function render() {
  mapToken++; if (mapRef) { mapRef.remove(); mapRef = null; }
  app.classList.remove('full'); app.onclick = null;
  const [, name = 'list', arg] = (location.hash || '#/list').split('/');
  const v = views[name] ? name : 'list';
  document.querySelectorAll('#tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === v));
  try { views[v](arg && decodeURIComponent(arg)); }
  catch (e) { console.error('view render failed', e); app.innerHTML = `<div class="card"><b>页面出了点问题 😵</b><div class="hint">${String(e && e.message || e).replace(/[<>&]/g, '')}</div><a class="btn" href="#/list">回到发现页</a></div>`; }
  if (!['cafe', 'add'].includes(v)) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { closeSheet(); render(); });
render();
// quietly fetch location if already permitted (for distances), never prompt on load
if (navigator.permissions) navigator.permissions.query({name: 'geolocation'}).then(p => { if (p.state === 'granted') locate().then(() => render()); }).catch(() => {});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
window.__mcc = {get checkins() { return checkins; }, get map() { return mapRef; }}; // for testing
window.__appBooted = true; document.documentElement.classList.add('booted');
})();
