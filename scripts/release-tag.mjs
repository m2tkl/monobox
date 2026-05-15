import { readFileSync } from 'node:fs'
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
const suggestedTag = `v${packageJson.version}`
const latestTags = getLines(runAndRead('git', ['tag', '--sort=-creatordate'], repoRoot)).slice(0, 5)
const headSummary = runAndRead('git', ['show', '--stat', '--oneline', '--no-patch', 'HEAD'], repoRoot).trim()

console.log(`Current HEAD: ${headSummary}`)
console.log(`Suggested tag: ${suggestedTag}`)
console.log('')
console.log('Latest 5 tags:')

for (const [index, tag] of latestTags.entries()) {
  console.log(`${index + 1}. ${tag}`)
}

console.log('')

const rl = readline.createInterface({ input, output })

try {
  const answer = await rl.question(`Tag name [${suggestedTag}]: `)
  const tagName = answer.trim() || suggestedTag

  validateTagName(tagName)

  if (tagExists(tagName)) {
    console.error(`Tag already exists: ${tagName}`)
    process.exit(1)
  }

  run('git', ['tag', tagName], repoRoot)
  console.log(`Created tag ${tagName}`)
} finally {
  rl.close()
}

function validateTagName(tagName) {
  if (!tagName) {
    console.error('Tag name is required')
    process.exit(1)
  }

  const result = spawnSync('git', ['check-ref-format', '--allow-onelevel', `refs/tags/${tagName}`], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  if (result.status !== 0) {
    console.error(`Invalid tag name: ${tagName}`)
    process.exit(1)
  }
}

function tagExists(tagName) {
  const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`], {
    cwd: repoRoot,
    stdio: 'ignore',
  })
  return result.status === 0
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
