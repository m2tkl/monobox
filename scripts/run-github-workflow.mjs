import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const workflows = {
  'build-test': {
    file: 'buildTest.yaml',
    name: 'Build test',
  },
  release: {
    file: 'release.yaml',
    name: 'Create release',
    tagInput: true,
  },
}

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  printHelp()
  process.exit(0)
}

const options = parseArgs(args)
const workflow = resolveWorkflow(options.workflow)
const ref = options.ref ?? getCurrentBranch()

ensureGh()

if (workflow.tagInput && !options.fields.tag_name) {
  options.fields.tag_name = await promptTagName(options.tagName)
}

const ghArgs = ['workflow', 'run', workflow.file, '--ref', ref]

for (const [name, value] of Object.entries(options.fields)) {
  ghArgs.push('-f', `${name}=${value}`)
}

run('gh', ghArgs, repoRoot)

console.log(`Triggered ${workflow.name} (${workflow.file}) on ${ref}`)

if (options.watch) {
  await wait(3000)
  const runId = getLatestRunId(workflow.file, ref)
  console.log(`Watching run: ${runId}`)
  run('gh', ['run', 'watch', runId], repoRoot)
}

function parseArgs(argv) {
  const parsed = {
    fields: {},
    ref: undefined,
    tagName: undefined,
    watch: true,
    workflow: undefined,
  }

  const positionals = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--ref') {
      parsed.ref = readValue(argv, index, arg)
      index += 1
      continue
    }

    if (arg.startsWith('--ref=')) {
      parsed.ref = arg.slice('--ref='.length)
      continue
    }

    if (arg === '--tag') {
      parsed.tagName = readValue(argv, index, arg)
      parsed.fields.tag_name = parsed.tagName
      index += 1
      continue
    }

    if (arg.startsWith('--tag=')) {
      parsed.tagName = arg.slice('--tag='.length)
      parsed.fields.tag_name = parsed.tagName
      continue
    }

    if (arg === '-f' || arg === '--field') {
      addField(parsed.fields, readValue(argv, index, arg))
      index += 1
      continue
    }

    if (arg.startsWith('-f=')) {
      addField(parsed.fields, arg.slice('-f='.length))
      continue
    }

    if (arg.startsWith('--field=')) {
      addField(parsed.fields, arg.slice('--field='.length))
      continue
    }

    if (arg === '--watch') {
      parsed.watch = true
      continue
    }

    if (arg === '--no-watch') {
      parsed.watch = false
      continue
    }

    positionals.push(arg)
  }

  parsed.workflow = positionals[0]

  if (parsed.workflow === 'release' && positionals[1] && !parsed.fields.tag_name) {
    parsed.fields.tag_name = positionals[1]
  }

  return parsed
}

function resolveWorkflow(workflowName) {
  if (!workflowName) {
    console.error('Workflow is required')
    console.error('Available workflows:')
    for (const [key, workflow] of Object.entries(workflows)) {
      console.error(`  ${key}: ${workflow.name} (${workflow.file})`)
    }
    process.exit(1)
  }

  const workflow = workflows[workflowName]

  if (workflow) {
    return workflow
  }

  console.error(`Unknown workflow: ${workflowName}`)
  console.error(`Use one of: ${Object.keys(workflows).join(', ')}`)
  process.exit(1)
}

async function promptTagName(tagName) {
  if (tagName) {
    return tagName
  }

  const suggestedTagName = getSuggestedTagName()
  const rl = readline.createInterface({ input, output })

  try {
    const answer = await rl.question(`Tag name [${suggestedTagName}]: `)
    return answer.trim() || suggestedTagName
  } finally {
    rl.close()
  }
}

function getSuggestedTagName() {
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
  return `v${packageJson.version}`
}

function getCurrentBranch() {
  return runAndRead('git', ['branch', '--show-current'], repoRoot).trim() || 'main'
}

function getLatestRunId(workflowFile, branch) {
  const stdout = runAndRead(
    'gh',
    [
      'run',
      'list',
      '--workflow',
      workflowFile,
      '--branch',
      branch,
      '--limit',
      '1',
      '--json',
      'databaseId',
      '--jq',
      '.[0].databaseId',
    ],
    repoRoot,
  ).trim()

  if (!stdout) {
    console.error(`Could not find a run for ${workflowFile} on ${branch}`)
    process.exit(1)
  }

  return stdout
}

function ensureGh() {
  const result = spawnSync('gh', ['auth', 'status'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function addField(fields, value) {
  const separatorIndex = value.indexOf('=')

  if (separatorIndex <= 0) {
    console.error(`Invalid field: ${value}`)
    console.error('Fields must be key=value')
    process.exit(1)
  }

  const name = value.slice(0, separatorIndex)
  const fieldValue = value.slice(separatorIndex + 1)

  fields[name] = fieldValue
}

function readValue(argv, index, flag) {
  const value = argv[index + 1]

  if (!value) {
    console.error(`${flag} requires a value`)
    process.exit(1)
  }

  return value
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
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

function printHelp() {
  console.log(`Run GitHub Actions workflows with gh.

Usage:
  npm run action:build-test -- [--ref <branch>] [--no-watch]
  npm run action:release -- [tag_name] [--ref <branch>] [--no-watch]
  npm run action:workflow -- <build-test|release> [options]

Options:
  --ref <branch>       Git ref to run the workflow on. Defaults to current branch.
  --tag <tag_name>     Release tag_name input. Only used by the release workflow.
  -f, --field k=v      Extra workflow_dispatch input.
  --watch              Watch the latest run after triggering. Default.
  --no-watch           Trigger only.
`)
}
