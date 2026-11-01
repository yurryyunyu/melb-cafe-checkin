// Live weather mapping. Run: node pwtest/testlivewx.mjs
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new Map();
const context = {console, localStorage: {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
}, Valley: {clock: () => ({wx: {id: 'sun', zh: '晴', icon: '☀️'}, phase: 'day'})}};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'livewx.js'), 'utf8'), context, {filename: 'livewx.js'});
const W = context.LiveWx;
const fail = [];
const eq = (name, got, want) => { if (got !== want) fail.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

const sample = W.fromApi({
  current: {temperature_2m: 18.6, weather_code: 2, cloud_cover: 73, precipitation: 0, wind_speed_10m: 13.8},
  hourly: {time: ['2026-11-01T15:00', '2026-11-01T16:00'], temperature_2m: [18.6, 18.7], weather_code: [3, 1]},
  daily: {time: ['2026-11-01', '2026-11-02', '2026-11-03'], weather_code: [51, 80, 51], temperature_2m_max: [19.1, 21.3, 16.8], temperature_2m_min: [12, 10.7, 12.6]},
}, 1000);
eq('cloudy id', sample.id, 'cloud');
eq('temp', Math.round(sample.temp), 19);
eq('hours', sample.hourly.length, 2);
eq('today', sample.daily[0].label, '今天');
eq('drizzle day', sample.daily[0].zh, '小雨');
eq('rain code', W.describe(61, 10, 0, 0, 16).id, 'rain');
eq('clear', W.describe(0, 5, 0, 5, 20).id, 'sun');
eq('hot', W.describe(0, 10, 0, 5, 33).id, 'hot');
const blank = W.fromApi({}, 2000);
eq('blank still has a sky', !!blank.id, true);
eq('no live yet uses town weather', W.view().src, 'game');
eq('game not empty', !!W.view().zh, true);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('testlivewx ok', sample.zh, sample.temp);
