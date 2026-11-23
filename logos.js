// 🏷️ Cafe logos: each cafe's own brand mark (img/logos/{id}.webp, sourced in research/logos.json).
// No confident logo → a monogram badge (initials). Never a borrowed or invented mark.
(() => {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m]));
const SKIP = new Set(['the', 'of', 'and', 'by', 'no', 'co', 'co.', '&', 'cafe', 'café', 'coffee']);
function mono(c) {
  const base = String((c && (c.short || c.name)) || '咖').replace(/\(.*?\)/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (/^[\u3400-\u9fff]/.test(base)) return base[0];
  const w = base.split(/[\s\-_/]+/).filter(Boolean), k = w.filter(x => !SKIP.has(x.toLowerCase()));
  const use = (k.length ? k : w);
  return (use.length >= 2 ? use[0][0] + use[1][0] : (use[0] || '咖')[0]).toUpperCase();
}
// Content aspect (w/h) of the artwork inside each padded 256×256 file.
// The files themselves are square, so naturalWidth/naturalHeight is always 1.
// Square-ish marks (0.85–1.2) are omitted and stay as circular badges.
const AR = {
  allpress:5.632, auctionrooms:1.814, bench:9.636, benchroastery:9.636,
  calere:3.963, cibi:2.108, codeblack:7.133, codeblackflinders:7.133,
  codeblacknorth:7.133, codeblackspencer:7.133, disciple:3.69, dukes:0.697,
  hardwaresoc:3.057, heart:1.945, homebody:6.903, imaasayoru:2.019,
  juniper:2.488, krimper:3.963, littlerogue:0.573, lumenpeople:4.176,
  lune:3.452, maker:3.944, makerrichmond:3.944, midi:1.928, monkbodhi:1.507,
  mork:1.234, otherside:5.095, padre:1.394, palette:3.508, path:1.394,
  patricia:1.814, pillarofsalt:1.329, proudmary:0.553, roslynthai:0.534,
  sircharles:1.814, squareone:4.652, stali:3.69, standingroom:0.69,
  toppaddock:2.744, twobirds:1.635, udomhouse:0.777, vacation:4.63,
  veneziano:2.972, wideopenroad:4.652, wildlife:3.963, zest:3.452
};
// List badges stay narrow (2.4× height) so names remain readable.
// Detail stacked marks can be wider (capped by the hero width in CSS).
const MAX_AR_SM = 2.4, MAX_AR_LG = 5.6, STACK_AR = 2;
function fitAttrs(c, size) {
  const ar = (c && c.id && AR[c.id]) || 0;
  if (!ar) return '';
  if (ar < 1) return ' cl-fit cl-tall';
  const used = Math.min(ar, size === 'lg' ? MAX_AR_LG : MAX_AR_SM);
  const stack = (size === 'lg' && ar > STACK_AR) ? ' cl-stack' : '';
  return ` cl-fit cl-wide${stack}" style="--logo-ar:${used}`;
}
// size: 'sm' (cards) | 'lg' (detail header)
function html(c, size = 'sm') {
  if (!c) return '';
  const m = esc(mono(c));
  if (c.logo) return `<span class="cafe-logo cl-${size}${fitAttrs(c, size)}" data-mono="${m}" aria-hidden="true"><img src="${esc(c.logo)}" alt="" loading="lazy" decoding="async" width="256" height="256"></span>`;
  return `<span class="cafe-logo cl-${size} mono" data-mono="${m}" aria-hidden="true"></span>`;
}
// a missing/broken logo file degrades to the monogram, never a broken-image icon
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('cafe-logo')) { t.parentNode.classList.add('mono'); t.remove(); } }, true);
window.Logos = {html, mono};
})();
