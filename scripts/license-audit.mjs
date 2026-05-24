import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'package.json');
const cargoTomlPath = path.join(repoRoot, 'src-tauri', 'Cargo.toml');
const cargoLockPath = path.join(repoRoot, 'src-tauri', 'Cargo.lock');
const iconMapPath = path.join(repoRoot, 'src', 'utils', 'icon.ts');
const tauriIconDir = path.join(repoRoot, 'src-tauri', 'icons');
const tauriIconReadmePath = path.join(tauriIconDir, 'README.md');
const thirdPartyNoticesPath = path.join(repoRoot, 'legal', 'THIRD_PARTY_NOTICES.md');
const apacheLicensePath = path.join(repoRoot, 'legal', 'LICENSES', 'APACHE-2.0.txt');
const mitLicensePath = path.join(repoRoot, 'legal', 'LICENSES', 'MIT.txt');
const outputPath = path.join(repoRoot, 'docs', 'license-audit.md');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const cargoLock = fs.readFileSync(cargoLockPath, 'utf8');

const LICENSE_FILE_NAMES = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt',
  'COPYING',
  'NOTICE',
  'NOTICE.md',
  'NOTICE.txt',
];

function toArray(entries) {
  return Object.entries(entries || {}).sort(([a], [b]) => a.localeCompare(b));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function firstExistingFile(dirPath, fileNames) {
  for (const fileName of fileNames) {
    const fullPath = path.join(dirPath, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function extractTomlString(source, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`^${escaped}\\s*=\\s*"([^"]+)"`, 'm'));
  return match?.[1] ?? '';
}

function extractDirectRustDeps(source) {
  const sections = new Set([
    'dependencies',
    'build-dependencies',
  ]);
  const deps = [];
  let currentSection = '';

  for (const line of source.split('\n')) {
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const isTargetDependencySection = /^target\.".+?"\.(dependencies|build-dependencies)$/.test(currentSection);
    const isSupportedSection = sections.has(currentSection) || isTargetDependencySection;
    if (!isSupportedSection) continue;

    const depMatch = line.match(/^([A-Za-z0-9_-]+)\s*=/);
    if (!depMatch) continue;

    deps.push(depMatch[1]);
  }

  return [...new Set(deps)].sort((a, b) => a.localeCompare(b));
}

function extractCargoLockVersions(source) {
  const versions = new Map();
  const blocks = source.split('[[package]]').slice(1);

  for (const block of blocks) {
    const name = extractTomlString(block, 'name');
    const version = extractTomlString(block, 'version');
    if (!name || !version) continue;
    const existing = versions.get(name) || [];
    existing.push(version);
    versions.set(name, existing);
  }

  return versions;
}

function resolveRustPackageManifest(depName, version) {
  const registrySrcRoot = path.join(os.homedir(), '.cargo', 'registry', 'src');
  if (!fs.existsSync(registrySrcRoot)) return null;

  for (const registryDir of fs.readdirSync(registrySrcRoot)) {
    const manifestPath = path.join(registrySrcRoot, registryDir, `${depName}-${version}`, 'Cargo.toml');
    if (fs.existsSync(manifestPath)) {
      return manifestPath;
    }
  }

  return null;
}

function collectNpmRows() {
  const sections = [
    ['dependencies', packageJson.dependencies],
    ['devDependencies', packageJson.devDependencies],
  ];

  return sections.flatMap(([section, deps]) => {
    return toArray(deps).map(([name, requested]) => {
      const manifestPath = path.join(repoRoot, 'node_modules', name, 'package.json');
      const manifest = readJsonIfExists(manifestPath);
      const packageDir = path.dirname(manifestPath);
      const licenseFile = manifest ? firstExistingFile(packageDir, LICENSE_FILE_NAMES) : null;
      const effectiveLicense = manifest?.license || (licenseFile ? 'SEE LICENSE FILE' : 'UNKNOWN');

      const notes = [];
      if (!manifest) {
        notes.push('node_modules missing');
      } else if (!manifest.license && licenseFile) {
        notes.push(`package.json missing license field, but ${path.basename(licenseFile)} exists`);
      } else if (!manifest.license) {
        notes.push('license field missing');
      }

      return {
        ecosystem: section,
        name,
        requested,
        version: manifest?.version || 'MISSING',
        license: effectiveLicense,
        licenseFile: licenseFile ? path.relative(repoRoot, licenseFile) : '',
        notes: notes.join('; '),
      };
    });
  });
}

function collectRustRows() {
  const depNames = extractDirectRustDeps(cargoToml);
  const versionsByName = extractCargoLockVersions(cargoLock);

  return depNames.map((name) => {
    const versions = versionsByName.get(name) || [];
    const version = versions[0] || 'UNRESOLVED';
    const manifestPath = version === 'UNRESOLVED' ? null : resolveRustPackageManifest(name, version);
    const manifestText = manifestPath ? fs.readFileSync(manifestPath, 'utf8') : '';
    const license = manifestText ? (extractTomlString(manifestText, 'license') || '') : '';
    const licenseFile = manifestText ? extractTomlString(manifestText, 'license-file') : '';

    const notes = [];
    if (versions.length > 1) {
      notes.push(`multiple versions in Cargo.lock: ${versions.join(', ')}`);
    }
    if (!manifestPath) {
      notes.push('crate source not found in local cargo registry');
    }
    if (!license && licenseFile) {
      notes.push(`license-file=${licenseFile}`);
    }
    if (!license && !licenseFile) {
      notes.push('license metadata missing');
    }

    return {
      name,
      version,
      license: license || (licenseFile ? 'SEE LICENSE FILE' : 'UNKNOWN'),
      manifestPath: manifestPath ? path.relative(repoRoot, manifestPath) : '',
      notes: notes.join('; '),
    };
  });
}

function collectIconRows() {
  const iconMapSource = fs.readFileSync(iconMapPath, 'utf8');
  const carbonIcons = [...new Set([...iconMapSource.matchAll(/'((?:carbon):[^']+)'/g)].map((match) => match[1]))].sort();
  const tauriIcons = fs.existsSync(tauriIconDir)
    ? fs.readdirSync(tauriIconDir).filter((name) => fs.statSync(path.join(tauriIconDir, name)).isFile()).sort()
    : [];
  const tauriReadmeExists = fs.existsSync(tauriIconReadmePath);
  const tauriLicense = tauriReadmeExists ? 'Project-owned asset' : 'MANUAL REVIEW REQUIRED';
  const tauriNotes = tauriReadmeExists
    ? 'Repository README states these icons are original work generated for this project.'
    : 'Repository does not record origin/license for generated app icons. Confirm they are original work or replace with assets whose license is documented.';

  return [
    {
      asset: 'UI icons via Nuxt Icon / Iconify',
      source: '@iconify-json/carbon',
      license: 'Apache-2.0',
      evidence: `${path.relative(repoRoot, iconMapPath)} (${carbonIcons.length} Carbon icon keys)`,
      notes: 'Include Apache-2.0 license text and preserve notices when distributing bundled icons.',
    },
    {
      asset: 'Application bundle icons',
      source: 'src-tauri/icons/*',
      license: tauriLicense,
      evidence: tauriIcons.length ? tauriIcons.join(', ') : 'No files found',
      notes: tauriNotes,
    },
  ];
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value ?? '').replace(/\n/g, '<br>');
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyLines = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`);
  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

function summarizeFindings(npmRows, rustRows, iconRows) {
  const findings = [];

  const npmUnknown = npmRows.filter((row) => row.license === 'UNKNOWN' || row.notes.includes('missing'));
  const rustUnknown = rustRows.filter((row) => row.license === 'UNKNOWN' || row.notes.includes('crate source not found'));
  const iconManual = iconRows.filter((row) => row.license === 'MANUAL REVIEW REQUIRED');

  if (npmUnknown.some((row) => row.name === 'kanvan')) {
    findings.push('`kanvan` is used from GitHub and ships an MIT `LICENSE` file, but its `package.json` does not declare a `license` field.');
  }
  if (iconManual.length > 0) {
    findings.push('Tauri bundle icons under `src-tauri/icons/` have no provenance or license note in the repository and should be manually verified.');
  }
  const hasApacheDeps =
    npmRows.some((row) => row.license.includes('Apache-2.0')) ||
    rustRows.some((row) => row.license.includes('Apache-2.0'));
  const hasNoticeBundle =
    fs.existsSync(thirdPartyNoticesPath) &&
    fs.existsSync(apacheLicensePath) &&
    fs.existsSync(mitLicensePath);

  if (hasApacheDeps && !hasNoticeBundle) {
    findings.push('Apache-2.0 dependencies are present, so shipping a third-party notices bundle is safer than relying on package manager metadata alone.');
  }
  if (rustUnknown.length > 0) {
    findings.push('Some Rust crate licenses could not be resolved from the local cargo cache. Run this audit again after fetching dependencies on a network-enabled machine.');
  }

  return findings;
}

const npmRows = collectNpmRows();
const rustRows = collectRustRows();
const iconRows = collectIconRows();
const findings = summarizeFindings(npmRows, rustRows, iconRows);

const npmTable = markdownTable(
  ['Section', 'Package', 'Resolved', 'License', 'License file', 'Notes'],
  npmRows.map((row) => [row.ecosystem, row.name, row.version, row.license, row.licenseFile, row.notes]),
);

const rustTable = markdownTable(
  ['Crate', 'Resolved', 'License', 'Manifest source', 'Notes'],
  rustRows.map((row) => [row.name, row.version, row.license, row.manifestPath, row.notes]),
);

const iconTable = markdownTable(
  ['Asset', 'Source', 'License', 'Evidence', 'Notes'],
  iconRows.map((row) => [row.asset, row.source, row.license, row.evidence, row.notes]),
);

const report = `# License audit

Generated by \`npm run license:audit\`.

## Current assessment

${findings.length > 0 ? findings.map((finding) => `- ${finding}`).join('\n') : '- No obvious license blockers were found in the locally available metadata.'}

## NPM dependencies

${npmTable}

## Rust dependencies

${rustTable}

## Icons and bundled assets

${iconTable}

## Recommended release checklist

- Keep \`legal/THIRD_PARTY_NOTICES.md\` and \`legal/LICENSES/\` bundled with release artifacts.
- Record the origin and license status of files under \`src-tauri/icons/\`.
- Re-run \`npm run license:audit\` whenever dependencies or icon assets change.
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
if (findings.length > 0) {
  console.log('');
  console.log('Findings:');
  for (const finding of findings) {
    console.log(`- ${finding}`);
  }
}
