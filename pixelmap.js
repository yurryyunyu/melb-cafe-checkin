// 🗺️ Pixel-art JRPG overworld for a region (tile-based canvas + DOM sprites). Same street layout / numbering as the sketch maps.
(() => {
'use strict';
const TS = 16, U = 32; // native px per tile, svg units per tile
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((px - a[0]) * dx + (py - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); }
// original region flavour: rivers / ponds (roughly where the Yarra, Merri Creek etc. sit)
const WATER = {
  city: (x, y, R) => y > 868 + Math.sin(x / 60) * 8,
  richmond: (x, y) => y > 852 + Math.sin(x / 70) * 10,
  northmel: (x, y) => Math.hypot((x - 860) / 1.3, y - 285) < 62,
  brunswick: (x, y) => x > 1040 + Math.sin(y / 50) * 14,
};
const WALK = new Set(['g', 'f', 'q', 'r', 'd', 'c']);

function build(region, valley = false) {
  const J = window.JRPG, R = J.rng(J.hash(region.id) ^ 0x9e37), [vx, vy, vw, vh] = region.vb;
  const cols = Math.ceil(vw / U), rows = Math.ceil(vh / U), G = Array.from({length: rows}, () => Array(cols).fill('g')), V = Array.from({length: rows}, () => Array(cols).fill(0));
  const cx = c => vx + (c + .5) * U, cy = r => vy + (r + .5) * U, water = WATER[region.id];
  const cafes = Object.entries(region.cafes).map(([id, [x, y]]) => ({id, c: Math.floor((x - vx) / U), r: Math.floor((y - vy) / U)}));
  const nearCafe = (c, r, d) => cafes.some(k => Math.abs(k.c - c) <= d && Math.abs(k.r - r) <= d);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = cx(c), y = cy(r); V[r][c] = (R() * 4) | 0;
    let road = null;
    region.streets.forEach(st => { for (let i = 1; i < st.pts.length; i++) if (segDist(x, y, st.pts[i - 1], st.pts[i]) < st.w / 2 + U * 0.36) { const t = st.w >= 28 ? 'r' : 'd'; if (road !== 'r') road = t; } });
    if (road) G[r][c] = road; else if (water && water(x, y, R)) G[r][c] = 'w';
  }
  // smooth noise for tree clusters
  const N = Array.from({length: rows + 2}, () => Array.from({length: cols + 2}, () => R()));
  const noise = (c, r) => { let s = 0; for (let j = 0; j <= 2; j++) for (let i = 0; i <= 2; i++) s += N[r + j][c + i]; return s / 9; };
  const isRoad = (c, r) => G[r] && (G[r][c] === 'r' || G[r][c] === 'd');
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (G[r][c] !== 'g') continue;
    if (nearCafe(c, r, 1)) { G[r][c] = R() < .3 ? 'f' : 'g'; continue; }
    const edge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
    const byRoad = isRoad(c - 1, r) || isRoad(c + 1, r) || isRoad(c, r - 1) || isRoad(c, r + 1);
    if (edge) G[r][c] = R() < .5 ? 't' : 'p';
    else if (byRoad && R() < .55) G[r][c] = 'h';
    else if (noise(c, r) > .58) G[r][c] = R() < .7 ? 't' : 'p';
    else { const q = R(); G[r][c] = q < .07 ? 'f' : q < .15 ? 'q' : q < .17 ? 'n' : 'g'; }
  }
  cafes.forEach(k => { if (G[k.r] && G[k.r][k.c] !== undefined && !isRoad(k.c, k.r)) G[k.r][k.c] = 'c'; });
  if (valley) cozy(G, cols, rows, cafes, R, isRoad, nearCafe);
  return {G, V, cols, rows, cafes, vx, vy, id: region.id};
}
// 🌾 valley extras: a little pond, crop plots with fences, planters by the shops, lamp posts along the paths
function cozy(G, cols, rows, cafes, R, isRoad, nearCafe) {
  const soft = new Set(['g', 'f', 'q', 't', 'p']);
  const boxOk = (c0, r0, w, h) => { if (c0 < 1 || r0 < 1 || c0 + w >= cols - 1 || r0 + h >= rows - 1) return false; for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (!soft.has(G[r][c]) || nearCafe(c, r, 2)) return false; return true; };
  const cands = (w, h) => { const out = []; for (let r = 1; r < rows - h; r++) for (let c = 1; c < cols - w; c++) if (boxOk(c, r, w, h)) out.push({c, r}); for (let i = out.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [out[i], out[j]] = [out[j], out[i]]; } return out; };
  const pond = cands(6, 4)[0];
  if (pond) for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const dx = (c + .5 - 3) / 3, dy = (r + .5 - 2) / 2; if (dx * dx + dy * dy <= 1.05) G[pond.r + r][pond.c + c] = 'w'; else if (G[pond.r + r][pond.c + c] === 't' || G[pond.r + r][pond.c + c] === 'p') G[pond.r + r][pond.c + c] = 'f'; }
  let plots = 0;
  [[5, 4], [4, 3], [3, 3]].forEach(([w, h]) => { for (const b of cands(w, h)) { if (plots >= 2) break; if (!boxOk(b.c, b.r, w, h)) continue;
    for (let c = 0; c < w; c++) G[b.r][b.c + c] = 'n'; for (let r = 1; r < h; r++) for (let c = 0; c < w; c++) G[b.r + r][b.c + c] = 'k'; plots++; } });
  cafes.forEach(k => [[-2, 0], [2, 0]].forEach(([dc, dr]) => { const c = k.c + dc, r = k.r + dr; if (G[r] && (G[r][c] === 'g' || G[r][c] === 'f') && R() < .7) G[r][c] = 'l'; }));
  const lamps = []; for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) if (['g', 'f', 'h'].includes(G[r][c]) && (isRoad(c - 1, r) || isRoad(c + 1, r) || isRoad(c, r - 1) || isRoad(c, r + 1)) && !nearCafe(c, r, 1)) lamps.push({c, r});
  const step = Math.max(1, Math.floor(lamps.length / 6)); for (let i = step >> 1; i < lamps.length; i += step) G[lamps[i].r][lamps[i].c] = 'm';
}

function paintMap(M, T = window.JRPG.tiles()) {
  const {G, V, cols, rows} = M;
  const cv = document.createElement('canvas'); cv.width = cols * TS; cv.height = rows * TS; cv.className = 'px-ground px-layer';
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const at = (c, r) => (G[r] && G[r][c]) || 'x';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = G[r][c], X = c * TS, Y = r * TS, v = V[r][c];
    const base = t === 'r' ? T.stone : t === 'd' ? T.dirt : t === 'w' ? T.water[(c + r) % 2] : T.grass[v];
    g.drawImage(base, X, Y);
    if (t === 'r' || t === 'd') { // path edges where it meets grass
      g.fillStyle = t === 'r' ? (T.edgeR || '#5e584c') : (T.edgeD || '#a8824a');
      const road = s => s === 'r' || s === 'd' || s === 'c';
      if (!road(at(c, r - 1))) g.fillRect(X, Y, TS, 1); if (!road(at(c, r + 1))) g.fillRect(X, Y + TS - 1, TS, 1);
      if (!road(at(c - 1, r))) g.fillRect(X, Y, 1, TS); if (!road(at(c + 1, r))) g.fillRect(X + TS - 1, Y, 1, TS);
    }
    if (t === 'w') { g.fillStyle = T.sand || '#f0e2a8'; const land = s => s !== 'w' && s !== 'x';
      if (land(at(c, r - 1))) g.fillRect(X, Y, TS, 2); if (land(at(c - 1, r))) g.fillRect(X, Y, 2, TS); if (land(at(c + 1, r))) g.fillRect(X + TS - 2, Y, 2, TS); if (land(at(c, r + 1))) g.fillRect(X, Y + TS - 2, TS, 2); }
    if (t === 'f') g.drawImage(T.flowers[v % 2], X, Y);
    if (t === 'q') g.drawImage(T.bush || T.tall, X, Y);
    if (t === 't') g.drawImage(T.trunk || T.tree, X, Y); // valley: canopy goes on the swaying layer
    if (t === 'k' && T.crop) g.drawImage(T.crop, X, Y);
    if (t === 'l' && T.planter) g.drawImage(T.planter, X, Y);
    if (t === 'm' && T.lamp) g.drawImage(T.lamp, X, Y);
    if (t === 'p') g.drawImage(T.pine, X, Y);
    if (t === 'h') g.drawImage(T.house[(v + c) % T.house.length], X, Y);
    if (t === 'n') g.drawImage(T.fence, X, Y);
  }
  return cv;
}

function bfs(M, from, to) {
  const {G, cols, rows} = M, key = (c, r) => r * cols + c, prev = new Map([[key(from.c, from.r), null]]), q = [from];
  const ok = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && (WALK.has(G[r][c]) || (c === to.c && r === to.r));
  while (q.length) {
    const p = q.shift(); if (p.c === to.c && p.r === to.r) break;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dr]) => { const n = {c: p.c + dc, r: p.r + dr}, k = key(n.c, n.r); if (!prev.has(k) && ok(n.c, n.r)) { prev.set(k, p); q.push(n); } });
  }
  if (!prev.has(key(to.c, to.r))) return null;
  const path = []; for (let p = to; p; p = prev.get(key(p.c, p.r))) path.unshift(p); return path;
}
function nearestWalk(M, c, r) {
  const {G, cols, rows} = M; c = Math.max(0, Math.min(cols - 1, c)); r = Math.max(0, Math.min(rows - 1, r));
  for (let d = 0; d < 12; d++) for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) { const C = c + i, Rr = r + j; if ((Math.abs(i) === d || Math.abs(j) === d) && G[Rr] && WALK.has(G[Rr][C]) && G[Rr][C] !== 'c') return {c: C, r: Rr}; }
  return {c, r};
}

function create(wrap, region, opt) {
  const J = window.JRPG; if (!J) throw new Error('JRPG kit missing');
  const {visited, cafeById, me, fitAffine, focusId, onOpen = () => {}, heroAt, onHeroMove = () => {}, rangeM = 250, kit = null, tired = false} = opt;
  const M = build(region, !!kit), W = M.cols * TS, H = M.rows * TS;
  const CS = kit ? kit.cafeSize : 24, cafeSprite = kit ? kit.cafeSprite : J.cafeSprite, drawHero0 = kit ? kit.drawHero : J.drawHero;
  const world = document.createElement('div'); world.className = 'px-world';
  const ground = paintMap(M, kit ? kit.tiles : undefined); world.appendChild(ground);
  const sprites = [];
  // cafes
  let n = 0;
  Object.entries(region.cafes).forEach(([id, [sx, sy, side]]) => {
    n++; const c = cafeById(id); if (!c) return;
    const done = visited.has(id), x = (sx - M.vx) / U * TS, y = (sy - M.vy) / U * TS;
    const el = document.createElement('div'); el.className = `px-mk ${done ? 'done' : 'locked'}`; el.dataset.id = id;
    el.innerHTML = `<span class="px-no">${n}</span><span class="px-name side-${side === 'l' ? 'l' : 'r'}">${esc(String(c.mapLabel || c.short || c.name).replace(/\n/g, ' '))}</span>${done ? '<i class="px-spark s1"></i><i class="px-spark s2"></i><i class="px-spark s3"></i>' : '<i class="px-fog"></i>'}`;
    const spr = cafeSprite(id, done); const cv = document.createElement('canvas'); cv.width = CS; cv.height = CS; cv.getContext('2d').drawImage(spr, 0, 0); cv.className = 'px-cafe'; el.prepend(cv);
    world.appendChild(el); sprites.push({el, x, y, w: CS, h: CS, ax: CS / 2, ay: CS - 4, id, tile: {c: Math.floor(x / TS), r: Math.floor(y / TS)}});
  });
  // street signs (spaced uppercase, like the sketch map)
  region.streets.forEach(st => { if (!st.label) return; const l = document.createElement('div'); l.className = 'px-street' + (st.v ? ' v' : ''); l.textContent = st.label; world.appendChild(l); sprites.push({el: l, x: (st.at[0] - M.vx) / U * TS, y: (st.at[1] - M.vy) / U * TS, label: true}); });
  // hero
  const heroEl = document.createElement('div'); heroEl.className = 'px-hero' + (tired ? ' tired' : '');
  const drawHero = (c, d, f) => { drawHero0(c, d, f); if (tired && !f && !heroEl.classList.contains('walking')) J.tire(c); }; // exhausted: slumps whenever standing still
  const hc = document.createElement('canvas'); hc.width = 16; hc.height = 16; heroEl.appendChild(hc); drawHero(hc, 'down', 0);
  let ring = null, meIn = false, start = null;
  if (me && fitAffine) { const f = fitAffine(region, cafeById); if (f) { const [mx, my] = f(me[1], me[0]), [nx, ny] = f(me[1], me[0] + rangeM / 111320); const [vx, vy, vw, vh] = region.vb;
    if (mx > vx - 20 && mx < vx + vw + 20 && my > vy - 20 && my < vy + vh + 20) { meIn = true; start = nearestWalk(M, Math.floor((mx - vx) / U), Math.floor((my - vy) / U));
      ring = document.createElement('div'); ring.className = 'px-range'; const rad = Math.max(16, Math.min(120, Math.hypot(nx - mx, ny - my) / U * TS)); world.appendChild(ring); sprites.push({el: ring, x: (mx - vx) / U * TS, y: (my - vy) / U * TS, w: rad * 2, h: rad * 2, ax: rad, ay: rad}); } } }
  if (!start && heroAt) start = nearestWalk(M, heroAt.c, heroAt.r);
  const focus = focusId && sprites.find(s => s.id === focusId) || sprites.find(s => s.id && visited.has(s.id));
  if (!start && focus) start = nearestWalk(M, focus.tile.c, focus.tile.r + 1);
  if (!start) start = nearestWalk(M, M.cols >> 1, M.rows >> 1);
  const hero = {el: heroEl, x: start.c * TS + 8, y: start.r * TS + 8, w: 16, h: 16, ax: 8, ay: 13, tile: start, hero: true};
  world.appendChild(heroEl); sprites.push(hero);
  wrap.appendChild(world);

  let s = 1;
  const isWalk = (c, r) => c >= 0 && r >= 0 && c < M.cols && r < M.rows && WALK.has(M.G[r][c]) && M.G[r][c] !== 'c';
  const deco = kit && kit.decorate ? kit.decorate({world, M, W, H, sprites, getS: () => s, visited, TS, walk: isWalk}) : null;
  if (kit) wrap.dataset.skin = kit.name;
  const layout = () => {
    world.style.width = W * s + 'px'; world.style.height = H * s + 'px';
    world.querySelectorAll('.px-layer').forEach(l => { l.style.width = W * s + 'px'; l.style.height = H * s + 'px'; });
    sprites.forEach(o => { const st = o.el.style; st.left = Math.round((o.x - (o.ax || 0)) * s) + 'px'; st.top = Math.round((o.y - (o.ay || 0)) * s) + 'px'; st.zIndex = o.z || (o.label ? 1 : o.hero ? 9999 : Math.round(o.y) + 10);
      if (o.w && !o.label) { st.width = o.w * s + 'px'; st.height = o.h * s + 'px'; } });
    wrap.style.setProperty('--s', s);
  };
  const fit = Math.min(2, Math.max(1, (wrap.clientWidth || 360) / W)); // JRPG camera: native pixels, scroll to explore
  s = fit; layout();
  const centerOn = (x, y, smooth) => { const L = x * s - wrap.clientWidth / 2, T = y * s - wrap.clientHeight / 2; if (smooth && wrap.scrollTo) wrap.scrollTo({left: L, top: T, behavior: 'smooth'}); else { wrap.scrollLeft = L; wrap.scrollTop = T; } };
  centerOn(focusId && focus ? focus.x : hero.x, focusId && focus ? focus.y : hero.y);

  // walking
  let walking = null, alive = true;
  const walkTo = (target) => new Promise(resolve => {
    const path = bfs(M, hero.tile, target.tile) || [hero.tile, target.tile];
    const steps = path.slice(1), stepMs = Math.max(45, Math.min(110, 1600 / Math.max(1, steps.length)));
    heroEl.classList.add('walking'); walking = {resolve};
    let i = 0, from = {x: hero.x, y: hero.y}, t0 = performance.now(), frame = 0;
    const tick = now => {
      if (!alive) return resolve();
      if (i >= steps.length) { heroEl.classList.remove('walking'); drawHero(hc, hero.dir === 'up' ? 'up' : hero.dir || 'down', 0); walking = null; onHeroMove(hero.tile); return resolve(); }
      const to = {x: steps[i].c * TS + 8, y: steps[i].r * TS + 8}, k = Math.min(1, (now - t0) / stepMs);
      const dx = to.x - from.x, dy = to.y - from.y; hero.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const f = ((i * 2 + (k > .5 ? 1 : 0)) % 2) + 1; if (f !== frame) { frame = f; drawHero(hc, hero.dir, f); }
      hero.x = from.x + dx * k; hero.y = from.y + dy * k;
      heroEl.style.left = Math.round((hero.x - 8) * s) + 'px'; heroEl.style.top = Math.round((hero.y - 13) * s) + 'px';
      const hx = hero.x * s - wrap.scrollLeft, hy = hero.y * s - wrap.scrollTop; // camera follow
      if (hx < 40 || hx > wrap.clientWidth - 40) wrap.scrollLeft += (hx < 40 ? -1 : 1) * 6; if (hy < 40 || hy > wrap.clientHeight - 40) wrap.scrollTop += (hy < 40 ? -1 : 1) * 6;
      if (k >= 1) { hero.tile = steps[i]; from = to; i++; t0 = now; if (i % 2) J.SFX.play('step'); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const onTap = async e => {
    const mk = e.target.closest('.px-mk'); if (!mk || walking) return;
    const tgt = sprites.find(o => o.id === mk.dataset.id); J.SFX.play('blip');
    wrap.querySelectorAll('.px-mk.sel').forEach(x => x.classList.remove('sel')); mk.classList.add('sel');
    await walkTo({tile: {c: tgt.tile.c, r: Math.min(M.rows - 1, tgt.tile.r + (M.G[tgt.tile.r + 1] && WALK.has(M.G[tgt.tile.r + 1][tgt.tile.c]) ? 1 : 0))}});
    if (!alive) return; heroEl.classList.add('bang'); drawHero(hc, 'up', 0); J.SFX.play('confirm');
    setTimeout(() => alive && onOpen(tgt.id), 260);
  };
  wrap.addEventListener('click', onTap);
  wrap.dataset.ready = '1';
  return {
    kind: 'px', skin: kit ? kit.name : 'jrpg', season: kit && kit.season, phase: kit && kit.phase, critters: deco ? deco.critters : 0, meIn, markerCount: sprites.filter(o => o.id).length, get scale() { return s; }, get hero() { return {...hero.tile, walking: !!walking}; },
    zoom(f) { const cxw = (wrap.scrollLeft + wrap.clientWidth / 2) / s, cyw = (wrap.scrollTop + wrap.clientHeight / 2) / s; s = Math.min(3, Math.max(0.6, s * f)); layout(); centerOn(cxw, cyw); },
    reset() { s = fit; layout(); centerOn(hero.x, hero.y, true); },
    centerHero() { centerOn(hero.x, hero.y, true); },
    remove() { alive = false; if (deco) deco.remove(); wrap.removeEventListener('click', onTap); world.remove(); },
  };
}
window.PixelMap = {create, build, TS, U};
})();
