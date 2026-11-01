// Melbourne live weather via Open-Meteo (no key). Cached in localStorage mcc.livewx.
// Offline or a failed fetch keeps the last reading, then the in-game town weather. The UI is never left blank.
(function () {
'use strict';
const root = typeof window !== 'undefined' ? window : globalThis;
const KEY = 'mcc.livewx';
const URL = 'https://api.open-meteo.com/v1/forecast?latitude=-37.8136&longitude=144.9631&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Australia%2FMelbourne&forecast_hours=8&forecast_days=3';
const FRESH = 30 * 60 * 1000, KEEP = 12 * 60 * 60 * 1000;
const RAIN = {51:1,53:1,55:1,56:1,57:1,61:1,63:1,65:1,66:1,67:1,80:1,81:1,82:1,95:1,96:1,99:1};
const SNOW = {71:1,73:1,75:1,77:1,85:1,86:1};
function describe(code, cloud, precip, wind, temp) {
  const c = +code || 0, pp = +precip || 0, cl = cloud == null ? (c <= 0 ? 0 : c === 1 ? 25 : c === 2 ? 55 : 90) : +cloud;
  if (RAIN[c] || SNOW[c] || pp >= 0.2) {
    const heavy = c === 65 || c === 67 || c === 82 || c >= 95 || pp >= 2;
    return {id: 'rain', zh: SNOW[c] ? '雨夹雪' : c >= 95 ? '雷雨' : heavy ? '大雨' : '小雨', icon: SNOW[c] ? '🌨️' : '🌧️'};
  }
  if ((+wind || 0) >= 40) return {id: 'wind', zh: '大风', icon: '🍃'};
  if ((+temp || 0) >= 30 && cl < 45) return {id: 'hot', zh: '炎热', icon: '🔥'};
  if (cl >= 70 || c === 3 || c === 45 || c === 48) return {id: 'cloud', zh: c >= 45 ? '有雾' : '阴', icon: '☁️'};
  if (cl >= 35 || c === 2) return {id: 'cloud', zh: '多云', icon: '⛅'};
  return {id: 'sun', zh: '晴', icon: '☀️'};
}
function fromApi(j, now) {
  const cur = (j && j.current) || {}, H = (j && j.hourly) || {}, D = (j && j.daily) || {};
  const desc = describe(cur.weather_code, cur.cloud_cover, cur.precipitation, cur.wind_speed_10m, cur.temperature_2m);
  const hourly = [], times = H.time || [];
  for (let i = 0; i < times.length && hourly.length < 6; i++) {
    const d = describe(H.weather_code && H.weather_code[i], null, 0, 0, H.temperature_2m && H.temperature_2m[i]);
    hourly.push({hh: String(times[i] || '').slice(11, 13) + '时', temp: H.temperature_2m ? H.temperature_2m[i] : null, zh: d.zh, id: d.id});
  }
  const daily = [], days = D.time || [], labels = ['今天', '明天', '后天'];
  for (let i = 0; i < days.length && i < 3; i++) {
    const d = describe(D.weather_code && D.weather_code[i], null, 0, 0, D.temperature_2m_max && D.temperature_2m_max[i]);
    daily.push({label: labels[i] || String(days[i]).slice(5), min: D.temperature_2m_min ? D.temperature_2m_min[i] : null, max: D.temperature_2m_max ? D.temperature_2m_max[i] : null, zh: d.zh});
  }
  return {v: 1, at: now || Date.now(), temp: cur.temperature_2m == null ? null : +cur.temperature_2m, cloud: cur.cloud_cover == null ? null : +cur.cloud_cover, precip: +cur.precipitation || 0, wind: +cur.wind_speed_10m || 0, code: cur.weather_code == null ? null : +cur.weather_code, id: desc.id, zh: desc.zh, icon: desc.icon, hourly, daily};
}
function read() {
  try { const o = JSON.parse(root.localStorage.getItem(KEY)); return o && o.v === 1 && o.id ? o : null; } catch (e) { return null; }
}
function write(o) { try { root.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
function ago(at) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (m < 2) return '刚刚更新';
  if (m < 60) return m + ' 分钟前的实况';
  return Math.round(m / 60) + ' 小时前的实况';
}
function game() {
  let id = 'sun', zh = '晴', icon = '☀️';
  try {
    const k = root.Valley && Valley.clock();
    if (k && k.wx) { id = k.wx.id || id; zh = k.wx.zh || zh; icon = k.wx.icon || icon; }
  } catch (e) {}
  return {v: 1, at: 0, src: 'game', temp: null, cloud: null, precip: 0, wind: 0, code: null, id, zh, icon, hourly: [], daily: [], ago: ''};
}
function view() {
  const c = read();
  if (c && Date.now() - c.at < KEEP) return {...c, src: Date.now() - c.at < FRESH ? 'live' : 'cache', ago: ago(c.at)};
  return game();
}
let inflight = null;
function refresh() {
  if (inflight) return inflight;
  const cached = read();
  if (cached && Date.now() - cached.at < FRESH) return Promise.resolve(view());
  const fetchFn = root.fetch;
  if (!fetchFn) return Promise.resolve(view());
  inflight = fetchFn(URL, {cache: 'no-store'}).then(r => { if (!r.ok) throw new Error('wx'); return r.json(); }).then(j => {
    const p = fromApi(j, Date.now()); write(p); return view();
  }).catch(() => view()).finally(() => { inflight = null; });
  return inflight;
}
const LiveWx = {KEY, URL, describe, fromApi, view, refresh, game};
root.LiveWx = LiveWx;
if (typeof module !== 'undefined') module.exports = LiveWx;
})();
