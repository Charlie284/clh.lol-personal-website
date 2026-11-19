# clh.lol source

Source for [clh.lol](https://clh.lol), Charlie Harper's personal portfolio and blog. Built with React API components, Preact’s compatibility runtime, Vite, TypeScript, and Tailwind CSS, it combines project showcases and MDX articles with Framer Motion animations, scroll-linked effects, and a custom interactive design. Production output is a static site; no application server or database is required.

## Key Features & Recent Upgrades

- **Homepage:** A centered hero introduces the site, followed by featured work, capabilities, and personal context.
- **Page Transitions:** Short fades between routes, with reduced-motion support and focus moved to the incoming page heading.
- **Project Browsing:** A keyboard- and touch-accessible homepage carousel highlights six projects; the `/projects` page provides filters and linked project rows.
- **GitHub Profile:** A link in the homepage hero opens the author's GitHub profile.
- **Responsive Design:** Fully optimized for vertical (mobile) displays with centered layouts and auto-scaling typography.
- **Custom Interactive Cursor:** A spring-based circle cursor that reacts to clicks and hovers.
- **Integrated Blog:** A dedicated internal blog page for long-form updates.
- **Build-Time HTML:** Every public route is emitted as complete HTML for search engines, link previews, fast first rendering, and readers without JavaScript. React hydrates the same markup for the existing interactive experience.

## Tech Stack

- **UI:** React API components rendered with [Preact compatibility](https://preactjs.com/guide/v11/getting-started/).
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a small global CSS file for fonts and effects.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) (Scroll-linked values, springs, and layout animations).
- **Routing:** [React Router 7](https://reactrouter.com/) (Client-side navigation with scroll-to-top).
- **Content:** Local MDX with YAML frontmatter, GitHub-flavored Markdown, and syntax highlighting via `rehype-pretty-code`.
- **Testing:** Vitest and Testing Library for unit/component tests; Playwright and axe for browser checks.

## Project Structure

```text
src/
├── assets/             # Local fonts, licenses, and global styles.
├── components/         # Shared UI (Nav, Cursor, CommandPalette).
├── content/blog/       # MDX articles and their frontmatter.
├── lib/                # Blog loading, metadata, analytics, preferences.
├── pages/              # Home, Projects, Blog, privacy, and other routes.
│   └── projects/       # Individual project detail pages.
├── test/               # Shared Vitest setup; tests also live beside source.
├── App.tsx             # Router config and global application layout.
├── entry-server.tsx    # Build-only static rendering entry point.
└── main.tsx            # Browser hydration entry point.
public/                 # Static media, security headers, service worker template.
scripts/                # Prerendering, service worker generation, content tools.
tests/e2e/              # Playwright browser tests.
docs/                   # Setup, architecture, and contributor guides.
.github/workflows/      # CI verification (not a deployment workflow).
```

## Documentation

- [Installation & Quick Start](docs/INSTALL.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Website → Substack sync](docs/SUBSTACK_SYNC.md) (source checker only; automatic publishing is disabled)

## Development

Use Node.js 20.19.0 or newer; CI uses Node 24. The package declares npm 11.6.2 in its `packageManager` field and commits `package-lock.json`.

```bash
git clone https://github.com/Charlie284/clh.lol-personal-website.git
cd clh.lol-personal-website
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`; it may choose another port if occupied). No environment variables are required to develop or build. Optional production-only PostHog configuration is described under [Analytics](#analytics).

```bash
npm run build
npm run preview
```

The build emits `dist/`; preview serves that directory locally (normally `http://localhost:4173`) and is not a production hosting server. Run `npm run test:watch` for interactive unit tests.

### Deployment

The repository documents Cloudflare Pages as the production host. Configure a Pages project with the repository root as its build directory, `npm ci && npm run build` as the build command, and `dist` as the output directory. Use a compatible Node version (Node 24 matches CI). For this site's production project, select `main` as the production branch. The checked-in GitHub Actions workflow verifies changes; it does not deploy the site or provision a Pages project.

The build compiles browser assets and a temporary `.prerender/` rendering bundle, renders route-specific HTML and metadata, generates `sitemap.xml`, `offline.html`, and `404.html`, and versions the service worker. The temporary bundle is removed automatically. Publish the entire `dist/` directory, not just its assets, and preserve the generated `_headers` file on Cloudflare Pages.

Other static hosts can serve the same output, but must serve each route's generated `index.html` and use `404.html` for unknown paths. Do not add a catch-all rewrite to the homepage: it would hide real 404s and bypass route-specific HTML. Hosts that do not understand Cloudflare's `_headers` format need equivalent security and cache headers configured separately. This app assumes hosting at the domain root; subdirectory deployment is not configured.

Before publishing a fork, follow [License and reuse](#license-and-reuse), update site URLs (including metadata, sitemap/robots references, and newsletter redirects), and configure your own Kit form. Analytics and Kit account settings are external to this repository; see the sections below.

### Updating content

Blog articles live in `src/content/blog/*.mdx`. Follow an existing article's frontmatter: `title`, `date`, `description`, and `slug` are required by the prerenderer; posts also include `tags` and `wordCount`. Use a unique slug and rebuild to regenerate article HTML and the sitemap. Project pages live in `src/pages/projects/`; route registration is in `src/App.tsx`, lazy page loading in `src/lib/clientPages.ts`, and build-time metadata/preload registration in `src/lib/routeMetadata.ts` and `src/entry-server.tsx`.

### Quality checks

- `npm run lint` checks JavaScript, TypeScript, React hooks, and Vite modules.
- `npm run type-check` runs TypeScript without emitting files.
- `npm test` runs the Vitest unit and component suite.
- `npm run test:performance` checks cold homepage interactivity against a one-second budget on desktop and mobile (1.6 Mbps, 150 ms latency, 4× CPU). Run it on an otherwise idle machine. To measure production with the same empty-cache budget, use `node scripts/measure-cold-load.mjs --url=https://clh.lol/`.
- `npm run test:e2e` builds the site and runs Playwright in desktop and mobile Chromium.
- `npm run check` runs linting, type checking, unit tests, and the production build.

Install the local Playwright browser once with `npm run test:e2e:install`.
GitHub Actions runs the complete check and browser suites on pushes and pull requests.

## License and reuse

The site code is [MIT licensed](LICENSE). Personal writing, project copy,
branding, and imagery are reserved; third-party fonts have their own OFL
licenses. See [LICENSING.md](LICENSING.md) for the exact scope. Replace the
reserved content, `clh.lol` URLs, and Kit newsletter form ID before publishing
your own site from this source. The `private: true` package flag prevents
accidental npm publication; it does not limit the MIT license.

## Analytics

The production site is prepared for Cloudflare Web Analytics, which provides
aggregate traffic and performance metrics without analytics cookies or
cross-site tracking. For the Pages project, enable it under **Metrics → Web
Analytics**. Cloudflare injects the beacon on the next deployment; no analytics
token belongs in this repository.

PostHog sends only `project_clicked` (the homepage's project links and the
project listing) and `newsletter_submitted` (valid native Kit form submissions,
with the home/blog/article placement). A submission does not prove the reader
confirmed their subscription. Both events require the current **Allow cookies**
choice. The earlier newsletter-only consent is renewed because it excluded
analytics. Declining consent stops future events; earlier actions are never
queued for later consent.

Events use PostHog's public capture API directly, with no analytics SDK or
extensions. There is no session replay, autocapture, automatic pageview/pageleave,
error/performance capture, or feature flag polling. A random page-load identifier
stays in memory, with no PostHog cookies, browser storage, or personal profiles.
The payload contains only the public project token, identifier, timestamp, event
name, page path (without query/hash), project title/destination or form placement,
and the disabled-person-profile marker. Requests omit cookies and referrer
headers, and use `keepalive` so the native Kit POST stays intact. Nothing is
buffered or retried after consent changes.

For local production builds, copy `.env.example` to `.env.local` and set
`VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` from PostHog project **412907**.
The local env file is ignored by Git. Development builds and builds without
both values send nothing to PostHog.

In **Cloudflare Pages → Settings → Variables and Secrets**, add those same two
build variables to the production environment before the next deployment.
Use the project's public SDK token, never a personal API key; the US ingestion
host is `https://us.i.posthog.com`. The token is intentionally public in the
browser bundle. Preview builds can omit the variables to keep test traffic out
of production reports. The CSP permits only the US ingestion host; no PostHog
scripts are loaded.

CI builds with a dummy project token, and the analytics browser tests intercept
PostHog requests and the Kit POST without sending a real subscription. For the
same setup locally, pass `VITE_POSTHOG_PROJECT_TOKEN=phc_browser_tests` and
`VITE_POSTHOG_HOST=https://us.i.posthog.com` when running `npm run test:e2e`.

## Newsletter confirmation

The signup forms post directly to Kit and don't treat a submitted form as a
confirmed subscription. In Kit form `9788220`, keep double opt-in enabled and
set **After confirming redirect to** to
`https://clh.lol/newsletter-confirmed`. On that page, readers can choose
**Hide signup prompts** after following Kit's confirmation link. This stores
only a local display preference, requires cookie consent, and does not claim
to verify or change the subscriber's Kit account. A direct route visit or form
submission does not set the preference.

### Static asset performance

Fonts are bundled as local Latin-subset WOFF2 files with their OFL licenses in
`src/assets/fonts`. The homepage preloads small, exact hero-lettering instances
and a body-font subset. The remaining faces load after the critical resources;
other routes include those styles immediately for their page titles. Unicode
fallback faces preserve the remaining Latin glyphs. Font display uses swap so
the intended typefaces appear even on slow connections. Screenshots use WebP and images
below the homepage hero load lazily. Blog listings ship metadata; article code
loads when opened, while the build still prerenders complete article HTML. Each
HTML page preloads its route chunk and static dependencies, including the selected
article, so first visits do not wait for the app shell to discover them. The build
also writes homepage Early Hints to `_headers`, retaining the credentials mode
that Cloudflare’s automatic link extraction skips.

The service worker precaches the homepage shell and caches other pages and static
resources when visited. Previously visited pages work offline; an offline HTML
shell restores routes from cached JavaScript when their page HTML was not cached.
Unvisited pages require a connection. Hashed build assets use immutable caching;
public images revalidate after one day, and the worker itself is never long-term
cached.

The optional `python3 scripts/optimize-fonts.py` command regenerates the committed
subsets from their original bundled fonts (requires `fonttools[woff]`). Normal
Node builds use the committed files and do not require Python.
