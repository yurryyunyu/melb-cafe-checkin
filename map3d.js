// 🧊 3D sketch diorama of a region map (three.js, lazy-loaded ES module). Same layout/numbering as the 2D SVG maps.
import * as THREE from './vendor/three/three.module.min.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {CSS2DRenderer, CSS2DObject} from './vendor/three/CSS2DRenderer.js';

const PENCIL = '#4a4a4a', SLATE = '#9fb3c4', SLATE_D = '#6f879c', PINK = '#ef6f8f', PINK_D = '#c94a6b', PAPER = '#f7f4ec';
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
  constructor(uvK) { this.pos = []; this.nor = []; this.col = []; this.uv = []; this.edges = []; this.edges2 = []; this.k = uvK; }
  box(w, h, d, x, y, z, ry, color, {edges = true, jitter = 0.018, seed = 1} = {}) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m); const p = g.attributes.position, n = g.attributes.normal, c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); this.pos.push(X, Y, Z); this.nor.push(n.getX(i), n.getY(i), n.getZ(i)); this.col.push(c.r, c.g, c.b); this.uv.push((X + Z) * this.k, Y * this.k); }
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
  await Promise.race([Promise.all(['700 40px "Josefin Sans"', '700 40px "Caveat"'].map(f => document.fonts.load(f).catch(() => {}))), new Promise(r => setTimeout(r, 1200))]);
}
function streetLabelTex(text, fsPx) {
  const font = `700 ${fsPx}px "Josefin Sans", "Avenir Next", Helvetica, sans-serif`, sp = fsPx * 0.3;
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
  await fontsReady();
  const [vx, vy, vw, vh] = region.vb, cx = vx + vw / 2, cy = vy + vh / 2;
  const W = (x, y) => [(x - cx) * S, (y - cy) * S];
  const disposables = [];
  const track = o => { disposables.push(o); return o; };

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.className = 'm3d-canvas';
  const labels = new CSS2DRenderer(); labels.domElement.className = 'm3d-labels';
  el.appendChild(renderer.domElement); el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c0, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(-4, 9, 5); scene.add(sun);
  const ramp = track(toonRamp());

  // paper ground + inked border
  const GW = vw * S + 1.2, GD = vh * S + 1.2, pt = track(paperTex()); pt.repeat.set(GW / 4, GD / 4);
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(GW, GD)), track(new THREE.MeshBasicMaterial({map: pt})));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const bpts = [[-GW / 2, -GD / 2], [GW / 2, -GD / 2], [GW / 2, GD / 2], [-GW / 2, GD / 2], [-GW / 2, -GD / 2]];
  [0, 0.03].forEach((j, i) => { const g = track(new THREE.BufferGeometry().setFromPoints(bpts.map(([x, z]) => new THREE.Vector3(x + j, 0.004, z - j)))); scene.add(new THREE.Line(g, track(new THREE.LineBasicMaterial({color: PENCIL, transparent: true, opacity: i ? .4 : .9})))); });
  // soft "slab" under the paper so the diorama has thickness
  const base = new THREE.Mesh(track(new THREE.BoxGeometry(GW, 0.25, GD)), track(new THREE.MeshToonMaterial({color: '#e9e2d0', gradientMap: ramp})));
  base.position.y = -0.126; scene.add(base);
  const be = new THREE.LineSegments(track(new THREE.EdgesGeometry(base.geometry)), track(new THREE.LineBasicMaterial({color: PENCIL}))); be.position.copy(base.position); scene.add(be);

  // streets: raised slate slabs on a pencil casing
  const sb = new Batch(1.6);
  region.streets.forEach((st, si) => {
    const ws = st.w * S, h = 0.08 + st.w * 0.0022 + si * 0.0015;
    for (let i = 1; i < st.pts.length; i++) {
      const [x0, z0] = W(...st.pts[i - 1]), [x1, z1] = W(...st.pts[i]), L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0);
      sb.box(L + ws + 0.07, h - 0.02, ws + 0.07, (x0 + x1) / 2, (h - 0.02) / 2, (z0 + z1) / 2, ry, PENCIL, {edges: false});
      sb.box(L + ws, h, ws, (x0 + x1) / 2, h / 2 + 0.002, (z0 + z1) / 2, ry, SLATE, {seed: si * 7 + i});
    }
    if (st.label) {
      const fs = st.w * 0.6 * S, {tex, aspect} = streetLabelTex(st.label, 64); track(tex);
      const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(fs * 1.5 * aspect, fs * 1.5)), track(new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2})));
      plane.rotation.x = -Math.PI / 2;
      const g = new THREE.Group(); const [lx, lz] = W(...st.at); g.position.set(lx, h + 0.012, lz); g.rotation.y = st.v ? Math.PI / 2 : 0; g.add(plane); scene.add(g);
    }
  });
  scene.add(sb.build(track(new THREE.MeshToonMaterial({vertexColors: true, gradientMap: ramp, map: track(stripeTex(.33, 9))})), PENCIL));

  // low-poly blocks between streets (seeded per region, avoid streets / markers / pill)
  const R = rng(hash(region.id)), bb = new Batch(1.9), pts = Object.values(region.cafes), pl = region.pill;
  const tones = ['#fffdf8', '#fffdf8', '#fffdf8', '#f3efe4', '#e6edf2', '#fbe3ea'];
  for (let y = vy + 30; y < vy + vh - 20; y += 56) for (let x = vx + 30; x < vx + vw - 20; x += 56) {
    const jx = x + (R() - .5) * 12, jy = y + (R() - .5) * 12, sz = 30 + R() * 16, sz2 = 30 + R() * 16;
    if (R() < 0.22) continue;
    if (region.streets.some(st => st.pts.slice(1).some((p, i) => segDist(jx, jy, st.pts[i], p) < st.w / 2 + Math.max(sz, sz2) * 0.72 + 6))) continue;
    if (pts.some(([px, py]) => Math.hypot(px - jx, py - jy) < 52)) continue;
    if (pl && Math.abs(jx - pl.x) < pl.w / 2 + 24 && Math.abs(jy - pl.y) < pl.h / 2 + 24) continue;
    const hgt = 0.18 + Math.pow(R(), 2.2) * 1.1, [wx, wz] = W(jx, jy);
    bb.box(sz * S, hgt, sz2 * S, wx, hgt / 2, wz, (R() - .5) * 0.12, tones[(R() * tones.length) | 0], {seed: (x * 31 + y) | 0});
    if (R() < 0.18) bb.box(sz * S * 0.45, 0.12, sz2 * S * 0.45, wx, hgt + 0.06, wz, 0, '#f3efe4', {seed: (x + y * 17) | 0}); // little roof box
  }
  scene.add(bb.build(track(new THREE.MeshToonMaterial({vertexColors: true, gradientMap: ramp, map: track(stripeTex(.16, 8))})), PENCIL));

  // floating region pill
  if (pl) {
    const d = document.createElement('div'); d.className = 'm3d-pill'; d.textContent = region.name;
    const o = new CSS2DObject(d); const [px, pz] = W(pl.x, pl.y); o.position.set(px, 0.06, pz); scene.add(o);
  }

  // cafe markers: pink coffee-cup pins on a pencil pillar
  const cupGeo = track(new THREE.CylinderGeometry(0.3, 0.21, 0.4, 14)), cupEdge = track(new THREE.EdgesGeometry(cupGeo, 30));
  const handleGeo = track(new THREE.TorusGeometry(0.11, 0.035, 6, 12, Math.PI)), pillarGeo = track(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6));
  const discGeo = track(new THREE.CircleGeometry(0.265, 16)), ringGeo = track(new THREE.RingGeometry(0.22, 0.32, 24));
  const M = {
    cupOn: track(new THREE.MeshToonMaterial({color: PINK, gradientMap: ramp})), cupOff: track(new THREE.MeshToonMaterial({color: '#fffaf6', gradientMap: ramp, transparent: true, opacity: .9})),
    coffee: track(new THREE.MeshBasicMaterial({color: '#7a4a32'})), foam: track(new THREE.MeshBasicMaterial({color: '#fbd6df'})),
    pillar: track(new THREE.MeshBasicMaterial({color: PENCIL})), edgeOn: track(new THREE.LineBasicMaterial({color: PINK_D})),
    edgeOff: track(new THREE.LineDashedMaterial({color: PINK_D, dashSize: 0.04, gapSize: 0.03})),
    ringOn: track(new THREE.MeshBasicMaterial({color: PINK, transparent: true, opacity: .55, side: THREE.DoubleSide})), ringOff: track(new THREE.MeshBasicMaterial({color: PINK_D, transparent: true, opacity: .25, side: THREE.DoubleSide})),
  };
  const glowTex = track(canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,170,195,.95)'); gr.addColorStop(1, 'rgba(255,170,195,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const pickables = [], markers = {};
  let n = 0;
  Object.entries(region.cafes).forEach(([id, [sx, sy, side]]) => {
    n++; const c = cafeById(id); if (!c) return;
    const done = visited.has(id), [x, z] = W(sx, sy), g = new THREE.Group(); g.position.set(x, 0, z); g.userData.id = id;
    const ring = new THREE.Mesh(ringGeo, done ? M.ringOn : M.ringOff); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006; g.add(ring);
    const pillar = new THREE.Mesh(pillarGeo, M.pillar); pillar.position.y = 0.4; g.add(pillar);
    const cup = new THREE.Group(); cup.position.y = 1.0; g.add(cup);
    const body = new THREE.Mesh(cupGeo, done ? M.cupOn : M.cupOff); body.userData.id = id; cup.add(body); pickables.push(body);
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
  const home = {polar: 0.66, az: -0.13};
  let fitR = 16;
  // frame the cafes (not the whole sheet) so clustered regions like Brunswick aren't squeezed to one side
  const cps = Object.values(region.cafes), m = 150;
  const fx0 = Math.min(...cps.map(c => c[0] - (c[2] === 'l' ? 280 : 70))), fx1 = Math.max(...cps.map(c => c[0] + (c[2] === 'l' ? 70 : 280)));
  const fy0 = Math.max(vy, Math.min(...cps.map(c => c[1])) - m), fy1 = Math.min(vy + vh, Math.max(...cps.map(c => c[1])) + m);
  const [fcx, fcz] = W((fx0 + fx1) / 2, (fy0 + fy1) / 2), FW = (fx1 - fx0) * S, FH = (fy1 - fy0) * S;
  const fit = () => {
    const a = camera.aspect, vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * a);
    const needW = (FW / 2 + 0.4) / Math.tan(hf / 2), needH = (FH / 2 * Math.cos(home.polar) + 1.2) / Math.tan(vf / 2);
    fitR = Math.max(needW * 1.04, needH, 6); controls.minDistance = fitR * 0.3; controls.maxDistance = fitR * 1.5;
  };
  const homePose = () => { const sph = new THREE.Spherical(fitR, home.polar, home.az); const target = new THREE.Vector3(fcx, 0, fcz + 0.3); return {pos: new THREE.Vector3().setFromSpherical(sph).add(target), target}; };

  let raf = null, alive = true, interacting = false, frames = 0;
  const anims = [];
  const draw = () => { frames++; renderer.render(scene, camera); labels.render(scene, camera); };
  const tick = (now) => {
    raf = null; if (!alive) return;
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
    const m = markers[id]; if (!m) return; const t0 = performance.now() + delay; delay += 260;
    m.cup.scale.setScalar(0.01); m.lab.classList.add('pop');
    const ringM = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({color: PINK, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false}))); ringM.rotation.x = -Math.PI / 2; ringM.position.y = 0.02; m.g.add(ringM);
    anims.push(now => {
      const t = (now - t0) / 900; if (t < 0) return true;
      const k = Math.min(1, t), s = k < 0.6 ? ease(k / 0.6) * 1.35 : 1.35 - 0.35 * ease((k - 0.6) / 0.4);
      m.cup.scale.setScalar(Math.max(0.01, s)); m.cup.position.y = 1.0 + Math.sin(Math.min(1, k) * Math.PI) * 0.45;
      ringM.scale.setScalar(1 + k * 5); ringM.material.opacity = 0.8 * (1 - k);
      if (k >= 1) { m.g.remove(ringM); m.cup.scale.setScalar(1); m.cup.position.y = 1.0; return false; }
      return true;
    });
  });

  const lost = e => { e.preventDefault(); if (alive && opt.onLost) opt.onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);

  const tween = (to, ms = 450) => {
    const fp = camera.position.clone(), ft = controls.target.clone(), t0 = performance.now();
    anims.push(now => { const k = Math.min(1, (now - t0) / ms), e = ease(k); camera.position.lerpVectors(fp, to.pos, e); controls.target.lerpVectors(ft, to.target, e); return k < 1; }); kick();
  };
  draw();
  el.dataset.ready = '1';
  const api = {
    kind: '3d', avatarIn, markerCount: Object.keys(markers).length,
    get frames() { return frames; },
    view() { return {az: controls.getAzimuthalAngle(), polar: controls.getPolarAngle(), dist: camera.position.distanceTo(controls.target)}; },
    reset() { tween(homePose()); },
    zoom(f) { const off = camera.position.clone().sub(controls.target), d = THREE.MathUtils.clamp(off.length() * f, controls.minDistance, controls.maxDistance); tween({pos: controls.target.clone().add(off.setLength(d)), target: controls.target.clone()}, 250); },
    screenOf(id) { const m = markers[id]; if (!m) return null; const v = new THREE.Vector3(); m.cup.getWorldPosition(v); v.project(camera); const r = renderer.domElement.getBoundingClientRect(); return {x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height}; },
    remove() {
      alive = false; renderer.domElement.removeEventListener("webglcontextlost", lost); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
      disposables.forEach(d => d.dispose && d.dispose());
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      renderer.domElement.remove(); labels.domElement.remove();
    },
  };
  return api;
}
