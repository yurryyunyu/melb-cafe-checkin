// Seed list: real Melbourne cafes. Order = map numbers (1-9 follow the CBD walk in the reference map). Coordinates verified via OpenStreetMap Nominatim (Oct 2026).
window.SEED_CAFES = [
  {id:"codeblackspencer", short:"Code Black Spencer", name:"Code Black Coffee (Spencer St)", suburb:"Melbourne CBD", address:"630 Little Collins St, Melbourne VIC 3000", lat:-37.81787, lng:144.95386, tags:["Southern Cross 对面","烘焙商"]},
  {id:"patricia", short:"Patricia", name:"Patricia Coffee Brewers", suburb:"Melbourne CBD", address:"Cnr Little Bourke St & Little William St, Melbourne VIC 3000", lat:-37.81395, lng:144.95865, tags:["站着喝","手冲"]},
  {id:"hardwaresoc", short:"Hardware Societe", name:"Hardware Société", suburb:"Melbourne CBD", address:"120 Hardware St, Melbourne VIC 3000", lat:-37.81196, lng:144.96053, tags:["法式早午餐","排队名店"]},
  {id:"maker", short:"Maker", name:"Maker Coffee (Little Bourke)", suburb:"Melbourne CBD", address:"387 Little Bourke St, Melbourne VIC 3000", lat:-37.81373, lng:144.96136, tags:["单品","极简风"]},
  {id:"bbb", short:"Brother Baba Budan", name:"Brother Baba Budan", suburb:"Melbourne CBD", address:"359 Little Bourke St, Melbourne VIC 3000", lat:-37.81350, lng:144.96208, tags:["椅子天花板","小店"]},
  {id:"bench", short:"Bench", name:"Bench Coffee Co (Lt Collins)", suburb:"Melbourne CBD", address:"321 Little Collins St, Melbourne VIC 3000", lat:-37.81528, lng:144.96423, tags:["Dacquoise","手冲"]},
  {id:"dukes", short:"Dukes", name:"Dukes Coffee Roasters", suburb:"Melbourne CBD", address:"247 Flinders Ln, Melbourne VIC 3000", lat:-37.81699, lng:144.96617, tags:["烘焙商","外带"]},
  {id:"codeblackflinders", short:"Code Black Flinders Lane", mapLabel:"Code Black\nFlinders Lane", name:"Code Black Coffee (Flinders Lane)", suburb:"Melbourne CBD", address:"189 Flinders Ln, Melbourne VIC 3000", lat:-37.81628, lng:144.96818, tags:["Morning Bar","早午餐"]},
  {id:"littlerogue", short:"Little Rogue", name:"Little Rogue", suburb:"Melbourne CBD", address:"12 Drewery Ln, Melbourne VIC 3000", lat:-37.81099, lng:144.96405, tags:["蓝色小门","隐藏小店"]},
  {id:"marketlane", name:"Market Lane Coffee (Prahran Market)", suburb:"South Yarra", address:"Prahran Market, 163 Commercial Rd, South Yarra VIC 3141", lat:-37.84601, lng:144.99258, tags:["烘焙商","市场"]},
  {id:"sevenseeds", name:"Seven Seeds", suburb:"Carlton", address:"114 Berkeley St, Carlton VIC 3053", lat:-37.80283, lng:144.95903, tags:["烘焙商","早午餐"]},
  {id:"proudmary", name:"Proud Mary", suburb:"Collingwood", address:"172 Oxford St, Collingwood VIC 3066", lat:-37.80233, lng:144.98524, tags:["早午餐","精品豆"]},
  {id:"higherground", name:"Higher Ground", suburb:"Melbourne CBD", address:"650 Little Bourke St, Melbourne VIC 3000", lat:-37.81589, lng:144.95315, tags:["挑高空间","早午餐"]},
  {id:"industrybeans", name:"Industry Beans", suburb:"Fitzroy", address:"3/62 Rose St, Fitzroy VIC 3065", lat:-37.79616, lng:144.97751, tags:["烘焙商","早午餐"]},
  {id:"lune", name:"Lune Croissanterie", suburb:"Fitzroy", address:"119 Rose St, Fitzroy VIC 3065", lat:-37.79593, lng:144.97996, tags:["可颂","排队名店"]},
  {id:"stali", name:"St. ALi", suburb:"South Melbourne", address:"12-18 Yarra Pl, South Melbourne VIC 3205", lat:-37.83133, lng:144.96046, tags:["烘焙商","早午餐"]},
  {id:"hash", name:"Hash Specialty Coffee", suburb:"Melbourne CBD", address:"113 Hardware St, Melbourne VIC 3000", lat:-37.81253, lng:144.96060, tags:["棉花糖热巧","早午餐"]},
  {id:"krimper", name:"Krimper", suburb:"Melbourne CBD", address:"20 Guildford Ln, Melbourne VIC 3000", lat:-37.81115, lng:144.96013, tags:["小巷","早午餐"]},
  {id:"axil", name:"Axil Coffee Roasters", suburb:"Hawthorn", address:"322 Burwood Rd, Hawthorn VIC 3122", lat:-37.82277, lng:145.03425, tags:["烘焙商","早午餐"]},
  {id:"codeblack", short:"Code Black", name:"Code Black Coffee", suburb:"Brunswick", address:"15-17 Weston St, Brunswick VIC 3056", lat:-37.77471, lng:144.96244, tags:["烘焙商","工业风"]},
  {id:"toppaddock", name:"Top Paddock", suburb:"Richmond", address:"658 Church St, Richmond VIC 3121", lat:-37.83300, lng:144.99602, tags:["早午餐","松饼"]},
  {id:"pillarofsalt", name:"Pillar of Salt", suburb:"Richmond", address:"541 Church St, Richmond VIC 3121", lat:-37.82967, lng:144.99742, tags:["早午餐"]},
  {id:"auntypegs", name:"Aunty Peg's", suburb:"Collingwood", address:"200 Wellington St, Collingwood VIC 3066", lat:-37.80275, lng:144.98689, tags:["Proud Mary 旗下","手冲"]},
  {id:"everyday", name:"Everyday Coffee", suburb:"Collingwood", address:"33 Johnston St, Collingwood VIC 3066", lat:-37.79880, lng:144.98690, tags:["烘焙商","小店"]},
  {id:"monkbodhi", name:"Monk Bodhi Dharma", suburb:"Balaclava", address:"Rear 202 Carlisle St, Balaclava VIC 3183", lat:-37.86826, lng:144.99081, tags:["素食","隐藏小店"]},
  {id:"twobirds", name:"Two Birds One Stone", suburb:"South Yarra", address:"12 Claremont St, South Yarra VIC 3141", lat:-37.83807, lng:144.99392, tags:["早午餐"]},
  {id:"au79", name:"AU79 (Richmond Traders)", short:"AU79", suburb:"Richmond", address:"240 Church St (cnr Bridge Rd), Richmond VIC 3121", lat:-37.81807, lng:144.99906, tags:["烘焙商","早午餐"]},
  {id:"makerrichmond", name:"Maker Coffee (Richmond)", short:"Maker", suburb:"Richmond", address:"47 North St, Richmond VIC 3121", lat:-37.81622, lng:145.01135, tags:["烘焙商"]},
  {id:"zest", name:"Zest Coffee Studio", short:"Zest Coffee", suburb:"Richmond", address:"67 North St, Richmond VIC 3121", lat:-37.81639, lng:145.01226, tags:["烘焙商","品鉴"]},
  {id:"veneziano", name:"Veneziano Coffee Roasters", short:"Veneziano", suburb:"Richmond", address:"16 River St, Richmond VIC 3121", lat:-37.81673, lng:145.01325, tags:["烘焙商","早午餐"]},
  {id:"heart", name:"Heart Coffee", short:"Heart Coffee", suburb:"Richmond", address:"378 Burnley St, Richmond VIC 3121", lat:-37.82559, lng:145.00698, tags:["肉桂卷"]},
  {id:"dutton", name:"Dutton Cafeteria by Tickled Pink", short:"Dutton Cafeteria", suburb:"Richmond", address:"41 Madden Grove, Richmond VIC 3121", lat:-37.82801, lng:145.00593, tags:["车行里的咖啡馆"]},
  {id:"vacation", name:"Vacation Coffee (Richmond)", short:"Vacation", suburb:"Cremorne", address:"8 Adolph St, Cremorne VIC 3121", lat:-37.82685, lng:144.99669, tags:["自制酥点","Batch Brew"]},
  {id:"midi", name:"Midi Coffee", short:"Midi Coffee", suburb:"Richmond", address:"45 Wangaratta St, Richmond VIC 3121", lat:-37.82440, lng:144.99267, tags:["小店"]},
  {id:"c279", name:"279", short:"279", suburb:"West Melbourne", address:"279 Victoria St, West Melbourne VIC 3003", lat:-37.80563, lng:144.95198, tags:["日式饭团","茶"]},
  {id:"path", name:"Path", short:"Path", suburb:"North Melbourne", address:"362 Victoria St, North Melbourne VIC 3051", lat:-37.80547, lng:144.95420, tags:["日式早午餐"]},
  {id:"lebajo", name:"Le Bajo Milkbar", short:"Le Bajo", suburb:"North Melbourne", address:"8-14 Howard St, North Melbourne VIC 3051", lat:-37.80508, lng:144.95424, tags:["自烤面包","社区小店"]},
  {id:"otherside", name:"Otherside Coffee", short:"Otherside Coffee", suburb:"North Melbourne", address:"1 Gardiner St, North Melbourne VIC 3051", lat:-37.80463, lng:144.95334, tags:["小店"]},
  {id:"codeblacknorth", name:"Code Black Coffee (North Melbourne)", short:"Code Black", suburb:"North Melbourne", address:"119 Howard St, North Melbourne VIC 3051", lat:-37.80423, lng:144.95366, tags:["烘焙商"]},
  {id:"smallbatch", name:"Small Batch Roasting Co.", short:"Small Batch", suburb:"North Melbourne", address:"3-9 Little Howard St, North Melbourne VIC 3051", lat:-37.80435, lng:144.95444, tags:["烘焙商"]},
  {id:"auctionrooms", name:"Auction Rooms", short:"Auction Rooms", suburb:"North Melbourne", address:"103-107 Errol St, North Melbourne VIC 3051", lat:-37.80245, lng:144.94946, tags:["早午餐","老拍卖行"]},
  {id:"mork", name:"Mörk Chocolate Brew House", short:"Mörk Chocolate", suburb:"North Melbourne", address:"150 Errol St, North Melbourne VIC 3051", lat:-37.80153, lng:144.95018, tags:["热巧克力"]},
  {id:"palette", name:"Palette", short:"Palette", suburb:"North Melbourne", address:"610 Queensberry St, North Melbourne VIC 3051", lat:-37.80255, lng:144.94710, tags:["早午餐"]},
  {id:"core", name:"Core Roasters", short:"Core Roasters", suburb:"Brunswick East", address:"14 Barkly St, Brunswick East VIC 3057", lat:-37.77808, lng:144.97718, tags:["烘焙商","可可"]},
  {id:"wideopenroad", name:"Wide Open Road", short:"Wide Open Road", suburb:"Brunswick", address:"274 Barkly St, Brunswick VIC 3056", lat:-37.77628, lng:144.96122, tags:["烘焙商","早午餐"]},
  {id:"disciple", name:"Disciple Roasters", short:"Disciple Roasters", suburb:"Brunswick", address:"16 Black St, Brunswick VIC 3056", lat:-37.77551, lng:144.96008, tags:["只做黑咖啡"]},
  {id:"kohinodeshi", name:"Kōhī no deshi", short:"Kōhī no deshi", suburb:"Brunswick", address:"18 Black St, Brunswick VIC 3056", lat:-37.77546, lng:144.96009, tags:["奶咖专门店"]},
  {id:"marketlanebrunswick", name:"Market Lane Coffee (Sydney Rd)", short:"Market Lane", suburb:"Brunswick", address:"383 Sydney Rd, Brunswick VIC 3056", lat:-37.76835, lng:144.96176, tags:["烘焙商"]},
  {id:"lunar", name:"Lunar by Hikari", short:"Lunar by Hikari", suburb:"Brunswick", address:"458 Sydney Rd, Brunswick VIC 3056", lat:-37.76727, lng:144.96230, tags:["日式手冲"]},
  {id:"ona", name:"ONA Coffee Brunswick", short:"ONA", suburb:"Brunswick", address:"22 Ovens St, Brunswick VIC 3056", lat:-37.76497, lng:144.96159, tags:["烘焙商","早午餐"]},
  {id:"benchroastery", name:"Bench Coffee Co. Roastery", short:"Bench Coffee", suburb:"Brunswick", address:"38 Breese St, Brunswick VIC 3056", lat:-37.76189, lng:144.96182, tags:["烘焙商","生吐司"]}
];

// ---- SAMPLE menus (NOT verified against the cafes' current real menus; for prototype recognition/quick-pick only) ----
window.MENU_VERIFIED = false;
window.SAMPLE_MENU_DEFAULT = [
  {name:"Flat White", type:"drink"}, {name:"Long Black", type:"drink"}, {name:"Latte", type:"drink"},
  {name:"Cappuccino", type:"drink"}, {name:"Magic", type:"drink"}, {name:"Batch Brew", type:"drink"},
  {name:"Pour Over / Filter", type:"drink"}, {name:"Iced Latte", type:"drink"}, {name:"Chai Latte", type:"drink"},
  {name:"Hot Chocolate", type:"drink"}, {name:"Banana Bread", type:"food"}, {name:"Smashed Avo on Toast", type:"food"}
];
window.SAMPLE_MENU_EXTRA = {
  lune: [{name:"Traditional Croissant", type:"food"}, {name:"Almond Croissant", type:"food"}, {name:"Pain au Chocolat", type:"food"}, {name:"Kouign Amann", type:"food"}, {name:"Cruffin", type:"food"}],
  hash: [{name:"Hash Hot Chocolate (cotton candy)", type:"drink"}, {name:"Ricotta Hotcakes", type:"food"}],
  hardwaresoc: [{name:"Baked Eggs", type:"food"}, {name:"French Toast", type:"food"}],
  toppaddock: [{name:"Blueberry & Ricotta Hotcake", type:"food"}],
  patricia: [{name:"Espresso", type:"drink"}, {name:"Filter (Black & White)", type:"drink"}],
  stali: [{name:"Espresso", type:"drink"}, {name:"Eggs Benedict", type:"food"}],
  proudmary: [{name:"Single Origin Filter", type:"drink"}, {name:"Hotcakes", type:"food"}],
  sevenseeds: [{name:"Single Origin Filter", type:"drink"}],
  marketlane: [{name:"Espresso", type:"drink"}, {name:"Seasonal Filter", type:"drink"}],
  bench: [{name:"Dacquoise", type:"food"}],
  monkbodhi: [{name:"Vegan Breakfast Bowl", type:"food"}]
};
window.menuFor = cafeId => {
  const extra = (window.SAMPLE_MENU_EXTRA[cafeId] || []);
  const seen = new Set(extra.map(i => i.name));
  return [...extra, ...window.SAMPLE_MENU_DEFAULT.filter(i => !seen.has(i.name))];
};

// ---- Sketch regions (schematic maps drawn from the user's reference maps; viewBox units = reference image px) ----
// marker: [x, y, labelSide]  ('l' | 'r')
window.REGIONS = [
  {id:"city", name:"MEL CITY", zh:"市中心", vb:[20,130,990,770],
   pill:{x:410, y:712, w:320, h:62},
   streets:[
     {pts:[[110,165],[110,860]], w:34, label:"SPENCER STREET", at:[110,470], v:true},
     {pts:[[250,165],[250,860]], w:34, label:"KING STREET", at:[250,520], v:true},
     {pts:[[662,160],[662,820]], w:34, label:"ELIZABETH STREET", at:[662,560], v:true},
     {pts:[[933,165],[933,820]], w:22},
     {pts:[[45,825],[975,825]], w:36, label:"FLINDERS STREET", at:[525,825]},
     {pts:[[110,480],[662,480]], w:34, label:"LITTLE BOURKE ST", at:[400,480]},
     {pts:[[110,410],[968,410]], w:18}, {pts:[[110,615],[662,615]], w:18}, {pts:[[662,755],[975,755]], w:18},
     {pts:[[597,335],[597,410]], w:16}, {pts:[[797,315],[797,410]], w:16}, {pts:[[620,480],[620,565]], w:16}, {pts:[[597,195],[662,195]], w:16}
   ],
   cafes:{codeblackspencer:[142,595,"r"], patricia:[365,515,"r"], hardwaresoc:[573,360,"l"], maker:[578,520,"r"], bbb:[628,452,"r"], bench:[693,632,"r"], dukes:[752,792,"r"], codeblackflinders:[880,722,"l"], littlerogue:[776,368,"r"]}},
  {id:"richmond", name:"RICHMOND", zh:"列治文", vb:[60,130,960,760],
   pill:{x:390, y:240, w:420, h:68},
   streets:[
     {pts:[[362,345],[362,840]], w:34, label:"CHURCH ST", at:[362,575], v:true},
     {pts:[[662,165],[662,840]], w:34, label:"BURNLEY ST", at:[662,550], v:true},
     {pts:[[165,430],[815,430]], w:34, label:"BRIDGE ROAD", at:[512,430]},
     {pts:[[165,727],[815,727]], w:34, label:"SWAN STREET", at:[512,727]},
     {pts:[[662,287],[808,287],[808,340]], w:18}
   ],
   cafes:{au79:[330,398,"l"], makerrichmond:[742,263,"l"], zest:[778,263,"r"], veneziano:[785,326,"l"], heart:[628,677,"r"], dutton:[612,776,"r"], vacation:[318,780,"l"], midi:[187,685,"r"]}},
  {id:"northmel", name:"NORTH MEL", zh:"北墨尔本", vb:[40,150,960,760],
   pill:{x:300, y:800, w:420, h:68},
   streets:[
     {pts:[[222,185],[222,710]], w:32, label:"PRINCES HIGHWAY", at:[222,440], v:true},
     {pts:[[75,467],[905,467]], w:34, label:"QUEENSBERRY STREET", at:[545,467]},
     {pts:[[616,220],[616,840]], w:32, label:"CHETWYND STREET", at:[616,345], v:true},
     {pts:[[375,698],[905,698]], w:32, label:"VICTORIA STREET", at:[640,698]},
     {pts:[[355,230],[355,467]], w:18}, {pts:[[745,467],[745,698]], w:18}, {pts:[[745,565],[880,565]], w:18}, {pts:[[616,600],[745,600]], w:18}
   ],
   cafes:{c279:[580,737,"l"], path:[795,668,"r"], lebajo:[770,632,"r"], otherside:[703,620,"l"], codeblacknorth:[727,550,"l"], smallbatch:[800,543,"r"], auctionrooms:[334,410,"r"], mork:[377,297,"r"], palette:[128,437,"r"]}},
  {id:"brunswick", name:"BRUNSWICK", zh:"布伦瑞克", vb:[-110,150,1220,760],
   pill:{x:745, y:598, w:460, h:68},
   streets:[
     {pts:[[335,165],[335,870]], w:36, label:"SYDNEY ROAD", at:[335,500], v:true},
     {pts:[[245,830],[960,830]], w:36, label:"BARKLY STREET", at:[600,830]},
     {pts:[[335,235],[275,235],[275,268]], w:18}, {pts:[[335,397],[270,397],[270,470],[335,470]], w:18},
     {pts:[[335,723],[468,723]], w:18}, {pts:[[335,783],[428,783]], w:18}, {pts:[[282,760],[282,812]], w:16}
   ],
   cafes:{core:[790,797,"r"], wideopenroad:[435,782,"r"], disciple:[260,793,"l"], kohinodeshi:[262,753,"l"], codeblack:[475,727,"r"], marketlanebrunswick:[300,546,"l"], lunar:[370,498,"r"], ona:[296,437,"l"], benchroastery:[281,282,"l"]}}
];
window.REGION_MORE = {id:"more", name:"更多", zh:"更多咖啡馆"};
