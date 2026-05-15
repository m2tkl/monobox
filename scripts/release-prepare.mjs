import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const nextVersion = process.argv[2]
const packageJsonPath = path.join(repoRoot, 'package.json')

if (!nextVersion) {
  console.error('Usage: npm run release:prepare -- <version>')
  process.exit(1)
}

if (!isValidSemver(nextVersion)) {
  console.error(`Invalid version: ${nextVersion}`)
  process.exit(1)
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

if (packageJson.version !== nextVersion) {
  run('npm', ['version', nextVersion, '--no-git-tag-version'], repoRoot)
} else {
  console.log(`package.json is already at ${nextVersion}; skipping npm version`)
}

updateTauriVersion(
  path.join(repoRoot, 'src-tauri', 'Cargo.toml'),
  /^version = ".*"$/m,
  `version = "${nextVersion}"`,
)
updateJsonVersion(path.join(repoRoot, 'src-tauri', 'tauri.conf.json'), nextVersion)
updateCargoLockVersion(path.join(repoRoot, 'src-tauri', 'Cargo.lock'), nextVersion)

console.log(`Prepared release ${nextVersion}`)

function isValidSemver(version) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
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

function updateTauriVersion(filePath, pattern, replacement) {
  const contents = readFileSync(filePath, 'utf8')
  const match = contents.match(pattern)

  if (!match) {
    console.error(`Could not update version in ${path.relative(repoRoot, filePath)}`)
    process.exit(1)
  }

  if (match[0] === replacement) {
    return
  }

  const nextContents = contents.replace(pattern, replacement)
  writeFileSync(filePath, nextContents)
}

function updateJsonVersion(filePath, version) {
  const contents = readFileSync(filePath, 'utf8')
  const json = JSON.parse(contents)
  json.version = version
  writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
}

function updateCargoLockVersion(filePath, version) {
  const contents = readFileSync(filePath, 'utf8')
  const pattern = /(\[\[package\]\]\nname = "monobox"\nversion = ")([^"]+)(")/m
  const match = contents.match(pattern)

  if (!match) {
    console.error(`Could not update version in ${path.relative(repoRoot, filePath)}`)
    process.exit(1)
  }

  if (match[2] === version) {
    return
  }

  const nextContents = contents.replace(pattern, `$1${version}$3`)
  writeFileSync(filePath, nextContents)
}
