#!/usr/bin/env node
// Pulls yesterday's ad account totals from the Meta Graph API and appends one
// entry per account to data/updates.json. Run by .github/workflows/meta-ads.yml.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, '..', 'data', 'updates.json');
const API = 'https://graph.facebook.com/v21.0';

const token = process.env.META_ACCESS_TOKEN;
const accounts = (process.env.META_AD_ACCOUNT_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

if (!token || !accounts.length) {
  console.error('META_ACCESS_TOKEN and META_AD_ACCOUNT_IDS must both be set. Nothing to do.');
  process.exit(0);
}

const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const money = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = n => Number(n || 0).toLocaleString('en-US');

const data = JSON.parse(await readFile(FILE, 'utf8'));
let nextNum = data.entries.reduce((max, e) => {
  const n = parseInt(String(e.id).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > max ? n : max;
}, 0);

let added = 0;

for (const acct of accounts) {
  const fields = 'spend,impressions,clicks,ctr,cpc,actions';
  const url = `${API}/${acct}/insights?fields=${fields}`
    + `&time_range=${encodeURIComponent(JSON.stringify({ since: yesterday, until: yesterday }))}`
    + `&access_token=${encodeURIComponent(token)}`;

  let row, name = acct;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    row = json.data?.[0];

    const metaRes = await fetch(`${API}/${acct}?fields=name&access_token=${encodeURIComponent(token)}`);
    const metaJson = await metaRes.json();
    if (metaJson.name) name = metaJson.name;
  } catch (err) {
    console.error(`${acct}: ${err.message}`);
    continue;
  }

  if (!row) { console.log(`${acct}: no spend on ${yesterday}, skipping.`); continue; }

  // Already logged this account for this date? Don't duplicate.
  if (data.entries.some(e => e.date === yesterday && e.title.includes(name) && e.project === 'Meta Ads')) {
    console.log(`${acct}: already logged for ${yesterday}.`);
    continue;
  }

  const leads = (row.actions || []).find(a => a.action_type === 'lead')?.value;
  const metrics = [
    { label: 'Spend', value: money(row.spend) },
    { label: 'Impressions', value: num(row.impressions) },
    { label: 'Clicks', value: num(row.clicks) },
    { label: 'CTR', value: Number(row.ctr || 0).toFixed(2) + '%' },
    { label: 'CPC', value: money(row.cpc) }
  ];
  if (leads) {
    metrics.push({ label: 'Leads', value: num(leads) });
    metrics.push({ label: 'Cost / lead', value: money(Number(row.spend) / Number(leads)) });
  }

  data.entries.unshift({
    id: `WB-${String(++nextNum).padStart(4, '0')}`,
    date: yesterday,
    title: `Meta ads ran — ${name}`,
    project: 'Meta Ads',
    status: 'done',
    owner: 'Automated',
    notes: `Account totals for ${yesterday}.`,
    metrics,
    tags: ['Paid social']
  });
  added++;
  console.log(`${acct}: logged.`);
}

if (added) {
  await writeFile(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${added} entr${added === 1 ? 'y' : 'ies'}.`);
}
