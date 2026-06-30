import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Bundle api/_server.ts with esbuild.
// We intentionally do NOT use --packages=external: dependencies are bundled so
// ESM-only packages (e.g. jose) are transpiled into the CommonJS output. This
// avoids a runtime require() of an ES module, which throws ERR_REQUIRE_ESM on
// Node runtimes older than 22.12 / 20.19 (e.g. Vercel's default).
// Only optional native/edge bindings that aren't installed are kept external.
execSync(
  'node_modules/.bin/esbuild api/_server.ts ' +
  '--platform=node ' +
  '--bundle ' +
  '--format=cjs ' +
  '--outfile=api/server.js ' +
  '--external:pg-native ' +
  '--external:pg-cloudflare ' +
  '--external:cloudflare:sockets ' +
  '--alias:@shared=./shared',
  { stdio: 'inherit' }
);

// Append the module.exports fix so Vercel gets the Express app directly
const fs = await import('fs');
const content = fs.readFileSync('api/server.js', 'utf8');
fs.writeFileSync('api/server.js', content + '\nmodule.exports = module.exports.default || module.exports;\n');

console.log('Server bundle built successfully');
