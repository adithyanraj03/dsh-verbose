# Submitting to awesome-dsh-plugin

The marketplace at <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin> is a list of
YAML entries. Listing is a pull request against that repo — you never push code there, only
a description of where your code lives.

Its rules are at
[contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md);
this is that document applied to this plugin.

**Status (2026-10-27):** entry staged, PR pending the repo-age rule. The repo exists with
the `dsh-plugin` topic, the releases ship `plugin.tgz` (so the entry carries `tarball:` and
`icon:`), and the entry file is on the fork branch `add-dsh-verbose`. The PR opens
2026-10-28 — the repo was created 2026-10-26 21:49 UTC and must be a day old. npm
publishing is independent of the listing and is still pending (`npm login`).

---

## Before you open the PR

Their CI checks these in order, and the first two are where most submissions are rejected.

| requirement | state here |
|---|---|
| `dsh.bundle` declared in `package.json` | ✅ `{"bundle": {"patch": "./cordis.patch.yml"}}` |
| a real `cordis.patch.yml` next to it | ✅ inserts `id: verbose` |
| repository at least **1 day old** | ⏳ created 2026-10-26 21:49 UTC — PR opens 2026-10-28 |
| `dsh-plugin` topic on the repo | ✅ set at creation (plus `dsh`, `deepseek-harness`, `transcript`, `verbose`, `session-menu`, `ui`) |
| real working code, not a placeholder | ✅ `npm test` (49 checks) passes |
| description matches behaviour exactly | ✅ keep it that way if you edit it |
| at most 3 entries per PR | ✅ one |

> **The single most common rejection** is a package declaring only `dsh.client`. That alone
> is not installable — dsh has nothing to mount. This package declares **both**
> `dsh.bundle` (host half: the settings schema) and `dsh.client` (browser half: the menu,
> the page, the footer).

The repo-age check is real. Create the repository, then come back the next day.

---

## The entry

The file will be:

```
data/plugins/adithyanraj03__dsh-verbose.yml
```

The filename is `<owner>__<repo>.yml` — two underscores — and the owner and repo **must
match the `url` exactly**, or CI rejects it.

```yaml
url: https://github.com/adithyanraj03/dsh-verbose
name: adithyanraj03/dsh-verbose
category: ui
description:
  en: "Adds granular work-details controls to the dsh transcript: a session-header menu that switches each chat between Normal and Verbose and defines what Verbose expands: thinking blocks, tool calls, and terminal output."
```

Only `url`, `name`, `category` and `description.en` are required. A missing `description.zh`
is added by the maintainers, so leave it out rather than machine-translating it.

**Note the quotes.** The description contains `: ` (colon-space), so leaving it unquoted
would make YAML parse it as a mapping and CI would fail. It is quoted above for that reason.

### Choosing the category

Valid values, exactly:

```
agi  ui  usage  theme  model  identity  session  memory  tools  wsl
browser  vision  voice  docs  skill  workflow  git  notify  dev
security  remote  market  fun
```

`ui` is the right one: the plugin's substance is controls over the transcript surface.
`tools` would be wrong (it registers no model-facing tool), and `dev` is for tooling about
dsh itself rather than for what the transcript looks like.

---

## Writing the description

Their rules here are stricter than most lists, and they are enforced by a human:

- **No superlatives or marketing.** "Fast", "powerful", "seamless", "the best way to" — all
  rejected.
- **Claims must match the code**, including specific numbers, command names and API
  references. If you write "four display modes" there must be four. The description above
  names only things that exist: the menu, the page, the footer, the JSON view, and the two
  visibility switches.
- **One line, ending with a period.**

The description in `package.json` and the one in the entry should say the same thing. If you
change one, change both.

---

## Optional extras

### Screenshots

The marketplace displays them and they make a listing far more useful. See `PUBLISHING.md`
step 4 — `screenshots.json` in the repo root, 1–8 relative paths. Right now it lists the two
banners; replace them with real UI captures once the plugin has been seen in a live dsh.

### npm

Publishing is not required to be listed. It buys two things: `dsh plugin add dsh-verbose`
works as a bare name rather than `github:owner/repo`, and the market UI can sort by
downloads. If you publish, the package's `repository` field must point at the listed GitHub
repo — it already points at `adithyanraj03/dsh-verbose`.

### A release tarball

The entry supports an optional `tarball:` key pointing at a release asset:

```yaml
tarball: https://github.com/adithyanraj03/dsh-verbose/releases/latest/download/plugin.tgz
```

Only add it once the release actually carries that asset — a key pointing at a 404 is worse
than no key.

---

## Opening the PR

Once the repo is a day old and the entry file is pushed to a fork branch:

```sh
gh pr create --repo awesome-dsh-plugin/awesome-dsh-plugin \
  --head adithyanraj03:add-dsh-verbose \
  --title "Add adithyanraj03/dsh-verbose" \
  --body "Work-details controls for the dsh transcript: header menu, settings page, per-turn metrics, raw turn JSON, reasoning/tool visibility."
```

**Touch only your own file.** PRs that modify other entries are rejected to avoid collision
accidents — so if a rebase pulls in changes to someone else's YAML, drop them before pushing.

## If CI fails

The checks run in a fixed order, so the first failure is the one to read:

1. **entry count** — more than 3 entries in one PR
2. **`dsh.bundle` missing** — fetched live from your repo's root, or from `packages/`,
   `plugins/`, `apps/` for a monorepo. If you renamed the package after pushing, make sure
   `cordis.patch.yml`'s `name:` still matches.
3. **repository too new** — under a day old; wait
4. **formatting** — YAML validity, locale parity, separators, dates

A `WARN` rather than a failure usually means an unrecognised source marker, which is safe to
ignore unless a maintainer asks.
