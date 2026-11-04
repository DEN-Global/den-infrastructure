import {defineConfig} from 'vite';
import {cloudflare} from '@cloudflare/vite-plugin';
// Public-directory copying preserves each application's independently hashed assets and base path.
export default defineConfig({publicDir:'.preview/assets',plugins:[cloudflare()]});
