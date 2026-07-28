# WebHemi.UI

WebHemi design system: React components built and reviewed in Storybook, published for both WebHemi.PHP (AssetMapper) and WebHemi.JS (Next.js).

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-blue.svg)](https://nodejs.org/)
[![Email](https://img.shields.io/badge/email-navig80@gmail.com-blue.svg?style=flat-square)](mailto:navig80@gmail.com)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

[![CI](https://github.com/Gixx/webhemi-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Gixx/webhemi-ui/actions/workflows/ci.yml)
[![Chromatic](https://github.com/Gixx/webhemi-ui/actions/workflows/chromatic.yml/badge.svg)](https://github.com/Gixx/webhemi-ui/actions/workflows/chromatic.yml)
[![Stoybook](https://img.shields.io/badge/Storybook-_Link-ff4785.svg?style=flat-square)](https://main--6a6654ecf8e18e6141834dee.chromatic.com)

## Layout

```text
src/
├── admin/                 # Admin Theme (Retro OS) — rewrite in progress
│   ├── chrome/            # atoms — one folder each (Button/, FieldRow/, …)
│   │   └── _lib/          # shared helpers (accessKey, scrollbar, table view, …)
│   ├── bricks/            # product bricks — one folder each
│   │   └── _lib/          # PaneWindowShell, windowBrickStory
│   ├── styles/            # tokens, chrome/, product/, entry.scss
│   ├── assets/            # fonts + icons (inlined into dist CSS)
│   └── …                  # legacy pages (throwaway until Phase 4+)
├── themes/
│   └── default/           # self-contained frontend theme
├── shared/                # transitional (atoms → themes/default; no long-term shared UI)
├── lib/                   # non-UI helpers (cn / clsx)
└── styles/
    ├── platform.css       # Tailwind theme+utilities (no Preflight)
    └── entry.js           # production CSS entry (Vite + Sass)
```

Themes are self-contained. Storybook toolbar (`data-wh-theme`) switches Admin vs Default.

## Develop

```bash
npm install
npm run storybook
```

## Build library

```bash
npm run build
```

- `tsup` → `dist/index.js` / `.cjs` / `.d.ts`
- `vite build --config vite.css.config.ts` → `dist/index.css` (Sass chrome/product + Tailwind utilities; `cssMinify: false`)

## Publish

```bash
npm publish --access public
```

## Local link (PHP / JS consumers)

```bash
npm run build
npm link
# in consumer:
npm link @webhemi/ui
```

For Symfony AssetMapper during local PHP work, point at `dist/` (see webhemi-php docs).
