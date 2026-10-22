// 📖 咖啡教育成长主线 (coffee-education main story): 8 chapters from 咖啡小白 to 咖啡大师.
// Lessons are original Simplified-Chinese dialogue by the mentor villager 老焙; facts checked against SCA / WCR / roaster education pages
// (sources: research/coffee-curriculum.md — not deployed). Tasks are verified only from data the app already stores (check-ins, beans, cafe tags/signatures).
(() => {
'use strict';
const MENTOR = {id: 'mentor-laobei', name: '老焙', role: '退休烘豆师 · 小镇咖啡课'};
const RANKS = ['咖啡小白', '识豆学徒', '处理法见习生', '烘焙观察员', '萃取学徒', '奶咖手艺人', '手冲练习生', '杯测品鉴师', '咖啡大师'];
// drink classifiers (menu quick-picks are English; free text may be Chinese)
const NOTMILKCOFFEE = /chai|matcha|抹茶|hot choc|热巧|巧克力|tea\b|茶/i;
const isMilk = d => !!d && !NOTMILKCOFFEE.test(d) && /flat ?white|latte|cappuccino|\bcap\b|magic|piccolo|cortado|macchiato|milk coffee|\bwhite\b|拿铁|卡布|奶咖|澳白|馥芮白|玛奇朵|短笛|魔术/i.test(d);
const isBlack = d => !!d && !isMilk(d) && /espresso|short black|long black|ristretto|doppio|americano|浓缩|意式|美式|长黑|短黑/i.test(d);
const isFilter = d => !!d && !/cold ?brew|冷萃/i.test(d) && /filter|pour ?over|batch|v60|chemex|aeropress|kalita|origami|手冲|滤泡|滴滤|过滤/i.test(d);
const FILTER_RE = /filter|pour ?over|batch brew|手冲|滤泡|V60|Chemex/i;
const isRoaster = c => !!c && (c.tags || []).some(t => /烘焙商|^烘焙$/.test(t));
const hasFilter = (c, sig) => !!c && ((c.tags || []).some(t => /手冲|batch brew/i.test(t)) || !!(sig && sig.s && sig.s.some(x => FILTER_RE.test(x.join(' ')))));
// ctx: {checkins, beans, cafe(id), sig(id), sigMatch(cafeId, drink), region(id)}
const ci = (x, f) => x.checkins.filter(c => f(c, x.cafe(c.cafeId)));
const uniq = a => new Set(a).size;
const CH = [
  {n: 1, id: 'origin', icon: '🌱', title: '咖啡从哪里来', topic: '产地与品种',
    lesson: [
      '欢迎来上咖啡课！我是老焙，烘了一辈子豆子。今天先从一颗「豆子」讲起。',
      '其实咖啡豆不是豆子，是咖啡树果实（咖啡樱桃）里的种子。一颗果实里通常有两颗种子，平面对着平面。',
      '偶尔果实里只长出一颗圆圆的种子，叫「圆豆」（peaberry），有的烘焙商会单独挑出来卖。',
      '最常喝到的有两个种：阿拉比卡（Coffea arabica）和罗布斯塔（Coffea canephora）。精品咖啡馆用的几乎都是阿拉比卡。',
      '阿拉比卡的老家在埃塞俄比亚的高地，后来经过也门传向世界。咖啡树主要种在南北回归线之间，人称「咖啡带」。',
      '同一个种下面还有很多「品种」：Typica、Bourbon 是古老的一支；Gesha（也写作 Geisha）原本来自埃塞俄比亚，后来在巴拿马出了名。',
      '下次买豆子，看看包装上的国家、产区和品种——那就是这杯咖啡的「身份证」。去拍一包吧！'],
    notes: ['咖啡豆 = 咖啡樱桃的种子；一颗果实一般 2 颗，只有 1 颗时叫圆豆 peaberry', '两个主要的种：阿拉比卡、罗布斯塔（中粒种）；精品咖啡以阿拉比卡为主', '阿拉比卡起源于埃塞俄比亚；咖啡带 ≈ 南北回归线之间', '品种例子：Typica、Bourbon、Gesha/Geisha'],
    tasks: [
      {id: 'bean', t: '拍一包咖啡豆，存进豆子笔记', go: '#/beans', f: x => x.beans.length},
      {id: 'origin', t: '豆子笔记里记下产地国家', go: '#/beans', f: x => x.beans.filter(b => String(b.origin || '').trim()).length},
      {id: 'roaster', t: '去一家标着「烘焙商」的咖啡馆打卡', go: 'roaster', f: x => ci(x, (c, cf) => isRoaster(cf)).length}],
    quiz: [
      {q: '我们磨来冲咖啡的「咖啡豆」，在植物学上其实是？', a: ['咖啡树果实里的种子', '咖啡树的坚果', '一种豆科植物的豆子'], ok: 0, why: '咖啡豆是咖啡樱桃里的种子，不是豆科的豆子。'},
      {q: '精品咖啡馆里最常见的是哪个种？', a: ['阿拉比卡 Arabica', '罗布斯塔 Robusta', '利比里卡 Liberica'], ok: 0, why: '精品咖啡几乎都用阿拉比卡。'},
      {q: '阿拉比卡咖啡的起源地是？', a: ['埃塞俄比亚', '巴西', '哥伦比亚'], ok: 0, why: '阿拉比卡起源于埃塞俄比亚高地，经也门传向世界。'},
      {q: '一颗果实里只长出一颗圆形种子，这种豆叫？', a: ['圆豆 Peaberry', '象豆 Maragogype', '瑕疵豆'], ok: 0, why: '只有一颗种子发育时会长成圆形，叫圆豆。'}]},
  {n: 2, id: 'process', icon: '☀️', title: '果实变生豆', topic: '处理法',
    lesson: [
      '摘下来的咖啡樱桃要把种子取出来、晒干，这一步叫「处理」。处理方式会明显改变风味。',
      '水洗：先去掉果皮果肉，让种子外面黏黏的果胶发酵脱落，再洗净晒干。喝起来常常干净、明亮。',
      '日晒：整颗果实直接晒干，再把干果壳剥掉。种子跟果肉待得久，常有更多果香和甜感。',
      '蜜处理：去掉果皮，但保留一部分黏稠的果胶一起干燥。「蜜」说的是那层黏液，里面可没有加蜂蜜哦！哥斯达黎加让它出了名。',
      '还有印度尼西亚常见的「湿刨法」等等。干燥后的种子外面有一层羊皮纸似的内果皮，去掉之后才是绿色的「生豆」。',
      '豆袋上常写 washed、natural、honey。下次拍豆子时记下处理法，再写一句你喝到的味道。'],
    notes: ['水洗 washed：去皮去果肉 → 发酵去果胶 → 洗净干燥；常见干净、明亮', '日晒 natural：整颗果实干燥后再去壳；常见果香、甜感、厚重', '蜜处理 honey：去皮后带着部分果胶干燥；「蜜」指果胶，不加蜂蜜', '去掉内果皮（羊皮纸）后才是生豆 green coffee'],
    tasks: [
      {id: 'process', t: '记录一包豆子的处理法（水洗 / 日晒 / 蜜处理…）', go: '#/beans', f: x => x.beans.filter(b => String(b.process || '').trim()).length},
      {id: 'note', t: '打卡时写一句风味心得', go: '#/list', f: x => ci(x, c => String(c.note || '').trim()).length},
      {id: 'two', t: '（加分）收集两种不同处理法的豆子', opt: true, need: 2, go: '#/beans', f: x => uniq(x.beans.map(b => String(b.process || '').trim().toLowerCase()).filter(Boolean))}],
    quiz: [
      {q: '「蜜处理」咖啡里加了蜂蜜吗？', a: ['没有，「蜜」指留在种子上的黏稠果胶', '有，干燥时刷一层蜂蜜', '只有黑蜜处理会加'], ok: 0, why: '蜜处理不加蜂蜜，名字来自黏稠的果胶。'},
      {q: '哪一种处理法是让整颗果实直接干燥？', a: ['日晒 Natural', '水洗 Washed', '蜜处理 Honey'], ok: 0, why: '日晒法整颗樱桃一起晒干，之后再去壳。'},
      {q: '水洗处理的咖啡，常见的风味印象是？', a: ['干净、明亮', '一定更苦', '一定有酒味'], ok: 0, why: '水洗去掉了果肉和果胶，风味通常更干净清晰。'},
      {q: '生豆在出口前要去掉哪一层？', a: ['羊皮纸一样的内果皮', '咖啡油脂 crema', '种子的胚乳'], ok: 0, why: '干燥后的种子外面还有内果皮（parchment），去掉后才是生豆。'}]},
  {n: 3, id: 'roast', icon: '🔥', title: '火候的秘密', topic: '烘焙',
    lesson: [
      '生豆是青绿色的，几乎没有咖啡香。是烘焙把它变成褐色，还生出几百种香气。',
      '加热时，糖和氨基酸会发生「美拉德反应」，糖也会焦糖化——颜色和香气大多从这里来。',
      '烘到一定温度，豆子会噼啪作响，叫「一爆」。浅烘一般在一爆之后不久就出锅；再烘下去还会有「二爆」，那是深烘的信号。',
      '浅烘保留更多产地的酸质和花果香；深烘带来更多烘焙味，像巧克力、焦糖，酸感更低、苦感更明显。',
      '很多人以为深烘咖啡因更多，其实烘焙对咖啡因含量的影响很小。',
      '刚烘好的豆子会持续释放二氧化碳，所以豆袋上常有单向排气阀：气出得去，空气进不来。很多店会建议烘焙后放几天再冲。',
      '看豆袋要看「烘焙日期」，比保质期更有用。去几家自己烘豆的咖啡馆看看吧！'],
    notes: ['美拉德反应 + 焦糖化 → 颜色与香气', '一爆 first crack：浅烘常在一爆后不久下豆；二爆 second crack 是深烘信号', '浅烘：酸质、花果香；深烘：烘焙味、苦甜、酸低', '咖啡因几乎不随烘焙度改变；单向排气阀用来排出 CO₂'],
    tasks: [
      {id: 'roast', t: '记下一包豆子的烘焙度或烘焙日期', go: '#/beans', f: x => x.beans.filter(b => String(b.roast || b.roastDate || '').trim()).length},
      {id: 'roasters', t: '在 2 家不同的「烘焙商」咖啡馆打卡', need: 2, go: 'roaster', f: x => uniq(ci(x, (c, cf) => isRoaster(cf)).map(c => c.cafeId))}],
    quiz: [
      {q: '烘焙中豆子第一次噼啪作响，叫做？', a: ['一爆 First crack', '二爆 Second crack', '闷蒸 Bloom'], ok: 0, why: '第一次爆裂声叫一爆，浅烘常在其后不久出锅。'},
      {q: '豆袋上的单向排气阀有什么用？', a: ['让二氧化碳排出、挡住外面的空气', '让豆子吸收水分', '方便闻香，没有其他作用'], ok: 0, why: '新鲜熟豆会释放 CO₂，单向阀让气体出去、空气不进来。'},
      {q: '和深烘相比，浅烘豆通常？', a: ['保留更多酸质和花果香', '苦味更重', '咖啡因多一倍'], ok: 0, why: '浅烘保留产地风味与酸质；深烘烘焙味更重。'},
      {q: '深烘的咖啡因是不是明显更高？', a: ['不是，烘焙对咖啡因影响很小', '是，越深越多', '是，深烘多三倍'], ok: 0, why: '咖啡因在烘焙中相当稳定，烘焙度对含量影响很小。'}]},
  {n: 4, id: 'espresso', icon: '☕', title: '九个大气压', topic: '浓缩萃取',
    lesson: [
      'Espresso（意式浓缩）是用热水在高压下、短时间流过压实的细粉，萃取出一小杯浓郁的咖啡。',
      '表面那层金棕色的泡沫叫 crema，是二氧化碳和咖啡油脂形成的。',
      '很多咖啡师的起点参数是：约 9 bar 压力、粉水比约 1:2（比如 18 克粉出 36 克液体）、25–30 秒左右。这是起点，不是铁律。',
      '流得太快、喝起来尖酸单薄，多半是萃取不足——试着磨细一点；太慢、又苦又涩，多半是萃取过度——磨粗一点。每次只改一个变量。',
      '在澳洲点 short black 就是一杯 espresso；long black 是先放热水、再把双份浓缩倒在上面，能保住 crema。',
      '美式（americano）通常反过来：先做浓缩，再加水。',
      '有些店还会给你选萃取风格，比如 Homebody Union 提供传统 9 bar 和高流量纸滤两种 espresso。点一杯不加奶的，认真尝尝吧！'],
    notes: ['Espresso：高压热水快速通过细粉；crema = CO₂ + 油脂', '常见起点：≈9 bar、粉水比 ≈1:2、≈25–30 秒', '尖酸单薄 → 萃取不足 → 磨细；苦涩发干 → 萃取过度 → 磨粗', 'Short black = espresso；Long black = 先水后浓缩'],
    tasks: [
      {id: 'black', t: '点一杯不加奶的意式：Espresso / Short Black / Long Black', go: '#/list', f: x => ci(x, c => isBlack(c.drink)).length},
      {id: 'rate', t: '给一杯不加奶的意式打分', go: '#/list', f: x => ci(x, c => isBlack(c.drink) && c.rating).length},
      {id: 'homebody', t: '（加分）去 Homebody Union 体验不同风格的 espresso', opt: true, go: '#/cafe/homebody', f: x => ci(x, c => c.cafeId === 'homebody').length}],
    quiz: [
      {q: '一杯 espresso 喝起来尖酸、单薄、流速很快，最先该怎么调？', a: ['把粉磨细一点', '把粉磨粗一点', '换更深烘的豆子'], ok: 0, why: '流速快、酸、薄通常是萃取不足，先磨细。'},
      {q: 'Crema 是什么？', a: ['二氧化碳和咖啡油脂形成的泡沫', '打发的牛奶', '加进去的糖浆'], ok: 0, why: 'Crema 是高压萃取时 CO₂ 与油脂乳化形成的泡沫层。'},
      {q: '在墨尔本点一杯 Long Black，通常是？', a: ['先放热水，再倒入双份浓缩', '先浓缩，再加大量牛奶', '冷萃咖啡加冰'], ok: 0, why: 'Long black 先水后浓缩，保留 crema。'},
      {q: '粉水比 1:2 的意思是？', a: ['18 克粉大约出 36 克咖啡液', '1 份牛奶配 2 份咖啡', '萃取 12 秒'], ok: 0, why: '粉水比是咖啡粉重量与出液重量之比。'}]},
  {n: 5, id: 'milk', icon: '🥛', title: '丝滑奶泡', topic: '奶咖与拉花入门',
    lesson: [
      '澳洲人最爱奶咖。好喝的关键是奶泡：细小、有光泽，像湿油漆一样的「微奶泡」。',
      '打奶分两步：先让蒸汽棒喷头贴近液面，「嘶嘶」地带入空气（进气）；再把喷头稍微压低，让牛奶旋转，把大泡打成细泡（打绵）。',
      '牛奶加热到大约 55–65°C 最甜；太烫会有煮熟的味道，奶泡也会变粗。',
      'Flat white 奶泡薄、杯子小，咖啡味更突出；latte 杯更大、奶更多；cappuccino 奶泡最厚，澳洲常在上面撒巧克力粉。',
      'Magic 是墨尔本咖啡馆的说法：双份 ristretto 加牛奶，装在比 flat white 小一点的杯子里。Flat white 的发明权，澳洲和新西兰到现在还在争。',
      '拉花从心形开始：先从高处细细注入让奶和咖啡融合，快满时把奶缸压低、靠近液面，白色图案就浮出来了。拍一张你的奶咖吧！'],
    notes: ['进气（stretching）→ 打绵（texturing），目标是有光泽的微奶泡', '牛奶约 55–65°C 甜感最好，过热会有煮熟味', 'Flat white：奶泡薄、杯小；Latte：奶更多；Cappuccino：奶泡最厚', 'Magic：双份 ristretto + 牛奶，墨尔本说法；拉花：高处融合、低处出图'],
    tasks: [
      {id: 'milk', t: '点一杯奶咖（Flat White / Latte / Cappuccino / Magic / Piccolo…）', go: '#/list', f: x => ci(x, c => isMilk(c.drink)).length},
      {id: 'photo', t: '拍照记录一杯奶咖，看看拉花', go: '#/list', f: x => ci(x, c => isMilk(c.drink) && c.photo).length}],
    quiz: [
      {q: '打奶的两个阶段顺序是？', a: ['先进气，再打绵', '先打绵，再进气', '只需要加热'], ok: 0, why: '先带入空气，再让牛奶旋转把泡打细。'},
      {q: '牛奶大约加热到多少度甜感最好？', a: ['约 55–65°C', '约 85–95°C', '刚好沸腾'], ok: 0, why: '大约 55–65°C；过热会有煮熟味。'},
      {q: '三种奶咖里，通常奶泡最厚的是？', a: ['Cappuccino', 'Flat white', 'Long black'], ok: 0, why: 'Cappuccino 奶泡最厚；flat white 最薄；long black 不加奶。'},
      {q: '拉花要让图案浮出来，奶缸应该？', a: ['压低、靠近液面', '举得越高越好', '一直不动'], ok: 0, why: '高处注入是融合，靠近液面才会出现白色图案。'}]},
  {n: 6, id: 'filter', icon: '🫖', title: '一壶清澈', topic: '手冲与滤泡',
    lesson: [
      '除了 espresso，还有一大家族叫滤泡（filter）：热水靠重力流过咖啡粉，再用滤纸或滤网挡住粉渣。',
      'V60、Kalita Wave、Chemex 是常见的手冲器具；很多店还有 batch brew，用滤泡机一次冲一大壶。',
      '手冲的粉比 espresso 粗得多。SCA 的 Golden Cup 标准建议每升水约 55 克粉，很多店的配方在 1:15 到 1:17 之间。',
      '先倒一点水「闷蒸」（bloom），让新鲜咖啡粉里的二氧化碳先跑出来，后面的水才能均匀萃取。',
      '法压壶是浸泡式——粉和水泡在一起，再压下滤网；爱乐压（AeroPress）是浸泡后再用压力推出来。',
      'Filter 通常更清透，最适合尝出产地和处理法的差别。很多墨尔本的店都有，比如 Patricia、Market Lane、Homebody Union。去点一杯吧！'],
    notes: ['滤泡 = 重力 + 滤纸/滤网；手冲器具：V60、Kalita Wave、Chemex；batch brew 批量滤泡', '研磨比 espresso 粗；SCA Golden Cup ≈ 55 g/L，常见 1:15–1:17', '闷蒸 bloom：先释放 CO₂，后续萃取更均匀', '法压 = 浸泡式；爱乐压 = 浸泡 + 加压'],
    tasks: [
      {id: 'cafe', t: '去一家有手冲 / 滤泡的店打卡', go: 'filter', f: x => ci(x, (c, cf) => hasFilter(cf, x.sig(c.cafeId))).length},
      {id: 'filter', t: '点一杯 Filter / 手冲 / Batch Brew', go: 'filter', f: x => ci(x, c => isFilter(c.drink)).length}],
    quiz: [
      {q: '手冲前先倒少量水「闷蒸」，主要是为了？', a: ['让二氧化碳先释放，萃取更均匀', '把咖啡粉冲掉', '让水降温'], ok: 0, why: '新鲜粉里有 CO₂，先闷蒸让气体排出。'},
      {q: '法压壶属于哪一类冲煮方式？', a: ['浸泡式', '高压萃取', '冷萃'], ok: 0, why: '法压是粉水浸泡后再压下滤网。'},
      {q: '和 espresso 相比，手冲的研磨通常？', a: ['更粗', '更细', '一模一样'], ok: 0, why: '手冲接触时间更长，研磨更粗。'},
      {q: 'SCA Golden Cup 建议的粉水比大约是？', a: ['每升水约 55 克粉', '每升水约 5 克粉', '每升水约 300 克粉'], ok: 0, why: 'Golden Cup 标准建议约 55 g/L（±10%）。'}]},
  {n: 7, id: 'cupping', icon: '🥄', title: '舌尖的地图', topic: '品鉴与杯测',
    lesson: [
      '会喝，还要会说。咖啡行业用「杯测」（cupping）来公平地比较咖啡。',
      'SCA 的杯测流程大致是：按每 150 毫升水约 8.25 克粉，粗磨后先闻干香；倒入约 93°C 的热水，静置 3–5 分钟。',
      '然后用勺子「破渣」，凑近闻湿香，撇掉浮沫；等稍凉了，用勺子用力「啜吸」，让咖啡像雾一样铺满整个口腔。',
      '要评的有：香气、风味、余韵、酸质、醇厚度（body）、平衡、甜感等。酸质不是坏事，是像水果一样的明亮感。',
      '找词的时候可以用 SCA 和 World Coffee Research 在 2016 年更新的「咖啡品鉴者风味轮」。',
      '从中心的大类开始，比如「水果」→「柑橘」→「柠檬」，一层层往外找，找到一个再回中心找下一个。',
      '在传统的 SCA 100 分杯测表里，80 分以上通常被认为是精品咖啡。练习的办法很简单：同一天比较一杯 espresso 系和一杯 filter，写下你的感受。'],
    notes: ['SCA 杯测：8.25 g / 150 ml，约 93°C，静置 3–5 分钟后破渣闻香，撇沫，稍凉后啜吸', '评价项：香气、风味、余韵、酸质、醇厚度、平衡、甜感…', '风味轮（SCA × WCR，2016 更新）：从中心大类往外找具体词', '传统 SCA 100 分制：80 分以上通常称为精品'],
    tasks: [
      {id: 'both', t: '喝过意式系和滤泡系咖啡各至少一杯', go: 'filter', f: x => Math.min(ci(x, c => isBlack(c.drink) || isMilk(c.drink)).length, ci(x, c => isFilter(c.drink)).length)},
      {id: 'notes', t: '写 3 条打卡心得（试着用风味轮里的词）', need: 3, go: '#/list', f: x => ci(x, c => String(c.note || '').trim()).length},
      {id: 'rated', t: '累计给 5 杯打分', need: 5, go: '#/list', f: x => ci(x, c => c.rating).length}],
    quiz: [
      {q: '杯测时为什么要用力「啜吸」？', a: ['让咖啡雾化、铺满口腔，香气更容易被察觉', '只是为了让咖啡快点变凉', '为了表示礼貌'], ok: 0, why: '啜吸让咖啡同时接触整个口腔并带入空气，更容易分辨风味。'},
      {q: '使用风味轮时，应该从哪里开始找词？', a: ['从中心的大类开始，往外找', '从最外圈随便挑一个', '只看颜色'], ok: 0, why: '中心是大类，越往外越具体。'},
      {q: 'SCA 杯测在注水后，大约静置多久再破渣？', a: ['3–5 分钟', '10 秒', '30 分钟'], ok: 0, why: 'SCA 流程：注水后静置 3–5 分钟再破渣。'},
      {q: '在传统 SCA 100 分杯测表中，精品咖啡通常要求？', a: ['80 分以上', '50 分以上', '99 分以上'], ok: 0, why: '80 分以上通常被视为精品咖啡。'}]},
  {n: 8, id: 'melbourne', icon: '🏙️', title: '墨尔本的咖啡魂', topic: '墨尔本咖啡文化',
    lesson: [
      '最后一课，讲讲我们住的这座城。墨尔本的意式咖啡文化，很大程度上来自二战后的意大利移民。',
      '1954 年前后，第一批意式咖啡馆出现了，比如 St Kilda 的 Il Capuccino 和 Bourke St 的 Pellegrini\'s。',
      'Pellegrini\'s 是 CBD 最早有意式咖啡机的店之一，到现在还开着，店里的霓虹招牌还是老样子。',
      '后来，小巷（laneway）里的小咖啡馆、早午餐文化，还有自己烘豆、写清楚产地和处理法的精品咖啡店，让墨尔本以咖啡出名。',
      '在这里点单有自己的说法：short black、long black、flat white、magic、piccolo……燕麦奶、extra hot 也随便说。',
      '每家店都有自己的招牌。去不同的街区走走，点一次那家店的招牌，就是最好的毕业作业。',
      '把你学到的都喝出来吧——学会这些，你就是镇上的咖啡大师了！'],
    notes: ['二战后意大利移民带来意式咖啡；1954 年前后出现第一批意式咖啡馆（Il Capuccino、Pellegrini\'s）', 'Pellegrini\'s（Bourke St）是 CBD 最早有意式咖啡机的店之一，至今营业', '小巷咖啡馆、早午餐、自家烘焙的精品咖啡店', '点单用语：short black、long black、flat white、magic、piccolo'],
    tasks: [
      {id: 'regions', t: '在 3 个不同区域打卡', need: 3, go: '#/map', f: x => uniq(ci(x, (c, cf) => cf).map(c => x.region(c.cafeId)))},
      {id: 'sig', t: '点一次那家店的招牌', go: '#/list', f: x => ci(x, c => x.sigMatch(c.cafeId, c.drink)).length},
      {id: 'cafes', t: '累计解锁 8 家咖啡馆', need: 8, go: '#/list', f: x => uniq(ci(x, (c, cf) => cf).map(c => c.cafeId))}],
    quiz: [
      {q: '墨尔本的意式咖啡文化，很大程度上来自？', a: ['二战后的意大利移民', '19 世纪的英国茶馆', '2000 年后的连锁店'], ok: 0, why: '二战后的意大利移民带来了意式咖啡机和咖啡馆文化。'},
      {q: 'Bourke St 上，CBD 最早有意式咖啡机的店之一、至今仍营业的是？', a: ['Pellegrini\'s', 'Patricia Coffee Brewers', 'Market Lane'], ok: 0, why: 'Pellegrini\'s 1954 年开业，至今仍在 Bourke St。'},
      {q: '墨尔本咖啡馆说的「magic」通常是？', a: ['双份 ristretto 加牛奶，杯子比 flat white 小', '加了魔法粉的热巧克力', '冷萃加汤力水'], ok: 0, why: 'Magic 是双份 ristretto 加奶，常用约 5 oz 的小杯。'},
      {q: '在墨尔本点一杯 short black，你会拿到？', a: ['一杯 espresso', '一杯黑茶', '一杯加奶的长杯咖啡'], ok: 0, why: 'Short black 就是 espresso。'}]},
];
const REWARD = n => 100 + n * 20; // coins per chapter (→ quest XP c/2)
const ITEM_AT = {3: 'grinder', 7: 'cupcoat', 8: 'mortar'};
// ---------- state ----------
const SK = 'mcc.edu';
const load = () => { let s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {} s = s && typeof s === 'object' ? s : {}; return {read: s.read && typeof s.read === 'object' ? s.read : {}, quiz: s.quiz && typeof s.quiz === 'object' ? s.quiz : {}}; };
let S = load();
const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };
const passed = n => !!(S.quiz[n] && S.quiz[n].passed);
const rank = () => { let r = 0; while (r < CH.length && passed(r + 1)) r++; return r; };
const unlocked = n => n === 1 || passed(n - 1);
function evalTasks(ch, x) { return ch.tasks.map(t => { let have = 0; try { have = +t.f(x) || 0; } catch (e) {} const need = t.need || 1; return {...t, have: Math.min(have, need), need, done: have >= need}; }); }
function chapterState(ch, x) { const tasks = evalTasks(ch, x), req = tasks.filter(t => !t.opt); return {ch, tasks, read: !!S.read[ch.n], unlocked: unlocked(ch.n), passed: passed(ch.n), tasksDone: req.every(t => t.done), ready: !!S.read[ch.n] && req.every(t => t.done), tries: (S.quiz[ch.n] || {}).tries || 0, best: (S.quiz[ch.n] || {}).best || 0}; }
function markRead(n) { S.read[n] = true; save(); }
// quiz: options shuffled per attempt (deterministic by attempt no.); pass = ≥3 of 4 correct; retries unlimited
const PASS = 3;
function shuffled(n, attempt) { const ch = CH[n - 1]; let h = 2166136261 ^ (n * 97 + attempt * 131);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  return ch.quiz.map(q => { const idx = q.a.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return {q: q.q, why: q.why, opts: idx.map(i => ({t: q.a[i], ok: i === q.ok}))}; }); }
function attempt(n) { return (S.quiz[n] || {}).tries || 0; }
function grade(n, picks, date) { const qs = shuffled(n, attempt(n)), right = qs.map((q, i) => !!(q.opts[picks[i]] && q.opts[picks[i]].ok)), score = right.filter(Boolean).length;
  const Q = S.quiz[n] = S.quiz[n] || {tries: 0, best: 0}; const wasPassed = !!Q.passed; Q.tries++; Q.best = Math.max(Q.best || 0, score); if (score >= PASS && !Q.passed) Q.passed = date; save();
  return {score, total: qs.length, pass: score >= PASS, right, qs, newRank: score >= PASS && !wasPassed}; }
function reset() { S = {read: {}, quiz: {}}; save(); }
window.Edu = {CH, RANKS, MENTOR, REWARD, ITEM_AT, PASS, isMilk, isBlack, isFilter, isRoaster, hasFilter, chapterState, rank, passed, unlocked, markRead, shuffled, attempt, grade, reset, reload() { S = load(); }, get state() { return S; }};
})();
