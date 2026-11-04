import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../../portal/index.html',import.meta.url),'utf8');
for(const role of ['consumer','manager','rider','dispatch','transport','shipment','warehouse','admin'])assert.ok(html.includes(`/${role}/`));
assert.ok(html.includes('Development preview'));console.log('All eight workspace links and preview label present');
