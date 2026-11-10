# Architecture Overview

**clh.lol** is a statically hosted React application built with Vite. Each public route is rendered to HTML during the production build, then React hydrates that HTML in the browser to provide client-side navigation and interactions.

```
+----------------------------------------------------------+
|                   Browser (hydrated React)              |
|  +-------------------+   +---------------------------+   |
|  |  React (UI Layer) |   |   Vite Dev Server / Build  |   |
|  +-------------------+   +---------------------------+   |
+-------------------|------------------------------|-----+
                    |                              |
                    |                              |
            +-------v-------+               +------v------+
            |   App.tsx    |               |  main.tsx    |
            |  (Router +   |               | (ReactDOM   |
            |   layout)    |               |  rendering) |
            +-------+------+               +------+------+
                    |                             |
   +----------------+----------------+------------+--------------+
   |                |                |                           |
   |                |                |                           |
+--v---+        +---v---+        +---v---+                 +-----v-----+
| Pages|        |Comp. |        |Hooks  |   Tailwind    |  Assets   |
| (Home|        | Nav  |        |   (use|   Config      |  (SVGs,  |
|  etc) |        | Cur…|        |  S…)   |   tailwind    |  images) |
+------+        +------+        +-------+   Config     +-----------+
```

## Core Modules

- **App.tsx** – Sets up `react-router-dom` routes and provides the global layout via `<Layout/>`. Browser builds load page components lazily; the build-time renderer supplies the same pages eagerly so their HTML is immediately available.
- **entry-server.tsx** – Build-only rendering entry point. It renders a requested route to a string and is not deployed as a server.
- **main.tsx** – Hydrates prerendered markup in production and falls back to a normal client render during development.
- **Layout.tsx** – Handles the background, mouse spotlight, responsive behavior, and global navigation and interaction wrappers.
- **Pages** – `Home`, `Projects`, `BlogPage`, `BlogPostPage`, etc. Each page is a functional component that composes reusable UI components and uses Framer Motion for entry/exit animations.
- **Components** – Re‑usable UI pieces:
  - `Nav` – Top‑right navigation with motion hover effects.
  - `Cursor` – Custom spring‑based cursor that disappears on touch devices.
  - `SharedCard` – Project rows with descriptions, optional previews, and links that preserve the project-list filters when returning from a detail page.
- **Hooks & Utilities** – Mostly native React hooks (`useState`, `useEffect`, `useTransform`, `useMotionValue`). Small custom hooks handle prerendered navigation and preferences.
- **Tailwind Config (`tailwind.config.js`)** – Centralizes colours, fonts, and custom keyframe animations (e.g., background movement).
- **Page Metadata** – `src/lib/routeMetadata.ts` defines static page metadata and builds the same title, social tags, and article structured data for the browser and static HTML. The server entry supplies blog metadata from the existing MDX index, so the build does not parse frontmatter separately.
- **Content** – MDX files under `src/content/blog/` provide the blog posts, parsed by the custom `mdx` loader in `vite.config.ts`.

## Build & Deployment

- **Vite** compiles the browser application and a temporary build-time rendering entry point.
- `scripts/generate-static-metadata.mjs` renders all 29 application routes into `dist/`, injects route-specific metadata and structured data, generates `sitemap.xml`, and writes the top-level `404.html` used by static hosts.
- The temporary `.prerender/` bundle is deleted after generation. The deployed output is still only static HTML, CSS, JavaScript, and assets; no Node.js or application server runs in production.
- React hydrates the generated HTML without replacing the page, preserving the existing animations, navigation, and route-level code splitting. The HTML also remains readable when JavaScript is unavailable.
- Asset handling is performed via Vite's built‑in static asset handling: any files in `public/` are copied as‑is to `dist/`.

---

### Extending the Architecture

If you add a backend (for example, for comments), mount an API under `/api/` and proxy it through Vite during development. Keep public content renderable at build time unless a feature genuinely requires runtime data.
