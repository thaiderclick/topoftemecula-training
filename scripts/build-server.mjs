import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Bundle api/_server.ts with esbuild
execSync(
  'node_modules/.bin/esbuild api/_server.ts ' +
  '--platform=node ' +
  '--packages=external ' +
  '--bundle ' +
  '--format=cjs ' +
  '--outfile=api/server.js ' +
  '--alias:@shared=./shared',
  { stdio: 'inherit' }
);

// Append the module.exports fix so Vercel gets the Express app directly
const fs = await import('fs');
const content = fs.readFileSync('api/server.js', 'utf8');
fs.writeFileSync('api/server.js', content + '\nmodule.exports = module.exports.default || module.exports;\n');

console.log('Server bundle built successfully');
