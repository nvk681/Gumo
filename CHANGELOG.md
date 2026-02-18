# Changelog

## [2.0.1] - 2025-02-17

### Changed

- README: Neo4j 4.0+ requirement, Elasticsearch section (current client API), note on using as a dependency without `config.json`, and Changelog link.
- In-code comment clarifying that default config is only used when `config.json` is missing.

[2.0.1]: https://github.com/nvk681/Gumo/compare/v2.0.0...v2.0.1

## [2.0.0] - 2025-02-17

### Breaking

- **Node.js:** Requires Node.js >= 24.0.0 (LTS). See `.nvmrc` and `engines` in `package.json`.
- **Elasticsearch client:** Replaced deprecated `elasticsearch@14` with `@elastic/elasticsearch@^8`. Index API now uses `document` (no `type` or stringified `body`).
- **Neo4j:** Upgraded `neo4j-driver` from `^4` to `^5`. Constraint syntax updated to Neo4j 4.0+ (`FOR ... REQUIRE ... IS UNIQUE`).

### Added

- Config can be omitted: if `config.json` is not found in the current directory, in-package defaults are used so `require('gumo')` works when used as a dependency.
- ESLint 9 + flat config; `npm run lint`.
- CI (GitHub Actions) on Node 24; `package-lock.json` for reproducible installs.
- `docs/DEPENDENCY_MODERNIZATION.md` and `NODE_UPGRADE_PLAN.md` (repo-only; not in npm package).

### Changed

- **Crawler:** Replaced deprecated `request` with Node built-in `fetch()`. Replaced `underscore` with native JS (no new dependencies).
- **Publish:** `package.json` `files` field limits the npm tarball to `gumo.js`, `crawler/`, `libs/`, and `config.json`.

### Fixed

- Neo4j transaction callbacks now return the `tx.run()` promise so writes complete correctly.
- Crawler works when run without a `config.json` in CWD (uses inline defaults).

[2.0.0]: https://github.com/nvk681/Gumo/compare/v1.0.7...v2.0.0
