// 🎭 Hidden NPCs (隐藏角色): original characters who only show up when a condition is met.
// Conditions read only data the app already stores (check-ins with date + createdAt, beans, today's stamina,
// the in-game calendar/weather from festivals.js, coffee-course rank from edu.js) plus two live-only events
// (tapping the title, opening the closed Hash page). State lives in localStorage 'mcc.npc'; nothing else is touched.
(() => {
'use strict';
const SK = 'mcc.npc';
const pad = n => String(n).padStart(2, '0');
let FMT = null;
try { FMT = new Intl.DateTimeFormat('en-US', {timeZone: 'Australia/Melbourne', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23'}); } catch (e) {}
// Melbourne wall-clock parts of a timestamp
function mel(ms) { const d = new Date(ms); if (FMT) { const p = {}; FMT.formatToParts(d).forEach(x => { p[x.type] = x.value; }); return {date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, h: (+p.hour) % 24}; }
  return {date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, h: d.getHours()}; }
const dayOf = c => c.date || (c.createdAt ? mel(c.createdAt).date : '');
// a check-in's real time of day is only known when it was recorded on the day it is dated (not back-filled)
const liveHour = c => { if (!c.createdAt) return null; const m = mel(c.createdAt); return m.date === dayOf(c) ? m.h : null; };
// order matters: 'anaerobic natural' → anaerobic, 'pulped natural' → honey
const PROC = [['anaerobic', /厌氧|anaerobic|carbonic|二氧化碳浸渍|co2/i], ['wethulled', /湿刨|wet[\s-]*hulled|giling/i], ['honey', /蜜|honey|pulped\s*natural/i],
  ['washed', /水洗|washed|wet[\s-]*process/i], ['natural', /日晒|natural|dry[\s-]*process|sun[\s-]*dried/i], ['other', /发酵|ferment|double|thermal|infused/i]];
const procKinds = beans => { const s = new Set(); (beans || []).forEach(b => { const t = String(b.process || ''); if (!t.trim()) return; const hit = PROC.find(([, re]) => re.test(t)); s.add(hit ? hit[0] : 'x:' + t.trim().toLowerCase()); }); return s; };
function longestStreak(dates) { const ds = [...new Set(dates.filter(Boolean))].sort(); let best = 0, run = 0, prev = null;
  ds.forEach(d => { const t = Date.parse(d + 'T00:00:00Z'); run = prev != null && t - prev === 864e5 ? run + 1 : 1; prev = t; best = Math.max(best, run); }); return best; }
const STREAK = 5, REGULAR = 10, PROCS = 3;

// x = {checkins, beans, today, stamina, eduRank, eduMax, fest(date)→[], wx(date)→'rain'|…, flags}
const NPCS = [
  {id: 'tap', name: '叮叮', role: '标题里的小精灵', ease: 'easy', retro: false, c: 30,
    hint: '标题后面，好像藏着什么……多敲几下试试？', how: '在开场标题或顶部标题上快速连点 5 下',
    test: x => !!x.flags.tap,
    lines: ['叮！被你敲出来啦！', '我一直住在标题的笔画里，看着大家打开小镇、出门喝咖啡。', '很少有人会对着标题敲这么多下……你一定是个好奇心很重的人。', '小镇里还有好几位不常露面的家伙。去找找他们吧，我会在图鉴里给你留位置！']},
  {id: 'hash', name: '小灯', role: '熄灯后的前咖啡师', ease: 'easy', retro: false, c: 60, note: '虚构角色，与这家店真实的员工无关',
    hint: '一家已经熄了灯的店，门口偶尔还站着一个人影。', how: '打开已关店的 Hash Specialty Coffee 的店铺页面',
    test: x => !!x.flags.hash,
    lines: ['……啊，吓到你了吗？我只是路过，顺便回来看看。', '我叫小灯。在小镇的故事里，我曾经在这样的街角小店做咖啡。', '店会关，招牌会换，可是有人记得那杯饮料的味道，它就还在。', '谢谢你还会点进来看一眼。下次在别的店喝到让你开心的一杯，替我也开心一下吧。']},
  {id: 'rain', name: '阿霖', role: '雨伞修理匠', ease: 'easy', retro: true, c: 80,
    hint: '雨天的屋檐下，好像有人在修什么东西。', how: '在小镇天气为「🌧️ 小雨」的日子打卡（小镇天气是游戏里的，不是真实天气预报）',
    test: x => x.checkins.some(c => x.wx(dayOf(c)) === 'rain'),
    lines: ['哟，下雨天还出门喝咖啡？我喜欢你这股劲儿。', '我叫阿霖，专修雨伞。伞骨断了、伞面破了，拿来给我就行。', '雨天的咖啡馆特别安静，窗玻璃上全是水珠，适合慢慢喝完一杯。', '这把小伞的零钱你收着吧——算是我请你下一杯。']},
  {id: 'dawn', name: '阿朝', role: '晨光豆差（送豆员）', ease: 'mid', retro: true, c: 80,
    hint: '天还没亮透的时候，街角有车铃声经过……', how: '早上 4:00–6:59（墨尔本时间）当场打卡（补录到以前日期的不算）',
    test: x => x.checkins.some(c => { const h = liveHour(c); return h != null && h >= 4 && h < 7; }),
    lines: ['叮铃——早！这么早就出门，你也是早起派？', '我是阿朝，每天天没亮就骑车把刚烘好的豆子送到各家店。', '很多咖啡馆开门前就得先校准磨豆机、试几杯浓缩，等第一批客人来。', '你是我今天遇到的第一位客人！这份早起奖励给你，我得赶下一站了！']},
  {id: 'fest', name: '彩彩', role: '节庆旅人', ease: 'mid', retro: true, c: 120, item: 'bunting',
    hint: '只在小镇过节的日子出现，背着一大串彩旗。', how: '在维州公众假期或小镇日历里的节庆当天打开小镇（以前在节日当天打过卡也算）',
    test: x => !!(x.fest(x.today) || []).length || x.checkins.some(c => (x.fest(dayOf(c)) || []).length),
    lines: ['嘿嘿，{fest}快乐！我是彩彩，哪里过节我就往哪里跑。', '节日那天街上的人特别多，有的店会换营业时间，出门前最好先看一眼。', '我旅行背包里最重的东西，就是这一串彩旗。', '送你一串，挂在小镇里吧！下次过节，我们再见。']},
  {id: 'sleepy', name: '豆皮', role: '打盹的橘猫', ease: 'mid', retro: false, c: 60,
    hint: '累到走不动的时候，会有谁陪你打个盹。', how: '某一天的体力降到 0（一天打卡 5 次）',
    test: x => x.stamina <= 0,
    lines: ['喵……（一只橘猫在你脚边蜷成一团）', '它打了个哈欠，好像在说：今天的咖啡已经够多啦。', '喵～（它用尾巴拍拍你，示意你也坐下来歇一会儿）', '小纸条挂在它的项圈上：「多喝水，早点睡。——豆皮」']},
  {id: 'streak', name: '周周', role: '晨报邮差', ease: 'long', retro: true, c: 150,
    hint: '每天都出门的人，才会收到他的信。', how: `连续 ${STREAK} 天每天至少打卡 1 次（按墨尔本日期）`,
    test: x => longestStreak(x.checkins.map(dayOf)) >= STREAK,
    lines: ['你好，有你的信！是从「每天都来」那里寄来的。', `我是邮差周周。我的规矩是：连续 ${STREAK} 天都出门的人，才会收到这封信。`, '信里只有一句话：「习惯不是一天养成的，可你已经走了好多天。」', '奖励夹在信封里了。明天也要好好出门哦！']},
  {id: 'beans', name: '卡妮', role: '豆袋行商', ease: 'long', retro: true, c: 150,
    hint: '她只和见识过好几种处理法的人做生意。', how: `豆子图鉴里存了至少 ${PROCS} 种不同处理法的豆子（如水洗、日晒、蜜处理、厌氧）`,
    test: x => procKinds(x.beans).size >= PROCS,
    lines: ['嗯？你的豆袋子里，水洗、日晒、蜜处理……不少嘛。', '我是行商卡妮，背着豆袋走过很多城市。', '同一个产区的豆子，换一种处理法，喝起来就可能像换了一家店。', '你是懂行的人。这些金币是跟你交换见闻的谢礼。']},
  {id: 'regular', name: '常伯', role: '窗边的老顾客', ease: 'long', retro: true, c: 200,
    hint: '在同一家店坐得够久，就会注意到窗边那位。', how: `在同一家店打卡 ${REGULAR} 次（和咖啡师好感满 ${REGULAR} ❤）`,
    test: x => { const m = {}; let best = 0; x.checkins.forEach(c => { if (c.cafeId) best = Math.max(best, m[c.cafeId] = (m[c.cafeId] || 0) + 1); }); return best >= REGULAR; },
    lines: ['（窗边那位老先生朝你点点头）原来是你啊，常来的那位。', '我叫常伯，在这张桌子坐了不知道多少个早上。', '咖啡师记住你的口味，不是因为本子上写着，是因为你一次又一次地来。', '这点心意你收下。以后在这家店，我们就是邻座了。']},
  {id: 'master', name: '白先生', role: '神秘的老咖啡师', ease: 'long', retro: true, c: 300, item: 'oldapron',
    hint: '听说学完所有咖啡课的人，会遇见一位老前辈。', how: '完成「咖啡课」主线全部 8 章（成为咖啡大师）',
    test: x => x.eduMax > 0 && x.eduRank >= x.eduMax,
    lines: ['（门口的风铃响了，一位白胡子老人慢慢走进来）', '老焙跟我提起过你。从认豆子到杯测，你一章一章都走完了。', '当咖啡大师没有终点：味觉会变，豆子每一季也不一样。', '这件旧帆布围裙跟了我很多年，现在交给你。', '记住：好好喝，好好记，好好分享。我们后会有期。']},
];
const byId = id => NPCS.find(n => n.id === id);
// ---------- state ----------
function load() { let s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {} s = s && typeof s === 'object' ? s : {};
  return {met: s.met && typeof s.met === 'object' ? s.met : {}, flags: s.flags && typeof s.flags === 'object' ? s.flags : {}}; }
let S = load();
const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };
const met = id => !!S.met[id];
const flag = (k, d) => { if (S.flags[k]) return false; S.flags[k] = d || true; save(); return true; };
// which hidden NPCs qualify right now but haven't been met (in roster order: easy ones first)
function pending(x) { const ctx = {...x, flags: S.flags}; return NPCS.filter(n => !met(n.id) && (() => { try { return !!n.test(ctx); } catch (e) { return false; } })()).map(n => n.id); }
function meet(id, d, extra) { if (!byId(id) || met(id)) return false; S.met[id] = {d, at: Date.now(), ...(extra || {})}; save(); return true; }
const count = () => NPCS.filter(n => met(n.id)).length;
const reset = () => { S = {met: {}, flags: {}}; save(); };

// ---------- 🎨 original pixel portraits (32×32, drawn in code) ----------
const OUT = '#3a2414';
function base(P, o) { // shared head/body: o = {sk, hair, shirt, apron, bald, beard, glasses, eyesClosed}
  P.ell(16, 33, 13, 9, o.shirt); if (o.apron) { P.rect(10, 25, 12, 7, o.apron); P.rect(10, 24, 2, 2, o.apron); P.rect(20, 24, 2, 2, o.apron); }
  P.rect(14, 19, 4, 5, o.skD); P.ell(16, 13, 7.5, 8, o.sk); P.rect(8, 13, 1, 3, o.sk); P.rect(23, 13, 1, 3, o.sk);
  if (o.hair && !o.bald) { P.ell(16, 7, 8.2, 4.8, o.hair); P.rect(8, 7, 2, 6, o.hair); P.rect(22, 7, 2, 6, o.hair); P.rect(10, 9, 12, 2, o.hair); }
  if (o.bald) { P.rect(8, 9, 2, 5, o.hair); P.rect(22, 9, 2, 5, o.hair); }
  if (o.eyesClosed) { P.rect(11, 15, 3, 1, '#2a1a10'); P.rect(18, 15, 3, 1, '#2a1a10'); }
  else { P.rect(12, 14, 2, 2, '#2a1a10'); P.rect(18, 14, 2, 2, '#2a1a10'); P.set(12, 14, '#fff'); P.set(18, 14, '#fff'); }
  P.rect(11, 12, 3, 1, o.brow || '#3a2418'); P.rect(18, 12, 3, 1, o.brow || '#3a2418');
  if (o.glasses) { [[10, 13], [17, 13]].forEach(([x, y]) => { P.rect(x, y, 5, 1, '#3a2a20'); P.rect(x, y + 3, 5, 1, '#3a2a20'); P.rect(x, y, 1, 4, '#3a2a20'); P.rect(x + 4, y, 1, 4, '#3a2a20'); }); P.rect(15, 14, 2, 1, '#3a2a20'); }
  if (o.beard) { P.ell(16, 21, 6.5, 4.5, o.beard); P.rect(10, 16, 1, 4, o.beard); P.rect(21, 16, 1, 4, o.beard); P.rect(14, 18, 4, 1, o.beard); }
  else { P.set(14, 18, '#8a3a2a'); P.rect(15, 19, 2, 1, '#8a3a2a'); P.set(17, 18, '#8a3a2a'); }
  P.rect(10, 17, 2, 1, '#f29a9a'); P.rect(20, 17, 2, 1, '#f29a9a'); }
const SK1 = ['#f7d2b0', '#e0ad86'], SK2 = ['#d9a070', '#b87e52'], SK3 = ['#f0c39a', '#d49c72'], SK4 = ['#8a5a3c', '#6c4128'];
const ART = {
  tap(P) { P.ell(16, 18, 9, 9, '#ffe9a0'); P.ell(16, 18, 7, 7, '#fff6c8'); P.rect(15, 4, 2, 6, '#c9a0f0'); P.ell(16, 4, 2.5, 2.5, '#f5c542'); P.set(16, 3, '#fff');
    P.rect(12, 17, 2, 2, '#2a1a10'); P.rect(18, 17, 2, 2, '#2a1a10'); P.set(12, 17, '#fff'); P.set(18, 17, '#fff'); P.rect(15, 21, 2, 1, '#c0603a'); P.rect(10, 20, 2, 1, '#f29a9a'); P.rect(20, 20, 2, 1, '#f29a9a');
    [[5, 9], [26, 8], [4, 24], [27, 25], [9, 4]].forEach(([x, y]) => { P.set(x, y, '#f5c542'); P.set(x + 1, y, '#fff3a0'); P.set(x, y + 1, '#fff3a0'); }); },
  hash(P) { base(P, {sk: '#e8dcd0', skD: '#c8b8a8', hair: '#6a6a80', shirt: '#7a8aa8', apron: '#4a4a5e', brow: '#5a5a70'}); P.rect(24, 20, 5, 6, '#ffd56b'); P.rect(25, 18, 3, 2, '#5a5a70'); P.rect(25, 21, 3, 4, '#fff3b8'); P.rect(26, 26, 1, 3, '#5a5a70'); },
  rain(P) { base(P, {sk: SK3[0], skD: SK3[1], hair: '#3a2418', shirt: '#f0c030'}); P.ell(16, 6, 9.5, 5.5, '#f0c030'); P.rect(6, 6, 3, 10, '#f0c030'); P.rect(23, 6, 3, 10, '#f0c030'); P.rect(9, 9, 14, 1, '#d09a10');
    P.rect(2, 2, 7, 1, '#4f86c6'); P.rect(1, 3, 9, 1, '#4f86c6'); P.rect(5, 4, 1, 12, '#5a3a20'); [[12, 0], [28, 4], [27, 12]].forEach(([x, y]) => { P.set(x, y, '#8fd2f2'); P.set(x, y + 1, '#8fd2f2'); }); },
  dawn(P) { base(P, {sk: SK2[0], skD: SK2[1], hair: '#2a2a3a', shirt: '#e8803a'}); P.ell(16, 7, 8.6, 4.6, '#3f8f6a'); P.rect(7, 9, 12, 2, '#2f6a50'); P.rect(18, 10, 8, 1, '#2f6a50');
    P.rect(8, 25, 2, 7, '#7a4a25'); P.rect(20, 24, 9, 7, '#a8693a'); P.rect(20, 24, 9, 1, '#c98f55'); P.rect(23, 27, 3, 2, '#5a3418'); },
  fest(P) { base(P, {sk: SK1[0], skD: SK1[1], hair: '#d07090', shirt: '#5ab0b0'}); for (let i = 0; i < 6; i++) P.rect(13 + (i > 2 ? 0 : 0), 0 + i, 6 - i, 1, ['#e8403a', '#ffd23f', '#4f86c6', '#e8403a', '#ffd23f', '#4f86c6'][i]);
    P.rect(12, 5, 8, 1, '#ffd23f'); [[3, 6, '#e8403a'], [6, 4, '#ffd23f'], [26, 5, '#4f86c6'], [28, 9, '#e8403a'], [3, 12, '#7ab55c']].forEach(([x, y, c]) => { P.set(x, y, c); P.set(x + 1, y + 1, c); });
    P.rect(1, 22, 30, 1, '#7a4a25'); [[2, '#e8403a'], [8, '#ffd23f'], [20, '#4f86c6'], [26, '#7ab55c']].forEach(([x, c]) => { P.rect(x, 23, 4, 2, c); P.rect(x + 1, 25, 2, 1, c); }); },
  sleepy(P) { const f = '#f0a040', d = '#c87a20'; P.ell(16, 24, 12, 7, f); P.ell(16, 15, 9, 7.5, f); [[8, 6], [20, 6]].forEach(([x, y]) => { P.rect(x, y + 3, 4, 3, f); P.rect(x + 1, y + 1, 2, 2, f); P.set(x + 1, y + 4, '#f8b8b0'); P.set(x + 2, y + 4, '#f8b8b0'); });
    [[10, 11], [21, 11]].forEach(([x, y]) => P.rect(x, y, 2, 1, d)); P.rect(14, 9, 4, 1, d); P.rect(11, 15, 3, 1, '#2a1a10'); P.rect(18, 15, 3, 1, '#2a1a10'); P.set(16, 17, '#e87a8a'); P.rect(15, 18, 1, 1, '#8a3a2a'); P.rect(17, 18, 1, 1, '#8a3a2a');
    P.rect(4, 26, 6, 2, f); P.rect(3, 24, 2, 3, f); P.rect(10, 22, 12, 2, d); P.rect(25, 3, 3, 1, '#4f86c6'); P.set(27, 4, '#4f86c6'); P.rect(25, 5, 3, 1, '#4f86c6'); P.rect(29, 0, 2, 1, '#4f86c6'); P.set(30, 1, '#4f86c6'); P.rect(29, 2, 2, 1, '#4f86c6'); },
  streak(P) { base(P, {sk: SK4[0], skD: SK4[1], hair: '#16161f', shirt: '#2f4a8a'}); P.ell(16, 6.5, 8.6, 4.2, '#2f4a8a'); P.rect(7, 8, 18, 2, '#1f3266'); P.rect(15, 4, 2, 2, '#f5c542');
    P.rect(19, 25, 10, 6, '#fff8e8'); P.rect(19, 25, 10, 1, '#d8ccb8'); for (let i = 0; i < 5; i++) { P.set(19 + i, 26 + i, '#c8b8a0'); P.set(28 - i, 26 + i, '#c8b8a0'); } P.rect(23, 28, 2, 2, '#e8403a'); },
  beans(P) { base(P, {sk: SK2[0], skD: SK2[1], hair: '#5a3418', shirt: '#8a6ac0'}); P.ell(16, 6, 9, 5, '#c05a3a'); P.rect(7, 8, 18, 3, '#c05a3a'); [[10, 6], [15, 4], [20, 7]].forEach(([x, y]) => P.set(x, y, '#ffd23f'));
    P.ell(25, 26, 6, 5.5, '#c8a878'); P.rect(22, 20, 6, 2, '#a88858'); P.rect(23, 25, 4, 1, '#7a5a30'); [[23, 28], [26, 27], [25, 30]].forEach(([x, y]) => { P.set(x, y, '#6b3f1d'); P.set(x + 1, y, '#4a2a10'); }); },
  regular(P) { base(P, {sk: SK1[0], skD: SK1[1], hair: '#d8d0c8', shirt: '#6a7a5a', bald: true, glasses: true, brow: '#b8b0a8'}); P.rect(9, 5, 14, 1, '#f0d8c0');
    P.rect(1, 23, 11, 8, '#f0ede0'); P.rect(2, 24, 9, 1, '#8a8a8a'); P.rect(2, 26, 7, 1, '#b0b0b0'); P.rect(2, 28, 8, 1, '#b0b0b0'); P.rect(24, 26, 6, 5, '#fff8e8'); P.rect(25, 26, 4, 1, '#6b3f1d'); P.rect(30, 27, 1, 2, '#fff8e8'); },
  master(P) { base(P, {sk: SK3[0], skD: SK3[1], hair: '#f4f0ea', shirt: '#e8e2d8', apron: '#2f5a3a', beard: '#f4f0ea', glasses: true, brow: '#e0dcd4'}); P.ell(16, 5.5, 8, 3.5, '#f4f0ea'); P.rect(7, 7, 2, 8, '#f4f0ea'); P.rect(23, 7, 2, 8, '#f4f0ea');
    P.rect(14, 27, 4, 3, '#fff8e8'); P.rect(15, 28, 2, 1, '#8a5a33'); P.set(4, 4, '#f5c542'); P.set(27, 6, '#f5c542'); },
};
const BG = {tap: '#3a3060', hash: '#2c3448', rain: '#9cc8e0', dawn: '#ffc89a', fest: '#ffe0f0', sleepy: '#f4e0b0', streak: '#c8d8f0', beans: '#e8d0b0', regular: '#d8e4c8', master: '#e8e0f0'};
const artCache = {};
function portrait(id) { if (artCache[id]) return artCache[id]; const V = window.Valley; if (!V || !V.Pix || !ART[id]) return null;
  const P = V.Pix(32, 32); ART[id](P); P.outline(OUT); return (artCache[id] = P.canvas()); }
// silhouette: same outline filled with one ink colour (the codex '?' card)
function silhouette(id) { const k = id + ':s'; if (artCache[k]) return artCache[k]; const src = portrait(id); if (!src) return null;
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2b2233'; g.fillRect(0, 0, 32, 32); return (artCache[k] = c); }
function scaled(src, s) { if (window.JRPG && JRPG.scaled) return JRPG.scaled(src, s); const c = document.createElement('canvas'); c.width = src.width * s; c.height = src.height * s; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height); return c; }

window.Npc = {NPCS, byId, pending, meet, met, flag, count, reset, reload() { S = load(); }, get state() { return S; }, portrait, silhouette, scaled, BG,
  _t: {mel, dayOf, liveHour, procKinds, longestStreak, STREAK, REGULAR, PROCS}};
})();
