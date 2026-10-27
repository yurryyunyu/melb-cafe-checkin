// 📜 主线剧情「第一颗豆」: story data + progress engine (no UI here; app.js plays the scenes).
// Chapters unlock in order. Objectives count the player's EXISTING check-ins/beans/course progress (retroactive),
// and are area/count based, so they never depend on one particular cafe staying open.
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.story';
const AREAS = ['city', 'richmond', 'northmel', 'brunswick'];
const EDU_NAMES = ['', '咖啡从哪里来', '果实变生豆', '火候的秘密', '九个大气压', '丝滑奶泡', '一壶清澈', '舌尖的地图', '墨尔本的咖啡魂'];
const AREA_NAMES = {city: 'MEL CITY（市中心）', richmond: 'RICHMOND（列治文）', northmel: 'NORTH MEL（北墨尔本）', brunswick: 'BRUNSWICK（布伦瑞克）', more: '「更多」街区（Fitzroy、Collingwood、Carlton 等）'};

// ---------- progress state ----------
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') return {v: 1, seen: s.seen && typeof s.seen === 'object' ? s.seen : {}, done: s.done && typeof s.done === 'object' ? s.done : {}}; } catch (e) {} return {v: 1, seen: {}, done: {}}; }
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---------- objective helpers (x = story context built by app.js) ----------
const area = r => x => x.area(r);
const edu = n => ({id: 'e' + n, t: `咖啡课：通关第 ${n} 章「${EDU_NAMES[n]}」`, need: 1, bool: 1, f: x => (x.rank >= n ? 1 : 0), go: '#/edu'});
const areaG = (r, n, t) => ({id: 'a-' + r, t: t || `在 ${AREA_NAMES[r]} 打卡 ${n} 家不同的店`, need: n, f: area(r), go: '#/map'});

// ---------- the script ----------
// beat = [speaker, text, onlyIfNpcMet?]; speaker: 'n' 旁白 | you | laobei | xiaodou | che | 'npc:<id>'
const CH = [
 {n: 1, name: '雨后的小巷', sum: '在市中心的小巷里学会「先闻再喝」，找回食谱簿的第一页。', place: 'city',
  goals: [areaG('city', 2), edu(1)],
  reward: {c: 150, title: '巷口来客'},
  open: [
   ['laobei', '第一课：别急着喝，先闻。咖啡的第一口，其实是从鼻子进来的。'],
   ['laobei', '墨尔本的咖啡，是从小巷（laneway）里长出来的。去 MEL CITY 走走，挑两家不同的店，每一杯都先闻一闻，再喝。'],
   ['xiaodou', '我给你画了张小地图！哪一家都行，没有标准答案。'],
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
  ]},
 {n: 2, name: '豆袋上的名字', sum: '学着读豆袋上的产地和处理法；一个灰围巾的身影第一次出现。', place: 'city',
  goals: [{id: 'beans', t: '在「豆子笔记」里存下 2 包豆子', need: 2, f: x => x.beans, go: '#/beans'}, {id: 'cafes', t: '累计在 4 家不同的店打过卡', need: 4, f: x => x.cafes, go: '#/map'}, edu(2)],
  reward: {c: 180, title: '识豆人'},
  open: [
   ['laobei', '第一页的背面，有一枚小小的豆袋印章。你看——国家、产区、处理法。林说，每一颗豆子都有一张「身份证」。'],
   ['you', '可我连豆袋上写的是什么都看不懂。'],
   ['laobei', '那就拍下来，存进豆子笔记。看多了，字就认得你了。'],
   ['laobei', '还有件怪事。这几天，有人先你一步，去过我常去的几家店。店员说，那人什么也没买，只喝了一杯黑咖啡，留下一朵压干的金合欢花，就走了。'],
   ['xiaodou', '我也见过！灰围巾，短头发，一句话都不说。'],
   ['n', '{season}'],
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
  ]},
 {n: 3, name: '河对岸的火', sum: '到列治文看烘豆；与「澈」第一次说上话，拿到第二页。', place: 'richmond',
  goals: [areaG('richmond', 3), edu(3)],
  reward: {c: 210, title: '烘香学徒'},
  open: [
   ['laobei', '第二页，我猜在河对岸——列治文（Richmond）。那一带有不少自己烘豆的店，空气里全是焦糖味。'],
   ['laobei', '烘焙，是把青涩变成香气的一场火。火候差一点，豆子就换一个性子。'],
   ['xiaodou', '路上会经过 Swan Street 和 Bridge Road，电车很吵，咖啡很香！'],
   ['laobei', '去三家不同的店。顺便听我讲讲「火候的秘密」——咖啡课第 3 章。'],
  ],
  close: [
   ['n', '列治文的傍晚，烘豆机的热气从一家小店的后门飘出来。你正要推门，门里先走出一个人。'],
   ['che', '……又是你。'],
   ['you', '你是「澈」？'],
   ['che', '你手里那张第一页，是老焙给你的吧。'],
   ['che', '我不是来抢的。我只想知道，一个刚到墨尔本的人，凭什么替他们找这本簿子。'],
   ['you', '我也不知道。我只知道，我说「像雨后的草地」的时候，他笑得很开心。'],
   ['che', '（灰围巾下的目光闪了一下）……第二页在烘豆间的架子上。去拿吧。我只是路过。'],
   ['npc:dawn', '叮铃——早！这一带的烘豆香味，隔着两条街都闻得到！', 'dawn'],
   ['n', '烘豆师递给你一张折得很小的纸：「第二页 · 烘。火要等豆子自己说话。——林」'],
   ['n', '你回头时，那个灰围巾的身影，已经消失在 Swan Street 的电车声里。'],
  ]},
 {n: 4, name: '九个大气压', sum: '在北墨尔本喝遍浓缩；老焙想起了和林的那场争吵，拿到第三页。', place: 'northmel',
  goals: [areaG('northmel', 3), edu(4)],
  reward: {c: 240, title: '浓缩探路者'},
  open: [
   ['laobei', '第三页在北墨尔本（North Melbourne）。那一带的街道很安静，我和林曾经在那里吵过一架。'],
   ['you', '吵架？为了咖啡？'],
   ['laobei', '为了一杯 espresso。他说粉要再细一点，我说要再粗一点，吵了一整晚，谁也没说服谁，只好各做一杯，让客人选。'],
   ['laobei', '那天的第一位客人，两杯都喝完了，说：「都好喝。不过你们俩，为什么不一起做呢？」'],
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
  ]},
 {n: 5, name: '奶泡里的人情', sum: '在布伦瑞克学会写下「人说了什么」，拿到第四页；灰围巾站在街对面。', place: 'brunswick',
  goals: [areaG('brunswick', 3), {id: 'notes', t: '给 3 次打卡写下心得（一句话就够）', need: 3, f: x => x.notes, go: '#/map'}, edu(5)],
  reward: {c: 270, title: '街角常客', item: 'wandercoat'},
  open: [
   ['xiaodou', '第四页的线索在布伦瑞克（Brunswick）！Sydney Road 上热闹得很，什么口音都有。'],
   ['laobei', '那一带的咖啡馆，更像邻居的客厅。奶咖在那里不是一杯饮料，是一句「今天过得怎么样」。'],
   ['laobei', '林最爱待在那里。他说，咖啡师做的不是咖啡，是让陌生人愿意多坐五分钟。'],
   ['laobei', '这次有点不一样：打卡的时候，写下你对这杯咖啡、这家店的一句话。簿子里最珍贵的不是配方，是「人说了什么」。'],
  ],
  close: [
   ['n', '你翻着自己写下的几条心得：「奶泡像云」「老板记得我的名字」「下雨天的窗边最好」……'],
   ['laobei', '（他一条一条念出来）……「老板记得我的名字」。孩子，这就是第四页要告诉我们的。'],
   ['npc:regular', '（窗边的老先生朝你们点点头）这家店的奶泡，三十年没变过。', 'regular'],
   ['n', '你们一起翻开从旧邮箱里取出的那张纸：「第四页 · 人。咖啡是借口，陪伴才是正题。——林」'],
   ['xiaodou', '簿子已经找回四页啦！只剩……'],
   ['laobei', '（轻声）封面，和最后一样东西。'],
   ['n', '窗外，一个灰围巾的身影，静静地站在街对面。这一次，她没有躲开。'],
  ]},
 {n: 6, name: '清澈', sum: '去更远的街区喝滤泡；「澈」说出自己的名字和心结。', place: 'more',
  goals: [{id: 'a-more', t: `在 ${AREA_NAMES.more} 打卡 3 家不同的店`, need: 3, f: area('more'), go: '#/map'}, edu(6)],
  reward: {c: 300, title: '清澈之友'},
  open: [
   ['laobei', '那位姑娘还在躲着我们。可她留下的花，一朵比一朵走得远——Fitzroy、Collingwood、Carlton……这些名字，林都念过。'],
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
   ['che', '簿子的封面和最后一样东西在我这儿。爷爷留话说：要等「一个肯慢慢喝咖啡的人」，带着老焙一起来拿。'],
   ['you', '我会带他来的。我保证。'],
   ['che', '那就先练好你的本事。老焙的舌头不灵，是因为他不敢相信自己。你帮帮他。'],
  ]},
 {n: 7, name: '舌尖的地图', sum: '老焙鼓起勇气重新杯测，舌头与记忆一起回来。', place: 'city',
  goals: [edu(7), {id: 'rate', t: '给 6 杯咖啡打分（累计）', need: 6, f: x => x.rated, go: '#/map'}, {id: 'sca', t: '加分：在「SCA 题库」掌握 1 个模块', need: 1, f: x => x.sca, go: '#/sca', opt: 1}],
  reward: {c: 330, title: '舌尖旅人'},
  open: [
   ['laobei', '孩子，我想求你一件事。……我想再试一次杯测。可我怕，怕自己的舌头真的不行了。'],
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
   ['n', '门外，一个灰围巾的身影一直没有走。她站了很久，才轻轻转身。'],
  ]},
 {n: 8, name: '墨尔本的咖啡魂', sum: '把整座城走得更宽；老焙与林澈在巷口和解，铁盒交到你们手里。', place: 'city',
  goals: [edu(8), {id: 'cafes', t: '累计在 14 家不同的店打过卡', need: 14, f: x => x.cafes, go: '#/map'}, {id: 'photo', t: '拍照打卡 3 次，把这座城的样子留下来', need: 3, f: x => x.photos, go: '#/map'}],
  reward: {c: 360, title: '咖啡魂守护者'},
  open: [
   ['laobei', '最近我总想起一件事。很多年前，墨尔本的咖啡，还没有今天这么多人爱。'],
   ['laobei', '那时候，从意大利、希腊来的老师傅，把浓缩咖啡机搬进了小巷。他们说，咖啡不是饮料，是见面的理由。'],
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
   ['n', '小巷里静了好一会儿。远处，一辆电车叮叮当当地驶过。'],
   ['npc:hash', '店会关，招牌会换，可只要还有人记得那杯的味道，它就还在。', 'hash'],
   ['che', '爷爷说，等「一个肯慢慢喝咖啡的人」带着你来，才可以把这个交给你们。'],
   ['n', '她从背包里取出一只旧铁盒和一张封面纸。盒盖上刻着一行小字：「把四页的味道，合成第一杯。」'],
   ['che', '（看着你）谢谢你，没有放弃找我。'],
  ]},
 {n: 9, name: '第一颗豆', sum: '走遍四个街区，在旧店里合成「第一杯」，铁盒里的秘密揭晓。', place: 'city',
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
   ['n', '桌角的铁盒，轻轻响了一声。澈打开了它——里面是一小袋旧生豆，和一张折起来的信。'],
   ['che', '（念）「给下一个肯慢慢喝咖啡的人：第一颗豆，不是豆子。是第一个，愿意为了一杯咖啡走很远的人。——林」'],
   ['laobei', '第一个愿意为一杯咖啡走很远的人……（他看向你）原来如此。'],
   ['xiaodou', '所以「第一颗豆」是……'],
   ['laobei', '不是豆，是你呀。'],
  ]},
];

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
 ['laobei', '你愿意陪我这个老头子，把簿子一页一页找回来吗？我教你认豆子，你替我去喝。'],
 ['n', '你点了点头。窗外的雨停了，巷口那盏旧灯，忽然亮了起来。'],
]};

const EPI = {id: 'epi', place: 'city', card: ['尾声', '新的一页'], reward: {c: 200, title: '续写食谱簿的人'}, lines: [
 ['n', '后来。'],
 ['n', '{season}'],
 ['laobei', '簿子重新装订好了。封面是澈补画的，里面是林的四页，还有——'],
 ['laobei', '新的一页。空白的。'],
 ['che', '「第一颗」的招牌，我在巷子里重新挂了出来。只卖三种咖啡，每天只开半天。'],
 ['xiaodou', '我负责把簿子放在吧台上，谁来了都可以翻！'],
 ['npc:master', '老焙，好久不见。这一杯，敬那本簿子。', 'master'],
 ['npc:tap', '叮——新的一页！', 'tap'],
 ['laobei', '你不用再替我找了。但如果你还愿意继续——'],
 ['laobei', '每喝一杯，就在打卡里写一句话吧。这本簿子，现在是你的了。它的每一页，都是一杯咖啡。'],
 ['you', '那我先去喝一杯。'],
 ['n', '墨尔本的小巷里，还有很多家咖啡馆，在等你推门。'],
]};

const SEASONS = {
 spring: '春天的墨尔本说变就变——上午艳阳，下午骤雨，巷子里的金合欢开得一团金黄。',
 summer: '夏日的午后热得发白，冰咖啡的杯壁上全是水珠，连电车都慢吞吞的。',
 autumn: '秋天的巷子里落满了梧桐叶，咖啡的热气在凉风里格外明显。',
 winter: '冬天的清晨又冷又灰，路上的人都捧着一杯热的 flat white 取暖。',
};
const season = (d = new Date()) => { const m = d.getMonth() + 1; return m >= 9 && m <= 11 ? 'spring' : m === 12 || m <= 2 ? 'summer' : m <= 5 ? 'autumn' : 'winter'; };

// ---------- scenes ----------
const SLEEPY_LINE = '一只橘色的猫不知什么时候蜷在了吧台边，尾巴一甩一甩——是豆皮。';
const sceneIds = ['pro', ...CH.flatMap(c => ['c' + c.n + 'o', 'c' + c.n + 'c']), 'epi'];
function scene(id) {
  if (id === 'pro') return {...PRO, kind: 'pro'};
  if (id === 'epi') return {...EPI, kind: 'epi'};
  const m = /^c(\d)([oc])$/.exec(id); if (!m) return null;
  const c = CH[+m[1] - 1]; if (!c) return null;
  const open = m[2] === 'o';
  return {id, kind: open ? 'open' : 'close', n: c.n, place: c.place, card: open ? ['第 ' + c.n + ' 章', c.name] : null, lines: open ? c.open : c.close, reward: open ? null : c.reward};
}
const met = id => !!(root.Npc && root.Npc.met && root.Npc.met(id));
const NAMES = {you: '你', laobei: '老焙', xiaodou: '小豆', che: '澈'};
function nameOf(w) {
  if (w === 'che') return S.seen.c6c ? '林澈' : '澈';
  if (NAMES[w]) return NAMES[w];
  if (w === 'sleepy') return '豆皮';
  const id = w.replace('npc:', ''); const o = root.Npc && root.Npc.byId && root.Npc.byId(id); return o ? o.name : '';
}
// resolved beats: cameo lines only when that hidden character has already been met (never hints how)
function lines(id) {
  const sc = scene(id); if (!sc) return [];
  const sea = SEASONS[season()];
  return sc.lines.filter(b => !b[2] || met(b[2])).map(b => {
    let who = b[0], t = b[1];
    if (who === 'sleepy') { who = 'n'; t = SLEEPY_LINE; }
    else if (who.startsWith('npc:')) who = 'npc:' + who.slice(4);
    t = t.replace('{season}', sea);
    return {w: who, name: who === 'n' ? '' : nameOf(who), t};
  });
}

// ---------- objectives & flow ----------
const seen = id => !!S.seen[id];
const isDone = n => !!S.done[n];
const unlocked = n => (n === 1 ? seen('pro') : isDone(n - 1));
function goals(n, x) {
  const c = CH[n - 1]; if (!c) return [];
  return c.goals.map(g => { let have = 0; try { have = Math.max(0, +g.f(x) || 0); } catch (e) {} return {...g, have: Math.min(have, g.need), raw: have, ok: have >= g.need}; });
}
const complete = (n, x) => goals(n, x).filter(g => !g.opt).every(g => g.ok);
// the chapter the player is on: 0 = prologue not seen yet, 1..9, or 10 = all chapters done
function cur() { if (!seen('pro')) return 0; for (let n = 1; n <= CH.length; n++) if (!isDone(n)) return n; return CH.length + 1; }
// the next cutscene that is due (one at a time, in story order)
function nextScene(x) {
  if (!seen('pro')) return 'pro';
  const n = cur();
  if (n > CH.length) return seen('epi') ? null : 'epi';
  if (!seen('c' + n + 'o')) return 'c' + n + 'o';
  if (!isDone(n) && complete(n, x)) return 'c' + n + 'c';
  return null;
}
// marks a scene as played. Closing scenes complete their chapter. Returns {first, reward} so the app can pay out once.
function mark(id, today) {
  const sc = scene(id); if (!sc) return null;
  const first = !S.seen[id];
  if (first) S.seen[id] = today || 1;
  if (sc.kind === 'close' && !S.done[sc.n]) S.done[sc.n] = today || 1;
  if (first || sc.kind === 'close') save();
  return {first, reward: sc.kind === 'close' ? CH[sc.n - 1].reward : sc.kind === 'epi' ? EPI.reward : null, n: sc.n || 0, kind: sc.kind};
}
const claimId = id => id === 'epi' ? 'story-epi' : 'story-' + id.slice(1, 2); // c3c -> story-3
function titles() { const t = []; CH.forEach(c => { if (isDone(c.n)) t.push({n: c.n, title: c.reward.title}); }); if (seen('epi')) t.push({n: 10, title: EPI.reward.title}); return t; }
const title = () => { const t = titles(); return t.length ? t[t.length - 1].title : ''; };
const finished = () => seen('epi');
const progress = () => CH.filter(c => isDone(c.n)).length;
const all = () => ({pro: seen('pro'), n: cur()});
function reset() { S = {v: 1, seen: {}, done: {}}; save(); }
const rewardOf = id => { const sc = scene(id); return sc && (sc.kind === 'close' ? CH[sc.n - 1].reward : sc.kind === 'epi' ? EPI.reward : null); };

// pixel portraits for non-古风 themes (drawn with the same Valley.Pix helpers as the hidden characters)
function addArt() {
  const N = root.Npc; if (!N || !N._art) return; const {ART, base, SK1, SK3} = N._art;
  ART.laobei = P => { base(P, {sk: SK1[0], skD: SK1[1], hair: '#cfd0d6', shirt: '#e8dcc0', apron: '#6a7a62', glasses: true, brow: '#a8a8b0'}); P.ell(16, 5.5, 8, 3.6, '#cfd0d6'); P.rect(7, 7, 2, 7, '#cfd0d6'); P.rect(23, 7, 2, 7, '#cfd0d6'); P.rect(22, 27, 6, 5, '#fff8e8'); P.rect(23, 27, 4, 1, '#6b3f1d'); P.rect(28, 28, 1, 2, '#fff8e8'); };
  ART.xiaodou = P => { base(P, {sk: SK3[0], skD: SK3[1], hair: '#5a3418', shirt: '#f4efe4', apron: '#8a5a33'}); P.rect(24, 8, 4, 9, '#5a3418'); P.rect(25, 17, 2, 2, '#5a3418'); P.rect(22, 5, 4, 2, '#e8503c'); };
  ART.che = P => { base(P, {sk: SK1[0], skD: SK1[1], hair: '#16161f', shirt: '#3a3a44'}); P.rect(9, 21, 14, 4, '#9a9aa6'); P.rect(9, 24, 14, 1, '#7a7a86'); P.rect(20, 25, 4, 7, '#9a9aa6'); P.rect(21, 31, 1, 1, '#7a7a86'); P.rect(22, 7, 3, 3, '#f5c542'); P.set(23, 8, '#fff3a0'); };
  ART.you = P => { base(P, {sk: SK3[0], skD: SK3[1], hair: '#241a1a', shirt: '#3f6aa6'}); P.rect(8, 25, 2, 7, '#8a5a33'); P.rect(22, 25, 2, 7, '#8a5a33'); P.rect(12, 5, 8, 1, '#c8403a'); P.rect(20, 4, 6, 1, '#c8403a'); P.rect(24, 5, 3, 2, '#c8403a'); };
  Object.assign(N.BG, {laobei: '#e8dcb8', xiaodou: '#f4e4cc', che: '#d8dce8', you: '#d6e8d8'});
}
addArt();

const Story = {CH, PRO, EPI, AREAS, AREA_NAMES, SEASONS, sceneIds, scene, lines, nameOf, goals, complete, cur, nextScene, mark, claimId, rewardOf, titles, title, finished, progress, all, unlocked, season,
  seen, done: isDone, reset, reload() { S = load(); addArt(); }, get state() { return S; }};
root.Story = Story;
if (typeof module !== 'undefined') module.exports = Story;
})();
