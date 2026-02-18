# Publish checklist

**Current version:** 2.0.1 (ready to publish)

## Steps run ✅

1. **Lint & test** — `npm run lint` and `npm test` (passed).
2. **Dry-run pack** — `npm pack --dry-run` (tarball: gumo.js, crawler/, libs/, config.json, CHANGELOG.md, package.json, README.md, LICENSE).
3. **Version** — Bumped to **2.0.1** (`npm version patch --no-git-tag-version`). CHANGELOG.md updated.

## What you need to do

4. **Log in to npm** (once per machine):
   ```bash
   npm login
   ```
   Use your npmjs.com username, password, and (if enabled) OTP.

5. **Publish**:
   ```bash
   npm publish
   ```

6. **Git tag** (optional, after publish):
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release 2.0.1"
   git tag v2.0.1
   git push origin main
   git push origin v2.0.1
   ```

**Note:** Use Node 24 (e.g. `nvm use`) when you run the app locally. Breaking changes in 2.0.0: Node >= 24, `@elastic/elasticsearch`, Neo4j driver 5. See `CHANGELOG.md`.
