// 🫘 Bean label capture: on-device OCR (self-hosted Tesseract.js, lazy-loaded) + heuristic field parsing.
// Optional: if config VISION_API is set, ask it for structured JSON first and fall back to OCR.
(() => {
'use strict';
const BASE = new URL('vendor/tesseract/', document.baseURI).href;
const FIELDS = [['name', '豆名'], ['roaster', '烘焙商'], ['origin', '产地国家'], ['region', '产区'], ['farm', '庄园/生产者'], ['variety', '品种'], ['process', '处理法'],
  ['roast', '烘焙度'], ['roastDate', '烘焙日期'], ['altitude', '海拔'], ['notes', '风味'], ['weight', '重量']];

// ---------- lazy loader ----------
let libP = null;
function loadLib(timeout = 20000) {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (libP) return libP;
  libP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = BASE + 'tesseract.min.js'; s.async = true;
    const t = setTimeout(() => { rej(new Error('OCR 组件加载超时')); }, timeout);
    s.onload = () => { clearTimeout(t); window.Tesseract ? res(window.Tesseract) : rej(new Error('OCR 组件不可用')); };
    s.onerror = () => { clearTimeout(t); rej(new Error('OCR 组件加载失败（网络）')); }; document.head.appendChild(s); })
    .catch(e => { libP = null; throw e; });
  return libP;
}
const workers = {};
let progressCb = null;
async function getWorker(langs) {
  if (workers[langs]) return workers[langs];
  const T = await loadLib();
  const w = T.createWorker(langs, 1 /* LSTM only */, {workerPath: BASE + 'worker.min.js', corePath: BASE + 'core', langPath: BASE + 'lang', workerBlobURL: false, gzip: true,
    logger: m => { if (progressCb && m && typeof m.progress === 'number') progressCb(m.status, m.progress); },
    errorHandler: e => console.warn('tesseract worker', e)});
  workers[langs] = Promise.race([w, new Promise((_, rej) => setTimeout(() => rej(new Error('OCR 引擎启动超时')), 90000))]).catch(e => { delete workers[langs]; throw e; });
  return workers[langs];
}

// ---------- preprocessing: resize, grayscale, contrast stretch ----------
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('图片读取失败')); i.src = src; }); }
async function preprocess(src, {maxSide = 1800, minSide = 1100} = {}) {
  const img = await loadImg(src), long = Math.max(img.width, img.height);
  const k = long > maxSide ? maxSide / long : long < minSide ? minSide / long : 1;
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext('2d', {willReadFrequently: true}); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data, hist = new Uint32Array(256), n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { const y = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0; d[i] = y; hist[y]++; }
  let lo = 0, hi = 255, acc = 0; for (; lo < 255; lo++) { acc += hist[lo]; if (acc > n * 0.02) break; } acc = 0; for (; hi > 0; hi--) { acc += hist[hi]; if (acc > n * 0.02) break; }
  let mean = 0; for (let v = 0; v < 256; v++) mean += v * hist[v]; mean /= n;
  const inv = mean < 110; // light text on dark bag → invert so text is dark
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) { let y = (d[i] - lo) * 255 / span; y = y < 0 ? 0 : y > 255 ? 255 : y; y = 255 / (1 + Math.exp(-(y - 128) / 28)); if (inv) y = 255 - y; d[i] = d[i + 1] = d[i + 2] = y; }
  g.putImageData(im, 0, 0);
  return c;
}

async function ocr(photo, {chi = false, onProgress} = {}) {
  progressCb = onProgress || null;
  const langs = chi ? 'eng+chi_sim' : 'eng';
  try {
    onProgress && onProgress('准备图片', 0);
    const canvas = await preprocess(photo);
    onProgress && onProgress('loading tesseract core', 0);
    const w = await getWorker(langs);
    const r = await w.recognize(canvas);
    let text = (r.data.text || '').replace(/[ \t]+\n/g, '\n').trim();
    if (chi) text = text.replace(/([\u4e00-\u9fff])[ \t]+(?=[\u4e00-\u9fff])/g, '$1'); // tesseract puts spaces between hanzi
    return {text, confidence: Math.round(r.data.confidence || 0), source: 'ocr', langs};
  } finally { progressCb = null; }
}

// ---------- optional vision API (structured JSON) ----------
async function vision(photo) {
  const V = (window.APP_CONFIG || {}).VISION_API || {}; if (!V.ENDPOINT || !photo) return null;
  const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), V.TIMEOUT_MS || 20000);
  try {
    const headers = {'Content-Type': 'application/json'}; if (V.API_KEY) headers.Authorization = 'Bearer ' + V.API_KEY;
    const r = await fetch(V.ENDPOINT, {method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({model: V.MODEL || 'gpt-4o-mini', temperature: 0, response_format: {type: 'json_object'},
      messages: [{role: 'system', content: 'You read coffee bean bag labels. Reply ONLY with JSON with keys: raw (all text you can read), name, roaster, origin, region, farm, variety, process, roast, roastDate, altitude, notes, weight. Use "" when unknown.'},
        {role: 'user', content: [{type: 'text', text: 'Extract the coffee label fields.'}, {type: 'image_url', image_url: {url: photo}}]}]})});
    if (!r.ok) throw new Error('vision HTTP ' + r.status);
    const j = await r.json(), txt = j.choices?.[0]?.message?.content || '', o = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    const fields = {}; FIELDS.forEach(([k]) => { fields[k] = String(o[k] || '').trim(); });
    return {text: String(o.raw || '').trim(), fields, source: 'vision'};
  } catch (e) { console.warn('bean vision failed', e); return null; } finally { clearTimeout(to); }
}

// ---------- heuristic parser ----------
const COUNTRIES = [['Ethiopia', /ethiopia|ethiopian|埃塞俄比亚|埃塞/i], ['Kenya', /kenya|肯尼亚/i], ['Colombia', /colombia|哥伦比亚/i], ['Brazil', /brazil|brasil|巴西/i], ['Guatemala', /guatemala|危地马拉/i],
  ['Costa Rica', /costa\s*rica|哥斯达黎加/i], ['Panama', /panama|巴拿马/i], ['Honduras', /honduras|洪都拉斯/i], ['El Salvador', /el\s*salvador|萨尔瓦多/i], ['Nicaragua', /nicaragua|尼加拉瓜/i], ['Mexico', /mexico|墨西哥/i],
  ['Peru', /\bperu\b|秘鲁/i], ['Bolivia', /bolivia|玻利维亚/i], ['Ecuador', /ecuador|厄瓜多尔/i], ['Rwanda', /rwanda|卢旺达/i], ['Burundi', /burundi|布隆迪/i], ['Uganda', /uganda|乌干达/i], ['Tanzania', /tanzania|坦桑尼亚/i],
  ['DR Congo', /congo|刚果/i], ['Malawi', /malawi/i], ['Zambia', /zambia/i], ['Yemen', /yemen|也门/i], ['Indonesia', /indonesia|sumatra|java\b|sulawesi|印度尼西亚|印尼|苏门答腊/i], ['Papua New Guinea', /papua|png\b|巴布亚/i],
  ['India', /\bindia\b|印度/i], ['Vietnam', /vietnam|越南/i], ['Myanmar', /myanmar|缅甸/i], ['Thailand', /thailand|泰国/i], ['Laos', /\blaos\b|老挝/i], ['Timor-Leste', /timor/i], ['China', /yunnan|china|云南|中国/i],
  ['USA (Hawaii)', /hawaii|kona|夏威夷/i], ['Jamaica', /jamaica|牙买加/i], ['Australia', /australia|澳大利亚|澳洲/i]];
const REGIONS = /\b(yirga\s*cheffe|yirgacheffe|guji|sidama|sidamo|harrar|harar|limu|jimma|gedeo|bensa|hambela|uraga|nyeri|kirinyaga|kiambu|murang'?a|embu|huila|nari[ñn]o|cauca|tolima|antioquia|quind[ií]o|santander|antigua|huehuetenango|atitl[aá]n|acatenango|tarraz[uú]|west valley|boquete|chiriqu[ií]|volc[aá]n|cerrado|minas gerais|sul de minas|mogiana|chapada|aceh|gayo|lintong|toraja|kayanza|ngozi|nyamasheke|huye|cajamarca|caranavi|marcala|santa barbara|copan|la paz|chalatenango|apaneca|jinotega|matagalpa|oaxaca|chiapas|veracruz|kona|blue mountains?|pu'?er|baoshan|lincang)\b/i;
const REGION_ZH = /(耶加雪菲|古吉|西达摩|哈拉尔|利姆|涅里|基里尼亚加|薇拉|惠兰|考卡|纳里尼奥|安提瓜|薇薇特南果|塔拉珠|博克特|喜拉多|米纳斯|亚齐|曼特宁|普洱|保山|临沧)/;
const PROCESS = [['Anaerobic Natural', /anaerobic\s*natural|厌氧日晒/i], ['Anaerobic Washed', /anaerobic\s*washed|厌氧水洗/i], ['Carbonic Maceration', /carbonic|二氧化碳浸渍|CM/],
  ['Anaerobic', /anaerobic|厌氧/i], ['Honey', /honey|蜜处理|蜜/i], ['Wet-hulled', /wet[\s-]*hulled|湿刨/i], ['Semi-washed', /semi[\s-]*washed|半水洗/i], ['Natural', /natural|sun[\s-]*dried|dry\s*process|日晒/i],
  ['Washed', /washed|wet\s*process|fully\s*washed|水洗/i], ['Thermal Shock', /thermal\s*shock/i], ['Experimental', /experimental|实验/i]];
const ROAST = [['Light-Medium', /light[\s-]*medium|medium[\s-]*light|浅中烘/i], ['Medium-Dark', /medium[\s-]*dark|中深烘/i], ['Light', /\blight\s*roast|\blight\b|浅烘|浅焙/i], ['Medium', /medium\s*roast|\bmedium\b|中烘|中焙/i],
  ['Dark', /dark\s*roast|\bdark\b|深烘|深焙/i], ['Filter roast', /filter\s*roast|for\s*filter|手冲烘焙/i], ['Espresso roast', /espresso\s*roast|for\s*espresso|意式烘焙/i], ['Omni roast', /omni/i]];
const VARIETIES = /\b(gesha|geisha|bourbon|pink bourbon|red bourbon|yellow bourbon|typica|caturra|catua[ií]|sl[\s-]?28|sl[\s-]?34|pacamara|heirloom|landrace|ethiopian heirloom|7411[02]|74158|kurume|wolisho|dega|castillo|colombia|catimor|sarchimor|mundo novo|maragogi?pe|ruiru\s*11|batian|wush\s*wush|sidra|villa\s*sarchi|java|parainema|marsellesa|tabi|chiroso|laurina|obata|icatu|yellow catuai|red catuai|s795|ateng|tim\s*tim|abyssinia)\b/gi;
const VAR_ZH = /(瑰夏|波旁|铁皮卡|卡杜拉|卡杜艾|帕卡马拉|原生种|埃塞原生种|卡斯蒂略|卡蒂姆|西达|粉波旁|黄波旁|红波旁)/g;
const ROASTERS = ['Market Lane', 'Seven Seeds', 'Proud Mary', 'Code Black', 'Patricia', 'ST. ALi', 'St Ali', 'Padre', 'Small Batch', 'Axil', 'Industry Beans', 'Wide Open Road', 'Ona', 'Dukes', 'Monk Bodhi Dharma',
  'Everyday', 'Five Senses', 'Allpress', 'Single O', 'Sample', 'Rumble', 'Coffee Supreme', 'Square One', 'Assembly', 'Pilgrim', 'Brother Baba Budan', 'Maker', 'Aunty Peg', 'Toby\'s Estate', 'Campos', 'Ona Coffee'];
const LABELS = [['roaster', /^(roast(ed)?\s*by|roaster(y)?|烘焙商|烘焙者|烘焙方)(?![a-z])/i], ['origin', /^(origin|country|产地|产国|国家)(?![a-z])/i], ['region', /^(region|area|产区|地区)(?![a-z])/i],
  ['farm', /^(farm|finca|estate|producer|produced by|grower|washing station|station|cooperative|co-?op|hacienda|mill|庄园|农场|生产者|处理站|合作社)(?![a-z])/i], ['variety', /^(variet(y|ies|al|als)|cultivar|品种)(?![a-z])/i],
  ['process', /^(process(ing)?|method|处理法|处理方式|处理)(?![a-z])/i], ['roast', /^(roast\s*(level|profile|degree)?|烘焙度|烘焙程度)(?!\s*(date|on|ed\s*on))(?![a-z])/i], ['roastDate', /^(roast(ed)?\s*(date|on)|roasted|烘焙日期|生产日期|date)(?![a-z])/i],
  ['altitude', /^(altitude|elevation|alt\.?|海拔)(?![a-z])/i], ['notes', /^(tasting\s*notes?|cup(ping)?\s*notes?|notes?|flavou?rs?(\s*notes?)?|tastes?\s*like|we\s*taste|风味|风味描述|口感|杯测)(?![a-z])/i],
  ['weight', /^(net\s*(wt|weight)|weight|净含量|净重|重量)(?![a-z])/i], ['name', /^(name|coffee|bean|blend|品名|豆名|名称)(?![a-z])/i]];
const DATE = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{2,4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{1,2},?\s*\d{2,4})\b|\d{4}年\d{1,2}月\d{1,2}日/i;
const WEIGHT = /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grams?|oz|克|公斤|千克)(?![a-z])/i;
const ALT = /(\d[\d,.]{2,5}(?:\s*[-–~to]+\s*\d[\d,.]{2,5})?)\s*(m\.?a\.?s\.?[l1i|!]?\.?|metres?|meters?|m\b|米)/i;
const title = s => (s === s.toUpperCase() ? s.toLowerCase() : s).replace(/\s+/g, ' ').trim().replace(/(^|[\s/-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const clean = s => String(s || '').replace(/^[\s:：\-–|·•*]+|[\s:：\-–|·•*,.;]+$/g, '').replace(/\s{2,}/g, ' ').trim();

function parse(text) {
  const raw = String(text || ''), lines = raw.split(/\r?\n/).map(l => l.replace(/[|_~`"“”]+/g, ' ').replace(/\s{2,}/g, ' ').trim()).filter(l => l.length > 1);
  const f = {}; FIELDS.forEach(([k]) => { f[k] = ''; }); const used = new Set();
  // 1) "Label: value" lines (value may continue on the next line)
  lines.forEach((l, i) => { for (const [k, re] of LABELS) { const m = l.match(re); if (!m) continue;
    let v = clean(l.slice(m[0].length)); if (k === 'farm' && /^(finca|hacienda|estate)$/i.test(m[0]) && !/^[:：]/.test(l.slice(m[0].length).trim())) v = clean(l); if (!v && lines[i + 1] && !LABELS.some(([, r]) => r.test(lines[i + 1]))) { v = clean(lines[i + 1]); used.add(i + 1); }
    if (v && !f[k]) { f[k] = v; used.add(i); } break; } });
  const all = lines.join('\n');
  // 2) keyword scanning for anything still empty
  if (!f.weight) { const m = all.match(WEIGHT); if (m) f.weight = m[1].replace(',', '.') + ' ' + m[2].replace(/grams?|gr/i, 'g'); }
  else { const m = f.weight.match(WEIGHT); if (m) f.weight = m[1].replace(',', '.') + ' ' + m[2].replace(/grams?|gr/i, 'g'); }
  if (f.altitude) { const m = f.altitude.match(ALT); if (m) f.altitude = m[1].replace(/\s*(to|~|–)\s*/g, '-').replace(/\s+/g, '') + ' m'; }
  if (!f.altitude) { const m = all.match(ALT); if (m && /\d{3}/.test(m[1].replace(/[,.]/g, ''))) f.altitude = m[1].replace(/\s*(to|~|–)\s*/g, '-').replace(/\s+/g, '') + ' m'; }
  if (!f.roastDate) { const ln = lines.find(l => /roast|烘焙|date|日期/i.test(l) && DATE.test(l)) || lines.find(l => DATE.test(l)); if (ln) f.roastDate = ln.match(DATE)[0]; }
  else { const m = f.roastDate.match(DATE); if (m) f.roastDate = m[0]; }
  const procHit = (s) => { const p = PROCESS.find(([, re]) => re.test(s)); return p && p[0]; };
  f.process = f.process ? (procHit(f.process) || f.process) : (procHit(all) || '');
  const roastHit = s => { const r = ROAST.find(([, re]) => re.test(s)); return r && r[0]; };
  if (f.roast) f.roast = roastHit(f.roast) || f.roast; else f.roast = roastHit(all.replace(/roast(ed)?\s*(by|on|date)[^\n]*/gi, '')) || '';
  if (!f.variety) { const v = [...new Set([...(all.match(VARIETIES) || []).map(title), ...(all.match(VAR_ZH) || [])])].filter(x => x.toLowerCase() !== 'colombia' || /castillo|variety/i.test(all)); f.variety = v.join(', '); }
  const cHit = s => { const c = COUNTRIES.find(([, re]) => re.test(s)); return c && c[0]; };
  if (f.origin) { const c = cHit(f.origin); if (c && !f.region) { const rest = clean(f.origin.replace(COUNTRIES.find(x => x[0] === c)[1], '')); if (rest) f.region = title(rest); } f.origin = c || f.origin; }
  else f.origin = cHit(all) || '';
  if (!f.region) { const m = all.match(REGIONS) || all.match(REGION_ZH); if (m) f.region = /[\u4e00-\u9fff]/.test(m[0]) ? m[0] : title(m[0].toLowerCase()); }
  if (!f.farm) { const ln = lines.find(l => /\b(finca|farm|estate|hacienda|washing station|cooperative|co-?op|station)\b|庄园|处理站|合作社/i.test(l)); if (ln) f.farm = clean(ln.replace(/^(produced by|producer)/i, '')); }
  if (!f.notes) { const ln = lines.find(l => /notes?|flavou?r|风味/i.test(l)); if (ln) f.notes = clean(ln.replace(/^.*?(notes?|flavou?rs?|风味)\s*[:：]?/i, '')); }
  if (!f.roaster) { const known = ROASTERS.find(r => new RegExp('\\b' + r.replace(/[.']/g, '.?') + '\\b', 'i').test(all));
    const ln = lines.find(l => /(coffee\s*)?roast(ers?|ery|ing\s*co\.?)\b|coffee\s*co\.?\b|咖啡烘焙|烘焙坊|烘焙工坊/i.test(l) && !/roast(ed)?\s*(on|date)/i.test(l));
    f.roaster = known || (ln ? clean(ln) : ''); }
  if (!f.name) { // the most "title-like" remaining line
    const skip = new RegExp([f.roaster, f.weight, f.roastDate].filter(Boolean).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '^$', 'i');
    const cand = lines.filter((l, i) => !used.has(i) && !skip.test(l) && /[a-z\u4e00-\u9fff]{3}/i.test(l) && !/^(www\.|http|@|#)/i.test(l) && !LABELS.some(([, re]) => re.test(l)) && l.length <= 48);
    const score = l => (cHit(l) ? 4 : 0) + (REGIONS.test(l) || REGION_ZH.test(l) ? 3 : 0) + (/^[A-Z0-9 &'.-]+$/.test(l) ? 1 : 0) - (procHit(l) ? 2 : 0) - (/notes?|flavou?r/i.test(l) ? 3 : 0);
    const best = cand.sort((a, b) => score(b) - score(a))[0];
    if (best) f.name = clean(best); else if (f.origin) f.name = [f.origin, f.region].filter(Boolean).join(' ');
  }
  Object.keys(f).forEach(k => { f[k] = clean(f[k]).slice(0, 120); });
  return f;
}

function toText(b) {
  const L = FIELDS.filter(([k]) => b[k]).map(([k, zh]) => `${zh}：${b[k]}`);
  return [`🫘 ${b.name || '咖啡豆'}`, ...L.filter(l => !l.startsWith('豆名')), b.cafeName ? `购于：${b.cafeName}` : '', b.memo ? `备注：${b.memo}` : '', `记录于 ${b.date || ''}`].filter(Boolean).join('\n');
}
// quick 16x16 bean sprite + seed packet colours (original pixel art)
function beanSprite() { const V = window.Valley; if (!V) return null; const P = V.Pix(16, 16); P.ell(6, 8, 4, 5.5, '#8a4a20'); P.ell(11, 7.5, 3.6, 5, '#a05a28'); P.rect(6, 4, 1, 9, '#5a2e12'); P.rect(11, 4, 1, 8, '#6a3818'); P.set(4, 6, '#c27a3a'); P.set(9, 5, '#c88a48'); P.outline('#3a2414'); return P.canvas(); }

window.Beans = {FIELDS, loadLib, ocr, vision, parse, preprocess, toText, beanSprite, get visionOn() { const V = (window.APP_CONFIG || {}).VISION_API; return !!(V && V.ENDPOINT); }, _workers: workers};
})();
