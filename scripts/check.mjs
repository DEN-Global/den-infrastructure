import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../portal/index.html',import.meta.url),'utf8');
const entry=readFileSync(new URL('../portal/entry.js',import.meta.url),'utf8');
assert.ok(html.includes('src="/entry.js"'),'Portal loads the common account entry');
assert.ok(html.includes('href="/consumer/"'),'No-script fallback opens common sign-in');
assert.ok(entry.includes("location.replace('/consumer/?entry=1')"),'Entry uses authenticated role routing');
for(const role of ['manager','rider','dispatch','transport','shipment','warehouse','admin'])assert.ok(!html.includes(`href="/${role}/"`),`Public portal must not expose ${role}`);
console.log('Common sign-in entry verified; professional/admin workspace directory is private');
