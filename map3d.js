// 🧊 3D sketch diorama of a region map (three.js, lazy-loaded ES module). Same layout/numbering as the 2D SVG maps.
import * as THREE from './vendor/three/three.module.min.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {CSS2DRenderer, CSS2DObject} from './vendor/three/CSS2DRenderer.js';

let PENCIL = '#4a4a4a', SLATE = '#9fb3c4', SLATE_D = '#6f879c', PINK = '#ef6f8f', PINK_D = '#c94a6b', PAPER = '#f7f4ec', LABEL_FONT = '"Josefin Sans", "Avenir Next", Helvetica, sans-serif';
const THEMES = {
  sketch: {PENCIL: '#4a4a4a', SLATE: '#9fb3c4', SLATE_D: '#6f879c', PINK: '#ef6f8f', PINK_D: '#c94a6b', PAPER: '#f7f4ec', LABEL_FONT: '"Josefin Sans", "Avenir Next", Helvetica, sans-serif'},
  foundation: {PENCIL: '#5a3c22', SLATE: '#d8c08c', SLATE_D: '#6e5230', PINK: '#d9644e', PINK_D: '#8a3a24', PAPER: '#a8c47a', LABEL_FONT: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", Helvetica, sans-serif'},
  xuan: {PENCIL: '#1f1a17', SLATE: '#cfc3a5', SLATE_D: '#3b332c', PINK: '#b3342b', PINK_D: '#7e1f1a', PAPER: '#e8dcc0', LABEL_FONT: '"Kaiti SC", "STKaiti", "KaiTi", "Songti SC", "Noto Serif CJK SC", serif'},
  jrpg: {PENCIL: '#1a1c2c', SLATE: '#ffffff', SLATE_D: '#1a1c2c', PINK: '#ffcd75', PINK_D: '#b07a1e', PAPER: '#5fb547', LABEL_FONT: '"FusionPixel", monospace'},
};
const ROOF3 = ['#b13e53', '#3b5dc9', '#38b764', '#a05b2c', '#5d275d', '#ef7d57'];
function pixelTex(canvas, rep) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
const S = 1 / 100; // svg units -> world units
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

export function supported() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; }
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; return t;
}
// vertical pencil strokes; with world-space UVs (u = x+z) they read as diagonal hatching on roofs, vertical on walls
const stripeTex = (alpha, gap = 8) => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const R = rng(alpha * 1000 | 0);
  for (let x = 2; x < w; x += gap) { g.strokeStyle = `rgba(60,60,60,${alpha * (0.7 + R() * 0.6)})`; g.lineWidth = 1.6 + R(); g.beginPath(); g.moveTo(x + R() * 1.5, 0); g.lineTo(x + R() * 1.5, h); g.stroke(); }
}, true);
const paperTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h); const R = rng(42);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,80,60,${R() * 0.06})`; g.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); }
  g.strokeStyle = 'rgba(111,135,156,.10)'; g.lineWidth = 1; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
}, true);
function toonRamp() { const d = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; }

// tiny geometry merger (keeps draw calls low: all blocks = 1 mesh + 2 line sets)
class Batch {
  constructor(uvK, planar) { this.pos = []; this.nor = []; this.col = []; this.uv = []; this.edges = []; this.edges2 = []; this.k = uvK; this.planar = planar; }
  geo(g0, x, y, z, ry, color, sx = 1, sy = 1, sz = 1) { const g = g0.index ? g0.toNonIndexed() : g0.clone(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz))); g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); this.pos.push(X, Y, Z); this.nor.push(n.getX(i), n.getY(i), n.getZ(i)); this.col.push(c.r, c.g, c.b); this.uv.push(X * this.k, Z * this.k); } g.dispose(); }
  box(w, h, d, x, y, z, ry, color, {edges = true, jitter = 0.018, seed = 1} = {}) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m); const p = g.attributes.position, n = g.attributes.normal, c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); this.pos.push(X, Y, Z); this.nor.push(n.getX(i), n.getY(i), n.getZ(i)); this.col.push(c.r, c.g, c.b); this.uv.push(...(this.planar && Math.abs(n.getY(i)) > .5 ? [X * this.k, Z * this.k] : [(X + Z) * this.k, Y * this.k])); }
    if (edges) {
      const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)); e.applyMatrix4(m); const R = rng(seed), q = e.attributes.position;
      for (let i = 0; i < q.count; i++) this.edges.push(q.getX(i), q.getY(i), q.getZ(i));
      for (let i = 0; i < q.count; i += 2) { const o = [(R() - .5) * jitter, (R() - .5) * jitter, (R() - .5) * jitter]; // second, wobbly pencil pass
        for (let j = 0; j < 2; j++) this.edges2.push(q.getX(i + j) + o[0] + (R() - .5) * jitter, q.getY(i + j) + o[1], q.getZ(i + j) + o[2] + (R() - .5) * jitter); }
      e.dispose();
    }
    g.dispose();
  }
  build(mat, lineColor) {
    const out = new THREE.Group(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    out.add(new THREE.Mesh(g, mat));
    if (this.edges.length) {
      const e1 = new THREE.BufferGeometry(); e1.setAttribute('position', new THREE.Float32BufferAttribute(this.edges, 3));
      const e2 = new THREE.BufferGeometry(); e2.setAttribute('position', new THREE.Float32BufferAttribute(this.edges2, 3));
      out.add(new THREE.LineSegments(e1, new THREE.LineBasicMaterial({color: lineColor})));
      out.add(new THREE.LineSegments(e2, new THREE.LineBasicMaterial({color: lineColor, transparent: true, opacity: .45})));
    }
    return out;
  }
}

function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((px - a[0]) * dx + (py - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); }

async function fontsReady() {
  if (!document.fonts || !document.fonts.load) return;
  await Promise.race([Promise.all(['700 40px "Josefin Sans"', '700 40px "Caveat"', '12px "FusionPixel"'].map(f => document.fonts.load(f).catch(() => {}))), new Promise(r => setTimeout(r, 1200))]);
}
function streetLabelTex(text, fsPx) {
  const font = `700 ${fsPx}px ${LABEL_FONT}`, sp = fsPx * 0.3;
  const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const chars = [...text], w = Math.ceil(chars.reduce((s, ch) => s + m.measureText(ch).width + sp, 0) + fsPx), h = Math.ceil(fsPx * 1.5);
  const tex = canvasTex(w, h, (g) => {
    g.font = font; g.textBaseline = 'middle'; g.lineJoin = 'round'; let x = fsPx / 2;
    chars.forEach(ch => { g.lineWidth = fsPx * 0.16; g.strokeStyle = SLATE_D; g.strokeText(ch, x, h / 2); g.fillStyle = '#fff'; g.fillText(ch, x, h / 2); x += g.measureText(ch).width + sp; });
  });
  return {tex, aspect: w / h};
}

export async function create(el, region, opt) {
  const {visited, cafeById, me, rangeM = 250, onOpen = () => {}, pop = new Set(), fitAffine} = opt;
  const J = opt.theme === 'jrpg' && window.JRPG, TT = J ? window.JRPG.tiles() : null, FDN = opt.theme === 'foundation';
  const XU = !!(J && opt.xuan && window.Xuan); // ⚔️ 古风: ink-wash paper ground, stone paths, tiled-roof pavilions, misty mountains
  const VL = !!(opt.valley && J && !XU && !FDN); // 🌾 田园: warm sun, soft shadows, leaves. No WebGL → pixel map in app.js.
  let valleyMood = null;
  ({PENCIL, SLATE, SLATE_D, PINK, PINK_D, PAPER, LABEL_FONT} = THEMES[XU ? 'xuan' : J ? 'jrpg' : FDN ? 'foundation' : 'sketch']);
  const SEA = opt.season || 'spring', FG = {spring: ['#9cc46a', '#b7d47e', '#86b05a', '#e9d98e'], summer: ['#b5c46a', '#cfd182', '#9aac58', '#e8c879'], autumn: ['#c2b25e', '#d6a24e', '#a99a4c', '#e3b469'], winter: ['#8fae78', '#a6bf8c', '#7b9a68', '#d9d6b0']}[SEA] || ['#9cc46a', '#b7d47e', '#86b05a', '#e9d98e'];
  await fontsReady();
  const [vx, vy, vw, vh] = region.vb, cx = vx + vw / 2, cy = vy + vh / 2;
  const W = (x, y) => [(x - cx) * S, (y - cy) * S];
  const disposables = [];
  const track = o => { disposables.push(o); return o; };

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(VL ? 1.5 : 2, window.devicePixelRatio || 1));
  if (VL && THREE.PCFSoftShadowMap != null) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  renderer.domElement.className = 'm3d-canvas';
  const labels = new CSS2DRenderer(); labels.domElement.className = 'm3d-labels';
  el.appendChild(renderer.domElement); el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FDN ? 30 : 38, 1, 0.1, 200);
  if (FDN) { // warm golden-hour light + soft haze for depth
    scene.add(new THREE.HemisphereLight(0xfff0cc, 0x6e8a48, 1.45)); const sun = new THREE.DirectionalLight(0xffd59a, 2.3); sun.position.set(-7, 8, 3); scene.add(sun);
    scene.fog = new THREE.FogExp2(0xf1dcae, 0.011); }
  else if (XU) { scene.add(new THREE.HemisphereLight(0xfff2da, 0x7a6a4a, 1.6)); const sun = new THREE.DirectionalLight(0xffdfae, 2.1); sun.position.set(-6, 9, 3); scene.add(sun); scene.fog = new THREE.FogExp2(0xf0e6cf, 0.009); }
  else if (VL) { // day / dawn / 晚霞 / night, plus the in-game clear · overcast · light rain
    const phase = opt.phase || 'day', wx = opt.wx || 'sun';
    const pack = {
      day:   {sky: ['#8ec8f0', '#d9f0c6'], fog: 0xc6e2a0, fogD: 0.011, hemi: 0xfff4d4, hemG: 0x4a7a34, hemI: 0.62, amb: 0xfff6e4, ambI: 0.22, sun: 0xffe2a8, sunI: 0.95, sunY: 14, water: '#7eb6c9'},
      dawn:  {sky: ['#ffb08a', '#ffe4c0', '#c5d8a8'], fog: 0xf0c8a4, fogD: 0.013, hemi: 0xffd0b0, hemG: 0x6a8a48, hemI: 0.55, amb: 0xffe0c4, ambI: 0.28, sun: 0xffb07a, sunI: 0.72, sunY: 6, water: '#c48878'},
      dusk:  {sky: ['#ff5c3c', '#ffb07a', '#6a4a78'], fog: 0xe09070, fogD: 0.015, hemi: 0xffb090, hemG: 0x4a5840, hemI: 0.48, amb: 0xffc8a0, ambI: 0.22, sun: 0xff7040, sunI: 0.78, sunY: 5, water: '#c46858'},
      night: {sky: ['#0c1224', '#24304e', '#3a2840'], fog: 0x1a2238, fogD: 0.02, hemi: 0x6a78a8, hemG: 0x1a2820, hemI: 0.32, amb: 0x9aa4c8, ambI: 0.32, sun: 0xd0d8ff, sunI: 0.26, sunY: 11, water: '#243e58'},
    };
    valleyMood = {...(pack[phase] || pack.day)};
    if (wx === 'cloud' || wx === 'rain') {
      if (phase === 'dusk') valleyMood = {sky: ['#c46a58', '#d0a090', '#4a3a58'], fog: 0xb08078, fogD: 0.02, hemi: 0xd0a090, hemG: 0x3a4038, hemI: 0.4, amb: 0xc8b0a8, ambI: 0.28, sun: 0xe09070, sunI: 0.38, sunY: 5, water: '#8a6870'};
      else if (phase !== 'night') valleyMood = {sky: wx === 'rain' ? ['#7e8c98', '#aeb8c2'] : ['#aeb6be', '#d0d6dc'], fog: 0xb7c0c6, fogD: wx === 'rain' ? 0.024 : 0.017, hemi: 0xd5dbe4, hemG: 0x4e6844, hemI: 0.46, amb: 0xe6eaef, ambI: 0.32, sun: 0xe4e8ee, sunI: wx === 'rain' ? 0.3 : 0.46, sunY: 12, water: '#6a90a0'};
    }
    if (wx === 'hot' && phase === 'day') valleyMood = {...valleyMood, sky: ['#f0c878', '#ffe6b0', '#c6e090'], sun: 0xffc86a, sunI: 1.02, fog: 0xe6d090};
    valleyMood.phase = phase; valleyMood.wx = wx; valleyMood.wind = wx === 'wind'; valleyMood.rain = wx === 'rain';
    const Md = valleyMood;
    scene.background = new THREE.Color(Md.sky[0]);
    scene.add(new THREE.HemisphereLight(Md.hemi, Md.hemG, Md.hemI));
    scene.add(new THREE.AmbientLight(Md.amb, Md.ambI));
    const sun = new THREE.DirectionalLight(Md.sun, Md.sunI); sun.position.set(-8, Md.sunY, 6);
    if (phase !== 'night' && !Md.rain) {
      sun.castShadow = true; sun.shadow.mapSize.set(512, 512); sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
      sun.shadow.camera.left = sun.shadow.camera.bottom = -14; sun.shadow.camera.right = sun.shadow.camera.top = 14; sun.shadow.bias = -0.0008;
    }
    scene.add(sun); scene.fog = new THREE.FogExp2(Md.fog, Md.fogD);
  }
  else { scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c0, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(-4, 9, 5); scene.add(sun); }
  const ramp = track(toonRamp());

  // paper ground + inked border
  const meadowTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = FG[0]; g.fillRect(0, 0, w, h); const R2 = rng(7);
    for (let i = 0; i < 260; i++) { const x = R2() * w, y = R2() * h, r = 8 + R2() * 46, gr = g.createRadialGradient(x, y, 0, x, y, r); const c = FG[1 + ((R2() * 3) | 0)]; gr.addColorStop(0, c + 'aa'); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${R2() < .5 ? '60,80,30' : '255,240,190'},${R2() * .12})`; g.fillRect(R2() * w, R2() * h, 1 + R2() * 2, 1 + R2() * 3); } }, true);
  const xuTex = () => canvasTex(512, 512, (g, w, h) => { window.Xuan.paperTex(g, w, h, 11); const R2 = rng(13); for (let i = 0; i < 70; i++) { const x = R2() * w, y = R2() * h, r = 20 + R2() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); const c = R2() < .75 ? '147,180,160' : '185,138,76'; gr.addColorStop(0, `rgba(${c},.28)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, true);
  const XS = XU ? await Promise.race([Promise.all([window.Xuan.ready(), window.Xuan.sceneCanvas(region), window.Xuan.skyCanvas(region)]), new Promise(r => setTimeout(() => r(null), 7000))]) : null; // 古风: painted scene
  const xuPaint = XS && XS[1] ? (() => { const t = new THREE.CanvasTexture(XS[1]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })() : null;
  const GW = vw * S + 1.2, GD = vh * S + 1.2, pt = track(xuPaint ? xuPaint : XU ? xuTex() : J ? pixelTex(TT.grass[0], [GW / 0.32, GD / 0.32]) : FDN ? meadowTex() : paperTex());   if ((!J || XU) && !xuPaint) pt.repeat.set(GW / (FDN ? 6 : XU ? 7 : 4), GD / (FDN ? 6 : XU ? 7 : 4));
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(GW, GD)), track(VL ? new THREE.MeshLambertMaterial({map: pt}) : new THREE.MeshBasicMaterial({map: pt})));
  ground.rotation.x = -Math.PI / 2; if (VL) ground.receiveShadow = true; scene.add(ground);
  const bpts = [[-GW / 2, -GD / 2], [GW / 2, -GD / 2], [GW / 2, GD / 2], [-GW / 2, GD / 2], [-GW / 2, -GD / 2]];
  if (!FDN) [0, 0.03].forEach((j, i) => { const g = track(new THREE.BufferGeometry().setFromPoints(bpts.map(([x, z]) => new THREE.Vector3(x + j, 0.004, z - j)))); scene.add(new THREE.Line(g, track(new THREE.LineBasicMaterial({color: PENCIL, transparent: true, opacity: i ? .4 : .9})))); });
  // soft "slab" under the paper so the diorama has thickness
  const base = new THREE.Mesh(track(new THREE.BoxGeometry(GW, 0.25, GD)), track(FDN ? new THREE.MeshLambertMaterial({color: '#8a6a44'}) : new THREE.MeshToonMaterial({color: XU ? '#4a2e1e' : J ? '#8a5a32' : '#e9e2d0', gradientMap: ramp})));
  base.position.y = -0.126; scene.add(base);
  if (XU && XS && XS[2]) { // 山水: the painting's own mountains stand up behind the diorama as a misty backdrop
    const st = new THREE.CanvasTexture(XS[2]); st.colorSpace = THREE.SRGBColorSpace; track(st); const bw = GW * 1.55, bh = bw * 440 / 1024;
    const bp = new THREE.Mesh(track(new THREE.PlaneGeometry(bw, bh)), track(new THREE.MeshBasicMaterial({map: st, transparent: true, depthWrite: false, fog: false}))); bp.position.set(0, bh / 2 - 0.55, -GD / 2 - 0.9); scene.add(bp);
    const mt = track(canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(252,248,238,.85)'); gr.addColorStop(1, 'rgba(252,248,238,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); })); const RM = rng(hash(region.id) ^ 0x77);
    for (let i = 0; i < 7; i++) { const m = new THREE.Sprite(track(new THREE.SpriteMaterial({map: mt, transparent: true, depthWrite: false, opacity: .55 + RM() * .3}))); m.scale.set(3.5 + RM() * 3, 1.1 + RM() * .6, 1); m.position.set((RM() - .5) * GW * 1.3, 0.35 + RM() * 0.5, -GD / 2 - 0.3 + RM() * 1.2); scene.add(m); } }
  else if (XU) { // 山水: misty celadon/indigo peaks ringing the far side of the diorama
    const RM = rng(hash(region.id) ^ 0x51), mg = new Batch(1), cone = new THREE.ConeGeometry(1, 1, 7, 1);
    for (let i = 0; i < 16; i++) { const t = i / 15, side = i % 3, hgt = 1.4 + RM() * 2.4, r = 0.9 + RM() * 1.3;
      const x = side === 2 ? (RM() < .5 ? -1 : 1) * (GW / 2 + 1 + RM() * 1.5) : (t - .5) * (GW + 3), z = side === 2 ? (RM() - .7) * GD : -GD / 2 - 1.2 - RM() * 2.2;
      mg.geo(cone, x, hgt / 2 - 0.2, z, RM() * 3, ['#93b4a0', '#7f9bb0', '#5f8775', '#bcd2bd'][(RM() * 4) | 0], r, hgt, r * (.7 + RM() * .4)); }
    scene.add(mg.build(track(new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true})), PENCIL)); cone.dispose(); }
  if (!FDN) { const be = new THREE.LineSegments(track(new THREE.EdgesGeometry(base.geometry)), track(new THREE.LineBasicMaterial({color: PENCIL}))); be.position.copy(base.position); scene.add(be); }

  // streets: raised slate slabs on a pencil casing
  const sb = new Batch(J && !XU ? 1 / 0.32 : 1.6, !!J && !XU);
  const wind = pts => { if (!FDN) return pts; const out = [pts[0]]; // organic: gently meander between the real street points
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 40)), nx = -(by - ay) / (L || 1), ny = (bx - ax) / (L || 1), amp = Math.min(9, L / 30);
      for (let k = 1; k <= n; k++) { const t = k / n, o = k === n ? 0 : Math.sin(t * Math.PI * 2 + i) * amp; out.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]); } } return out; };
  region.streets.forEach((st, si) => {
    const ws = st.w * S * (FDN ? .82 : 1), h = FDN ? 0.03 + si * 0.001 : 0.08 + st.w * 0.0022 + si * 0.0015, SP = wind(st.pts);
    for (let i = 1; i < SP.length && !xuPaint; i++) {
      const [x0, z0] = W(...SP[i - 1]), [x1, z1] = W(...SP[i]), L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0);
      if (FDN) { sb.box(L + ws * .6, h * .6, ws + 0.06, (x0 + x1) / 2, h * .3, (z0 + z1) / 2, ry, '#a98c5c', {edges: false}); sb.box(L + ws * .5, h, ws, (x0 + x1) / 2, h / 2 + 0.002, (z0 + z1) / 2, ry, st.w >= 28 ? '#d9c497' : '#e2cd9c', {edges: false}); continue; }
      sb.box(L + ws + 0.07, h - 0.02, ws + 0.07, (x0 + x1) / 2, (h - 0.02) / 2, (z0 + z1) / 2, ry, XU ? '#5a5246' : J ? '#5e584c' : PENCIL, {edges: false});
      sb.box(L + ws, h, ws, (x0 + x1) / 2, h / 2 + 0.002, (z0 + z1) / 2, ry, XU ? (st.w >= 28 ? '#cfc6ae' : '#d9c79e') : J ? (st.w >= 28 ? '#ffffff' : '#f2c98a') : SLATE, {seed: si * 7 + i});
    }
    if (st.label) {
      const fs = st.w * 0.6 * S, {tex, aspect} = streetLabelTex(st.label, 64); track(tex);
      const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(fs * 1.5 * aspect, fs * 1.5)), track(new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2})));
      plane.rotation.x = -Math.PI / 2;
      const g = new THREE.Group(); const [lx, lz] = W(...st.at); g.position.set(lx, h + (FDN ? 0.03 : 0.012), lz); g.rotation.y = st.v ? Math.PI / 2 : 0; g.add(plane); scene.add(g);
    }
  });
  const sh = (group, cast) => { if (VL) group.traverse(o => { if (o.isMesh) { o.castShadow = !!cast; o.receiveShadow = true; } }); return group; };
  scene.add(sh(sb.build(track(FDN ? new THREE.MeshLambertMaterial({vertexColors: true}) : VL ? new THREE.MeshLambertMaterial({vertexColors: true, map: track(pixelTex(TT.stone))}) : new THREE.MeshToonMaterial({vertexColors: true, gradientMap: ramp, map: track(XU ? stripeTex(.12, 7) : J ? pixelTex(TT.stone) : stripeTex(.33, 9))})), PENCIL), false));

  // low-poly blocks between streets (seeded per region, avoid streets / markers / pill)
  const R = rng(hash(region.id)), bb = new Batch(1.9), tb = new Batch(1), pts = Object.values(region.cafes), pl = region.pill;
  const prismGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1); prismGeo.rotateZ(Math.PI / 2); prismGeo.rotateX(Math.PI / 2 * 0); // gable roof (triangular prism along x)
  const roofGeo = new THREE.ConeGeometry(0.7071, 1, 4, 1), trunkGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.22, 5), crownGeo = new THREE.ConeGeometry(0.2, 0.42, 6), ballGeo = new THREE.IcosahedronGeometry(0.19, 0);
  const tones = ['#fffdf8', '#fffdf8', '#fffdf8', '#f3efe4', '#e6edf2', '#fbe3ea'];
  for (let y = vy + 30; y < vy + vh - 20; y += 56) for (let x = vx + 30; x < vx + vw - 20; x += 56) {
    const jx = x + (R() - .5) * 12, jy = y + (R() - .5) * 12, sz = 30 + R() * 16, sz2 = 30 + R() * 16;
    if (R() < 0.22) continue;
    if (region.streets.some(st => st.pts.slice(1).some((p, i) => segDist(jx, jy, st.pts[i], p) < st.w / 2 + Math.max(sz, sz2) * 0.72 + 6))) continue;
    if (pts.some(([px, py]) => Math.hypot(px - jx, py - jy) < 52)) continue;
    if (pl && Math.abs(jx - pl.x) < pl.w / 2 + 24 && Math.abs(jy - pl.y) < pl.h / 2 + 24) continue;
    const hgt = 0.18 + Math.pow(R(), 2.2) * 1.1, [wx, wz] = W(jx, jy);
    if (FDN) { // organic village: cottages hugging the roads, orchards and fields further out
      const nearRoad = region.streets.some(st => st.pts.slice(1).some((p, i) => segDist(jx, jy, st.pts[i], p) < st.w / 2 + 90));
      if (!nearRoad || R() < 0.3) { if (R() < 0.35) { bb.box(sz * S * 1.3, 0.025, sz2 * S * 1.1, wx, 0.012, wz, (R() - .5) * 0.5, R() < .5 ? '#e3c76a' : '#c9b25a', {edges: false}); continue; }
        for (let t = 0; t < 3; t++) { const ox = (R() - .5) * sz * S, oz = (R() - .5) * sz2 * S, sc = .8 + R() * .6; tb.geo(trunkGeo, wx + ox, 0.11, wz + oz, 0, '#7a5434'); tb.geo(ballGeo, wx + ox, 0.36 * sc, wz + oz, R(), ['#6f9a48', '#86ad55', '#5d8a3e', '#9bb65e'][(R() * 4) | 0], sc * 1.1, sc, sc * 1.1); } continue; }
      const hh = 0.14 + R() * 0.2, ry = (R() - .5) * 0.5, w1 = sz * S * .7, d1 = sz2 * S * .55, wallC = ['#efdcb4', '#e6cf9f', '#f2e2c6', '#dcc395'][(R() * 4) | 0];
      bb.box(w1, hh, d1, wx, hh / 2, wz, ry, wallC, {edges: false});
      tb.geo(prismGeo, wx, hh + 0.09, wz, ry, ['#c8643c', '#d9a441', '#a85a48', '#8c97a3'][(R() * 4) | 0], w1 * 1.12, 0.2, d1 * 1.25);
      continue;
    }
    if (XU && xuPaint) continue; // the painting already has its own trees / terraces
    if (XU) { // 古风 village: 粉墙黛瓦 houses with hip roofs, ink-green pines and round trees
      if (R() < 0.45) { for (let t = 0; t < 2; t++) { const ox = (R() - .5) * sz * S * .6, oz = (R() - .5) * sz2 * S * .6; tb.geo(trunkGeo, wx + ox, 0.11, wz + oz, 0, '#3b2a1e'); if (R() < .55) tb.geo(crownGeo, wx + ox, 0.42, wz + oz, R(), R() < .5 ? '#3f5e4a' : '#2f4a3c'); else tb.geo(ballGeo, wx + ox, 0.36, wz + oz, R(), R() < .12 ? '#c4574d' : '#6f8f73'); } continue; }
      const hh = 0.14 + R() * 0.2, ry = (R() - .5) * 0.1, w1 = sz * S * .8, d1 = sz2 * S * .7;
      bb.box(w1, hh, d1, wx, hh / 2, wz, ry, '#f2ecdc', {seed: (x * 31 + y) | 0});
      tb.geo(roofGeo, wx, hh + 0.1, wz, ry + Math.PI / 4, R() < .8 ? '#3d4852' : '#4a3a2e', w1 * 1.3, 0.2, d1 * 1.3);
      continue;
    }
    if (VL) { // terrace row, iron-lace rail, cafe awning, or a narrow laneway. Trees stay so the meadow still reads.
      const roll = R();
      if (roll < 0.34) { for (let t = 0; t < 2; t++) { const ox = (R() - .5) * sz * S * .6, oz = (R() - .5) * sz2 * S * .6; tb.geo(trunkGeo, wx + ox, 0.11, wz + oz, 0, '#6b4423'); if (R() < .5) tb.geo(crownGeo, wx + ox, 0.42, wz + oz, R(), '#2f8a3a'); else tb.geo(ballGeo, wx + ox, 0.36, wz + oz, R(), '#49b04f'); } continue; }
      if (roll < 0.48) { bb.box(0.16, 0.02, 0.7, wx, 0.015, wz, (R() - .5) * 0.4, '#3c3834', {edges: false}); bb.box(0.05, 0.24, 0.05, wx - 0.12, 0.12, wz, 0, '#f3e6cf', {edges: false}); bb.box(0.05, 0.24, 0.05, wx + 0.12, 0.12, wz, 0, '#e6d2b4', {edges: false}); continue; }
      const hh = 0.2 + R() * 0.1, ry = (R() - .5) * 0.18, w1 = 0.58, d1 = 0.26;
      bb.box(w1, hh, d1, wx, hh / 2, wz, ry, R() < .55 ? '#f4e6cf' : '#e4cbb0', {edges: false});
      bb.box(w1 * 1.08, 0.055, d1 * 1.15, wx, hh + 0.03, wz, ry, '#3e4654', {edges: false});
      const fx = Math.sin(ry) * d1 * 0.62, fz = Math.cos(ry) * d1 * 0.62;
      bb.box(w1 * 0.9, 0.012, 0.018, wx + fx, hh * 0.68, wz + fz, ry, '#2a3038', {edges: false});
      bb.box(w1 * 0.9, 0.01, 0.014, wx + fx, hh * 0.62, wz + fz, ry, '#2a3038', {edges: false});
      bb.box(w1 * 0.94, 0.022, 0.09, wx + fx * 0.72, hh * 0.4, wz + fz * 0.72, ry, R() < .5 ? '#d06a58' : '#5f8f42', {edges: false});
      bb.box(0.055, 0.045, 0.02, wx + fx * 0.95, hh * 0.58, wz + fz * 0.95, ry, '#ffe1a4', {edges: false});
      continue;
    }
    if (J) { // toy JRPG overworld: cottages with pyramid roofs, or little trees
      if (R() < 0.42) { for (let t = 0; t < 2; t++) { const ox = (R() - .5) * sz * S * .6, oz = (R() - .5) * sz2 * S * .6; tb.geo(trunkGeo, wx + ox, 0.11, wz + oz, 0, '#6b4423'); if (R() < .5) tb.geo(crownGeo, wx + ox, 0.42, wz + oz, R(), '#2f8a3a'); else tb.geo(ballGeo, wx + ox, 0.36, wz + oz, R(), '#49b04f'); } continue; }
      const hh = 0.16 + R() * 0.28, ry = (R() - .5) * 0.1, w1 = sz * S * .85, d1 = sz2 * S * .85;
      bb.box(w1, hh, d1, wx, hh / 2, wz, ry, '#f4e4c1', {seed: (x * 31 + y) | 0});
      tb.geo(roofGeo, wx, hh + 0.13, wz, ry + Math.PI / 4, ROOF3[(R() * ROOF3.length) | 0], w1 * 1.12, 0.26, d1 * 1.12);
      continue;
    }
    bb.box(sz * S, hgt, sz2 * S, wx, hgt / 2, wz, (R() - .5) * 0.12, tones[(R() * tones.length) | 0], {seed: (x * 31 + y) | 0});
    if (R() < 0.18) bb.box(sz * S * 0.45, 0.12, sz2 * S * 0.45, wx, hgt + 0.06, wz, 0, '#f3efe4', {seed: (x + y * 17) | 0}); // little roof box
  }
  scene.add(sh(bb.build(track(FDN || VL ? new THREE.MeshLambertMaterial({vertexColors: true}) : new THREE.MeshToonMaterial({vertexColors: true, gradientMap: ramp, map: track(stripeTex(XU ? .1 : J ? .06 : .16, 8))})), PENCIL), true));
  if (tb.pos.length) { const tm = tb.build(track(FDN || VL ? new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true}) : new THREE.MeshToonMaterial({vertexColors: true, gradientMap: ramp, flatShading: true})), PENCIL); scene.add(sh(tm, true)); }
  [roofGeo, trunkGeo, crownGeo, ballGeo].forEach(g => g.dispose());

  // floating region pill
  if (pl && !(XU && xuPaint)) {
    const d = document.createElement('div'); d.className = 'm3d-pill'; d.textContent = region.name;
    const o = new CSS2DObject(d); const [px, pz] = W(pl.x, pl.y); o.position.set(px, 0.06, pz); scene.add(o);
  }

  // cafe markers: pink coffee-cup pins on a pencil pillar
  const cupGeo = track(new THREE.CylinderGeometry(0.3, 0.21, 0.4, 14)), cupEdge = track(new THREE.EdgesGeometry(cupGeo, 30));
  const handleGeo = track(new THREE.TorusGeometry(0.11, 0.035, 6, 12, Math.PI)), pillarGeo = track(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6));
  const discGeo = track(new THREE.CircleGeometry(0.265, 16)), ringGeo = track(new THREE.RingGeometry(0.22, 0.32, 24));
  const M = {
    cupOn: track(new THREE.MeshToonMaterial({color: PINK, gradientMap: ramp})), cupOff: track(new THREE.MeshToonMaterial({color: J ? '#c8c8d4' : '#fffaf6', gradientMap: ramp, transparent: true, opacity: .9})),
    coffee: track(new THREE.MeshBasicMaterial({color: '#7a4a32'})), foam: track(new THREE.MeshBasicMaterial({color: '#fbd6df'})),
    pillar: track(new THREE.MeshBasicMaterial({color: PENCIL})), edgeOn: track(new THREE.LineBasicMaterial({color: PINK_D})),
    edgeOff: track(new THREE.LineDashedMaterial({color: PINK_D, dashSize: 0.04, gapSize: 0.03})),
    ringOn: track(new THREE.MeshBasicMaterial({color: PINK, transparent: true, opacity: .55, side: THREE.DoubleSide})), ringOff: track(new THREE.MeshBasicMaterial({color: PINK_D, transparent: true, opacity: .25, side: THREE.DoubleSide})),
  };
  const fdBody = track(new THREE.BoxGeometry(0.62, 0.52, 0.5)), fdBodyEdge = track(new THREE.EdgesGeometry(fdBody)), fdRoof = track(new THREE.CylinderGeometry(0.42, 0.42, 0.78, 3, 1)), fdChim = track(new THREE.BoxGeometry(0.1, 0.26, 0.1)), fdSign = track(new THREE.BoxGeometry(0.22, 0.14, 0.03));
  fdRoof.rotateZ(Math.PI / 2); fdRoof.rotateX(Math.PI / 6); fdRoof.scale(1, 0.62, 0.78);
  Object.assign(M, {fWall: ['#f1dfb8', '#e8d0a2', '#f3e4cc'].map(c => track(new THREE.MeshLambertMaterial({color: c}))), fRoof: ['#c8643c', '#d9a441', '#a85a48', '#7d8fa3'].map(c => track(new THREE.MeshLambertMaterial({color: c, flatShading: true}))),
    fChim: track(new THREE.MeshLambertMaterial({color: '#9a7a62'})), fSign: track(new THREE.MeshLambertMaterial({color: '#7a4a28'})),
    ghost: track(new THREE.MeshLambertMaterial({color: '#a9cdee', transparent: true, opacity: .45, depthWrite: false})), ghostR: track(new THREE.MeshLambertMaterial({color: '#c9e0f5', transparent: true, opacity: .45, depthWrite: false})),
    ghostE: track(new THREE.LineDashedMaterial({color: '#3f78b0', dashSize: 0.05, gapSize: 0.035}))});
  if (VL) { M.cupOn = track(new THREE.MeshLambertMaterial({color: PINK})); M.cupOff = track(new THREE.MeshLambertMaterial({color: '#f3ecdf'})); M.coffee = track(new THREE.MeshLambertMaterial({color: '#6b3a22'})); }
  const glowTex = track(canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); const gc = XU ? '255,180,90' : J ? '255,220,120' : FDN ? '255,214,140' : '255,170,195'; gr.addColorStop(0, `rgba(${gc},.95)`); gr.addColorStop(1, `rgba(${gc},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const xuPl = track(new THREE.BoxGeometry(0.72, 0.08, 0.56)), xuPi = track(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 6)), xuBody = track(new THREE.BoxGeometry(0.44, 0.36, 0.32)), xuRoof = track(new THREE.ConeGeometry(0.56, 0.3, 4, 1)), xuFin = track(new THREE.ConeGeometry(0.04, 0.14, 6)), xuLan = track(new THREE.SphereGeometry(0.06, 10, 8));
  if (XU) { const L = c => track(new THREE.MeshLambertMaterial({color: c})), Gh = c => track(new THREE.MeshLambertMaterial({color: c, transparent: true, opacity: .5, depthWrite: false}));
    M.xu = {stone: L('#b9b19c'), pillar: L('#b3342b'), wall: L('#f3e7c9'), roof: track(new THREE.MeshLambertMaterial({color: '#3d4852', flatShading: true})), gold: L('#c9a45a'), lantern: track(new THREE.MeshBasicMaterial({color: '#e0563a'}))};
    M.xuG = {stone: L('#bdb7a8'), pillar: L('#8a7f78'), wall: L('#e2dccd'), roof: track(new THREE.MeshLambertMaterial({color: '#7d868c', flatShading: true})), gold: L('#b8ae96')}; } // not yet visited: unpainted ink sketch (greyed)
  const pickables = [], markers = {};
  let n = 0;
  Object.entries(region.cafes).forEach(([id, [sx, sy, side]]) => {
    n++; const c = cafeById(id); if (!c) return;
    const done = visited.has(id), [x, z] = W(sx, sy), g = new THREE.Group(); g.position.set(x, 0, z); g.userData.id = id;
    const ring = new THREE.Mesh(ringGeo, done ? M.ringOn : M.ringOff); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006; g.add(ring);
    if (XU && xuPaint) { // 🏯 painted building billboard (always faces the camera, like a hand-painted 2.5D RPG); unvisited = ink-grey
      const bld = new THREE.Group(); g.add(bld); bld.userData.y0 = 0; ring.visible = false;
      const bt = new THREE.CanvasTexture(window.Xuan.pavilion(id, done, false, 4)); bt.colorSpace = THREE.SRGBColorSpace; track(bt);
      const sp = new THREE.Sprite(track(new THREE.SpriteMaterial({map: bt, transparent: true, alphaTest: .05}))); sp.center.set(.5, .06); sp.scale.set(1.7, 1.7, 1); sp.userData.id = id; bld.add(sp); pickables.push(sp);
      const sh = new THREE.Mesh(discGeo, track(new THREE.MeshBasicMaterial({color: '#2a1c0e', transparent: true, opacity: .28, depthWrite: false}))); sh.rotation.x = -Math.PI / 2; sh.scale.set(2.1, 1.2, 1); sh.position.y = 0.012; g.add(sh);
      if (done) { const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({map: glowTex, depthWrite: false, transparent: true, opacity: .55}))); glow.scale.set(1.9, 1.5, 1); glow.position.y = 0.55; g.add(glow); }
      const lab = document.createElement('div'); lab.className = `m3d-mk ${done ? 'done' : 'locked'} side-${side === 'l' ? 'l' : 'r'} xu xu2`; lab.dataset.id = id;
      lab.innerHTML = `<span class="m3d-no">${n}</span><span class="m3d-name">${String(c.mapLabel || c.short || c.name).replace(/\n/g, ' ').replace(/[&<>"']/g, ch => '&#' + ch.charCodeAt(0) + ';')}</span>`;
      lab.addEventListener('click', ev => { ev.stopPropagation(); onOpen(id); });
      const lo = new CSS2DObject(lab); lo.position.y = -0.02; g.add(lo); scene.add(g); markers[id] = {g, cup: bld, lab}; return; }
    if (XU) { // 🏯 tiled-roof pavilion with red pillars + lanterns; not yet visited = pale ink ghost
      const bld = new THREE.Group(); g.add(bld); bld.scale.setScalar(1.55); const ry = ((Math.abs(hash(id)) >> 4) % 4) * 0.15;
      const mats = done ? M.xu : M.xuG;
      const plinth = new THREE.Mesh(xuPl, mats.stone); plinth.position.y = 0.04; bld.add(plinth);
      [[-.24, -.18], [.24, -.18], [-.24, .18], [.24, .18]].forEach(([px, pz]) => { const pi = new THREE.Mesh(xuPi, mats.pillar); pi.position.set(px, 0.3, pz); bld.add(pi); });
      const body = new THREE.Mesh(xuBody, mats.wall); body.position.y = 0.3; body.userData.id = id; bld.add(body); pickables.push(body);
      const r1 = new THREE.Mesh(xuRoof, mats.roof); r1.position.y = 0.66; r1.rotation.y = Math.PI / 4; r1.scale.set(1, 1, 1); bld.add(r1);
      const b2 = new THREE.Mesh(xuBody, mats.wall); b2.scale.set(.6, .5, .6); b2.position.y = 0.86; bld.add(b2);
      const r2 = new THREE.Mesh(xuRoof, mats.roof); r2.position.y = 1.08; r2.rotation.y = Math.PI / 4; r2.scale.set(.66, .9, .66); bld.add(r2);
      const fin = new THREE.Mesh(xuFin, mats.gold); fin.position.y = 1.3; bld.add(fin);
      bld.rotation.y = ry; bld.userData.y0 = 0;
      if (done) { [[-.34, .26], [.34, .26]].forEach(([lx, lz]) => { const l = new THREE.Mesh(xuLan, M.xu.lantern); l.position.set(lx, 0.5, lz); bld.add(l); });
        const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({map: glowTex, depthWrite: false, transparent: true, opacity: .6}))); glow.scale.set(1.4, 1.4, 1); glow.position.y = 0.55; g.add(glow); }
      const lab = document.createElement('div'); lab.className = `m3d-mk ${done ? 'done' : 'locked'} side-${side === 'l' ? 'l' : 'r'} xu`; lab.dataset.id = id;
      lab.innerHTML = `<span class="m3d-no">${n}</span><span class="m3d-name">${String(c.mapLabel || c.short || c.name).split('\n').map(esc).join('<br>')}</span>`;
      lab.addEventListener('click', ev => { ev.stopPropagation(); onOpen(id); });
      const lo = new CSS2DObject(lab); lo.position.y = 1.95; g.add(lo); scene.add(g); markers[id] = {g, cup: bld, lab}; return; }
    if (FDN) { // 🏠 a little medieval cafe house; not yet visited = translucent blueprint (placement ghost)
      const hs = Math.abs(hash(id)), bld = new THREE.Group(); bld.userData.y0 = 0; g.add(bld); bld.scale.setScalar(1.45); const ry = ((hs >> 4) % 8) * 0.2;
      const wallM = done ? M.fWall[hs % M.fWall.length] : M.ghost, roofM = done ? M.fRoof[(hs >> 3) % M.fRoof.length] : M.ghostR;
      const body = new THREE.Mesh(fdBody, wallM); body.position.y = 0.26; body.rotation.y = ry; body.userData.id = id; bld.add(body); pickables.push(body);
      const roof = new THREE.Mesh(fdRoof, roofM); roof.position.y = 0.6; roof.rotation.y = ry; bld.add(roof);
      if (done) { const chim = new THREE.Mesh(fdChim, M.fChim); chim.position.set(Math.cos(ry) * 0.18, 0.72, -Math.sin(ry) * 0.18); bld.add(chim);
        const sign = new THREE.Mesh(fdSign, M.fSign); sign.position.set(0, 0.5, 0.31); sign.rotation.y = ry; bld.add(sign);
        const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({map: glowTex, depthWrite: false, transparent: true, opacity: .55}))); glow.scale.set(1.3, 1.3, 1); glow.position.y = 0.5; g.add(glow); }
      else { const e = new THREE.LineSegments(fdBodyEdge, M.ghostE); e.position.y = 0.26; e.rotation.y = ry; e.computeLineDistances(); bld.add(e); }
      const lab = document.createElement('div'); lab.className = `m3d-mk ${done ? 'done' : 'locked'} side-${side === 'l' ? 'l' : 'r'} fd`; lab.dataset.id = id;
      lab.innerHTML = `<span class="m3d-no">${n}</span><span class="m3d-name">${String(c.mapLabel || c.short || c.name).split('\n').map(esc).join('<br>')}</span>`;
      lab.addEventListener('click', ev => { ev.stopPropagation(); onOpen(id); });
      const lo = new CSS2DObject(lab); lo.position.y = 1.45; g.add(lo); scene.add(g); markers[id] = {g, cup: bld, lab}; return; }
    const pillar = new THREE.Mesh(pillarGeo, M.pillar); pillar.position.y = 0.4; g.add(pillar);
    const cup = new THREE.Group(); cup.position.y = 1.0; g.add(cup);
    const body = new THREE.Mesh(cupGeo, done ? M.cupOn : M.cupOff); body.userData.id = id; if (VL) { body.castShadow = true; body.receiveShadow = true; } cup.add(body); pickables.push(body);
    const e = new THREE.LineSegments(cupEdge, done ? M.edgeOn : M.edgeOff); if (!done) e.computeLineDistances(); cup.add(e);
    const handle = new THREE.Mesh(handleGeo, done ? M.cupOn : M.cupOff); handle.position.set(0.28, 0, 0); handle.rotation.z = -Math.PI / 2; cup.add(handle);
    const top = new THREE.Mesh(discGeo, done ? M.coffee : M.foam); top.rotation.x = -Math.PI / 2; top.position.y = 0.201; cup.add(top);
    if (done) { const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({map: glowTex, depthWrite: false, transparent: true}))); glow.scale.set(1.5, 1.5, 1); glow.position.y = 1.0; g.add(glow); }
    const lab = document.createElement('div');
    lab.className = `m3d-mk ${done ? 'done' : 'locked'} side-${side === 'l' ? 'l' : 'r'}`; lab.dataset.id = id;
    const name = String(c.mapLabel || c.short || c.name).split('\n').map(esc).join('<br>');
    lab.innerHTML = `<span class="m3d-no">${n}</span><span class="m3d-name">${name}</span>`;
    lab.addEventListener('click', ev => { ev.stopPropagation(); onOpen(id); });
    const lo = new CSS2DObject(lab); lo.position.y = 1.75; g.add(lo);
    scene.add(g); markers[id] = {g, cup, lab};
  });

  // player avatar
  let avatarIn = false;
  if (me && fitAffine) {
    const f = fitAffine(region, cafeById);
    if (f) {
      const [mx, my] = f(me[1], me[0]), [nx2, ny2] = f(me[1], me[0] + rangeM / 111320);
      if (mx > vx - 20 && mx < vx + vw + 20 && my > vy - 20 && my < vy + vh + 20) {
        avatarIn = true; const [ax, az] = W(mx, my), rad = Math.min(1.6, Math.max(0.3, Math.hypot(nx2 - mx, ny2 - my) * S));
        const av = new THREE.Group(); av.position.set(ax, 0, az);
        const rg = new THREE.Mesh(track(new THREE.CircleGeometry(rad, 40)), track(new THREE.MeshBasicMaterial({color: SLATE, transparent: true, opacity: .22, depthWrite: false}))); rg.rotation.x = -Math.PI / 2; rg.position.y = 0.01; av.add(rg);
        const rl = new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(Array.from({length: 48}, (_, i) => new THREE.Vector3(Math.cos(i / 48 * Math.PI * 2) * rad, 0.015, Math.sin(i / 48 * Math.PI * 2) * rad)))), track(new THREE.LineDashedMaterial({color: SLATE_D, dashSize: .08, gapSize: .06}))); rl.computeLineDistances(); av.add(rl);
        const bodyM = track(new THREE.MeshToonMaterial({color: '#3aa0ff', gradientMap: ramp}));
        const torso = new THREE.Mesh(track(new THREE.ConeGeometry(0.16, 0.42, 10)), bodyM); torso.position.y = 0.21; av.add(torso);
        const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.12, 12, 8)), track(new THREE.MeshToonMaterial({color: '#ffe0c2', gradientMap: ramp}))); head.position.y = 0.52; av.add(head);
        const ad = document.createElement('div'); ad.className = 'm3d-me'; ad.textContent = '我'; const ao = new CSS2DObject(ad); ao.position.y = 0.9; av.add(ao);
        scene.add(av);
      }
    }
  }

  // camera + controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = false;
  controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.18; controls.rotateSpeed = 0.7;
  controls.touches = {ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN};
  const home = FDN ? {polar: 0.6, az: -0.32} : XU ? {polar: 0.84, az: -0.08} : VL ? {polar: 0.92, az: -0.28} : {polar: 0.66, az: -0.13};
  let fitR = 16;
  // frame the cafes (not the whole sheet) so clustered regions like Brunswick aren't squeezed to one side
  const cps = Object.values(region.cafes), m = 150;
  const XL = XU ? 90 : 0, fx0 = Math.min(...cps.map(c => c[0] - (XL || (c[2] === 'l' ? 280 : 70)))), fx1 = Math.max(...cps.map(c => c[0] + (XL || (c[2] === 'l' ? 70 : 280))));
  const fy0 = Math.max(vy, Math.min(...cps.map(c => c[1])) - m), fy1 = Math.min(vy + vh, Math.max(...cps.map(c => c[1])) + m);
  const [fcx, fcz] = W((fx0 + fx1) / 2, (fy0 + fy1) / 2), FW = (fx1 - fx0) * S, FH = (fy1 - fy0) * S;
  const fit = () => {
    const a = camera.aspect, vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * a);
    const needW = (FW / 2 + 0.4) / Math.tan(hf / 2), needH = (FH / 2 * Math.cos(home.polar) + 1.2) / Math.tan(vf / 2);
    fitR = Math.max(needW * 1.04, needH, 6) * (FDN ? 0.9 : XU ? 0.85 : 1); controls.minDistance = fitR * 0.3; controls.maxDistance = fitR * 1.5;
  };
  const homePose = () => { const sph = new THREE.Spherical(fitR, home.polar, home.az); const target = new THREE.Vector3(fcx, 0, fcz + (FDN ? 1.2 : XU ? -0.5 : 0.3)); return {pos: new THREE.Vector3().setFromSpherical(sph).add(target), target}; };

  let raf = null, alive = true, interacting = false, frames = 0;
  const anims = [];
  const slowT = []; let slowTold = false;
  const onVis = () => { if (!document.hidden && alive) kick(); };
  const draw = () => { frames++; const t0 = performance.now(); renderer.render(scene, camera); labels.render(scene, camera);
    if (opt.onSlow && !slowTold && frames > 2 && slowT.length < 12) { slowT.push(performance.now() - t0); if (slowT.length === 12) { const md = slowT.slice().sort((a, b) => a - b)[6]; if (md > 60 || window.__force3dSlow) { slowTold = true; setTimeout(() => alive && opt.onSlow(), 0); } } } };
  const tick = (now) => {
    raf = null; if (!alive) return;
    if (document.hidden) return;
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i](now) === false) anims.splice(i, 1);
    const changed = controls.update();
    const t = controls.target, lim = 1.25; // keep panning on the map
    t.x = Math.max(-vw * S / 2 * lim, Math.min(vw * S / 2 * lim, t.x)); t.z = Math.max(-vh * S / 2 * lim, Math.min(vh * S / 2 * lim, t.z)); t.y = 0;
    draw();
    if ((interacting || changed || anims.length) && !raf) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && alive) raf = requestAnimationFrame(tick); };
  controls.addEventListener('change', kick);
  controls.addEventListener('start', () => { interacting = true; kick(); });
  controls.addEventListener('end', () => { interacting = false; kick(); });
  document.addEventListener('visibilitychange', onVis);
  if (VL && valleyMood) {
    const Md = valleyMood, windK = Md.wind ? 1.85 : 1;
    const skyTex = track(canvasTex(8, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      Md.sky.forEach((c, i) => gr.addColorStop(Md.sky.length === 1 ? 0 : i / (Md.sky.length - 1), c));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }));
    const sky = new THREE.Mesh(track(new THREE.PlaneGeometry(GW * 2.6, GD * 1.15)), track(new THREE.MeshBasicMaterial({map: skyTex, fog: false, depthWrite: false})));
    sky.position.set(0, GD * 0.18, -GD * 0.55 - 1.3); sky.renderOrder = -1; scene.add(sky);
    const water = new THREE.Mesh(track(new THREE.PlaneGeometry(GW * 1.08, 0.72)), track(new THREE.MeshBasicMaterial({color: Md.water, transparent: true, opacity: 0.88})));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0.012, GD / 2 + 0.2); scene.add(water);

    const skyB = new Batch(1), RM = rng(hash(region.id) ^ 0xe1a);
    skyB.box(0.18, 2.7, 0.18, -GW * 0.22, 1.35, -GD * 0.5, 0, '#7f9cb4', {edges: false});
    skyB.box(0.3, 0.16, 0.3, -GW * 0.22, 2.74, -GD * 0.5, 0, '#e6c56a', {edges: false});
    const dome = new THREE.SphereGeometry(0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    skyB.geo(dome, GW * 0.08, 0.4, -GD * 0.52, 0, '#e8d7a4', 1.15, 0.72, 1); dome.dispose();
    skyB.box(1.2, 0.38, 0.36, GW * 0.08, 0.19, -GD * 0.52, 0, '#d9c49a', {edges: false});
    for (let i = 0; i < 5; i++) { const hgt = 0.32 + RM() * 0.85; skyB.box(0.2 + RM() * 0.16, hgt, 0.18, -GW * 0.42 + i * 0.28, hgt / 2, -GD * 0.5, 0, ['#8a7058', '#6e8494', '#a08068', '#5c6a78', '#7d6858'][i], {edges: false}); }
    const skyline = skyB.build(track(new THREE.MeshBasicMaterial({vertexColors: true})), PENCIL); scene.add(skyline);

    const wheel = new THREE.Group();
    wheel.add(new THREE.Mesh(track(new THREE.TorusGeometry(1.05, 0.045, 6, 28)), track(new THREE.MeshBasicMaterial({color: '#d5dee6'}))));
    const spokeGeo = track(new THREE.BoxGeometry(0.035, 2.05, 0.035)), spokeMat = track(new THREE.MeshBasicMaterial({color: '#c5ced8'}));
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(spokeGeo, spokeMat); sp.rotation.z = i / 6 * Math.PI; wheel.add(sp); }
    const cabGeo = track(new THREE.BoxGeometry(0.1, 0.07, 0.05)), cabMat = track(new THREE.MeshBasicMaterial({color: '#f4efe4'}));
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2, cab = new THREE.Mesh(cabGeo, cabMat); cab.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0); wheel.add(cab); }
    const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 8)), track(new THREE.MeshBasicMaterial({color: '#e6c56a'}))); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    const stand = new THREE.Mesh(track(new THREE.BoxGeometry(0.07, 0.85, 0.07)), track(new THREE.MeshBasicMaterial({color: '#8a939c'}))); stand.position.y = -0.7; wheel.add(stand);
    wheel.position.set(GW * 0.34, 1.55, -GD * 0.5); scene.add(wheel);

    let tram = null; const tramPath = [];
    let best = null, bestL = 0;
    region.streets.forEach(st => { let L = 0; for (let i = 1; i < st.pts.length; i++) L += Math.hypot(st.pts[i][0] - st.pts[i - 1][0], st.pts[i][1] - st.pts[i - 1][1]); if (L * (st.w || 10) > bestL) { bestL = L * (st.w || 10); best = st; } });
    if (best && best.pts.length > 1) {
      const pts = best.pts;
      for (let i = 1; i < pts.length; i++) {
        const [x0, z0] = W(...pts[i - 1]), [x1, z1] = W(...pts[i]), seg = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(seg / 0.45));
        for (let k = 0; k < n; k++) { const t = k / n; tramPath.push(new THREE.Vector3(x0 + (x1 - x0) * t, 0.16, z0 + (z1 - z0) * t)); }
      }
      const [ex, ez] = W(...pts[pts.length - 1]); tramPath.push(new THREE.Vector3(ex, 0.16, ez));
      scene.add(new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(tramPath.map(p => new THREE.Vector3(p.x, 1.02, p.z)))), track(new THREE.LineBasicMaterial({color: 0x3a4048}))));
      const poles = new Batch(1);
      for (let i = 0; i < tramPath.length; i += Math.max(1, Math.ceil(tramPath.length / 5))) poles.box(0.03, 1.02, 0.03, tramPath[i].x, 0.51, tramPath[i].z, 0, '#4a4038', {edges: false});
      scene.add(poles.build(track(new THREE.MeshBasicMaterial({vertexColors: true})), PENCIL));
      tram = new THREE.Group();
      const body = new THREE.Mesh(track(new THREE.BoxGeometry(0.68, 0.2, 0.26)), track(new THREE.MeshLambertMaterial({color: '#d6c25a'}))); body.position.y = 0.14;
      const stripe = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 0.05, 0.28)), track(new THREE.MeshLambertMaterial({color: '#3f6b45'}))); stripe.position.y = 0.18;
      const roof = new THREE.Mesh(track(new THREE.BoxGeometry(0.6, 0.05, 0.22)), track(new THREE.MeshLambertMaterial({color: '#f4efe0'}))); roof.position.y = 0.28;
      tram.add(body, stripe, roof); scene.add(tram);
    }
    let rain = null;
    if (Md.rain) {
      const N = 42, pos = new Float32Array(N * 3), base = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { base[i * 3] = (Math.random() - .5) * GW; base[i * 3 + 1] = Math.random() * 2.4; base[i * 3 + 2] = (Math.random() - .5) * GD; }
      pos.set(base);
      const rg = track(new THREE.BufferGeometry()); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      rain = new THREE.Points(rg, track(new THREE.PointsMaterial({color: 0xd5e4ee, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false})));
      rain.userData.base = base; scene.add(rain);
    }
    const ids = Object.keys(markers);
    if (ids.length && THREE.InstancedMesh) {
      const inst = new THREE.InstancedMesh(track(new THREE.BoxGeometry(0.52, 0.028, 0.2)), track(new THREE.MeshLambertMaterial({color: '#ffffff'})), ids.length);
      const dummy = new THREE.Object3D();
      ids.forEach((id, i) => {
        const p = markers[id].g.position; dummy.position.set(p.x, 0.7, p.z); dummy.rotation.y = (hash(id) % 7) * 0.15; dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
        if (inst.setColorAt) inst.setColorAt(i, new THREE.Color(i % 2 ? '#6a9a48' : '#e07a68'));
      });
      inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; scene.add(inst);
    }

    const leafTex = track(canvasTex(32, 32, (g) => {
      g.clearRect(0, 0, 32, 32);
      g.fillStyle = '#7dae3e'; g.beginPath(); g.ellipse(14, 18, 6, 11, -0.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d2b15a'; g.beginPath(); g.ellipse(22, 11, 4, 7, 0.7, 0, Math.PI * 2); g.fill();
    }));
    const steamTex = track(canvasTex(32, 32, (g) => {
      const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      gr.addColorStop(0, 'rgba(255,252,245,.8)'); gr.addColorStop(1, 'rgba(255,252,245,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    }));
    const RL = rng(hash(region.id) ^ 0x51eaf), leaves = [], steams = [];
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(track(new THREE.SpriteMaterial({map: leafTex, transparent: true, depthWrite: false, opacity: .88})));
      const base = new THREE.Vector3((RL() - .5) * GW * .9, .35 + RL() * 2.4, (RL() - .5) * GD * .9);
      s.position.copy(base); s.scale.setScalar(.1 + RL() * .1); s.userData.base = base; s.userData.ph = RL() * Math.PI * 2; s.userData.sp = .4 + RL() * .5;
      scene.add(s); leaves.push(s);
    }
    Object.entries(markers).forEach(([id, mk]) => {
      if (!visited.has(id) || steams.length >= 6) return;
      const mat = track(new THREE.SpriteMaterial({map: steamTex, transparent: true, depthWrite: false, opacity: .45}));
      const s = new THREE.Sprite(mat); s.position.set(0, 1.3, 0); s.scale.setScalar(.32); s.userData.ph = RL(); mk.g.add(s); steams.push(s);
    });
    anims.push(now => {
      if (document.hidden) return true;
      const t = now * 0.001;
      wheel.rotation.z = t * 0.22;
      leaves.forEach(s => {
        const b = s.userData.base, sp = s.userData.sp * windK, ph = s.userData.ph, fall = (t * sp * .12 + ph) % 1.8;
        s.position.x = b.x + Math.sin(t * sp + ph) * .4;
        s.position.z = b.z + Math.cos(t * sp * .8 + ph) * .22;
        s.position.y = Math.max(0.15, b.y + 1.1 - fall);
      });
      steams.forEach(s => {
        const k = (t * .32 + s.userData.ph) % 1;
        s.position.y = 1.2 + k * .6; s.material.opacity = .5 * (1 - k); s.scale.setScalar(.26 + k * .4);
      });
      if (tram && tramPath.length > 1) {
        const f = (t * 0.12 * windK % 1) * (tramPath.length - 1), i = Math.floor(f), k = f - i;
        const a = tramPath[i], b = tramPath[Math.min(tramPath.length - 1, i + 1)];
        tram.position.lerpVectors(a, b, k); tram.lookAt(b.x, a.y, b.z);
      }
      if (rain) {
        const arr = rain.geometry.attributes.position.array, base = rain.userData.base;
        for (let i = 0; i < base.length; i += 3) {
          arr[i] = base[i] + Math.sin(t + i) * 0.04;
          arr[i + 1] = ((base[i + 1] - t * 1.5) % 2.4 + 2.4) % 2.4;
          arr[i + 2] = base[i + 2];
        }
        rain.geometry.attributes.position.needsUpdate = true;
      }
      return true;
    });
  }

  const resize = () => {
    const w = el.clientWidth || 360, h = el.clientHeight || 420;
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    labels.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); fit(); kick();
  };
  resize();
  { const hp = homePose(); camera.position.copy(hp.pos); controls.target.copy(hp.target); controls.update(); }
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(el); else window.addEventListener('resize', resize);

  // tap a cup -> open cafe
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  const onDown = e => { down = {x: e.clientX, y: e.clientY, t: Date.now()}; };
  const onUp = e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || Date.now() - down.t > 600) { down = null; return; }
    down = null; const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0]; if (hit) onOpen(hit.object.userData.id);
  };
  renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp);

  // celebratory pop for newly unlocked cafes
  const ease = t => 1 - Math.pow(1 - t, 3);
  let delay = 350;
  pop.forEach(id => {
    const m = markers[id]; if (!m) return; const t0 = performance.now() + delay; delay += VL ? 340 : 260;
    m.cup.scale.setScalar(0.01); m.lab.classList.add('pop');
    const ringM = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({color: PINK, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false}))); ringM.rotation.x = -Math.PI / 2; ringM.position.y = 0.02; m.g.add(ringM);
    anims.push(now => {
      const t = (now - t0) / (VL ? 1200 : 900); if (t < 0) return true;
      const k = Math.min(1, t), s = k < 0.6 ? ease(k / 0.6) * 1.35 : 1.35 - 0.35 * ease((k - 0.6) / 0.4);
      m.cup.scale.setScalar(Math.max(0.01, s)); const y0 = m.cup.userData.y0 != null ? m.cup.userData.y0 : 1.0; m.cup.position.y = y0 + Math.sin(Math.min(1, k) * Math.PI) * 0.45;
      ringM.scale.setScalar(1 + k * 5); ringM.material.opacity = 0.8 * (1 - k);
      if (k >= 1) { m.g.remove(ringM); m.cup.scale.setScalar(1); m.cup.position.y = m.cup.userData.y0 != null ? m.cup.userData.y0 : 1.0; return false; }
      return true;
    });
  });

  const lost = e => { e.preventDefault(); if (alive && opt.onLost) opt.onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);

  const tween = (to, ms = 450) => {
    const fp = camera.position.clone(), ft = controls.target.clone(), t0 = performance.now();
    anims.push(now => { const k = Math.min(1, (now - t0) / ms), e = ease(k); camera.position.lerpVectors(fp, to.pos, e); controls.target.lerpVectors(ft, to.target, e); return k < 1; }); kick();
  };
  if (VL) {
    const hp = homePose();
    const far = hp.pos.clone().sub(hp.target).multiplyScalar(1.16).add(hp.target);
    far.y += 0.9; camera.position.copy(far); controls.update(); tween(hp, 1100);
  }
  if (VL && valleyMood) el.dataset.sky = valleyMood.phase + '-' + valleyMood.wx;
  draw();
  if (opt.onSlow) for (let i = 0; i < 14 && !slowTold; i++) draw(); // quick CPU-side probe: very slow devices fall back to 2D
  el.dataset.ready = '1';
  const api = {
    kind: '3d', style: VL ? 'valley' : FDN ? 'foundation' : XU ? 'xuan' : J ? 'jrpg' : 'sketch', avatarIn, markerCount: Object.keys(markers).length,
    renderMs() { return slowT.slice(); },
    get frames() { return frames; },
    view() { return {az: controls.getAzimuthalAngle(), polar: controls.getPolarAngle(), dist: camera.position.distanceTo(controls.target)}; },
    reset() { tween(homePose()); },
    zoom(f) { const off = camera.position.clone().sub(controls.target), d = THREE.MathUtils.clamp(off.length() * f, controls.minDistance, controls.maxDistance); tween({pos: controls.target.clone().add(off.setLength(d)), target: controls.target.clone()}, 250); },
    screenOf(id) { const m = markers[id]; if (!m) return null; const v = new THREE.Vector3(); m.cup.getWorldPosition(v); v.project(camera); const r = renderer.domElement.getBoundingClientRect(); return {x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height}; },
    remove() {
      alive = false; document.removeEventListener('visibilitychange', onVis); renderer.domElement.removeEventListener("webglcontextlost", lost); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
      disposables.forEach(d => d.dispose && d.dispose());
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      renderer.domElement.remove(); labels.domElement.remove();
    },
  };
  return api;
}
