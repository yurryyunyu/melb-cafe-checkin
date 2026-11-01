// Ending rules for story.js (v3). Run: node pwtest/teststory.mjs
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new Map();
const context = {
  console,
  localStorage: {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  },
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'story.js'), 'utf8'), context, {filename: 'story.js'});
const Story = context.Story;
const fail = [];
const eq = (name, got, want) => { if (got !== want) fail.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

const xOf = (cafes, areaN = 0) => ({cafes, area: () => areaN, beans: 0, notes: 0, rated: 0, photos: 0, rank: 0, sca: 0, lv: 1});

function fresh() { Story.reset(); }
function finishChapters() {
  Story.mark('pro', '2026-01-01');
  for (let n = 1; n <= 9; n++) { Story.mark('c' + n + 'o', '2026-01-01'); Story.mark('c' + n + 'c', '2026-01-01'); }
}

// choice-only must not skip a chapter gate
fresh();
Story.mark('pro', '2026-01-01');
Story.mark('c1o', '2026-01-01');
Story.choose('k4', 0);
eq('gate still waits on goals', Story.nextScene(xOf(0)), null);
eq('chapter 1 not done', Story.done(1), false);

// under 51 cafes: chapters done, no epilogue
fresh();
finishChapters();
eq('no epi under 50', Story.nextScene(xOf(50)), null);
eq('no epi at 50', Story.nextScene(xOf(50)), null);
eq('fin at 51 before k7', Story.nextScene(xOf(51)), 'fin');
eq('ending hidden before epi', Story.ending(), null);

// tea: write the last page (default k7)
fresh();
finishChapters();
Story.choose('k7', 0);
eq('epi after k7 write', Story.nextScene(xOf(51)), 'epi');
eq('resolve tea', Story.resolveEnding(), 'tea');
Story.mark('epi', '2026-01-02');
eq('locked tea', Story.ending(), 'tea');
eq('tea title', Story.title(), '最后的读者');
eq('tea coins', Story.rewardOf('epi').c, 200);
eq('tea still tea if flags change later', (() => { Story.state.fav.laobei = 12; Story.state.fav.che = 12; Story.state.choices.k7 = 2; return Story.ending(); })(), 'tea');

// lamp: leave the page blank, even with high bond
fresh();
finishChapters();
Story.state.fav.laobei = 12; Story.state.fav.che = 12;
Story.choose('k3', 0); Story.choose('k6', 0); Story.choose('k7', 1);
eq('resolve lamp over first', Story.resolveEnding(), 'lamp');
eq('lamp scene name', Story.scene('epi').ending.name, '灯火未熄');
eq('lamp reward', Story.scene('epi').reward.c, 220);

// first: return the book + reconciliation + both bonds ≥ 5
fresh();
finishChapters();
Story.choose('k1', 0); Story.choose('k2', 1); Story.choose('k4', 0);
Story.choose('k5', 1); Story.choose('k6', 0); Story.choose('k3', 0); Story.choose('k7', 2);
eq('hope path laobei', Story.fav('laobei') >= 5, true);
eq('hope path che', Story.fav('che') >= 5, true);
eq('resolve first', Story.resolveEnding(), 'first');
eq('first coins', Story.scene('epi').reward.title, '第一颗的证人');
const firstLines = Story.lines('epi').map(b => b.t).join('\n');
eq('first mentions reopen', /重新开张/.test(firstLines), true);
eq('first has no vanish line', /化作一层淡淡的墨/.test(firstLines), false);

// return the book but bonds too low → tea, not first
fresh();
finishChapters();
Story.choose('k7', 2); Story.choose('k3', 0); Story.choose('k6', 0);
eq('low bond falls to tea', Story.resolveEnding(), 'tea');
eq('tea script acknowledges returned book', /墨却自己渗了出来/.test(Story.lines('epi').map(b => b.t).join('\n')), true);

// refuse 金远 and don't offer the seat → not first, even with bonds and a returned book
fresh();
finishChapters();
Story.state.fav.laobei = 8; Story.state.fav.che = 8;
Story.choose('k6', 1); Story.choose('k3', 1); Story.choose('k7', 2);
eq('no reconciliation is tea', Story.resolveEnding(), 'tea');

// unseen k6 must not count as "先听他说"
fresh();
finishChapters();
Story.state.fav.laobei = 8; Story.state.fav.che = 8;
Story.choose('k3', 1); Story.choose('k7', 2);
eq('unset k6 is not reconciliation', Story.resolveEnding(), 'tea');

// v2 save that already finished stays tea
fresh();
context.localStorage.setItem('mcc.story', JSON.stringify({v: 2, seen: {epi: 1, pro: 1}, done: {9: 1}, choices: {k7: 2, k3: 0, k6: 0}, fav: {laobei: 12, che: 12}, gifts: {}}));
Story.reload();
eq('migrate v', Story.state.v, 3);
eq('migrate keeps tea', Story.ending(), 'tea');
eq('migrate does not reopen first', Story.scene('epi').endingId, 'tea');

// side story still due while waiting on the cafe gate
fresh();
finishChapters();
eq('side while short of 51', Story.nextScene(xOf(10, 5)), 's-city1');

// 100+ Melbourne cafes
const dataCtx = {window: {}, console};
dataCtx.globalThis = dataCtx;
vm.createContext(dataCtx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), dataCtx, {filename: 'data.js'});
const cafes = dataCtx.window.SEED_CAFES || [];
eq('seed count', cafes.length >= 100, true);
const ids = new Set(cafes.map(c => c.id));
eq('unique ids', ids.size, cafes.length);
eq('melbourne-ish', cafes.every(c => /VIC|Melbourne|Fitzroy|Richmond|Brunswick|Carlton|Collingwood|North Melbourne|South Yarra|Hawthorn|Cremorne|Balaclava|West Melbourne|South Melbourne|Prahran|Abbotsford|Windsor|Armadale|St Kilda|Docklands|Parkville|Flemington|Kensington|Footscray|Seddon|Yarraville|Port Melbourne|Albert Park|Middle Park|Elwood|Elsternwick|Caulfield|Malvern|Toorak|Southbank|Carlton North|Fitzroy North|Clifton Hill|Northcote|Thornbury|Preston|Coburg|Pascoe Vale|Moonee Ponds|Ascot Vale|Travancore|East Melbourne|West Melbourne|Melbourne/.test((c.suburb || '') + ' ' + (c.address || ''))), true);

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('teststory ok', cafes.length, 'cafes');
