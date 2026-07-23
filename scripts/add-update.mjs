#!/usr/bin/env node
// Append an entry to data/updates.json.
// Usage:
//   node scripts/add-update.mjs "Fixed the invoice PDF" --status=done --project="MPG Hub" --notes="Header no longer overlaps." --tags="Base44,Invoicing"

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, '..', 'data', 'updates.json');
const VALID = ['done', 'in-progress', 'blocked', 'planned'];

const args = process.argv.slice(2);
const title = args.find(a => !a.startsWith('--'));
if (!title) {
  console.error('Give me a title. Example:\n  node scripts/add-update.mjs "Ran the Meta campaign" --status=done');
  process.exit(1);
}
const opt = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const status = opt('status', 'in-progress');
if (!VALID.includes(status)) {
  console.error(`Status must be one of: ${VALID.join(', ')}`);
  process.exit(1);
}

const data = JSON.parse(await readFile(FILE, 'utf8'));
const nextNum = data.entries.reduce((max, e) => {
  const n = parseInt(String(e.id).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > max ? n : max;
}, 0) + 1;

const entry = {
  id: `WB-${String(nextNum).padStart(4, '0')}`,
  date: opt('date', new Date().toISOString().slice(0, 10)),
  title,
  status,
  ...(opt('project') && { project: opt('project') }),
  ...(opt('owner') && { owner: opt('owner') }),
  ...(opt('notes') && { notes: opt('notes') }),
  ...(opt('tags') && { tags: opt('tags').split(',').map(s => s.trim()).filter(Boolean) })
};

data.entries.unshift(entry);
await writeFile(FILE, JSON.stringify(data, null, 2) + '\n');
console.log(`Added ${entry.id} — ${entry.title} [${entry.status}]`);
console.log('Now commit and push to publish it.');
