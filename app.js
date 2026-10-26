(() => {
'use strict';
// Optional modules must never take the main UI down: stub them if they failed to load.
if (!window.MapKit) window.MapKit = {hasKey: false, provider: 'none', create: () => Promise.reject(new Error('map module unavailable')), nearbyCafes: async () => [], gmapsLink: c => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((c.name || '') + ' ' + (c.address || c.suburb || 'Melbourne'))};
if (!window.Integrations) window.Integrations = {visionOn: false, formOn: false, recognizeFood: async () => null, submitToGoogleForm: async () => ({ok: false})};
if (!window.Beans) window.Beans = {FIELDS: [['name', '豆名'], ['roaster', '烘焙商'], ['origin', '产地国家'], ['region', '产区'], ['farm', '庄园/生产者'], ['variety', '品种'], ['process', '处理法'], ['roast', '烘焙度'], ['roastDate', '烘焙日期'], ['altitude', '海拔'], ['notes', '风味'], ['weight', '重量']],
  ocr: () => Promise.reject(new Error('识别模块没有加载')), vision: async () => null, parse: () => ({}), visionOn: false, beanSprite: () => null,
  toText: b => [b.name, b.roaster, b.origin, b.notes].filter(Boolean).join('\n')};
if (!window.SketchMap) window.SketchMap = {render: () => ({svg: '<div class="empty">草图地图暂不可用</div>', meIn: false})};

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K = {cafes: 'mcc.customCafes', checkins: 'mcc.checkins', beans: 'mcc.beans'};
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
let beans = load(K.beans, []);
const saveBeans = () => save(K.beans, beans);
const visitedIds = () => new Set(checkins.filter(c => c.cafeId).map(c => c.cafeId));
const checkinsOf = id => checkins.filter(c => c.cafeId === id);
const isClosed = c => !!(c && c.closed); // permanently closed: stays listed (history kept) but never suggested
// 🗺️ closed cafes are hidden from every map (and from map/area completion totals); data + check-in history stay
const mapCafes = () => allCafes().filter(c => !isClosed(c));
const mapRegion = R => R && ({...R, cafes: Object.fromEntries(Object.entries(R.cafes).filter(([id]) => !isClosed(cafeById(id))))});
window.cafeById = cafeById; // valley.js greeting() checks .closed
const sigOf = id => (window.SIGNATURES || {})[id] || null;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
function sigLine(c) { const g = sigOf(c.id); return g && g.s.length ? `<div class="sig-line"><b>招牌</b> ${g.s.map(x => esc(x[0])).join(' · ')}</div>` : ''; }
function sigBox(c) { const g = sigOf(c.id); if (!g || !g.s.length) return '';
  return `<div class="card sig-box${isClosed(c) ? ' was' : ''}" id="sigBox"><div class="sig-head"><span class="sig-tag">招牌</span>${isClosed(c) ? '<span class="sig-low">关店前的招牌</span>' : g.c === 'low' ? '<span class="sig-low">信息较少</span>' : ''}${g.src ? `<a class="sig-src" href="${esc(g.src)}" target="_blank" rel="noopener">来源 · ${esc(hostOf(g.src))} ↗</a>` : ''}</div>
    <ul class="sig-list">${g.s.map(([it, note]) => `<li><b>${esc(it)}</b>${note ? `<span>${esc(note)}</span>` : ''}</li>`).join('')}</ul></div>`; }
const closedBadge = '<span class="badge-closed">已关店</span>';
const PXI = () => isV() && !!window.PixUI; // valley: original pixel icons instead of emoji
const ic = (name, emo) => PXI() ? PixUI.img(name) : emo;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Melbourne local date (the app's home timezone); window.__valleyNow pins the clock for tests
const nowMs = () => window.__valleyNow != null ? +new Date(window.__valleyNow) : Date.now();
const MEL_FMT = new Intl.DateTimeFormat('en-CA', {timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit'});
const melDate = ms => { try { return MEL_FMT.format(new Date(ms)); } catch (e) { const d = new Date(ms); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); } };
const today = () => melDate(nowMs());
const stars = n => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';

// ---------- 🎨 theme: cozy valley (default) · JRPG · sketch ----------
// valley + JRPG share the pixel engine (data-theme=jrpg); valley adds data-skin=valley on top.
// 🏰 foundation (default, warm painterly town) · 🐄 ranch (牧场: bright SNES-era farm life, built on the valley engine) · 🌾 valley · ⚔️ jrpg · ✏️ sketch
const THEMES = ['foundation', 'ranch', 'valley', 'jrpg', 'sketch'];
let THEME = load('mcc.theme', 'foundation'); if (!THEMES.includes(THEME)) THEME = 'foundation';
const isJ = () => (THEME === 'jrpg' || THEME === 'valley' || THEME === 'ranch') && !!window.JRPG;
const isV = () => (THEME === 'valley' || THEME === 'ranch') && isJ() && !!window.Valley;
const isR = () => THEME === 'ranch' && isV();
const isF = () => THEME === 'foundation';
const SFXplay = n => { try { if (window.JRPG) JRPG.SFX.play(n); } catch (e) {} };
function applyTheme() {
  const t = isJ() ? 'jrpg' : isF() ? 'foundation' : 'sketch', h = document.documentElement; h.dataset.theme = t;
  if (isV()) h.dataset.skin = 'valley'; else delete h.dataset.skin;
  if (isR()) h.dataset.ranch = '1'; else delete h.dataset.ranch;
  if (window.Valley && Valley.setStyle) Valley.setStyle(isR() ? 'ranch' : 'valley');
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = isR() ? '#e07a2a' : isV() ? '#7a4a25' : isF() ? '#3e2c1e' : t === 'jrpg' ? '#0b0f2a' : '#f7f4ec';
}
applyTheme();
function setTheme(t) { THEME = t; save('mcc.theme', t); if (t === 'sketch' && window.__sketchFonts) window.__sketchFonts(); applyTheme(); const d = $('#dlg'); if (d) d.classList.remove('show'); render(); }
document.addEventListener('click', e => { const b = e.target.closest('[data-snd]'); if (b && window.JRPG) { JRPG.SFX.set(!JRPG.SFX.on); } });
// ---------- ❤️ stamina (体力 / HP): 100 per Melbourne day, each check-in today costs 20, floors at 0 ----------
// Purely derived from today's check-ins → editing a date / deleting a check-in updates it; refills at local midnight by date (sleeping never refills).
const ST_MAX = 100, ST_COST = 20, ST_LOW = 40, ST_WARN = '今天咖啡喝得有点多哦～喝点水吧', ST_OUT = '体力耗尽！明天再来吧';
const ciDay = c => c.date || melDate(c.createdAt || 0);
const todayCheckins = () => { const t = today(); return checkins.filter(c => ciDay(c) === t); };
const stamina = () => Math.max(0, ST_MAX - ST_COST * todayCheckins().length);
const stCls = v => v > 60 ? 'st-hi' : v > 20 ? 'st-mid' : 'st-lo';
const isJonly = () => isJ() && !isV();
function stBar(v = stamina()) {
  const lab = isJonly() ? 'HP' : '体力';
  return `<div class="hud-bar st-row${v <= 0 ? ' st-empty' : ''}" data-st="${v}"><span>${lab}</span><div class="xpbar stbar ${stCls(v)}" role="meter" aria-label="${lab}" aria-valuemin="0" aria-valuemax="${ST_MAX}" aria-valuenow="${v}"><i style="width:${v}%"></i></div><em class="st-num">${v}${isV() ? '' : '/' + ST_MAX}</em></div>`;
}
const stOutTold = {};
let stDrop = null; // {from, to, cafeId} → played on the HUD once no popup covers it
function staminaTalk(cafeId) {
  const v = stamina(); if (v > ST_LOW) return;
  const msg = v <= 0 ? ST_OUT : ST_WARN, known = cafeId && cafeById(cafeId);
  if (isV()) { try { Valley.say(msg, 3800, known ? villagerOf(cafeId) : null); } catch (e) {} }
  else if (isJ()) { try { JRPG.say(msg, 3800, known ? '店员' : '旁白'); } catch (e) {} }
  else { const t = $('#toast'); t.textContent = (v <= 0 ? '😵 ' : '💧 ') + msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3800); }
}
function playStDrop() {
  if (!stDrop) return; const cel = $('#celebrate'); if (cel && !cel.classList.contains('hidden')) return;
  const H = $('#hud'), bar = $('#hud .stbar'); if (!bar) return;
  if (H.classList.contains('hidden')) { H.classList.remove('hidden'); H.classList.add('st-peek'); clearTimeout(playStDrop._p); playStDrop._p = setTimeout(() => { if (H.classList.contains('st-peek')) { H.classList.remove('st-peek'); H.classList.add('hidden'); } }, 2600); } // pages without a HUD (cafe page): peek it in for the hit
  const {from, to, cafeId} = stDrop; stDrop = null;
  const i = bar.querySelector('i'), row = bar.closest('.hud-bar'), num = row.querySelector('.st-num');
  if (from > to) { i.style.transition = 'none'; i.style.width = from + '%'; bar.classList.remove('st-hi', 'st-mid', 'st-lo'); bar.classList.add(stCls(from)); void i.offsetWidth;
    setTimeout(() => { i.style.transition = ''; i.style.width = to + '%'; bar.classList.remove('st-hi', 'st-mid', 'st-lo'); bar.classList.add(stCls(to)); }, 40); }
  row.classList.remove('st-hit'); void row.offsetWidth; row.classList.add('st-hit');
  const n = document.createElement('b'); n.className = 'st-dmg' + (isJonly() ? ' jdmg' : '');
  n.textContent = from > to ? (isJonly() ? 'HP ' : '') + '-' + (from - to) : (isJonly() ? 'HP 0' : '体力耗尽');
  row.appendChild(n); if (num) num.classList.add('st-tick');
  SFXplay('hit'); if (navigator.vibrate) try { navigator.vibrate(50); } catch (e) {}
  clearTimeout(playStDrop._t); playStDrop._t = setTimeout(() => { row.classList.remove('st-hit'); n.remove(); if (num) num.classList.remove('st-tick'); }, 1600);
  setTimeout(() => staminaTalk(cafeId), 700);
}

// ---------- 🌾 valley economy: coins, friendship, collections (all derived from check-ins) ----------
const byTime = () => [...checkins].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
function coinLedger() { const seen = new Set(), out = new Map();
  byTime().forEach(c => { let n = 15 + (c.rating || 0) * 5 + (c.photo ? 5 : 0) + (c.drink ? 5 : 0); if (c.cafeId && !seen.has(c.cafeId)) { n += 50; seen.add(c.cafeId); } out.set(c.id, n); }); return out; }
const BEAN_COINS = 20; // beans never touch stamina
const earnedCoins = () => { let t = beans.length * BEAN_COINS + questCoins(); coinLedger().forEach(v => { t += v; }); return t; };
const shopSpent = () => { try { return window.PixShop ? PixShop.spent() : 0; } catch (e) { return 0; } };
const totalCoins = () => Math.max(0, earnedCoins() - shopSpent()); // 🛒 purse = everything earned − what the shop took
// ---------- 📜 daily quests (每日委托): 3 per Melbourne day, picked deterministically from the date; rewards are coins you claim ----------
const QK = 'mcc.quests';
let questLog = load(QK, {claims: []}); if (!questLog || !Array.isArray(questLog.claims)) questLog = {claims: []};
const questCoins = () => questLog.claims.reduce((t, x) => t + (+x.c || 0), 0);
const QUEST_ALL_XP = 40, questXPof = x => x.id === 'all' ? QUEST_ALL_XP : Math.round((+x.c || 0) / 2); // ~15–30 XP per quest: a day of quests ≈ one extra check-in
const questXP = () => questLog.claims.reduce((t, x) => t + questXPof(x), 0);
// 📜 quest board fold state: folded by default, remembered for the current day
const QF = 'mcc.questFold', questOpen = () => { const f = load(QF, null); return !!(f && f.d === today() && f.open); };
const hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const bareName = n => itemKey(n).replace(/\(.*?\)|（.*?）/g, '').replace(/\s+/g, ' ').trim();
const sigMatch = (cafeId, drink) => { const g = sigOf(cafeId), d = bareName(drink); return !!(g && d.length > 1 && g.s.some(([n]) => { const k = bareName(n); return k.length > 1 && (k.includes(d) || d.includes(k)); })); };
const QUEST_BONUS = 50, FEST_BONUS = 80;
function dailyQuests(day = today()) {
  const tc = checkins.filter(c => ciDay(c) === day), seenBefore = new Set(checkins.filter(c => c.cafeId && ciDay(c) < day).map(c => c.cafeId));
  const prior = id => checkins.filter(c => c.cafeId === id && ciDay(c) < day).length, RG = REGIONS[hashStr(day + '#r') % REGIONS.length];
  const POOL = {
    new: {icon: 'map', t: '解锁一家没去过的店', c: 60, done: tc.some(c => c.cafeId && cafeById(c.cafeId) && !seenBefore.has(c.cafeId))},
    region: {icon: 'boot', t: `去 ${RG.name} 打一次卡`, c: 50, done: tc.some(c => c.cafeId && regionOf(c.cafeId).r.id === RG.id)},
    friend: {icon: 'heart', t: '回访老朋友（去过 2 次的店）', c: 40, done: tc.some(c => c.cafeId && prior(c.cafeId) >= 2)},
    sig: {icon: 'star', t: '点一道那家店的招牌', c: 50, done: tc.some(c => sigMatch(c.cafeId, c.drink))},
    photo: {icon: 'camera', t: '拍照打卡一次', c: 40, done: tc.some(c => c.photo)},
    rate: {icon: 'cup', t: '给一杯打 4 星以上', c: 30, done: tc.some(c => (c.rating || 0) >= 4)},
    note: {icon: 'quill', t: '写一句打卡心得', c: 30, done: tc.some(c => String(c.note || '').trim())},
    bean: {icon: 'bean', t: '拍一包咖啡豆', c: 40, done: beans.some(b => (b.date || '') === day)}};
  const visit = ['new', 'region', 'friend'], other = Object.keys(POOL).filter(k => !visit.includes(k)).sort((a, b) => hashStr(day + a) - hashStr(day + b)).slice(0, 2);
  const claimed = new Set(questLog.claims.filter(x => x.d === day).map(x => x.id));
  const fe = window.Fests ? Fests.on(day)[0] : null, ids = [visit[hashStr(day) % 3], ...other];
  if (fe) { POOL.fest = {icon: 'flag', t: `🎉 ${fe.zh}：今天去任意一家咖啡馆打卡`, c: FEST_BONUS, done: tc.some(c => c.cafeId), fest: fe}; ids.push('fest'); } // festival-day bonus quest
  return ids.map(id => ({id, ...POOL[id], claimed: claimed.has(id)}));
}
const questState = (day = today()) => { const q = dailyQuests(day); return {q, done: q.filter(x => x.done).length, ready: q.filter(x => x.done && !x.claimed).length, all: q.every(x => x.claimed)}; };
function questBoard(compact) {
  const S = questState(), coin = isV() ? Valley.coinImg() : '🪙', N = S.q.length;
  if (compact && !questOpen()) return `<button class="vwin jwin vl-quests compact folded${S.all ? ' all' : ''}${S.ready ? ' ready' : ''}" id="vlQuests" data-qfold aria-expanded="false">${ic('scroll', '📜')}<b>每日委托</b><span class="vqf-n">${S.done}/${N}</span>${S.all ? '<span class="vqf-s">✔ 全部完成</span>' : S.ready ? `<span class="vqf-s ready">· 可领 ${S.ready}</span>` : `<span class="vqf-s">· 奖励 ${coin}+XP</span>`}<span class="vqf-arr">▸</span></button>`;
  return `<div class="vwin jwin vl-quests${S.all ? ' all' : ''}${compact ? ' compact open' : ''}" id="vlQuests"><div class="vq-head"${compact ? ' data-qfold aria-expanded="true"' : ''}>${ic('scroll', '📜')}<b>今日委托</b><small>${S.done}/${N}</small><span class="vq-reset">每天 0 点刷新</span>${compact ? '<span class="vqf-arr">▾</span>' : ''}</div>
    ${S.all ? `<div class="vq-all">🎉 今天的委托全部完成！奖励 ${coin} +${QUEST_BONUS} · +${QUEST_ALL_XP} XP 已领取</div>` : ''}
    ${S.all && compact ? '' : S.q.map(x => `<div class="vq-row${x.done ? ' done' : ''}${x.claimed ? ' claimed' : ''}" data-q="${x.id}"><span class="vq-ic">${ic(x.icon, '•')}</span><span class="vq-t">${esc(x.t)}</span>${x.claimed ? '<span class="vq-ok">✔ 已领取</span>' : x.done ? `<button class="vq-claim" data-claim="${x.id}">领取 ${coin}${x.c}<small>+${questXPof(x)}XP</small></button>` : `<span class="vq-c">${coin}${x.c}<small>+${questXPof(x)}XP</small></span>`}</div>`).join('')}
    ${!S.all ? `<div class="vq-foot">${N === 3 ? '三' : '四'}项都领取再奖励 ${coin}+${QUEST_BONUS} · +${QUEST_ALL_XP} XP</div>` : ''}</div>`;
}
function bindQuests(root = app) { root.querySelectorAll('[data-claim]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); claimQuest(b.dataset.claim, b); });
  root.querySelectorAll('[data-qfold]').forEach(b => b.onclick = e => { e.preventDefault(); const box = $('#vlQuests'); if (!box) return; save(QF, {d: today(), open: !questOpen()}); SFXplay('blip'); refreshQuestBoard(); }); }
function refreshQuestBoard() { const box = $('#vlQuests'); if (!box) return; const fresh = document.createElement('div'); fresh.innerHTML = questBoard(box.classList.contains('compact')); box.replaceWith(fresh.firstElementChild); bindQuests(); }
function claimQuest(id, fromEl) {
  const d = today(), q = dailyQuests(d).find(x => x.id === id); if (!q || !q.done || q.claimed) return;
  const before = totalCoins(), L0 = levelInfo(), r = fromEl && fromEl.getBoundingClientRect(); questLog.claims.push({d, id, c: q.c}); let gain = q.c, xpGain = questXPof({id, c: q.c});
  if (dailyQuests(d).every(x => x.claimed) && !questLog.claims.some(x => x.d === d && x.id === 'all')) { questLog.claims.push({d, id: 'all', c: QUEST_BONUS}); gain += QUEST_BONUS; xpGain += QUEST_ALL_XP; }
  save(QK, questLog); SFXplay('coin');
  refreshQuestBoard();
  drawHud(); coinBurst(r, gain, before); xpPop(r, xpGain, L0);
  const L1 = levelInfo(); if (L1.lv > L0.lv) setTimeout(() => { SFXplay('harvest'); toast(`⬆️ 升级！Lv.${L1.lv} ${L1.title}`, 3000); }, 1300);
  else if (gain > q.c) setTimeout(() => toast(`🎉 今日委托全部完成！额外 +${QUEST_BONUS} 金币 · +${QUEST_ALL_XP} XP`), 700);
}
// 🪙 juice: coins fly from a point into the HUD purse, then the counter ticks up
function coinBurst(from, gain, startVal) {
  const to = $('#vlGold'), H = $('#hud'); if (!isV() || !to || !gain || (H && H.classList.contains('hidden'))) return;
  const end = totalCoins(), start = startVal != null ? startVal : end - gain, tr = to.getBoundingClientRect();
  const fx = from && from.width != null ? {x: from.left + from.width / 2, y: from.top + from.height / 2} : {x: innerWidth / 2, y: innerHeight / 2};
  to.textContent = fmtN(start); const n = Math.min(12, 4 + Math.floor(gain / 20)), layer = document.createElement('div'); layer.className = 'coin-fx'; document.body.appendChild(layer);
  const pop = document.createElement('b'); pop.className = 'coin-pop'; pop.textContent = '+' + gain; pop.style.left = fx.x + 'px'; pop.style.top = fx.y + 'px'; layer.appendChild(pop);
  let landed = 0; const src = Valley.coinIcon();
  for (let i = 0; i < n; i++) { const c = document.createElement('img'); c.src = src; c.className = 'coin-fly'; c.alt = ''; layer.appendChild(c);
    const sx = fx.x + (Math.random() - .5) * 60, sy = fx.y + (Math.random() - .5) * 30, mx = (sx + tr.left) / 2 + (Math.random() - .5) * 80, my = Math.min(sy, tr.top) - 40 - Math.random() * 60;
    const kf = [{transform: `translate(${fx.x - 9}px,${fx.y - 9}px) scale(.4)`, opacity: 0}, {transform: `translate(${sx - 9}px,${sy - 9}px) scale(1.2)`, opacity: 1, offset: .2}, {transform: `translate(${mx - 9}px,${my - 9}px) scale(1)`, opacity: 1, offset: .55}, {transform: `translate(${tr.left + tr.width / 2 - 9}px,${tr.top + tr.height / 2 - 9}px) scale(.7)`, opacity: .9}];
    let a = null; try { a = c.animate(kf, {duration: 760, delay: i * 55, easing: 'ease-in', fill: 'both'}); } catch (e) {}
    const land = () => { c.remove(); landed++; const v = Math.round(start + (end - start) * landed / n), t2 = $('#vlGold'); if (t2) { t2.textContent = fmtN(v); const g = t2.closest('.vc-gold'); if (g) { g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); } } if (landed % 3 === 1) SFXplay('coin'); if (landed === n) setTimeout(() => layer.remove(), 400); };
    if (a) a.onfinish = land; else setTimeout(land, 300 + i * 55); }
  setTimeout(() => { const t2 = $('#vlGold'); if (t2) t2.textContent = fmtN(totalCoins()); if (layer.isConnected) layer.remove(); }, 2600); // safety net
}
// ✨ "+N XP" rises from the claim button into the HUD XP bar; the bar refills from the old value and flashes
function xpPop(from, gain, L0) {
  const bar = $('#hud .xpbar'), H = $('#hud'); if (!gain || !bar || (H && H.classList.contains('hidden'))) return;
  const fx = from && from.width != null ? {x: Math.max(60, from.left - 46), y: from.top + 4} : {x: innerWidth / 2, y: innerHeight / 2}, tr = bar.getBoundingClientRect(); // left of the coins so the two pops don't overlap
  const b = document.createElement('b'); b.className = 'xp-pop'; b.textContent = '+' + gain + ' XP'; b.style.left = fx.x + 'px'; b.style.top = fx.y + 'px'; document.body.appendChild(b);
  const fill = bar.querySelector('i'), L1 = levelInfo(); if (fill && L0) { fill.style.transition = 'none'; fill.style.width = (L1.lv > L0.lv ? 0 : L0.pct) + '%'; }
  let a = null; try { a = b.animate([{transform: 'translate(-50%,0) scale(.6)', opacity: 0}, {transform: 'translate(-50%,-26px) scale(1.15)', opacity: 1, offset: .25}, {transform: 'translate(-50%,-30px) scale(1)', opacity: 1, offset: .55},
    {transform: `translate(${tr.left + tr.width / 2 - fx.x}px,${tr.top - fx.y}px) translate(-50%,0) scale(.55)`, opacity: .2}], {duration: 1100, delay: 250, easing: 'ease-in', fill: 'both'}); } catch (e) {}
  const land = () => { b.remove(); const f2 = $('#hud .xpbar i'), xb = $('#hud .xpbar'); if (f2) { f2.style.transition = 'width .6s ease-out'; f2.style.width = L1.pct + '%'; } if (xb) { xb.classList.remove('xp-flash'); void xb.offsetWidth; xb.classList.add('xp-flash'); } SFXplay('heart'); };
  if (a) a.onfinish = land; else setTimeout(land, 900);
}
// 🛍️ spending: coins leave the purse and fly to the item, the counter ticks down
function coinSpend(toEl, price, startVal) {
  const from = $('#vlGold'); if (!from || !price || !toEl) return; const fr = from.getBoundingClientRect(), tr = toEl.getBoundingClientRect(), end = totalCoins(), n = Math.min(10, 3 + Math.floor(price / 150));
  const layer = document.createElement('div'); layer.className = 'coin-fx spend'; document.body.appendChild(layer); const src = Valley.coinIcon(); let landed = 0;
  const pop = document.createElement('b'); pop.className = 'coin-pop minus'; pop.textContent = '-' + fmtN(price); pop.style.left = (fr.left + fr.width / 2) + 'px'; pop.style.top = (fr.bottom + 6) + 'px'; layer.appendChild(pop);
  for (let i = 0; i < n; i++) { const c = document.createElement('img'); c.src = src; c.className = 'coin-fly'; c.alt = ''; layer.appendChild(c);
    const sx = fr.left + fr.width / 2, sy = fr.top + fr.height / 2, ex = tr.left + tr.width / 2 + (Math.random() - .5) * 30, ey = tr.top + tr.height / 2, mx = (sx + ex) / 2 + (Math.random() - .5) * 90, my = Math.min(sy, ey) - 30 - Math.random() * 40;
    let a = null; try { a = c.animate([{transform: `translate(${sx - 9}px,${sy - 9}px) scale(.8)`, opacity: 1}, {transform: `translate(${mx - 9}px,${my - 9}px) scale(1.1)`, opacity: 1, offset: .45}, {transform: `translate(${ex - 9}px,${ey - 9}px) scale(.5)`, opacity: 0}], {duration: 700, delay: i * 60, easing: 'ease-in', fill: 'both'}); } catch (e) {}
    const land = () => { c.remove(); landed++; const t2 = $('#vlGold'); if (t2) { t2.textContent = fmtN(Math.round(startVal + (end - startVal) * landed / n)); const g = t2.closest('.vc-gold'); if (g) { g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); } } if (landed % 3 === 1) SFXplay('coin'); if (landed === n) { toEl.classList.add('bought'); setTimeout(() => layer.remove(), 500); } };
    if (a) a.onfinish = land; else setTimeout(land, 300 + i * 60); }
  setTimeout(() => { const t2 = $('#vlGold'); if (t2) t2.textContent = fmtN(totalCoins()); if (layer.isConnected) layer.remove(); }, 2400);
}
const heartsOf = id => Math.min(10, checkinsOf(id).length);
const villagerOf = id => { const v = Valley.villager(id, Math.max(0, allCafes().findIndex(c => c.id === id))); return isClosed(cafeById(id)) ? {...v, title: '前' + v.title} : v; };
const itemKey = n => String(n || '').trim().toLowerCase();
function collection() { const m = new Map();
  byTime().forEach(c => { if (!c.drink) return; const k = itemKey(c.drink); const e = m.get(k) || {name: c.drink, first: c.date, best: 0, n: 0}; e.n++; e.best = Math.max(e.best, c.rating || 0); m.set(k, e); }); return m; }
let _catalog = null;
function catalog() { if (_catalog) return _catalog; const seen = new Set(), out = [];
  [...(window.SAMPLE_MENU_DEFAULT || []), ...Object.values(window.SAMPLE_MENU_EXTRA || {}).flat()].forEach(i => { const k = itemKey(i.name); if (!seen.has(k)) { seen.add(k); out.push(i); } }); return (_catalog = out); }
const fmtN = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------- utils ----------
function toast(msg, ms = 2400) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  if (isV()) try { Valley.say(msg, ms); } catch (e) {}
  else if (isJ()) try { JRPG.say(msg, ms); } catch (e) {}
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
  $('#sheet').innerHTML = html; $('#sheetWrap').classList.remove('hidden'); document.documentElement.classList.add('sheet-open');
  onMount && onMount($('#sheet'));
}
function closeSheet() { $('#sheetWrap').classList.add('hidden'); document.documentElement.classList.remove('sheet-open'); $('#sheet').innerHTML = ''; }
$('#sheetBg').onclick = () => { closeSheet(); render(); };

// ---------- cafe picker ----------
function cafeFromPlace(p) {
  let c = customCafes.find(x => x.placeId === p.placeId);
  if (!c) { c = {id: 'g_' + uid(), name: p.name, suburb: p.suburb, address: p.address, lat: p.lat, lng: p.lng, placeId: p.placeId, tags: ['Google 附近'], custom: true}; customCafes.push(c); save(K.cafes, customCafes); }
  return c.id;
}
function openPicker(onPick, {title = '在哪家咖啡馆？', pos = lastPos, allowLater = true, places = []} = {}) {
  let list = allCafes().map(c => ({c, d: pos ? distM(pos, [c.lat, c.lng]) : null}));
  if (pos) list.sort((a, b) => isClosed(a.c) - isClosed(b.c) || a.d - b.d); else list.sort((a, b) => isClosed(a.c) - isClosed(b.c) || a.c.name.localeCompare(b.c.name));
  const item = ({c, d}, i) => `<div class="picker-item ${pos && i === 0 && d < 1000 && !isClosed(c) ? 'near' : ''}${isClosed(c) ? ' closed' : ''}" data-id="${c.id}"><div><b>${esc(c.name)}</b>${isClosed(c) ? ' ' + closedBadge : ''}<div class="hint" style="margin:2px 0 0">${esc(c.suburb)}</div></div><span class="d">${d != null ? fmtDist(d) : ''}</span></div>`;
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
  openSheet(`<h3>${isNew ? (PXI() ? ic('cup', '') + ' 打卡' : '打卡 ☕') : (PXI() ? ic('quill', '') + ' 编辑打卡' : '编辑打卡')}</h3>
    <div class="field"><label>照片</label><div class="photo-drop" id="fPhoto"></div></div>
    <div class="field"><label>咖啡馆</label><button class="btn ghost" style="margin:0;text-align:left" id="fCafe"></button></div>
    <div class="field"><label>评分</label><div class="star-input" id="fStars">${[1,2,3,4,5].map(n => `<span data-n="${n}">★</span>`).join('')}</div></div>
    <div class="field"><label>点了什么</label><input id="fDrink" placeholder="例如：Flat White、Magic、手冲埃塞俄比亚" value="${esc(draft.drink)}"><div class="chips" id="fMenu" style="margin-top:6px"></div></div>
    <div class="field"><label>心得</label><textarea id="fNote" rows="3" placeholder="味道、环境、推荐指数…">${esc(draft.note)}</textarea></div>
    <div class="field"><label>日期</label><input type="date" id="fDate" value="${esc(draft.date || today())}"></div>
    <button class="btn" id="fSave">${isNew ? '保存打卡' : '保存'}</button>
    ${isNew ? '' : '<button class="btn danger" id="fDel">删除这条打卡</button>'}`, el => {
    const drawPhoto = () => $('#fPhoto', el).innerHTML = draft.photo ? `<img src="${draft.photo}" alt="">` : PXI() ? `<span class="pd-empty">${PixUI.img('camera', 'big')}<span>点击添加照片（可选）</span></span>` : '📷 点击添加照片（可选）';
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
    near = allCafes().filter(c => !isClosed(c)).map(c => ({c, d: distM(pos, [c.lat, c.lng])})).sort((a, b) => a.d - b.d)[0];
    if (near && near.d > NEAR_M) near = null;
  }
  const assign = async id => {
    const x = checkins.find(c => c.id === ci.id); if (!x) return;
    x.cafeId = id; saveCheckins();
    if (isV()) { render(); const vg = villagerOf(id); Valley.say(Valley.greeting(vg, heartsOf(id) - 1, id), 2400, vg); }
    else if (isJ()) { render(); await JRPG.encounter(cafeById(id), before.visited.has(id)); }
    else toast(`📍 ${cafeById(id).name}`);
    render(); openRateSheet(x, before); // recognise + rate (optional), then unlock animation
  };
  if (near) return assign(near.c.id);
  const places = pos && MapKit.hasKey ? await MapKit.nearbyCafes(pos, 300) : [];
  openPicker(assign, {pos, places, title: '📸 已保存！在哪家咖啡馆？'});
}
// 📷 camera button = choice: 打卡 / 拍豆子
function closeCamMenu() { const m = $('#camMenu'); if (m) m.remove(); }
$('#camBtn').onclick = e => {
  if ($('#camMenu')) return closeCamMenu();
  const m = document.createElement('div'); m.id = 'camMenu'; m.className = 'cam-menu jwin vwin';
  m.innerHTML = `<button id="camCheckin"><span>${ic('camera', '☕')}</span>打卡</button><button id="camBeans"><span>${ic('bean', '🫘')}</span>拍豆子</button>`;
  document.body.appendChild(m); SFXplay('blip');
  $('#camCheckin').onclick = () => { closeCamMenu(); quickPhotoCheckin(); };
  $('#camBeans').onclick = () => { closeCamMenu(); captureBean(true); };
  setTimeout(() => document.addEventListener('click', function off(ev) { if (!ev.target.closest('#camMenu, #camBtn')) { closeCamMenu(); } document.removeEventListener('click', off, true); }, true), 0);
};

// ---------- 🫘 beans: photo → OCR text → editable fields → saved notes ----------
const OCR_STAGE = {'准备图片': ['🖼️ 预处理图片（缩放 · 灰度 · 对比度）', 0, 5], 'loading tesseract core': ['⚙️ 加载识别引擎', 5, 30], 'initializing tesseract': ['⚙️ 启动识别引擎', 30, 34],
  'loading language traineddata': ['📦 加载语言包', 34, 58], 'initializing api': ['⚙️ 初始化', 58, 62], 'recognizing text': ['🔍 正在识别文字', 62, 100]};
async function captureBean(useCamera) {
  const photo = await pickPhoto(useCamera); if (!photo) return;
  openBeanSheet({photo, isNew: true, auto: true});
}
function thumbOf(photo, max = 480) { return new Promise(res => { if (!photo) return res(''); const i = new Image(); i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); }; i.onerror = () => res(photo); i.src = photo; }); }
let beanToken = 0;
function openBeanSheet({photo = '', bean = null, isNew = !bean, auto = false}) {
  const d = bean ? {...bean} : {id: uid(), photo, raw: '', date: today(), createdAt: Date.now(), cafeId: ''};
  const tok = ++beanToken, chi = load('mcc.ocr.chi', false), V = isV();
  const fieldRow = ([k, zh]) => `<div class="bf"><label for="bf-${k}">${zh}</label>${k === 'notes' ? `<textarea id="bf-${k}" rows="2">${esc(d[k] || '')}</textarea>` : `<input id="bf-${k}" value="${esc(d[k] || '')}" autocomplete="off">`}</div>`;
  openSheet(`<h3>${V ? '🫘 种子情报' : '🫘 拍豆子'}${isNew ? '' : ' · 编辑'}</h3>
    <div class="bean-cap">${d.photo ? `<img src="${d.photo}" alt="豆子照片" id="bPhoto">` : '<div class="bean-nophoto">✍️ 手动输入</div>'}
      <div class="bean-ocr"><div class="ocr-st" id="ocrSt">${d.photo ? (auto ? '准备识别…' : '可以重新识别照片文字') : '没有照片，直接手动填写即可'}</div><div class="progress ocr-bar"><i id="ocrBar" style="width:0%"></i></div>
        <label class="ocr-chi"><input type="checkbox" id="ocrChi" ${chi ? 'checked' : ''}> 识别中文 <small>(+1.7MB，首次使用时下载)</small></label>
        ${d.photo ? '<button class="btn ghost sm" id="ocrRe">🔍 重新识别</button>' : ''}</div></div>
    <div class="bean-form">${Beans.FIELDS.map(fieldRow).join('')}
      <div class="bf wide"><label for="bCafe">在哪家店买的（可选）</label><select id="bCafe"><option value="">—— 不关联 ——</option>${allCafes().map(c => `<option value="${c.id}" ${d.cafeId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="bf wide"><label for="bMemo">备注</label><input id="bMemo" value="${esc(d.memo || '')}" placeholder="例如：适合手冲 1:15，93°C"></div></div>
    <div class="field"><label for="bRaw">识别到的原文（可修改）</label><textarea id="bRaw" rows="5" placeholder="OCR 原文会显示在这里，也可以直接粘贴/输入标签文字">${esc(d.raw || '')}</textarea>
      <button class="btn ghost sm" id="bReparse">↻ 按原文重新解析字段</button></div>
    <button class="btn game-btn" id="bSave">${V ? '🌱 收进种子袋' : '💾 保存豆子'}</button>
    <button class="btn ghost" id="bCancel">取消</button>`, el => {
    const setSt = (t, pct) => { const st = $('#ocrSt', el), bar = $('#ocrBar', el); if (st) st.textContent = t; if (bar && pct != null) bar.style.width = Math.round(pct) + '%'; };
    const fill = (f, onlyEmpty) => Beans.FIELDS.forEach(([k]) => { const i = $('#bf-' + k, el); if (i && f[k] && (!onlyEmpty || !i.value.trim())) i.value = f[k]; });
    const run = async () => {
      const myTok = beanToken; el.classList.add('ocr-busy'); const useChi = $('#ocrChi', el).checked; save('mcc.ocr.chi', useChi);
      try {
        let res = null;
        if (Beans.visionOn) { setSt('🤖 AI 正在读取标签…', 20); res = await Beans.vision(d.photo); }
        if (!res) res = await Beans.ocr(d.photo, {chi: useChi, onProgress: (status, p) => { if (myTok !== beanToken) return; const s = OCR_STAGE[status] || [status, 0, 100]; setSt(`${s[0]} ${Math.round(p * 100)}%`, s[1] + (s[2] - s[1]) * p); }});
        if (myTok !== beanToken || !$('#bRaw', el)) return;
        $('#bRaw', el).value = res.text; fill(res.fields || Beans.parse(res.text), false);
        setSt(res.source === 'vision' ? '✅ AI 识别完成，请检查字段' : `✅ 识别完成（置信度 ${res.confidence}%），请检查并修改字段`, 100); el.dataset.ocr = 'done'; SFXplay('confirm');
      } catch (e) { console.warn('bean OCR failed', e); if (myTok !== beanToken) return; const msg = e && typeof e === 'object' ? (e.message || '') : (e ? String(e) : ''); setSt('⚠️ 识别失败：' + (msg && msg !== 'undefined' ? msg : '识别引擎加载失败（网络或浏览器不支持）') + ' —— 可以直接手动填写/粘贴文字', 0); el.dataset.ocr = 'failed'; }
      finally { el.classList.remove('ocr-busy'); }
    };
    const re = $('#ocrRe', el); if (re) re.onclick = run;
    $('#ocrChi', el).onchange = e => save('mcc.ocr.chi', e.target.checked);
    $('#bReparse', el).onclick = () => { fill(Beans.parse($('#bRaw', el).value), false); setSt('↻ 已按原文重新解析', null); };
    $('#bCancel', el).onclick = () => { beanToken++; closeSheet(); render(); };
    $('#bSave', el).onclick = async () => {
      Beans.FIELDS.forEach(([k]) => { d[k] = $('#bf-' + k, el).value.trim(); }); d.raw = $('#bRaw', el).value.trim(); d.cafeId = $('#bCafe', el).value; d.memo = $('#bMemo', el).value.trim();
      if (!d.name && !d.raw && !d.roaster && !d.origin) return toast('至少填一个豆名或识别原文吧');
      if (!d.name) d.name = [d.origin, d.region].filter(Boolean).join(' ') || d.roaster || d.raw.split('\n')[0].slice(0, 30);
      if (isNew && d.photo) d.photo = await thumbOf(d.photo);
      d.updatedAt = Date.now(); beanToken++;
      const before = totalCoins(), i = beans.findIndex(b => b.id === d.id); if (i >= 0) beans[i] = d; else beans.unshift(d);
      if (!saveBeans()) { if (i < 0) beans.shift(); return; }
      closeSheet(); location.hash = '#/bean/' + d.id;
      if (!isNew) return toast('✅ 已保存修改');
      if (isV()) { const c = $('#celebrate'); Valley.seedPacket(c, {bean: d, coins: totalCoins() - before}, () => { c.className = 'hidden'; c.innerHTML = ''; render(); }); drawHud(); }
      else toast(isJ() ? `🫘 获得豆子情报：${d.name}！` : `🫘 已保存：${d.name}`);
    };
    if (auto && d.photo) run();
  });
}
async function copyText(t) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}
const beanText = b => Beans.toText({...b, cafeName: b.cafeId && cafeById(b.cafeId) ? cafeById(b.cafeId).name : ''});
const packetHue = b => (Math.abs([...(b.origin || b.name || 'x')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 360);
function beanCard(b) {
  const sub = [b.roaster, [b.origin, b.region].filter(Boolean).join(' · ')].filter(Boolean).join(' — '), tags = [b.process, b.roast].filter(Boolean);
  return `<a class="card bean-card" href="#/bean/${b.id}" data-bean="${b.id}">${b.photo ? `<img class="thumb" src="${b.photo}" alt="">` : '<span class="bean-ico">🫘</span>'}
    <div class="meta"><div class="name">${esc(b.name || '未命名豆子')}</div><div class="sub">${esc(sub || '—')}</div>${tags.length ? `<div class="bean-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div><span class="bean-date">${esc(b.date || '')}</span></a>`;
}
function beanPacket(b) { return `<a class="vl-packet" href="#/bean/${b.id}" style="--ph:${packetHue(b)}"><span class="pk-top">${esc(b.origin || '咖啡种子')}</span><canvas data-beanspr width="16" height="16"></canvas><b>${esc(b.name || '未命名')}</b><small>${esc([b.process, b.roast].filter(Boolean).join(' · ') || b.roaster || '')}</small></a>`; }
function paintBeanSprites(root) { const spr = Beans.beanSprite(); if (!spr) return; root.querySelectorAll('canvas[data-beanspr]').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(spr, 0, 0); }); }
function beansSection() { // compact section for the JRPG / sketch footprint pages
  return `<div class="section-title">🫘 ${isJ() ? '豆子图鉴' : '豆子笔记'} <small>${beans.length}</small> <a href="#/beans" style="text-decoration:none">全部 ›</a></div>
    ${beans.slice(0, 4).map(beanCard).join('') || '<div class="hint">还没有豆子，点中间相机选「拍豆子」</div>'}<button class="btn ghost" data-newbean>🫘 拍豆子</button>`;
}
document.addEventListener('click', e => { const nb = e.target.closest('[data-newbean]'); if (nb) { e.preventDefault(); captureBean(nb.dataset.newbean !== 'album'); } const mb = e.target.closest('[data-manualbean]'); if (mb) { e.preventDefault(); openBeanSheet({}); } });

// ---------- 🎮 game layer: XP, levels, celebration ----------
const TITLES = [[1, '咖啡新手'], [3, '拿铁学徒'], [5, 'Flat White 骑士'], [8, '烘焙大师'], [12, '墨尔本咖啡传说']];
function totalXP() {
  const s = stats(); let xp = 0;
  checkins.forEach(c => { xp += 20; if (c.photo) xp += 20; if (c.rating) xp += 10; if (c.drink || c.note) xp += 10; });
  xp += s.cafes * 100;
  xp += BADGES.filter(b => !b.noXp && b.test(s)).length * 50;
  xp += regions().filter(r => r.done === r.total).length * 150;
  xp += questXP();
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
  const out = REGIONS.map(r => { const ids = Object.keys(mapRegion(r).cafes); return {id: r.id, name: r.name, zh: r.zh, total: ids.length, done: ids.filter(i => v.has(i)).length}; });
  const more = mapCafes().filter(c => !REGION_OF[c.id]);
  out.push({id: 'more', name: REGION_MORE.name, zh: REGION_MORE.zh, total: more.length, done: more.filter(c => v.has(c.id)).length});
  return out.filter(r => r.total);
}
// 🏰 resource-bar HUD (foundation)
function hudF() { const L = levelInfo(), k = window.Valley ? Valley.clock() : null, fe = k && k.fest[0], s = stats();
  return `<div class="fd-res" id="fdRes">
    <a class="fd-r coin" href="#/shop" aria-label="金币">${FD.icon('coin')}<b id="fdGold">${fmtN(totalCoins())}</b></a>
    <span class="fd-r lv" title="${esc(L.title)}">${FD.icon('star')}<b>Lv.${L.lv}</b><span class="fd-xp"><i style="width:${L.pct}%"></i></span></span>
    <span class="fd-r bld" title="已建成的据点">${FD.icon('house')}<b>${s.open}</b><small>/${s.total}</small></span>
    ${k ? `<a class="fd-r day" href="#/calendar" id="fdDay" aria-label="小镇日历">${FD.icon('cal')}<b>${k.zh}·${k.dayOf}</b><small class="fd-wx" title="小镇天气（游戏内，非真实预报）">${k.wx ? k.wx.icon : ''}</small><small class="fd-time">${k.hhmm}</small></a>` : ''}
    <button class="fd-r mus${musicOn() ? ' on' : ''}" data-music aria-label="背景音乐" aria-pressed="${musicOn()}">${musicOn() ? '♪' : '♪̸'}</button></div>
    ${fe ? `<a class="fd-fest" href="#/calendar">${fe.icon} 今天是 ${esc(fe.zh)}${fe.approx ? '（约）' : ''}</a>` : ''}
    <div class="fd-st">${stBar()}</div>`; }
// 🐄 ranch rucksack: tool-slot bar (reuses existing pages)
const RK = [['calendar', '#/calendar', '日历', 'cal', '📅'], ['beans', '#/beans', '种子袋', 'bean', '🫘'], ['records', '#/records', '日记', 'quill', '📒'], ['footprint', '#/footprint', '背包', 'chest', '🎒'], ['shop', '#/shop', '杂货店', 'scroll', '🛒']];
function rkBar() { const cur = (location.hash || '#/list').split('/')[1] || 'list';
  return `<nav class="rk-bar" id="rkBar" aria-label="背包工具栏">${RK.map(([v, href, zh, icn, e], i) => `<a class="rk-slot${cur === v || (v === 'beans' && cur === 'bean') ? ' on' : ''}" href="${href}" data-rk="${v}"><span class="rk-k">${i + 1}</span>${ic(icn, e)}<small>${zh}</small></a>`).join('')}</nav>`; }
function drawHud() {
  const L = levelInfo();
  if (isF() && window.FD) { $('#hud').innerHTML = hudF(); return playStDrop(); }
  if (isV()) { const k = Valley.clock(), R = isR(), fe = k.fest && k.fest[0];
    $('#hud').innerHTML = `<div class="hud-lv">Lv.${L.lv}</div><div class="hud-main"><div class="hud-title">${L.title}</div>
      ${stBar()}
      <div class="hud-bar"><span>XP</span><div class="xpbar"><i style="width:${L.pct}%"></i></div><em>${L.into}/${L.need}</em></div></div>
      <div class="vl-clock" id="vlClock" data-season="${k.season}" data-phase="${k.phase}"><div class="vc-date">${k.wk} ${k.day}日</div>
        <div class="vc-mid"><span class="vc-sky">${k.sky}</span><span class="vc-season">${k.icon}${k.zh}·${k.dayOf}</span>${R && k.wx ? `<span class="vc-wx" title="小镇天气（游戏内，非真实预报）">${k.wx.icon}${k.wx.zh}</span>` : ''}</div><div class="vc-time">${k.hhmm}</div>
        <a class="vc-gold" href="#/shop" aria-label="金币商店">${Valley.coinImg()}<b id="vlGold">${fmtN(totalCoins())}</b></a></div>
      <button class="mus-btn${musicOn() ? ' on' : ''}" data-music aria-label="背景音乐" aria-pressed="${musicOn()}">${PXI() ? PixUI.img(musicOn() ? 'note' : 'notex', 'pi') : musicOn() ? '🎵' : '🔕'}</button>${R && fe ? `<a class="rn-fest" href="#/calendar">${ic('flag', '🎌')} ${esc(fe.zh)}${fe.approx ? '（约）' : ''}</a>` : ''}${R ? rkBar() : ''}`;
    const qa = document.querySelector('#tabbar a[data-tab=list]'); if (qa) { const r = questState().ready; qa.classList.toggle('q-ready', r > 0); qa.dataset.qn = r || ''; }
    return playStDrop(); }
  if (isJ()) { const on = JRPG.SFX.on;
    $('#hud').innerHTML = `<div class="hud-lv">Lv.${L.lv}</div><div class="hud-main"><div class="hud-title">${L.title}</div>
      ${stBar()}
      <div class="hud-bar"><span>XP</span><div class="xpbar"><i style="width:${L.pct}%"></i></div><em>${L.into}/${L.need}</em></div></div>
      <button class="snd-btn" data-snd aria-label="音效开关" aria-pressed="${on}">${on ? '🔊' : '🔇'}</button>`;
    return playStDrop(); }
  $('#hud').innerHTML = `<div class="hud-lv">Lv.${L.lv}</div><div class="hud-main"><div class="hud-title">${L.title}</div><div class="xpbar"><i style="width:${L.pct}%"></i></div>${stBar()}</div><div class="hud-xp">${L.into}/${L.need}</div>`;
  playStDrop();
}
function snapshot() { return {n: checkins.length, st: stamina(), xp: totalXP(), lv: levelInfo().lv, badges: new Set(BADGES.filter(b => b.test(stats())).map(b => b.id)), visited: new Set(visitedIds()), coins: totalCoins(), tried: new Set(collection().keys())}; }
setInterval(() => { if (isV() && $('#vlClock')) { const k = Valley.clock(), el = $('#vlClock'); el.querySelector('.vc-time').textContent = k.hhmm; el.querySelector('.vc-sky').textContent = k.sky; }
  if (isF() && $('#fdDay')) { const t = $('#fdDay .fd-time'); if (t) t.textContent = Valley.clock().hhmm; } }, 20000);
function celebrate(before, cafeId, extra = '') {
  const after = snapshot(), c = cafeById(cafeId);
  const isNew = c && !before.visited.has(cafeId);
  const gain = after.xp - before.xp, lvUp = after.lv > before.lv;
  const newBadges = BADGES.filter(b => after.badges.has(b.id) && !before.badges.has(b.id));
  save('mcc.badges', [...after.badges]);
  const isCi = after.n > before.n; if (isCi) stDrop = {from: before.st, to: after.st, cafeId};
  const stLine = !isCi ? '' : after.st < before.st ? `${isJonly() ? 'HP' : '体力'} -${before.st - after.st}（剩 ${after.st}）` : before.st === 0 ? (isJonly() ? 'HP 已经是 0 了…' : '体力已经耗尽…') : '';
  const reg = c && regions().find(r => r.id === regionOf(c.id).r.id);
  const el = $('#celebrate');
  if (isV()) {
    const last = checkins.filter(x => x.cafeId === cafeId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || {};
    const coins = after.coins - before.coins, vg = c && villagerOf(cafeId), hTo = c ? heartsOf(cafeId) : 0, hFrom = c ? Math.min(10, Math.max(0, checkinsOf(cafeId).length - 1)) : 0;
    const newEntry = !!(last.drink && !before.tried.has(itemKey(last.drink)));
    const lines = [reg ? `<div class="vl-line">🗺️ ${esc(reg.name)} 探索 ${reg.done}/${reg.total}${reg.done === reg.total ? ' 👑 全区制霸！' : ''}</div>` : '',
      ...newBadges.map(b => `<div class="vl-line">🎒 放入背包：${b.e} ${b.name}</div>`), stLine ? `<div class="vl-line st-line">❤️ ${stLine}</div>` : '', extra];
    let stage = 'harvest';
    const done = () => { clearTimeout(celebrate._t); el.className = 'hidden'; el.innerHTML = ''; render(); if (coins > 0) setTimeout(() => coinBurst(null, coins, after.coins - coins), 120); };
    const next = () => { clearTimeout(celebrate._t);
      if (lvUp && stage === 'harvest') { stage = 'day'; const td = today(), led = coinLedger(), todays = checkins.filter(x => x.date === td);
        Valley.daySummary(el, {from: before.lv, to: after.lv, title: levelInfo().title, clk: Valley.clock(),
          rows: [['☕ 今日打卡', todays.length + ' 次'], ['🪙 今日金币', '+' + todays.reduce((s, x) => s + (led.get(x.id) || 0), 0)], ['✨ 获得经验', '+' + gain + ' XP'], ['📖 收藏', collection().size + ' 种']],
          friends: vg ? [{v: vg, from: hFrom, to: hTo}] : []}, done); celebrate._t = setTimeout(done, 12000); }
      else done(); };
    Valley.harvest(el, {isNew, closed: isClosed(c), cafe: c && c.name, item: last.drink || '', quality: Valley.quality(last.rating), coins, xp: gain, villager: vg, heartsFrom: hFrom, heartsTo: hTo, newEntry, lines}, next);
    clearTimeout(celebrate._t); celebrate._t = setTimeout(next, 10000);
    if (navigator.vibrate) navigator.vibrate([30, 50, 60]);
    drawHud(); return;
  }
  if (isJ()) {
    const last = checkins.filter(x => x.cafeId === cafeId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    const lines = [reg ? `<div class="cel-reg">🗺️ ${esc(reg.name)} 巡礼 ${reg.done}/${reg.total}${reg.done === reg.total ? ' 👑 区域制霸！' : ''}</div>` : '',
      ...newBadges.map(b => `<div class="cel-badge">🎒 获得装备：${b.e} ${b.name}</div>`), stLine ? `<div class="cel-reg st-line">💥 ${stLine}</div>` : '', extra];
    let stage = 'chest';
    const done = () => { clearTimeout(celebrate._t); el.classList.add('hidden'); el.className = 'hidden'; el.innerHTML = ''; render(); };
    const next = () => { clearTimeout(celebrate._t); if (lvUp && stage === 'chest') { stage = 'lv'; JRPG.levelUp(el, {from: before.lv, to: after.lv, title: levelInfo().title}, done); celebrate._t = setTimeout(done, 9000); } else done(); };
    JRPG.chest(el, {cafe: c && c.name, gain, item: JRPG.itemName(last && last.drink), lines, isNew}, next);
    clearTimeout(celebrate._t); celebrate._t = setTimeout(next, 9000);
    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
    drawHud(); return;
  }
  el.className = '';
  el.innerHTML = `<div class="cel-rays"></div><div class="confetti">${Array.from({length: 26}, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 7) * .08}s;background:${['#ef6f8f', '#fbd6df', '#8fa5b8', '#f7f4ec', '#c94a6b'][i % 5]}"></i>`).join('')}</div>
    <div class="cel-card">
      <div class="cel-pin"><span>${isNew ? '🔓' : '☕'}</span></div>
      <div class="cel-title">${isNew ? '据点解锁！' : '打卡成功！'}</div>
      ${c ? `<div class="cel-cafe">${esc(c.name)}</div>` : ''}
      <div class="cel-xp">+${gain} XP</div>
      ${lvUp ? `<div class="cel-lv">⬆️ 升级到 Lv.${after.lv} · ${levelInfo().title}</div>` : ''}
      ${reg ? `<div class="cel-reg">🗺️ ${esc(reg.name)} 区域 ${reg.done}/${reg.total}${reg.done === reg.total ? ' 👑 全部收集！' : ''}</div>` : ''}
      ${newBadges.map(b => `<div class="cel-badge">🏆 新成就：${b.e} ${b.name}</div>`).join('')}
      ${stLine ? `<div class="cel-reg st-line">❤️ ${stLine}</div>` : ''}
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
  const V = isV();
  openSheet(`<h3>${V ? '🧺 今天收获了什么？' : isJ() ? '⚔️ 品尝时间！选择你的战利品' : '🍽️ 这次点了什么？'}</h3>
    <div class="rate-head">${ci.photo ? `<img src="${ci.photo}" alt="">` : ''}<div><b>${esc(c.name)}</b><div class="hint" id="rcStatus">${Integrations.visionOn ? '🔍 AI 正在识别照片…' : '从菜单里选一个吧'}</div></div></div>
    <div class="chips wrap" id="menuChips">${menu.map(m => `<button class="chip" data-item="${esc(m.name)}">${m.type === 'food' ? '🥐' : '☕'} ${esc(m.name)}</button>`).join('')}<button class="chip" data-item="__other">✏️ 其他</button></div>
    <div class="hint">${MENU_VERIFIED ? '' : '＊示例菜单，非该店官方菜单'}</div>
    <div class="field hidden" id="otherWrap"><input id="otherIn" placeholder="输入你点的东西"></div>
    ${V ? `<div class="field"><label>这一杯的品质</label><div class="jmenu rate-menu vl-rate" id="rateMenu">${[[5, '紫晶星', '人间极品！'], [4, '金星', '非常好喝'], [3, '银星', '还不错哦'], [2, '铜星', '普普通通'], [1, '铜星', '下次换一杯']].map(([n, q, t]) => `<button class="jmenu-item" data-n="${n}"><i class="vq ${Valley.quality(n).k}"></i><b>${q}</b> <span class="st">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span> ${t}</button>`).join('')}</div><div class="hidden">${starRow('rating')}</div></div>`
    : isJ() ? `<div class="field"><label>评价这一杯</label><div class="jmenu rate-menu" id="rateMenu">${[[5, '传说之杯'], [4, '稀有珍品'], [3, '冒险者之选'], [2, '普通补给'], [1, '苦涩药水']].map(([n, t]) => `<button class="jmenu-item" data-n="${n}"><span class="st">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span> ${t}</button>`).join('')}</div><div class="hidden">${starRow('rating')}</div></div>`
      : `<div class="field"><label>总评分</label>${starRow('rating')}</div>`}
    <div class="subrates"><div><label>口味</label>${starRow('taste', 'sm')}</div><div><label>颜值</label>${starRow('look', 'sm')}</div><div><label>性价比</label>${starRow('value', 'sm')}</div></div>
    <div class="field"><textarea id="rNote" rows="2" placeholder="一句话心得（可选）">${esc(d.note)}</textarea></div>
    <button class="btn game-btn" id="rDone">${V ? '🧺 收获！' : isJ() ? '🎁 打开宝箱' : '🔓 完成'}${Integrations.formOn ? '并提交' : ''}</button>
    <button class="btn ghost" id="rSkip">跳过，直接解锁</button>`, el => {
    const drawChips = () => el.querySelectorAll('#menuChips .chip').forEach(b => b.classList.toggle('on', b.dataset.item === d.item || (b.dataset.item === '__other' && d.item && !menu.some(m => m.name === d.item))));
    const drawStars = () => { el.querySelectorAll('.star-input').forEach(r => r.querySelectorAll('span').forEach(s => s.classList.toggle('on', +s.dataset.n <= d[r.dataset.k])));
      el.querySelectorAll('#rateMenu .jmenu-item').forEach(b => b.classList.toggle('on', +b.dataset.n === d.rating)); };
    drawChips(); drawStars();
    const rm = $('#rateMenu', el); if (rm) rm.onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; d.rating = +b.dataset.n; SFXplay('blip'); drawStars(); };
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
  {id: 'all', e: '👑', name: '全部收集', test: s => s.open >= s.total},
  {id: 'overcaf', e: '⚡', name: '咖啡因过载', noXp: true, test: s => s.overcaf}, // checked in with 0 体力 · fun only, no XP
];
function stats() {
  const v = visitedIds(), cafes = [...v].map(cafeById).filter(Boolean);
  const per = {}, days = {}; checkins.forEach(c => { if (c.cafeId) per[c.cafeId] = (per[c.cafeId] || 0) + 1; const d = ciDay(c); days[d] = (days[d] || 0) + 1; });
  return {overcaf: Object.values(days).some(n => n > ST_MAX / ST_COST), count: checkins.length, cafes: cafes.length, open: cafes.filter(c => !isClosed(c)).length, total: mapCafes().length, totalAll: allCafes().length,
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
mapState.jmode = load('mcc.mapMode.jrpg', null) || 'px';
mapState.fmode = load('mcc.mapMode.f', null) || (can3D ? '3d' : '2d');
let pxFailed = false; const heroAt = {};
const dynImport = (() => { try { return new Function('u', 'return import(u)'); } catch (e) { return () => Promise.reject(new Error('dynamic import unsupported')); } })();
function loadMap3d() {
  if (map3dMod) return Promise.resolve(map3dMod);
  const url = new URL('map3d.js?v=9', document.baseURI).href;
  return Promise.race([dynImport(url), new Promise((_, rej) => setTimeout(() => rej(new Error('3D 模块加载超时')), 15000))]).then(m => (map3dMod = m));
}
const app = $('#app');
const listState = {q: '', suburb: '', filter: 'all'};

function cafeCard(c) {
  const cis = checkinsOf(c.id), last = cis.find(x => x.photo);
  const d = lastPos ? ' · ' + fmtDist(distM(lastPos, [c.lat, c.lng])) : '';
  const ro = regionOf(c.id);
  const num = `<span class="num ${cis.length ? 'done' : ''}" title="${esc(ro.r.name)}">${ro.no || '☕'}</span>`;
  return `<a class="card${isClosed(c) ? ' closed' : ''}${PXI() ? ' vl-card' : ''}" href="#/cafe/${c.id}">
    ${PXI() ? `<span class="vl-shopic${cis.length ? ' lit' : ''}"><img src="${PixUI.shopUrl(c.id, cis.length > 0, isClosed(c))}" alt="">${ro.no ? num : ''}</span>` : isF() && window.FD ? `<span class="fd-bic${cis.length ? ' built' : ''}"><img src="${FD.url(c.id, cis.length > 0 && !isClosed(c))}" alt="">${ro.no ? num : ''}</span>` : num}
    ${last ? `<img class="thumb" src="${last.photo}" alt="">` : ''}
    <div class="meta"><div class="name">${esc(c.name)}</div><div class="sub">${esc(ro.r.name)} · ${esc(c.suburb)}${d} · ${esc(c.address)}</div>${sigLine(c)}${window.GReviews || window.Websites ? `<div class="gr-line">${window.GReviews ? GReviews.chipHtml(c) : ''}${window.Websites ? Websites.chipHtml(c) : ''}</div>` : ''}</div>
    ${isClosed(c) ? closedBadge : cis.length ? `<span class="badge-done">⭐ ${cis.length}次</span>` : '<span class="badge-new">🔒 未解锁</span>'}</a>`;
}

// 🎉 festival banner (today, or the next one within a week)
function festBanner() { if (!window.Fests || !(isV() || isF())) return ''; const d = today(), f = Fests.on(d)[0];
  if (f) return `<a class="fest-banner today" href="#/calendar/${d.slice(0, 7)}">${ic('flag', '🎉')}<span><b>${f.icon} 今天是 ${esc(f.zh)}${f.approx ? '（约）' : ''}</b><small>${esc(f.en)} · ${f.kind === 'ph' ? '维州公众假期' : '墨尔本活动'} · 节日委托 +${FEST_BONUS} 金币</small></span></a>`;
  const n = Fests.upcoming(d, 1)[0]; if (!n) return ''; const days = Math.round((Date.parse(n.date) - Date.parse(d)) / 864e5);
  return days > 0 && days <= 7 ? `<a class="fest-banner soon" href="#/calendar/${n.date.slice(0, 7)}">${ic('cal', '📅')}<span><b>${days} 天后：${n.icon} ${esc(n.zh)}${n.approx ? '（约）' : ''}</b><small>${esc(n.en)} · ${n.date}</small></span></a>` : ''; }
const SEASON_ZH = {spring: ['🌸', '春'], summer: ['☀️', '夏'], autumn: ['🍂', '秋'], winter: ['❄️', '冬']};
const seasonOfM = m => m >= 9 && m <= 11 ? 'spring' : (m === 12 || m <= 2) ? 'summer' : m <= 5 ? 'autumn' : 'winter';
let calSel = null;
function calendarV(arg) {
  const td = today(), [ty, tm] = td.split('-').map(Number); let [y, m] = /^\d{4}-\d{2}$/.test(arg || '') ? arg.split('-').map(Number) : [ty, tm];
  setTop(isR() ? '牧场日历' : isF() ? '城镇年历' : '小镇日历');
  const key = `${y}-${String(m).padStart(2, '0')}`, first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), days = new Date(Date.UTC(y, m, 0)).getUTCDate(), lead = (first + 6) % 7; // Monday first
  const fests = window.Fests ? Fests.list(y).filter(f => f.date.startsWith(key)) : [], byDay = {}; fests.forEach(f => { (byDay[f.date] = byDay[f.date] || []).push(f); });
  const ciBy = {}; checkins.forEach(c => { const d = ciDay(c); if (d && d.startsWith(key)) ciBy[d] = (ciBy[d] || 0) + 1; });
  const se = seasonOfM(m), [sic, szh] = SEASON_ZH[se], sel = calSel && calSel.startsWith(key) ? calSel : (td.startsWith(key) ? td : (fests[0] || {}).date || `${key}-01`);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`, next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  let cells = ''; for (let i = 0; i < lead; i++) cells += '<span class="cal-c pad"></span>';
  for (let d = 1; d <= days; d++) { const ds = `${key}-${String(d).padStart(2, '0')}`, F = byDay[ds] || [], wd = (lead + d - 1) % 7;
    cells += `<button class="cal-c${ds === td ? ' today' : ''}${ds === sel ? ' sel' : ''}${F.length ? ' fest' : ''}${F.some(f => f.kind === 'ph') ? ' ph' : ''}${wd >= 5 ? ' wkend' : ''}" data-day="${ds}"><b>${d}</b>${F.length ? `<i class="cal-f">${F[0].icon}</i>` : ''}${ciBy[ds] ? `<i class="cal-ci" title="打卡 ${ciBy[ds]} 次">${ciBy[ds]}</i>` : ''}</button>`; }
  const SF = byDay[sel] || [], sci = checkins.filter(c => ciDay(c) === sel);
  const detail = `<div class="cal-day vwin jwin"><div class="cal-day-h">${sel}${sel === td ? ' · 今天' : ''}</div>${SF.length ? SF.map(f => `<div class="cal-fe"><div class="cal-fe-t">${f.icon} <b>${esc(f.zh)}</b> <small>${esc(f.en)}</small>${f.approx ? ' <span class="cal-approx" title="日期为估算">约</span>' : ''}${f.sub ? ' <span class="cal-sub">补假</span>' : ''}<span class="cal-kind">${f.kind === 'ph' ? '公众假期' : '活动'}</span></div><div class="cal-fe-n">${esc(f.note)}</div>${sel === td ? `<div class="cal-fe-q">🎁 今日节日委托：打卡一次 +${FEST_BONUS} 金币 · +${FEST_BONUS / 2} XP</div>` : ''}</div>`).join('') : '<div class="hint">这天没有节日。</div>'}
    ${sci.length ? `<div class="cal-cis">☕ 这天打卡 ${sci.length} 次：${sci.map(c => esc((cafeById(c.cafeId) || {}).short || (cafeById(c.cafeId) || {}).name || '未选择')).join('、')}</div>` : ''}</div>`;
  const up = window.Fests ? Fests.upcoming(td, 6) : [];
  app.innerHTML = `${festBanner()}<div class="cal vwin jwin" id="cal" data-month="${key}"><div class="cal-head"><button class="cal-nav" data-go="${prev}" aria-label="上个月">‹</button><div class="cal-title"><b>${sic} ${szh}季</b><span>${y} 年 ${m} 月</span></div><button class="cal-nav" data-go="${next}" aria-label="下个月">›</button></div>
    <div class="cal-wk">${['一', '二', '三', '四', '五', '六', '日'].map(w => `<span>${w}</span>`).join('')}</div><div class="cal-grid">${cells}</div>
    <div class="cal-legend"><span><i class="lg-ph"></i>公众假期</span><span><i class="lg-ev"></i>活动</span><span><i class="lg-ci">1</i>打卡</span>${td.startsWith(key) ? '' : `<button class="cal-nav sm" data-go="${td.slice(0, 7)}">回到今天</button>`}</div></div>
    ${detail}
    <div class="section-title">${ic('flag', '🎌')} 接下来的节日</div><div class="cal-up">${up.map(f => `<button class="cal-up-r" data-go="${f.date.slice(0, 7)}" data-pick="${f.date}"><span class="cal-up-d">${f.date.slice(5).replace('-', '/')}</span><span>${f.icon} ${esc(f.zh)}${f.approx ? ' <span class="cal-approx">约</span>' : ''}${f.sub ? ' <span class="cal-sub">补假</span>' : ''}</span><small>${f.kind === 'ph' ? '公众假期' : '活动'}</small></button>`).join('')}</div>
    <div class="hint cal-src">维州公众假期按 Business Victoria 公布的规则计算（复活节用公历复活节算法；周末补假按维州规则）。AFL 总决赛前的周五以州政府公布为准，未公布的年份标「约」。Moomba、咖啡博览会只列出官方已公布的日期。季节按南半球：春 9–11 月、夏 12–2 月、秋 3–5 月、冬 6–8 月。天气是小镇游戏天气，不是真实预报。</div>`;
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { SFXplay('blip'); calSel = b.dataset.pick || null; location.hash = '#/calendar/' + b.dataset.go; });
  app.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { SFXplay('blip'); calSel = b.dataset.day; calendarV(key); });
}
// ---------- 📖 咖啡教育主线 (edu.js): journal, chapters, mentor lessons, quizzes, rank-ups ----------
const eduCtx = () => ({checkins, beans, cafe: cafeById, sig: sigOf, sigMatch, region: id => regionOf(id).r.id});
const eduRankTitle = () => window.Edu ? Edu.RANKS[Edu.rank()] : '';
const eduItemName = id => { const it = window.PixShop && PixShop.byId(id); return it ? it.name : ({grinder: '手摇磨豆机', cupcoat: '杯测白袍', mortar: '咖啡学士帽'})[id] || id; };
function eduEntry() { if (!window.Edu) return ''; const r = Edu.rank(), N = Edu.CH.length, x = eduCtx();
  if (r >= N) return `<a class="edu-entry vwin jwin done" href="#/edu" id="eduEntry"><span class="ee-ic">🎓</span><span class="ee-t"><b>主线 · 咖啡课 全部完成</b><small>称号：${esc(Edu.RANKS[r])} · 随时回来复习</small></span><span class="ee-go">›</span></a>`;
  const ch = Edu.CH[r], st = Edu.chapterState(ch, x), req = st.tasks.filter(t => !t.opt), dn = req.filter(t => t.done).length;
  const nxt = !st.read ? '听老焙讲课' : !st.tasksDone ? `任务 ${dn}/${req.length}` : '可以参加小测验了！';
  return `<a class="edu-entry vwin jwin${st.ready ? ' ready' : ''}" href="#/edu/${ch.n}" id="eduEntry" data-ch="${ch.n}"><span class="ee-ic">${ch.icon}</span><span class="ee-t"><b>主线 · 第 ${ch.n} 章 ${esc(ch.title)}</b><small>${esc(Edu.RANKS[r])} · ${esc(ch.topic)} · ${nxt}</small></span><span class="ee-bar"><i style="width:${Math.round(r / N * 100)}%"></i></span><span class="ee-go">›</span></a>`; }
function eduAva(cls = 'edu-ava') { return `<span class="${cls}" data-mentor>焙</span>`; }
function paintMentor(root) { if (!isV() || !window.Valley) return; root.querySelectorAll('[data-mentor]').forEach(el => { try { el.textContent = ''; el.classList.add('px'); el.appendChild(Valley.portraitEl(Valley.villager(Edu.MENTOR.id, 7), 2)); } catch (e) { el.textContent = '焙'; } }); }
function eduTargets(kind) { const v = visitedIds(), L = allCafes().filter(c => !isClosed(c) && (kind === 'roaster' ? Edu.isRoaster(c) : Edu.hasFilter(c, sigOf(c.id))));
  L.sort((a, b) => v.has(a.id) - v.has(b.id) || (b.id === 'homebody') - (a.id === 'homebody')); const show = L.slice(0, 6);
  return `<div class="edu-tg"><small>${kind === 'roaster' ? '标着「烘焙商」的店' : '招牌或标签里有手冲 / filter / batch brew 的店'}（共 ${L.length} 家）：</small>${show.map(c => `<a class="chip${v.has(c.id) ? ' on' : ''}" href="#/cafe/${c.id}">${v.has(c.id) ? '✔ ' : ''}${esc(c.short || c.name)}</a>`).join('')}</div>`; }
function eduTaskRow(t) { const tg = t.go === 'roaster' || t.go === 'filter';
  return `<div class="edu-task${t.done ? ' done' : ''}${t.opt ? ' opt' : ''}" data-task="${t.id}"><span class="et-ck">${t.done ? '✔' : '○'}</span><span class="et-t">${esc(t.t)}${t.need > 1 ? ` <b>${t.have}/${t.need}</b>` : ''}</span>${!t.done && !tg && t.go ? `<a class="et-go" href="${t.go}">去做 ›</a>` : ''}${!t.done && tg ? eduTargets(t.go) : ''}</div>`; }
function eduJournal() { const x = eduCtx(), r = Edu.rank(), N = Edu.CH.length;
  setTop(isR() ? '咖啡课 · 学习日记' : isF() ? '咖啡课 · 编年史' : '咖啡课 · 主线');
  const owned = Object.entries(Edu.ITEM_AT).filter(([n]) => r >= +n).map(([, id]) => eduItemName(id));
  app.innerHTML = `<div class="edu-head vwin jwin">${eduAva('edu-ava big')}<div><small>${esc(Edu.MENTOR.name)} · ${esc(Edu.MENTOR.role)}</small><b class="edu-rank" id="eduRank">${esc(Edu.RANKS[r])}</b>
      <div class="edu-ladder">${Edu.RANKS.map((t, i) => `<i class="${i <= r ? 'on' : ''}${i === r ? ' cur' : ''}" title="${esc(t)}"></i>`).join('')}</div><small>主线进度 ${r}/${N} 章${r < N ? ` · 下一个称号：${esc(Edu.RANKS[r + 1])}` : ' · 已经是咖啡大师！'}</small></div></div>
    <div class="section-title">📖 章节</div><div class="edu-list" id="eduList">${Edu.CH.map(ch => { const st = Edu.chapterState(ch, x), req = st.tasks.filter(t => !t.opt);
      const state = st.passed ? 'passed' : st.unlocked ? 'open' : 'locked';
      return `<${state === 'locked' ? 'div' : 'a'} class="edu-ch vwin jwin ${state}" data-ch="${ch.n}"${state === 'locked' ? '' : ` href="#/edu/${ch.n}"`}><span class="ec-n">${state === 'locked' ? '🔒' : ch.icon}</span><span class="ec-t"><b>第 ${ch.n} 章 · ${esc(ch.title)}</b><small>${esc(ch.topic)} · ${state === 'passed' ? `✔ 已通过 → ${esc(Edu.RANKS[ch.n])}` : state === 'locked' ? '完成上一章后解锁' : `${st.read ? '已听课' : '未听课'} · 任务 ${req.filter(t => t.done).length}/${req.length}`}</small></span><span class="ec-r">${Edu.ITEM_AT[ch.n] ? '🎁' : ''}🪙${Edu.REWARD(ch.n)}</span></${state === 'locked' ? 'div' : 'a'}>`; }).join('')}</div>
    <a class="sca-link vwin jwin" id="eduScaLink" href="#/sca"><span>🎓</span><span><b>SCA 问答 · 初级 / 中级练习题</b><small>按模块练习、模考、错题本 · 非 SCA 官方题库，仅供练习</small></span><span class="ee-go">›</span></a>
    <div class="hint edu-foot">每章：听老焙讲课 → 完成任务（用平常的打卡、拍豆子、评分、心得就能完成，以前的记录也算）→ 小测验答对 ${Edu.PASS}/4 题升级，可以无限次重考。奖励金币和 XP${owned.length ? `；已获得：${owned.map(esc).join('、')}` : '；第 3、7、8 章还送装扮（在像素主题的商店里装备）'}。课程内容参考 SCA、World Coffee Research 等公开资料。</div>`;
  paintMentor(app); }
function eduChapter(n) { const ch = Edu.CH[n - 1]; if (!ch) return eduJournal(); const st = Edu.chapterState(ch, eduCtx());
  setTop(`第 ${n} 章 · ${ch.title}`, '', true);
  if (!st.unlocked) { app.innerHTML = `<div class="card vwin jwin edu-locked"><b>🔒 第 ${n} 章还没解锁</b><div class="hint">先通过第 ${n - 1} 章的小测验吧。</div><a class="btn" href="#/edu/${n - 1}">去第 ${n - 1} 章</a></div>`; return; }
  const req = st.tasks.filter(t => !t.opt);
  app.innerHTML = `<div class="edu-chhead vwin jwin" data-ch="${n}">${eduAva()}<div><small>${esc(ch.topic)}${st.passed ? ' · ✔ 已通过' : ''}</small><b>${ch.icon} ${esc(ch.title)}</b><button class="btn edu-listen" id="eduListen">${st.read ? '🔁 再听一遍' : '🗣️ 听老焙讲课'}</button></div></div>
    ${st.read ? `<div class="edu-notes vwin jwin" id="eduNotes"><div class="en-h">📝 课堂笔记</div>${ch.notes.map(t => `<div class="en-l">· ${esc(t)}</div>`).join('')}</div>` : ''}
    <div class="section-title">🎯 本章任务 <small>${req.filter(t => t.done).length}/${req.length}</small></div><div class="edu-tasks" id="eduTasks">${st.tasks.map(eduTaskRow).join('')}</div>
    <div class="edu-quizbox vwin jwin">${st.passed ? `<b>✔ 小测验已通过</b><small>最高 ${st.best}/4 · 共考 ${st.tries} 次</small><a class="btn ghost" href="#/edu/q${n}">再考一次（复习）</a>${n < Edu.CH.length ? `<a class="btn" href="#/edu/${n + 1}">下一章 ›</a>` : ''}`
      : st.ready ? `<b>📝 小测验 · 4 题答对 ${Edu.PASS} 题就能升级</b><small>升级后：${esc(Edu.RANKS[n])} · 🪙${Edu.REWARD(n)} · +${Math.round(Edu.REWARD(n) / 2)} XP${Edu.ITEM_AT[n] ? ` · 🎁 ${esc(eduItemName(Edu.ITEM_AT[n]))}` : ''}</small><a class="btn" id="eduQuizGo" href="#/edu/q${n}">开始小测验</a>`
      : `<b>📝 小测验</b><small>${!st.read ? '先听老焙讲完这一课' : '先完成上面的必做任务'}，就可以参加。</small><button class="btn" disabled id="eduQuizGo">还不能考</button>`}</div>`;
  paintMentor(app);
  $('#eduListen').onclick = () => eduTalk(n, () => eduChapter(n)); }
let eduDlgT = null;
function eduTalk(n, done) { const ch = Edu.CH[n - 1]; let i = 0, d = $('#eduDlg'); if (d) d.remove();
  d = document.createElement('div'); d.id = 'eduDlg'; d.className = 'edu-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '老焙讲课');
  d.innerHTML = `<div class="ed-box">${eduAva()}<div class="ed-body"><div class="ed-name">${esc(Edu.MENTOR.name)} <small>第 ${n} 章 · ${esc(ch.topic)}</small></div><div class="ed-text" id="edText"></div><div class="ed-foot"><span id="edPage"></span><button class="ed-skip" id="edSkip">跳过</button><button class="ed-next" id="edNext">▼ 继续</button></div></div></div>`;
  document.body.appendChild(d); paintMentor(d);
  const show = () => { $('#edText').textContent = ch.lesson[i]; $('#edPage').textContent = `${i + 1}/${ch.lesson.length}`; $('#edNext').textContent = i === ch.lesson.length - 1 ? '✔ 听完了' : '▼ 继续'; };
  const end = () => { d.remove(); Edu.markRead(n); SFXplay('harvest'); done && done(); };
  $('#edNext').onclick = e => { e.stopPropagation(); SFXplay('blip'); if (++i >= ch.lesson.length) return end(); show(); };
  $('#edSkip').onclick = e => { e.stopPropagation(); end(); };
  requestAnimationFrame(() => d.classList.add('show')); show(); }
function eduQuiz(n) { const ch = Edu.CH[n - 1]; if (!ch) return eduJournal(); const st = Edu.chapterState(ch, eduCtx());
  setTop(`第 ${n} 章 · 小测验`, '', true);
  if (!st.ready && !st.passed) { app.innerHTML = `<div class="card vwin jwin"><b>还不能考哦</b><div class="hint">${!st.read ? '先听老焙讲课' : '先完成本章必做任务'}。</div><a class="btn" href="#/edu/${n}">回到第 ${n} 章</a></div>`; return; }
  const qs = Edu.shuffled(n, Edu.attempt(n)), picks = qs.map(() => -1);
  app.innerHTML = `<div class="edu-qhead vwin jwin">${eduAva()}<div><b>${ch.icon} ${esc(ch.topic)} 小测验</b><small>第 ${Edu.attempt(n) + 1} 次 · 答对 ${Edu.PASS}/${qs.length} 题通过 · 可以随时重考</small></div></div>
    <div id="eduQuiz">${qs.map((q, i) => `<div class="eq vwin jwin" data-q="${i}"><div class="eq-q"><b>Q${i + 1}</b> ${esc(q.q)}</div>${q.opts.map((o, j) => `<button class="eq-o" data-o="${j}">${'ABC'[j]}. ${esc(o.t)}</button>`).join('')}<div class="eq-why"></div></div>`).join('')}</div>
    <button class="btn" id="eqSubmit" disabled>交卷</button><div id="eqRes"></div>`;
  paintMentor(app);
  $('#eduQuiz').onclick = e => { const b = e.target.closest('.eq-o'); if (!b || $('#eduQuiz').classList.contains('graded')) return; const qi = +b.closest('.eq').dataset.q; picks[qi] = +b.dataset.o; SFXplay('blip');
    b.parentElement.querySelectorAll('.eq-o').forEach(x => x.classList.toggle('pick', x === b)); $('#eqSubmit').disabled = picks.some(p => p < 0); };
  $('#eqSubmit').onclick = () => { const L0 = levelInfo(), before = totalCoins(), R = Edu.grade(n, picks, today()); $('#eduQuiz').classList.add('graded'); $('#eqSubmit').remove();
    app.querySelectorAll('.eq').forEach((el, i) => { el.classList.add(R.right[i] ? 'right' : 'wrong'); el.querySelectorAll('.eq-o').forEach((o, j) => { o.disabled = true; if (R.qs[i].opts[j].ok) o.classList.add('ans'); }); el.querySelector('.eq-why').textContent = (R.right[i] ? '✔ ' : '✘ ') + R.qs[i].why; });
    let reward = ''; if (R.newRank) { const id = 'edu' + n; if (!questLog.claims.some(x => x.id === id)) { questLog.claims.push({d: today(), id, c: Edu.REWARD(n)}); save(QK, questLog); } reward = 'ok'; }
    $('#eqRes').innerHTML = `<div class="eq-res vwin jwin ${R.pass ? 'pass' : 'fail'}" id="eqResult" data-score="${R.score}"><b>${R.pass ? '🎉 通过！' : '再试一次吧'}　${R.score}/${R.total}</b><small>${R.pass ? (R.newRank ? '老焙点点头：「不错，你出师了这一课。」' : '复习得很好！') : `答对 ${Edu.PASS} 题才能通过。看看上面的解释，再考一次（选项顺序会变）。`}</small>
      ${R.pass ? `<a class="btn" href="#/edu/${n}">回到本章</a>` : `<button class="btn" id="eqRetry">🔁 重考</button>`}</div>`;
    const rt = $('#eqRetry'); if (rt) rt.onclick = () => { SFXplay('blip'); eduQuiz(n); window.scrollTo(0, 0); };
    SFXplay(R.pass ? 'harvest' : 'hit'); drawHud();
    if (reward) setTimeout(() => eduRankUp(n, before, L0), 500); };
}
function eduRankUp(n, before, L0) { let m = $('#eduRankUp'); if (m) m.remove(); const item = Edu.ITEM_AT[n], c = Edu.REWARD(n);
  m = document.createElement('div'); m.id = 'eduRankUp'; m.className = 'edu-rankup'; m.setAttribute('role', 'dialog');
  m.innerHTML = `<div class="er-card vwin jwin"><div class="er-burst">✨</div><small>第 ${n} 章 · ${esc(Edu.CH[n - 1].topic)} 通过</small><div class="er-from">${esc(Edu.RANKS[n - 1])}</div><div class="er-arrow">⬇</div><b class="er-title" id="erTitle">${esc(Edu.RANKS[n])}</b>
    <div class="er-rw"><span>🪙 +${c}</span><span>⭐ +${Math.round(c / 2)} XP</span>${item ? `<span>🎁 ${esc(eduItemName(item))}</span>` : ''}</div>
    ${item ? `<small class="er-note">${isV() ? '装扮已放进杂货店，可以免费装备。' : '装扮会出现在像素主题（田园 / 牧场）的杂货店里。'}</small>` : ''}${n === Edu.CH.length ? '<small class="er-note">🎓 主线完成！你已经是小镇的咖啡大师。</small>' : ''}
    <button class="btn" id="erOk">${n < Edu.CH.length ? `继续第 ${n + 1} 章` : '太好了'}</button></div>`;
  document.body.appendChild(m); requestAnimationFrame(() => m.classList.add('show'));
  const L1 = levelInfo(); if (L1.lv > L0.lv) setTimeout(() => toast(`⬆️ 升级！Lv.${L1.lv} ${L1.title}`, 2600), 900);
  $('#erOk').onclick = () => { m.remove(); location.hash = n < Edu.CH.length ? '#/edu/' + (n + 1) : '#/edu'; }; }
// ---------- 🎭 hidden NPCs (隐藏角色): encounters, codex, map visitor. Logic in npc.js; state in localStorage 'mcc.npc' ----------
// Under automation (navigator.webdriver) encounters stay off unless ?npc or localStorage mcc.npcTest — keeps older test suites undisturbed.
const NPC_ON = () => !!window.Npc && (!navigator.webdriver || /[?&]npc\b/.test(location.search) || !!load('mcc.npcTest', false));
const npcWx = d => { try { return window.Fests && window.Valley && d ? Fests.weather(d, Valley.seasonOf(+d.slice(5, 7))).id : ''; } catch (e) { return ''; } };
const npcFest = d => { try { return window.Fests && d ? Fests.on(d) : []; } catch (e) { return []; } };
const npcCtx = () => ({checkins, beans, today: today(), stamina: stamina(), eduRank: window.Edu ? Edu.rank() : 0, eduMax: window.Edu ? Edu.CH.length : 0, fest: npcFest, wx: npcWx});
const NPC_ITEM = {bunting: '节日彩旗串', oldapron: '旧帆布围裙'};
const npcItemName = id => { const it = window.PixShop && PixShop.byId(id); return it ? it.name : NPC_ITEM[id] || id; };
const NPC_EASE = {easy: '容易遇到', mid: '要看时机', long: '长期目标'};
function npcAva(id, sil, cls = '') { return `<span class="edu-ava px npc-ava ${cls}${sil ? ' sil' : ''}" data-npc-ava="${id}"${sil ? ' data-sil="1"' : ''}>${sil ? '?' : ''}</span>`; }
function paintNpc(root) { root.querySelectorAll('[data-npc-ava]').forEach(el => { const id = el.dataset.npcAva, sil = !!el.dataset.sil; try { const c = sil ? Npc.silhouette(id) : Npc.portrait(id); if (!c) return;
  el.textContent = ''; el.appendChild(Npc.scaled(c, 2)); if (sil) { const q = document.createElement('b'); q.className = 'npc-q'; q.textContent = '?'; el.appendChild(q); } else el.style.background = Npc.BG[id] || ''; } catch (e) {} }); }
function npcFestName() { const t = npcFest(today())[0]; if (t) return t.zh; const c = byTime().reverse().find(x => npcFest(ciDay(x)).length); return c ? npcFest(ciDay(c))[0].zh : '节日'; }
const npcLine = (n, t) => t.replace('{fest}', (Npc.state.met[n.id] && Npc.state.met[n.id].fest) || npcFestName());
let npcTimer = null, npcHold = false; // npcHold: after an encounter closes, wait for the next navigation before another one
function npcSchedule(ms = 700) { if (!NPC_ON()) return; clearTimeout(npcTimer); npcTimer = setTimeout(npcTick, ms); }
const npcBlocked = () => !!document.querySelector('#celebrate:not(.hidden), #eduDlg, #eduRankUp, #npcDlg, #fdSplash, #vlSplash, #shModal') || !($('#sheetWrap') || {classList: {contains: () => true}}).classList.contains('hidden') || /^#\/(edu\/q|add)/.test(location.hash);
function npcTick() { if (!NPC_ON() || npcHold) return; const p = Npc.pending(npcCtx()); if (!p.length) return; if (npcBlocked()) return npcSchedule(1500); npcEncounter(p[0]); }
// one encounter per page view: met + reward are recorded when the dialogue opens, so closing early never loses them
function npcEncounter(id, replay) { const n = Npc.byId(id); if (!n) return; let d = $('#npcDlg'); if (d) d.remove(); { const g = $('#dlg'); if (g) g.classList.remove('show'); } // the encounter takes over the barista's speech bubble
  const L0 = levelInfo(), before = totalCoins(), isNew = !replay && Npc.meet(id, today(), id === 'fest' ? {fest: npcFestName()} : null);
  if (isNew && !questLog.claims.some(x => x.id === 'npc-' + id)) { questLog.claims.push({d: today(), id: 'npc-' + id, c: n.c}); save(QK, questLog); }
  const lines = n.lines.map(t => npcLine(n, t)), pages = replay ? lines : [...lines, ''];
  d = document.createElement('div'); d.id = 'npcDlg'; d.className = 'edu-dlg npc-dlg' + (replay ? ' replay' : ''); d.dataset.npc = id; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '隐藏角色 · ' + n.name);
  d.innerHTML = `${replay ? '' : '<div class="np-tag">✨ 隐藏角色出现了！</div>'}<div class="ed-box">${npcAva(id, false)}<div class="ed-body"><div class="ed-name">${esc(n.name)} <small>${esc(n.role)}</small></div><div class="ed-text" id="npText"></div>
    <div class="ed-foot"><span id="npPage"></span><button class="ed-skip" id="npSkip">${replay ? '关闭' : '跳过'}</button><button class="ed-next" id="npNext">▼ 继续</button></div></div></div>`;
  document.body.appendChild(d); paintNpc(d); let i = 0;
  const rw = () => `<div class="np-rw" id="npReward"><b>🎭 已记入隐藏角色图鉴 ${Npc.count()}/${Npc.NPCS.length}</b><span>🪙 +${n.c}</span><span>⭐ +${Math.round(n.c / 2)} XP</span>${n.item ? `<span>🎁 ${esc(npcItemName(n.item))}</span>` : ''}${n.item ? `<small>${isV() ? '礼物已经放进杂货店，可以免费装备。' : '礼物会出现在像素主题（田园 / 牧场）的杂货店里。'}</small>` : ''}</div>`;
  const show = () => { const last = i === pages.length - 1, t = $('#npText');
    if (!replay && last) t.innerHTML = rw(); else t.textContent = pages[i];
    $('#npPage').textContent = replay || !last ? `${i + 1}/${lines.length}` : '';
    $('#npNext').textContent = last ? (replay ? '✔ 好的' : '✔ 收下') : '▼ 继续'; $('#npSkip').classList.toggle('hidden', !replay && last); };
  const end = () => { d.remove(); if (!replay) { npcHold = true; SFXplay('harvest'); drawHud(); if (isNew) { coinBurst(null, n.c, before); xpPop(null, Math.round(n.c / 2), L0); const L1 = levelInfo(); if (L1.lv > L0.lv) setTimeout(() => toast(`⬆️ 升级！Lv.${L1.lv} ${L1.title}`, 2600), 1300); }
    if (app.dataset.view === 'npc' || app.dataset.view === 'list') render(); } };
  $('#npNext').onclick = e => { e.stopPropagation(); SFXplay('blip'); if (++i >= pages.length) return end(); show(); };
  $('#npSkip').onclick = e => { e.stopPropagation(); if (replay) return end(); i = pages.length - 1; show(); };
  SFXplay(replay ? 'blip' : 'harvest'); requestAnimationFrame(() => d.classList.add('show')); show(); }
function npcEntry() { if (!window.Npc) return ''; const k = Npc.count(), N = Npc.NPCS.length;
  return `<a class="npc-entry vwin jwin" href="#/npc" id="npcEntry"><span class="ne-ic">🎭</span><span class="ne-t"><b>隐藏角色图鉴 ${k}/${N}</b><small>${k ? '有些人只在特定的时候出现……' : '小镇里藏着一些不常露面的人'}</small></span><span class="ne-sil">${Npc.NPCS.slice(0, 5).map(n => npcAva(n.id, !Npc.met(n.id), 'mini')).join('')}</span><span class="ee-go">›</span></a>`; }
function npcCodex() { const k = Npc.count(), N = Npc.NPCS.length, x = npcCtx();
  setTop(isR() ? '隐藏角色 · 访客簿' : isF() ? '隐藏角色 · 城镇名录' : '隐藏角色图鉴', '', true);
  app.innerHTML = `<div class="npc-head vwin jwin"><b>🎭 已遇见 ${k}/${N}</b><small>小镇里有 ${N} 位不常露面的角色，只在满足条件时出现。遇见后会记在这里，并送上金币、XP，有两位还会送礼物。</small></div>
    <div class="npc-codex" id="npcCodex">${Npc.NPCS.map(n => { const m = Npc.state.met[n.id];
      return m ? `<div class="npc-card vwin jwin met" data-npc="${n.id}">${npcAva(n.id, false, 'big')}<div class="nc-t"><b>${esc(n.name)}</b><small class="nc-role">${esc(n.role)}</small>
          <div class="nc-how">🔓 ${esc(n.how)}</div><div class="nc-meta">${esc(m.d)} 遇见 · 🪙${n.c} · ⭐${Math.round(n.c / 2)}XP${n.item ? ` · 🎁 ${esc(npcItemName(n.item))}` : ''}</div>${n.note ? `<div class="nc-note">${esc(n.note)}</div>` : ''}<button class="btn ghost nc-replay" data-replay="${n.id}">💬 再聊一次</button></div></div>`
        : `<div class="npc-card vwin jwin unknown" data-npc="${n.id}">${npcAva(n.id, true, 'big')}<div class="nc-t"><b>？？？</b><small class="nc-role">${NPC_EASE[n.ease] || ''}</small><div class="nc-hint">${esc(n.hint)}</div></div></div>`; }).join('')}</div>
    <div class="hint npc-foot">提示是故意写得模糊的。大部分条件会把以前的记录也算进去（例如以前在雨天、节日打过卡）；体力耗尽、标题彩蛋和 Hash 的店门口只在当时触发。</div>`;
  paintNpc(app);
  $('#npcCodex').onclick = e => { const b = e.target.closest('[data-replay]'); if (b) npcEncounter(b.dataset.replay, true); };
  npcSchedule(); }
// 🗺️ today's visitor: a met NPC whose moment is now (dawn hours, a festival, a rainy day, stamina 0, or met today) waits on the map
function npcActive() { if (!window.Npc) return null; const t = today(), h = window.Valley && Valley.clock ? Valley.clock().h : 12;
  const now = {dawn: h >= 4 && h < 7, fest: npcFest(t).length > 0, rain: npcWx(t) === 'rain', sleepy: stamina() <= 0};
  return Npc.NPCS.find(n => Npc.met(n.id) && (now[n.id] || Npc.state.met[n.id].d === t)) || null; }
function npcVisitor() { const o = $('#npcVisitor'); if (o) o.remove(); const n = npcActive(); if (!n) return;
  const b = document.createElement('button'); b.id = 'npcVisitor'; b.className = 'npc-visitor'; b.dataset.npc = n.id; b.setAttribute('aria-label', `${n.name} 在小镇里`);
  b.innerHTML = `${npcAva(n.id, false, 'mini')}<span><b>${esc(n.name)}</b><small>今天在小镇里</small></span>`; document.body.appendChild(b); paintNpc(b); b.onclick = () => npcEncounter(n.id, true); }
// 🔔 title easter egg: 5 quick taps on the title (title screen or top bar)
let npcTaps = [];
document.addEventListener('click', e => { if (!window.Npc || Npc.met('tap') || !e.target.closest('#title, .fs-title, .fs-card, .sp-logo')) return; const t = Date.now(); npcTaps = [...npcTaps.filter(x => t - x < 4000), t];
  if (npcTaps.length >= 5) { npcTaps = []; Npc.flag('tap', today()); SFXplay('coin'); npcSchedule(200); } }, true);
// ---------- 🎓 SCA 问答 (sca.js): level → module picker, practice (instant feedback), mock test (random N, optional timer), wrong-answer notebook ----------
// 非 SCA 官方题库，仅供练习 — original questions from SCA's public curricula/standards + reputable sources; each has an explanation and a source.
let scaLv = 'f', scaP = null, scaTimer = null;
const scaM = m => (window.SCAQ && SCAQ.MODULES.find(x => x.id === m)) || {id: 'all', zh: '综合', en: 'All modules', icon: '🧩'};
const scaL = l => SCAQ.LEVELS.find(x => x.id === l) || SCAQ.LEVELS[0];
const scaAllMods = () => SCAQ.LEVELS.flatMap(L => SCAQ.mods(L.id).map(m => [L.id, m.id]));
const scaSrcHtml = q => q.s.map(k => SCAQ.SRC[k]).filter(Boolean).map(s => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a>`).join('<br>');
const scaLetter = (q, ord, orig) => q.tf ? q.o[orig] : 'ABCD'[ord.indexOf(orig)] + '. ' + q.o[orig];
function scaEntry() { if (!window.SCAQ) return ''; const all = scaAllMods(), k = all.filter(([l, m]) => SCAQ.progress(l, m).mastered).length, w = SCAQ.state.wrong.length;
  return `<a class="edu-entry sca-entry vwin jwin" href="#/sca" id="scaEntry"><span class="ee-ic">🎓</span><span class="ee-t"><b>SCA 问答 · 初级 / 中级</b><small>${SCAQ.Q.length} 道练习题 · 已掌握 ${k}/${all.length} 个模块${w ? ` · 错题 ${w}` : ''} · 非官方</small></span><span class="ee-bar"><i style="width:${Math.round(k / all.length * 100)}%"></i></span><span class="ee-go">›</span></a>`; }
const SCA_INTRO = ['我是老焙。除了主线咖啡课，这里还有一套练习题，按 SCA 咖啡技能课程（Coffee Skills Program）的初级（Foundation）和中级（Intermediate）来分。',
  '先说清楚：这不是 SCA 官方题库，也不是考试真题。题目是我根据 SCA 公开的课纲、咖啡标准和可靠资料自己出的，每题都附解析和出处，可以点开核对。',
  'Introduction to Coffee 只有初级；咖啡师技能、冲煮、生豆、烘焙和感官技能都分初级和中级。练习模式答完马上看解析；模考随机抽题，可以计时。',
  '答错的题会自动进错题本。每个模块第一次模考拿到 80% 以上，我送你一点金币和 XP，每个模块只送一次。慢慢来，喝杯咖啡再做题。'];
function scaTalk(done) { let i = 0, d = $('#eduDlg'); if (d) d.remove();
  d = document.createElement('div'); d.id = 'eduDlg'; d.className = 'edu-dlg sca-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '老焙介绍 SCA 问答');
  d.innerHTML = `<div class="ed-box">${eduAva()}<div class="ed-body"><div class="ed-name">${esc(window.Edu ? Edu.MENTOR.name : '老焙')} <small>SCA 问答</small></div><div class="ed-text" id="edText"></div><div class="ed-foot"><span id="edPage"></span><button class="ed-skip" id="edSkip">跳过</button><button class="ed-next" id="edNext">▼ 继续</button></div></div></div>`;
  document.body.appendChild(d); if (window.Edu) paintMentor(d);
  const show = () => { $('#edText').textContent = SCA_INTRO[i]; $('#edPage').textContent = `${i + 1}/${SCA_INTRO.length}`; $('#edNext').textContent = i === SCA_INTRO.length - 1 ? '✔ 开始练习' : '▼ 继续'; };
  const end = () => { d.remove(); SCAQ.state.seen = 1; SCAQ.save(); SFXplay('harvest'); done && done(); };
  $('#edNext').onclick = e => { e.stopPropagation(); SFXplay('blip'); if (++i >= SCA_INTRO.length) return end(); show(); };
  $('#edSkip').onclick = e => { e.stopPropagation(); end(); };
  requestAnimationFrame(() => d.classList.add('show')); show(); }
function scaHub(l) { scaP = null; if (l) scaLv = l; const L = scaL(scaLv), mods = SCAQ.mods(scaLv), w = SCAQ.state.wrong.length;
  setTop('🎓 SCA 问答', '', true);
  app.innerHTML = `<div class="sca-disc vwin jwin" id="scaDisc"><b>⚠️ ${esc(SCAQ.DISCLAIMER)}</b><small>题目为原创，依据 SCA 公开课纲、咖啡标准和可靠的二手资料编写，每题附解析和出处；不是考试真题，也不代表 SCA 认可。SCA 不同版本的数字可能不同，题目里会注明版本。</small></div>
    <div class="sca-mentor vwin jwin">${window.Edu ? eduAva() : '<span class="edu-ava">焙</span>'}<div><small>老焙 · 练习题</small><b>按级别和模块练习</b><button class="btn ghost" id="scaIntro">🗣️ 听老焙介绍</button></div></div>
    <div class="sca-lv" id="scaLv">${SCAQ.LEVELS.map(x => `<button class="chip${x.id === scaLv ? ' on' : ''}" data-lv="${x.id}">${x.zh} ${x.en}</button>`).join('')}</div>
    <div class="sca-mods" id="scaMods">${mods.map(m => { const p = SCAQ.progress(scaLv, m.id);
      return `<div class="sca-mod vwin jwin${p.mastered ? ' mastered' : ''}" data-m="${m.id}"><div class="sm-h"><span class="sm-ic">${m.icon}</span><span class="sm-t"><b>${esc(m.zh)}</b><small>${esc(m.en)} · ${L.zh}</small></span><span class="sm-badge">${p.mastered ? '✔ 已掌握' : `🪙${SCAQ.REWARD[scaLv]}`}</span></div>
        <div class="sm-bar"><i style="width:${Math.round(p.done / p.n * 100)}%"></i></div><small class="sm-st">练过 ${p.done}/${p.n} 题 · 最近答对 ${p.right} · 模考最佳 ${Math.round(p.best * 100)}%</small>
        <div class="sm-go"><a class="btn ghost" href="#/sca/p-${scaLv}-${m.id}" data-go="p">📖 练习</a><a class="btn" href="#/sca/t-${scaLv}-${m.id}" data-go="t">📝 模考</a></div></div>`; }).join('')}
      ${scaLv === 'i' ? `<div class="sca-mod sca-na vwin jwin" data-m="intro"><div class="sm-h"><span class="sm-ic">🌱</span><span class="sm-t"><b>咖啡入门</b><small>Introduction to Coffee</small></span><span class="sm-badge">只有初级</span></div><small class="sm-st">SCA 的 Introduction to Coffee 只设一个级别，没有中级。请到「初级」里练习。</small></div>` : ''}</div>
    <div class="sca-more"><a class="btn ghost" id="scaMix" href="#/sca/t-${scaLv}-all">🧩 ${L.zh}综合模考（随机 20 题）</a><a class="btn ghost" id="scaWrongGo" href="#/sca/w">📕 错题本 ${w ? `(${w})` : ''}</a></div>
    <div class="hint sca-foot">规则：练习模式每题答完马上看解析；模考随机抽题、可选计时，交卷后看分数和错题。单个模块的模考（至少 10 题）第一次达到 80%，就算「已掌握」，奖励 🪙 初级 ${SCAQ.REWARD.f} / 中级 ${SCAQ.REWARD.i} 和一半的 XP，每个模块只发一次。进度只存在这台设备上。</div>`;
  if (window.Edu) paintMentor(app);
  $('#scaLv').onclick = e => { const b = e.target.closest('[data-lv]'); if (!b) return; SFXplay('blip'); scaHub(b.dataset.lv); };
  $('#scaIntro').onclick = () => scaTalk();
  if (!SCAQ.state.seen && (!navigator.webdriver || /[?&]scaintro\b/.test(location.search))) setTimeout(() => { if (app.dataset.view === 'sca' && !$('#eduDlg')) scaTalk(); }, 300); }
function scaQCard(q, i, ord, cls = '') { return `<div class="eq sca-q vwin jwin ${cls}" data-q="${i}" data-id="${q.id}"><div class="eq-q"><span class="sca-tag">${q.tf ? '判断' : '单选'}</span> ${esc(q.q)}</div>${ord.map((o, j) => `<button class="eq-o" data-o="${o}">${q.tf ? '' : 'ABCD'[j] + '. '}${esc(q.o[o])}</button>`).join('')}<div class="eq-why sca-why"></div></div>`; }
function scaReveal(el, q, ord, pick) { const ok = pick === q.a; el.classList.add(ok ? 'right' : 'wrong'); el.classList.add('done');
  el.querySelectorAll('.eq-o').forEach(o => { const v = +o.dataset.o; o.disabled = true; o.classList.toggle('pick', v === pick); if (v === q.a) o.classList.add('ans'); });
  el.querySelector('.sca-why').innerHTML = `<b class="sw-h">${ok ? '✔ 答对了' : pick < 0 ? `⌛ 没作答 · 正确答案：${esc(scaLetter(q, ord, q.a))}` : `✘ 正确答案：${esc(scaLetter(q, ord, q.a))}`}</b><div class="sw-x">${esc(q.x)}</div><div class="sca-src">📚 出处：<br>${scaSrcHtml(q)}</div>`; }
function scaPractice(l, m) { const wrongMode = l === 'w', M = scaM(m);
  if (!scaP || scaP.key !== (wrongMode ? 'w' : l + '-' + m)) { const ids = wrongMode ? SCAQ.state.wrong.slice() : SCAQ.bank(l, m).map(q => q.id);
    let i = wrongMode ? 0 : ids.findIndex(id => !(SCAQ.state.ans[id] && SCAQ.state.ans[id].last)); if (i < 0) i = 0;
    scaP = {key: wrongMode ? 'w' : l + '-' + m, ids, i, got: {}, seed: Date.now() % 997}; }
  const P = scaP, N = P.ids.length;
  setTop(wrongMode ? '📕 错题练习' : `${M.icon} ${scaL(l).zh} · ${M.zh}`, '', true);
  if (!N) { app.innerHTML = `<div class="card vwin jwin sca-empty"><b>${wrongMode ? '错题本是空的 🎉' : '这个模块没有题目'}</b><a class="btn" href="#/sca">回到 SCA 问答</a></div>`; return; }
  if (P.i >= N) { const got = Object.entries(P.got), r = got.filter(([id, p]) => SCAQ.byId(id).a === p).length;
    app.innerHTML = `<div class="eq-res sca-res vwin jwin pass" id="scaPDone"><b>📖 这一轮练完了</b><small>本轮作答 ${got.length} 题，答对 ${r} 题。${wrongMode ? '答对的题已从错题本移出。' : '想拿奖励的话，去做一次模考吧。'}</small>
      <a class="btn" href="${wrongMode ? '#/sca/w' : `#/sca/t-${l}-${m}`}">${wrongMode ? '📕 回到错题本' : '📝 去模考'}</a><button class="btn ghost" id="scaAgain">🔁 从头再练</button><a class="btn ghost" href="#/sca">返回</a></div>`;
    $('#scaAgain').onclick = () => { P.i = 0; P.got = {}; scaPractice(l, m); }; return; }
  const q = SCAQ.byId(P.ids[P.i]), ord = SCAQ.order(q, P.seed), M2 = scaM(q.m);
  app.innerHTML = `<div class="sca-qh vwin jwin"><span>${wrongMode ? `${M2.icon} ${scaL(q.l).zh} · ${esc(M2.zh)}` : `${M.icon} ${esc(M.en)}`}</span><b id="scaPos">${P.i + 1} / ${N}</b><div class="sm-bar"><i style="width:${Math.round(P.i / N * 100)}%"></i></div></div>
    ${scaQCard(q, P.i, ord)}<div class="sca-nav"><button class="btn ghost" id="scaPrev"${P.i ? '' : ' disabled'}>‹ 上一题</button><button class="btn" id="scaNext">${P.i === N - 1 ? '完成 ✔' : '下一题 ›'}</button></div>
    <div class="hint sca-foot">${esc(SCAQ.DISCLAIMER)} · 题目原创，出处见解析</div>`;
  const el = app.querySelector('.sca-q'); if (q.id in P.got) scaReveal(el, q, ord, P.got[q.id]);
  el.onclick = e => { const b = e.target.closest('.eq-o'); if (!b || el.classList.contains('done')) return; const pick = +b.dataset.o; P.got[q.id] = pick; const ok = SCAQ.record(q.id, pick);
    SFXplay(ok ? 'coin' : 'hit'); scaReveal(el, q, ord, pick); };
  $('#scaPrev').onclick = () => { SFXplay('blip'); P.i--; scaPractice(l, m); window.scrollTo(0, 0); };
  $('#scaNext').onclick = () => { SFXplay('blip'); P.i++; scaPractice(l, m); window.scrollTo(0, 0); }; }
function scaMockSetup(l, m) { const M = scaM(m), n = SCAQ.bank(l, m).length, mix = m === 'all', p = mix ? null : SCAQ.progress(l, m);
  const sizes = mix ? [20, 30] : [Math.min(SCAQ.MOCK_N, n), n].filter((x, i, a) => a.indexOf(x) === i);
  setTop(`📝 模考 · ${scaL(l).zh} · ${M.zh}`, '', true);
  app.innerHTML = `<div class="sca-setup vwin jwin" id="scaSetup"><b>${M.icon} ${scaL(l).zh}${esc(M.zh)} 模拟测试</b><small>${mix ? `从${scaL(l).zh}所有模块的 ${n} 题里随机抽题。综合模考不计入单个模块的「已掌握」。` : `从本模块 ${n} 题里随机抽题。至少 10 题、第一次达到 80% 即「已掌握」${p.mastered ? '（已获得）' : `，奖励 🪙${SCAQ.REWARD[l]} + ${Math.round(SCAQ.REWARD[l] / 2)} XP`}。`}</small>
    <div class="ss-row"><span>题数</span>${sizes.map((s, i) => `<button class="chip${i ? '' : ' on'}" data-n="${s}">${s === n ? `全部 ${s}` : s} 题</button>`).join('')}</div>
    <label class="ss-row ss-timer"><input type="checkbox" id="scaTimed"> ⏱️ 计时（每题 60 秒，时间到自动交卷）</label>
    <button class="btn" id="scaStart">开始模考</button></div><div class="hint sca-foot">${esc(SCAQ.DISCLAIMER)}</div>`;
  let N = sizes[0]; $('#scaSetup').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; N = +b.dataset.n; app.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', x === b)); };
  $('#scaStart').onclick = () => { SFXplay('blip'); scaMock(l, m, N, $('#scaTimed').checked); window.scrollTo(0, 0); }; }
function scaMock(l, m, N, timed, seed) { const M = scaM(m), qs = SCAQ.pick(l, m, N, seed), picks = qs.map(() => -1), sd = (seed || Date.now()) % 997, ords = qs.map(q => SCAQ.order(q, sd));
  setTop(`📝 模考 · ${scaL(l).zh} · ${M.zh}`, '', true);
  app.innerHTML = `<div class="sca-mockhead vwin jwin" id="scaMockHead"><b>${M.icon} ${qs.length} 题 · 答完再交卷</b><span id="scaClock">${timed ? '' : '不计时'}</span><span id="scaCnt">0/${qs.length}</span></div>
    <div id="scaQuiz">${qs.map((q, i) => scaQCard(q, i, ords[i])).join('')}</div><button class="btn" id="scaSubmit" disabled>交卷</button><div id="scaResAt"></div>`;
  let left = qs.length * 60; const tick = () => { const c = $('#scaClock'); if (!c) { clearInterval(scaTimer); scaTimer = null; return; } c.textContent = `⏱️ ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; c.classList.toggle('low', left <= 30); if (left-- <= 0) submit(true); };
  const submit = timeUp => { if (scaTimer) { clearInterval(scaTimer); scaTimer = null; } if ($('#scaQuiz').classList.contains('graded')) return;
    const L0 = levelInfo(), before = totalCoins(), R = SCAQ.grade(l, m, qs.map(q => q.id), picks, today()); $('#scaQuiz').classList.add('graded'); $('#scaSubmit').remove(); { const h = $('#scaMockHead b'); if (h) h.textContent = `${M.icon} 已交卷 · ${R.right}/${R.n}`; }
    app.querySelectorAll('.sca-q').forEach((el, i) => scaReveal(el, qs[i], ords[i], picks[i]));
    let rw = false; if (R.newMastery && !questLog.claims.some(x => x.id === R.rewardId)) { questLog.claims.push({d: today(), id: R.rewardId, c: R.reward}); save(QK, questLog); rw = true; }
    const pct = Math.round(R.pct * 100), wrongN = R.n - R.right;
    $('#scaResAt').innerHTML = ''; const res = document.createElement('div'); res.id = 'scaRes'; res.className = `eq-res sca-res vwin jwin ${R.passed ? 'pass' : 'fail'}`;
    res.innerHTML = `<b>${timeUp ? '⌛ 时间到！' : ''}${R.right}/${R.n} · ${pct}%</b><div class="sr-ring" style="--p:${pct}"><span>${pct}%</span></div>
      <small>${R.passed ? (m === 'all' ? '综合模考达到 80%，很稳！' : rw ? `🎓 第一次达到 80%：${esc(M.zh)}（${scaL(l).zh}）已掌握！` : '达到 80%。') : `还差一点，80% 才算掌握。错的 ${wrongN} 题已放进错题本。`}</small>
      ${rw ? `<div class="er-rw sca-rw" id="scaReward"><span>🪙 +${R.reward}</span><span>⭐ +${Math.round(R.reward / 2)} XP</span></div>` : ''}
      <div class="sr-btns">${wrongN ? '<button class="btn ghost" id="scaOnlyWrong">只看错题</button>' : ''}<button class="btn ghost" id="scaRetry">🔁 再考一次</button><a class="btn ghost" href="#/sca/w">📕 错题本</a><a class="btn" href="#/sca">返回</a></div>`;
    app.insertBefore(res, app.firstChild);
    const ow = $('#scaOnlyWrong'); if (ow) ow.onclick = () => { const on = $('#scaQuiz').classList.toggle('only-wrong'); ow.textContent = on ? '显示全部' : '只看错题'; };
    $('#scaRetry').onclick = () => { SFXplay('blip'); scaMockSetup(l, m); window.scrollTo(0, 0); };
    window.scrollTo(0, 0); SFXplay(R.passed ? 'harvest' : 'hit'); drawHud();
    if (rw) { coinBurst(res, R.reward, before); xpPop(res, Math.round(R.reward / 2), L0); const L1 = levelInfo(); if (L1.lv > L0.lv) setTimeout(() => toast(`⬆️ 升级！Lv.${L1.lv} ${L1.title}`, 2600), 1200); } };
  $('#scaQuiz').onclick = e => { const b = e.target.closest('.eq-o'); if (!b || $('#scaQuiz').classList.contains('graded')) return; const card = b.closest('.sca-q'), qi = +card.dataset.q; picks[qi] = +b.dataset.o; SFXplay('blip');
    card.querySelectorAll('.eq-o').forEach(x => x.classList.toggle('pick', x === b)); const n = picks.filter(p => p >= 0).length; $('#scaCnt').textContent = `${n}/${qs.length}`; $('#scaSubmit').disabled = n < qs.length; };
  $('#scaSubmit').onclick = () => submit(false);
  if (timed) { tick(); scaTimer = setInterval(tick, 1000); }
  window.__scaMock = {qs: qs.map(q => q.id), answer: () => qs.map(q => q.a), submit}; }
function scaWrong() { scaP = null; const ids = SCAQ.state.wrong.filter(id => SCAQ.byId(id));
  setTop('📕 错题本', '', true);
  const groups = []; ids.forEach(id => { const q = SCAQ.byId(id), k = q.l + '-' + q.m; let g = groups.find(x => x.k === k); if (!g) groups.push(g = {k, q, ids: []}); g.ids.push(id); });
  app.innerHTML = `<div class="sca-disc vwin jwin"><b>📕 错题本 · ${ids.length} 题</b><small>${ids.length ? '最近答错的题会排在前面。在练习或模考里答对后会自动移出，也可以手动移出。' : '目前没有错题 🎉 去练习或模考吧。'}</small>${ids.length ? '<a class="btn" id="scaPW" href="#/sca/pw">🔁 练习全部错题</a>' : '<a class="btn" href="#/sca">回到 SCA 问答</a>'}</div>
    <div id="scaWrongList">${groups.map(g => { const M = scaM(g.q.m); return `<div class="section-title">${M.icon} ${scaL(g.q.l).zh} · ${esc(M.zh)} <small>${g.ids.length}</small></div>${g.ids.map(id => { const q = SCAQ.byId(id), a = SCAQ.state.ans[id] || {}, ord = q.o.map((_, i) => i);
      return `<div class="eq sca-q sca-wq vwin jwin wrong done" data-id="${id}"><div class="eq-q"><span class="sca-tag">${q.tf ? '判断' : '单选'}</span> ${esc(q.q)}</div>
        <div class="sw-ans">✘ 你上次选：${a.pick >= 0 ? esc(scaLetter(q, ord, a.pick)) : '没作答'}<br>✔ 正确答案：${esc(scaLetter(q, ord, q.a))}</div><div class="eq-why sca-why"><div class="sw-x">${esc(q.x)}</div><div class="sca-src">📚 出处：<br>${scaSrcHtml(q)}</div></div>
        <button class="btn ghost sca-rm" data-rm="${id}">✔ 我会了，移出</button></div>`; }).join('')}`; }).join('')}</div>
    <div class="hint sca-foot">${esc(SCAQ.DISCLAIMER)}</div>`;
  $('#scaWrongList').onclick = e => { const b = e.target.closest('[data-rm]'); if (!b) return; SFXplay('blip'); SCAQ.unwrong(b.dataset.rm); scaWrong(); }; }
function scaView(arg) { if (!window.SCAQ) { location.hash = '#/list'; return; } const a = arg || '';
  if (a === 'w') return scaWrong(); if (a === 'pw') return scaPractice('w', 'all');
  const mt = /^([pt])-([fi])-(\w+)$/.exec(a);
  if (mt && (mt[3] === 'all' ? mt[1] === 't' : SCAQ.mods(mt[2]).some(x => x.id === mt[3]))) return mt[1] === 'p' ? scaPractice(mt[2], mt[3]) : scaMockSetup(mt[2], mt[3]);
  return scaHub(/^[fi]$/.test(a) ? a : null); }
const views = {
  calendar(arg) { return calendarV(arg); },
  sca(arg) { return scaView(arg); },
  npc() { if (!window.Npc) { location.hash = '#/list'; return; } return npcCodex(); },
  edu(arg) { if (!window.Edu) { location.hash = '#/list'; return; } const q = /^q(\d)$/.exec(arg || ''); if (q) return eduQuiz(+q[1]); if (/^\d$/.test(arg || '')) return eduChapter(+arg); return eduJournal(); },
  list() {
    setTop('墨尔本咖啡打卡', '<button id="addCafeBtn">＋ 添加</button>');
    $('#addCafeBtn').onclick = () => location.hash = '#/add';
    const subs = [...new Set(allCafes().map(c => c.suburb))].sort();
    const v = visitedIds();
    app.innerHTML = `${festBanner()}${eduEntry()}${scaEntry()}${npcEntry()}${isV() || isF() ? questBoard(true) : ''}<div class="search"><input id="q" placeholder="${PXI() ? '搜索咖啡馆' : '🔍 搜索咖啡馆'}" value="${esc(listState.q)}" autocomplete="off">
      <select id="sub"><option value="">全部区域</option>${[...REGIONS, REGION_MORE].map(r => `<option value="${r.id}" ${r.id === listState.suburb ? 'selected' : ''}>${esc(r.name)}${r.zh && r.id !== 'more' ? ' ' + r.zh : ''}</option>`).join('')}</select></div>
      <div class="chips">${[['all', '全部'], ['todo', '未解锁'], ['done', '已解锁'], ['near', '离我最近']].map(([k, t]) => `<button class="chip ${listState.filter === k ? 'on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
      <div class="hint">已解锁 ${v.size} / ${allCafes().length} 家</div><div id="cards"></div>`;
    const draw = () => {
      const q = listState.q.trim().toLowerCase();
      let L = allCafes().filter(c => (!q || (c.name + ' ' + c.address + ' ' + c.suburb + ' ' + (c.tags || []).join(' ')).toLowerCase().includes(q))
        && (!listState.suburb || regionOf(c.id).r.id === listState.suburb)
        && (listState.filter !== 'todo' || !v.has(c.id)) && (listState.filter !== 'done' || v.has(c.id)));
      if (listState.filter === 'near' && lastPos) L.sort((a, b) => isClosed(a) - isClosed(b) || distM(lastPos, [a.lat, a.lng]) - distM(lastPos, [b.lat, b.lng]));
      $('#cards').innerHTML = L.map(cafeCard).join('') || '<div class="empty"><div class="e">🫖</div>没有符合条件的咖啡馆</div>';
    };
    draw(); bindQuests();
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
        <div class="map-legend"><span class="lg gold"></span> 已解锁 ${mapCafes().filter(c => v.has(c.id)).length}　<span class="lg grey"></span> 未解锁 ${mapCafes().filter(c => !v.has(c.id)).length}</div>
        <button class="fab-add" id="locBtn">🎯 定位我</button></div>`;
      const token = ++mapToken;
      MapKit.create($('#map'), CBD, 13).then(map => {
        if (token !== mapToken) return map.remove();
        mapRef = map;
        mapCafes().forEach(c => {
          const done = v.has(c.id), n = checkinsOf(c.id).length, ro = regionOf(c.id);
          const inRange = lastPos && distM(lastPos, [c.lat, c.lng]) <= NEAR_M, cl = isClosed(c);
          map.addMarker(c.lat, c.lng, done, `<div class="pop-name">${esc(c.name)}${cl ? ' ' + closedBadge : ''}</div><div class="pop-sub">${esc(ro.r.name)} · ${cl ? '已永久关闭' + (n ? ' · 打卡 ' + n + ' 次' : '') : done ? '✓ 已解锁 · 打卡 ' + n + ' 次' : inRange ? '✨ 就在附近，可解锁！' : '🔒 未解锁'}</div>${sigLine(c).replace('sig-line', 'sig-line pop-sig')}<a class="pop-link" href="#/cafe/${c.id}">查看据点 ›</a>`, {no: ro.no, label: c.short || c.name, closed: cl, id: c.id});
        });
        if (lastPos) { map.showMe(lastPos, NEAR_M); map.setView(lastPos, 15); }
        map.resize();
        if (pendingFocus) { const c = pendingFocus; pendingFocus = null; map.setView([c.lat, c.lng], 16); setTimeout(() => map.openAt(c.lat, c.lng), 300); }
      }).catch(e => { console.warn('real map failed', e); const m = $('#map'); if (m && token === mapToken) m.innerHTML = '<div class="empty" style="padding:40px 16px"><div class="e">🗺️</div>真实地图暂时加载不了（网络问题），可以先用上面的草图区域地图</div>'; });
      $('#locBtn').onclick = async () => { toast('🎯 正在定位…'); const p = await locate(); if (!p) return toast('无法获取定位，请允许定位权限'); if (mapRef) { mapRef.showMe(p, NEAR_M); mapRef.setView(p, 15); } };
    } else {
      const R = mapRegion(REGIONS.find(r => r.id === ms.region) || REGIONS[0]);
      const prog = regions().find(r => r.id === R.id);
      const J = isJ();
      const FDm = isF(), use3d = (J ? ms.jmode : FDm ? ms.fmode : ms.mode) === '3d' && can3D && !map3dFailed;
      const usePx = J && !use3d && window.PixelMap && !pxFailed;
      const {svg, meIn} = SketchMap.render(R, {visited: v, cafeById, me: lastPos, rangeM: NEAR_M});
      const ids = Object.keys(R.cafes);
      const flat = J ? 'px' : '2d';
      const toggle = `<span class="dim-toggle" id="dimT"><button data-m="${flat}" class="${use3d ? '' : 'on'}">${J ? '像素' : '2D'}</button><button data-m="3d" class="${use3d ? 'on' : ''}" ${can3D ? '' : 'disabled title="此设备不支持 3D"'}>3D</button></span>`;
      const crown = prog.done === prog.total ? ' 👑' : '';
      const VK = isV() ? Valley.clock() : null;
      const FK = FDm && window.Valley ? Valley.clock() : null;
      const bar = FK ? `<div class="fd-panel region-banner fd-banner"><div class="rb-name">${esc(R.name)}</div><div class="rb-sub">${esc(R.zh)} · 已建成 <b class="rg-count">${prog.done}/${prog.total}</b>${crown}</div><div class="rb-time">${FK.icon} ${FK.zh}季 第 ${FK.dayOf} 天 · ${FK.wx ? FK.wx.icon + ' ' : ''}${FK.hhmm}${FK.fest[0] ? ' · ' + FK.fest[0].icon + ' ' + esc(FK.fest[0].zh) : ''}</div></div>`
        : VK ? `<div class="jwin region-banner vl-banner"><div class="rb-name">${esc(R.name)}</div><div class="rb-sub">${esc(R.zh)} · 已解锁 <b class="rg-count">${prog.done}/${prog.total}</b>${crown}</div><div class="rb-time">${VK.icon} ${VK.zh}季 第 ${VK.dayOf} 天 · ${VK.sky} ${VK.hhmm}</div></div>`
        : J ? `<div class="jwin region-banner"><div class="rb-name">～ ${esc(R.name)} ～</div><div class="rb-sub">${esc(R.zh)} · 已解锁 <b class="rg-count">${prog.done}/${prog.total}</b>${crown}</div></div>`
        : `<div class="region-head"><div><b>${esc(R.name)}</b> <span class="hint">${esc(R.zh)}</span></div><div class="rg-count">${prog.done}/${prog.total}${crown}</div></div>
        <div class="progress" style="margin:0 14px 6px"><i style="width:${Math.round(prog.done / prog.total * 100)}%"></i></div>`;
      app.innerHTML = head + bar + `
        ${use3d ? `<div class="m3d-wrap${FDm ? ' fd-tilt' : ''}" id="m3d" data-region="${R.id}"><div class="m3d-loading">${FDm ? '🏰 正在铺设道路、搭建房屋…' : VK ? '🌾 正在搭建 3D 小镇…' : J ? '⚔️ 正在生成 3D 大地图…' : '✏️ 正在搭建 3D 小镇…'}</div><div class="m3d-hint">单指旋转 · 双指缩放/平移</div></div>`
          : usePx ? `<div class="px-wrap" id="pxWrap" data-region="${R.id}"${VK ? ` data-season="${VK.season}" data-phase="${VK.phase}"` : ''}></div>`
          : `<div class="sk-wrap" id="skWrap"><div class="sk-inner" style="width:${ms.zoom * 100}%">${svg}</div></div>`}
        <div class="sk-tools">${toggle}<button id="zOut">－</button><button id="zIn">＋</button>${use3d || usePx ? '<button id="m3dReset" aria-label="重置视角">⟲</button>' : ''}<button id="skLoc">🎯 ${lastPos ? (meIn ? '我在这里' : '不在此区') : '定位我'}</button></div>
        <div class="sk-list">${ids.map(id => cafeById(id)).filter(Boolean).map(cafeCard).join('')}</div>`;
      $('#dimT').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || b.disabled) return; SFXplay('blip');
        if (J) { ms.jmode = b.dataset.m; save('mcc.mapMode.jrpg', ms.jmode); } else if (FDm) { ms.fmode = b.dataset.m; save('mcc.mapMode.f', ms.fmode); } else { ms.mode = b.dataset.m; save('mcc.mapMode', ms.mode); }
        if (b.dataset.m === '3d') map3dFailed = false; if (b.dataset.m === 'px') pxFailed = false; render(); };
      const focusId = ms.focusId; ms.focusId = null;
      if (use3d) {
        const token = ++mapToken, wrap = $('#m3d');
        const fail = e => { console.warn('3D map failed, falling back', e); if (token !== mapToken) return; map3dFailed = true; if (mapRef && mapRef.kind === '3d') { try { mapRef.remove(); } catch (x) {} mapRef = null; } toast(e && e.slow ? '这台设备上 3D 有点慢，已切换为 2D 地图（可随时点 3D 再试）' : J ? '3D 地图暂不可用，已切换为像素地图' : '3D 地图暂不可用，已切换为 2D 手绘地图'); render(); };
        const seen = new Set(load('mcc.seen3d', [])), pop = new Set([...v].filter(id => R.cafes[id] && !seen.has(id)));
        loadMap3d().then(mod => mod.create(wrap, R, {theme: J ? 'jrpg' : FDm ? 'foundation' : 'sketch', season: FK ? FK.season : null, onSlow: FDm ? () => fail(Object.assign(new Error('slow'), {slow: true})) : null, visited: v, cafeById, me: lastPos, rangeM: NEAR_M, pop, fitAffine: SketchMap.fitAffine, onOpen: id => { location.hash = '#/cafe/' + id; }, onLost: () => fail(new Error('WebGL context lost'))}))
          .then(m => {
            if (token !== mapToken) return m.remove();
            mapRef = m; const ld = wrap.querySelector('.m3d-loading'); if (ld) ld.remove();
            if (pop.size) { pop.forEach(id => seen.add(id)); save('mcc.seen3d', [...seen]); }
          }).catch(fail);
        $('#zIn').onclick = () => mapRef && mapRef.zoom && mapRef.zoom(0.75); $('#zOut').onclick = () => mapRef && mapRef.zoom && mapRef.zoom(1.33);
        $('#m3dReset').onclick = () => mapRef && mapRef.reset && mapRef.reset();
      } else if (usePx) {
        try {
          mapRef = PixelMap.create($('#pxWrap'), R, {visited: v, cafeById, me: lastPos, rangeM: NEAR_M, fitAffine: SketchMap.fitAffine, focusId, heroAt: heroAt[R.id], kit: VK ? Valley.kit(VK) : null, tired: stamina() <= 0,
            onHeroMove: t => { heroAt[R.id] = t; }, onOpen: id => { location.hash = '#/cafe/' + id; }});
        } catch (e) { console.warn('pixel map failed, falling back to sketch', e); pxFailed = true; mapRef = null; return render(); }
        if (stamina() <= 0 && !stOutTold[today()]) { stOutTold[today()] = 1; setTimeout(() => staminaTalk(null), 600); } // exhausted hero: tell once per day per session
        $('#zIn').onclick = () => mapRef && mapRef.zoom(1.5); $('#zOut').onclick = () => mapRef && mapRef.zoom(1 / 1.5);
        $('#m3dReset').onclick = () => mapRef && mapRef.reset();
      } else {
        $('#skWrap').onclick = e => { const g = e.target.closest('[data-id]'); if (g) location.hash = '#/cafe/' + g.dataset.id; };
        const zoom = z => { ms.zoom = Math.min(2.4, Math.max(1, z)); $('.sk-inner').style.width = ms.zoom * 100 + '%'; };
        $('#zIn').onclick = () => zoom(ms.zoom + 0.35); $('#zOut').onclick = () => zoom(ms.zoom - 0.35);
      }
      $('#skLoc').onclick = async () => { toast('🎯 正在定位…'); const p = await locate(); if (!p) return toast('无法获取定位，请允许定位权限');
        const best = REGIONS.map(mapRegion).map(r => ({r, d: Math.min(...Object.keys(r.cafes).map(id => cafeById(id)).filter(Boolean).map(c => distM(p, [c.lat, c.lng])))})).sort((a, b) => a.d - b.d)[0];
        if (best && best.d < 1500 && best.r.id !== ms.region) { ms.region = best.r.id; toast('📍 你在 ' + best.r.name); } views.map(); };
    }
    app.querySelector('.region-tabs').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; ms.region = b.dataset.r; ms.zoom = 1; render(); };
  },

  records() {
    setTop('打卡记录');
    if (!checkins.length) {
      app.innerHTML = `<div class="empty"><div class="e">📷</div><p>${PXI() ? '日记本还是空白的' : '还没有打卡记录'}</p><p class="hint">点下面中间的「拍照」→「打卡」，拍一张就算打卡！</p>${PXI() ? `<button class="btn vl-empty-go" id="emptyGo">${ic('camera', '📷')} 去打第一张卡</button>` : ''}</div>`;
      const eg = $('#emptyGo'); if (eg) eg.onclick = () => $('#camBtn').click();
      return;
    }
    const sorted = [...checkins].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
    if (PXI()) return diaryV(sorted);
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

  shop() { return shopV(); },
  footprint() {
    if (isV()) return footprintV();
    if (isJ()) return footprintJ();
    setTop('我的足迹');
    const s = stats(), v = visitedIds(), pct = s.total ? Math.round(s.open / s.total * 100) : 0;
    const photos = [...checkins].filter(c => c.photo).slice(0, 9);
    const Lv = levelInfo();
    app.innerHTML = `<div class="player${stamina() <= 0 ? ' tired' : ''}"><div class="player-ava">${stamina() <= 0 ? '🥱' : '🧑'}</div><div class="player-main"><div class="player-name">Lv.${Lv.lv} ${Lv.title}</div><div class="xpbar big"><i style="width:${Lv.pct}%"></i></div><div class="hint" style="margin:3px 0 0">${Lv.into} / ${Lv.need} XP 升到下一级 · 总 ${Lv.xp} XP</div></div></div>
      <div class="hero"><h2>已解锁 ${s.open} / ${s.total} 个据点</h2><div class="progress" style="background:rgba(255,255,255,.3)"><i style="width:${pct}%"></i></div><div class="addr">墨尔本咖啡世界探索度 ${pct}%</div></div>
      <div class="stats"><div class="stat"><b>${s.count}</b><small>打卡次数</small></div><div class="stat"><b>${s.cafes}</b><small>据点</small></div><div class="stat"><b>${s.suburbs}</b><small>个区域</small></div></div>
      <div class="section-title">足迹地图 <a href="#/map" style="text-decoration:none">全部地图 ›</a></div><div id="fpMap" class="sk-mini"></div>
      <div class="section-title">区域收集</div><div class="regions">${regions().map(r => `<div class="region ${r.done === r.total ? 'full' : ''}"><div class="rg-top"><b>${r.done === r.total ? '👑 ' : ''}${esc(r.name)}</b><small class="hint" style="margin:0 auto 0 6px">${esc(r.id === 'more' ? '' : r.zh)}</small><span>${r.done}/${r.total}</span></div><div class="progress"><i style="width:${Math.round(r.done / r.total * 100)}%"></i></div></div>`).join('')}</div>
      <div class="section-title">成就</div><div class="badges">${BADGES.map(b => `<div class="bdg ${b.test(s) ? '' : 'off'}"><span class="e">${b.e}</span>${b.name}</div>`).join('')}</div>
      <div class="section-title">照片墙 <a href="#/records" style="font-size:13px;color:var(--brown);font-weight:600;text-decoration:none">全部记录 ›</a></div>
      ${photos.length ? `<div class="grid3">${photos.map(p => `<img src="${p.photo}" alt="" data-edit="${p.id}">`).join('')}</div>` : '<div class="hint">还没有照片，去拍一张吧 📷</div>'}
      <div class="section-title">去过的咖啡馆</div>${[...v].map(cafeById).filter(Boolean).map(cafeCard).join('') || '<div class="hint">还没有去过的咖啡馆</div>'}${beansSection()}${settingsHtml()}`;
    bindSettings();
    const top = regions().filter(r => r.id !== 'more').sort((x, y) => y.done - x.done)[0];
    const TR = REGIONS.find(r => r.id === (top && top.done ? top.id : 'city'));
    $('#fpMap').innerHTML = SketchMap.render(mapRegion(TR), {visited: v, cafeById}).svg;
    $('#fpMap').onclick = e => { const g = e.target.closest('[data-id]'); if (g) { location.hash = '#/cafe/' + g.dataset.id; return; } mapState.region = TR.id; location.hash = '#/map'; };
    app.onclick = e => { const ed = e.target.closest('[data-edit]'); if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false); };
  },

  beans() {
    setTop(isV() ? '种子袋 · 豆子' : '豆子笔记', '<button data-newbean>＋ 拍豆子</button>');
    app.innerHTML = `<div class="search"><input id="bq" placeholder="${PXI() ? '' : '🔍 '}搜索豆名、产地、风味、处理法…" value="${esc(listState.bq || '')}" autocomplete="off"></div>
      <div class="bean-actions"><button class="btn" data-newbean>${ic('camera', '📷')} 拍照</button><button class="btn ghost" data-newbean="album">${ic('photo', '🖼️')} 相册</button><button class="btn ghost" data-manualbean>${ic('quill', '✍️')} 手动</button></div>
      <div class="hint" id="bCount"></div><div id="beanList"></div>`;
    const draw = () => { const q = (listState.bq || '').trim().toLowerCase();
      const L = beans.filter(b => !q || [...Beans.FIELDS.map(([k]) => b[k]), b.raw, b.memo].join(' ').toLowerCase().includes(q));
      $('#bCount').textContent = `共 ${beans.length} 款豆子${q ? ` · 找到 ${L.length} 款` : ''}`;
      $('#beanList').innerHTML = L.map(beanCard).join('') || `<div class="empty"><div class="e">🫘</div>${beans.length ? '没有找到匹配的豆子' : '还没有豆子<br><span class="hint">拍一下豆袋标签，文字会自动识别保存</span>'}</div>`; };
    draw(); $('#bq').oninput = e => { listState.bq = e.target.value; draw(); };
  },
  bean(id) {
    const b = beans.find(x => x.id === id);
    if (!b) { setTop('豆子', '', true); app.innerHTML = '<div class="empty">找不到这款豆子 <a href="#/beans">返回列表</a></div>'; return; }
    setTop(b.name || '豆子', '', true);
    const c = b.cafeId && cafeById(b.cafeId);
    app.innerHTML = `${b.photo ? `<img class="hero-photo" src="${b.photo}" alt="">` : ''}
      <div class="hero bean-hero"><h2>🫘 ${esc(b.name || '未命名豆子')}</h2><div class="addr">${esc([b.roaster, b.weight].filter(Boolean).join(' · '))}</div></div>
      <div class="card bean-fields"><dl>${Beans.FIELDS.filter(([k]) => k !== 'name' && b[k]).map(([k, zh]) => `<dt>${zh}</dt><dd data-f="${k}">${esc(b[k])}</dd>`).join('') || '<dd class="hint">没有字段，可以点编辑补充</dd>'}
        ${c ? `<dt>购于</dt><dd><a href="#/cafe/${c.id}">${esc(c.name)}</a></dd>` : ''}${b.memo ? `<dt>备注</dt><dd>${esc(b.memo)}</dd>` : ''}<dt>记录</dt><dd>${esc(b.date || '')}</dd></dl></div>
      <div class="row"><button class="btn" id="bCopy">📋 复制文字</button><button class="btn ghost" id="bShare">📤 分享</button></div>
      <div class="row"><button class="btn ghost" id="bEdit">✏️ 编辑</button><button class="btn danger" id="bDel">🗑️ 删除</button></div>
      <details class="bean-raw"${b.raw ? '' : ' hidden'}><summary>识别原文</summary><pre>${esc(b.raw || '')}</pre></details>`;
    $('#bCopy').onclick = async () => toast(await copyText(beanText(b)) ? '📋 已复制，可以粘贴到别处' : '复制失败，请长按原文手动复制');
    $('#bShare').onclick = async () => { const t = beanText(b);
      if (navigator.share) { try { await navigator.share({title: b.name || '咖啡豆', text: t}); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      toast(await copyText(t) ? '📋 此设备不支持分享，已复制文字' : '分享失败'); };
    $('#bEdit').onclick = () => openBeanSheet({bean: b});
    $('#bDel').onclick = () => { if (!confirm(`删除「${b.name || '这款豆子'}」？`)) return; beans = beans.filter(x => x.id !== id); saveBeans(); toast('已删除'); location.hash = '#/beans'; };
  },

  cafe(id) {
    const c = cafeById(id);
    if (!c) { app.innerHTML = '<div class="empty">找不到这家咖啡馆</div>'; return; }
    setTop(c.name, '', true);
    const cis = checkinsOf(id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const hero = cis.find(x => x.photo);
    const avg = cis.filter(x => x.rating).length ? (cis.reduce((s, x) => s + (x.rating || 0), 0) / cis.filter(x => x.rating).length).toFixed(1) : null;
    const d = lastPos ? fmtDist(distM(lastPos, [c.lat, c.lng])) : null;
    const FDd = isF() && window.FD && window.Valley;
    app.innerHTML = `${hero ? `<img class="hero-photo" src="${hero.photo}" alt="">` : PXI() ? PixUI.sceneHtml(c, {closed: isClosed(c)}) : FDd ? `<div class="fd-scene${cis.length ? ' built' : ''}"><div class="fd-scene-sky"></div><img class="fd-scene-b" src="${FD.url(c.id, cis.length > 0 && !isClosed(c), {flag: cis.length >= 5})}" alt=""><div class="fd-scene-cap">${isClosed(c) ? '已关店' : cis.length ? `已建成 · 打卡 ${cis.length} 次` : '蓝图 · 打卡后建成'}</div></div>` : ''}
      <div class="hero${isClosed(c) ? ' closed' : ''}"><div class="hero-reg">${regionOf(c.id).no ? `<span class="num">${regionOf(c.id).no}</span> ` : ''}${esc(regionOf(c.id).r.name)}${isClosed(c) ? ' ' + closedBadge : ''}</div><h2>${esc(c.name)}</h2><div class="addr">📍 ${esc(c.address)}</div><div class="addr" style="margin-top:4px">${esc(c.suburb)}${d ? ' · 距你 ' + d : ''}${avg ? ' · 我的评分 ' + avg + ' ★' : ''}</div></div>
      <div>${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${c.custom ? '<span class="tag">我添加的</span>' : ''}</div>
      ${isClosed(c) ? `<div class="closed-note">🚪 这家店已永久关闭，以前的打卡记录都还在。</div>` : ''}${sigBox(c)}
      ${FDd ? (() => { const vg = villagerOf(id), h = heartsOf(id); return `<div class="fd-panel fd-barista"><div class="fdb-ava">${esc([...vg.name][0] || '咖')}</div><div class="fdb-main"><div class="fdb-name">${esc(vg.title)} <b>${esc(vg.name)}</b> <small>好感 ${h}/10</small></div>${Valley.heartsHtml(h)}<div class="fdb-say" id="fdbSay">「${esc(Valley.greeting(vg, h, id))}」</div></div><button class="fdb-talk" id="talkBtn" aria-label="聊天">💬</button></div>`; })() : ''}
      ${isV() ? (() => { const vg = villagerOf(id), h = heartsOf(id); return `<div class="jwin vl-barista"><div class="vb-face" id="vbFace"></div><div class="vb-main"><div class="vb-name">${esc(vg.title)} <b>${esc(vg.name)}</b></div>${Valley.heartsHtml(h)}<div class="vb-h">好感 ${h}/10${h >= 10 ? ' · 挚友' : h >= 5 ? ' · 好朋友' : h ? ' · 熟客' : ' · 初次见面'}</div><div class="vb-say">「${esc(Valley.greeting(vg, h, id))}」</div></div><button class="vb-talk" id="talkBtn">💬</button></div>`; })() : ''}
      ${window.Websites && Websites.of(c) ? `<div class="web-box">${Websites.btnHtml(c)}</div>` : ''}<div class="gr-box">${window.GReviews ? GReviews.btnHtml(c, 'btn ghost', '在 Google 地图看评价', 'gmLink') : `<a class="btn ghost" target="_blank" rel="noopener" id="gmLink" href="${MapKit.gmapsLink(c)}">${ic('boot', '🧭')} 在 Google 地图看评价</a>`}<div id="grPanelBox"></div></div>
      <button class="btn${isClosed(c) ? ' ghost' : ''}" id="ciBtn">${isClosed(c) ? ic('quill', '📝') + ' 补记一次以前的打卡' : ic('cup', '☕') + ' 在这里打卡'}</button>
      ${isClosed(c) ? '' : `<button class="btn ghost" id="mapBtn">${ic('map', '🗺️')} 地图上看</button>`}
      <div class="section-title">我的打卡（${cis.length}）</div>
      ${cis.map(ci => `<div class="rec">${ci.photo ? `<img src="${ci.photo}" alt="">` : ''}<div class="body"><div class="top"><span class="stars">${stars(ci.rating) || '<span class="hint">未评分</span>'}</span><span class="date">${esc(ci.date)}</span></div>${ci.drink ? `<div class="note">🥤 ${esc(ci.drink)}</div>` : ''}${ci.note ? `<div class="note">${esc(ci.note)}</div>` : ''}<div style="text-align:right"><button class="edit" data-edit="${ci.id}">编辑</button></div></div></div>`).join('') || '<div class="hint">还没在这里打过卡</div>'}
      ${c.custom ? '<button class="btn danger" id="delCafe">删除这家咖啡馆</button>' : ''}`;
    if (PXI() && !hero) PixUI.mountScene($('#vlScene'), c.id, {visited: cis.length > 0, closed: isClosed(c)});
    if (window.GReviews && GReviews.hasKey) GReviews.mount($('#grPanelBox'), c); // lazy: Google is only contacted here, and only with a key
    if (isV()) { const vg = villagerOf(id), h = heartsOf(id); $('#vbFace').appendChild(Valley.portraitEl(vg, 2)); let talks = 0;
      const talk = () => { const t = talks++, st = stamina(); Valley.say(t === 0 && st <= ST_LOW ? (st <= 0 ? ST_OUT : ST_WARN) : Valley.greeting(vg, t === 0 ? h : Math.max(0, h + (t % 3) - 1), id), 3200, vg); }; talk(); $('#talkBtn').onclick = () => { SFXplay('blip'); talk(); }; }
    if (FDd) { const vg = villagerOf(id), h = heartsOf(id); let talks = 1; $('#talkBtn').onclick = () => { const t = talks++, st = stamina(); $('#fdbSay').textContent = '「' + (t === 1 && st <= ST_LOW ? (st <= 0 ? ST_OUT : ST_WARN) : Valley.greeting(vg, Math.max(0, h + (t % 3) - 1), id, {...Valley.clock(), day: Valley.clock().day + t})) + '」'; }; }
    $('#ciBtn').onclick = () => openCheckinForm({id: uid(), cafeId: id, photo: '', rating: 0, drink: '', note: '', date: today(), createdAt: Date.now()}, true);
    if ($('#mapBtn')) $('#mapBtn').onclick = () => { const ro = regionOf(c.id); if (ro.no) { mapState.region = ro.r.id; mapState.focusId = c.id; } else { mapState.region = 'real'; pendingFocus = c; } location.hash = '#/map'; };
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

// ---------- 🛒 coin shop (金币商店): cosmetics for the farmer + decorations for the town map ----------
let shopCat = 'hat';
const SHOP_CATS = [['hat', '帽子', 'star'], ['outfit', '衣服', 'heart'], ['decor', '装饰', 'chest']];
function shopV() {
  if (!isV() || !window.PixShop) { setTop('金币商店', '', true); app.innerHTML = `<div class="card"><b>🛒 金币商店在「🌾 田园」主题里开张</b><div class="hint">帽子、衣服和小镇装饰只在田园像素画面里显示。</div><button class="btn" id="goV">切换到田园主题</button></div>`; const g = $('#goV'); if (g) g.onclick = () => setTheme('valley'); return; }
  setTop('金币商店');
  const V = Valley, k = V.clock();
  app.innerHTML = `<div class="vwin jwin vl-shophead"><div class="sh-keeper" id="shKeeper"></div><div class="sh-say"><b>杂货铺 · 老板娘 Pip</b><span id="shSay">欢迎光临！用打卡赚的金币，给自己和小镇添点东西吧。</span></div></div>
    <div class="vl-tabs sh-tabs" id="shTabs">${SHOP_CATS.map(([c, n, i]) => `<button class="chip ${shopCat === c ? 'on' : ''}" data-cat="${c}">${ic(i, '')} ${n}</button>`).join('')}</div>
    <div class="vl-shopgrid" id="shGrid"></div>
    <div class="hint sh-foot">金币来源：打卡（每次约 ${fmtN(15 + 5 * 3 + 10)}–${fmtN(110)}）· 每日委托 · 拍豆子。买过的东西永久拥有，可以随时换装 / 收起。</div>`;
  const kp = $('#shKeeper'); try { kp.appendChild(V.portraitEl(V.villager('general-store-pip', 3), 2)); } catch (e) { kp.textContent = '🧺'; }
  const draw = () => {
    const coins = totalCoins();
    $('#shGrid').innerHTML = PixShop.ITEMS.filter(i => i.kind === shopCat).map(i => { const own = PixShop.owns(i.id), eq = PixShop.equipped(i.id); let poor = !own && coins < i.price;
      const eduLock = !own && i.edu, npcLock = !own && i.npc; if (eduLock || npcLock) poor = false;
      const btn = npcLock ? `<a class="sh-buy edu-lock npc-lock" href="#/npc">🎭 隐藏角色礼物</a>` : eduLock ? `<a class="sh-buy edu-lock" href="#/edu">📖 咖啡课第 ${i.edu} 章</a>` : !own ? `<button class="sh-buy${poor ? ' poor' : ''}" data-buy="${i.id}">${V.coinImg()}${fmtN(i.price)}</button>`
        : i.kind === 'decor' ? `<button class="sh-eq${eq ? ' on' : ''}" data-eq="${i.id}">${eq ? '✔ 已摆放' : '摆放'}</button>`
        : `<button class="sh-eq${eq ? ' on' : ''}" data-eq="${i.id}"${eq && i.free ? ' disabled' : ''}>${eq ? '✔ 装备中' : '装备'}</button>`;
      return `<div class="vwin sh-item${own ? ' owned' : ''}${eq ? ' equipped' : ''}${poor ? ' poor' : ''}" data-item="${i.id}"><div class="sh-prev" data-prev="${i.id}"></div><b>${esc(i.name)}</b><small>${esc(i.desc)}</small>
        <div class="sh-state">${own ? (i.free ? '默认' : i.edu ? '课程奖励' : i.npc ? '角色礼物' : '已拥有') : npcLock ? '遇见隐藏角色后获得' : eduLock ? '主线奖励' : poor ? `还差 ${fmtN(i.price - coins)}` : '可购买'}</div>${btn}</div>`; }).join('');
    $('#shGrid').querySelectorAll('[data-prev]').forEach(el => { const c = PixShop.preview(el.dataset.prev); if (c) el.appendChild(JRPG.scaled(c, c.width > 16 ? 2 : 3)); });
  };
  const say = t => { const e = $('#shSay'); if (e) e.textContent = t; };
  draw();
  $('#shTabs').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; shopCat = b.dataset.cat; SFXplay('blip'); app.querySelectorAll('#shTabs .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  $('#shGrid').onclick = e => {
    const eqb = e.target.closest('[data-eq]'); if (eqb) { const it = PixShop.byId(eqb.dataset.eq); PixShop.toggle(it.id); SFXplay('blip'); say(PixShop.equipped(it.id) ? (it.kind === 'decor' ? `${it.name} 已经摆到小镇地图上啦。` : `${it.name} 很适合你！`) : `${it.name} 先收起来了。`); draw(); drawHud(); return; }
    const bb = e.target.closest('[data-buy]'); if (!bb) return; const it = PixShop.byId(bb.dataset.buy), coins = totalCoins();
    if (coins < it.price) { SFXplay('hit'); say(`还差 ${fmtN(it.price - coins)} 金币哦，去打卡或做每日委托吧！`); bb.classList.remove('shake'); void bb.offsetWidth; bb.classList.add('shake'); return; }
    shopConfirm(it, coins, () => { const card = bb.closest('.sh-item'), r0 = card && card.getBoundingClientRect(); PixShop.buy(it.id); SFXplay('harvest'); say(it.kind === 'decor' ? `谢谢惠顾！${it.name} 已经摆到地图上了。` : `谢谢惠顾！已经帮你换上 ${it.name}。`);
      draw(); const nc = $(`#shGrid [data-item="${it.id}"]`); coinSpend(nc || card, it.price, coins); if (!nc && r0) {} });
  };
}
function shopConfirm(it, coins, ok) {
  let m = $('#shModal'); if (m) m.remove(); m = document.createElement('div'); m.id = 'shModal'; m.className = 'vl-modal';
  m.innerHTML = `<div class="vwin jwin sh-confirm" role="dialog" aria-label="确认购买"><div class="sh-prev big" id="shCPrev"></div><b>买下「${esc(it.name)}」？</b>
    <div class="sh-math"><span>${Valley.coinImg()}${fmtN(coins)}</span><span>−${fmtN(it.price)}</span><span>= ${Valley.coinImg()}${fmtN(coins - it.price)}</span></div>
    <div class="sh-btns"><button class="btn ghost" data-no>再想想</button><button class="btn" data-yes>${ic('star', '')} 买下！</button></div></div>`;
  document.body.appendChild(m); const c = PixShop.preview(it.id); if (c) $('#shCPrev').appendChild(JRPG.scaled(c, c.width > 16 ? 3 : 5)); SFXplay('blip');
  requestAnimationFrame(() => m.classList.add('show'));
  m.onclick = e => { if (e.target.closest('[data-yes]')) { m.remove(); ok(); } else if (e.target === m || e.target.closest('[data-no]')) m.remove(); };
}
window.addEventListener('hashchange', () => { const m = $('#shModal'); if (m) m.remove(); });
// ---------- 🎶 background music toggle (music.js does the synth; off by default, starts only from a tap) ----------
const musicOn = () => !!(window.Music && Music.enabled);
function musicMood() { try { if (isF()) return Valley.clock().lit ? 'f-night' : 'f-day'; if (isR()) { const k = Valley.clock(); return k.lit ? 'night' : 'r-' + k.season; } return isV() ? (Valley.clock().lit ? 'night' : 'day') : 'day'; } catch (e) { return 'day'; } }
document.addEventListener('click', e => { const b = e.target.closest('[data-music]'); if (!b || !window.Music) return; e.preventDefault(); Music.set(!Music.enabled, musicMood());
  toast(Music.enabled ? '🎶 背景音乐：开（原创 8-bit 小曲）' : '🔕 背景音乐：关', 1600); drawHud(); const t = $('#musT'); if (t) { t.setAttribute('aria-pressed', Music.enabled); t.textContent = Music.enabled ? '开' : '关'; } });
setInterval(() => { if (window.Music && Music.enabled) Music.mood(musicMood()); }, 60000);
function settingsHtml() {
  const on = window.JRPG && JRPG.SFX.on;
  return `<div class="section-title">${ic('gear', '⚙️')} 设置</div><div class="settings">
    <div class="set-row"><span>界面主题</span><span class="dim-toggle theme-sel" id="themeSel"><button data-theme="foundation" class="${THEME === 'foundation' ? 'on' : ''}" ${window.FD ? '' : 'disabled'}>🏰 城镇</button><button data-theme="ranch" class="${THEME === 'ranch' ? 'on' : ''}" ${window.JRPG && window.Valley ? '' : 'disabled'}>🐄 牧场</button><button data-theme="valley" class="${THEME === 'valley' ? 'on' : ''}" ${window.JRPG && window.Valley ? '' : 'disabled'}>🌾 田园</button><button data-theme="jrpg" class="${THEME === 'jrpg' ? 'on' : ''}" ${window.JRPG ? '' : 'disabled'}>⚔️ JRPG</button><button data-theme="sketch" class="${THEME === 'sketch' ? 'on' : ''}">✏️ 手绘</button></span></div>
    <div class="set-row"><span>📅 日历与节日</span><a class="btn ghost sm" href="#/calendar">打开日历 ›</a></div>
    <div class="set-row"><span>${isV() ? '🎵 小音效' : '8-bit 音效'}</span><button class="snd-btn" data-snd id="sndT" aria-pressed="${!!on}">${on ? '🔊' : '🔇'}</button></div>
    <div class="set-row"><span>${isV() ? '🎶 背景音乐' : '🎶 像素背景音乐'} <small class="hint">${isF() ? '原创拨弦小曲（像鲁特琴），白天温暖、夜晚安静' : isR() ? '原创 8-bit 小曲，春夏秋冬各一首，夜晚安静' : '原创 8-bit 小曲，白天轻快、夜晚安静'}</small></span><button class="snd-btn mus-set" data-music id="musT" aria-pressed="${musicOn()}">${musicOn() ? '开' : '关'}</button></div>
    <div class="set-row gr-set"><span>⭐ Google 评分 <small class="hint">${window.GReviews && GReviews.hasKey ? '已配置 key：咖啡馆详情页会显示 Google 星级和最近评价' : '未配置：在 config.js 填入 GOOGLE_MAPS_API_KEY 后，详情页可显示 Google 星级和评价（见 README）。现在可以点「看 Google 评价」去 Google 地图看。'}</small></span><span class="gr-set-st">${window.GReviews && GReviews.hasKey ? '开' : '未配置'}</span></div>
    ${isV() ? '<div class="set-row"><span>🛒 金币商店</span><a class="btn ghost sm" href="#/shop">去逛逛 ›</a></div>' : ''}</div>`;
}
function bindSettings() { const t = $('#themeSel'); if (t) t.onclick = e => { const b = e.target.closest('[data-theme]'); if (b && !b.disabled && b.dataset.theme !== THEME) setTheme(b.dataset.theme); }; }
// 📒 valley diary: entries grouped by day, each with its item sprite, quality star and pixel rating
const WKZ = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const sprUrl = {}; const itemUrl = n => { const k = Valley.kindOf(n); return sprUrl[k] || (sprUrl[k] = Valley.itemSprite(n).toDataURL()); };
const pxStars = n => `<span class="px-stars" aria-label="${n} 星">${Array.from({length: 5}, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
function diaryV(sorted) {
  const days = []; sorted.forEach(ci => { const d = ci.date || ciDay(ci); let g = days[days.length - 1]; if (!g || g.d !== d) days.push(g = {d, L: []}); g.L.push(ci); });
  const led = coinLedger();
  app.innerHTML = `<div class="vl-diary-head vwin jwin">${ic('book', '📒')}<b>咖啡日记</b><small>共 ${checkins.length} 篇 · ${days.length} 天</small></div>` + days.map(({d, L}) => { const dt = new Date(d + 'T12:00:00'), ok = !isNaN(dt);
    return `<div class="vl-dgroup"><div class="vl-day-tag">${ok ? `${dt.getMonth() + 1}月${dt.getDate()}日 <small>${WKZ[dt.getDay()]}</small>` : esc(d)}${d === today() ? ' <em>今天</em>' : ''}</div>` + L.map(ci => { const c = cafeById(ci.cafeId), q = Valley.quality(ci.rating), zh = Valley.itemZh(ci.drink);
      return `<div class="rec vl-entry"><div class="ve-item"><img src="${itemUrl(ci.drink || 'Coffee')}" alt="">${q ? `<i class="vq ${q.k}"></i>` : ''}</div>
        <div class="body"><div class="top"><span class="cname">${c ? `<a href="#/cafe/${c.id}" style="color:inherit;text-decoration:none">${esc(c.name)}</a>` : '未选择咖啡馆'}</span><span class="ve-coin">${Valley.coinImg()}+${led.get(ci.id) || 0}</span></div>
        ${c ? '' : `<button class="warn" data-assign="${ci.id}" style="border:0">📍 点击选择咖啡馆</button>`}
        <div class="ve-line">${ci.drink ? `<b>${esc(zh || ci.drink)}</b>${zh && zh !== ci.drink ? ` <small>${esc(ci.drink)}</small>` : ''}` : '<span class="hint">没记点了什么</span>'}</div>
        <div class="ve-line">${ci.rating ? pxStars(ci.rating) : '<span class="hint">未评分</span>'}${ci.taste || ci.look || ci.value ? `<span class="hint ve-sub">口味 ${ci.taste || '-'} · 颜值 ${ci.look || '-'} · 性价比 ${ci.value || '-'}</span>` : ''}</div>
        ${ci.note ? `<div class="note ve-note">“${esc(ci.note)}”</div>` : ''}
        <div class="ve-foot">${ci.formStatus === 'sent' ? '<span class="hint">📨 已提交表单</span>' : '<span></span>'}<button class="edit" data-edit="${ci.id}">${ci.rating || ci.note || ci.drink ? '编辑' : '＋ 补充评分/心得'}</button></div></div>
        ${ci.photo ? `<img class="ve-photo" src="${ci.photo}" alt="" loading="lazy">` : ''}</div>`; }).join('') + '</div>'; }).join('');
  app.onclick = e => {
    const ed = e.target.closest('[data-edit]'), as = e.target.closest('[data-assign]');
    if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false);
    if (as) { const ci = checkins.find(c => c.id === as.dataset.assign); openPicker(id => { ci.cafeId = id; saveCheckins(); checkBadges(); closeSheet(); toast('✅ 已更新'); render(); }, {allowLater: false}); }
  };
}
function footprintJ() {
  setTop('冒险日志');
  const s = stats(), v = visitedIds(), L = levelInfo(), owned = new Set(BADGES.filter(b => b.test(s)).map(b => b.id));
  const photos = [...checkins].filter(c => c.photo).slice(0, 9);
  const quests = [...regions().map(r => ({main: true, name: `${r.name} 咖啡巡礼`, zh: r.id === 'more' ? '自由探索' : r.zh, done: r.done, total: r.total})),
    ...BADGES.filter(b => b.id !== 'first').map(b => ({main: false, name: b.name, zh: b.e, done: owned.has(b.id) ? 1 : 0, total: 1}))];
  app.innerHTML = `<div class="jwin status"><div class="st-hero" id="stHero"></div><div class="st-main"><div class="st-name">勇者 Lv.${L.lv}</div><div class="st-title">${L.title}</div>
      ${stBar()}
      <div class="hud-bar"><span>XP</span><div class="xpbar"><i style="width:${L.pct}%"></i></div><em>${L.into}/${L.need}</em></div></div></div>
    <div class="jwin st-stats"><div>打卡<b>${s.count}</b></div><div>据点<b>${s.open}/${s.total}</b></div><div>区域<b>${s.suburbs}</b></div><div>总XP<b>${L.xp}</b></div></div>
    <div class="section-title">📜 任务</div>
    <div class="jwin quests">${quests.map(q => `<div class="quest ${q.done >= q.total ? 'clear' : ''}"><div class="q-top"><span class="q-kind">${q.main ? '主线' : '支线'}</span><b>${esc(q.name)}</b><span class="q-st">${q.done >= q.total ? '完成！' : q.main ? `${q.done}/${q.total}` : '未达成'}</span></div>${q.main ? `<div class="xpbar"><i style="width:${Math.round(q.done / q.total * 100)}%"></i></div><small>${esc(q.zh)}</small>` : ''}</div>`).join('')}</div>
    <div class="section-title">📖 咖啡图鉴 <small>${s.cafes}/${s.totalAll}</small></div>
    <div class="dex">${allCafes().map((c, i) => `<a class="dex-item ${v.has(c.id) ? 'seen' : 'unk'}" href="#/cafe/${c.id}"><span class="dex-no">No.${String(i + 1).padStart(3, '0')}</span><canvas data-spr="${c.id}" width="24" height="24"></canvas><span class="dex-name">${v.has(c.id) ? esc(c.short || c.name) : '？？？'}</span></a>`).join('')}</div>
    <div class="section-title">🎒 道具栏</div>
    <div class="jwin inv">${BADGES.map(b => `<div class="inv-item ${owned.has(b.id) ? 'own' : 'off'}"><span class="ii">${owned.has(b.id) ? b.e : '？'}</span><span class="in">${owned.has(b.id) ? esc(b.name) : '？？？'}</span>${owned.has(b.id) ? '<em>E</em>' : ''}</div>`).join('')}</div>
    <div class="section-title">🖼️ 冒险相册 <a href="#/records" style="text-decoration:none">全部记录 ›</a></div>
    ${photos.length ? `<div class="grid3">${photos.map(p => `<img src="${p.photo}" alt="" data-edit="${p.id}">`).join('')}</div>` : '<div class="hint">还没有照片，去拍一张吧 📷</div>'}
    ${beansSection()}
    ${settingsHtml()}`;
  app.querySelectorAll('canvas[data-spr]').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(JRPG.cafeSprite(cv.dataset.spr, v.has(cv.dataset.spr)), 0, 0); });
  const hc = document.createElement('canvas'); hc.width = hc.height = 16; JRPG.drawHero(hc, 'down', 0); if (stamina() <= 0) JRPG.tire(hc); $('#stHero').appendChild(JRPG.scaled(hc, 4));
  bindSettings();
  app.onclick = e => { const ed = e.target.closest('[data-edit]'); if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false); };
}
let fpTab = 'collect';
function footprintV() {
  setTop('农场日记');
  const s = stats(), v = visitedIds(), L = levelInfo(), owned = new Set(BADGES.filter(b => b.test(s)).map(b => b.id)), k = Valley.clock();
  const col = collection(), cat = catalog(), extraItems = [...col.values()].filter(e => !cat.some(i => itemKey(i.name) === itemKey(e.name))).map(e => ({name: e.name, type: Valley.isFood(e.name) ? 'food' : 'drink', custom: true}));
  const all = [...cat, ...extraItems], drinks = all.filter(i => i.type !== 'food'), foods = all.filter(i => i.type === 'food');
  const slot = i => { const e = col.get(itemKey(i.name)), q = e && Valley.quality(e.best), zh = Valley.itemZh(i.name);
    return `<div class="vl-slotc ${e ? 'seen' : 'unk'}" title="${e ? esc(i.name) : '？？？'}"><canvas data-item="${esc(i.name)}" width="16" height="16"></canvas>${q ? `<i class="vq ${q.k}"></i>` : ''}<span>${e ? esc(zh || i.name) : '？？？'}</span>${e && e.n > 1 ? `<em>×${e.n}</em>` : ''}</div>`; };
  const quests = [...regions().map(r => ({name: `${r.name} 咖啡巡礼`, zh: r.id === 'more' ? '自由探索' : r.zh, done: r.done, total: r.total, reward: '🪙 区域徽章'})),
    ...BADGES.filter(b => b.id !== 'first').map(b => ({name: b.name, zh: b.e, done: owned.has(b.id) ? 1 : 0, total: 1, reward: '🎒 ' + b.e}))];
  const friends = allCafes().map(c => ({c, h: heartsOf(c.id)})).sort((a, b) => b.h - a.h || a.c.name.localeCompare(b.c.name));
  const met = friends.filter(f => f.h > 0);
  const tabs = [['collect', ic('book', '📖') + ' 收藏'], ['beans', ic('bean', '🫘') + ' 豆子'], ['friends', ic('heart', '❤') + ' 好感'], ['board', ic('scroll', '📌') + ' 任务板'], ['bag', ic('chest', '🎒') + ' 背包']];
  const body = {
    collect: () => `<div class="vl-colh">🥤 饮品 <small>${drinks.filter(i => col.has(itemKey(i.name))).length}/${drinks.length}</small></div><div class="vwin vl-slots">${drinks.map(slot).join('')}</div>
      <div class="vl-colh">🥐 美食 <small>${foods.filter(i => col.has(itemKey(i.name))).length}/${foods.length}</small></div><div class="vwin vl-slots">${foods.map(slot).join('')}</div>
      <div class="vl-colh">🏅 区域徽章 <small>${regions().filter(r => r.done === r.total).length}/${regions().length}</small></div><div class="vwin vl-medals">${regions().map(r => { const t = r.done === r.total ? 'gold' : r.done * 3 >= r.total * 2 ? 'silver' : r.done * 3 >= r.total ? 'bronze' : r.done ? 'wood' : 'none'; return `<div class="vl-medal ${t}" data-region="${r.id}"><i></i><b>${esc(r.name)}</b><small>${r.done}/${r.total}</small></div>`; }).join('')}</div>
      <div class="vl-colh">🏪 咖啡馆 <small>${s.cafes}/${s.totalAll}</small></div><div class="vwin vl-slots shops">${allCafes().map(c => `<a class="vl-slotc ${v.has(c.id) ? 'seen' : 'unk'}" href="#/cafe/${c.id}"><canvas data-shop="${c.id}" width="32" height="32"></canvas><span>${v.has(c.id) ? esc(c.short || c.name) : '？？？'}</span></a>`).join('')}</div>`,
    beans: () => `<div class="hint">拍豆袋标签 → 自动识别文字，存成种子包 · 每包 +${BEAN_COINS} 金币 · 共 ${beans.length} 包 <a href="#/beans">列表/搜索 ›</a></div>
      <div class="vl-packets">${beans.map(beanPacket).join('')}<button class="vl-packet add" data-newbean><span class="pk-top">新种子</span><span class="pk-plus">＋</span><b>拍豆子</b><small>拍照识别标签</small></button></div>`,
    friends: () => `<div class="hint">每次打卡，和那家店的咖啡师好感 +1 ❤（最多 10）· 已认识 ${met.length}/${friends.length}</div>
      <div class="vl-friends">${friends.map(({c, h}) => { const vg = villagerOf(c.id); return h ? `<a class="vwin vl-fr" href="#/cafe/${c.id}"><span class="fr-face" data-vil="${c.id}"></span><span class="fr-main"><b>${esc(vg.name)}</b> <small>${esc(c.short || c.name)}</small>${Valley.heartsHtml(h)}</span></a>`
        : `<a class="vl-fr unk" href="#/cafe/${c.id}"><span class="fr-face unk">？</span><span class="fr-main"><b>？？？</b> <small>${esc(c.short || c.name)}</small></span></a>`; }).join('')}</div>`,
    board: () => `${questBoard(false)}<div class="vl-colh">📌 长期任务</div><div class="vl-board">${quests.map((q, i) => `<div class="vl-note ${q.done >= q.total ? 'clear' : ''}" style="--rot:${((i * 37) % 7) - 3}deg"><i class="pin"></i><b>${esc(q.name)}</b><small>${esc(q.zh)}</small>
      ${q.total > 1 ? `<div class="xpbar"><i style="width:${Math.round(q.done / q.total * 100)}%"></i></div><span class="nb">${q.done}/${q.total}</span>` : `<span class="nb">${q.done ? '✔ 已完成' : '进行中'}</span>`}<span class="rw">奖励 ${q.reward}</span>${q.done >= q.total ? '<span class="stamp">完成</span>' : ''}</div>`).join('')}</div>`,
    bag: () => `<div class="vwin vl-slots bag">${BADGES.map(b => `<div class="vl-slotc ${owned.has(b.id) ? 'seen' : 'unk'}"><span class="bi">${owned.has(b.id) ? b.e : '？'}</span><span>${owned.has(b.id) ? esc(b.name) : '？？？'}</span></div>`).join('')}${Array.from({length: 3}, () => '<div class="vl-slotc empty"></div>').join('')}</div>`};
  const photos = [...checkins].filter(c => c.photo).slice(0, 9);
  app.innerHTML = `<div class="jwin status vl-status"><div class="st-hero" id="stHero"></div><div class="st-main"><div class="st-name">咖啡农夫 Lv.${L.lv}</div><div class="st-title">${L.title}</div>
      ${stBar()}
      <div class="hud-bar"><span>XP</span><div class="xpbar"><i style="width:${L.pct}%"></i></div><em>${L.into}/${L.need}</em></div></div></div>
    <div class="jwin st-stats"><div>打卡<b>${s.count}</b></div><div>店铺<b>${s.open}/${s.total}</b></div><div>收藏<b>${col.size}</b></div><a href="#/shop" class="st-shop">金币<b>${fmtN(totalCoins())}</b><small>🛒 商店 ›</small></a></div>
    <div class="vl-tabs" id="fpTabs">${tabs.map(([t, n]) => `<button class="chip ${fpTab === t ? 'on' : ''}" data-vt="${t}">${n}</button>`).join('')}</div>
    <div id="fpBody" data-tab="${fpTab}">${body[fpTab]()}</div>
    <div class="section-title">${ic('photo', '🖼️')} 相册 <a href="#/records" style="text-decoration:none">全部记录 ›</a></div>
    ${photos.length ? `<div class="grid3">${photos.map(p => `<img src="${p.photo}" alt="" data-edit="${p.id}">`).join('')}</div>` : `<div class="vl-album-empty">${Array.from({length: 3}, (_, i) => `<span class="vae-slot">${i ? '' : ic('camera', '📷')}</span>`).join('')}<small>相册还空着 · 打卡时拍张照，就会贴在这里</small></div>`}
    ${settingsHtml()}`;
  const paint = () => {
    app.querySelectorAll('canvas[data-item]').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(Valley.itemSprite(cv.dataset.item), 0, 0); });
    app.querySelectorAll('canvas[data-shop]').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(Valley.shop(cv.dataset.shop, v.has(cv.dataset.shop), k.season, false), 0, 0); });
    app.querySelectorAll('[data-vil]').forEach(el => el.appendChild(Valley.portraitEl(villagerOf(el.dataset.vil), 1))); paintBeanSprites(app); };
  paint(); bindQuests();
  const hc = document.createElement('canvas'); hc.width = hc.height = 16; Valley.drawHero(hc, 'down', 0); if (stamina() <= 0) JRPG.tire(hc); $('#stHero').appendChild(JRPG.scaled(hc, 4));
  $('#fpTabs').onclick = e => { const b = e.target.closest('[data-vt]'); if (!b) return; fpTab = b.dataset.vt; SFXplay('blip');
    app.querySelectorAll('#fpTabs .chip').forEach(x => x.classList.toggle('on', x === b)); const fb = $('#fpBody'); fb.dataset.tab = fpTab; fb.innerHTML = body[fpTab](); paint(); bindQuests(); };
  bindSettings();
  app.onclick = e => { const ed = e.target.closest('[data-edit]'); if (ed) openCheckinForm(checkins.find(c => c.id === ed.dataset.edit), false); };
}
function setTop(title, right = '', back = false) {
  $('#title').textContent = title; $('#topRight').innerHTML = right;
  $('#backBtn').classList.toggle('hidden', !back);
  $('#hud').classList.remove('st-peek'); $('#hud').classList.toggle('hidden', back); drawHud();
}
$('#backBtn').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/list');

function render() {
  mapToken++; if (mapRef) { mapRef.remove(); mapRef = null; }
  if (scaTimer) { clearInterval(scaTimer); scaTimer = null; }
  app.classList.remove('full'); app.onclick = null;
  const [, name = 'list', arg] = (location.hash || '#/list').split('/');
  const v = views[name] ? name : 'list';
  if (isR() && $('#rkBar')) $('#rkBar').querySelectorAll('.rk-slot').forEach(a => a.classList.toggle('on', a.dataset.rk === v || (a.dataset.rk === 'beans' && v === 'bean')));
  closeCamMenu();
  document.querySelectorAll('#tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === (['beans', 'bean', 'shop'].includes(v) ? 'footprint' : v)));
  app.dataset.view = v; if (isV()) { app.classList.remove('vt-in'); void app.offsetWidth; app.classList.add('vt-in'); }
  { const ov = $('#npcVisitor'); if (ov) ov.remove(); }
  try { views[v](arg && decodeURIComponent(arg)); }
  catch (e) { console.error('view render failed', e); app.innerHTML = `<div class="card"><b>页面出了点问题 😵</b><div class="hint">${String(e && e.message || e).replace(/[<>&]/g, '')}</div><a class="btn" href="#/list">回到发现页</a></div>`; }
  if (!['cafe', 'add'].includes(v)) window.scrollTo(0, 0);
  if (window.Npc) { try { paintNpc(app); if (v === 'cafe' && arg === 'hash') Npc.flag('hash', today()); if (v === 'map') npcVisitor(); npcSchedule(); } catch (e) { console.warn('npc', e); } }
}
window.addEventListener('hashchange', () => { npcHold = false; closeSheet(); ['eduDlg', 'eduRankUp', 'npcDlg'].forEach(i => { const e = document.getElementById(i); if (e) e.remove(); }); const d = $('#dlg'); if (d && Date.now() - (d._at || 0) > 800) d.classList.remove('show'); render(); });
render();
// quietly fetch location if already permitted (for distances), never prompt on load
if (navigator.permissions) navigator.permissions.query({name: 'geolocation'}).then(p => { if (p.state === 'granted') locate().then(() => render()); }).catch(() => {});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
window.__mcc = {stamina, today, xp: () => totalXP(), badges: () => BADGES.filter(b => b.test(stats())).map(b => b.id), get checkins() { return checkins; }, get beans() { return beans; }, get map() { return mapRef; }, get theme() { return THEME; }, coins: () => totalCoins(), collection: () => [...collection().values()], hearts: heartsOf, quests: () => dailyQuests(), questXP: () => questXP(), earned: () => earnedCoins(), level: () => levelInfo()}; // for testing
window.__appBooted = true; document.documentElement.classList.add('booted');
if (window.PixUI) { try { PixUI.installVars(); if (isV()) PixUI.splash(/[?&]splash\b/.test(location.search), isR() ? 'ranch' : 'valley'); } catch (e) { console.warn('pixui', e); } }
if (isF() && window.FD) { try { FD.splash(/[?&]splash\b/.test(location.search)); } catch (e) { console.warn('fd splash', e); } }
})();
