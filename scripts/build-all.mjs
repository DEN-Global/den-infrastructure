import {spawnSync} from 'node:child_process';
const roles=['consumer','manager','rider','dispatch','transport','shipment','warehouse','admin'];
for(const role of roles){const result=spawnSync('npm',['run','build'],{cwd:new URL(`../../den-${role}`,import.meta.url),stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
console.log('Start den-backend with npm run dev, then open http://localhost:8787');
