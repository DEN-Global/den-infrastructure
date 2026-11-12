import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative} from 'node:path';

// A UI-only release starts from a verified production source snapshot. This
// deliberately avoids the unfinished local backend/Supabase migration.
const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
if(!args.includes('--base')||!args.includes('--out'))throw Error('Usage: node scripts/pack-ui-refresh.mjs --base VERIFIED_RELEASE --out OUTPUT');
const base=resolve(value('--base')),out=resolve(value('--out')),project=resolve(import.meta.dirname,'../..');
if(base===out||out.startsWith(base+'/')||base.startsWith(out+'/')||out===project||project.startsWith(out+'/'))throw Error('Output must be a separate disposable release directory.');
await readFile(join(base,'api/index.js'));await readFile(join(base,'vercel.json'));
async function backendHashes(root){
 const hashes={};
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())await walk(file);else hashes[relative(root,file)]=createHash('sha256').update(await readFile(file)).digest('hex');}}
 for(const name of ['api','src','vendor'])await walk(join(root,name));
 for(const name of ['package.json','vercel.json'])hashes[name]=createHash('sha256').update(await readFile(join(root,name))).digest('hex');
 return hashes;
}
const before=await backendHashes(base);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(base,out,{recursive:true,filter:path=>!/(^|\/)node_modules(\/|$)|(^|\/)\.env[^/]*$/.test(path)});
const roles=['consumer','manager','rider','dispatch','transport','shipment','warehouse','admin','pets'];
for(const role of roles){
 const source=join(project,`den-${role}`,'dist');await readFile(join(source,'index.html'));
 await rm(join(out,role),{recursive:true,force:true});await cp(source,join(out,role),{recursive:true});
 const index=join(out,role,'index.html'),html=await readFile(index,'utf8');
 const install='<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="DEN Global"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/den-app-icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/den-app-icon-192.png">';
 await writeFile(index,html.replace(/#102b26|#315f3d/g,'#103b37').replace('</head>',`${install}</head>`));
}
await cp(join(project,'den-infrastructure/portal/manifest.webmanifest'),join(out,'manifest.webmanifest'));
const after=await backendHashes(out);
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Backend or configuration changed during UI packaging.');
await writeFile(join(out,'ui-release-verification.json'),JSON.stringify({workspaces:roles,backendUnchanged:true,backendFiles:before},null,2)+'\n');
console.log(`Prepared ${roles.length} workspaces. ${Object.keys(before).length} production backend/config files are byte-for-byte unchanged.`);
