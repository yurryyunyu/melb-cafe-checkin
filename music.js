// 🎶 Original procedural chiptune background loop (WebAudio only, no samples, no copyrighted melodies).
// Off by default; the AudioContext is only created inside a user tap (iOS rule); pauses when the page is hidden.
(() => {
'use strict';
const KEY = 'mcc.music';
let ctx = null, master = null, timer = null, step = 0, nextT = 0, mood = 'day', song = null, armed = false;
let enabled = false; try { enabled = localStorage.getItem(KEY) === '1'; } catch (e) {}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// tiny seeded RNG → the tune is generated, but the same every time (an 8-bar loop that feels "composed")
const rng = s => () => { s |= 0; s = s + 0x6d2b79f5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const MOODS = {
  // day: bright major pentatonic, gentle walk; night: slower natural minor, sparse
  day: {bpm: 92, root: 60, scale: [0, 2, 4, 7, 9], chords: [0, 9, 5, 7, 0, 4, 5, 7], seed: 0xbea9, lead: 'square', rest: .28, vol: 1},
  night: {bpm: 68, root: 57, scale: [0, 3, 5, 7, 10], chords: [0, 8, 3, 10, 0, 5, 8, 7], seed: 0x5ea7, lead: 'triangle', rest: .45, vol: .85},
  // 🐄 牧场: one bright loop per (southern-hemisphere) season — all generated, original
  'r-spring': {bpm: 108, root: 62, scale: [0, 2, 4, 7, 9], chords: [0, 5, 7, 0, 9, 5, 7, 7], seed: 0x5917, lead: 'square', rest: .22, vol: 1, busy: true},
  'r-summer': {bpm: 118, root: 64, scale: [0, 2, 4, 7, 9], chords: [0, 7, 9, 5, 0, 7, 5, 7], seed: 0x50ae, lead: 'square', rest: .2, vol: 1, busy: true},
  'r-autumn': {bpm: 92, root: 57, scale: [0, 2, 4, 7, 9], chords: [0, 9, 5, 7, 0, 4, 9, 7], seed: 0xa070, lead: 'square', rest: .3, vol: .95, busy: true},
  'r-winter': {bpm: 80, root: 55, scale: [0, 2, 3, 7, 9], chords: [0, 8, 3, 10, 0, 5, 8, 7], seed: 0x3170, lead: 'triangle', rest: .38, vol: .9},
  // 🏰 Foundation-style default: slow plucked "lute" over soft drones
  'f-day': {bpm: 76, root: 57, scale: [0, 2, 4, 7, 9], chords: [0, 7, 5, 0, 9, 5, 7, 0], seed: 0xf0dd, lead: 'triangle', rest: .34, vol: 1, pluck: true},
  // ⚔️ 古风: original pentatonic (宫调式 D) zither-like loop with grace-note slides; night = 羽调式, slower
  'x-day': {bpm: 70, root: 62, scale: [0, 2, 4, 7, 9], chords: [0, 9, 7, 0, 5, 9, 7, 0], seed: 0x9e1f, lead: 'triangle', rest: .36, vol: 1, pluck: true, zheng: true},
  'x-night': {bpm: 56, root: 57, scale: [0, 3, 5, 7, 10], chords: [0, 7, 5, 0, 10, 5, 7, 0], seed: 0x3a1e, lead: 'triangle', rest: .5, vol: .85, pluck: true, zheng: true},
  'f-night': {bpm: 62, root: 55, scale: [0, 2, 3, 7, 10], chords: [0, 5, 3, 7, 0, 8, 5, 7], seed: 0xf0a7, lead: 'triangle', rest: .5, vol: .85, pluck: true}};
function compose(m) { const M = MOODS[m], R = rng(M.seed), bars = M.chords.length, mel = [], bass = [], hat = [];
  let deg = 2; // random walk over the scale, landing on chord tones on beat 1
  for (let b = 0; b < bars; b++) for (let s = 0; s < 8; s++) {
    if (s === 0) { const ct = M.chords[b]; let best = 0; M.scale.forEach((v, i) => { if (Math.abs(((v - ct) % 12 + 12) % 12) % 12 < Math.abs(((M.scale[best] - ct) % 12 + 12) % 12)) best = i; }); deg = best + 5; }
    else deg = Math.max(2, Math.min(11, deg + [-2, -1, -1, 0, 1, 1, 2][(R() * 7) | 0]));
    const rest = s !== 0 && R() < M.rest, oct = Math.floor(deg / 5), n = M.root + 12 * (oct - 1) + M.scale[deg % 5];
    mel.push(rest ? null : {n, len: R() < .25 && s % 2 === 0 ? 2 : 1});
    bass.push(s % 4 === 0 ? M.root - 24 + M.chords[b] + (s === 4 && b % 2 ? 7 : 0) : null);
    hat.push(!M.pluck && s % 2 === 1 && (m === 'day' || M.busy || s === 7)); }
  return {M, mel, bass, hat, len: bars * 8}; }
function tone(t, f, dur, type, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(vol * .35, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02); }
let noiseBuf = null;
function tick(t, vol) { if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .05, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .04); s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + .05); }
function schedule() { if (!ctx || !song) return; const spb = 60 / song.M.bpm / 2; // eighth notes
  while (nextT < ctx.currentTime + .25) { const i = step % song.len, v = song.M.vol, m = song.mel[i], b = song.bass[i];
    if (m) { if (song.M.pluck) { if (song.M.zheng && (step % 8 === 0 || m.len > 1)) tone(nextT - .045, mtof(m.n + 2), .07, 'triangle', .07 * v); tone(nextT, mtof(m.n), spb * (song.M.zheng ? 2.4 : 1.6), 'triangle', .2 * v); tone(nextT + .004, mtof(m.n) * 2.003, spb * .7, 'sine', .05 * v); } else tone(nextT, mtof(m.n), spb * m.len * .95, song.M.lead, .16 * v); }
    if (b != null) tone(nextT, mtof(b), spb * 3.6, 'triangle', .3 * v);
    if (song.hat[i]) tick(nextT, .05 * v);
    nextT += spb; step++; } }
function start() { if (!enabled || document.hidden) return;
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { ctx = new AC(); } catch (e) { return; } master = ctx.createGain(); master.gain.value = .06; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!song) song = compose(mood); if (!timer) { nextT = ctx.currentTime + .08; timer = setInterval(schedule, 60); schedule(); } }
function stop(hard) { if (timer) { clearInterval(timer); timer = null; } if (ctx) { if (hard) { try { master.gain.setTargetAtTime(0, ctx.currentTime, .05); } catch (e) {} setTimeout(() => { if (!timer && ctx) ctx.suspend().catch(() => {}); }, 200); } else ctx.suspend().catch(() => {}); } }
function setMood(m) { if (!MOODS[m] || m === mood) return; mood = m; song = compose(m); step = 0; }
function set(on, m) { enabled = !!on; try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {} if (m) setMood(m);
  if (enabled) { start(); if (master) master.gain.setTargetAtTime(.06, ctx.currentTime, .1); } else stop(true); }
// saved as "on": wait for the first tap anywhere (browsers refuse to start audio without a gesture)
function arm() { if (armed) return; armed = true; const go = () => { document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true); if (enabled) start(); };
  document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true); }
if (enabled) arm();
document.addEventListener('visibilitychange', () => { if (!enabled || !ctx) return; if (document.hidden) stop(); else start(); });
window.addEventListener('pagehide', () => { if (ctx) stop(); });
window.Music = {get enabled() { return enabled; }, set, mood: setMood, get state() { return {enabled, running: !!timer, ctx: ctx ? ctx.state : 'none', mood, steps: step}; }, compose};
})();
