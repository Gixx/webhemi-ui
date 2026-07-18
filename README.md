# @webhemi/ui

WebHemi design system: React components built and reviewed in Storybook, published for both WebHemi.PHP (AssetMapper) and WebHemi.JS (Next.js).

## Layout

```text
src/
├── shared/          # atoms reusable by Admin + frontend themes
├── admin/           # WebHemi Admin Theme (fixed CMS UI)
├── themes/
│   └── default/     # swappable frontend theme (site visitors)
├── lib/             # utilities (cn, …)
└── styles/entry.css # production CSS = shared base + Admin tokens
```

Storybook sidebar mirrors this: **Shared**, **Admin**, **Themes/Default**. Use the toolbar paintbrush to switch token sets.

## Develop

```bash
npm install
npm run storybook
```

## Build library

```bash
npm run build
```

Outputs:

- `dist/index.js` / `dist/index.cjs` — ESM/CJS bundles
- `dist/index.d.ts` — TypeScript types
- `dist/index.css` — Admin Theme tokens + base styles

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
