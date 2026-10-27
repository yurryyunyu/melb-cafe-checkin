// 🏮 老焙的小铺 (idle roastery): production is computed from timestamps when you come back — nothing runs in the background.
// State in localStorage 'mcc.idle' (additive; nothing else is touched). The app feeds in context (live check-in times, met hidden characters, story progress).
// Numbers (documented in README): base 1.0 🪙/h + stations; offline cap 12 h (+2 h per 仓库 level, max 24 h); each real check-in = +50% for 6 h (stacks to ×3);
// 学徒 +6% each (4), 帮手 +2% each (met hidden characters, 白先生 +5%), 旧物 +1% each (12), 主线 +2% per chapter (≤ +20%).
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.idle', H = 3600000;
const BASE_C = 1.0, CAP_H = 12, BOOST = 0.5, BOOST_H = 6, BOOST_N = 4, DAILY_TRIPS = 3;
// stations: cost to go from level L to L+1 = round(c0 · g^max(0,L−1)); beans (生豆) are needed too for the two top stations (≈ coin cost / 30)
const STATIONS = [
 {id: 'roaster', name: '烘豆机', ic: '🔥', sp: 0, c0: 50, g: 1.35, a: 0.8, b: 0.6, max: 6, start: 1, desc: '老焙的老伙计，烘得慢，烘得香。', bean: 0},
 {id: 'grinder', name: '磨豆机', ic: '⚙️', sp: 1, c0: 200, g: 1.38, a: 0.7, b: 0, max: 5, start: 0, desc: '手摇变电动，客人排队也不慌。', bean: 0},
 {id: 'espresso', name: '意式咖啡机', ic: '☕', sp: 2, c0: 600, g: 1.42, a: 0.9, b: 0, max: 4, start: 0, desc: '九个大气压，一杯一杯地卖。', bean: 1},
 {id: 'pour', name: '手冲吧台', ic: '🫖', sp: 3, c0: 1500, g: 1.48, a: 1.4, b: 0.3, max: 3, start: 0, desc: '慢慢来的客人，付得起慢慢来的价钱。', bean: 1},
];
const STORE = {id: 'store', name: '仓库', ic: '📦', sp: 4, c0: 200, g: 1.7, max: 6, add: 2, desc: '多存几个小时的货，离开得再久也不浪费。'};
const APPR = [{name: '小豆', cost: 400}, {name: '阿满', cost: 1000}, {name: '铁牛', cost: 2400}, {name: '青禾', cost: 5600}];
const APPR_B = 0.06, HELP_B = 0.02, RELIC_B = 0.01, STORY_B = 0.02;
const HELPERS = {tap: ['叮叮', '打烊后替你敲一敲灶台。'], hash: ['小灯', '夜里替你守着炉火。'], rain: ['阿霖', '下雨天，伞和豆袋都替你收好。'], dawn: ['阿朝', '天亮前的第一锅，由他来烘。'], fest: ['彩彩', '节日一到，铺子挂满彩旗。'], sleepy: ['豆皮', '趴在豆袋上，把豆子焐得暖暖的。'],
  streak: ['周周', '一天不落地开门。'], beans: ['卡妮', '挑豆子最在行（生豆 +10%）。'], regular: ['常伯', '老主顾都由他来招呼。'], master: ['白先生', '老友的铺子，顺手照看（帮手加成 +5%）。']};
const RELICS = [
 {id: 'r1', name: '锈铜铃', lore: '挂在豆驮子上的铃，响过三千里路。', pool: [0]},
 {id: 'r2', name: '缺口陶杯', lore: '林最爱的杯子，缺口正好贴着嘴唇。', pool: [0, 1]},
 {id: 'r3', name: '褪色的账本', lore: '「第一颗」开张头三天的流水：一共卖出九杯。', pool: [0, 1]},
 {id: 'r4', name: '半截蜡烛', lore: '烘豆房熬夜时点的，蜡泪里嵌着一粒焦豆。', pool: [0, 1]},
 {id: 'r5', name: '渡口船票', lore: '去往河对岸的一张旧船票，没有日期。', pool: [1]},
 {id: 'r6', name: '竹编豆筛', lore: '筛过的每一粒豆子，都被人认真看过一眼。', pool: [1]},
 {id: 'r7', name: '铁勺', lore: '勺柄上刻着一个小小的「焙」字。', pool: [1, 2]},
 {id: 'r8', name: '旧电车票', lore: '叮叮车的纸票，背面写着：明天见。', pool: [1, 2]},
 {id: 'r9', name: '茶壶装的酒', lore: '老焙说是酒，其实一直是茶。', pool: [2]},
 {id: 'r10', name: '干金合欢', lore: '压在书页里的一小枝，香味还没散尽。', pool: [2]},
 {id: 'r11', name: '斗笠碎篾', lore: '斗笠边上掉下的一小片竹篾，还带着雨的味道。', pool: [2]},
 {id: 'r12', name: '林的钢笔', lore: '笔尖磨得很秃，写满了一整本别人的名字。', pool: [2]},
];
const DESTS = [
 {id: 'lane', name: '巷口转转', ic: '🏮', min: 30, beans: 5, c: [10, 20], gb: [2, 4], rel: 0.12, bonus: 20},
 {id: 'ferry', name: '渡口与集市', ic: '⛵', min: 120, beans: 15, c: [40, 70], gb: [8, 14], rel: 0.3, bonus: 60},
 {id: 'pass', name: '远山古道', ic: '⛰️', min: 360, beans: 40, c: [140, 200], gb: [24, 36], rel: 0.6, bonus: 150},
];
const SNIP = [
 ['{who}在巷口转了一圈，看见一只橘猫蹲在咖啡店的招牌下，像在站岗。', '{who}在巷子深处听见有人议论一个黑长衫的人——这几天，他到处打听旧店的事。', '{who}在巷口捡到一张被雨淋湿的传单：「远焙 · 新店开张，前一百位客人免费。」', '{who}在巷口站了一会儿。门板都关着，可你好像还听得见熟悉的叮当声——那是回忆里的声音。'],
 ['{who}在渡口集市上换到一小袋不知名的豆子。卖豆的老伯说：豆子比人记得路。', '{who}在集市上看见几个生面孔在收购旧咖啡器具，出价高得有些不正常。', '{who}听见船夫哼着一首关于「负豆客」的老调子：「背着三千里，换你一杯茶。」', '{who}在渡口坐了一下午。江面上，有一艘空船在慢慢漂。你想起有人说过：船总会靠岸。'],
 ['{who}走到山路尽头，一座小小的茶亭里，挂着一盏褪了色的灯笼。', '{who}在古道的石碑下，看到一行新刻的字痕：「簿子在人，不在页。」不知是谁留下的。', '{who}在山顶的风里坐了很久，想到有些话，三十年没人敢说，却被一杯咖啡轻轻说完了。', '{who}走到古道尽头，那座茶亭还在。亭里空空的，石桌上放着一只干干净净的杯子。'],
];

const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
const nn = (v, lo = 0, hi = 1e15) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : 0));
function norm(s) { s = obj(s); const lv = obj(s.lv), L = {};
  STATIONS.forEach(t => { L[t.id] = Math.floor(nn(lv[t.id] == null ? t.start : lv[t.id], 0, t.max)); }); L.store = Math.floor(nn(lv.store, 0, STORE.max));
  const e = obj(s.exp), c = e.cur && typeof e.cur === 'object' ? e.cur : null;
  return {v: 1, lv: L, app: Math.floor(nn(s.app, 0, APPR.length)), last: s.last == null ? null : nn(s.last), h: nn(s.h, 0, 48), bank: {c: nn(obj(s.bank).c), b: nn(obj(s.bank).b)}, seen: nn(s.seen),
    coins: Math.floor(nn(s.coins)), spent: Math.floor(nn(s.spent)), beans: Math.floor(nn(s.beans)), relics: {...obj(s.relics)}, trips: Math.floor(nn(s.trips)),
    exp: {cur: c && Number.isInteger(c.d) && DESTS[c.d] ? {d: c.d, by: c.by === 'you' ? 'you' : 'laobei', start: nn(c.start), end: nn(c.end), seed: nn(c.seed, 0, 4294967295)} : null, day: String(e.day || ''), n: Math.floor(nn(e.n, 0, 99)), log: Array.isArray(e.log) ? e.log.slice(-6) : []}};
}
function load() { try { return norm(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return norm(null); } }
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let ctxFn = () => ({live: [], met: [], chapters: 0, cur: 0, today: ''});
const C = x => ({live: [], met: [], chapters: 0, cur: 0, today: '', ...(x || ctxFn() || {})});

const lvl = id => S.lv[id] || 0;
const capH = () => CAP_H + STORE.add * lvl('store');
const relicN = () => Object.keys(S.relics).length;
function mult(x) { x = C(x); const met = x.met.filter(id => HELPERS[id]);
  const help = met.reduce((s, id) => s + (id === 'master' ? 0.05 : HELP_B), 0);
  return {app: APPR_B * S.app, help, relic: RELIC_B * relicN(), story: STORY_B * Math.min(10, x.chapters), met: met.length,
    total: 1 + APPR_B * S.app + help + RELIC_B * relicN() + STORY_B * Math.min(10, x.chapters), beanExtra: met.includes('beans') ? 0.1 : 0}; }
function rates(x) { const m = mult(x); let c = BASE_C, b = 0;
  STATIONS.forEach(t => { c += t.a * lvl(t.id); b += t.b * lvl(t.id); });
  return {c: c * m.total, b: b * (m.total + m.beanExtra), base: c, baseB: b, m}; }
// Σ over [from,to] of (1 + 0.5 × active live check-ins (max 4)) dt in hours
function integral(from, to, live) { const pts = [from, to];
  live.forEach(t => { if (t > from && t < to) pts.push(t); const e = t + BOOST_H * H; if (e > from && e < to) pts.push(e); });
  pts.sort((a, b) => a - b); let sum = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (b <= a) continue; const mid = (a + b) / 2; let n = 0; live.forEach(t => { if (t <= mid && mid < t + BOOST_H * H) n++; }); sum += (b - a) / H * (1 + BOOST * Math.min(BOOST_N, n)); }
  return sum; }
function boostAt(t, x) { x = C(x); let n = 0, end = 0; x.live.forEach(c => { if (c <= t && t < c + BOOST_H * H) { n++; end = Math.max(end, c + BOOST_H * H); } }); return {n: Math.min(BOOST_N, n), mult: 1 + BOOST * Math.min(BOOST_N, n), left: n ? end - t : 0}; }
function accr(now, x) { if (S.last == null) return {c: 0, b: 0, h: 0, capped: false};
  const dt = Math.max(0, (now - S.last) / H), allow = Math.max(0, capH() - S.h), use = Math.min(dt, allow), r = rates(x);
  const w = use > 0 ? integral(S.last, S.last + use * H, C(x).live) : 0; return {c: r.c * w, b: r.b * w, h: use, capped: dt > allow + 1e-9}; }
function sync(now) { if (S.last == null) { S.last = now; S.seen = S.seen || now; save(); } return S; }
function pending(now, x) { sync(now); const a = accr(now, x), c = S.bank.c + a.c, b = S.bank.b + a.b, h = S.h + a.h;
  return {c: Math.floor(c), b: Math.floor(b), cf: c, bf: b, hours: h, capH: capH(), full: h >= capH() - 1e-9, capped: a.capped || h >= capH() - 1e-9}; }
// moves the accrued production into the bank (used before any change that alters the rate, so upgrades never act retroactively)
function settle(now, x) { sync(now); const a = accr(now, x); S.bank.c += a.c; S.bank.b += a.b; S.h = Math.min(capH(), S.h + a.h); S.last = now; }
function collect(now, x) { settle(now, x); const c = Math.floor(S.bank.c), b = Math.floor(S.bank.b), h = S.h;
  S.bank.c -= c; S.bank.b -= b; S.coins += c; S.beans += b; S.h = 0; S.last = now; S.seen = now; save(); return {c, b, hours: h}; }
const stationCost = (id, L) => { const t = id === 'store' ? STORE : STATIONS.find(q => q.id === id); L = L == null ? lvl(id) : L; return Math.round(t.c0 * Math.pow(t.g, Math.max(0, L - 1))); };
function cost(id) { const t = id === 'store' ? STORE : STATIONS.find(q => q.id === id); if (!t) return null; const L = lvl(id), full = L >= t.max, c = full ? 0 : stationCost(id, L);
  return {id, lv: L, max: t.max, full, c, b: !full && t.bean ? Math.round(c / 30) : 0}; }
function upgrade(id, purse, now, x) { const k = cost(id); if (!k) return {ok: false, why: 'unknown'}; if (k.full) return {ok: false, why: 'max'};
  if (purse < k.c) return {ok: false, why: 'coins'}; if (S.beans < k.b) return {ok: false, why: 'beans'};
  settle(now, x); S.spent += k.c; S.beans -= k.b; S.lv[id] = k.lv + 1; save(); return {ok: true, cost: k, lv: S.lv[id]}; }
function hireCost() { return S.app >= APPR.length ? null : APPR[S.app].cost; }
function hire(purse, now, x) { const c = hireCost(); if (c == null) return {ok: false, why: 'max'}; if (purse < c) return {ok: false, why: 'coins'}; settle(now, x); S.spent += c; S.app++; save(); return {ok: true, cost: c, name: APPR[S.app - 1].name}; }
const spendBeans = n => { if (S.beans < n) return false; S.beans -= n; save(); return true; };

// ---------- 出门游历 (expeditions) ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tripsToday(x) { x = C(x); return S.exp.day === x.today ? S.exp.n : 0; }
function canGo(d, by, now, x) { const D = DESTS[d]; if (!D) return {ok: false, why: 'unknown'}; if (S.exp.cur) return {ok: false, why: 'busy'};
  if (tripsToday(x) >= DAILY_TRIPS) return {ok: false, why: 'daily'}; if (S.beans < D.beans) return {ok: false, why: 'beans'}; return {ok: true}; }
function go(d, by, now, x) { const g = canGo(d, by, now, x); if (!g.ok) return g; const D = DESTS[d], t = C(x).today;
  S.beans -= D.beans; S.exp.day = t; S.exp.n = tripsToday(x) + 1; S.trips++; S.exp.cur = {d, by: by === 'you' ? 'you' : 'laobei', start: now, end: now + D.min * 60000, seed: (Math.floor(now / 1000) ^ (S.trips * 2654435761)) >>> 0}; save(); return {ok: true, end: S.exp.cur.end}; }
function expInfo(now) { const c = S.exp.cur; if (!c) return null; return {...c, dest: DESTS[c.d], left: Math.max(0, c.end - now), done: now >= c.end, pct: Math.min(1, (now - c.start) / (c.end - c.start))}; }
const stageOf = x => { const cur = C(x).cur; return cur <= 3 ? 0 : cur <= 6 ? 1 : cur <= 9 ? 2 : 3; };
function claimExp(now, x) { const c = S.exp.cur; if (!c || now < c.end) return null; const D = DESTS[c.d], r = rng(c.seed), by = c.by;
  const coins = Math.round((D.c[0] + r() * (D.c[1] - D.c[0])) * (by === 'you' ? 1.25 : 1)), beans = Math.round((D.gb[0] + r() * (D.gb[1] - D.gb[0])) * (by === 'laobei' ? 1.2 : 1));
  const pool = RELICS.filter(q => q.pool.includes(c.d) && !S.relics[q.id]); let relic = null, bonus = 0;
  if (r() < D.rel * (by === 'laobei' ? 1.3 : 1)) { if (pool.length) relic = pool[Math.floor(r() * pool.length)]; else bonus = D.bonus; }
  if (relic) S.relics[relic.id] = now;
  const snippet = SNIP[c.d][stageOf(x)].replace('{who}', by === 'you' ? '你' : '老焙');
  S.coins += coins + bonus; S.beans += beans; S.exp.cur = null; S.exp.log.push({d: c.d, by, c: coins + bonus, b: beans, relic: relic ? relic.id : '', at: now}); S.exp.log = S.exp.log.slice(-6); save();
  return {dest: D, by, c: coins + bonus, b: beans, relic, bonus, snippet}; }

// ---------- away summary (for the “你不在时…” popup) ----------
function away(now, x) { sync(now); const p = pending(now, x), mins = Math.max(0, (now - (S.seen || S.last)) / 60000); const e = expInfo(now); return {mins, c: p.c, b: p.b, hours: p.hours, capped: p.capped, capH: p.capH, exp: e && e.done ? e : null}; }
const touch = now => { S.seen = now; save(); };
const reset = () => { S = norm(null); save(); };

const Idle = {STATIONS, STORE, APPR, HELPERS, RELICS, DESTS, SNIP, CFG: {BASE_C, CAP_H, BOOST, BOOST_H, BOOST_N, DAILY_TRIPS, APPR_B, HELP_B, RELIC_B, STORY_B}, lvl, capH, mult, rates, integral, boostAt, sync, pending, settle, collect, cost, upgrade, hireCost, hire, spendBeans, canGo, go, expInfo, claimExp, tripsToday, stageOf, away, touch, rng,
  coinsIn: () => S.coins, coinsOut: () => S.spent, beans: () => S.beans, relics: () => ({...S.relics}), reset, reload() { S = load(); },
  setCtx(f) { ctxFn = f; }, get state() { return S; }};
root.Idle = Idle;
if (typeof module !== 'undefined') module.exports = Idle;
})();
