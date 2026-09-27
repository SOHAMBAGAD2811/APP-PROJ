import esbuild from 'esbuild';
import fs from 'fs';

async function build() {
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true });
  }

  await esbuild.build({
    entryPoints: ['server/api_entry.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    outfile: 'api/index.js',
  });

  fs.copyFileSync('api/index.js', 'api/[...slug].js');
  console.log('✅ Serverless API bundled successfully: api/index.js and api/[...slug].js');
}

build().catch((err) => {
  console.error('API build failed:', err);
  process.exit(1);
});
