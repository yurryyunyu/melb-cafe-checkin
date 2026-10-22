// 🎉 Australian / Victorian festival calendar + in-game town weather. Pure date maths, no network.
// Public holidays follow the Victorian Public Holidays Act rules as published by Business Victoria
// (business.vic.gov.au/business-information/public-holidays). Events are only listed where dates are
// published or follow a stated rule; anything estimated is flagged approx:true and labelled 约.
(() => {
'use strict';
const pad = n => String(n).padStart(2, '0'), iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const dow = (y, m, d) => D(y, m, d).getUTCDay(); // 0 Sun … 6 Sat
const addDays = (y, m, d, k) => { const t = D(y, m, d + k); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
const nthDow = (y, m, wd, n) => 1 + ((wd - dow(y, m, 1) + 7) % 7) + 7 * (n - 1);
const lastDow = (y, m, wd) => { const L = D(y, m + 1, 0).getUTCDate(); return L - ((dow(y, m, L) - wd + 7) % 7); };
// Easter Sunday, Gregorian calendar (anonymous / Meeus–Jones–Butcher algorithm)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return [Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1];
}
// Lunar New Year (day 1 of the Chinese lunisolar calendar). Table of published dates (timeanddate.com, 2021–2031):
// browsers' Intl Chinese-calendar data was found to be off by a day for 2027, so it is NOT used. Years outside the table are omitted.
const LNY = {2021: '02-12', 2022: '02-01', 2023: '01-22', 2024: '02-10', 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23'};
function lunarNewYear(y) { return LNY[y] ? LNY[y].split('-').map(Number) : null; }
// The Friday before the AFL Grand Final is gazetted each year once the AFL fixes the GF date.
// Known (Business Victoria): 2022-09-23, 2023-09-29, 2024-09-27, 2025-09-26, 2026-09-25. Other years: last Friday of September, flagged approximate.
const GFF = {2022: '2022-09-23', 2023: '2023-09-29', 2024: '2024-09-27', 2025: '2025-09-26', 2026: '2026-09-25'};
// Published event dates only (official sites). Moomba: City of Melbourne; MICE: internationalcoffeeexpo.com
const MOOMBA = {2026: ['2026-03-05', '2026-03-09']};
const MICE = {2027: ['2027-03-04', '2027-03-06']};

const INFO = {
  newyear: {zh: '元旦', en: "New Year's Day", icon: '🎆', kind: 'ph', note: '新年第一天，维州公众假期。'},
  ausday: {zh: '澳大利亚日', en: 'Australia Day', icon: '🇦🇺', kind: 'ph', note: '1 月 26 日，维州公众假期（逢周末则移到次周一）。'},
  labour: {zh: '劳动节（维州）', en: 'Labour Day (VIC)', icon: '🛠️', kind: 'ph', note: '3 月第二个周一，维州公众假期。'},
  moomba: {zh: 'Moomba 节', en: 'Moomba Festival', icon: '🎡', kind: 'event', note: '墨尔本最大的免费社区节庆，在劳动节长周末于亚拉河畔举行（巡游、Birdman Rally、烟花）。'},
  mice: {zh: '墨尔本国际咖啡博览会', en: 'Melbourne International Coffee Expo', icon: '☕', kind: 'event', note: 'MICE，在墨尔本会展中心（MCEC）举办。'},
  lny: {zh: '农历新年', en: 'Lunar New Year', icon: '🧧', kind: 'event', note: '唐人街、Box Hill 等地通常有庆祝活动，具体活动日期以当年公布为准。不是公众假期。'},
  goodfri: {zh: '耶稣受难日', en: 'Good Friday', icon: '✝️', kind: 'ph', note: '复活节前的周五，维州公众假期（限制营业日）。'},
  eastersat: {zh: '复活节前的周六', en: 'Saturday before Easter Sunday', icon: '🐣', kind: 'ph', note: '维州公众假期。'},
  eastersun: {zh: '复活节', en: 'Easter Sunday', icon: '🥚', kind: 'ph', note: '维州公众假期。'},
  eastermon: {zh: '复活节星期一', en: 'Easter Monday', icon: '🐰', kind: 'ph', note: '维州公众假期。'},
  anzac: {zh: '澳新军团日', en: 'ANZAC Day', icon: '🌺', kind: 'ph', note: '4 月 25 日，纪念日，清晨有黎明纪念仪式（Dawn Service）。维州遇周末不补假。'},
  kings: {zh: '国王生日', en: "King's Birthday", icon: '👑', kind: 'ph', note: '6 月第二个周一，维州公众假期。'},
  gff: {zh: 'AFL 总决赛前的周五', en: 'Friday before the AFL Grand Final', icon: '🏉', kind: 'ph', note: '维州公众假期，日期随 AFL 总决赛安排由州政府公布。'},
  cup: {zh: '墨尔本杯日', en: 'Melbourne Cup Day', icon: '🏇', kind: 'ph', note: '11 月第一个周二，维州公众假期（部分乡郊地区改用本地假日）。'},
  xmas: {zh: '圣诞节', en: 'Christmas Day', icon: '🎄', kind: 'ph', note: '南半球的夏日圣诞，维州公众假期（限制营业日）。'},
  boxing: {zh: '节礼日', en: 'Boxing Day', icon: '🎁', kind: 'ph', note: '12 月 26 日，维州公众假期。'}};
const LINES = {
  newyear: ['新年快乐！新的一年也请多来喝咖啡～', '元旦还开门的店不多，你能找到我们真好！'],
  ausday: ['今天是 Australia Day 公众假期，好多人在休息～', '1 月正是夏天，来杯冰的 long black？'],
  labour: ['劳动节长周末！今天就慢慢喝一杯吧。', '劳动节快乐，今天不用上班吧？'],
  moomba: ['Moomba 节在亚拉河边，看完巡游来杯咖啡吧！', '听说今年的 Birdman Rally 又有人掉进河里啦～'],
  mice: ['这几天墨尔本国际咖啡博览会在 MCEC，同行们都去取经了！', 'MICE 期间到处都是咖啡人，今天的豆子特别讲究哦。'],
  lny: ['农历新年快乐！唐人街那边今天应该很热闹。', '新年快乐！来杯咖啡，新的一年精神满满～'],
  goodfri: ['今天是 Good Friday，好多店休息，谢谢你来！', '复活节长周末开始啦。'],
  eastersat: ['复活节长周末，慢慢喝一杯吧～', '要不要配个热十字面包（hot cross bun）？'],
  eastersun: ['复活节快乐！', '今天是复活节，小镇特别安静呢。'],
  eastermon: ['复活节长周末的最后一天，好好休息～', '复活节星期一，来杯热的收收心？'],
  anzac: ['今天是澳新军团日。很多人清早去参加了黎明纪念仪式。', 'Lest we forget。今天请安静地喝一杯吧。'],
  kings: ['国王生日长周末，冬天就该来杯热咖啡！', '今天是公众假期，店里人好多～'],
  gff: ['总决赛前的周五放假！你支持哪支队？', '街上好多球衣，明天就是 AFL 总决赛啦！'],
  cup: ['墨尔本杯日！大家都盛装出门看赛马呢。', '今天全城为赛马停下来，来杯咖啡慢慢看～'],
  xmas: ['圣诞快乐！墨尔本的圣诞可是在夏天哦。', '圣诞节还来看我，这杯算我请！'],
  boxing: ['节礼日快乐！今天是不是去逛打折了？', 'Boxing Day 的板球比赛开打了吧？']};

const cache = {};
function list(y) {
  if (cache[y]) return cache[y];
  const out = [], put = (m, d, id, extra = {}) => { const I = INFO[id]; out.push({date: iso(y, m, d), id, zh: I.zh, en: I.en, icon: I.icon, kind: I.kind, note: I.note, approx: false, sub: false, ...extra}); };
  const sub = (m, d, id, why, moved) => { const I = INFO[id]; out.push({date: iso(y, m, d), id, zh: I.zh + (moved ? '（假期日）' : '（补假）'), en: I.en + (moved ? ' (observed)' : ' (additional day)'), icon: I.icon, kind: 'ph', note: why, approx: false, sub: true}); };
  // New Year's Day (weekend → following Monday)
  put(1, 1, 'newyear'); { const w = dow(y, 1, 1); if (w === 6) sub(1, 3, 'newyear', '元旦逢周六，次周一补假。'); if (w === 0) sub(1, 2, 'newyear', '元旦逢周日，次周一补假。'); }
  // Australia Day (weekend → following Monday)
  // VIC: if 26 Jan is a weekend the public holiday moves to the Monday (instead of, not in addition to)
  { const w = dow(y, 1, 26); if (w === 6 || w === 0) { put(1, 26, 'ausday', {kind: 'event', note: '1 月 26 日逢周末：当天不是公众假期，假期移到次周一。'}); sub(1, w === 6 ? 28 : 27, 'ausday', '澳大利亚日逢周末，公众假期移到次周一。', true); } else put(1, 26, 'ausday'); }
  const lny = lunarNewYear(y); if (lny) put(lny[0], lny[1], 'lny');
  const lab = nthDow(y, 3, 1, 2); put(3, lab, 'labour');
  if (MOOMBA[y]) { const [a, b] = MOOMBA[y]; for (let t = D(...a.split('-').map(Number)); t <= D(...b.split('-').map(Number)); t = new Date(t.getTime() + 864e5)) put(t.getUTCMonth() + 1, t.getUTCDate(), 'moomba'); }
  else [-2, -1, 0].forEach(k => { const [, m, d] = addDays(y, 3, lab, k); put(m, d, 'moomba', {approx: true, note: INFO.moomba.note + '当年日期未公布，按劳动节长周末估算。'}); });
  if (MICE[y]) { const [a, b] = MICE[y]; for (let t = D(...a.split('-').map(Number)); t <= D(...b.split('-').map(Number)); t = new Date(t.getTime() + 864e5)) put(t.getUTCMonth() + 1, t.getUTCDate(), 'mice'); }
  const [em, ed] = easter(y); [[-2, 'goodfri'], [-1, 'eastersat'], [0, 'eastersun'], [1, 'eastermon']].forEach(([k, id]) => { const [, m, d] = addDays(y, em, ed, k); put(m, d, id); });
  put(4, 25, 'anzac');
  put(6, nthDow(y, 6, 1, 2), 'kings');
  if (GFF[y]) { const [, m, d] = GFF[y].split('-').map(Number); put(m, d, 'gff'); }
  else put(9, lastDow(y, 9, 5), 'gff', {approx: true, note: INFO.gff.note + '当年日期未公布：按“通常是 9 月最后一个周五”估算，以州政府公布为准。'});
  put(11, nthDow(y, 11, 2, 1), 'cup');
  // Christmas / Boxing Day additional days (Victoria)
  put(12, 25, 'xmas'); put(12, 26, 'boxing');
  const xw = dow(y, 12, 25);
  if (xw === 6) { sub(12, 27, 'xmas', '圣诞节逢周六，次周一补假。'); sub(12, 28, 'boxing', '节礼日逢周日，周二补假。'); }
  else if (xw === 0) sub(12, 27, 'xmas', '圣诞节逢周日（节礼日在周一），周二补假。');
  else if (xw === 5) sub(12, 28, 'boxing', '节礼日逢周六，次周一补假。');
  out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  return (cache[y] = out);
}
const on = date => list(+String(date).slice(0, 4)).filter(f => f.date === date);
function upcoming(from, n = 6) { const y = +from.slice(0, 4); return [...list(y), ...list(y + 1)].filter(f => f.date >= from).slice(0, n); }
function line(f, seed = 0) { const L = LINES[f.id]; return L ? L[Math.abs(seed) % L.length] : ''; }
// 🌦️ in-game town weather: deterministic per Melbourne date and season (NOT a real forecast)
const WX = {sun: {zh: '晴', icon: '☀️'}, cloud: {zh: '多云', icon: '⛅'}, rain: {zh: '小雨', icon: '🌧️'}, wind: {zh: '大风', icon: '🍃'}, hot: {zh: '炎热', icon: '🔥'}};
const WXP = {spring: [['sun', .42], ['cloud', .24], ['rain', .2], ['wind', .14]], summer: [['sun', .5], ['hot', .2], ['cloud', .18], ['rain', .12]],
  autumn: [['sun', .4], ['cloud', .3], ['rain', .2], ['wind', .1]], winter: [['cloud', .4], ['rain', .32], ['sun', .2], ['wind', .08]]};
function weather(date, season) { let h = 2166136261; for (const ch of 'wx' + date) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let r = ((h >>> 0) % 10000) / 10000; const P = WXP[season] || WXP.spring; for (const [id, p] of P) { if ((r -= p) < 0) return {id, ...WX[id]}; } return {id: P[0][0], ...WX[P[0][0]]}; }
window.Fests = {list, on, upcoming, line, easter, nthDow, lastDow, lunarNewYear, weather, INFO, GFF, MOOMBA, MICE};
})();
