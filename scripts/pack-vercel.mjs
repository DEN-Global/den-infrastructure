import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'.vercel-release'),backend=resolve(root,'../den-backend');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(join(root,'.preview/assets'),out,{recursive:true});
await rm(join(out,'_headers'),{force:true});
// The screenshot gallery is optional documentation, not part of the product.
await cp(resolve(root,'../den-docs/preview'),join(out,'design-preview'),{recursive:true}).catch(()=>{});

// The API runs as a Vercel Node function backed by PostgreSQL (Supabase).
await cp(join(backend,'api'),join(out,'api'),{recursive:true});
await cp(join(backend,'src'),join(out,'src'),{recursive:true});
// src/ imports the shared domain modules from ../vendor (chat, tracking, payments, wallet, notifications).
await cp(join(backend,'vendor'),join(out,'vendor'),{recursive:true});
await cp(join(backend,'migrations/postgres'),join(out,'migrations/postgres'),{recursive:true});
const backendPackage=JSON.parse(await readFile(join(backend,'package.json'),'utf8'));
await writeFile(join(out,'package.json'),JSON.stringify({
  name:'den-global',
  private:true,
  type:'module',
  engines:backendPackage.engines,
  scripts:{'db:migrate':'node scripts/migrate-postgres.mjs'},
  dependencies:backendPackage.dependencies,
},null,2)+'\n');
await mkdir(join(out,'scripts'),{recursive:true});
await cp(join(backend,'scripts/migrate-postgres.mjs'),join(out,'scripts/migrate-postgres.mjs'));

const raw=await readFile(join(root,'portal/_headers'),'utf8');
const security=raw.split('\n').filter(l=>l.startsWith('  ')).map(l=>{const i=l.indexOf(':');return {key:l.slice(2,i),value:l.slice(i+1).trim()};});
await writeFile(join(out,'vercel.json'),JSON.stringify({
  $schema:'https://openapi.vercel.sh/vercel.json',
  framework:null,
  buildCommand:null,
  // Without a framework Vercel gives each api/ file its own function, so one
  // entry point serves every API path.
  rewrites:[{source:'/api/:path*',destination:'/api/index'}],
  headers:[
    {source:'/(.*)',headers:security},
    {source:'/api/:path*',headers:[
      {key:'Cache-Control',value:'private, no-store'},
      {key:'Vercel-CDN-Cache-Control',value:'no-store'},
      {key:'CDN-Cache-Control',value:'no-store'},
    ]},
  ],
},null,2)+'\n');
await writeFile(join(out,'.vercelignore'),'.env*\n.vercel/\n.git/\n');
if((await readFile(join(out,'vercel.json'),'utf8')).includes('workers.dev'))throw new Error('RELEASE_STILL_POINTS_AT_A_WORKER');
console.log('Prepared Vercel release: nine workspaces, screenshot gallery, same-origin API function on PostgreSQL. No local database or secrets copied.');
