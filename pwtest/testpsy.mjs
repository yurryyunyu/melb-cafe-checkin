// Feeling-quiz pool. Run: node pwtest/testpsy.mjs
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
vm.runInContext(fs.readFileSync(path.join(root, 'psy.js'), 'utf8'), context, {filename: 'psy.js'});
const P = context.Psy;
const fail = [];
const eq = (name, got, want) => { if (got !== want) fail.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

eq('pool size', P.POOL.length, 100);
const asks = new Set(P.POOL.map(q => q.ask));
eq('unique asks', asks.size, 100);
P.POOL.forEach(q => {
  if (q.opts.length !== 3) fail.push(q.id + ' opts');
  q.opts.forEach(o => {
    if (!o.t || !o.line) fail.push(q.id + ' empty');
    if (o.c < 4 || o.c > 8) fail.push(q.id + ' coins ' + o.c);
  });
  if (/抑郁|焦虑症|诊断|疗程|创伤治疗/.test(q.ask + q.opts.map(o => o.t + o.line).join(''))) fail.push(q.id + ' clinical');
});
const a = P.pick('patricia'), b = P.pick('patricia'), c = P.pick('maker');
eq('stable pick', a.id, b.id);
if (a.ask === c.ask && a.id === c.id) fail.push('different cafes collapsed');
eq('due before', P.due('patricia'), true);
eq('skip does not answer', P.recall('patricia'), null);
const ans = P.answer('patricia', 0);
eq('answered', ans && ans.i, 0);
eq('line', !!(ans && ans.line), true);
eq('due after', P.due('patricia'), false);
eq('no double', P.answer('patricia', 1), null);
eq('recall sticks', P.recall('patricia').t, a.opts[0].t);
eq('other cafe still due', P.due('maker'), true);
P.reload();
eq('persisted', P.recall('patricia').i, 0);
const saved = JSON.parse(store.get('mcc.psy'));
eq('save version', saved.v, 1);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('testpsy ok', P.POOL.length);
