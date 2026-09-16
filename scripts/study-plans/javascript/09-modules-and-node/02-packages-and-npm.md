---
title: Packages, package.json, npm and semver
minutes: 12
---
A **package** is a directory with a `package.json`; npm is the registry and the tool that installs packages into `node_modules`, and `require`/`import` of a bare name is the resolution algorithm that finds them there. Almost every JavaScript project is a package, depends on dozens more, and is shaped by a handful of `package.json` fields and one versioning convention — semver — that decides what `npm install` gives you today versus six months from now. This lesson covers the fields that matter, the resolution algorithm precisely enough to debug it, semver ranges and lockfiles, scripts, and the security realities of installing other people's code.

## `package.json`, the fields that matter

```json
{
  "name": "@acme/tools",                 // scoped name; lower-case, URL-safe
  "version": "2.3.1",                    // semver
  "description": "…",
  "type": "module",                      // .js files are ESM (omit or "commonjs" for CJS)
  "main": "./dist/index.cjs",            // legacy entry point for require()
  "exports": {                           // modern entry points — the public surface; everything else is unreachable
    ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./utils": "./dist/utils.js"
  },
  "bin": { "acme": "./bin/cli.js" },     // commands installed on PATH (npx acme, or after a global install)
  "scripts": { "build": "tsc", "test": "node --test", "start": "node dist/index.js", "prepare": "npm run build" },
  "dependencies": { "express": "^4.18.2" },
  "devDependencies": { "typescript": "~5.4.0", "eslint": "8.57.0" },
  "peerDependencies": { "react": ">=18" },
  "engines": { "node": ">=18" },
  "files": ["dist"],                     // what gets published (plus package.json, README, LICENSE)
  "private": true                        // refuse to publish
}
```

`dependencies` are needed at runtime by whoever installs you; `devDependencies` only to develop the package itself (not installed by consumers); `peerDependencies` say "the host must provide this" (plugins, React components). `exports` restricts what consumers can import (deep imports of internal files break when you refactor otherwise) and supports **conditions** — `import`/`require`/`node`/`default`/`types`. `engines` documents the Node range and, with `engine-strict`, enforces it.

## Resolution: how `require("x")` finds a file

1. **Core module?** (`fs`, `node:fs`) → built in.
2. **Relative or absolute** (`./`, `../`, `/`) → try the exact path, then `.js`, `.json`, `.node`; then as a directory: its `package.json` `main`, then `index.js`.
3. **Bare specifier** (`lodash`, `@acme/tools/utils`) → look in `./node_modules/`, then `../node_modules/`, then `../../node_modules/` … up to the filesystem root. Inside the package directory, honour `exports` if present (only the listed subpaths are allowed), else `main`, else `index.js`.

That upward walk is why nested `node_modules` work, why a monorepo can hoist shared packages to the root, and why the same package at two versions can exist twice in one tree (each dependant finds its nearest copy). `require.resolve("x")` prints the resolved path; `node --trace-warnings` and `NODE_DEBUG=module` show the search.

## Semver

`MAJOR.MINOR.PATCH` (+ optional prerelease `-beta.1`): patch = bug fixes, minor = backwards-compatible features, major = breaking changes. **Zero-major** versions (`0.x.y`) promise nothing — any change may break. Range operators:

| Range | Means | Matches |
| --- | --- | --- |
| `1.2.3` | exactly | `1.2.3` |
| `^1.2.3` | same major, ≥ 1.2.3 (default for `npm install`) | `1.2.3` … `1.99.99`, not `2.0.0` |
| `^0.2.3` | for 0.x: same **minor** | `0.2.3` … `0.2.99` |
| `~1.2.3` | same minor, ≥ 1.2.3 | `1.2.3` … `1.2.99` |
| `>=1.2.0 <2.0.0` | explicit | |
| `1.x` / `1.*` | any 1.y.z | |
| `*` / `latest` | anything | never in a real project |

Ranges are a promise about what *you* accept; whether the author kept the semver contract is another matter — hence lockfiles.

## Lockfiles and reproducible installs

`package-lock.json` (npm), `yarn.lock`, `pnpm-lock.yaml` record the **exact** version and integrity hash of every installed package, transitive ones included. `npm install` respects the lockfile where it can and updates it when `package.json` changed; `npm ci` installs **exactly** the lockfile or fails, deleting `node_modules` first — use it in CI and deployments. Commit the lockfile; a project without one is a different program on every install. `npm outdated` and `npm update` are how you move ranges forward deliberately.

## Scripts

`npm run <name>` runs `scripts.<name>` with `node_modules/.bin` on `PATH` (so `"test": "jest"` finds the local jest) and the package's env exposed as `npm_package_*`. `npm test`, `npm start`, `npm run build` are conventions; `pre<name>`/`post<name>` scripts run around a script automatically (`pretest`, `postinstall`). **Lifecycle scripts** — `prepare` (runs on local `npm install` and before publish), `postinstall` (runs after *anyone* installs your package) — are powerful and a security concern: a compromised package's `postinstall` runs arbitrary code on every developer's machine and CI. `npx <pkg>` runs a package's binary, downloading it if needed.

## Publishing, in one paragraph

`npm version patch|minor|major` bumps and tags; `npm publish` uploads what `files`/`.npmignore` allow (check with `npm pack --dry-run`); scoped packages publish private by default (`--access public`). Never publish secrets; never publish `node_modules`; use `"private": true` on applications.

## Supply chain

Installing a package runs its install scripts and gives its code full access to your process, files and network. Defences: a committed lockfile and `npm ci`; `npm audit` (with judgement — many findings are irrelevant devDependency noise); `--ignore-scripts` where possible; fewer dependencies (a `left-pad` is a liability, not a saving); pinning in applications, ranges in libraries; provenance/attestations and 2FA for maintainers. Typosquatting (`lodahs`) and dependency confusion (a public package shadowing a private name) are real attacks — scoped names and registry configuration mitigate them.

## Monorepos and workspaces

`"workspaces": ["packages/*"]` lets one repository hold several packages that depend on each other by name; npm symlinks them into the root `node_modules` so resolution finds the local source. Tools (Turborepo, Nx, pnpm) add task orchestration and caching on top.

## Common mistakes

- Runtime dependencies in `devDependencies` (works locally, breaks in production installs with `--omit=dev`).
- No lockfile, or `npm install` in CI instead of `npm ci`.
- `*`/`latest` ranges; relying on a `0.x` package as if `^` protected you.
- Deep imports into a package's internals (`lodash/internal/…`) — `exports` exists to stop this.
- Publishing without `files`/`private`; `postinstall` scripts you do not need.
- Two copies of a package in the tree causing `instanceof` failures or duplicated state (check `npm ls <pkg>`).

## Interview angle

- *"`dependencies` versus `devDependencies` versus `peerDependencies`?"* Runtime for consumers / development only / must be provided by the host.
- *"How does `require('x')` find `x`?"* Core module, else relative path with extension and index probing, else walk up `node_modules` directories, honouring `exports`/`main`.
- *"`^1.2.3` versus `~1.2.3`?"* Same major (minor and patch may rise) versus same minor (patch may rise); `^0.x` behaves like `~`.
- *"Why commit the lockfile? `npm ci`?"* Reproducible installs — exact versions and hashes; `ci` installs exactly that or fails.
- *"What is the `exports` field for?"* Defining the package's public entry points with conditions, blocking deep imports.

## Key takeaways

- `package.json`: `name`/`version`, `type`, `main`/`exports`/`bin`, `scripts`, the three dependency kinds, `engines`, `files`/`private`.
- Resolution: core → relative (extensions, `index.js`) → walk up `node_modules`; `exports` gates the public surface.
- Semver `^` (major), `~` (minor), `0.x` is unstable; lockfile + `npm ci` for reproducibility.
- Scripts get `.bin` on PATH; `pre`/`post` and lifecycle scripts run automatically — a supply-chain risk.
- Fewer dependencies, audited, locked, scoped; `npm ls` to find duplicates.
