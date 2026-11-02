/**
 * `astro preview` drives wrangler through the config file that the Cloudflare
 * adapter generates at `.wrangler/deploy/config.json`. `npm run build` removes
 * that file so the Pages deployment (which uses `dist/client/_worker.js`) is not
 * ambiguous, so `npm run preview` recreates it before starting.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), '.wrangler/deploy/config.json');

await mkdir(path.dirname(file), { recursive: true });
await writeFile(
  file,
  JSON.stringify({
    configPath: '../../dist/server/wrangler.json',
    auxiliaryWorkers: [],
    prerenderWorkerConfigPath: '../../dist/server/.prerender/wrangler.json',
  }),
  'utf8',
);

console.log('[preview] Restored .wrangler/deploy/config.json');
