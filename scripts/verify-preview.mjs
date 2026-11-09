import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {resolve,join} from 'node:path';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const root=resolve(import.meta.dirname,'..'),built=join(root,'.cloudflare/output/v0/workers/default');
const cfg=JSON.parse(await readFile(join(built,'worker.config.json'),'utf8'));
assert.equal(cfg.env.DB.id,'00000000-0000-0000-0000-000000000000','Verify the development build only; no remote binding is used by this smoke test.');
assert.deepEqual(cfg.assets.runWorkerFirst,['/api/*']);assert.equal(cfg.env.DEN_SANDBOX_PAYMENTS.value,'false');assert.equal(cfg.env.ASSETS.type,'assets');assert.equal(cfg.env.PRIMARY_ADMIN_ID.value,'disabled-preview-admin');
const backend=join(root,'.preview/backend'),provenance=JSON.parse(await readFile(join(backend,'PROVENANCE.json'),'utf8'));
for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(await readFile(join(backend,file))).digest('hex'),hash,'Backend snapshot drift '+file);
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:join(built,'bundle/index.js'),compatibilityDate:cfg.compatibilityDate,compatibilityFlags:cfg.compatibilityFlags,
 d1Databases:{DB:'den-isolated-preview-runtime'},bindings:{APP_ORIGIN:'http://localhost:8788',MFA_ENCRYPTION_KEY:randomBytes(32).toString('base64'),PRIMARY_ADMIN_ID:cfg.env.PRIMARY_ADMIN_ID.value,DEN_SANDBOX_PAYMENTS:'false'},
 assets:{directory:join(built,'assets'),binding:'ASSETS',run_worker_first:['/api/*'],routerConfig:{has_user_worker:true}}}));
try {
 const db=await mf.getD1Database('DB'),parser=new DatabaseSync(':memory:');
 try{for(const filename of (await readdir(join(backend,'migrations'))).filter(f=>f.endsWith('.sql')).sort()){let remaining=await readFile(join(backend,'migrations',filename),'utf8');while(remaining.trim()){const sql=parser.prepare(remaining).sourceSQL;parser.exec(sql);await db.prepare(sql).run();remaining=remaining.slice(sql.length);}}}finally{parser.close();}
 for(const path of ['/','/consumer/','/manager/','/rider/','/dispatch/','/transport/','/shipment/','/warehouse/','/admin/','/pets/']){const result=await mf.dispatchFetch('http://localhost:8788'+path);assert.equal(result.status,200,path);assert.match(result.headers.get('content-type'),/text\/html/);assert.equal(result.headers.get('x-content-type-options'),'nosniff',path);assert.match(result.headers.get('content-security-policy')??'',/frame-ancestors 'none'/);assert.match(await result.text(),/DEN/i);}
 let cookie='',csrf='';
 async function request(path,method='GET',body){const result=await mf.dispatchFetch('http://localhost:8788'+path,{method,headers:{origin:'http://localhost:8788','content-type':'application/json',cookie,'x-csrf-token':csrf},...(body?{body:JSON.stringify(body)}:{})});if(result.headers.has('set-cookie'))cookie=result.headers.get('set-cookie').split(';')[0];assert.match(result.headers.get('content-type'),/application\/json/,`API route ${path} returned ${result.status}: ${await result.clone().text()}`);const data=await result.json();if(data.csrfToken)csrf=data.csrfToken;return {status:result.status,data};}
 assert.equal((await request('/api/health')).data.status,'ok');
 assert.equal((await request('/api/auth/me')).status,401);
 assert.equal((await request('/api/auth/register','POST',{name:'Isolated runtime user',email:'artifact-runtime@example.test',password:'Artifact-runtime-local-only-2026!'})).status,201);
 assert.equal((await request('/api/auth/login','POST',{email:'artifact-runtime@example.test',password:'Artifact-runtime-local-only-2026!'})).status,200);
 assert.equal((await request('/api/auth/me')).status,200);
 assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM den_admin_accounts').first()).total,0,'Registering a preview user never bootstraps an administrator');
 assert.equal((await request('/api/platform/admin/reviews')).status,403);
 assert.equal((await request('/api/admin/trade','POST',{enabled:true,revision:0,countries:[]})).status,403);
 assert.deepEqual((await request('/api/platform/orders')).data.orders,[]);
 assert.equal((await request('/api/platform/orders','POST',{})).status,503);
 assert.equal((await request('/api/international/bookings','POST',{})).status,423);
 assert.equal((await request('/api/services/wallet')).data.liveMoneyEnabled,false);
 console.log('Isolated workerd smoke passed: portal + eight workspaces, native ASSETS, D1 migrations, real scrypt/session/CSRF, sandbox checkout disabled, trade locked, wallet disabled. No remote access.');
}finally{await mf.dispose();}
