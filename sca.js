// 🎓 SCA 问答 — original practice questions written from SCA's PUBLIC curricula / standards and reputable secondary sources.
// 非 SCA 官方题库，仅供练习. Not SCA exam content; not endorsed by the SCA. Sources: research/sca-quiz.md (not deployed).
// Row format: [level 'f'|'i', module, question, options[], correct index, explanation, source keys[]]; 2 options = 判断题 (正确/错误).
// ids are `${level}-${module}-${n}` by order within the level+module — only APPEND to keep saved progress stable.
(function () {
const DISCLAIMER = '非 SCA 官方题库，仅供练习';
const LEVELS = [{id: 'f', zh: '初级', en: 'Foundation'}, {id: 'i', zh: '中级', en: 'Intermediate'}];
const MODULES = [
  {id: 'intro', zh: '咖啡入门', en: 'Introduction to Coffee', icon: '🌱', lv: ['f']},
  {id: 'barista', zh: '咖啡师技能', en: 'Barista Skills', icon: '☕', lv: ['f', 'i']},
  {id: 'brew', zh: '冲煮', en: 'Brewing', icon: '🫖', lv: ['f', 'i']},
  {id: 'green', zh: '生豆', en: 'Green Coffee', icon: '🫘', lv: ['f', 'i']},
  {id: 'roast', zh: '烘焙', en: 'Roasting', icon: '🔥', lv: ['f', 'i']},
  {id: 'sensory', zh: '感官技能', en: 'Sensory Skills', icon: '👃', lv: ['f', 'i']}];
const SRC = {
  catalog: {t: 'SCA Coffee Skills Program Course Catalog（2021 年 8 月版，PDF 转载）', u: 'https://ilmanovale.com/wp-content/uploads/2025/02/SCACSPCourseCatalog.pdf'},
  intro: {t: 'SCA Introduction to Coffee 课纲（2018，ROCC 转载）', u: 'https://sca.training/howtocoffee/2018/7/21/introduction-to-coffee-module-posted'},
  bfc: {t: 'SCA Barista Skills Foundation 课纲 v1.0（2017）', u: 'https://sca.training/howtocoffee/2018/7/21/barista-skills-foundation-module-posted'},
  bic: {t: 'SCA Barista Skills Intermediate 课纲 v2.0（2018，PDF 转载）', u: 'https://prokofe.ru/files/public/1537955543_16273_FT196051_sca_barista_intermediate_curriculum_v2.0_2018.pdf'},
  brewf: {t: 'SCA Brewing Foundation 课纲（2018，ROCC 转载）', u: 'https://sca.training/howtocoffee/2018/7/21/brewing-foundation-module-posted'},
  greenf: {t: 'SCA Green Coffee Foundation 课纲（2018，ROCC 转载）', u: 'https://sca.training/howtocoffee/2018/7/21/green-coffee-foundation-module-posted'},
  roastf: {t: 'SCA Roasting Foundation 课纲（2018，ROCC 转载）', u: 'https://sca.training/howtocoffee/2018/7/21/roasting-foundation-module-posted'},
  sensf: {t: 'SCA Sensory Skills Foundation 课纲（2018，ROCC 转载）', u: 'https://sca.training/howtocoffee/2018/7/21/sensory-foundation-module-posted'},
  std: {t: 'SCA Coffee Standards（2018 修订版）', u: 'https://editordecafe.com/wp-content/uploads/2019/03/6ec09-coffeestandards-digital.pdf'},
  prot: {t: 'SCA Protocols & Best Practices（2018 修订版，含 2004 杯测规范）', u: 'https://www.scith.coffee/wp-content/uploads/2021/03/SCA-Protocols-_-Best-Practices.pdf'},
  cva: {t: 'SCA 新闻：CVA 描述性 / 情感性评估成为新杯测标准（2024）', u: 'https://sca.coffee/sca-news/sca-new-cva-cupping-standards-7ga28'},
  ey: {t: 'Coffearium · Extraction yield and TDS（引 Batali 2020、Guinard 2023、Liang 2021 等）', u: 'https://coffearium.org/entries/extraction-yield-and-tds/'},
  roastsci: {t: 'Coffearium · Roasting（引 Münchow 2020、Alstrup 2020、Geiger 2005 等）', u: 'https://coffearium.org/entries/roasting/'},
  grade: {t: 'Coffearium · Grading and sorting（引 FAO 转载的 SCAA 分级、ISO 4150 等）', u: 'https://coffearium.org/entries/grading-and-sorting/'},
  chem: {t: 'Comprehensive Natural Products II · Chemistry of Coffee（Elsevier）', u: 'https://booksite.elsevier.com/brochures/conap2/PDFs/Vol3_Chemistry_of_Coffee_lr.pdf'},
  wcr: {t: 'World Coffee Research · Coffea arabica genome', u: 'https://worldcoffeeresearch.org/resources/coffea-arabica-genome'},
  iso: {t: 'ISO 4120:2021 Sensory analysis — Triangle test', u: 'https://www.iso.org/standard/76666.html'},
  sss: {t: 'Society of Sensory Professionals · Triangle test', u: 'https://www.sensorysociety.org/knowledge/sspwiki/pages/triangle%20test.aspx'},
  swiss: {t: 'Swiss Water® Process · Decaffeination process', u: 'https://www.swisswater.com/pages/coffee-decaffeination-process'},
  agtron: {t: 'Agtron Inc. · M-Basic / E10CP 色值盘说明', u: 'https://www.agtroninc.com/wp-content/uploads/m-basic-operating-system.pdf'},
  ebf: {t: 'Régine Guion-Firmin · EBF: What is it?（Espresso Brew Formula 说明）', u: 'https://misscoffeebreak.wordpress.com/2016/11/10/ebf-what-is-it/'}
};
const TF = ['正确', '错误'];
const R = [
// ───────── 初级 · 咖啡入门 Introduction to Coffee ─────────
['f', 'intro', '按 SCA 课纲，阿拉比卡（Coffea arabica）的发源地是哪里？', ['埃塞俄比亚一带', '巴西', '印度尼西亚', '哥伦比亚'], 0, '入门课纲：阿拉比卡发现于埃塞俄比亚；生豆初级课纲写作埃塞俄比亚 / 南苏丹一带。巴西是今天最大的产国，但不是原产地。', ['intro', 'greenf']],
['f', 'intro', '罗布斯塔（Robusta）在植物学上属于哪个物种？', ['Coffea canephora', 'Coffea arabica', 'Coffea liberica', 'Coffea eugenioides'], 0, 'Robusta 是 Coffea canephora 的一个类型，课纲把它与 Arabica 并列为两大商业物种；C. eugenioides 是阿拉比卡的亲本之一，不是罗布斯塔。', ['greenf', 'wcr']],
['f', 'intro', '一颗咖啡樱桃里通常有两颗种子；只发育出一颗圆形种子的叫什么？', ['圆豆 Peaberry', '象豆 Elephant bean', '贝壳豆 Shell', '浮豆 Floater'], 0, '入门课纲：樱桃里通常有两颗对生的种子（平豆），只长一颗时会成为圆圆的 peaberry。', ['intro']],
['f', 'intro', '咖啡的主要种植带大致位于哪里？', ['南北回归线之间的热带地区', '北纬 40° 以北', '只在赤道 0°–1° 范围内', '地中海沿岸'], 0, '生豆初级课纲：咖啡种植于南北回归线之间（Tropic of Cancer 与 Tropic of Capricorn）的热带地区，俗称「咖啡带」。', ['greenf']],
['f', 'intro', '入门课纲提到，法国人于 1715 年把咖啡带到哪座岛，后来以该岛命名了重要的阿拉比卡品种 Bourbon？', ['波旁岛（今留尼汪 Réunion）', '爪哇岛', '牙买加', '马达加斯加'], 0, '入门课纲的咖啡传播史：1715 年法国人把咖啡带到波旁岛（今留尼汪），由此产生了主要的阿拉比卡品种之一 Bourbon。', ['intro']],
['f', 'intro', '判断：「味道（taste）」和「风味（flavor）」是同一回事。', TF, 1, '错误。课纲把风味定义为口中感受到的味道（tastes）加上鼻后嗅觉感知的香气（aromas）的组合，味道只是其中一部分。', ['intro', 'sensf']],
['f', 'intro', '课纲中的基本味（basic tastes）有几种？', ['5 种', '3 种', '4 种', '9 种'], 0, '甜、酸、苦、咸、鲜（umami）共 5 种。风味轮内圈的 9 大类是香气 / 风味类别，不是基本味。', ['intro', 'sensf']],
['f', 'intro', '与阿拉比卡相比，罗布斯塔通常的特点是？', ['咖啡因含量更高（约两倍），苦味更明显', '酸度更明亮、更甜', '更不耐病虫害', '甜感更高'], 0, '化学文献给出的典型值：生豆咖啡因阿拉比卡约 1.3%、罗布斯塔约 2.3%，接近两倍；生豆课纲也写到罗布斯塔苦味更重、甜感更低、口感更厚，并且更抗病虫害。', ['chem', 'greenf']],
['f', 'intro', '按生豆初级课纲的一般描述，水洗（washed）与日晒（natural）的风味倾向是？', ['水洗通常更偏酸；日晒通常更甜、更有果味', '两者完全没有区别', '水洗更甜更果味；日晒更酸', '日晒一定带瑕疵味'], 0, '生豆初级课纲：把水洗咖啡描述为更酸，日晒咖啡更甜、更有果味。只是一般倾向。', ['greenf']],
['f', 'intro', '入门课纲提到，随着烘焙加深，酸度与甜感、苦味大致如何变化？', ['酸度下降，甜感和苦味上升', '酸度上升，苦味下降', '三者都不变', '甜感和苦味同时下降'], 0, '课纲：烘焙过程中酸度逐渐减弱，甜感与苦味增加；研究也发现更深的烘焙带来更多苦味、更少酸度。', ['intro', 'roastsci']],
['f', 'intro', '以下哪一项「不是」课纲列出的、会让咖啡豆变不新鲜的主要因素？', ['豆袋上印的字', '空气（氧化）', '湿气', '光照'], 0, '入门课纲：咖啡接触空气会氧化、品质下降；咖啡师初级课纲提到要防空气、湿气和光；冲煮初级课纲还列出极端温度。', ['intro', 'bfc']],
['f', 'intro', '判断：豆仓（hopper）里的豆子适合放好几天，慢慢用完再补充。', TF, 1, '错误。入门课纲：放进豆仓的豆子应当天用完，研磨后立即使用；咖啡师初级课纲也提到不要让豆子在豆仓里过夜。', ['intro']],
['f', 'intro', '课纲中「理想」的萃取率（extraction）范围是？', ['18–22%', '5–8%', '30–35%', '40–50%'], 0, '与 SCA 金杯标准一致：萃取率 18–22%（低于约 18% 偏萃取不足，高于约 22% 偏萃取过度）。', ['intro', 'std']],
['f', 'intro', '入门课纲里多数冲煮方式建议的水温大约是？', ['92–96 °C', '70–75 °C', '80–85 °C', '持续沸腾的 100 °C'], 0, '课纲给出约 92–96 °C；SCA 冲煮最佳实践写作 94.0 °C ±2 °C。', ['intro', 'prot']],
['f', 'intro', '课纲中意式浓缩（espresso）常见的萃取时间是？', ['20–30 秒', '5–10 秒', '60–90 秒', '3–4 分钟'], 0, '入门与咖啡师初级课纲都写作 20–30 秒。', ['intro', 'bfc']],
['f', 'intro', '判断：咖啡粉里只有一部分物质能溶进杯中，而且其中既有好味道也有不好的味道。', TF, 0, '正确。课纲用这一点解释为什么要控制萃取；研究估计烘焙咖啡中可溶部分通常约 30%。', ['intro', 'ey']],
['f', 'intro', '入门课纲提到的金杯（Gold Cup）滤泡咖啡粉量，大约是每升水多少克咖啡？', ['50–60 g', '10–15 g', '100–120 g', '5 g'], 0, '课纲写作约 50–60 g/L；SCA 冲煮最佳实践则写 55 g/L ±10%。', ['intro', 'prot']],
// ───────── 初级 · 咖啡师技能 Barista Skills ─────────
['f', 'barista', 'Barista Foundation 课纲中，单份意式浓缩的粉量范围是？', ['7–10 g', '3–5 g', '12–15 g', '20–25 g'], 0, '课纲给出：单份 7–10 g，双份 14–20 g。', ['bfc']],
['f', 'barista', 'Barista Foundation 课纲中，双份意式浓缩的粉量范围是？', ['14–20 g', '7–10 g', '25–30 g', '10–12 g'], 0, '双份约为单份的两倍：14–20 g。', ['bfc']],
['f', 'barista', '课纲中意式浓缩的粉液比（brew ratio）范围是？', ['1:1.5 – 1:2.5', '1:15 – 1:17', '1:5 – 1:6', '1:0.5'], 0, '课纲：粉液比 1:1.5–1:2.5，萃取时间 20–30 秒。1:15 左右是滤泡咖啡的比例。', ['bfc']],
['f', 'barista', '其他条件不变，一杯意式浓缩只用 12 秒就流完了。通常应该怎么调整？', ['把研磨调细', '把研磨调粗', '把粉量减到 5 g', '把水温降到 80 °C'], 0, '流速太快多半是研磨太粗；课纲要求通过调整研磨把萃取时间拉回 20–30 秒范围。', ['bfc']],
['f', 'barista', '课纲把意式浓缩的质量归因于五个相互依存的要素。下列哪一项「不」属于其中？', ['牛奶', '咖啡豆', '磨豆机', '水'], 0, '五要素：咖啡豆、咖啡师、咖啡机、磨豆机、水。牛奶影响奶咖，不在浓缩五要素里。', ['bfc']],
['f', 'barista', '课纲中「萃取不足（under-extracted）」的意式浓缩通常有什么特征？', ['body 薄、味道不平衡、酸度高、crema 差', '苦味很重', 'body 好、圆润顺滑、平衡', '甜感特别突出'], 0, '咖啡师初级课纲：萃取不足 —— body 薄、不平衡、酸度高、crema 差；萃取过度 —— 不平衡、苦味高、crema 差；合格的浓缩 —— body 好、圆润顺滑、平衡。', ['bfc']],
['f', 'barista', '课纲中「萃取过度（over-extracted）」的意式浓缩通常有什么特征？', ['味道不平衡、苦味高、crema 差', 'body 薄、酸度高', 'body 好、圆润顺滑、平衡', '没有任何味道'], 0, '咖啡师初级课纲：萃取过度 —— 不平衡、苦味高、crema 差。', ['bfc']],
['f', 'barista', 'Barista 课纲建议的奶温范围（在杯中测量）是？', ['55–65 °C', '40–45 °C', '75–85 °C', '90 °C 以上'], 0, '咖啡师中级课纲写明：理想奶温 55–65 °C（131–149 °F），在杯中测量；最高 70 °C，最低 50 °C。', ['bic']],
['f', 'barista', '判断：牛奶温度应该在拉花钢杯里测量。', TF, 1, '错误。课纲要求在杯中（in the cup）测量饮品温度。', ['bic']],
['f', 'barista', '关于牛奶，下列哪项做法符合课纲？', ['不重复加热（不 re-steam）已打过的牛奶', '剩下的奶可以再次蒸汽加热', '提前把钢杯装满牛奶备用', '牛奶可以长时间放在冰箱外'], 0, '咖啡师初级课纲：牛奶不重复打发；不提前装满钢杯；尽量缩短牛奶离开冰箱的时间；库存先进先出（first in first out）。', ['bfc']],
['f', 'barista', '课纲对已烘焙咖啡豆新鲜度的建议是？', ['密封袋装，最好在烘焙后约 1 个月内用完（最多不超过 3 个月）', '烘焙后 1 周内必须用完，否则不能用', '一年内风味都一样', '开封后放冰箱冷藏最好'], 0, '咖啡师初级课纲：用密封袋保存，理想是烘焙后 1 个月内用完，最长不超过 3 个月。', ['bfc']],
['f', 'barista', '研磨好的咖啡粉应在多久内用来萃取？', ['3 分钟内', '30 分钟内', '3 小时内', '第二天也可以'], 0, '课纲：研磨后 3 分钟内萃取，否则香气迅速流失。', ['bfc']],
['f', 'barista', '开工前检查咖啡机，课纲提到锅炉压力应该达到大约多少才可使用？', ['约 1 bar', '约 9 bar', '0 bar', '约 15 bar'], 0, '咖啡师初级课纲的开机准备：确认锅炉压力已达到 1 bar 再使用，并预热冲煮手柄、为蒸汽棒 / 台面 / 手柄准备不同的抹布。', ['bfc']],
['f', 'barista', '课纲要求每天至少做一次的咖啡机清洁是？', ['用咖啡机清洁剂回冲（back flush）', '拆开锅炉除垢', '更换磨盘', '更换冲煮头垫圈'], 0, '课纲：每天至少一次用咖啡机清洁剂回冲；清洁和更换磨盘、更换冲煮头垫圈在中级课纲里属于预防性维护。', ['bfc', 'bic']],
['f', 'barista', '课纲中顾客服务的四个方面是？', ['产品、氛围、工作环境、服务', '价格、速度、广告、装修', '咖啡、牛奶、糖、杯子', '早班、午班、晚班、周末'], 0, '课纲列出客户体验的四个方面：products / atmosphere / work environment / service。', ['bfc']],
['f', 'barista', '每次打完奶之后，蒸汽棒应该怎么处理？', ['立刻擦拭，擦完再空喷（purge）一次', '收工时再一起擦', '泡在牛奶壶里', '不用处理'], 0, '咖啡师初级课纲：打奶前先空喷，打完立即擦拭蒸汽棒，擦完再空喷；中级课纲也指出不及时清洁和空喷会带来卫生和堵塞问题。', ['bfc', 'bic']],
// ───────── 初级 · 冲煮 Brewing ─────────
['f', 'brew', 'SCA 金杯标准（Golden Cup）的萃取浓度 TDS 是？', ['1.15–1.35%', '0.5–0.7%', '2.5–3.0%', '8–12%'], 0, 'SCA Coffee Standards：TDS 1.15–1.35%（11.5–13.5 g/L），萃取率 18–22%。', ['std']],
['f', 'brew', '金杯标准中的萃取浓度如果用 g/L 表示是？', ['11.5–13.5 g/L', '1.15–1.35 g/L', '115–135 g/L', '18–22 g/L'], 0, '1.15–1.35% ≈ 11.5–13.5 g/L（SCA Coffee Standards）。', ['std']],
['f', 'brew', 'SCA 冲煮最佳实践推荐的粉水比是？', ['55 g/L ±10%', '10 g/L', '100 g/L', '30 g/L ±50%'], 0, 'SCA Protocols & Best Practices：每升水 55 g 咖啡，允许 ±10%。', ['prot']],
['f', 'brew', 'SCA 冲煮最佳实践对接触咖啡粉的水温建议是？', ['94.0 °C ±2 °C（200 °F ±5 °F）', '85 °C ±2 °C', '100 °C', '75 °C'], 0, '最佳实践：水与咖啡接触时 200 °F ±5 °F，即 94.0 °C ±2 °C；课纲写作约 92–96 °C。', ['prot', 'brewf']],
['f', 'brew', '「浓度（strength）」与「萃取率（extraction）」的区别是？', ['浓度是杯中溶解物的浓淡；萃取率是咖啡粉有多少被溶出', '两者是同一个意思', '浓度只和水温有关', '萃取率只和杯子大小有关'], 0, '课纲区分两者：strength = TDS（杯中有多浓）；extraction = 粉中被溶出的比例。浓的咖啡不一定萃取过度。', ['brewf', 'ey']],
['f', 'brew', '其他条件不变，把研磨调细通常会怎样？', ['萃取更快更多，水流通过更慢', '萃取更少', '水流通过更快', '没有任何影响'], 0, '课纲：研磨越细，表面积越大、萃取越快；在滴滤中也会让水流变慢、接触时间变长。', ['brewf', 'ey']],
['f', 'brew', '课纲中大量（1 升以上）滤泡咖啡建议的冲煮时间是？', ['4–6 分钟', '20–30 秒', '15 分钟', '30 分钟'], 0, '课纲：大批量滤泡约 4–6 分钟；单杯约 1–3 分钟；意式 20–30 秒。', ['brewf']],
['f', 'brew', 'Brewing Foundation 课纲中，单杯手冲 / 滤泡的建议冲煮时间是？', ['1–3 分钟', '4–6 分钟', '8–10 分钟', '20–30 秒'], 0, '课纲：单杯 1–3 分钟。', ['brewf']],
['f', 'brew', '冲煮时增加水流扰动（turbulence，例如搅拌）通常会？', ['增加萃取', '减少萃取', '完全没影响', '只会让水温升高'], 0, '课纲把扰动列为影响萃取的因素之一：扰动越多，萃取越多。', ['brewf']],
['f', 'brew', '按课纲的分类，法压壶（French press）属于哪一类冲煮方式？', ['浸泡式（immersion）', '重力滴滤（gravity / drip）', '加压式（pressure）', '冷萃专用'], 0, '课纲把冲煮方式分为浸泡、重力（滴滤）和加压三类；法压壶是浸泡式，意式是加压式。', ['brewf']],
['f', 'brew', '煮好的咖啡长时间放在加热板上保温（hot holding），会怎样？', ['风味逐渐变差', '越放越好喝', '风味不变', '咖啡因会翻倍'], 0, '冲煮初级课纲：随着时间推移，温度流失和 / 或蒸发会让咖啡的香气和味道劣化。', ['brewf']],
['f', 'brew', 'SCA 冲煮用水标准中，TDS 的目标值是？', ['150 mg/L（可接受 75–250 mg/L）', '0 mg/L', '500 mg/L', '1000 mg/L'], 0, 'SCA Coffee Standards 水标准：TDS 目标 150 mg/L，可接受范围 75–250 mg/L。', ['std']],
['f', 'brew', 'SCA 冲煮用水标准中，氯（chlorine）的目标值是？', ['0 mg/L', '10 mg/L', '50 mg/L', '越多越好'], 0, '水应无氯（目标 0 mg/L），气味干净、清澈无色。', ['std']],
['f', 'brew', 'SCA 冲煮用水标准中，pH 的目标值是？', ['7.0（可接受 6.5–7.5）', '4.0', '9.5', '2.0'], 0, '水标准：pH 目标 7.0，范围 6.5–7.5。', ['std']],
['f', 'brew', '判断：按 2004 版 SCA 杯测规范，杯测用水最好用蒸馏水或软化水。', TF, 1, '错误。2004 版杯测规范要求水干净、无异味，但不应使用蒸馏水或软化水。', ['prot']],
['f', 'brew', '哪种滤材会吸附较多油脂，让杯中 body 偏轻、油脂较少？', ['滤纸', '金属滤网', '法压壶滤网', '意式滤杯'], 0, '滤纸能非常有效地吸附油脂，因此纸滤咖啡脂肪含量低；金属滤网会让更多油脂和细粉进入杯中。', ['ey']],
['f', 'brew', 'SCA 冲煮最佳实践中，粗研磨（coarse）建议的接触时间是？', ['6–8 分钟', '1–4 分钟', '4–6 分钟', '20 秒'], 0, '最佳实践：细研磨 1–4 分钟，滴滤研磨 4–6 分钟，粗研磨 6–8 分钟。', ['prot']],
// ───────── 初级 · 生豆 Green Coffee ─────────
['f', 'green', '商业上最主要的两个咖啡物种是？', ['阿拉比卡与卡内弗拉（罗布斯塔）', '阿拉比卡与利比里卡', '波旁与铁皮卡', '罗布斯塔与瑰夏'], 0, '课纲：Coffea arabica 与 Coffea canephora（Robusta）。波旁、铁皮卡、瑰夏都是阿拉比卡的品种。', ['greenf']],
['f', 'green', 'Bourbon（波旁）和 Typica（铁皮卡）属于什么？', ['阿拉比卡的品种（variety）', '独立的咖啡物种', '处理法', '产区名称'], 0, '课纲区分物种（species）和品种（variety / cultivar）：它们都是阿拉比卡之下的品种。', ['greenf', 'intro']],
['f', 'green', '阿拉比卡是由哪两个二倍体物种自然杂交形成的四倍体？', ['C. canephora × C. eugenioides', 'C. liberica × C. canephora', 'C. arabica × C. racemosa', 'Bourbon × Typica'], 0, 'World Coffee Research：阿拉比卡是 C. canephora 与 C. eugenioides 杂交形成的异源四倍体（2n = 44），亲本各 22 条染色体。', ['wcr']],
['f', 'green', '与阿拉比卡相比，罗布斯塔通常更耐什么？', ['病虫害，且潜在产量更高', '霜冻和低温', '高海拔的寒冷', '干旱的沙漠气候'], 0, '生豆初级课纲：罗布斯塔更抗病虫害，潜在产量比阿拉比卡高约 50%；它需要比阿拉比卡更温暖、持续湿润的气候。', ['greenf']],
['f', 'green', '按 2018 年版生豆初级课纲，世界阿拉比卡与罗布斯塔的产量比例大约是？（每年会变化）', ['约 60% : 40%', '约 90% : 10%', '约 50% : 50%', '约 20% : 80%'], 0, '课纲（2018 版）写作阿拉比卡约 60%、罗布斯塔约 40%。这是当时的约数，逐年会变化。', ['greenf']],
['f', 'green', '按课纲，世界最大的咖啡生产国是？', ['巴西', '越南', '哥伦比亚', '埃塞俄比亚'], 0, '课纲：巴西是最大的咖啡生产国，也是最大的阿拉比卡和日晒豆生产国。', ['greenf']],
['f', 'green', '按课纲，最大的罗布斯塔生产国是？', ['越南', '巴西', '印度', '乌干达'], 0, '课纲：越南是最大的罗布斯塔生产国。', ['greenf']],
['f', 'green', '按课纲，最大的水洗阿拉比卡生产国是？', ['哥伦比亚', '巴西', '越南', '印度尼西亚'], 0, '课纲：哥伦比亚是最大的水洗阿拉比卡生产国。', ['greenf']],
['f', 'green', '生豆初级课纲列出的干燥方式不包括哪一项？', ['冷冻干燥', '晒场（patio）', '非洲棚架（raised beds）', '机械干燥（mechanical dryer）'], 0, '课纲列出晒场、非洲式架高棚床和机械干燥机。冷冻干燥是速溶咖啡的工艺，不是生豆处理。', ['greenf']],
['f', 'green', '生豆初级课纲中，生豆含水率的合适范围是？', ['8–12.5%', '1–2%', '20–25%', '15–18%'], 0, '课纲引用 ICO 第 420 号决议：8–12.5%；ICO 的出口质量计划也以 8% 与 12.5% 作为下限 / 上限（ISO 6673 测定）。', ['greenf', 'grade']],
['f', 'green', '阿拉比卡与罗布斯塔的期货分别主要在哪里交易？', ['阿拉比卡在纽约，罗布斯塔在伦敦', '阿拉比卡在伦敦，罗布斯塔在纽约', '都在东京', '都在新加坡'], 0, '生豆初级课纲：阿拉比卡主要在纽约期货市场交易，罗布斯塔主要在伦敦；期货市场的设立是为了降低风险。', ['greenf']],
['f', 'green', '课纲给出的生豆储存理想条件大约是？', ['约 20 °C、约 60% 相对湿度', '约 35 °C、90% 相对湿度', '-18 °C 冷冻', '5 °C、100% 相对湿度'], 0, '生豆初级课纲：特殊咖啡最佳储存条件为 20 °C、60% 相对湿度；出口前通常在略低于 12% 含水率的状态下静置至少 2 个月。', ['greenf']],
['f', 'green', '生豆存放过久（陈豆 old crop）后，杯中常出现的典型描述是？', ['木质味（woody）', '明亮的花香', '柑橘酸', '新鲜的浆果'], 0, '生豆初级课纲：生豆储存久了会变得不新鲜，这种感官特征被归类为 woody。', ['greenf']],
['f', 'green', '生豆初级课纲提到，欧盟对低因咖啡（decaf）的咖啡因上限是干重的多少？', ['0.1%', '1%', '2%', '0.5%'], 0, '生豆初级课纲：在欧盟国家，低因咖啡的咖啡因含量按干物质计最高 0.1%。', ['greenf']],
['f', 'green', '判断：按 SCA Coffee Standards（2018），特殊级（Specialty grade）生豆样品须为 0 个一类瑕疵，且二类瑕疵不超过 5 个。', TF, 0, '正确。样品为 350 g 生豆；一类（Category 1）瑕疵为 0，二类（Category 2）不超过 5 个。', ['std']],
['f', 'green', '生豆分级（grading）通常主要依据什么？', ['瑕疵数量和豆子大小（筛网目数）', '麻袋的颜色', '出口港口', '咖啡师的喜好'], 0, '课纲：分级依据瑕疵、尺寸（screen size）等；一些产国还按海拔或产区分级。', ['greenf', 'grade']],
// ───────── 初级 · 烘焙 Roasting ─────────
['f', 'roast', '下列哪一项「不是」烘焙过程中会发生的变化？', ['豆子重量增加', '水分蒸发', '颜色由绿变黄再变棕', '一爆（first crack）'], 0, '烘焙中豆子会失重（主要是水分），不会增重。课纲列出：水分蒸发、颜色变化、一爆、体积变化、二爆。', ['roastf', 'roastsci']],
['f', 'roast', '研究文献中，烘焙失重（roast loss）通常约为？', ['15–22%', '1–2%', '约 50%', '0%'], 0, 'Münchow 等（2020）的综述：豆子失重约 15–22%，大部分是水分。', ['roastsci']],
['f', 'roast', '烘焙后咖啡豆的体积通常会？', ['增加约 50% 到接近 100%', '缩小一半', '不变', '增加 10 倍'], 0, '研究文献：体积增加约 50% 至接近 100%，结构变得多孔。', ['roastsci']],
['f', 'roast', '文献报告的一爆（first crack）大约发生在豆温多少？', ['约 180–200 °C', '约 100 °C', '约 120–130 °C', '约 260–280 °C'], 0, 'Bicho 等（2012）报告豆子爆裂在 180–200 °C；实际读数取决于烘焙机和探针位置。', ['roastsci']],
['f', 'roast', '「发展时间（development time）」通常是指？', ['从一爆开始到下豆的时间', '从入豆到一爆的时间', '从入豆到回温点的时间', '冷却所需的时间'], 0, '发展时间 = 一爆到烘焙结束（下豆）。课纲要求在烘焙记录中记录它。', ['roastsci', 'roastf']],
['f', 'roast', '热量传递的三种方式是？', ['传导、对流、辐射', '蒸发、凝结、升华', '加压、减压、真空', '研磨、萃取、过滤'], 0, '在热风烘焙机中，三种方式同时存在：热风对流、热壁和豆与豆之间的传导，以及辐射。', ['roastsci', 'roastf']],
['f', 'roast', '流化床（fluid-bed）热风烘焙机主要靠哪种方式传热？', ['对流', '传导', '微波', '电磁感应'], 0, '流化床用穿过孔板的高速热风托起豆子，主要靠对流；直火滚筒的热筒壁会让传导变得显著。', ['roastsci']],
['f', 'roast', '烘焙越深，杯中通常会？', ['苦味增加、酸度和果味下降', '酸度上升、苦味下降', '甜感和酸度都上升', '咖啡因大幅增加'], 0, '多项感官研究：更深的烘焙带来更多苦味、更少的酸度、果味和甜感。', ['roastsci', 'intro']],
['f', 'roast', '课纲描述的热量传递顺序是？', ['热源 → 空气 / 烘焙腔 → 咖啡豆', '咖啡豆 → 热源 → 空气', '空气 → 热源 → 豆子', '冷却盘 → 豆子 → 热源'], 0, 'Roasting Foundation 课纲：热源加热空气和烘焙腔，再把热传给豆子。', ['roastf']],
['f', 'roast', '课纲建议烘焙记录（roast log）记录哪些信息？', ['时间–温度、颜色、失重、体积增加和杯测观察', '只写豆子名字', '只写顾客名字', '不需要记录'], 0, '烘焙初级课纲：烘焙记录包括时间–温度（烘焙曲线）、熟豆颜色、失重、体积增加和杯测观察，并据此计算发展时间等；它是品质控制的工具。', ['roastf']],
['f', 'roast', '课纲提到的烘焙安全风险重点包括？', ['烘焙机起火、通风与人身安全', '豆子太甜', '杯子太小', '牛奶过期'], 0, '烘焙初级课纲：常见危险包括烘焙机起火、通风问题和人身安全；日常保养包括清除银皮 / 沉积物、润滑、熟悉说明书。', ['roastf']],
['f', 'roast', '梅纳反应（Maillard reaction）主要发生在哪两类物质之间？', ['还原糖与氨基酸', '脂肪与水', '咖啡因与氧气', '盐与酸'], 0, '咖啡风味大多来自非酶褐变：糖与氨基酸之间的梅纳反应和焦糖化。', ['roastsci']],
['f', 'roast', '咖啡因在烘焙过程中会怎样？', ['相当耐热，几乎不受烘焙影响', '完全分解', '增加一倍', '变成糖'], 0, '咖啡因热稳定，烘焙对它影响很小；绿原酸则会大量分解。', ['roastsci']],
['f', 'roast', 'SCA 杯测样品烘焙的建议时长是？', ['8–12 分钟', '2–3 分钟', '20–25 分钟', '45 分钟'], 0, 'SCA 杯测标准：样品烘焙 8–12 分钟，烘焙后 8–24 小时内杯测。', ['std']],
['f', 'roast', 'Agtron 色值读数越高代表？', ['烘焙越浅', '烘焙越深', '豆子越新鲜', '豆子越重'], 0, 'Agtron 读数越高越浅、越低越深；SCA 杯测样品目标为 Agtron Gourmet 63.0（±1）左右，属于浅中焙。', ['agtron', 'std']],
['f', 'roast', '下豆（drop）之后应该怎样处理？', ['迅速冷却（冷风或定量喷水）停止反应', '留在滚筒里慢慢降温', '马上密封装袋保温', '泡在冷水里'], 0, '豆子出锅后要迅速用冷风或定量喷水（water quenching）冷却，防止继续褐变和香气流失。', ['roastsci']],
// ───────── 初级 · 感官技能 Sensory Skills ─────────
['f', 'sensory', 'Sensory Foundation 课纲认为评价咖啡最关键的三种感觉是？', ['嗅觉、味觉、触觉（口感）', '视觉、听觉、触觉', '听觉、味觉、平衡感', '视觉、嗅觉、听觉'], 0, '课纲：olfaction（嗅觉）、gustation（味觉）和 taction（触觉 / 口感）。', ['sensf']],
['f', 'sensory', '五种基本味是？', ['甜、酸、苦、咸、鲜', '甜、酸、苦、咸、辣', '甜、苦、涩、香、鲜', '酸、辣、麻、苦、甜'], 0, '辣和麻是痛觉 / 触觉，涩是触感，都不是基本味。', ['sensf']],
['f', 'sensory', '「捏住鼻子喝咖啡」的小实验主要能说明什么？', ['风味需要嗅觉参与，捏鼻后多半只剩基本味', '舌头不同部位只能尝不同味道', '咖啡里没有香气', '温度不影响味觉'], 0, '课纲：风味 = 味道 + 香气；阻断鼻后嗅觉后，大部分「风味」感知会消失。', ['sensf', 'intro']],
['f', 'sensory', 'Sensory Foundation 课纲中，SCA 风味轮（Flavor Wheel）内圈有几大类？', ['9 类', '5 类', '12 类', '36 类'], 0, '课纲：风味轮内圈有 9 个主要类别，越往外越具体。', ['sensf']],
['f', 'sensory', '「Body」在课纲里描述的是？', ['咖啡在口中的物理感受：饱满度、厚重感', '酸度的高低', '香气的强度', '咖啡液的颜色'], 0, '课纲定义 body 为饮品的物理特性，即口中的饱满、厚重感（mouthfeel 的一部分）。', ['sensf']],
['f', 'sensory', 'SCA 杯测标准的粉水比是？', ['每 150 ml 水 8.25 g 咖啡（0.055 g/ml）', '每 250 ml 水 15 g', '每 100 ml 水 20 g', '每 300 ml 水 5 g'], 0, 'SCA Coffee Standards：8.25 g ±0.25 g / 150 ml 水，即 0.055 g/ml。', ['std']],
['f', 'sensory', 'SCA 杯测标准的注水温度是？', ['200 °F ±2 °F（约 92.2–94.4 °C）', '85 °C', '持续沸腾的 100 °C', '70 °C'], 0, 'SCA Coffee Standards：水温 200 °F ±2 °F，换算约 92.2–94.4 °C。', ['std']],
['f', 'sensory', 'SCA 杯测标准对研磨度的要求是？', ['70–75% 的粉能通过美国 20 号筛（850 µm）', '全部能通过 100 号筛', '像意式一样细', '整颗豆子'], 0, '杯测研磨比滤泡稍粗：70–75% 通过 US Standard 20 号筛（感官初级课纲注明为 850 µm 筛孔）。', ['std', 'sensf']],
['f', 'sensory', 'SCA 杯测样品应在烘焙后多久进行杯测？', ['8–24 小时内', '刚出锅立即', '1 周后', '1 个月后'], 0, 'SCA 杯测标准：烘焙后 8–24 小时内杯测。', ['std']],
['f', 'sensory', '按 2004 版 SCA 杯测规范，研磨后应在多久内注水？', ['15 分钟内（加盖保存时不超过 30 分钟）', '1 小时内', '1 天内', '没有要求'], 0, 'Protocols：研磨后 15 分钟内注水；若无法做到，要加盖，并在 30 分钟内注水。', ['prot']],
['f', 'sensory', '按 2004 版 SCA 杯测规范，注水后粉层结成的「壳」（crust）应保持多久再破渣（break）？', ['3–5 分钟', '10–15 秒', '20 分钟', '立刻'], 0, 'Protocols：crust 保持 3–5 分钟不破，然后用杯测勺搅三下破渣，同时闻香。', ['prot', 'sensf']],
['f', 'sensory', '按 2004 版 SCA 杯测规范，每个样品至少准备几杯，以评估一致性？', ['5 杯', '1 杯', '2 杯', '10 杯'], 0, 'Protocols：每个样品至少 5 杯，用来评估一致性（uniformity）。', ['prot']],
['f', 'sensory', '课纲中「涩感（astringent）」的描述是？', ['口腔发干、收敛的余韵感，咖啡里通常不受欢迎', '一种讨喜的甜味', '花香', '柑橘般明亮的酸'], 0, '课纲定义：astringent 是一种让口腔干燥的余韵感受，在咖啡中通常不受欢迎。', ['sensf']],
['f', 'sensory', '判断：感官分析的目标是客观描述和区分属性，而不是只说自己喜不喜欢。', TF, 0, '正确。课纲区分描述性评估与喜好；新版 SCA CVA 也把描述性（103）和情感性 / 喜好（104）评估分开。', ['sensf', 'cva']],
['f', 'sensory', '下列哪一项「不是」课纲列出的杯测目的？', ['决定咖啡的零售价格', '找出瑕疵与污染味（taints / faults）', '找出令人愉悦的风味并评估其品质', '评估各属性的强度并记录结果'], 0, '课纲列出的目的：找出瑕疵与污染味、找出愉悦风味、评估强度、记录结果。定价不是杯测本身的目的。', ['sensf']],
['f', 'sensory', '判断：杯测时所有杯子应为相同容量、尺寸和材质，并保持干净无味。', TF, 0, '正确。杯测规范要求所有杯具一致、干净、无气味，并在室温下使用。具体尺寸各版本写法不同，这里不考数字。', ['sensf', 'std']],
// ───────── 中级 · 咖啡师技能 Barista Skills ─────────
['i', 'barista', '在即磨（on-demand / doserless）磨豆机上调细研磨，同时还常常会？', ['改变出粉量（定时出粉时剂量会变）', '完全不影响剂量', '改变锅炉水温', '改变泵压'], 0, '中级课纲要求理解即磨与带分量器磨豆机的差异：定时出粉时，研磨粗细会影响出粉量，所以改研磨后要重新称剂量。', ['bic']],
['i', 'barista', '中级课纲列出的通道效应（channeling）成因中，「不」包括哪一项？', ['使用过滤后的新鲜水', '布粉不均', '压粉倾斜', '压粉后敲打手柄'], 0, '课纲列出：布粉不均、压粉倾斜、压粉后敲打冲煮把手、滤杯堵塞或品质差。', ['bic']],
['i', 'barista', '中级课纲提到，磨豆机在高峰期发热会带来什么影响？', ['影响研磨和萃取，咖啡师需要预判并调整研磨', '完全没有影响', '让咖啡豆更新鲜', '让牛奶更甜'], 0, '课纲：磨豆机升温会改变研磨表现，忙时要监测并调整。', ['bic']],
['i', 'barista', '把一杯意式浓缩分成前、中、后三段分别品尝（课纲练习），通常会发现？', ['三段味道不同：不同物质溶出速度不同', '三段完全一样', '只有最后一段有咖啡因', '只有第一段有味道'], 0, '课纲练习：把浓缩分三段品尝，体会萃取过程中酸、甜、苦等物质的溶出顺序。', ['bic', 'ey']],
['i', 'barista', 'Espresso Brew Formula（EBF）的计算方式是？', ['粉重 ÷ 液重 × 100%', '液重 ÷ 粉重 × 100%', '萃取时间 ÷ 粉重', 'TDS × 液重'], 0, 'EBF（%）= 粉重 ÷ 浓缩液重 × 100。中级课纲要求比较 40% 与 60% EBF 的浓缩。', ['ebf', 'bic']],
['i', 'barista', '18 g 粉萃出 30 g 浓缩液，EBF 是多少？', ['60%', '40%', '167%', '30%'], 0, '18 ÷ 30 × 100 = 60%。EBF 越高，液重相对粉量越少，杯中越浓。', ['ebf']],
['i', 'barista', '中级课纲要求理解牛奶中哪两种成分对起泡和泡沫稳定性的作用？', ['蛋白质与脂肪', '乳糖与钙', '水与维生素', '盐与糖'], 0, '课纲：蛋白质帮助形成和稳定泡沫，脂肪影响口感与泡沫稳定性。', ['bic']],
['i', 'barista', '关于植物奶 / 替代奶，中级课纲的要求是？', ['了解不同替代奶的打发特性并能调整技巧', '所有替代奶打发方式都和牛奶完全一样', '替代奶都不能打发', '只能做冷饮'], 0, '课纲要求了解非乳制品替代奶的成分和打发表现差异，并调整技术。', ['bic']],
['i', 'barista', '中级课纲要求奶泡质量至少达到 SCA Foam Quality Guide 的第几级？', ['第 2 级或以上', '第 0 级', '第 5 级以上', '没有要求'], 0, '课纲：奶泡需达到 Foam Quality Guide Level 2 或以上。', ['bic']],
['i', 'barista', '中级课纲中复杂订单的工作流程要求是？', ['在 5 分钟内完成 4 杯饮品', '30 秒内完成 4 杯', '15 分钟内完成 1 杯', '没有时间要求'], 0, '课纲：在 5 分钟内为一位顾客做出 4 杯饮品，同时保持品质与清洁。', ['bic']],
['i', 'barista', '中级课纲的服务补救（service recovery）步骤中，「不」应该做的是？', ['否认问题或急着解释', '倾听，不往心里去', '真诚道歉', '采取适当行动并让顾客知情'], 0, '课纲列出：倾听 / 不要往心里去 / 真诚道歉 / 采取适当行动并告知顾客 / 永远不要否认或辩解 / 事后评估。', ['bic']],
['i', 'barista', '中级课纲用什么方法减少吧台的交叉污染？', ['用不同颜色区分抹布用途', '所有地方用同一块抹布', '抹布用完不洗', '用牛奶钢杯装清洁剂'], 0, '中级课纲在防交叉污染部分要求用颜色区分抹布；初级课纲也要求蒸汽棒、台面、手柄各用不同的抹布。', ['bic']],
['i', 'barista', '单锅炉与多锅炉咖啡机的主要差别，中级课纲关注的是？', ['水在锅炉系统中的流动方式，以及对温度稳定性的影响', '外壳颜色', '能否打奶', '品牌'], 0, '课纲要求解释单锅炉与多锅炉机器中水的流动方式，以及它对冲煮温度稳定性的影响。', ['bic']],
['i', 'barista', '下列哪一项「不」在中级课纲的预防性维护清单里？', ['更换咖啡豆品种', '调整泵压', '清洁和更换磨盘', '更换冲煮头垫圈与分水网'], 0, '课纲列出：泵压调整、清洁 / 更换磨盘、更换冲煮头垫圈（含分水网）、重新组装蒸汽棒、更换滤水器。', ['bic']],
['i', 'barista', '中级课纲提到 SCA 新的处理法描述词，下列哪一个「不」在其中？', ['Sugar dried', 'Parchment dried', 'Pulp dried', 'Fruit dried'], 0, '咖啡师中级课纲列出 seed dried / parchment dried / pulp dried / fruit dried 这组描述词，并要求能尝出水洗与日晒的差别。', ['bic']],
['i', 'barista', '中级课纲中，咖啡师使用折射仪（refractometer）主要是为了？', ['测量 TDS，进而计算萃取率', '测量牛奶温度', '测量泵压', '测量豆子含水率'], 0, '课纲要求理解 TDS 与萃取率，并使用折射仪测量；萃取率 = TDS × 液重 ÷ 粉重。', ['bic', 'ey']],
['i', 'barista', '中级课纲中，意式浓缩的配方应怎样表达？', ['同时用 EBF 与粉液比（brew ratio）表达', '只说「一小杯」', '只写时间', '只写豆子名称'], 0, '课纲：浓缩配方以 EBF 和 brew ratio 两种方式表达，并配合时间等参数。', ['bic']],
// ───────── 中级 · 冲煮 Brewing ─────────
['i', 'brew', '萃取率（extraction yield, EY）的常用计算公式是？', ['EY = TDS × 饮品重量 ÷ 粉重', 'EY = TDS ÷ 粉重', 'EY = 粉重 ÷ 水重', 'EY = 水温 × 时间'], 0, 'EY（%）= TDS（%）× 饮品重量（g）÷ 粉重（g）。', ['ey']],
['i', 'brew', '18 g 粉、36 g 浓缩液、TDS 10%，萃取率是多少？', ['20%', '10%', '36%', '18%'], 0, '10% × 36 ÷ 18 = 20%。', ['ey']],
['i', 'brew', '55 g 粉、896 g 咖啡液、TDS 1.30%，萃取率约是多少？', ['约 21.2%', '约 13%', '约 1.3%', '约 55%'], 0, '1.30% × 896 ÷ 55 ≈ 21.2%，落在金杯 18–22% 内。', ['ey']],
['i', 'brew', '冲煮控制图（brewing control chart）最早发展于什么时候？', ['20 世纪 50 年代', '2010 年代', '18 世纪', '20 世纪 90 年代'], 0, '控制图源于 20 世纪 50 年代（1950s）；Lockhart 1957 年为 Coffee Brewing Institute 发表了相关研究。', ['ey']],
['i', 'brew', '在经典控制图上，萃取率低于约 18% 的区域一般称为？', ['萃取不足（under-extracted）', '萃取过度（over-extracted）', '理想区', '太浓'], 0, '18% 以下通常称萃取不足（偏酸），22% 以上称萃取过度（偏苦涩）。', ['ey']],
['i', 'brew', '研究发现，全浸泡式（full immersion）冲煮达到平衡时，改变粉水比主要会改变什么？', ['浓度 TDS，萃取率变化很小', '萃取率大幅变化，TDS 不变', '两者都不变', '只改变颜色'], 0, 'Liang 等（2021）：浸泡式在平衡时萃取率约 21%，在很宽的粉水比范围内变化不大；TDS 随粉水比变化。', ['ey']],
['i', 'brew', '滴滤研究中，冲煮后残留在湿粉层里的液体大约是每克粉多少？', ['约 2.1 g', '约 0.1 g', '约 10 g', '0 g'], 0, 'Guinard 等（2023）：液体保留比约 2.1 g/g，这部分不会进到杯里。', ['ey']],
['i', 'brew', '烘焙咖啡中能被水溶出的部分，研究中一般约占多少？', ['约 30%', '约 5%', '约 70%', '100%'], 0, '模型研究：烘焙咖啡通常约 30%（约三分之一）可溶，所以萃取率不可能无限提高。', ['ey']],
['i', 'brew', 'SCA 冲煮用水标准中，钙硬度（calcium hardness）的目标值是？', ['68 mg/L（约 4 grains）', '0 mg/L', '300 mg/L', '17 mg/L'], 0, '水标准：钙硬度目标 68 mg/L（17–85 mg/L），即 4 grains（1–5 grains）。', ['std']],
['i', 'brew', 'SCA 冲煮用水标准中，总碱度（total alkalinity）的目标是？', ['约 40 mg/L', '0 mg/L', '200 mg/L', '400 mg/L'], 0, '水标准：总碱度目标为 40 mg/L 或接近该值。', ['std']],
['i', 'brew', 'SCA 冲煮用水标准中，钠（sodium）的目标是？', ['约 10 mg/L', '约 100 mg/L', '0 mg/L', '约 500 mg/L'], 0, '水标准：钠为 10 mg/L 或接近该值。', ['std']],
['i', 'brew', 'SCA 冲煮最佳实践对滤材的要求：滤后沉淀物应少于？', ['每 100 ml 75 mg', '每 100 ml 750 mg', '每升 5 g', '没有要求'], 0, 'Protocols & Best Practices：滤材应使沉淀物低于 75 mg/100 ml。', ['prot']],
['i', 'brew', 'UC Davis（Batali 等，2020）在固定 TDS 和萃取率时，比较 87、90、93 °C 冲煮，发现水温对感官的影响？', ['很小', '非常大', '只影响颜色', '只影响咖啡因'], 0, '研究发现：TDS 和萃取率固定时，这三个水温之间的感官差异很小；TDS 对风味影响最大。', ['ey']],
['i', 'brew', '2023 年新版感官与消费者控制图研究中，消费者的偏好？', ['分成两个主要偏好群体', '全部偏好金杯中心点', '全部偏好最浓的咖啡', '没有任何偏好'], 0, 'Guinard 等（2023）：约 57% 偏好低 TDS，另外约 43% 有两个偏好区；作者认为经典「理想点」不适合所有人。', ['ey']],
['i', 'brew', '判断：用水质 TDS 笔（电导率仪）测得的「TDS」和用咖啡折射仪测得的 TDS 是同一种测量。', TF, 1, '错误。水质 TDS 笔测的是电导率，再按换算系数估算矿物质；咖啡折射仪通过折射率估算溶解的咖啡固形物。', ['ey']],
['i', 'brew', 'SCA 冲煮用水标准中，可接受的钙硬度范围是？', ['17–85 mg/L', '0–5 mg/L', '150–250 mg/L', '300–500 mg/L'], 0, '水标准：钙硬度 17–85 mg/L（1–5 grains），目标 68 mg/L。', ['std']],
['i', 'brew', '经典 SCA 金杯区（Golden Cup）对应控制图上的哪个区域？', ['TDS 1.15–1.35% 与萃取率 18–22% 的交集', 'TDS 2–3% 与萃取率 10–14%', 'TDS 0.8% 与萃取率 25–30%', '任何 TDS，萃取率 30% 以上'], 0, '经典图的中央「理想区」即 SCA 金杯标准：1.15–1.35% TDS，18–22% 萃取率。', ['std', 'ey']],
// ───────── 中级 · 生豆 Green Coffee ─────────
['i', 'green', 'SCA Coffee Standards 中，生豆分级样品重量是？', ['350 g', '100 g', '1 kg', '50 g'], 0, 'SCA 标准：用 350 g 生豆样品检查瑕疵。FAO 转载的较早 SCAA 方法写的是 300 g，版本不同。', ['std', 'grade']],
['i', 'green', 'SCA 分级标准对光线的要求是？', ['至少 4000 K、1200 lux 的光照', '昏暗的房间', '只用紫外线灯', '红光'], 0, 'SCA Coffee Standards：分级光源至少 4000 K、1200 lux，并使用不小于 2 ft × 2 ft 的黑色垫子。', ['std']],
['i', 'green', 'SCA Coffee Standards 中特殊级生豆的水活度（water activity）要求是？', ['低于 0.70 aw', '高于 0.95 aw', '正好 1.00 aw', '没有要求'], 0, '标准：特殊级生豆水活度须低于 0.70 aw。', ['std', 'grade']],
['i', 'green', '水活度（water activity）和含水率（moisture content）的区别是？', ['水活度反映「可被利用的游离水」，与微生物和稳定性关系更直接', '两者完全一样', '水活度是重量百分比', '含水率只用于烘焙豆'], 0, '含水率是水占重量的比例；水活度衡量水的可利用程度，所以 SCA 特殊级标准用 aw 来限定。', ['std', 'grade']],
['i', 'green', '按 SCA Protocols 的瑕疵计数，一颗豆子同时有多个瑕疵时怎么计？', ['只按对杯品影响最大的那一项计', '每一项都累加', '不计', '取平均'], 0, 'Protocols：一颗豆只计一次，归入最严重的瑕疵。', ['prot']],
['i', 'green', '按 SCA Protocols，全瑕疵数（full defects）怎样取整？', ['取整数，向下取整', '保留两位小数', '向上取整', '四舍五入到 0.5'], 0, 'Protocols：全瑕疵为整数，向下取整。', ['prot']],
['i', 'green', '按 SCA Protocols 的换算，几颗破碎豆（broken / chipped）算 1 个全瑕疵？', ['5 颗', '1 颗', '2 颗', '20 颗'], 0, 'Protocols：5 颗破碎豆 = 1 个全瑕疵（属于二类瑕疵）。', ['prot', 'grade']],
['i', 'green', '按 SCA Protocols，如何判定「酸豆（sour）」？', ['红褐色已完全渗入豆体；只在银皮上的叫 foxy，不算', '只要银皮发红就算', '只要闻起来有酸味就算', '豆子偏小就算'], 0, 'Protocols：颜色必须渗透进豆体才计为 sour；只停留在银皮上的是 foxy。', ['prot']],
['i', 'green', '按 SCA Protocols，未成熟豆（immature / unripe）的典型特征是？', ['银皮仍牢牢附着在豆子上', '豆子特别大', '颜色发黑', '豆子有虫洞'], 0, 'Protocols：未成熟豆的银皮紧贴不脱。', ['prot', 'grade']],
['i', 'green', '按 SCA Protocols，下列哪种生豆颜色「不」属于特殊级可接受的颜色？', ['偏黄绿（greenish）或更差', '蓝绿（blue-green）', '偏蓝绿（bluish-green）', '绿色（green）'], 0, 'Protocols：特殊级可接受 blue-green、bluish-green、green。', ['prot']],
['i', 'green', '判断：按 SCA Protocols，生豆有轻微外来异味时仍可评为特殊级。', TF, 1, '错误。Protocols：只有没有外来异味的样品才能评为特殊级。', ['prot']],
['i', 'green', '「18 目（screen 18）」是什么意思？', ['筛孔直径 18/64 英寸（约 7.14 mm）', '筛孔 18 mm', '每克 18 颗豆', '海拔 1800 米'], 0, '筛网号以 1/64 英寸为单位：18 号 = 18/64 in ≈ 7.14 mm。', ['grade', 'greenf']],
['i', 'green', '圆豆（peaberry）通常用哪种筛孔来分选？', ['长条形（槽形）孔', '圆孔', '三角孔', '不需要分选'], 0, '平豆用圆孔筛，圆豆形状较圆，用长条形孔筛分选。', ['grade']],
['i', 'green', 'FAO 转载的 SCAA 分级中，优质级（Premium）最多允许几个全瑕疵？', ['8 个', '5 个', '0 个', '23 个'], 0, 'SCAA（FAO 转载）：特殊级最多 5 个全瑕疵且无一类瑕疵；优质级最多 8 个。', ['grade']],
['i', 'green', 'Swiss Water® 低因法的特点是？', ['用水、温度、时间与活性炭过滤，不使用化学溶剂', '使用二氯甲烷溶剂', '使用超临界二氧化碳', '靠高温烘焙去除咖啡因'], 0, 'Swiss Water 用生豆萃取液（green coffee extract）配合活性炭过滤去除咖啡因，不加化学溶剂。', ['swiss']],
['i', 'green', 'ICO 出口质量计划中，生豆含水率的下限和上限是？', ['8% 与 12.5%（按 ISO 6673 测定）', '0% 与 2%', '20% 与 25%', '15% 与 18%'], 0, 'ICO 质量计划：按 ISO 6673 测定，含水率低于 8% 或高于 12.5% 的咖啡不得出口；SCA 生豆初级课纲也引用 8–12.5%。', ['grade', 'greenf']],
['i', 'green', 'Green Coffee Intermediate 课程（目录描述）涵盖下列哪组主题？', ['植物学与品种、处理法、低因、市场与分级', '拉花与奶泡', '吧台工作流程', '咖啡馆装修'], 0, 'SCA 课程目录：中级生豆涵盖植物学、种植与处理、低因、贸易与市场、分级等。', ['catalog']],
// ───────── 中级 · 烘焙 Roasting ─────────
['i', 'roast', '烘焙前期整体是吸热的；到后期会怎样？', ['逐渐转为放热，需要的外部热量减少', '始终强烈吸热', '完全不需要热', '变成冷却过程'], 0, '研究：前期需要大量能量蒸发水分（吸热），后期逐渐放热，若不及时停止，豆子甚至可能着火。转折点在文献中有争议。', ['roastsci']],
['i', 'roast', '在烘到相同颜色时，快烘（高温短时）的豆子与慢烘相比通常？', ['膨胀更多、孔隙更多、密度更低', '更致密、更小', '完全一样', '更容易保存'], 0, '研究：同色时快烘豆体积和孔隙率更大、密度更低，也更容易出油。', ['roastsci']],
['i', 'roast', 'Münchow 等（2020）汇总多项感官研究发现，对风味预测力更强的是？', ['烘焙颜色（烘焙度）', '总烘焙时间', '豆子产地海拔', '烘焙机品牌'], 0, '在同时改变颜色和时间的两项研究中，烘焙颜色是更强的预测因子；单独的总时间与风味无显著相关。', ['roastsci']],
['i', 'roast', '在颜色相同的前提下，哪个时间参数对风味影响更大？', ['一爆后的发展时间', '入豆到一爆的时间', '冷却时间', '预热时间'], 0, 'Münchow 等（2020）：颜色固定时，发展时间的影响大于到一爆的时间。', ['roastsci']],
['i', 'roast', 'Alstrup 等（2020）在同一颜色下比较发展时间，较短的发展时间通常让杯中？', ['更果味、更甜、更酸', '更多烘烤、坚果和苦味', '完全没有差别', '更咸'], 0, '短发展：果味、甜、酸更突出；长发展：偏烘烤、坚果和苦。', ['roastsci']],
['i', 'roast', '烘焙结束后，熟豆含水率通常约为？', ['约 1–2.5%', '约 10–12%', '约 20%', '约 0.01%'], 0, '研究：熟豆含水率约 1–2.5%；入锅生豆约 10–12%。', ['roastsci']],
['i', 'roast', '文献中「烘烤味 / 闷烤（baked）」通常指什么？', ['一爆后的时间被拉长，而温度几乎不再上升', '温度太高把豆子烧焦', '烘得太浅', '冷却太快'], 0, '研究对 baked 的描述：一爆后延长时间，温度几乎不升或不升。', ['roastsci']],
['i', 'roast', '烘焙中产生的主要气体是什么？它之后会怎样？', ['二氧化碳；一部分留在豆内，之后在储存和研磨时释放', '氧气；全部立刻排出', '氮气；永不释放', '水蒸气；只在冷却时产生'], 0, '研究：CO₂ 是主要气体，相当一部分被困在豆子里，在储存和研磨时释放；咖啡师中级课纲也要求了解新鲜咖啡的排气期（degassing）。', ['roastsci', 'bic']],
['i', 'roast', '烘焙中细胞壁的「玻璃化转变（glass transition）」是指？', ['细胞壁在坚硬的玻璃态与较软的橡胶态之间转换，橡胶态时豆子膨胀', '豆子表面形成一层玻璃', '豆子变透明', '咖啡因结晶'], 0, '细胞壁多糖在不同温度和水分下可呈玻璃态或橡胶态；处于橡胶态时更容易被气压撑大。', ['roastsci']],
['i', 'roast', '直火加热的滚筒烘焙机中，因为筒壁变热，哪种传热方式会变得显著？', ['传导', '只有对流', '微波', '没有传热'], 0, '研究：直接加热时滚筒壁变热，传导作用变得可观；流化床则以对流为主。', ['roastsci']],
['i', 'roast', '「风豆比（air-to-bean ratio）」指的是？', ['每公斤生豆所用的热风量', '豆子与银皮的重量比', '烘焙前后的重量比', '豆子的体积比'], 0, '同样的热量可以由较少但更热的空气，或更多但较凉的空气提供；滚筒通常比例较低，流化床较高。', ['roastsci']],
['i', 'roast', 'SCA 杯测样品的目标烘焙色值是？', ['Agtron Gourmet 63.0（±1），Commercial 48.0（±1）', 'Agtron 30', 'Agtron 90', 'Agtron 120'], 0, 'SCA Coffee Standards：Agtron Gourmet 63.0 / Commercial 48.0，±1 点。', ['std']],
['i', 'roast', 'SCA 杯测标准要求在什么时候测量样品色值？', ['烘焙后 30 分钟至 4 小时内', '刚出锅立刻', '烘焙一周后', '冷冻后'], 0, 'SCA Coffee Standards：烘焙后 30 分钟至 4 小时内测量色值。', ['std']],
['i', 'roast', '按 2004 版 SCA 杯测规范，样品烘焙后应如何冷却与存放？', ['立即风冷（不用水冷）；不冷藏不冷冻', '用水喷淋冷却', '放冰箱保存', '在滚筒里自然降温'], 0, 'Protocols：样品立即风冷，不用水淬；在凉爽暗处密封存放，不冷藏或冷冻。', ['prot']],
['i', 'roast', 'Roasting Intermediate 课程目录列出的主题中，「升温速率（Rate of Rise, RoR）」描述的是？', ['单位时间内豆温上升的速度', '豆子的颜色', '每小时烘焙的公斤数', '排烟管的长度'], 0, 'RoR 是温度随时间变化的斜率，是中级烘焙课程列出的主题之一。', ['catalog']],
['i', 'roast', '升温过快的极快烘焙，可能导致什么问题？', ['外层烘过头而豆芯不足，同时出现焦味和青涩味', '豆子更均匀', '咖啡因翻倍', '不会有任何问题'], 0, '研究：极快加热会造成豆子内外温差大，外层过焙、内层不足。', ['roastsci']],
['i', 'roast', 'Roasting Intermediate 在 SCA 课程目录中的课时与一般中级模块相比？', ['更长：约 21 小时（一般中级约 14 小时）', '更短：约 2 小时', '完全一样：7 小时', '没有中级'], 0, 'SCA 课程目录（2021）：中级模块一般 14 小时，烘焙中级为 21 小时。', ['catalog']],
// ───────── 中级 · 感官技能 Sensory Skills ─────────
['i', 'sensory', 'SCA 于 2024 年采用 CVA（Coffee Value Assessment）的部分标准作为新杯测标准，取代了什么？', ['2004 年版杯测规范与杯测表', '1957 年的控制图', '冲煮用水标准', '生豆分级光线标准'], 0, 'SCA 新闻：CVA 的 SCA-102、103、104 取代 2004 Cupping Protocol and Form。', ['cva']],
['i', 'sensory', 'CVA 中已被采纳的三项标准是 SCA-102 样品准备与品尝机制、SCA-103 描述性评估，以及？', ['SCA-104 情感性评估（Affective Assessment）', 'SCA-104 物理评估', 'SCA-104 期货评估', 'SCA-104 烘焙评估'], 0, '三项为 102 Sample Preparation and Tasting Mechanics、103 Descriptive Assessment、104 Affective Assessment。', ['cva']],
['i', 'sensory', '三角测试（triangle test）的做法是？', ['3 个样品中 2 个相同、1 个不同，找出不同的那个', '3 个样品都不同，排名', '只给 1 个样品打分', '2 个样品比较哪个更好喝'], 0, 'ISO 4120：每位评价者拿到 3 个编号样品，2 个相同、1 个不同，要找出不同的那个。', ['iso', 'sss']],
['i', 'sensory', '三角测试中如果样品确实没有差别，纯靠猜猜对的概率是？', ['1/3', '1/2', '1/4', '2/3'], 0, '三个中选一个，随机猜对的概率为 1/3，所以要用统计检验判断结果是否显著。', ['sss']],
['i', 'sensory', '判断：ISO 4120 三角测试中，评价者觉得没差别时可以回答「都一样」。', TF, 1, '错误。ISO 4120 是强迫选择：即使觉得没差别，也必须选出一个。', ['iso', 'sss']],
['i', 'sensory', '2004 版 SCA 杯测表中，甜感（sweetness）、一致性（uniformity）、干净度（clean cup）怎么计分？', ['每杯 2 分，5 杯满分 10 分', '每杯 1 分', '按 6–9.75 的品质刻度', '不计分'], 0, 'Protocols：这三项逐杯评判，每杯每项 2 分；每个样品 5 杯，所以每项最高 10 分。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测表中，各品质属性的刻度是？', ['6.00–9.75，以 0.25 分为一级', '1–5 的整数', '0–100 任意', '只有好 / 坏'], 0, 'Protocols：品质刻度 6.00 到 9.75，每级 0.25 分。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测规范中，总分 85–89.99 属于哪个等级？', ['Excellent', 'Outstanding', 'Very Good', '非特殊级'], 0, 'Protocols：90–100 Outstanding，85–89.99 Excellent，80–84.99 Very Good；低于 80 不算特殊级。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测规范中，特殊级的分数门槛是？', ['80 分', '70 分', '85 分', '90 分'], 0, 'Protocols：80 分及以上为特殊级。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测表中，污染味（taint）与缺陷味（fault）每杯的强度分别记为？', ['taint 2 分、fault 4 分', 'taint 4 分、fault 2 分', '都是 1 分', '都是 10 分'], 0, 'Protocols：taint 强度 2，fault 强度 4，再乘以出现的杯数从总分中扣除。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测规范中，风味（flavor）与余韵（aftertaste）大约从什么温度开始评价？', ['约 71 °C（160 °F），注水后约 8–10 分钟', '室温', '90 °C', '0 °C'], 0, 'Protocols：咖啡降到约 71 °C（160 °F）时开始评价液体，大约在注水后 8–10 分钟。', ['prot']],
['i', 'sensory', '2004 版 SCA 杯测规范中，评价在样品降到多少温度时结束？', ['约 21 °C（70 °F）', '约 60 °C', '约 0 °C', '没有规定'], 0, 'Protocols：样品降到 70 °F（21 °C）时停止评价。', ['prot']],
['i', 'sensory', '判断：按 2004 版 SCA 杯测规范，酸度低的咖啡（如某些苏门答腊）也可以在酸度项得到高分。', TF, 0, '正确。规范举例：预期高酸的肯尼亚咖啡和预期低酸的苏门答腊咖啡，可以得到同样高的酸度偏好分，只是强度排名很不同。', ['prot']],
['i', 'sensory', 'Sensory Skills Intermediate 课程（目录描述）会用到下列哪些工具？', ['SCA 风味轮（Flavor Wheel）与 WCR 感官词典（Sensory Lexicon）', 'Agtron 色值仪', '咖啡期货报价', '拉花钢杯'], 0, 'SCA 课程目录：中级感官涉及风味轮、WCR Sensory Lexicon、三角测试和感官生理学等。', ['catalog']],
['i', 'sensory', '判断：每个人对某种味道的察觉阈值（threshold）都一样。', TF, 1, '错误。感官初级课纲：察觉阈值和识别阈值因人而异。', ['sensf']],
['i', 'sensory', '按 2004 版 SCA 杯测规范，酸度、body 与平衡在什么温度区间评价？', ['约 160–140 °F（约 71–60 °C）', '100 °F 以下', '200 °F 以上', '冰镇后'], 0, 'Protocols：酸度、body、平衡在液体降温到 160–140 °F（约 71–60 °C）时评价；甜感、一致性、干净度则在 100 °F 以下评价。', ['prot']]
];
const Q = []; const seen = {};
R.forEach(r => { const [l, m] = r, k = l + '-' + m; seen[k] = (seen[k] || 0) + 1;
  Q.push({id: k + '-' + seen[k], l, m, q: r[2], o: r[3], a: r[4], x: r[5], s: r[6], tf: r[3].length === 2}); });
// ---------- engine (pure; app.js does the UI) ----------
const KEY = 'mcc.sca', PASS = 0.8, MOCK_N = 10, REWARD = {f: 40, i: 60};
let ls = null; try { ls = typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) {}
const load = () => { try { return Object.assign({ans: {}, wrong: [], best: {}, mastered: {}, mocks: [], seen: 0}, JSON.parse(ls && ls.getItem(KEY)) || {}); } catch (e) { return {ans: {}, wrong: [], best: {}, mastered: {}, mocks: [], seen: 0}; } };
let state = load();
const save = () => { try { ls && ls.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
const byId = id => Q.find(q => q.id === id);
const mods = l => MODULES.filter(m => m.lv.includes(l));
const bank = (l, m) => Q.filter(q => q.l === l && (!m || m === 'all' || q.m === m));
const key = (l, m) => l + '-' + m;
function record(id, pick) { const q = byId(id); if (!q) return null; const ok = pick === q.a, a = state.ans[id] || {n: 0, ok: 0};
  a.n++; if (ok) a.ok++; a.last = ok ? 1 : 0; a.pick = pick; state.ans[id] = a;
  state.wrong = state.wrong.filter(x => x !== id); if (!ok) state.wrong.unshift(id);
  save(); return ok; }
function progress(l, m) { const b = bank(l, m), done = b.filter(q => state.ans[q.id]), right = b.filter(q => state.ans[q.id] && state.ans[q.id].last);
  return {n: b.length, done: done.length, right: right.length, best: state.best[key(l, m)] || 0, mastered: !!state.mastered[key(l, m)]}; }
// mock test: random N from a module (or the whole level with m='all'); seed-able for tests
function pick(l, m, n, seed) { const b = bank(l, m).slice(); let s = seed == null ? Math.floor(Math.random() * 1e9) : seed;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b.slice(0, Math.min(n || MOCK_N, b.length)); }
// option order shuffled per showing (true/false keeps 正确/错误 order); returns display order of original indices
function order(q, seed) { if (q.tf) return [0, 1]; const o = q.o.map((_, i) => i); let s = (seed || 7) + q.id.length * 31;
  for (let i = o.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
// grade a mock test; first ≥80% on a single-module test with ≥10 questions masters that module (reward once, ledger id sca-<l>-<m>)
function grade(l, m, ids, picks, d) { let right = 0; const res = ids.map((id, i) => { const ok = record(id, picks[i]); if (ok) right++; return ok; });
  const pct = ids.length ? right / ids.length : 0, k = key(l, m), single = m !== 'all';
  if (pct > (state.best[k] || 0)) state.best[k] = Math.round(pct * 100) / 100;
  const passed = pct >= PASS, newMastery = single && passed && ids.length >= Math.min(MOCK_N, bank(l, m).length) && !state.mastered[k];
  if (newMastery) state.mastered[k] = d || '';
  state.mocks.unshift({d: d || '', l, m, n: ids.length, right}); state.mocks = state.mocks.slice(0, 30); save();
  return {right, n: ids.length, pct, passed, res, newMastery, reward: newMastery ? REWARD[l] : 0, rewardId: 'sca-' + k}; }
function unwrong(id) { state.wrong = state.wrong.filter(x => x !== id); save(); }
function reset() { state = {ans: {}, wrong: [], best: {}, mastered: {}, mocks: [], seen: state.seen}; save(); }
const api = {DISCLAIMER, LEVELS, MODULES, SRC, Q, KEY, PASS, MOCK_N, REWARD, byId, mods, bank, progress, pick, order, record, grade, unwrong, reset, save,
  get state() { return state; }, reload() { state = load(); return state; },
  counts() { const c = {}; Q.forEach(q => { const k = key(q.l, q.m); c[k] = (c[k] || 0) + 1; }); return c; }};
if (typeof window !== 'undefined') window.SCAQ = api; if (typeof module !== 'undefined') module.exports = api;
})();
