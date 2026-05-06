import { readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const sourceRoot = join(workspaceRoot, 'src');

const shouldInclude = (path) =>
  path.endsWith('.ts')
  && !path.endsWith('.spec.ts')
  && !path.endsWith('.test.ts');

const collectFiles = (directory) => {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (shouldInclude(fullPath)) {
      files.push(relative(workspaceRoot, fullPath).replace(/\\/g, '/'));
    }
  }

  return files;
};

const files = collectFiles(sourceRoot);
const tempTsconfigPath = join(workspaceRoot, '.typecheck-frontend-ts.tmp.json');

writeFileSync(
  tempTsconfigPath,
  `${JSON.stringify({
    extends: resolve(workspaceRoot, '.nuxt/tsconfig.json'),
    files,
  }, null, 2)}\n`,
);

const result = spawnSync(
  'pnpm',
  ['exec', 'tsc', '-p', tempTsconfigPath, '--noEmit', '--pretty', 'false'],
  {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  },
);

rmSync(tempTsconfigPath, { force: true });
process.exit(result.status ?? 1);
