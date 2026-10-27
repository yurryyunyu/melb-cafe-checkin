// 📜 主线剧情「第一颗豆」(v2 · 江湖篇): story data + progress engine (no UI here; app.js plays the scenes).
// Chapters unlock in order. Objectives count the player's EXISTING check-ins/beans/course progress (retroactive),
// and are area/count based, so they never depend on one particular cafe staying open.
// v2 adds: stakes (a rival 金远), foreshadowing + a cliffhanger per chapter, 3 choices that change later dialogue,
// 好感 (bond) values for 老焙 and 澈, two epilogue endings, recipe-book pages with 林's handwriting, and area side stories (支线).
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.story';
const AREAS = ['city', 'richmond', 'northmel', 'brunswick'];
const EDU_NAMES = ['', '咖啡从哪里来', '果实变生豆', '火候的秘密', '九个大气压', '丝滑奶泡', '一壶清澈', '舌尖的地图', '墨尔本的咖啡魂'];
const AREA_NAMES = {city: 'MEL CITY（市中心）', richmond: 'RICHMOND（列治文）', northmel: 'NORTH MEL（北墨尔本）', brunswick: 'BRUNSWICK（布伦瑞克）', more: '「更多」街区（Fitzroy、Collingwood、Carlton 等）'};
const FAV_MAX = 12, GIFT_MAX = 4, GIFT_BEANS = 10; // 好感 cap; gifts of 生豆 (from the idle roastery): +1 each, at most 4 per person

// ---------- progress state (additive: v1 saves keep seen/done; new keys default to empty) ----------
const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(+v) || 0));
function norm(s) { s = obj(s); const f = obj(s.fav), g = obj(s.gifts), ch = {};
  Object.entries(obj(s.choices)).forEach(([k, v]) => { if (Number.isInteger(v) && v >= 0 && v < 4) ch[k] = v; });
  return {v: 2, seen: {...obj(s.seen)}, done: {...obj(s.done)}, choices: ch, fav: {laobei: num(f.laobei, 0, FAV_MAX), che: num(f.che, 0, FAV_MAX)}, gifts: {laobei: num(g.laobei, 0, GIFT_MAX), che: num(g.che, 0, GIFT_MAX)}}; }
function load() { try { return norm(JSON.parse(localStorage.getItem(KEY))); } catch (e) {} return norm(null); }
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---------- objective helpers (x = story context built by app.js) ----------
const area = r => x => x.area(r);
const edu = n => ({id: 'e' + n, t: `咖啡课：通关第 ${n} 章「${EDU_NAMES[n]}」`, need: 1, bool: 1, f: x => (x.rank >= n ? 1 : 0), go: '#/edu'});
const areaG = (r, n, t) => ({id: 'a-' + r, t: t || `在 ${AREA_NAMES[r]} 打卡 ${n} 家不同的店`, need: n, f: area(r), go: '#/map'});

// ---------- the script ----------
// beat = [speaker, text, onlyIfNpcMet?, opts?]; speaker: 'n' 旁白 | you | laobei | xiaodou | che | jin | 'npc:<id>' | 'x:名字|emoji' (one-off local)
// opts: {fx:'shake'|'fade'|'flash', bg:'night' (swap the painted backdrop from here), if:'k1:0' | '!k1:0' | 'f.che>=3' (choice / 好感 condition)}
// ['choice','k1'] = a choice point (see CHOICES). Conditions are evaluated when the scene plays, so earlier answers change later chapters.
const CH = [
 {n: 1, name: '雨后的小巷', sum: '在市中心的小巷里学会「先闻再喝」，找回食谱簿的第一页。巷对面，有人在看这家店。', place: 'city',
  goals: [areaG('city', 2), edu(1)],
  reward: {c: 150, title: '巷口来客'},
  open: [
   ['laobei', '第一课：别急着喝，先闻。咖啡的第一口，其实是从鼻子进来的。'],
   ['laobei', '墨尔本的咖啡，是从小巷（laneway）里长出来的。去 MEL CITY 走走，挑两家不同的店，每一杯都先闻一闻，再喝。'],
   ['xiaodou', '我给你画了张小地图！哪一家都行，没有标准答案。'],
   ['xiaodou', '（压低声音）老焙爷爷，您那顶旧斗笠该收起来了吧？上回又有人在巷口打听「负豆客」，我都不知道怎么答。'],
   ['laobei', '……就说，那个人早不走江湖了。'],
   ['you', '去了要做什么呢？'],
   ['laobei', '用「打卡」记下来——喝了什么、几分、有什么感觉，一句话就好。簿子最爱的，就是这种一句话。'],
   ['laobei', '回来的时候，也上一上我的「咖啡课」第 1 章。学会了，你的鼻子才有名字可以用。'],
   ['you', '好，我去试试。'],
  ],
  close: [
   ['n', '你带着一身咖啡香回到巷口。老焙正在擦那只白瓷杯。'],
   ['laobei', '怎么样？'],
   ['you', '第二家店的那杯，有点像烤面包，还有一点点橙子皮……我也不知道对不对。'],
   ['laobei', '没有对不对。（他笑了）你看，鼻子醒过来了。'],
   ['xiaodou', '老焙爷爷，您看这个！我擦旧菜单板的时候，在后面发现了一张纸！'],
   ['n', '那是一页泛黄的纸，边缘被咖啡染成了浅褐色。上面是一行褪色的钢笔字：'],
   ['n', '「第一页 · 闻。先把世界闻一遍，再决定爱不爱它。——林」'],
   ['laobei', '（他轻轻抚过字迹）……是他的字。就是他的字。'],
   ['laobei', '谢谢你，孩子。这是第一页。'],
   ['n', '小豆去收窗边的杯子，忽然停住了手。'],
   ['n', '巷子对面的电车站台上，站着一个黑长衫的人。他抬头望着旧招牌，望了很久，才转身上了车。', null, {fx: 'shake', bg: 'night'}],
   ['laobei', '（杯子在他手里转了半圈，停住）……不会的。他不会还留着那颗扣子。'],
   ['xiaodou', '老焙爷爷，您认识他？'],
   ['laobei', '……先吃饭吧。'],
   ['n', '你没有再问。可你看见，老焙把那只白瓷杯，放得比平常更轻。'],
  ]},
 {n: 2, name: '豆袋上的名字', sum: '学着读豆袋上的产地和处理法；灰围巾的身影第一次出现，后门的锁却被人动过。', place: 'city',
  goals: [{id: 'beans', t: '在「豆子笔记」里存下 2 包豆子', need: 2, f: x => x.beans, go: '#/beans'}, {id: 'cafes', t: '累计在 4 家不同的店打过卡', need: 4, f: x => x.cafes, go: '#/map'}, edu(2)],
  reward: {c: 180, title: '识豆人'},
  open: [
   ['laobei', '第一页的背面，有一枚小小的豆袋印章。你看——国家、产区、处理法。林说，每一颗豆子都有一张「身份证」。'],
   ['you', '可我连豆袋上写的是什么都看不懂。'],
   ['laobei', '那就拍下来，存进豆子笔记。看多了，字就认得你了。'],
   ['laobei', '还有件怪事。这几天，有人先你一步，去过我常去的几家店。店员说，那人什么也没买，只喝了一杯黑咖啡，留下一朵压干的金合欢花，就走了。'],
   ['xiaodou', '我也见过！灰围巾，短头发，一句话都不说。'],
   ['n', '{season}'],
   ['laobei', '（低声）我年轻时在北边的渡口扛过三年豆子，什么脚印都认得。她的脚印很轻，是怕惊动谁——不像是追我们，倒像是在躲什么。', null, {if: 'f.laobei>=3'}],
   ['laobei', '你多走几家店，说不定会碰上她。……不过别追，慢慢来。'],
  ],
  close: [
   ['n', '你把第二包豆子的名字抄进笔记的时候，一个灰围巾的身影，从咖啡店门口一闪而过。'],
   ['n', '你追出去，只看见一朵压干的金合欢，夹在门框的缝里。花下压着一张小纸条：'],
   ['n', '「别找得太快。有些东西，找回来不如留在原处。——澈」'],
   ['npc:beans', '嗯，这个产区的豆子挑得不错。下次来我这儿，给你看更有意思的。', 'beans'],
   ['you', '澈……是她的名字吗？'],
   ['laobei', '（沉默了一会儿）这个字，我好像在哪里见过。'],
   ['laobei', '不管她是谁——你已经认得出豆子的名字了。这就是很大的进步。'],
   ['n', '回到小店，小豆正举着扫帚站在后门前，脸色发白。'],
   ['xiaodou', '老焙爷爷！后门的锁……被人动过了！', null, {fx: 'shake', bg: 'night'}],
   ['n', '抽屉被翻过，旧账本却整整齐齐。什么都没少，只是柜台上多了一枚黑色的铜扣。'],
   ['laobei', '（他把铜扣攥进手心）……这种扣子，是我当年亲手给一个孩子缝过的。'],
   ['you', '那孩子是谁？'],
   ['laobei', '（他没有回答）把门闩上吧。今晚，我睡在店里。'],
  ]},
 {n: 3, name: '河对岸的火', sum: '到列治文看烘豆；与「澈」第一次说上话，拿到第二页；一个穿黑长衫的人，比你们先到过这里。', place: 'richmond',
  goals: [areaG('richmond', 3), edu(3)],
  reward: {c: 210, title: '烘香学徒'},
  open: [
   ['laobei', '第二页，我猜在河对岸——列治文（Richmond）。那一带有不少自己烘豆的店，空气里全是焦糖味。'],
   ['laobei', '烘焙，是把青涩变成香气的一场火。火候差一点，豆子就换一个性子。'],
   ['xiaodou', '路上会经过 Swan Street 和 Bridge Road，电车很吵，咖啡很香！'],
   ['laobei', '那场火，我从前也烧过。（他看着自己的手）烧得太急，烧坏过一些东西，也烧走过一个人。……去吧，别学我。'],
   ['laobei', '去三家不同的店。顺便听我讲讲「火候的秘密」——咖啡课第 3 章。'],
  ],
  close: [
   ['n', '列治文的傍晚，烘豆机的热气从一家小店的后门飘出来。你正要推门，门里先走出一个人。'],
   ['che', '……又是你。'],
   ['you', '你是「澈」？'],
   ['che', '你手里那张第一页，是老焙给你的吧。'],
   ['che', '我不是来抢的。我只想知道，一个刚到墨尔本的人，凭什么替他们找这本簿子。'],
   ['choice', 'k1'],
   ['che', '（灰围巾下，声音轻了一点）他……真的笑了？他很久没那样笑过了，是吗。', null, {if: 'k1:0'}],
   ['che', '说话算数……（她低声）这个词，爷爷也常挂在嘴上。', null, {if: 'k1:1'}],
   ['che', '（她别过脸）你问得很直。我现在不想答。……但我记住了。', null, {if: 'k1:2'}],
   ['che', '第二页在烘豆间的架子上。去拿吧。我只是路过。'],
   ['npc:dawn', '叮铃——早！这一带的烘豆香味，隔着两条街都闻得到！', 'dawn'],
   ['n', '烘豆师递给你一张折得很小的纸：「第二页 · 烘。火要等豆子自己说话。——林」'],
   ['che', '（走到门口，没有回头）还有一件事。小心一个穿黑长衫的人。他比我们都先到过这里。', null, {fx: 'shake'}],
   ['n', '你回头时，灰围巾已经不见了。烘豆间的后窗开着，窗台上有一道新鲜的泥脚印，朝后巷去了。'],
   ['n', '那脚印，比灰围巾的，大得多。', null, {bg: 'night'}],
  ]},
 {n: 4, name: '九个大气压', sum: '在北墨尔本喝遍浓缩；老焙想起和林的那场争吵与自己的江湖往事，拿到第三页——窗外，贴上了一张名片。', place: 'northmel',
  goals: [areaG('northmel', 3), edu(4)],
  reward: {c: 240, title: '浓缩探路者'},
  open: [
   ['laobei', '第三页在北墨尔本（North Melbourne）。那一带的街道很安静，我和林曾经在那里吵过一架。'],
   ['you', '吵架？为了咖啡？'],
   ['laobei', '为了一杯 espresso。他说粉要再细一点，我说要再粗一点，吵了一整晚，谁也没说服谁，只好各做一杯，让客人选。'],
   ['laobei', '那时我刚从北边的渡口回来，背上还背着半袋走了三千里的豆子，脾气臭得很。'],
   ['xiaodou', '老焙爷爷当年是「负豆客」！背着豆子走江湖，一路换故事！'],
   ['laobei', '（咳）别听她吹。……我只是个不肯停下来的人，直到遇见林。'],
   ['laobei', '那天的第一位客人，两杯都喝完了，说：「都好喝。不过你们俩，为什么不一起做呢？」'],
   ['laobei', '我有一套「一爆心法」，是在一场大雨里想出来的。我只教过两个人。一个是林，一个……（他没有说完）', null, {if: 'f.laobei>=3'}],
   ['xiaodou', '哇，那位客人才是真正的高手。'],
   ['laobei', '所以，去喝几杯浓缩吧，看看九个大气压下，各家店是怎么说话的。三家店，加上咖啡课第 4 章。'],
  ],
  close: [
   ['n', '你坐在北墨尔本的窗边，面前是三杯风格各异的浓缩。{season}'],
   ['sleepy', '', 'sleepy'],
   ['you', '每一杯都不一样。有的酸，有的苦，有的……像黑巧克力。'],
   ['laobei', '（听完，他的眼眶有点红）孩子，当年那位客人说的话，我忘了三十年，今天终于想起来了。'],
   ['laobei', '「你们为什么不一起做呢？」——后来，林真的把我们的两个配方合在了一起。那就是「第一杯」。'],
   ['laobei', '配方的一半，我想起来了。另一半……还在簿子里。'],
   ['n', '小豆递来第三页——它被压在北墨尔本一家店的老咖啡机底下：「第三页 · 萃。一杯咖啡，是两个人争出来的。——林」'],
   ['n', '窗台上，又多了一朵压干的金合欢。花下压着一行小字：「他真的笑了吗？」', null, {if: 'k1:0'}],
   ['n', '窗台上，又多了一朵压干的金合欢。花下压着一行小字：「说话算数的人不多。继续走。」', null, {if: '!k1:0 & !k1:2'}],
   ['n', '窗台上，又多了一朵压干的金合欢。花下压着一行小字：「你问我为什么躲。等我准备好，我自己告诉你。」', null, {if: 'k1:2'}],
   ['n', '玻璃忽然被敲了一下。窗外，一个黑长衫的人影把一张名片贴在玻璃上，转身走了。', null, {fx: 'shake', bg: 'night'}],
   ['n', '名片上只有两个字：「远焙」。背面一行钢笔字：「簿子，我来取。」'],
   ['laobei', '（脸色一下子白了）远……（他没有说下去，攥紧了那只杯子）'],
   ['xiaodou', '老焙爷爷，您的手在抖。'],
   ['laobei', '没事。……只是想起了一个，我最不想想起的人。'],
  ]},
 {n: 5, name: '奶泡里的人情', sum: '在布伦瑞克学会写下「人说了什么」，拿到第四页；灰围巾站在街对面——她身后，有人。', place: 'brunswick',
  goals: [areaG('brunswick', 3), {id: 'notes', t: '给 3 次打卡写下心得（一句话就够）', need: 3, f: x => x.notes, go: '#/map'}, edu(5)],
  reward: {c: 270, title: '街角常客', item: 'wandercoat'},
  open: [
   ['xiaodou', '第四页的线索在布伦瑞克（Brunswick）！Sydney Road 上热闹得很，什么口音都有。'],
   ['laobei', '那一带的咖啡馆，更像邻居的客厅。奶咖在那里不是一杯饮料，是一句「今天过得怎么样」。'],
   ['laobei', '林最爱待在那里。他说，咖啡师做的不是咖啡，是让陌生人愿意多坐五分钟。'],
   ['laobei', '这几天我总觉得有人在跟着我们。你多留个心——人多的地方，反而安全。'],
   ['laobei', '这次有点不一样：打卡的时候，写下你对这杯咖啡、这家店的一句话。簿子里最珍贵的不是配方，是「人说了什么」。'],
  ],
  close: [
   ['n', '你翻着自己写下的几条心得：「奶泡像云」「老板记得我的名字」「下雨天的窗边最好」……'],
   ['laobei', '（他一条一条念出来）……「老板记得我的名字」。孩子，这就是第四页要告诉我们的。'],
   ['npc:regular', '（窗边的老先生朝你们点点头）这家店的奶泡，三十年没变过。', 'regular'],
   ['n', '你们一起翻开从旧邮箱里取出的那张纸：「第四页 · 人。咖啡是借口，陪伴才是正题。——林」'],
   ['laobei', '林最后几年，夜里总睡不着。他说想起好多客人的脸……（他望向窗外）我那时候，连一封信都没有回给他。', null, {if: 'f.laobei>=5'}],
   ['xiaodou', '簿子已经找回四页啦！只剩……'],
   ['laobei', '（轻声）封面，和最后一样东西。'],
   ['n', '窗外，一个灰围巾的身影，静静地站在街对面。这一次，她没有躲开。'],
   ['n', '可就在她身后三十步，一个黑长衫的人也停住了脚。他看着她，像看着一只终于落地的鸟。', null, {fx: 'shake', bg: 'night'}],
   ['laobei', '（他猛地站起来，椅子倒在地上）……澈，快走！'],
   ['n', '灰围巾的人影一晃，已经没入了 Sydney Road 的人群。黑长衫抬眼，朝窗里看了一眼，微微一笑。'],
  ]},
 {n: 6, name: '清澈', sum: '去更远的街区喝滤泡；「澈」说出自己的名字和心结，把一封旧信交到你手上。', place: 'more',
  goals: [{id: 'a-more', t: `在 ${AREA_NAMES.more} 打卡 3 家不同的店`, need: 3, f: area('more'), go: '#/map'}, edu(6)],
  reward: {c: 300, title: '清澈之友'},
  open: [
   ['xiaodou', '昨天她身后有人。我看见了。她被追着跑，却一次也没有回头……'],
   ['laobei', '那位姑娘在躲着我们，也在躲着别人。可她留下的花，一朵比一朵走得远——Fitzroy、Collingwood、Carlton……这些名字，林都念过。'],
   ['npc:rain', '起风了。出门前，记得看一眼天。', 'rain'],
   ['laobei', '她喝的总是滤泡咖啡。林说过，滤泡是最诚实的一种，什么都藏不住——人也是。'],
   ['xiaodou', '所以我们去喝一杯 filter，顺便听听她想说什么？'],
   ['laobei', '去「更多」的街区吧，三家店。再上咖啡课第 6 章，学一学怎么冲一壶清澈的。'],
  ],
  close: [
   ['n', '在一家安静的小店里，你点了一杯手冲。水慢慢滴下，杯里清澈得能看见杯底。'],
   ['che', '你很能走。'],
   ['you', '你一直在等我走到这里，对吗？'],
   ['che', '……我叫林澈。林，是林叔的林。他是我爷爷。'],
   ['che', '爷爷走的那天，老焙没有出现。我一直以为，他把爷爷忘了。'],
   ['che', '一年前，有个人找到我，说他认识爷爷。他说，老焙早就拿着配方换了钱，把爷爷一个人丢在了小店里。'],
   ['you', '……穿黑长衫的人？'],
   ['che', '（点头）他要我把簿子交给他「保管」，说那才叫物归原主。我没有答应。可我也……没有完全不信。', null, {fx: 'shake'}],
   ['che', '所以我一直躲着老焙。我怕见了他，会发现那个人说的是真的。', null, {bg: 'river'}],
   ['che', '簿子的封面和最后一样东西在我这儿。爷爷留话说：要等「一个肯慢慢喝咖啡的人」，带着老焙一起来拿。'],
   ['you', '我会带他来的。我保证。'],
   ['che', '那就先练好你的本事。老焙的舌头不灵，是因为他不敢相信自己。你帮帮他。'],
   ['n', '澈从背包里取出一只旧信封，封口的火漆已经褪成暗红。'],
   ['che', '这是爷爷留给老焙的信。我一直没敢给他。……你说，现在给，还是等杯测以后？'],
   ['choice', 'k2'],
   ['che', '（把信递到你手里，指尖在发抖）好。你替我给他。我怕见到他的脸，会先哭出来。', null, {if: 'k2:0'}],
   ['che', '（点头，把信收回去）也好。让他先把舌头找回来。信，等杯测完，我亲手给他。', null, {if: '!k2:0'}],
   ['che', '（轻轻）这一路，谢谢你没有追问我。', null, {if: 'f.che>=3'}],
   ['n', '咖啡店的玻璃窗映出街对面一道黑色的影子。等你再看，那里什么也没有了。', null, {fx: 'fade'}],
  ]},
 {n: 7, name: '舌尖的地图', sum: '老焙鼓起勇气重新杯测，舌头与记忆一起回来；一夜之间，巷对面多了一块黑色的招牌。', place: 'city',
  goals: [edu(7), {id: 'rate', t: '给 6 杯咖啡打分（累计）', need: 6, f: x => x.rated, go: '#/map'}, {id: 'sca', t: '加分：在「SCA 题库」掌握 1 个模块', need: 1, f: x => x.sca, go: '#/sca', opt: 1}],
  reward: {c: 330, title: '舌尖旅人'},
  open: [
   ['laobei', '孩子，我想求你一件事。……我想再试一次杯测。可我怕，怕自己的舌头真的不行了。'],
   ['n', '你把澈托你的信放在木桌上。老焙看着火漆，很久没有动。', null, {if: 'k2:0'}],
   ['laobei', '（读完信，他用袖子按了按眼睛）……他说，当年的话，不怪我。他说，他早就不怪我了。', null, {if: 'k2:0'}],
   ['laobei', '这封信里，还有一个名字。我先不说。……杯测要的是干净的鼻子，我先把它放一放。', null, {if: 'k2:0'}],
   ['you', '我陪您。'],
   ['laobei', '杯测要的不是「好喝」，是「说得出」。你先练：多打分、多记，每一杯都想想它像什么。'],
   ['npc:streak', '每天一杯，每天一笔——舌头也是练出来的。', 'streak'],
   ['xiaodou', '我来把杯子洗得干干净净！'],
   ['laobei', '通关咖啡课第 7 章，再给 6 杯咖啡打过分。然后——我们开一场只有三个人的杯测。'],
  ],
  close: [
   ['n', '小巷尽头，旧店的卷帘门拉起了一半。老焙把八只白瓷杯整整齐齐排在木桌上。'],
   ['laobei', '干香……湿香……（他深吸一口气）破渣。'],
   ['you', '像熟透的柑橘，后面有一点点焦糖。'],
   ['laobei', '（他抿了一口，闭上眼睛）……是「第一杯」。孩子，是第一杯的味道。'],
   ['xiaodou', '老焙爷爷……您哭啦？'],
   ['laobei', '老了，鼻子酸。（笑）我的舌头回来了。是你把它还给了我。'],
   ['n', '门口的光暗了一下。灰围巾的人站在那里，手里捏着那只旧信封，指节发白。', null, {if: 'k2:1'}],
   ['che', '（走近，把信放在桌上）这是爷爷留给你的。……我等了很久，才有勇气给你。', null, {if: 'k2:1'}],
   ['laobei', '（拆开信，一字一字念出声）「老友：当年的话，是我说重了。你守着心法，是怕它被人拿去换钱，我懂。」', null, {if: 'k2:1'}],
   ['laobei', '「可那孩子……远，他只是跑得太快，忘了回头。若他回来，替我给他一个座位。」', null, {if: 'k2:1'}],
   ['laobei', '（他握着信纸）林留给我的话里，一直有那个名字。……远。我欠他的，比欠林的还多。', null, {if: 'k2:0'}],
   ['che', '（低声）我爷爷的字里，也有我不知道的事。……我想，我该听完这个故事。', null, {if: 'f.che>=3'}],
   ['n', '正说着，小豆从门外冲进来，气都喘不匀。'],
   ['xiaodou', '巷子对面……对面的卷帘门……换招牌了！', null, {fx: 'shake', bg: 'night'}],
   ['n', '一夜之间，对面那家倒闭多年的店面换上了漆黑的招牌，金字烫着：「远焙 · 第 128 家分店」。'],
   ['n', '招牌角落印着一只小小的杯子——和「第一颗」旧招牌上的，一模一样。'],
   ['laobei', '（缓缓站起身，声音很轻）他把我们的名字，印在了他的杯子上。'],
  ]},
 {n: 8, name: '墨尔本的咖啡魂', sum: '把整座城走得更宽；老焙说出三十年前的真相，与林澈在巷口和解——而「远焙」的主人，就站在巷口。', place: 'city',
  goals: [edu(8), {id: 'cafes', t: '累计在 14 家不同的店打过卡', need: 14, f: x => x.cafes, go: '#/map'}, {id: 'photo', t: '拍照打卡 3 次，把这座城的样子留下来', need: 3, f: x => x.photos, go: '#/map'}],
  reward: {c: 360, title: '咖啡魂守护者'},
  open: [
   ['laobei', '你该知道他是谁了。他叫金远。三十多年前，是我和林收的唯一一个徒弟。'],
   ['laobei', '他聪明，手快，鼻子比我还灵。我把「一爆心法」一字一句教给了他。后来我发现，他夜里偷抄簿子。'],
   ['laobei', '我骂了他。林替他求情，我不听。第二天，他就走了。林和我，也从此没再说过一句整话。'],
   ['laobei', '我年轻时是个负豆客，心法是我自己的命。我怕它被人拿去换钱，结果把最该信的人赶走了。'],
   ['laobei', '（他取下墙上的旧斗笠，戴在你头上）走远路的人，都该有顶斗笠。这是我年轻时戴过的。', null, {if: 'f.laobei>=5'}],
   ['laobei', '最近我总想起一件事。很多年前，墨尔本的咖啡，还没有今天这么多人爱。那时候，从意大利、希腊来的老师傅，把浓缩咖啡机搬进了小巷。'],
   ['you', '现在，满街都是咖啡馆了。'],
   ['laobei', '是啊。咖啡魂不在豆子里，也不在机器里，在一杯一杯被认真喝掉的时候。'],
   ['npc:fest', '听说巷子里要办小小的咖啡会？我来挂彩旗！', 'fest'],
   ['laobei', '去把这座城走得再宽一点，多走几家，拍几张照片，记下它的样子。……我有个预感，澈会在巷口等我们。'],
  ],
  close: [
   ['n', '旧店门口，老焙站了很久，手里握着一把生了锈的钥匙。'],
   ['che', '（从巷口走来）我听说，你们在找最后两样东西。'],
   ['laobei', '澈。你长得……像你爷爷。'],
   ['che', '我爷爷下葬那天，你没有来。'],
   ['laobei', '我来了。我站在最后一排。我看着你抱着他的相片，不敢走过去。簿子是我们两个人的，我怕一开口，就得承认他真的不在了。'],
   ['che', '……我一直以为，你忘了他。'],
   ['laobei', '三十多年，我天天都想他。只是不敢翻那本簿子。'],
   ['che', '那个人告诉我，你早把配方卖了。……是我，信了不该信的话。对不起。', null, {if: 'f.che>=3'}],
   ['laobei', '你有一点没有信错：我欠林的，我欠你的，都是真的。'],
   ['n', '小巷里静了好一会儿。远处，一辆电车叮叮当当地驶过。'],
   ['npc:hash', '店会关，招牌会换，可只要还有人记得那杯的味道，它就还在。', 'hash'],
   ['che', '爷爷说，等「一个肯慢慢喝咖啡的人」带着你来，才可以把这个交给你们。'],
   ['n', '她从背包里取出一只旧铁盒和一张封面纸。盒盖上刻着一行小字：「把四页的味道，合成第一杯。」'],
   ['che', '（看着你）谢谢你，没有放弃找我。'],
   ['n', '巷口的电车叮的一声停住。一个黑长衫的人从车上走下来，身后跟着两个提公文箱的人。', null, {fx: 'shake', bg: 'duel'}],
   ['jin', '老师。三十年了。'],
   ['jin', '三天后，「远焙」新店在这条巷口开张。到那天，簿子、铁盒，还有「第一颗」这个名字——我来取。'],
   ['che', '（挡到老焙身前）你休想。', null, {if: 'f.che>=3'}],
   ['laobei', '（沉默片刻，把钥匙握紧）……远儿，你长高了。'],
   ['jin', '您，老了。'],
   ['n', '黑长衫转身离去。巷口的风，吹得旧招牌吱呀作响。', null, {fx: 'fade'}],
  ]},
 {n: 9, name: '第一颗豆', sum: '走遍四个街区，在旧店里合成「第一杯」；三天之约到了，簿子归谁？铁盒里的秘密揭晓。', place: 'city',
  goals: [{id: 'tour', t: '走遍四个街区：MEL CITY、RICHMOND、NORTH MEL、BRUNSWICK 各打卡 4 家不同的店', need: 16, f: x => AREAS.reduce((s, r) => s + Math.min(4, x.area(r)), 0), go: '#/map'},
   {id: 'beans4', t: '在「豆子笔记」里存下 4 包豆子', need: 4, f: x => x.beans, go: '#/beans'}, {id: 'lv', t: '成长到 Lv.8（烘焙大师）', need: 8, f: x => x.lv, go: '#/footprint'},
   {id: 'sca', t: '加分：在「SCA 题库」掌握 3 个模块', need: 3, f: x => x.sca, go: '#/sca', opt: 1}],
  reward: {c: 500, title: '第一颗豆', item: 'recipe'},
  open: [
   ['laobei', '铁盒打不开。盖子上刻着一行字：「把四页的味道，合成第一杯。」'],
   ['che', '爷爷的字谜，永远这么含蓄。'],
   ['laobei', '配方我想起了一半。闻、烘、萃、人——四页的味道，要在你自己的舌头上走一遍，才合得成一杯。'],
   ['you', '怎么走？'],
   ['laobei', '把四个街区各走几家，每家都认真喝一杯，记一笔。再把你喜欢的豆子存进笔记，我拿它们来拼。'],
   ['n', '三天的期限，像一盏越烧越短的灯。巷口对面，「远焙」的工人正在一箱一箱往里搬机器。'],
   ['xiaodou', '他们的机器好亮好新……我们的烘豆机，三十年没点过火了。'],
   ['laobei', '新的，不一定是对的。旧的，也不一定是输的。'],
   ['che', '我陪你去。这一次，我不躲了。'],
   ['xiaodou', '我守着店，等你们回来！'],
  ],
  close: [
   ['n', '旧店的卷帘门完全拉了起来。三十年没点燃的烘豆机，发出了第一声低低的轰鸣。'],
   ['laobei', '火候看你的了，孩子。我只管听。'],
   ['you', '一爆了……'],
   ['laobei', '再等等。等它自己说话。'],
   ['che', '（轻声）爷爷也是这样说的。'],
   ['n', '研磨，注水，蒸汽。三只小小的白瓷杯，并排放在木桌上。'],
   ['che', '……是第一杯。可是，和爷爷做的不一样。'],
   ['laobei', '当然不一样。这一杯，是你的。'],
   ['n', '卷帘门被人整个拉到了顶。逆光里，站着那件黑长衫。', null, {fx: 'shake', bg: 'duel'}],
   ['jin', '老师，您用的，还是那口旧锅。'],
   ['laobei', '远儿。'],
   ['jin', '我不是来喝茶的。簿子、铁盒，还有「第一颗」这个名字。交给我，我保证这家老店能活下去。'],
   ['che', '你的「保证」，一年前，我听过一次。'],
   ['jin', '（看向你）你。替他们走了这么远的人。你来说——簿子，该给谁？'],
   ['choice', 'k3'],
   ['jin', '（愣住）……坐下？我？', null, {if: 'k3:0'}],
   ['laobei', '远儿，坐。这一锅豆，是你走了以后，我第一次用你当年的火候烘的。', null, {if: 'k3:0'}],
   ['n', '金远迟疑了很久，终于在木桌前坐下，端起那只白瓷杯。', null, {if: 'k3:0'}],
   ['jin', '……是一爆。是我当年因为它被您骂的那一爆。（他的手有点抖）', null, {if: 'k3:0'}],
   ['laobei', '远儿。当年的话，是我说重了。我怕心法被人拿去换钱，却把最该信的人赶走了。', null, {if: 'k3:1'}],
   ['jin', '（冷笑，眼眶却红了）您现在才说。', null, {if: 'k3:1'}],
   ['laobei', '三十年，我欠你一句对不起。你偷抄是错，可你的鼻子，没有错。', null, {if: 'k3:1'}],
   ['jin', '……心法，我不要了。我只想听您说，我当年没有全错。', null, {if: 'k3:1'}],
   ['jin', '我造了一百二十八家店，每一家的咖啡，都喝不出这一杯的味道。', null, {fx: 'fade'}],
   ['n', '桌角的铁盒，轻轻响了一声。澈打开了它——里面是一小袋旧生豆，和一张折起来的信。'],
   ['che', '（念）「给下一个肯慢慢喝咖啡的人：第一颗豆，不是豆子。是第一个，愿意为了一杯咖啡走很远的人。」'],
   ['che', '（念）「若远回来了，替我给他一个座位。他不是坏，只是跑得太快。——林」', null, {bg: 'dawn'}],
   ['jin', '（背过身去，肩膀轻轻起伏）……老师，您从来没跟我说过，林先生还给我留了座位。'],
   ['laobei', '第一个愿意为一杯咖啡走很远的人……（他看向你）原来如此。'],
   ['xiaodou', '所以「第一颗豆」是……'],
   ['laobei', '不是豆，是你呀。'],
   ['n', '铁盒的底板松了。盒底有一行更小的字：「簿子的最后一页，留空。」', null, {fx: 'flash'}],
  ]},
];

// ---------- choices: three answers that change later dialogue, 好感, and the ending ----------
const CHOICES = {
 k1: {scene: 'c3c', ask: '「凭什么是你？」澈在等你的回答。', def: 1, opts: [
   {t: '「因为老焙笑了。他很久没那样笑过了。」', fav: {laobei: 1, che: 1}},
   {t: '「因为我答应了他。我说话算数。」', fav: {laobei: 2}},
   {t: '「也许不凭什么。可你为什么一直躲着我们？」', fav: {che: 2}}]},
 k2: {scene: 'c6c', ask: '这封信，现在给老焙，还是等杯测以后？', def: 1, opts: [
   {t: '「现在就给他。他有权利早点知道。」', fav: {laobei: 2}},
   {t: '「等杯测以后。让他先用自己的舌头把「第一杯」找回来。」', fav: {laobei: 1, che: 1}}]},
 k3: {scene: 'c9c', ask: '簿子，该给谁？', def: 0, opts: [
   {t: '「簿子不属于任何人。你先坐下，喝一杯。」', fav: {laobei: 1, che: 1}},
   {t: '「老师欠你的话，让他当面说。簿子不是拿来谈这件事的。」', fav: {laobei: 2}}]},
};
const ENDINGS = {lamp: {name: '老店新灯', sum: '老焙留在巷口，和澈一起重开「第一颗」；金远在窗边坐了下来。'}, road: {name: '江湖再见', sum: '老焙带着金远重新上路，把心法送给愿意学的人；「第一颗」交给澈。'}};

const PRO = {id: 'pro', place: 'city', card: ['序章', '巷口的灯'], lines: [
 ['n', '墨尔本。你拖着行李箱，在电车的叮当声里走出弗林德斯街车站，一路拐进一条没来过的小巷。'],
 ['n', '{season}'],
 ['you', '（我只知道，咖啡是这座城市最出名的东西之一。可我连 flat white 和 latte 有什么不同，都分不清……）'],
 ['xiaodou', '欢迎光临！刚下过雨呢，进来坐吧。看你拖着箱子，是刚到的？'],
 ['you', '嗯，第一次来墨尔本。想喝点什么，可菜单上的词我一个也不认识。'],
 ['xiaodou', '哈哈，别担心。我叫小豆，在这家店做咖啡师。这样吧——今天这一杯，就喝「老样子」。'],
 ['n', '她递来一只小小的白瓷杯。你低头闻了闻：像刚淋过雨的草地，又带一点点焦糖的甜。'],
 ['you', '……像雨后的草地。'],
 ['n', '窗边的老人，手里的杯子停在了半空。'],
 ['laobei', '雨后的草地。孩子，你是第一个对我说出这句话的人——除了我的老伙计。'],
 ['xiaodou', '老焙爷爷！您终于肯开口啦。这位是老焙，从前在这条巷子里开过自己的烘豆小店，可厉害了。'],
 ['laobei', '厉害什么，早关门了。我和老伙计林，当年开过一间小店，叫「第一颗」。我们有一本簿子，不光记配方，还记每位客人那天喝了什么、说了什么。'],
 ['laobei', '林走以前，把簿子拆成了几页，托几位老朋友收在城里不同街区的咖啡馆里。他只留了一句话：「等一个肯慢慢喝咖啡的人。」'],
 ['laobei', '我年纪大了，舌头也不灵了。我连第一杯的味道，都想不起来了。'],
 ['you', '可是老爷爷，我不懂咖啡。'],
 ['laobei', '不懂才好。懂的人总想着「应该是什么味道」，不懂的人，才会说「像雨后的草地」。'],
 ['laobei', '（他把靠在窗边的旧斗笠往里挪了挪）我年轻时走过很多地方，背豆，也背故事。如今只想把一件事做完。'],
 ['laobei', '你愿意陪我这个老头子，把簿子一页一页找回来吗？我教你认豆子，你替我去喝。'],
 ['n', '你点了点头。窗外的雨停了，巷口那盏旧灯，忽然亮了起来。'],
 ['n', '灯光照不到的地方，电车站台的阴影里，有人悄悄收回了目光。', null, {fx: 'shake', bg: 'night'}],
]};

const EPI = {id: 'epi', place: 'city', card: ['尾声', '新的一页'], reward: {c: 200, title: '续写食谱簿的人'}, lines: [
 ['n', '后来。', null, {fx: 'fade'}],
 ['n', '{season}'],
 ['laobei', '簿子重新装订好了。封面是澈补画的，里面是林的四页，还有——'],
 ['laobei', '新的一页。空白的。'],
 ['xiaodou', '我负责把簿子放在吧台上，谁来了都可以翻！'],
 ['npc:master', '老焙，好久不见。这一杯，敬那本簿子。', 'master'],
 ['npc:tap', '叮——新的一页！', 'tap'],
 ['n', '「第一颗」的招牌，重新挂回了巷口。对面，「远焙」的黑色招牌也静静亮着，只是少了一半的灯。', null, {if: 'k3:0'}],
 ['che', '「第一颗」只卖三种咖啡，每天只开半天。剩下的时间，我们陪客人坐一会儿。', null, {if: 'k3:0'}],
 ['jin', '（站在门口，没有进来）……我的店里，今天多了一款「一爆」。你们尝尝。', null, {if: 'k3:0'}],
 ['laobei', '远儿，进来坐。你的杯子，我洗好了。', null, {if: 'k3:0'}],
 ['n', '那只缺口的陶杯，被老焙轻轻放在金远手边。窗外的巷口，亮着一盏新点的灯。', null, {if: 'k3:0'}],
 ['n', '「第一颗」的招牌挂回了巷口，掌柜是澈。墙上那顶旧斗笠，却已经不在了。', null, {if: 'k3:1'}],
 ['laobei', '我要出趟远门。把「一爆心法」抄一百份，送到每一个愿意学的人手里。', null, {if: 'k3:1'}],
 ['jin', '（背着豆驮子，站在巷口等）老师，该走了。', null, {if: 'k3:1'}],
 ['che', '（笑着挥手）路上慢慢喝。三个月不回来，我就把您的杯子收了。', null, {if: 'k3:1'}],
 ['laobei', '江湖再见，孩子。下一页，你来写。', null, {if: 'k3:1'}],
 ['che', '（把最后一页空白纸递到你手里）这一页，我想让你来写第一行。', null, {if: 'f.che>=5'}],
 ['laobei', '这些年我欠了太多人一句话。幸好，最后有你替我说完。', null, {if: 'f.laobei>=5'}],
 ['laobei', '你不用再替我找了。但如果你还愿意继续——'],
 ['laobei', '每喝一杯，就在打卡里写一句话吧。这本簿子，现在是你的了。它的每一页，都是一杯咖啡。'],
 ['you', '那我先去喝一杯。'],
 ['n', '墨尔本的小巷里，还有很多家咖啡馆，在等你推门。'],
]};

// ---------- 食谱簿的散页: each found page is an item you can read, with 林's handwriting (sp = vignette index in img/xuan/pg-sheet.webp) ----------
const PAGES = [
 {id: 'p1', n: 1, ch: 1, sp: 0, ic: '👃', name: '第一页 · 闻', head: '先把世界闻一遍，再决定爱不爱它。', note: '老焙总说「先喝」，我偏要先闻。\n他后来也学会了——只是死不承认。\n（页脚用铅笔添了一行：小豆这孩子鼻子灵，别让她只会擦桌子。）'},
 {id: 'p2', n: 2, ch: 3, sp: 1, ic: '🔥', name: '第二页 · 烘', head: '火要等豆子自己说话。', note: '老焙烘豆总是急，一爆刚响就想下豆。\n我拉住他的手，说：等。他瞪我一眼，最后还是等了。\n那一锅，成了「第一杯」的底子。'},
 {id: 'p3', n: 3, ch: 4, sp: 2, ic: '☕', name: '第三页 · 萃', head: '一杯咖啡，是两个人争出来的。', note: '他要粗，我要细，谁也不让谁。\n后来客人说：你们为什么不一起做呢？\n我把这句话抄在这里，免得自己哪天又犯倔。'},
 {id: 'p4', n: 4, ch: 5, sp: 3, ic: '🫂', name: '第四页 · 人', head: '咖啡是借口，陪伴才是正题。', note: '最近夜里总睡不着，想起很多客人的脸。\n要是我走在前头，老焙，别一个人守着店。\n去看看窗边坐着的人。'},
 {id: 'p5', n: 5, ch: 8, sp: 4, ic: '📕', name: '封面 · 第一颗', head: '本来想叫「两个人」，老焙说太肉麻。', note: '封面留给以后吧。\n等簿子被找回来，让最年轻的那个人来画。\n（画得丑也没关系，咖啡也是越喝越好喝的。）'},
 {id: 'p6', n: 6, ch: 9, sp: 5, ic: '💌', name: '最后一页 · 给走远路的人', head: '第一颗豆，不是豆子。', note: '是第一个，愿意为了一杯咖啡走很远的人。\n若远回来了，替我给他一个座位。\n他不是坏，只是跑得太快，忘了回头。\n——林'},
];

// ---------- 支线 (side stories): short scenes triggered by check-ins in an area; each pays a little and some deepen 好感 ----------
const SIDE = [
 {id: 's-city1', area: 'city', n: 2, title: '电车站的伞', c: 40, lines: [
  ['n', 'Flinders Street 的台阶上，一把黄伞在雨里转了半圈，停在你面前。'],
  ['x:路过的老太太|👵', '年轻人，你的咖啡要洒了。——这杯是 long black？我年轻时，只喝加糖的。'],
  ['you', '您现在不加了吗？'],
  ['x:路过的老太太|👵', '加。只是不敢让孙子看见。（她压低声音）每个人都有一杯不好意思说的咖啡。'],
  ['n', '她把伞塞进你手里，说「下次还我」，就挤上了电车。伞柄上缠着一圈褪色的布条。'],
 ]},
 {id: 's-city2', area: 'city', n: 5, title: '小巷里的规矩', c: 60, fav: {laobei: 1}, lines: [
  ['xiaodou', '老焙爷爷，有游客在巷子里拍照，挡住了送货的小车！'],
  ['laobei', '拍吧。但要记得让路，记得对咖啡师说谢谢。巷子是大家的客厅。'],
  ['you', '这是规矩吗？'],
  ['laobei', '是人情。（他笑了）小巷里没有写下来的规矩，比马路上的红绿灯还管用。'],
  ['n', '你侧身让过一辆送奶的小推车，推车的人朝你竖起了大拇指。'],
 ]},
 {id: 's-rich1', area: 'richmond', n: 2, title: '一锅刚出炉的豆', c: 40, lines: [
  ['n', '列治文的午后，Swan Street 的电车拖着长长的铃声。'],
  ['x:烘豆学徒|🧑‍🍳', '别靠太近！刚出锅的豆子会烫。不过，你可以闻。深吸一口。'],
  ['you', '像烤坚果，又像焦糖。'],
  ['x:烘豆学徒|🧑‍🍳', '这就对了。老板说，会闻的人，舌头迟早会跟上。'],
  ['n', '他抓了一小撮递给你。豆子在掌心里“滴答”作响，像一场很小很小的雨。'],
 ]},
 {id: 's-rich2', area: 'richmond', n: 4, need: 3, title: '空着的座位', c: 60, fav: {che: 1}, lines: [
  ['n', '你在 Bridge Road 的一家店里，看见窗边多了一个空座位，桌上摆着一只倒扣的杯子。'],
  ['che', '（从你身后走来）别碰。那是留给爷爷的。我每次路过，都会点一杯，放着，等它凉。'],
  ['you', '凉了以后呢？'],
  ['che', '我喝掉。……这样，每一杯，都算他请的。'],
  ['n', '她把凉了的咖啡一口喝完，朝你点了点头，转身融进了电车的叮当声里。'],
 ]},
 {id: 's-nm1', area: 'northmel', n: 2, title: '凌晨四点的第一杯', c: 40, lines: [
  ['x:夜班咖啡师|🌙', '凌晨四点的第一杯，是给送牛奶和开电车的人的。'],
  ['you', '你不困吗？'],
  ['x:夜班咖啡师|🌙', '困。可他们说“谢谢”的时候，我就不困了。'],
  ['n', '窗外，第一班电车的灯光划过。你把杯里最后一口喝完，觉得今天格外清醒。'],
 ]},
 {id: 's-nm2', area: 'northmel', n: 4, title: '老机器的脾气', c: 60, fav: {laobei: 1}, lines: [
  ['laobei', '北墨尔本这台老机器，脾气大得很：早上要等它热，傍晚要哄它。'],
  ['xiaodou', '像不像您？'],
  ['laobei', '（瞪眼）……像。所以我们处得好。'],
  ['you', '机器也会有脾气吗？'],
  ['laobei', '所有被用了很多年的东西，都会有。别嫌它，等它。'],
  ['n', '蒸汽“嘶”地一响，像是笑了一声。'],
 ]},
 {id: 's-br1', area: 'brunswick', n: 2, title: 'Sydney Road 的黄油香', c: 40, lines: [
  ['n', 'Sydney Road 的面包店和咖啡馆挨在一起，一阵黄油香扑面而来。'],
  ['x:面包店阿姨|🥐', '孩子，配咖啡吃，别配水。这家的可颂，是和隔壁的奶泡一起长大的。'],
  ['you', '它们认识？'],
  ['x:面包店阿姨|🥐', '认识三十年啦。（她笑）这条街上，什么都是邻居。'],
  ['n', '你把最后一口可颂就着最后一口奶咖咽下去。烫，甜，刚刚好。'],
 ]},
 {id: 's-br2', area: 'brunswick', n: 4, title: '墙上的便利贴', c: 60, fav: {laobei: 1}, lines: [
  ['n', '一家小店的墙上，贴满了客人留下的便利贴。'],
  ['x:常客|📝', '这面墙，是大家写给咖啡师的信。你看这张：「谢谢你记得我不加糖。」'],
  ['you', '我也可以写吗？'],
  ['x:常客|📝', '写吧。一句话就够。'],
  ['n', '你写下了一句话，贴在了最底下的角落。回头一看，老焙不知什么时候站在了你身后，也在偷偷看。'],
  ['laobei', '……嗯，字写得不赖。（他假装在看菜单）'],
 ]},
 {id: 's-more1', area: 'more', n: 2, title: '会换衣服的猫', c: 40, lines: [
  ['n', 'Fitzroy 的小巷墙上，涂鸦一层盖一层，最新的一幅，是一只举着咖啡杯的猫。'],
  ['x:涂鸦少年|🎨', '那只猫每周都会换一件衣服。昨天它戴着围巾。'],
  ['you', '围巾是什么颜色？'],
  ['x:涂鸦少年|🎨', '灰的。有人说，是画给一个总爱在这一带走来走去的姑娘。'],
 ]},
 {id: 's-more2', area: 'more', n: 4, title: '书店里的滤泡', c: 60, lines: [
  ['n', 'Carlton 的一家书店里，书架尽头藏着一台小小的咖啡机。'],
  ['x:书店老板|📚', '读书的人，需要一杯不会抢戏的咖啡。'],
  ['you', '什么样的咖啡不抢戏？'],
  ['x:书店老板|📚', '一杯滤泡。它陪你读完一页，再陪你读完下一页，从来不催你。'],
  ['n', '你翻开一本书，咖啡的热气在书页上轻轻晕开了一圈。'],
 ]},
];

const SEASONS = {
 spring: '春天的墨尔本说变就变——上午艳阳，下午骤雨，巷子里的金合欢开得一团金黄。',
 summer: '夏日的午后热得发白，冰咖啡的杯壁上全是水珠，连电车都慢吞吞的。',
 autumn: '秋天的巷子里落满了梧桐叶，咖啡的热气在凉风里格外明显。',
 winter: '冬天的清晨又冷又灰，路上的人都捧着一杯热的 flat white 取暖。',
};
const season = (d = new Date()) => { const m = d.getMonth() + 1; return m >= 9 && m <= 11 ? 'spring' : m === 12 || m <= 2 ? 'summer' : m <= 5 ? 'autumn' : 'winter'; };

// painted backdrop per scene (古风 skin; img/xuan/sc-<name>.webp, lazy-loaded); a beat's opts.bg swaps it from that beat on
const SCENE_BG = {pro: 'alley', c1o: 'alley', c1c: 'alley', c2o: 'oldshop', c2c: 'oldshop', c3o: 'forge', c3c: 'forge', c4o: 'oldshop', c4c: 'oldshop', c5o: 'market', c5c: 'market', c6o: 'river', c6c: 'river', c7o: 'oldshop', c7c: 'oldshop', c8o: 'alley', c8c: 'alley', c9o: 'oldshop', c9c: 'forge', epi: 'dawn'};
const BG_NAMES = ['alley', 'forge', 'night', 'market', 'river', 'oldshop', 'duel', 'dawn'];

// ---------- scenes ----------
const SLEEPY_LINE = '一只橘色的猫不知什么时候蜷在了吧台边，尾巴一甩一甩——是豆皮。';
const sceneIds = ['pro', ...CH.flatMap(c => ['c' + c.n + 'o', 'c' + c.n + 'c']), 'epi'];
const sideIds = SIDE.map(s => s.id);
const seen = id => !!S.seen[id];
const isDone = n => !!S.done[n];
const pick = k => (S.choices[k] != null ? S.choices[k] : CHOICES[k].def);
const ending = () => (seen('epi') || isDone(9) ? (pick('k3') === 1 ? 'road' : 'lamp') : null);
function cond(s) { if (!s) return true;
  return String(s).split('&').every(t => { t = t.trim(); let neg = false, m, r = false; if (t[0] === '!') { neg = true; t = t.slice(1).trim(); }
    if ((m = /^(k\d):(\d)$/.exec(t))) r = !!CHOICES[m[1]] && pick(m[1]) === +m[2]; else if ((m = /^f\.(laobei|che)>=(\d+)$/.exec(t))) r = S.fav[m[1]] >= +m[2];
    return neg ? !r : r; }); }
function scene(id) {
  if (id === 'pro') return {...PRO, kind: 'pro', bg: SCENE_BG.pro};
  if (id === 'epi') { const e = ENDINGS[ending() || 'lamp']; return {...EPI, kind: 'epi', bg: SCENE_BG.epi, card: ['尾声', e.name]}; }
  const sd = SIDE.find(s => s.id === id); if (sd) return {id, kind: 'side', n: 0, place: sd.area, card: null, title: sd.title, lines: sd.lines, reward: {c: sd.c, title: ''}, side: sd, bg: ''};
  const m = /^c(\d)([oc])$/.exec(id); if (!m) return null;
  const c = CH[+m[1] - 1]; if (!c) return null;
  const open = m[2] === 'o';
  return {id, kind: open ? 'open' : 'close', n: c.n, place: c.place, card: open ? ['第 ' + c.n + ' 章', c.name] : null, lines: open ? c.open : c.close, reward: open ? null : c.reward, bg: SCENE_BG[id]};
}
const met = id => !!(root.Npc && root.Npc.met && root.Npc.met(id));
const NAMES = {you: '你', laobei: '老焙', xiaodou: '小豆', che: '澈'};
function nameOf(w) {
  if (w === 'che') return S.seen.c6c ? '林澈' : '澈';
  if (w === 'jin') return S.seen.c8o ? '金远' : '黑衣人';
  if (w.startsWith('x:')) return w.slice(2).split('|')[0];
  if (NAMES[w]) return NAMES[w];
  if (w === 'sleepy') return '豆皮';
  const id = w.replace('npc:', ''); const o = root.Npc && root.Npc.byId && root.Npc.byId(id); return o ? o.name : '';
}
const glyphOf = w => (w.startsWith('x:') ? w.slice(2).split('|')[1] || '🙂' : '');
// resolved beats: cameo lines only when that hidden character has already been met (never hints how); conditions read the current choices / 好感
function lines(id) {
  const sc = scene(id); if (!sc) return [];
  const sea = SEASONS[season()]; let bg = sc.bg || '';
  const out = [];
  sc.lines.forEach(b => {
    const o = b[3] || {}; if (o.bg) bg = o.bg;
    if (b[0] === 'choice') { const k = b[1], C = CHOICES[k]; if (!C) return;
      if (S.choices[k] == null) out.push({w: 'choice', id: k, name: '', ask: C.ask, opts: C.opts.map(q => ({t: q.t})), bg});
      else out.push({w: 'you', name: '你', t: C.opts[S.choices[k]].t.replace(/^「|」$/g, ''), bg, picked: k});
      return; }
    if ((b[2] && !met(b[2])) || !cond(o.if)) return;
    let who = b[0], t = b[1];
    if (who === 'sleepy') { who = 'n'; t = SLEEPY_LINE; }
    t = t.replace('{season}', sea);
    out.push({w: who, name: who === 'n' ? '' : nameOf(who), t, fx: o.fx || '', bg, glyph: glyphOf(who)});
  });
  return out;
}
const hasChoice = id => { const sc = scene(id); return !!sc && sc.lines.some(b => b[0] === 'choice'); };
function choose(k, i) { const C = CHOICES[k]; if (!C || !C.opts[i] || S.choices[k] != null) return null;
  S.choices[k] = i; const g = C.opts[i].fav || {}; Object.entries(g).forEach(([w, n]) => { S.fav[w] = Math.min(FAV_MAX, S.fav[w] + n); }); save(); return {fav: g}; }
const chosen = k => (S.choices[k] != null ? S.choices[k] : null);
// skipping a scene that still has an unanswered choice answers it with the default (gentlest) option
function autoPick(id) { const sc = scene(id); if (!sc) return; sc.lines.forEach(b => { if (b[0] === 'choice' && S.choices[b[1]] == null) choose(b[1], CHOICES[b[1]].def); }); }

// ---------- 好感 (bond) ----------
const TIERS = {laobei: [[0, '初识'], [3, '熟络'], [5, '知己'], [8, '莫逆']], che: [[0, '戒备'], [3, '松动'], [5, '信任'], [8, '同路']]};
const fav = w => (S.fav[w] || 0);
function tier(w) { const v = fav(w), T = TIERS[w] || []; let k = 0; T.forEach(([n], i) => { if (v >= n) k = i; }); return {v, lv: k, name: T[k] ? T[k][1] : '', next: T[k + 1] ? T[k + 1][0] : null}; }
const canGift = w => S.fav[w] != null && S.gifts[w] < GIFT_MAX && S.fav[w] < FAV_MAX && (w === 'laobei' || seen('c3c'));
function gift(w) { if (!canGift(w)) return false; S.gifts[w]++; S.fav[w] = Math.min(FAV_MAX, S.fav[w] + 1); save(); return true; }

// ---------- objectives & flow ----------
const unlocked = n => (n === 1 ? seen('pro') : isDone(n - 1));
function goals(n, x) {
  const c = CH[n - 1]; if (!c) return [];
  return c.goals.map(g => { let have = 0; try { have = Math.max(0, +g.f(x) || 0); } catch (e) {} return {...g, have: Math.min(have, g.need), raw: have, ok: have >= g.need}; });
}
const complete = (n, x) => goals(n, x).filter(g => !g.opt).every(g => g.ok);
// the chapter the player is on: 0 = prologue not seen yet, 1..9, or 10 = all chapters done
function cur() { if (!seen('pro')) return 0; for (let n = 1; n <= CH.length; n++) if (!isDone(n)) return n; return CH.length + 1; }
// side stories: state per area story (due once enough different cafes in that area have been visited)
function sides(x) { return SIDE.map(s => { const have = x ? +x.area(s.area) || 0 : 0, gate = !s.need || isDone(s.need); return {id: s.id, title: s.title, area: s.area, n: s.n, c: s.c, fav: s.fav || null, need: s.need || 0, seen: seen(s.id), have, gate, due: !seen(s.id) && gate && have >= s.n}; }); }
// the next cutscene that is due (one at a time, in story order; side stories only when no main scene is due)
function nextScene(x) {
  if (!seen('pro')) return 'pro';
  const n = cur();
  if (n > CH.length) { if (!seen('epi')) return 'epi'; }
  else { if (!seen('c' + n + 'o')) return 'c' + n + 'o'; if (!isDone(n) && complete(n, x)) return 'c' + n + 'c'; }
  const sd = sides(x).find(s => s.due); return sd ? sd.id : null;
}
// marks a scene as played. Closing scenes complete their chapter. Returns {first, reward} so the app can pay out once.
function mark(id, today) {
  const sc = scene(id); if (!sc) return null;
  const first = !S.seen[id];
  if (first) S.seen[id] = today || 1;
  if (sc.kind === 'close' && !S.done[sc.n]) S.done[sc.n] = today || 1;
  if (first && sc.kind === 'side' && sc.side.fav) Object.entries(sc.side.fav).forEach(([w, n]) => { S.fav[w] = Math.min(FAV_MAX, S.fav[w] + n); });
  if (first || sc.kind === 'close') save();
  return {first, reward: rewardOf(id), n: sc.n || 0, kind: sc.kind};
}
const claimId = id => id === 'epi' ? 'story-epi' : id.startsWith('s-') ? 'story-' + id : 'story-' + id.slice(1, 2); // c3c -> story-3
function titles() { const t = []; CH.forEach(c => { if (isDone(c.n)) t.push({n: c.n, title: c.reward.title}); }); if (seen('epi')) t.push({n: 10, title: EPI.reward.title}); return t; }
const title = () => { const t = titles(); return t.length ? t[t.length - 1].title : ''; };
const finished = () => seen('epi');
const progress = () => CH.filter(c => isDone(c.n)).length;
const all = () => ({pro: seen('pro'), n: cur()});
const pages = () => PAGES.map(p => ({...p, got: isDone(p.ch)}));
function reset() { S = norm(null); save(); }
function rewardOf(id) { const sc = scene(id); return sc && (sc.kind === 'close' ? CH[sc.n - 1].reward : sc.kind === 'epi' ? EPI.reward : sc.kind === 'side' ? sc.reward : null); }

// pixel portraits for non-古风 themes (drawn with the same Valley.Pix helpers as the hidden characters)
function addArt() {
  const N = root.Npc; if (!N || !N._art) return; const {ART, base, SK1, SK3} = N._art;
  ART.laobei = P => { base(P, {sk: SK1[0], skD: SK1[1], hair: '#cfd0d6', shirt: '#e8dcc0', apron: '#6a7a62', glasses: true, brow: '#a8a8b0'}); P.ell(16, 5.5, 8, 3.6, '#cfd0d6'); P.rect(7, 7, 2, 7, '#cfd0d6'); P.rect(23, 7, 2, 7, '#cfd0d6'); P.rect(22, 27, 6, 5, '#fff8e8'); P.rect(23, 27, 4, 1, '#6b3f1d'); P.rect(28, 28, 1, 2, '#fff8e8'); };
  ART.xiaodou = P => { base(P, {sk: SK3[0], skD: SK3[1], hair: '#5a3418', shirt: '#f4efe4', apron: '#8a5a33'}); P.rect(24, 8, 4, 9, '#5a3418'); P.rect(25, 17, 2, 2, '#5a3418'); P.rect(22, 5, 4, 2, '#e8503c'); };
  ART.che = P => { base(P, {sk: SK1[0], skD: SK1[1], hair: '#16161f', shirt: '#3a3a44'}); P.rect(9, 21, 14, 4, '#9a9aa6'); P.rect(9, 24, 14, 1, '#7a7a86'); P.rect(20, 25, 4, 7, '#9a9aa6'); P.rect(21, 31, 1, 1, '#7a7a86'); P.rect(22, 7, 3, 3, '#f5c542'); P.set(23, 8, '#fff3a0'); };
  ART.you = P => { base(P, {sk: SK3[0], skD: SK3[1], hair: '#241a1a', shirt: '#3f6aa6'}); P.rect(8, 25, 2, 7, '#8a5a33'); P.rect(22, 25, 2, 7, '#8a5a33'); P.rect(12, 5, 8, 1, '#c8403a'); P.rect(20, 4, 6, 1, '#c8403a'); P.rect(24, 5, 3, 2, '#c8403a'); };
  ART.jin = P => { base(P, {sk: SK1[0], skD: SK1[1], hair: '#16161f', shirt: '#1c1c26'}); P.rect(13, 19, 6, 3, '#2a2a34'); P.rect(15, 22, 2, 2, '#2a2a34'); P.rect(15, 25, 2, 2, '#d8a838'); P.rect(15, 28, 2, 2, '#d8a838'); P.rect(11, 4, 10, 2, '#d8a838'); };
  Object.assign(N.BG, {laobei: '#e8dcb8', xiaodou: '#f4e4cc', che: '#d8dce8', you: '#d6e8d8', jin: '#c8c4d0'});
}
addArt();

const Story = {CH, PRO, EPI, SIDE, PAGES, CHOICES, ENDINGS, AREAS, AREA_NAMES, SEASONS, SCENE_BG, BG_NAMES, FAV_MAX, GIFT_MAX, GIFT_BEANS, sceneIds, sideIds, scene, lines, hasChoice, choose, chosen, autoPick, nameOf, glyphOf, goals, complete, cur, nextScene, sides, mark, claimId, rewardOf, titles, title, finished, progress, all, pages, ending, fav, tier, canGift, gift, unlocked, season,
  seen, done: isDone, reset, reload() { S = load(); addArt(); }, get state() { return S; }};
root.Story = Story;
if (typeof module !== 'undefined') module.exports = Story;
})();
