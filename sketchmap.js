// ✏️ Sketch-style schematic region maps (pure SVG, no map tiles). Layouts come from REGIONS in data.js.
(() => {
'use strict';
const PENCIL = '#4a4a4a', SLATE = '#9fb3c4', SLATE_D = '#6f879c', PINK = '#ef6f8f', PINK_D = '#c94a6b', PINK_L = '#fbd6df', PAPER = '#f7f4ec';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
// hand-inked circle: slightly uneven radius, overshooting stroke end
function inkCircle(cx, cy, r, seed, turns = 1.12) {
  const R = rng(seed), a0 = R() * Math.PI * 2, n = 28, k1 = R() * 0.08, k2 = R() * 0.05, ph = R() * 6;
  let d = '';
  for (let i = 0; i <= n * turns; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const rr = r * (1 + k1 * Math.sin(2 * a + ph) + k2 * Math.sin(3 * a) + (i / n > 1 ? 0.06 : 0) + (R() - .5) * 0.03);
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d;
}
// scribble fill: zig-zag chords inside a circle
function scribble(cx, cy, r, seed) {
  const R = rng(seed + 99), ang = -0.6 + R() * 0.3, ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  let d = '', flip = false;
  for (let t = -r * 0.92; t <= r * 0.92; t += 3.2) {
    const h = Math.sqrt(Math.max(0, r * r - t * t)) * (0.86 + R() * 0.12);
    const ax = cx + px * t + ux * (flip ? h : -h), ay = cy + py * t + uy * (flip ? h : -h);
    d += (d ? 'L' : 'M') + ax.toFixed(1) + ' ' + ay.toFixed(1); flip = !flip;
  }
  return d;
}
const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('');

const DEFS = `<defs>
  <filter id="skw1" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>
  <filter id="skw2" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
  <pattern id="skHatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="9" height="9" fill="${SLATE}"/><line x1="0" y1="0" x2="0" y2="9" stroke="${SLATE_D}" stroke-width="2.2" opacity=".55"/></pattern>
  <pattern id="skDots" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#c4d1dc"/><circle cx="4.5" cy="4.5" r="2.6" fill="${SLATE_D}"/></pattern>
</defs>`;

// least-squares affine (lng,lat) -> (x,y) fitted on the region's cafes, used to place the player avatar
function fitAffine(region, cafeById) {
  const P = Object.entries(region.cafes).map(([id, m]) => { const c = cafeById(id); return c && [c.lng, c.lat, m[0], m[1]]; }).filter(Boolean);
  const solve = col => { // normal equations for [lng, lat, 1]
    const A = [[0,0,0],[0,0,0],[0,0,0]], b = [0,0,0];
    P.forEach(p => { const v = [p[0], p[1], 1]; for (let i = 0; i < 3; i++) { b[i] += v[i] * p[col]; for (let j = 0; j < 3; j++) A[i][j] += v[i] * v[j]; } });
    const det = m => m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
    const D = det(A); if (Math.abs(D) < 1e-18) return null;
    return [0,1,2].map(k => det(A.map((row, i) => row.map((v, j) => j === k ? b[i] : v))) / D);
  };
  const X = solve(2), Y = solve(3); if (!X || !Y) return null;
  return (lng, lat) => [X[0]*lng + X[1]*lat + X[2], Y[0]*lng + Y[1]*lat + Y[2]];
}

function render(region, {visited, cafeById, me, rangeM = 250}) {
  const [vx, vy, vw, vh] = region.vb;
  const S = region.streets;
  let casing = '', casing2 = '', base = '', hatch = '', labels = '';
  S.forEach(st => {
    const d = pathD(st.pts);
    casing += `<path d="${d}" stroke-width="${st.w + 6}"/>`;
    casing2 += `<path d="${d}" stroke-width="${st.w + 3}"/>`;
    base += `<path d="${d}" stroke-width="${st.w}"/>`;
    hatch += `<path d="${d}" stroke-width="${Math.max(4, st.w - 7)}"/>`;
    if (st.label) {
      const [x, y] = st.at, fs = Math.round(st.w * 0.6);
      labels += `<text x="${x}" y="${y}" font-size="${fs}" ${st.v ? `transform="rotate(-90 ${x} ${y})"` : ''} class="sk-street">${esc(st.label)}</text>`;
    }
  });
  const pl = region.pill;
  const pill = pl ? `<g class="sk-pill"><rect x="${pl.x - pl.w / 2}" y="${pl.y - pl.h / 2}" width="${pl.w}" height="${pl.h}" rx="${pl.h / 2}" fill="url(#skDots)" opacity=".9" filter="url(#skw2)"/>
    <rect x="${pl.x - pl.w / 2}" y="${pl.y - pl.h / 2}" width="${pl.w}" height="${pl.h}" rx="${pl.h / 2}" fill="none" stroke="${PENCIL}" stroke-width="2.4" filter="url(#skw1)"/>
    <text x="${pl.x}" y="${pl.y}" font-size="${Math.round(pl.h * 0.52)}" class="sk-pilltext">${esc(region.name)}</text></g>` : '';
  let marks = '', n = 0;
  Object.entries(region.cafes).forEach(([id, [x, y, side]]) => {
    n++; const c = cafeById(id); if (!c) return;
    const done = visited.has(id), sd = hash(id), r = 21;
    const lx = side === 'l' ? x - 30 : x + 30, anchor = side === 'l' ? 'end' : 'start';
    marks += `<g class="sk-mk ${done ? 'done' : 'locked'}" data-id="${id}">
      <circle cx="${x}" cy="${y}" r="38" fill="transparent"/>
      ${done ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${PINK_L}"/><path d="${scribble(x, y, r, sd)}" fill="none" stroke="${PINK}" stroke-width="2.6" stroke-linejoin="round"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="${PAPER}"/>`}
      <path d="${inkCircle(x, y, r, sd)}" fill="none" stroke="${PINK_D}" stroke-width="${done ? 2.6 : 2}" stroke-linecap="round" ${done ? '' : 'stroke-dasharray="1 0"'}/>
      <text x="${x}" y="${y + 1}" class="sk-no ${done ? 'done' : ''}">${n}</text>
      ${done ? `<path d="M${x + 13} ${y - 24} l6 7 l12 -19" fill="none" stroke="${PENCIL}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${(() => { const L = String(c.mapLabel || c.short || c.name).split('\n'); return `<text x="${lx}" y="${y + 1 - (L.length - 1) * 22}" text-anchor="${anchor}" class="sk-label ${done ? 'done' : ''}">${L.map((t, i) => `<tspan x="${lx}" dy="${i ? 44 : 0}">${esc(t)}</tspan>`).join('')}</text>`; })()}
    </g>`;
  });
  let avatar = '', meIn = false;
  if (me) {
    const f = fitAffine(region, cafeById);
    if (f) {
      const [mx, my] = f(me[1], me[0]);
      const [nx2, ny2] = f(me[1], me[0] + rangeM / 111320);
      const rad = Math.min(160, Math.max(26, Math.hypot(nx2 - mx, ny2 - my)));
      const near = Object.keys(region.cafes).map(cafeById).filter(Boolean).some(c => Math.hypot((c.lat - me[0]) * 111320, (c.lng - me[1]) * 88000) < 1500);
      meIn = near && mx > vx - 20 && mx < vx + vw + 20 && my > vy - 20 && my < vy + vh + 20;
      if (meIn) avatar = `<g class="sk-me"><circle cx="${mx}" cy="${my}" r="${rad}" fill="${SLATE}" fill-opacity=".14" stroke="${SLATE_D}" stroke-width="2.4" stroke-dasharray="7 7" class="sk-range"/>
        <path d="${inkCircle(mx, my, 20, 5)}" fill="#fff" stroke="${PENCIL}" stroke-width="2.6"/><path d="${scribble(mx, my, 17, 5)}" fill="none" stroke="${SLATE}" stroke-width="1.6"/>
        <text x="${mx}" y="${my + 2}" font-size="22" text-anchor="middle" dominant-baseline="central">🧑</text></g>`;
    }
  }
  const svg = `<svg class="sk-map" viewBox="${vx} ${vy} ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(region.name)} 手绘地图">${DEFS}
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="${PENCIL}" filter="url(#skw1)">${casing}</g>
      <g stroke="${PENCIL}" opacity=".45" filter="url(#skw2)">${casing2}</g>
      <g stroke="#b9c8d4" filter="url(#skw1)">${base}</g>
      <g stroke="url(#skHatch)" opacity=".9" filter="url(#skw2)">${hatch}</g>
    </g>${labels}${pill}${avatar}${marks}</svg>`;
  return {svg, meIn};
}
window.SketchMap = {render, inkCircle, scribble};
})();
