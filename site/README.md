# Tap website

The pages at https://brew.shisheng.dev: a home page listing the casks and one page per cask, built with
Astro and served as static assets from Cloudflare Workers.

Each cask page is generated from `../Casks/<token>.rb` (version, requirements, artifacts, download,
SHA-256, zap paths), so a new cask gets a page without any change here. To add a description, write
`content/<token>.mdx`; it appears between the install command and the generated details. Its `##`
headings join the page's contents list, and `<Aside title="…">` and `<Command command="…" />` are
available without an import. `icon: ./<token>.png` in its front matter (a 256px PNG next to it) shows
the app icon on the home page and the cask's page; without it they show the name's first letter. A
`.mdx` file without a matching cask fails the build.

`src/lib/cask.ts` reads the cask DSL itself, because Homebrew only loads casks from a tapped repository.
It handles top-level stanzas and `#{version}` in `url`; anything it can't resolve fails the build.

## Develop

```sh
pnpm install
pnpm dev
```

## Deploy

```sh
pnpm run deploy
```

`astro build`, then `wrangler deploy` uploads `dist/` and attaches the custom domain from
`wrangler.jsonc`. To deploy on every push instead, connect the repository in Cloudflare Workers Builds
with root directory `site`, build command `pnpm run build`, deploy command `npx wrangler deploy`, and
build watch paths `site/*` and `Casks/*`.
