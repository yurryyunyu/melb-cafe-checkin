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
// size: 'sm' (cards) | 'lg' (detail header)
function html(c, size = 'sm') {
  if (!c) return '';
  const m = esc(mono(c));
  if (c.logo) return `<span class="cafe-logo cl-${size}" data-mono="${m}" aria-hidden="true"><img src="${esc(c.logo)}" alt="" loading="lazy" decoding="async" width="256" height="256"></span>`;
  return `<span class="cafe-logo cl-${size} mono" data-mono="${m}" aria-hidden="true"></span>`;
}
// a missing/broken logo file degrades to the monogram, never a broken-image icon
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('cafe-logo')) { t.parentNode.classList.add('mono'); t.remove(); } }, true);
window.Logos = {html, mono};
})();
