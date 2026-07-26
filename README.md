# @webhemi/ui

WebHemi design system: React components built and reviewed in Storybook, published for both WebHemi.PHP (AssetMapper) and WebHemi.JS (Next.js).

## Layout

```text
src/
├── admin/                 # Admin Theme (Win98) — rewrite in progress
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
