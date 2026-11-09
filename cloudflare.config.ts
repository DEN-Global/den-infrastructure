import {bindings,defineConfig} from 'cf/config';
const localId='00000000-0000-0000-0000-000000000000';
export default defineConfig(({mode})=>{
 if(!['development','preview'].includes(mode??''))throw new Error('This isolated artifact supports --mode development or --mode preview only. Production is not configured.');
 const development=mode==='development';
 let origin='http://localhost:8788',databaseId=localId,primary='disabled-preview-admin',name='den-global-preview-development';
 if(!development){
  databaseId=process.env.DEN_PREVIEW_D1_ID??'';origin=process.env.DEN_PREVIEW_ORIGIN??'';primary=process.env.DEN_PREVIEW_ADMIN_MODE==='disabled'?'disabled-preview-admin':process.env.DEN_PREVIEW_PRIMARY_ADMIN_ID??'';name=process.env.DEN_PREVIEW_WORKER_NAME??'';
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(databaseId)||databaseId===localId)throw new Error('DEN_PREVIEW_D1_ID must be an explicitly created, verified isolated preview database UUID. No provisioning fallback exists.');
  const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin)throw new Error('DEN_PREVIEW_ORIGIN must be an exact HTTPS origin, without a trailing slash.');
  if(!['disabled','enabled'].includes(process.env.DEN_PREVIEW_ADMIN_MODE??''))throw new Error('Set DEN_PREVIEW_ADMIN_MODE=disabled for an isolated preview without administrator authority, or enabled with an approved enrolled Primary user.');
  if(!/^[A-Za-z0-9_-]{87}$/.test(process.env.DEN_PREVIEW_VAPID_PUBLIC_KEY??''))throw new Error('Set DEN_PREVIEW_VAPID_PUBLIC_KEY to the public key paired with the VAPID_PRIVATE_KEY secret.');
  if(process.env.DEN_PREVIEW_ADMIN_MODE==='enabled'&&(!primary||primary==='not-provisioned'||primary==='disabled-preview-admin'))throw new Error('Enabled administration requires DEN_PREVIEW_PRIMARY_ADMIN_ID of the approved enrolled preview administrator.');
  if(!/^den-global-preview(?:-[a-z0-9-]+)?$/.test(name))throw new Error('DEN_PREVIEW_WORKER_NAME must start den-global-preview and be an isolated preview Worker.');
 }
 return {worker:{name,entrypoint:'./.preview/backend/src/app.js',compatibilityDate:'2026-11-04',compatibilityFlags:['nodejs_compat'],
  assets:{htmlHandling:'auto-trailing-slash',notFoundHandling:'none',runWorkerFirst:['/api/*']},
  observability:{enabled:true,redactQueryString:true,logs:{enabled:true,headSamplingRate:1},traces:{enabled:true,headSamplingRate:0.01}},
  env:{DB:bindings.d1({id:databaseId}),ASSETS:bindings.assets(),MFA_ENCRYPTION_KEY:bindings.secret(),VAPID_PRIVATE_KEY:bindings.secret(),
   VAPID_PUBLIC_KEY:bindings.text(development?'':process.env.DEN_PREVIEW_VAPID_PUBLIC_KEY),VAPID_SUBJECT:bindings.text('mailto:security@den.global'),
   APP_ORIGIN:bindings.text(origin),PRIMARY_ADMIN_ID:bindings.text(primary),DEN_SANDBOX_PAYMENTS:bindings.text('false')}
 }};
});
