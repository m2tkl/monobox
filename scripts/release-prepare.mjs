import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const packageJsonPath = path.join(repoRoot, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const nextVersion = await resolveNextVersion(process.argv[2], packageJson.version)

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

async function resolveNextVersion(cliVersion, currentVersion) {
  if (cliVersion) {
    if (!isValidSemver(cliVersion)) {
      console.error(`Invalid version: ${cliVersion}`)
      process.exit(1)
    }

    return cliVersion
  }

  const latestTags = getLines(runAndRead('git', ['tag', '--sort=-creatordate'], repoRoot)).slice(0, 5)
  const suggestedVersion = bumpPatch(currentVersion)

  console.log(`Current version: ${currentVersion}`)
  console.log(`Suggested next version: ${suggestedVersion}`)
  console.log('')
  console.log('Latest 5 tags:')

  if (latestTags.length === 0) {
    console.log('(no tags found)')
  } else {
    for (const [index, tag] of latestTags.entries()) {
      console.log(`${index + 1}. ${tag}`)
    }
  }

  console.log('')

  const rl = readline.createInterface({ input, output })

  try {
    const answer = await rl.question(`Next version [${suggestedVersion}]: `)
    const version = answer.trim() || suggestedVersion

    if (!isValidSemver(version)) {
      console.error(`Invalid version: ${version}`)
      process.exit(1)
    }

    return version
  } finally {
    rl.close()
  }
}

function bumpPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)

  if (!match) {
    return version
  }

  const [, major, minor, patch] = match
  return `${major}.${minor}.${Number(patch) + 1}`
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

function getLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
