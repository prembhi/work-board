# Work Board

A single-page, public status board. Anyone with the link sees what you're working on, the date, and whether it's done. No build step, no database — the whole board reads from `data/updates.json`.

```
work-board/
├─ index.html            the site
├─ data/updates.json     all the content
├─ scripts/add-update.mjs   helper to append an entry
└─ .github/workflows/meta-ads.yml   optional: pull Meta ad numbers daily
```

## Publish it (5 minutes)

1. Create a new **public** repo on GitHub, e.g. `work-board`.
2. Upload these files to the repo root (drag and drop on github.com works fine).
3. Repo → **Settings** → **Pages** → Source: `Deploy from a branch`, Branch: `main`, Folder: `/ (root)` → Save.
4. Wait ~60 seconds. Your link is `https://<username>.github.io/work-board/`.

Share that link. Anything you push to `main` appears within a minute.

> Keep the repo public for Pages on a free account. Don't put anything in `updates.json` you wouldn't want a customer to read.

## Add an update

Edit `data/updates.json` on github.com (pencil icon → edit → commit). One entry looks like this:

```json
{
  "id": "WB-0004",
  "date": "2026-07-25",
  "title": "Short headline of the work",
  "project": "MPG Hub",
  "status": "in-progress",
  "owner": "IT",
  "notes": "One or two lines of context.",
  "metrics": [{ "label": "Spend", "value": "$248.10" }],
  "tags": ["Base44"],
  "links": [{ "label": "Open", "url": "https://example.com" }]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Any unique string. `WB-0004`, `TXG-12`, whatever. |
| `date` | yes | `YYYY-MM-DD`. Drives grouping and sort order. |
| `title` | yes | Keep it under ~70 characters. |
| `status` | yes | `done`, `in-progress`, `blocked`, or `planned`. Nothing else. |
| `project` | no | Becomes a filter option in the dropdown automatically. |
| `owner` | no | Shown in the left rail. |
| `notes` | no | Free text. |
| `metrics` | no | Array of `{label, value}`. Renders as the number strip — this is where ad or job stats go. |
| `tags` | no | Array of short strings. |
| `links` | no | Array of `{label, url}`. |

New entries go at the top of the array by convention, but the page sorts by date regardless.

**Helper script** (needs Node 18+): `node scripts/add-update.mjs "Title here" --status=done --project="MPG Hub" --notes="..."` appends a correctly-formed entry with today's date and the next ID.

## Getting Meta ad numbers in

Two ways. Pick one.

**Manual, no setup.** Ask me for the numbers on any campaign — I can pull them and hand you back a ready-to-paste JSON entry with spend, impressions, clicks, CTR and leads already filled into `metrics`. Paste, commit, done.

**Automatic, daily.** `.github/workflows/meta-ads.yml` runs each morning, hits the Meta Graph API for yesterday's numbers on the ad accounts you list, and commits an entry. To turn it on:

1. Get a long-lived System User token with `ads_read` from Meta Business Settings.
2. Repo → Settings → Secrets and variables → Actions → New repository secret:
   - `META_ACCESS_TOKEN` — the token
   - `META_AD_ACCOUNT_IDS` — comma-separated, e.g. `act_2091751171439235,act_1523997115259349`
3. Repo → Settings → Actions → General → Workflow permissions → **Read and write**.
4. Actions tab → *Daily Meta ads snapshot* → Run workflow (to test it).

Tokens live in GitHub Secrets and never appear on the public page. Only the aggregate numbers get committed — check what it writes before leaving it running unattended.

## Local preview

`fetch()` won't read a local file, so don't double-click `index.html`. Run:

```
npx serve .
```

then open the address it prints.
