import {cp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),output=resolve(import.meta.dirname,'../.preview/assets');
await mkdir(output,{recursive:true});
for(const role of ['consumer','manager','rider','dispatch','transport','shipment','warehouse','admin','pets']){
 const source=join(root,`den-${role}`,'dist');await readFile(join(source,'index.html'));await cp(source,join(output,role),{recursive:true});
 const index=join(output,role,'index.html'),html=await readFile(index,'utf8');
 const installTags='<meta name="theme-color" content="#315f3d"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="DEN Global"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/den-app-icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/den-app-icon-192.png">';
 await writeFile(index,html.replace('</head>',`${installTags}</head>`));
 if(role==='warehouse')await cp(join(source,'assets'),join(output,'assets'),{recursive:true});
}
await cp(resolve(import.meta.dirname,'../portal'),output,{recursive:true});
const manifest={contractVersion:'1.0.0',files:{}};
async function walk(directory,prefix=''){for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name),name=prefix+entry.name;if(entry.isDirectory())await walk(path,name+'/');else manifest.files[name]=createHash('sha256').update(await readFile(path)).digest('hex');}}
await walk(output);await writeFile(resolve(output,'../manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Packed ${Object.keys(manifest.files).length} static files for nine workspaces. No deployment performed.`);
