// Loyalty booklet rules. Run: node pwtest/testloyalty.mjs
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
}};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'loyalty.js'), 'utf8'), context, {filename: 'loyalty.js'});
const L = context.Loyalty;
const fail = [];
const eq = (name, got, want) => { if (got !== want) fail.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

const cafes = [
  {id: 'a', name: 'A', short: 'A', region: 'city', regionName: '市中心', closed: false, seed: true},
  {id: 'b', name: 'B', short: 'B', region: 'city', regionName: '市中心', closed: true, seed: true},
  {id: 'c', name: 'C', short: 'C', region: 'city', regionName: '市中心', closed: false, seed: true},
];
const ctx = (counts, story) => ({cafes, counts, story: story || {pro: false, chapters: [], sides: [], ending: null, unique: Object.keys(counts).length}});

L.reload();
let r = L.sync(ctx({a: 1}));
eq('first stamp', r.stamps.join(','), 'a');
eq('no story card yet', r.cards.length, 0);
r = L.sync(ctx({a: 1}));
eq('stamp not repeated', r.stamps.length, 0);
eq('one star not yet', L.starsOf(1), 0);
eq('star at 3', L.starsOf(3), 1);
eq('star at 5', L.starsOf(5), 2);
eq('star at 10', L.starsOf(10), 3);

r = L.sync(ctx({a: 3, c: 1}, {pro: true, chapters: [1], sides: ['s-city1'], ending: 'tea', unique: 2}));
eq('chapter card', r.cards.some(c => c.id === 'ch1'), true);
eq('side card', r.cards.some(c => c.id === 'side:s-city1'), true);
eq('no ending card under 51', r.cards.some(c => c.id === 'end:tea'), false);
eq('closed cafe not required', L.model(ctx({a: 1, c: 1})).sets.find(s => s.id === 'city').ready, true);
const claim = L.claim('city', ctx({a: 1, c: 1}));
eq('set coins', claim && claim.c, 80);
eq('set once', L.claim('city', ctx({a: 1, c: 1})), null);

const many = {};
for (let i = 0; i < 51; i++) many['n' + i] = 1;
const wide = Object.keys(many).map(id => ({id, name: id, short: id, region: 'more', regionName: '更多', closed: false, seed: true}));
r = L.sync({cafes: wide, counts: many, story: {pro: false, chapters: [], sides: [], ending: 'lamp', unique: 51}});
eq('mile 51', r.cards.some(c => c.id === 'mile:51'), true);
eq('ending card at 51', r.cards.some(c => c.id === 'end:lamp'), true);
const end = L.model({cafes: wide, counts: many, story: {ending: 'lamp', unique: 51}}).cards.find(c => c.id === 'end:tea');
eq('other ending stays a silhouette', end.owned, false);
eq('silhouette name', end.face, '结局');

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('testloyalty ok');
