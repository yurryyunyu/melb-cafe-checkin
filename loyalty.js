// 🎴 集卡 / 江湖通行印. Parallel to badges and the bean codex: one stamp per cafe, story cards from
// chapters / side stories / endings, region sets you exchange for a title and coins. No gacha, no paid draw.
// State: localStorage mcc.loyalty {v, stamps:{cafeId:n}, cards:[{id,at}], sets:[regionId]}.
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.loyalty';
const SETS = [
  {id: 'city', name: '市中心', title: '巷口印信', c: 80, line: '一条巷子，走成了家。'},
  {id: 'richmond', name: '列治文', title: '河岸印信', c: 80, line: '河对岸的火，你都闻过了。'},
  {id: 'northmel', name: '北墨尔本', title: '北巷印信', c: 80, line: '安静的街上，杯子还热。'},
  {id: 'brunswick', name: '布伦瑞克', title: '街坊印信', c: 80, line: '邻居的客厅里，有你的椅子。'},
  {id: 'more', name: '更多街区', title: '散页行者', c: 100, line: 'Fitzroy、Collingwood、Carlton 的店还在「更多」里，打卡就会盖印。'},
];
// secret cards stay silhouettes until earned (ending names are not shown early)
const CARDS = [
  {id: 'pro', kind: 'main', name: '序章 · 巷口的灯', line: '灯还亮着。有人怕它灭，才不敢走。', tag: 'love'},
  {id: 'ch1', kind: 'main', ch: 1, name: '第一章 · 雨后的小巷', line: '先闻，再决定还爱不爱。', tag: 'love'},
  {id: 'ch2', kind: 'main', ch: 2, name: '第二章 · 豆袋上的名字', line: '慢慢喝是慈悲。跑，也是一种伤。', tag: 'love'},
  {id: 'ch3', kind: 'main', ch: 3, name: '第三章 · 河对岸的火', line: '她问凭什么是你。回答是刀，或是座位。', tag: 'love'},
  {id: 'ch4', kind: 'main', ch: 4, name: '第四章 · 九个大气压', line: '争的不是粉。是你能不能听我一次。', tag: 'love'},
  {id: 'ch5', kind: 'main', ch: 5, name: '第五章 · 奶泡里的人情', line: '你挡在巷口。家还没被收走。', tag: 'hero'},
  {id: 'ch6', kind: 'main', ch: 6, name: '第六章 · 清澈', line: '恨了一年的人，终于把信交出来。', tag: 'love'},
  {id: 'ch7', kind: 'main', ch: 7, name: '第七章 · 舌尖的地图', line: '舌头回来了。对面挂上了第一百二十八块招牌。', tag: 'love'},
  {id: 'ch8', kind: 'main', ch: 8, name: '第八章 · 咖啡魂', line: '椅子、关门，或先听完。都是把恨放在哪。', tag: 'hero'},
  {id: 'ch9', kind: 'main', ch: 9, name: '第九章 · 第一颗豆', line: '簿子不属于谁。人可以先坐下。', tag: 'hero'},
  {id: 'side:s-city1', kind: 'side', name: '支线 · 电车站的伞', line: '每个人都有一杯不好意思说的咖啡。', tag: 'love'},
  {id: 'side:s-city2', kind: 'side', name: '支线 · 小巷里的规矩', line: '让一让路，也是巷子里的人情。', tag: 'hero'},
  {id: 'side:s-rich1', kind: 'side', name: '支线 · 一锅刚出炉的豆', line: '会闻的人，舌头迟早会跟上。', tag: 'love'},
  {id: 'side:s-rich2', kind: 'side', name: '支线 · 空着的座位', line: '凉了的那杯，也算他请的。', tag: 'love'},
  {id: 'side:s-nm1', kind: 'side', name: '支线 · 凌晨四点的第一杯', line: '谢谢说出口的时候，困就散了。', tag: 'hero'},
  {id: 'side:s-nm2', kind: 'side', name: '支线 · 老机器的脾气', line: '用了很多年的东西，要等，别嫌。', tag: 'love'},
  {id: 'side:s-br1', kind: 'side', name: '支线 · Sydney Road 的黄油香', line: '这条街上，什么都是邻居。', tag: 'love'},
  {id: 'side:s-br2', kind: 'side', name: '支线 · 墙上的便利贴', line: '一句话，就够当一封信。', tag: 'love'},
  {id: 'side:s-more1', kind: 'side', name: '支线 · 会换衣服的猫', line: '灰围巾的颜色，有人替她画过。', tag: 'love'},
  {id: 'side:s-more2', kind: 'side', name: '支线 · 书店里的滤泡', line: '不催你的那一杯，陪你读完一页。', tag: 'love'},
  {id: 'mile:10', kind: 'mile', need: 10, name: '初行十店', line: '十家店，十条巷。今天也亮着。', tag: 'hero'},
  {id: 'mile:25', kind: 'mile', need: 25, name: '半城茶香', line: '走了半座城，杯子还温。', tag: 'love'},
  {id: 'mile:51', kind: 'mile', need: 51, name: '五十一盏灯', line: '不同的店超过五十家。结局的门，从这里开。', tag: 'hero'},
  {id: 'end:tea', kind: 'end', end: 'tea', secret: 1, name: '结局 · 人走茶凉', line: '爱还在。人灭了。雨里只剩一只空杯。', tag: 'hero'},
  {id: 'end:lamp', kind: 'end', end: 'lamp', secret: 1, name: '结局 · 灯火未熄', line: '空白把告别按住。灯还为没说完的爱亮着。', tag: 'love'},
  {id: 'end:first', kind: 'end', end: 'first', secret: 1, name: '结局 · 第一颗', line: '恨让出座位。铺子重新开了门。', tag: 'love'},
];
const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));

const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
function norm(s) {
  s = obj(s); const stamps = {}, cards = [];
  Object.entries(obj(s.stamps)).forEach(([id, n]) => { n = Math.floor(+n) || 0; if (id && n > 0 && n < 10000) stamps[id] = n; });
  const seen = new Set();
  (Array.isArray(s.cards) ? s.cards : []).forEach(c => { c = obj(c); if (!c.id || seen.has(c.id) || !byId[c.id]) return; seen.add(c.id); cards.push({id: c.id, at: c.at || 1}); });
  const sets = [];
  (Array.isArray(s.sets) ? s.sets : []).forEach(id => { if (SETS.some(x => x.id === id) && !sets.includes(id)) sets.push(id); });
  return {v: 1, stamps, cards, sets};
}
function load() { try { return norm(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return norm(null); } }
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const starsOf = n => (n >= 10 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);
const hasCard = id => S.cards.some(c => c.id === id);

function grant(id, added) {
  if (!byId[id] || hasCard(id)) return;
  S.cards.push({id, at: Date.now()});
  if (added) added.push(byId[id]);
}
function sync(ctx) {
  ctx = ctx || {}; const counts = obj(ctx.counts), story = obj(ctx.story), added = [], fresh = []; let dirty = false;
  const known = new Set((ctx.cafes || []).map(c => c.id));
  Object.keys(S.stamps).forEach(id => { if (known.size && !known.has(id)) return; const n = Math.floor(+counts[id]) || 0; if (n <= 0) { delete S.stamps[id]; dirty = true; } });
  Object.entries(counts).forEach(([id, n]) => {
    n = Math.floor(+n) || 0; if (!id || n <= 0) return;
    if (!S.stamps[id]) fresh.push(id);
    if (S.stamps[id] !== n) { S.stamps[id] = n; dirty = true; }
  });
  const unique = Math.max(story.unique || 0, Object.keys(S.stamps).length);
  if (story.pro) grant('pro', added);
  (story.chapters || []).forEach(n => grant('ch' + n, added));
  (story.sides || []).forEach(id => grant('side:' + id, added));
  [10, 25, 51].forEach(n => { if (unique >= n) grant('mile:' + n, added); });
  if (story.ending && unique > 50) grant('end:' + story.ending, added);
  if (added.length) dirty = true;
  if (dirty) save();
  return {stamps: fresh, cards: added};
}
function cafesOf(ctx, region) {
  return (ctx.cafes || []).filter(c => c.region === region && c.seed !== false && !c.closed);
}
function setProgress(id, ctx) {
  const list = cafesOf(ctx, id), have = list.filter(c => (S.stamps[c.id] || 0) > 0).length;
  return {have, need: list.length, ready: list.length > 0 && have >= list.length, claimed: S.sets.includes(id)};
}
function claim(setId, ctx) {
  const meta = SETS.find(s => s.id === setId); if (!meta || S.sets.includes(setId)) return null;
  const p = setProgress(setId, ctx); if (!p.ready) return null;
  S.sets.push(setId); save(); return {id: setId, c: meta.c, title: meta.title, line: meta.line};
}
function summary(ctx) {
  sync(ctx);
  const stamped = Object.keys(S.stamps).length;
  const readySet = SETS.some(s => { const p = setProgress(s.id, ctx); return p.ready && !p.claimed; });
  return {stamped, cards: S.cards.length, cardTotal: CARDS.length, readySet, sets: S.sets.slice()};
}
function faceName(card, owned) {
  if (owned) return card.name;
  if (card.kind === 'end') return '结局';
  if (card.kind === 'side') return '支线';
  if (card.kind === 'mile') return card.need + ' 家不同的店';
  if (card.ch) return '第 ' + card.ch + ' 章';
  if (card.id === 'pro') return '序章';
  return '未收集';
}
function model(ctx) {
  sync(ctx);
  const cafes = (ctx.cafes || []).map(c => { const n = S.stamps[c.id] || 0; return {...c, n, stars: starsOf(n), owned: n > 0}; });
  const cards = CARDS.map(c => { const owned = hasCard(c.id); return {...c, owned, face: faceName(c, owned), line: owned ? c.line : ''}; });
  const sets = SETS.map(s => ({...s, ...setProgress(s.id, ctx)}));
  return {cafes, cards, sets, stamped: cafes.filter(c => c.owned).length};
}
function paint(info) {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'); c.width = 640; c.height = 860;
  const g = c.getContext('2d'), xuan = !!info.xuan, valley = !!info.valley && !xuan;
  g.fillStyle = xuan ? '#e8dcc0' : valley ? '#7ec24a' : '#f6efe2'; g.fillRect(0, 0, 640, 860);
  if (valley) {
    g.fillStyle = '#8ec8ea'; g.fillRect(0, 0, 640, 150);
    g.fillStyle = '#b7dc78'; g.fillRect(0, 130, 640, 40);
    g.fillStyle = '#fff1c4'; g.fillRect(36, 86, 568, 730);
    g.fillStyle = '#a33b32'; g.fillRect(250, 100, 150, 28); g.fillStyle = '#7a2c26'; g.fillRect(236, 122, 178, 10);
    g.fillStyle = '#f3d7a4'; g.fillRect(268, 132, 114, 70); g.fillStyle = '#6b3f1d'; g.fillRect(308, 156, 28, 40);
    g.fillStyle = '#ffe08a'; g.fillRect(278, 148, 22, 18);
    g.strokeStyle = '#e2b06a'; g.lineWidth = 8; g.strokeRect(56, 168, 528, 620);
  }
  g.strokeStyle = xuan ? '#2a2018' : valley ? '#3a2414' : '#4a4038'; g.lineWidth = 10; g.strokeRect(28, 28, 584, 804);
  g.strokeStyle = xuan ? '#9c6b22' : valley ? '#c98f55' : '#c4a574'; g.lineWidth = valley ? 6 : 2; g.strokeRect(48, 48, 544, 764);
  g.fillStyle = xuan ? '#2a2018' : '#3a2414';
  g.font = '28px "PingFang SC","Noto Sans CJK SC",sans-serif';
  g.fillText(info.kicker || (xuan ? '江湖通行印' : '咖啡集卡'), 72, 120);
  g.font = 'bold 42px "PingFang SC","Noto Sans CJK SC",sans-serif';
  const name = String(info.name || ''); let y = 200;
  for (let i = 0; i < name.length; i += 12) { g.fillText(name.slice(i, i + 12), 72, y); y += 54; }
  g.font = '26px "PingFang SC","Noto Sans CJK SC",sans-serif';
  const sub = String(info.sub || ''); g.fillText(sub.slice(0, 22), 72, 470);
  g.font = '30px "PingFang SC","Noto Sans CJK SC",sans-serif';
  g.fillText(info.mark || '', 72, 560);
  g.font = '24px "PingFang SC","Noto Sans CJK SC",sans-serif';
  const line = String(info.line || '');
  g.fillText(line.slice(0, 18), 72, 680);
  if (line.length > 18) g.fillText(line.slice(18, 36), 72, 716);
  g.font = '22px "PingFang SC","Noto Sans CJK SC",sans-serif';
  g.fillText('墨尔本咖啡打卡', 72, 790);
  return c.toDataURL('image/png');
}

const Loyalty = {KEY, SETS, CARDS, starsOf, sync, summary, model, claim, paint, faceName, reload() { S = load(); }, get state() { return S; }};
root.Loyalty = Loyalty;
if (typeof module !== 'undefined') module.exports = Loyalty;
})();
