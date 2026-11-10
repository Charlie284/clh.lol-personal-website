# clh.lol source

A high-performance, visually immersive personal portfolio built with React 19, Vite, TypeScript, and Tailwind CSS. This project features advanced Framer Motion animations, scroll-linked effects, and a custom interactive design.

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

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a small global CSS file for fonts and effects.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) (Scroll-linked values, springs, and layout animations).
- **Routing:** [React Router 7](https://reactrouter.com/) (Client-side navigation with scroll-to-top).

## Project Structure

```text
src/
├── assets/ styles/     # Global Tailwind entry and background animations.
├── components/         # Global UI elements (Nav, Cursor, CommandPalette).
├── pages/              # Home, Projects, Blog, privacy, and other routes.
│   └── projects/       # Individual project detail pages.
├── App.tsx             # Router config and global application layout.
├── entry-server.tsx    # Build-only static rendering entry point.
└── main.tsx            # Browser hydration entry point.
```

## Documentation

- **Installation & Quick Start:** `docs/INSTALL.md`
- **Contributing Guidelines:** `docs/CONTRIBUTING.md`
- **Architecture Overview:** `docs/ARCHITECTURE.md`
- **Website → Substack sync:** `docs/SUBSTACK_SYNC.md`

## Development

1. **Install:** `npm ci` (Node.js 20.19.0 or newer)
2. **Dev:** `npm run dev`
3. **Build:** `npm run build`

### Quality checks

- `npm run lint` checks JavaScript, TypeScript, React hooks, and Vite modules.
- `npm run type-check` runs TypeScript without emitting files.
- `npm test` runs the Vitest unit and component suite.
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
`src/assets/fonts`. The hero and body fonts are preloaded; optional font display
avoids a late font swap on slow connections. Screenshots use WebP and images
below the homepage hero load lazily. Blog listings ship metadata; article code
loads when opened, while the build still prerenders complete article HTML.

The service worker precaches the homepage shell and caches other pages and static
resources when visited. Previously visited pages work offline; an offline HTML
shell restores routes from cached JavaScript when their page HTML was not cached.
Unvisited pages require a connection. Hashed build assets use immutable caching;
public images revalidate after one day, and the worker itself is never long-term
cached.
