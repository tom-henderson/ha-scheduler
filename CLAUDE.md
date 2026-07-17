# Repository guide for agents

Home Assistant custom integration (`custom_components/daily_schedule/`, Python) +
a bundled Lovelace card (`card/`, TypeScript/Lit). See `README.md` and
`HANDOVER.md` for the functional spec.

## Two rules that keep concurrent PRs conflict-free

These exist because build artifacts and the version number are the only things
every branch would otherwise touch, which forces needless merge conflicts.

1. **Never edit `manifest.json`'s `version`.** CI owns versioning: on merge to
   `main` it derives the next version from the latest git tag, **patch-bumps**
   it, cuts the GitHub release, and commits the stamped version back. Feature
   PRs must not touch it. For an intentional **minor/major** bump (rare),
   set `version` in the manifest *ahead* of the latest tag in that one PR — CI
   honours a manifest that is ahead of the tags.

2. **Never commit the built card bundle**
   (`custom_components/daily_schedule/frontend/daily-schedule-card.js`). It is
   `.gitignore`d, built by CI, and shipped in the release zip (HACS installs via
   `zip_release`). It is a minified rollup output, so committing it makes every
   card PR conflict. Run `npm run build` locally when you need it (e.g. before
   the Playwright smoke tests, which load it from disk).

## Building & testing

Python (from repo root):

```bash
python3.13 -m venv .venv && . .venv/bin/activate
pip install --find-links ci/wheels pytest-homeassistant-custom-component freezegun
pytest -q
```

Card (from `card/`):

```bash
npm ci
npm run lint          # tsc --noEmit
npm run build         # emits the (gitignored) bundle into the integration
npx playwright test   # smoke tests; needs the bundle built first
```

CI (`.github/workflows/ci.yml`) runs the same steps on every PR and, on merge to
`main`, the `release` job builds + zips + publishes.

## Commit / PR conventions

- End commit messages with the `Co-Authored-By` / `Claude-Session` trailers.
- PRs off `main`; keep them independent so several can be queued and merged
  without rework.
