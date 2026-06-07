import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const releaseFiles = [
  'package.json',
  'package-lock.json',
  path.join('src-tauri', 'Cargo.toml'),
  path.join('src-tauri', 'Cargo.lock'),
  path.join('src-tauri', 'tauri.conf.json'),
]

const args = process.argv.slice(2)

ensureCleanWorktree()

run('npm', ['run', 'release:prepare', '--', ...args], repoRoot)

const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
const tagName = `v${packageJson.version}`

run('git', ['add', ...releaseFiles], repoRoot)

if (hasStagedChanges()) {
  run('git', ['commit', '-m', `chore: release ${tagName}`], repoRoot)
} else {
  console.log('No version file changes to commit; creating tag from current HEAD')
}

ensureCleanWorktree()
run('npm', ['run', 'release:tag'], repoRoot)

console.log('')
console.log(`Release commit and local tag are ready: ${tagName}`)
console.log('Push the tag separately with: npm run release:push-tag')

function ensureCleanWorktree() {
  const status = getLines(runAndRead('git', ['status', '--short'], repoRoot))

  if (status.length === 0) {
    return
  }

  console.error('Working tree must be clean before running the release flow')
  console.error('Commit or stash changes first:')
  for (const line of status) {
    console.error(`  ${line}`)
  }
  process.exit(1)
}

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  return result.status === 1
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runAndRead(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '')
    process.exit(result.status ?? 1)
  }

  return result.stdout ?? ''
}

function getLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
