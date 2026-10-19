// Pluggable integrations: food/drink recognition (vision API) + Google Form submission.
(() => {
'use strict';
const CFG = window.APP_CONFIG || {};

// recognizeFood(photoDataUrl, menu) -> {item, confidence, matched, source} | null
// Uses any OpenAI-compatible chat-completions endpoint that accepts image_url content.
async function recognizeFood(photo, menu) {
  const V = CFG.VISION_API || {};
  if (!V.ENDPOINT || !photo) return null; // no endpoint configured -> caller shows quick-pick chips
  const names = menu.map(m => m.name);
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), V.TIMEOUT_MS || 15000);
  try {
    const headers = {'Content-Type': 'application/json'};
    if (V.API_KEY) headers.Authorization = 'Bearer ' + V.API_KEY;
    const r = await fetch(V.ENDPOINT, {method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({
      model: V.MODEL || 'gpt-4o-mini', temperature: 0, response_format: {type: 'json_object'},
      messages: [
        {role: 'system', content: 'You identify the main drink or food item in a cafe photo and match it to the given menu. Reply ONLY with JSON: {"item": "<exact menu item name or best short description>", "confidence": <0..1>}.'},
        {role: 'user', content: [
          {type: 'text', text: 'Menu items: ' + JSON.stringify(names) + '. Which item is in the photo? Use the exact menu name if one matches.'},
          {type: 'image_url', image_url: {url: photo}}]}]})});
    if (!r.ok) throw new Error('vision HTTP ' + r.status);
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content || '';
    const out = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = names.find(n => norm(n) === norm(out.item)) || names.find(n => norm(out.item).includes(norm(n)) || norm(n).includes(norm(out.item))) || null;
    return {item: matched || out.item, confidence: +out.confidence || 0, matched: !!matched, source: 'vision'};
  } catch (e) { console.warn('recognizeFood failed', e); return null; }
  finally { clearTimeout(to); }
}

// submitToGoogleForm(record) -> 'sent' | 'skipped' | 'failed'
// Posts to https://docs.google.com/forms/d/e/<FORM_ID>/formResponse with entry.<id> fields (no photo).
async function submitToGoogleForm(rec) {
  const F = CFG.GOOGLE_FORM || {};
  if (!F.FORM_ID || !F.ENTRY) return 'skipped';
  const body = new URLSearchParams();
  Object.entries(F.ENTRY).forEach(([field, entryId]) => {
    if (entryId && rec[field] != null && rec[field] !== '') body.append(entryId, String(rec[field]));
  });
  try {
    await fetch(`https://docs.google.com/forms/d/e/${encodeURIComponent(F.FORM_ID)}/formResponse`, {method: 'POST', mode: 'no-cors', body});
    return 'sent'; // no-cors: response is opaque, so "sent" means the request left the device
  } catch (e) { return 'failed'; }
}

window.Integrations = {recognizeFood, submitToGoogleForm,
  get visionOn() { return !!(CFG.VISION_API && CFG.VISION_API.ENDPOINT); },
  get formOn() { return !!(CFG.GOOGLE_FORM && CFG.GOOGLE_FORM.FORM_ID); }};
})();
