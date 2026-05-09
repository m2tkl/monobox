import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const targetFiles = process.argv.slice(2);

if (targetFiles.length === 0) {
  console.error('Expected at least one Vue file path.');
  process.exit(1);
}

const tempTsconfigPath = join(workspaceRoot, '.typecheck-frontend-vue-file.tmp.json');

writeFileSync(
  tempTsconfigPath,
  `${JSON.stringify({
    extends: resolve(workspaceRoot, '.nuxt/tsconfig.json'),
    files: targetFiles,
  }, null, 2)}\n`,
);

const result = spawnSync(
  'npm',
  ['exec', '--', 'vue-tsc', '-p', tempTsconfigPath, '--noEmit', '--pretty', 'false'],
  {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  },
);

rmSync(tempTsconfigPath, { force: true });

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
const matchingLines = output
  .split('\n')
  .filter(line => targetFiles.some(file => line.includes(file)));

if (matchingLines.length > 0) {
  console.error(matchingLines.join('\n'));
  process.exit(1);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(0);
