// 《七时四十》第二部主线包（连载阅读器）。不覆盖「第一颗豆」/ story.js。
// 存档前缀 mcc.qsss。通缉标记、拆芯、倒计时只出现在正文里，不是应用玩法。
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.qsss';
const TITLE = '七时四十';
const DISC = '本连载角色均为虚构，与各店真实员工无关。咖啡馆只作故事里的接头与地理。';
const RATING = '建议 13+，含近未来科幻动作场面';
const SH_URL = 'https://yurryyunyu.github.io/sh-cafe-checkin/';
const SH_LINE = '卷一《午午线》在上海咖啡打卡里连载。';
const CHAPTERS = [
  {
    "n": 1,
    "title": "这杯不出",
    "cafeId": "patricia",
    "sceneCafeIds": [
      "maker"
    ],
    "nextCafeId": "codeblackflinders",
    "paras": [
      "第1章 这杯不出",
      "「这杯不出。」",
      "这是柯未晚今天听到的第一句话。不是人说的。Maker Coffee 的门开着，小伯克街 387 号，七点刚过。柜面一道细红扫描线从她鞋面爬到领口，出杯口自己落下挡板，那只已经做好的杯子停在挡板后面，谁的都不往外递。",
      "吧台里的人按了两下出杯键，挡板不抬。他像想把杯子从侧面递出来，手却停在半空。「不是我不给你。」他只盯自己腕内侧那块亮起来的识别片，声音压得很低，「它自己锁了。你再站在这儿，我会被一起记上。」",
      "她没有争。争也不会有咖啡。那道红痕何时印到她身上，她并不清楚，可它已经开始让店门对她合上。被拒出杯不是警告，是已经发生的损失：她今天的第一杯，就这样停在别人的出杯口里。她退回人行道。这条街上的电车识别光还在一节一节亮着，像什么都没发生。",
      "她沿小伯克街再往里走，拐进小威廉巷转角的后巷。Patricia 这间站饮店从 2011 年底就开在这里，周中营业，周末不开门。吧台是一条窄不锈钢，没有座位，人都站着喝。她赌这里出杯更快——若扫描慢一步，她还能先把一口喝完。",
      "排在她前面的男人先把杯子拿到手里。他点的是 Black，一杯不加奶的黑咖啡。她没从液面上看出破绽，只是靠近时闻到焦苦、发涩，还有一股烧焦木头的味道。可他唇沿刚碰上瓷，耳后一条细得发亮的金属线就亮了一下：线贴进下颌，吞咽时在皮下轻轻抽动，像有人替他先按下了答案。他几乎没有停顿，用一种平整得不像在品尝的声音说：",
      "「完美。」",
      "里面有人下意识问：「还好？」",
      "「完美。」男人又说一遍。咖啡溅了一滴在他手背上，他看也不看，「完美。」",
      "柯未晚胃里发紧。不是怕这个人，是怕这种被改过的肯定。那杯明明算不上好。过萃会发苦、发干，把甜感抽走，不会无端变成「完美」。旁边还有人等着白咖啡，蒸汽罐的啸叫已经偏高——奶一旦烫过线，乳糖的甜会往下掉，留下的是发扁、发木、带一点煮蛋气的味道，绝不是更甜。这些她都分得清。她自己身上还没有被谁贴上那样一条线，至少眼前还没有。",
      "「滤泡咖啡。」她说，指指墙上的 Filter。她要一杯没有奶的东西，处理法才会自己站出来，对错也才会露出来。",
      "杯子很快推到她手边。浅金色的液面很稳，香气偏柑橘皮和刚切开的青苹果，收口干脆，没有酒桶里那种鼓胀的发酵感，也不发黏。她把杯子送到唇边，只尝了浅浅一下，确认自己没有被刚才那两声「完美」带偏：路径清楚，是水洗常见的干净走向，中后段略瘦，像注水节奏抢了一拍，糖分还没完全展开。她把这个判断留给自己，不向谁求证。",
      "她的第二口还停在杯沿。",
      "小威廉巷的砖墙先闷响了一记，不像车辆擦过，也不像瓷器落地。墙缝里嵌着的一块暗板突然过载，白光从砖缝里挤出来，随即沿巷壁一盏接一盏爆开——近处的灯管先炸，远处的跟着跳，碎玻璃雨点一样砸在站饮店门外的石板上，整条后巷像被谁从一端撕到另一端。",
      "紧接着，小伯克街方向传来更大规模的沉寂：整条电车线的识别光同时灭掉，一节、十节、整列，全部黑掉，连转弯处那一排都不再闪。几辆车还滑行了半个车身，车厢里的指示条一片空白，沿街橱窗也跟着暗了一波，像整条走廊被谁从总闸上拧死。",
      "沿街更多的出杯口开始自动落下挡板，识别光一灭，店门就学会了拒绝。她忽然明白，Maker 出杯口自己落下的那块挡板，不是店员在作对，是这座城市开始按标记关门。有人喊，有人往巷口挤。",
      "前面那位耳后带着细线的男人却还站在原处，对着已经不受控制的灯光，第三次说：「完美。」",
      "就在这一片爆开的白光里，柯未晚的听觉被撕开一条缝。它不是从这口滤泡咖啡里爬上来的。灭掉的轨道把另一套对话硬塞进她耳朵：减秒的滴答，金属芯过热的锐鸣，以及一个贴得很近的指令——",
      "「按住她的杯子。不要再入口。」",
      "街声来得又亮又硬，像有人把城市的里侧直接贴上她的鼓膜。她看见砖墙里那块过热的暗板，看见有人正用一只烧焦的计时腕带按住它。指令的对象是按着墙的那个人，轮不到站在吧台这边的她来答应。",
      "一只手已经按上她的杯沿，把还没送出的第二口压了回去。他只按在远离她手指的那一侧，力道很稳，始终没有碰到她的手。",
      "「别喝。」男人说。他腕带上全是焦痕，数字跳得很快。杯子对他而言只是障碍，墙缝里的暗板才是正事。「你再入口，扫描会把你和这堵墙写成同一条记录。我需要这条巷在七时四十之前干净。」",
      "柯未晚没松手。「这是我点的滤泡咖啡。」",
      "「你可以留着。不要入口。」腕带上的焦痕还在冒细烟。她这才明白，刚才整条电车识别光一起熄灭，不是故障，是他腕带上回咬出来的代价——他为了给自己抢几十秒，把一整条线上的眼睛同时掐死。他另一只手已经扣进砖缝，指节被白光烫得发红，却还在按腕带上的节拍往外拔。这是他的事：计时，掐灯，把芯取出。「我不评你这杯好不好。我是来把墙里的东西在整点前拆走的。」",
      "街声里已经出现过「拆芯」。她听得懂，也可以当没听见。灯管的碎玻璃还在往下掉，耳后有线的男人仍在重复那个词，脚没动，像完美这两个字把他钉在了爆点底下。柯未晚没有按指令站在原地，也没有把杯子交出去。她侧过身，抓住那个还在说「完美」的人的衣袖，把他从下一盏即将爆开的灯底下拽开。男人的金属线慌乱地闪了闪，嘴唇还在找同一个字，被改过的味觉似乎连危险也一并校准成了无事。她把自己的杯子转进掌心，没有喝那第二口——不是因为被命令，是因为她得先把人拉开，也因为这杯水洗，她已经喝清楚了。",
      "「我不是你要写进去的人。」她对那个按着墙的人说。",
      "「现在不是讨论的时候。」他腕带亮起四行字，投射在湿砖上，像从灭掉的电车显示牌上借来的残影。时间停在 07:36。她看清的是分工：",
      "拆：韩灼\n掩：空\n应：空\n接：柯未晚",
      "「我没答应。」柯未晚说。",
      "腕带却已经开始减秒。碎光里，韩灼把暗板从砖缝里拔出一寸，声音很稳，像在报时，不是在劝她：",
      "「七时四十开始。四人一组。你被写成接头。」",
      "倒计时跳到 03:59。砖上的四行字不再改。",
      "她把还没喝完的 Filter 举高，随手拍了一张，备注只写：水洗，注水略急。「接」那一格在湿砖上的分工里轻轻跳了一下，方向指向 Flinders Lane 的 Code Black。",
      "接头那一格已经锁死。七时四十，写着她的名字。"
    ]
  },
  {
    "n": 2,
    "title": "换一条街，再听指令",
    "cafeId": "codeblackflinders"
  },
  {
    "n": 3,
    "title": "站不住的吧台",
    "cafeId": "hardwaresoc"
  },
  {
    "n": 4,
    "title": "小伯克街上的第二杯",
    "cafeId": "bbb"
  },
  {
    "n": 5,
    "title": "轨道下面的甜",
    "cafeId": "dukes"
  },
  {
    "n": 6,
    "title": "南边的桌子",
    "cafeId": "stali"
  },
  {
    "n": 7,
    "title": "人潮里的碰面",
    "cafeId": "marketlane"
  },
  {
    "n": 8,
    "title": "仓库改过的光",
    "cafeId": "industrybeans"
  },
  {
    "n": 9,
    "title": "牛津街上的热蛋糕与冷指令",
    "cafeId": "proudmary"
  },
  {
    "n": 10,
    "title": "种子仓里的名字",
    "cafeId": "sevenseeds",
    "sceneCafeIds": [
      "lune"
    ]
  }
];

const byN = Object.fromEntries(CHAPTERS.map(c => [c.n, c]));
const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
function norm(s) {
  s = obj(s);
  const unlocked = {}, read = {};
  Object.entries(obj(s.unlocked)).forEach(([k, v]) => { const n = +k; if (byN[n] && v) unlocked[n] = +v || 1; });
  Object.entries(obj(s.read)).forEach(([k, v]) => { const n = +k; if (byN[n] && v) read[n] = +v || 1; });
  return {v: 1, unlocked, read};
}
function load() { try { return norm(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return norm(null); } }
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const cafeName = (id, nameOf) => {
  if (nameOf) { const n = nameOf(id); if (n) return n; }
  const list = root.SEED_CAFES || [];
  const c = list.find(x => x.id === id);
  return c ? c.name : id;
};
const isUnlocked = n => !!S.unlocked[n];
const hasText = n => !!(byN[n] && Array.isArray(byN[n].paras) && byN[n].paras.length);
const visitedHas = (visited, id) => !!(visited && (visited.has ? visited.has(id) : visited[id] || (Array.isArray(visited) && visited.includes(id))));

function canUnlock(n, visited) {
  const ch = byN[n]; if (!ch) return false;
  if (isUnlocked(n)) return true;
  if (n > 1 && !isUnlocked(n - 1)) return false;
  return visitedHas(visited, ch.cafeId);
}
function sync(visited) {
  const fresh = [];
  CHAPTERS.forEach(ch => {
    if (!isUnlocked(ch.n) && canUnlock(ch.n, visited)) {
      S.unlocked[ch.n] = Date.now();
      fresh.push({n: ch.n, title: ch.title, cafeId: ch.cafeId});
    }
  });
  if (fresh.length) save();
  return fresh;
}
function markRead(n) {
  if (!isUnlocked(n) || S.read[n]) return;
  S.read[n] = Date.now(); save();
}
const unlockedNs = () => CHAPTERS.filter(c => isUnlocked(c.n)).map(c => c.n);
const progress = () => unlockedNs().length;

function status(n, visited) {
  const ch = byN[n]; if (!ch) return null;
  const unlocked = isUnlocked(n);
  const ready = !unlocked && canUnlock(n, visited);
  const prev = n > 1 && !isUnlocked(n - 1);
  return {
    n: ch.n, title: ch.title, cafeId: ch.cafeId,
    sceneCafeIds: ch.sceneCafeIds || [],
    nextCafeId: ch.nextCafeId || (byN[n + 1] && byN[n + 1].cafeId) || '',
    unlocked, ready, needPrev: prev, hasText: hasText(n), read: !!S.read[n]
  };
}
function allStatus(visited) { return CHAPTERS.map(c => status(c.n, visited)); }

function hintFor(cafeId) {
  if (!cafeId) return null;
  const rec = CHAPTERS.find(c => c.cafeId === cafeId);
  if (rec) return {kind: 'unlock', n: rec.n, title: rec.title, cafeId: rec.cafeId, unlocked: isUnlocked(rec.n), hasText: hasText(rec.n)};
  const scene = CHAPTERS.find(c => (c.sceneCafeIds || []).includes(cafeId));
  if (scene) return {kind: 'scene', n: scene.n, title: scene.title, cafeId: scene.cafeId, unlocked: isUnlocked(scene.n), hasText: hasText(scene.n)};
  return null;
}

function entryHtml(esc, visited) {
  sync(visited);
  const next = CHAPTERS.find(c => !isUnlocked(c.n)) || CHAPTERS[CHAPTERS.length - 1];
  const st = status(next.n, visited);
  const p = progress(), N = CHAPTERS.length;
  const ready = st && (st.unlocked || st.ready);
  let sub;
  if (p === 0) sub = '在 Patricia Coffee Brewers 打卡，解锁第 1 章';
  else if (st && st.unlocked && st.hasText && !st.read) sub = '第 ' + st.n + ' 章《' + st.title + '》可以开读';
  else if (st && st.unlocked && !st.hasText) sub = '第 ' + st.n + ' 章已解锁，正文稍后更新';
  else if (st && st.ready) sub = '第 ' + st.n + ' 章可以解锁';
  else if (p >= N) sub = '前 10 章已全部解锁';
  else sub = '下一章《' + next.title + '》· 到推荐店打卡解锁';
  return `<a class="edu-entry vwin jwin qsss-entry${ready ? ' ready' : ''}" href="#/qsss" id="qsssEntry"><span class="ee-ic">📕</span><span class="ee-t"><b>连载 · 《${esc(TITLE)}》</b><small>${esc(RATING)} · ${esc(sub)}</small></span><span class="ee-bar"><i style="width:${Math.round(p / N * 100)}%"></i></span><span class="ee-go">›</span></a>`;
}

function cafeHintHtml(cafeId, visited, esc, nameOf) {
  sync(visited);
  const h = hintFor(cafeId); if (!h) return '';
  const cafe = cafeName(h.cafeId, nameOf);
  if (h.kind === 'scene') {
    const go = h.unlocked && h.hasText ? `#/qsss/${h.n}` : '#/qsss';
    return `<a class="qsss-hint vwin jwin" href="${go}" id="qsssHint"><span class="qh-k">连载 · 《${esc(TITLE)}》</span><b>第 ${h.n} 章《${esc(h.title)}》开场在这里</b><small>到 ${esc(cafe)} 打卡后可阅读此章。角色为虚构，与本店真实员工无关。</small></a>`;
  }
  if (h.unlocked && h.hasText) {
    return `<a class="qsss-hint vwin jwin ready" href="#/qsss/${h.n}" id="qsssHint"><span class="qh-k">连载 · 《${esc(TITLE)}》</span><b>第 ${h.n} 章《${esc(h.title)}》已解锁</b><small>点开阅读。角色为虚构，与本店真实员工无关。</small></a>`;
  }
  if (h.unlocked) {
    return `<a class="qsss-hint vwin jwin" href="#/qsss/${h.n}" id="qsssHint"><span class="qh-k">连载 · 《${esc(TITLE)}》</span><b>第 ${h.n} 章《${esc(h.title)}》已解锁</b><small>正文稍后更新。角色为虚构，与本店真实员工无关。</small></a>`;
  }
  return `<a class="qsss-hint vwin jwin" href="#/qsss" id="qsssHint"><span class="qh-k">连载 · 《${esc(TITLE)}》</span><b>在这里打卡，解锁第 ${h.n} 章《${esc(h.title)}》</b><small>角色为虚构，与本店真实员工无关。</small></a>`;
}

function paraClass(t) {
  if (/^第\d+章/.test(t)) return 'qsss-title';
  if (t.startsWith('「') && !t.includes('\n')) return 'qsss-line';
  if (/^拆：/.test(t)) return 'qsss-roster';
  return 'qsss-p';
}

function listHtml(esc, nameOf, visited) {
  sync(visited);
  const rows = allStatus(visited).map(st => {
    const cafe = cafeName(st.cafeId, nameOf);
    let sub, cls = 'qsss-ch', href = '', tag;
    if (st.unlocked && st.hasText) {
      cls += ' open'; href = `#/qsss/${st.n}`; tag = st.read ? '已读' : '可阅读';
      sub = `推荐店：${cafe}`;
    } else if (st.unlocked) {
      cls += ' soon'; href = `#/qsss/${st.n}`; tag = '即将更新';
      sub = `已解锁 · 正文稍后更新 · 推荐店：${cafe}`;
    } else if (st.needPrev) {
      cls += ' locked'; tag = '未解锁';
      sub = `先完成上一章，再到 ${cafe} 打卡`;
    } else {
      cls += ' locked'; tag = '未解锁';
      sub = `到 ${cafe} 打卡解锁`;
    }
    const inner = `<span class="qc-n">第 ${st.n} 章</span><b>${esc(st.title)}</b><small>${esc(sub)}</small><span class="qc-tag">${esc(tag)}</span>`;
    return href ? `<a class="${cls}" href="${href}" data-ch="${st.n}">${inner}</a>` : `<div class="${cls}" data-ch="${st.n}">${inner}</div>`;
  }).join('');
  return `<div class="qsss-page" id="qsssList">
    <div class="qsss-head"><span class="qh-ic">📕</span><div><h2>《${esc(TITLE)}》</h2><p>近未来墨尔本 · 打卡即翻章。卷一《CITY 标记》前 10 章。</p></div></div>
    <p class="qsss-rate" id="qsssRate">${esc(RATING)}</p>
    <p class="qsss-disc">${esc(DISC)}</p>
    <div class="qsss-chs">${rows}</div>
    <p class="qsss-foot">第 11 章起及卷二、卷三将在正文定稿后加入，不提前编造标题。</p>
    <p class="qsss-sh">${esc(SH_LINE)} <a href="${esc(SH_URL)}" target="_blank" rel="noopener" id="qsssShLink">打开上海应用</a></p>
  </div>`;
}

function readerHtml(n, esc, nameOf, visited) {
  sync(visited);
  const st = status(n, visited);
  if (!st) return '';
  const cafe = cafeName(st.cafeId, nameOf);
  if (!st.unlocked) {
    return `<div class="qsss-page qsss-locked-r" id="qsssReader" data-ch="${st.n}">
      <div class="qsss-head"><span class="qh-ic">🔒</span><div><h2>第 ${st.n} 章《${esc(st.title)}》</h2><p>${st.needPrev ? '请先完成上一章。' : ''}到 <a href="#/cafe/${esc(st.cafeId)}">${esc(cafe)}</a> 打卡后解锁。</p></div></div>
      <p class="qsss-rate">${esc(RATING)}</p>
      <p class="qsss-disc">${esc(DISC)}</p>
      <a class="btn" href="#/qsss">返回目录</a>
    </div>`;
  }
  markRead(st.n);
  const next = byN[st.n + 1];
  let nextHtml = '';
  if (next) {
    const ns = status(next.n, visited);
    const nc = cafeName(next.cafeId, nameOf);
    if (ns && ns.unlocked && ns.hasText) nextHtml = `<a class="btn" href="#/qsss/${next.n}">下一章 《${esc(next.title)}》</a>`;
    else if (ns && ns.unlocked) nextHtml = `<p class="qsss-next">下一章《${esc(next.title)}》已解锁，正文稍后更新。</p>`;
    else nextHtml = `<p class="qsss-next">下一章《${esc(next.title)}》· 到 <a href="#/cafe/${esc(next.cafeId)}">${esc(nc)}</a> 打卡解锁。</p>`;
  }
  if (!st.hasText) {
    return `<div class="qsss-page qsss-soon-r" id="qsssReader" data-ch="${st.n}">
      <div class="qsss-head"><span class="qh-ic">📕</span><div><h2>第 ${st.n} 章《${esc(st.title)}》</h2><p>本章已解锁，正文稍后更新。</p></div></div>
      <p class="qsss-rate">${esc(RATING)}</p>
      <p class="qsss-disc">${esc(DISC)}</p>
      <p class="hint">推荐店：<a href="#/cafe/${esc(st.cafeId)}">${esc(cafe)}</a></p>
      ${nextHtml}
      <a class="btn ghost" href="#/qsss">返回目录</a>
    </div>`;
  }
  const body = (byN[st.n].paras || []).map(t => {
    const cls = paraClass(t);
    const html = esc(t).replace(/\n/g, '<br>');
    return `<p class="${cls}">${html}</p>`;
  }).join('');
  return `<div class="qsss-page qsss-reader" id="qsssReader" data-ch="${st.n}">
    <p class="qsss-rate">${esc(RATING)}</p>
    <p class="qsss-disc">${esc(DISC)}</p>
    <article class="qsss-paper" id="qsssPaper">${body}</article>
    <p class="hint">推荐店：<a href="#/cafe/${esc(st.cafeId)}">${esc(cafe)}</a></p>
    ${nextHtml}
    <a class="btn ghost" href="#/qsss">返回目录</a>
  </div>`;
}

const cards = () => CHAPTERS.map(c => ({
  id: 'qsss:' + c.n, kind: 'qsss', ch: c.n, pack: TITLE,
  name: `《${TITLE}》第 ${c.n} 章 · ${c.title}`,
  line: c.n === 1 ? '这杯不出。' : '正文稍后更新。',
  tag: 'hero'
}));

const Qsss = {KEY, TITLE, DISC, RATING, SH_URL, SH_LINE, CHAPTERS, sync, canUnlock, isUnlocked, unlockedNs, progress, status, allStatus, hintFor, markRead, entryHtml, cafeHintHtml, listHtml, readerHtml, cards, hasText, reload() { S = load(); }, get state() { return S; }};
root.Qsss = Qsss;
if (typeof module !== 'undefined') module.exports = Qsss;
})();
