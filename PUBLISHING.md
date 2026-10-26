# Publishing dsh-verbose

Everything needed to take this folder from local to installable, in the order the steps
actually depend on each other.

**Status (2026-10-27):** mounted locally as `link:C:/Users/adith/.dsh-n/plugins/dsh-verbose`
in the `web` profile. The GitHub repo is live with signed history, tags and releases
(`v0.8.1`, `v0.8.2`, each shipping `plugin.tgz`), the GitHub Pages site is up at the
`homepage` URL, and the marketplace entry is staged on the fork branch `add-dsh-verbose`
— the PR opens on 2026-10-28, one day after the repo was created. npm: the stored token
was stale; `npm login` (2FA) then `npm publish --access public`.

---

## 0. Name check

`dsh plugin add dsh-verbose` resolves through npm, so the name has to be free:

```sh
npm view dsh-verbose
```

`404 Not Found` means it is free. If it is taken, rename in **three** places before doing
anything else (see the rename note below) — the GitHub repo can keep any name, but the npm
name and the bundle `name:` must agree.

## 1. Repository

```sh
cd B:\Research\dsh-verbose
git init -b main
git add -A
git commit -m "dsh-verbose 0.1.0"
```

Create an **empty** repo at <https://github.com/new>, then:

```sh
git remote add origin https://github.com/adithyanraj03/dsh-verbose.git
git push -u origin main
```

Then add the topic the marketplace requires: repo → **About** (gear) → **Topics** →
`dsh-plugin`. Add `dsh`, `transcript`, `ui` as well.

## 2. Verify it installs from a clean machine

A local `link:` hides two failures that a cold clone exposes — a dependency that only
exists on this machine, and a package that is not actually in `files`.

```sh
git clone https://github.com/adithyanraj03/dsh-verbose.git /tmp/verify
cd /tmp/verify
npm install
npm test
```

`npm test` runs `node tests/client.test.mjs && node tests/classify.test.mjs`, which needs
nothing but Node: it evaluates the real `client.js` against a shim and checks 49 behaviours,
including that the three slot names are the ones dsh publishes.

Then install it into a real dsh **straight from GitHub**, before npm knows about it:

```sh
dsh plugin --profile web add github:adithyanraj03/dsh-verbose
dsh --profile web
```

Check: the `⋯` menu carries **Transcript view → Normal / Verbose** and **Verbose settings…**, and

```sh
dsh --profile web --dump-config | Select-String "id: verbose"
```

shows exactly one row.

> ### Do not test this in a profile that already runs the local copy
>
> Both copies use the row id `verbose`. Installing both gives the profile two rows with that
> id: dsh mounts both, and the header gets two `⋯` buttons writing to the same settings entry.
> Remove the local `link:` entry first, or test in a throwaway profile.

## 3. Publish to npm

Not required for the marketplace, but it is what makes the bare name work and what drives
download sorting in the market UI.

```sh
npm test && npm publish --access public
```

`package.json` has no `prepublishOnly` hook, so run the tests yourself first. This account has
2FA enabled, so `npm publish` prompts for a one-time password — run it in an interactive
terminal.

**The `repository` field must point at the GitHub repo you listed** — that is what links the
npm package and the marketplace entry together. It already does.

### Releasing a new version

```sh
npm version patch     # or minor / major — writes package.json and tags
git push --follow-tags
npm publish
```

Users upgrade with:

```sh
dsh plugin --profile web update dsh-verbose --latest
```

If that reports `downloaded 0`, the profile's `pnpm-lock.yaml` is pinning the old version;
the reliable lever is an explicit version in the profile directory:

```sh
cd ~/.dsh/profiles/web && pnpm add dsh-verbose@<version>
```

## 4. Screenshots

The marketplace displays them, and they are the difference between a listing someone clicks
and one they scroll past.

1. Put PNGs in `assets/` (the two banners are there; replace/extend with real UI captures:
   the `⋯` menu open, the Settings page, a turn footer with metrics, the raw JSON view).
2. Keep `screenshots.json` in the repo root, 1–8 relative paths:

```json
[
  "assets/banner-dark.png",
  "assets/banner-light.png",
  "assets/menu.png",
  "assets/settings.png"
]
```

Paths must be relative and must not escape the plugin directory. `screenshots.json` is already
in `files`, so it ships in the tarball too.

## 5. GitHub Pages (optional)

The site is optional; it gives the marketplace entry something to link to. `package.json`
already declares `homepage: https://adithyanraj03.github.io/dsh-verbose/`.

1. Repo → **Settings** → **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main`, folder `/docs`
4. **Save**

A minimal `docs/index.md` plus `docs/_config.yml` is all Jekyll needs; alternatively drop a
plain `docs/index.html` and an empty `docs/.nojekyll` and GitHub serves it untouched.

## 6. The marketplace

See [MARKETPLACE.md](./MARKETPLACE.md).

---

## Keep the identity consistent

If you rename anything later, the npm package name has to change in **three** places, or the
plugin will install and then fail to mount:

1. `package.json` → `"name"`
2. `cordis.patch.yml` → `name:` (the loader imports this exact specifier)
3. `README.md` / `README.zh-CN.md` → the install command

Leave `id: verbose` in `cordis.patch.yml` alone. That is the row's handle, and it is also the
settings namespace the browser half reads (`configForms.get("verbose")`). Changing the row id
silently disconnects the page from its own preferences.

The icon has one more constraint: `package.json` declares `"icon": "assets/icon.png"` (512×512
PNG, ≤ 256 KiB — dsh base64-embeds it through `readPluginMeta`). The file must be in `files` so
it ships, and on GitHub `main` so the market entry's `icon:` key resolves — the market tile
needs a **raster** image, SVG is refused. `assets/icon.svg` is the source.
