import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const remoteName = args.find((arg) => arg !== '--dry-run') || 'origin'
const tags = getLines(runAndRead('git', ['tag', '--sort=-creatordate'], repoRoot)).reverse()

if (tags.length === 0) {
  console.error('No local tags found')
  process.exit(1)
}

console.log(`Remote: ${remoteName}`)
console.log('Select a tag to push:')

for (const tag of tags) {
  console.log(tag)
}

console.log('')

const rl = readline.createInterface({ input, output })

try {
  const answer = await rl.question('Tag name: ')
  const tagName = resolveTag(answer.trim(), tags)

  const pushArgs = ['push']
  if (isDryRun) {
    pushArgs.push('--dry-run')
  }
  pushArgs.push(remoteName, tagName)

  run('git', pushArgs, repoRoot)
  console.log(`${isDryRun ? 'Checked push for' : 'Pushed'} ${tagName} to ${remoteName}`)
} finally {
  rl.close()
}

function resolveTag(answer, knownTags) {
  if (!answer) {
    console.error('Tag name is required')
    process.exit(1)
  }

  if (knownTags.includes(answer)) {
    return answer
  }

  console.error(`Unknown tag: ${answer}`)
  process.exit(1)
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
