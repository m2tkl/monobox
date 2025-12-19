import type { LanguageFn } from 'highlight.js';

type Loader = () => Promise<{ default: LanguageFn } | Record<string, LanguageFn>>;

export const loaders: Record<string, Loader> = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  json: () => import('highlight.js/lib/languages/json'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  bash: () => import('highlight.js/lib/languages/bash'),
  css: () => import('highlight.js/lib/languages/css'),
  xml: () => import('highlight.js/lib/languages/xml'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  python: () => import('highlight.js/lib/languages/python'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  java: () => import('highlight.js/lib/languages/java'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  swift: () => import('highlight.js/lib/languages/swift'),
  sql: () => import('highlight.js/lib/languages/sql'),
  php: () => import('highlight.js/lib/languages/php'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  objectivec: () => import('highlight.js/lib/languages/objectivec'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
  ini: () => import('highlight.js/lib/languages/ini'),
};

export const languageAlias: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
  sh: 'bash',
  shell: 'bash',
  html: 'xml',
  vue: 'xml',
  md: 'markdown',
  py: 'python',
  rb: 'ruby',
  csharp: 'csharp',
  cs: 'csharp',
  objc: 'objectivec',
  docker: 'dockerfile',
};

export function normalizeLanguage(lang?: string): { raw?: string; normalized?: string } {
  if (!lang) return { raw: undefined, normalized: undefined };
  const raw = String(lang).trim().toLowerCase();
  const normalized = languageAlias[raw] || raw;
  return { raw, normalized };
}
