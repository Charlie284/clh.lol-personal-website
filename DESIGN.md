---
name: clh.lol
description: Charlie's personal portfolio — a dark, motion-forward control surface for one developer.
colors:
  canvas: "#020202"
  surface-flat: "#050505"
  surface-card: "#070707"
  surface-card-hover: "#090909"
  surface-recessed: "#030303"
  ink: "#ffffff"
  ink-brand: "#f5f5f7"
  ink-78: "rgba(255,255,255,0.78)"
  ink-60: "rgba(255,255,255,0.60)"
  ink-50: "rgba(255,255,255,0.50)"
  ink-45: "rgba(255,255,255,0.45)"
  ink-40: "rgba(255,255,255,0.40)"
  ink-35: "rgba(255,255,255,0.35)"
  ink-30: "rgba(255,255,255,0.30)"
  ink-25: "rgba(255,255,255,0.25)"
  ink-20: "rgba(255,255,255,0.20)"
  ink-10: "rgba(255,255,255,0.10)"
  ink-06: "rgba(255,255,255,0.06)"
  ink-03: "rgba(255,255,255,0.03)"
  ink-01: "rgba(255,255,255,0.01)"
  scrollbar-thumb: "#444444"
  accent-emerald: "rgb(110 231 183)"
  accent-cyan: "rgb(103 232 249)"
  accent-violet: "rgb(196 181 253)"
  accent-amber: "rgb(252 211 77)"
  accent-rose: "rgb(253 164 175)"
typography:
  display:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(2.25rem, 12vw, 10.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "normal"
    textTransform: "uppercase"
  headline:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(2.4rem, 7vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "normal"
    textTransform: "uppercase"
  title:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(1.7rem, 4vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 300
    lineHeight: 1.85
  body-lead:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.6vw, 1.25rem)"
    fontWeight: 300
    lineHeight: 1.6
    fontStyle: "italic"
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.24em"
    textTransform: "uppercase"
  blog-headline:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.35rem, 3vw, 1.8rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
rounded:
  pill: "9999px"
  card: "1.5rem"
  node: "1.25rem"
  chip: "9999px"
  code: "0.5rem"
  code-inline: "0.55rem"
  pre: "1.25rem"
  img: "1rem"
  focus: "4px"
  scrollbar: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "192px"
  section-lg: "192px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.pill}"
    padding: "24px 48px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-40}"
    typography: "{typography.label}"
  button-ghost-hover:
    textColor: "{colors.ink}"
  card-feature:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 32px"
  card-feature-hover:
    backgroundColor: "{colors.surface-card-hover}"
  chip-tag:
    backgroundColor: "{colors.ink-02}"
    textColor: "{colors.ink-45}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
    typography: "{typography.label}"
  nav-pill:
    backgroundColor: "{colors.ink-03}"
    textColor: "{colors.ink-20}"
    rounded: "{rounded.pill}"
    padding: "16px"
  nav-pill-active:
    backgroundColor: "{colors.ink-03}"
    textColor: "{colors.ink}"
  system-node:
    backgroundColor: "rgba(0,0,0,0.4)"
    textColor: "{colors.ink}"
    rounded: "{rounded.node}"
    padding: "20px"
  system-node-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
---

# Design System: clh.lol

## 1. Overview

**Creative North Star: "The Dark Console"**

clh.lol is a near-black stage that behaves like a personal control surface. The canvas is committed dark (`#020202`), the ink is committed white, and depth is built from transparency layering rather than shadows. Type carries the identity: a single oversized Fraunces hero set against angular Syne section headings and quiet Outfit body copy. The homepage opens with a centered name-first hero; everything below it takes positions — asymmetric, off-center, generous negative space.

Motion is behavior, not garnish. A spring cursor tracks the pointer, navigation keeps its labels stationary, page transitions crossfade through soft blur and scale, the project gallery scroll-links blur and scale to scroll velocity. Every animated surface has a reduced-motion fallback that collapses to a crossfade or static state. The site itself is the demo: source and contribution-history links, command palette (`/`) — these are content, not effects.

The system explicitly rejects: generic dev-portfolio templates (centered hero, 3-card grid, indigo/violet gradient buttons), SaaS marketing landings (cream body bg, hero-metric stack, feature-card grids), cyberpunk/terminal pastiche (green-on-black, matrix rain, scanlines), and overly corporate polish (blue-trust palette, stock photography). Personality comes from craft and stance, not costume.

**Key Characteristics:**
- Committed near-black canvas; white ink; depth via white/XX transparency layering.
- One oversized Fraunces home hero; smaller Fraunces page and editorial titles; Syne section headings; quiet Outfit body.
- Uppercase tracked 10px micro-labels for supporting metadata; primary navigation and key actions use 12px labels with tighter tracking.
- Motion is spring-physics behavior tied to pointer, scroll, and state — never a uniform entrance reflex.
- Product accents stay inside project evidence (for example, Startle's orange case-study artwork); global navigation and CTAs remain monochrome.
- Asymmetric, off-center layouts; generous section padding (192px+ on desktop).

## 2. Colors: The Console Palette

A near-black canvas with white ink and a transparency ramp that does the work of a tonal system. Accents are category signals, not decoration.

### Primary
- **Canvas Black** (`#020202`): the committed body background. Never replaced by a tinted neutral or a "soft" dark. The page is the void.
- **Ink White** (`#ffffff` / `#f5f5f7` brand): primary text and the solid fill of primary buttons. Body headlines, display type, and active states live here.

### Secondary
- **Signal Emerald** (`rgb(110 231 183)`): used sparingly as a status/active signal in the hero badge.

### Neutral (the transparency ramp)
Depth, surface, and hierarchy are built from a single white-ink transparency ramp, not from gray:
- **Surface Flat** (`#050505`): recessed sections, capabilities rows, philosophy section.
- **Surface Card** (`#070707`): featured-project cards at rest.
- **Surface Card Hover** (`#090909`): featured-project cards on hover.
- **Surface Recessed** (`#030303`): the "Built, hosted, iterated" band that sits one step below canvas.
- **Hairline** (`rgba(255,255,255,0.06)` to `0.10`): all borders and dividers. `border-white/[0.06]` at rest, `border-white/15` on hover.
- **Ink ramp** (78 / 60 / 50 / 45 / 40 / 35 / 30 / 25 / 20 / 10 / 06 / 03 / 01): every secondary text weight, placeholder, and surface tint is a transparency of white, never a gray. `ink-78` is blog prose body; `ink-60` is about-body lead; `ink-45` is kicker/eyebrow default; `ink-35` is the quietest label; `ink-20` is inactive nav.

### Named Rules
**The Transparency-Over-Gray Rule.** Depth and hierarchy come from a white-on-black transparency ramp, never from neutral grays. A `#888` text color is a defect; the equivalent role is `text-white/45`. This is what keeps the canvas feeling lit-from-within rather than sprayed with gray.

**The Product-Accent Boundary Rule.** Product-specific accents may appear inside their case study or preview asset. They never leak into global nav, generic buttons, or unrelated section eyebrows. A product accent used as site-wide chrome is a bug.

**The One Brand Accent Rule.** Emerald is the default signal and the closest thing to a brand accent. It marks "active/building" state (hero badge, commit graph). Even it stays under 5% of any screen.

## 3. Typography

**Hero Display Font:** Fraunces (serif fallback: Georgia)
**Section Display Font:** Syne (sans-serif fallback: system-ui)
**Body Font:** Outfit (sans-serif fallback: system-ui)
**Label/Mono Font:** Outfit at 10px uppercase tracked; inline code uses the body stack at 0.92em.

**Character:** Fraunces gives the home hero a warmer, human signature; Syne's angular uppercase headings retain the geometric control-surface character everywhere else. Outfit stays quiet, wide, and readable for body copy. Fraunces also carries secondary page titles, article headlines, project names, and newsletter titles. These use sentence case and a smaller scale than the homepage hero. Syne remains the face for compact section headings.

### Hierarchy
- **Hero Display** (Fraunces 700, `clamp(2.25rem, 12vw, 10.5rem)`, line-height 0.92, uppercase): the home hero "Hi, I'm Charlie." Letter-reveal spring entrance per glyph. One on the home page only.
- **Headline** (Syne 700, `clamp(2.4rem, 7vw, 5.5rem)`, line-height 0.92, uppercase): section openers — "Built, hosted, and iterated.", "Capabilities". `text-wrap: balance`.
- **Title** (Syne 700, `clamp(1.7rem, 4vw, 2.4rem)`, line-height 1.05, letter-spacing -0.03em): blog post titles, card titles, expertise group labels. Negative tracking ONLY at this scale and below.
- **Body** (Outfit 300, 1rem, line-height 1.85, max-width ~65ch): blog prose, `.blog-prose` scope. Weight 300 keeps long-form reading quiet.
- **Body Lead** (Outfit 300 italic, `clamp(1rem, 1.6vw, 1.25rem)`, line-height 1.6): about/philosophy paragraphs, hero subhead. Italic = the contemplative voice.
- **Label** (Outfit 700, 10px, letter-spacing 0.24em, uppercase): the connective tissue. Kickers, eyebrows, button text, chip text, nav tooltips, "Active" badge, section meta. Tracking between 0.18em (chip) and 0.35em (eyebrow). Never below 10px; never sentence case.

### Named Rules
**The Italic-Tone Rule.** Italic marks the contemplative voice — about-body paragraphs, the hero subhead, the "meaningful." in the footer CTA. Roman marks the declarative voice — display headlines, labels, CTAs. Don't italicize a label or a button; don't set a long about paragraph in roman.

**The Display-Tracking Floor Rule.** Hero Fraunces and headline Syne use default tracking (no negative letter-spacing). Negative tracking (`-0.03em`) starts at Title scale and below. Tightening the large display faces reads as claustrophobic, not designed.

**The Label-Is-Always-Uppercase Rule.** Every 10px Outfit label is uppercase and tracked 0.18–0.35em. Sentence-case labels at this size are a defect — they lose the architectural feel that holds the sections together.

## 4. Elevation

The system is tonal-layered by default. Depth comes from the white transparency ramp (canvas `#020202` → surface-flat `#050505` → surface-card `#070707` → surface-card-hover `#090909`) and from backdrop-blur on the nav pill and chip badges. Shadows are absent.

### Shadow Vocabulary
- None. Surfaces are flat; depth comes from the transparency ramp and backdrop-blur alone.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth is conveyed by transparency layering (white/01 vs white/03 vs white/06) and backdrop-blur, never by drop shadow.

**The No-Ghost-Card Rule.** Never pair a 1px border with a wide soft drop shadow on a card or button. Use the hairline border (`border-white/[0.06]`, lifting to `border-white/15` on hover) — never a decorative drop shadow.

## 5. Components

### Buttons
- **Shape:** full pill (`rounded-full`).
- **Primary:** solid white fill, black ink, `px-12 py-6` (48px × 24px), label-style 10px uppercase tracked text. Magnetic hover: the button spring-pulls toward the cursor (0.35 factor), a soft `bg-white/10 blur-xl` glow follows the spring. `hover:scale-105 active:scale-95`.
- **Hover / Focus:** the magnetic spring + a white/10 blurred glow that fades in on `group-hover`. Focus-visible shows a 2px white outline (global `:focus-visible` rule).
- **Ghost / Tertiary:** transparent background, `text-white/40 hover:text-white`, label-style 10px uppercase tracked, often paired with an `ArrowUpRight` icon that translates up-right on hover. Used for "All projects", "MY STORY", footer CTA links.

### Chips / Tags
- **Style:** `border border-white/10 bg-white/[0.02]`, `text-white/45`, `px-3 py-2`, full pill, 10px uppercase tracked 0.18em. The hero "clh.lol" badge and "building web, infra, and tools" badge use the same shape with a tinted border for the active signal.
- **State:** capability tags are static evidence labels inside full-width artifact links; they are not filters or selectable chips.

### Cards / Containers
- **Corner Style:** `rounded-[1.5rem]` (24px) for feature cards and case-study panels. Capability links use full-width divided rows rather than cards.
- **Background:** `bg-[#070707]` at rest, `bg-[#090909]` on hover.
- **Shadow Strategy:** none at rest (see Elevation). The card lifts `hover:-translate-y-1` and its hairline border lifts from `border-white/[0.06]` to `border-white/15`.
- **Border:** 1px hairline. NEVER a side-stripe.
- **Internal Padding:** `p-6 sm:p-8 md:p-10` on feature cards; capability rows use vertical rhythm (`py-8 sm:py-10`) and shared dividers.
- **Featured project card:** horizontal on `md+` (image left `md:w-[22rem]`, content right), stacks vertically on mobile. Image aspect 16/10 desktop, 4/3 tablet. Media is art-directed per project: app icons use an inset contained treatment on a product-colored field, while screenshots remain complete and align to an explicit focal edge. A numbered index badge (`01`, `02`, `03`) sits top-left in a `bg-black/55 backdrop-blur-md` pill.

### Inputs / Fields
- **Search (command palette):** borderless on a recessed dark surface, white ink, placeholder at `text-white/35` (must clear 4.5:1 — verify against `#020202`).
- **Focus:** the command palette relies on selection state rather than a focus ring. Inputs elsewhere use the global 2px white `:focus-visible` outline.

### Navigation
- **Style:** a centered floating navigation surface with a near-black translucent background and subtle border, so labels remain readable over scrolling content.
- **Items:** Home, Projects, and Blog use Lucide icons and visible 12px uppercase labels in targets at least 48px tall. Inactive text uses white/70. The active background moves between destinations; the link itself stays still.
- **State:** nested project and article routes keep their parent destination active. Navigation retains its size and opacity while scrolling.
- **Utility navigation:** Email is available in the opening homepage section. Privacy and cookie choices remains in the footer and command palette.
- **Motion:** native scrolling preserves the visitor's wheel and touch behavior. The hero lettering and featured gallery retain the site's signature motion.

### Command Palette (signature)
- **Open:** `/` key. Floats over the page.
- **Voice:** same label-style typography; recessed dark surface; keyboard-first.

### Custom Cursor (signature)
- **Behavior:** system cursor hidden (`cursor: none` on `html`), restored on `(pointer: coarse)`. A spring-physics circle follows the pointer, scales on click and hover-target. Pure behavior — no decorative SVG.

## 6. Do's and Don'ts

### Do:
- **Do** build depth from the white transparency ramp (`white/01` → `white/03` → `white/06` → `white/10` → `white/15` → `white/30`). A `#888` or `#aaa` gray is a defect; replace with the equivalent `text-white/XX`.
- **Do** keep the canvas at `#020202`. The page is the void; everything else is lit from within.
- **Do** set every 10px label in uppercase Outfit 700, tracked 0.18–0.35em. The label is the connective tissue across sections.
- **Do** use italic as a tonal switch: italic = contemplative (about body, hero subhead, "meaningful."), roman = declarative (display, labels, CTAs).
- **Do** keep signal accents (emerald / cyan / violet / amber / rose) inside the expertise section ONLY.
- **Do** honor `prefers-reduced-motion: reduce` on every animated surface: page transitions collapse to crossfades, scroll-linked blur/scale settles to static, the custom cursor tracks without its spring, magnetic hover becomes a no-op.
- **Do** provide a visible keyboard focus ring on every interactive element (nav, links, buttons, inputs). The dark canvas needs an explicit `:focus-visible` ring in white — default browser focus is invisible here.
- **Do** keep display and headline Syne at default tracking; start negative tracking (`-0.03em`) at Title scale and below.
- **Do** use `text-wrap: balance` on h1–h3 and `text-wrap: pretty` on long prose to control line breaks.

### Don't:
- **Don't** use the generic developer portfolio template: centered hero, 3-card project grid, indigo/violet gradient buttons, Inter everywhere. (PRODUCT.md anti-reference.)
- **Don't** use the SaaS marketing landing look: cream/beige body bg, hero-metric stack (big number + small label + supporting stats + gradient accent), feature-card grids, "trusted by" logo strip. This is a person, not a startup. (PRODUCT.md anti-reference.)
- **Don't** use cyberpunk / terminal pastiche: green-on-black matrix rain, `>_` prompts, scanlines, "hacker" costume. Technical ≠ costume. (PRODUCT.md anti-reference.)
- **Don't** use overly corporate polish: blue-trust palette, stock photography, enterprise-safe feel. Reads as a consultancy, not a person. (PRODUCT.md anti-reference.)
- **Don't** apply a `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, list items, callouts, or alerts. Use a full hairline border, a background tint, or a leading icon/number instead.
- **Don't** use `background-clip: text` with a gradient. Display type is a single solid color — emphasis comes from weight, size, or italic, never a gradient fill.
- **Don't** use glassmorphism decoratively. `backdrop-blur` is permitted on the nav pill and the project-index badge because it sits over a moving image; it is not a default card treatment.
- **Don't** ship the hero-metric template (big number + small label + supporting stats + gradient accent). The home-page stat row is three short value/label pairs on a hairline-top grid — no gradient, no giant number, no supporting-stat stack. Keep it that way.
- **Don't** repeat identical icon-heading-text cards in a grid. The featured-project cards are horizontal media+content rows, not a 3-up card grid. Vary the layout when adding new project surfaces.
- **Don't** put a tiny uppercase tracked eyebrow above EVERY section. One kicker as a deliberate brand system is voice; an eyebrow on every section is AI grammar. Current usage is already at the edge — vary the cadence; let some sections open with the headline alone.
- **Don't** number sections as default scaffolding (`01 / 02 / 03` above every heading). The featured-project index badges earn their numbers because they index a real list; don't propagate that pattern to section headers.
- **Don't** pair `border: 1px solid X` with `box-shadow: 0 Npx Mpx ...` (M ≥ 16px) on the same element. Use the hairline border, never a decorative drop shadow.
- **Don't** round cards past 24px. Feature cards top out at `rounded-[1.5rem]` (24px). Picking 28/32/40px on a card is over-rounding.
- **Don't** ship hand-drawn / sketchy SVG illustrations, `feTurbulence` paper-grain filters, or `repeating-linear-gradient` stripe backgrounds. These are decoration tells; the system's personality is in type, motion, and stance.
- **Don't** gate content visibility on a class-triggered reveal. Reveal animations must enhance an already-visible default; transitions that pause on hidden tabs or headless renderers ship blank sections.
- **Don't** use arbitrary z-index values (999, 9999). The scale in use: background `z-0`, cursor/system-overlay `z-40`-ish, nav `z-50`, command palette above nav, modals above palette, toasts above modals.
- **Don't** let a long display heading overflow its container at any breakpoint. Test hero copy at 320px, 768px, 1280px; if it overflows, reduce the clamp max or rewrite the copy. The viewport is part of the design.

## Secondary pages

- Shared page shell: 1280px outer width, 20–64px side padding, 128–160px top padding. The first viewport should expose useful content below the title.
- Page titles: Fraunces 600, sentence case, 40–76px with 1.08 line height. Article titles cap at 56px with 1.14 line height; long words can wrap on narrow screens.
- Project and article names: Fraunces 600 at 24–30px, 1.25 line height. Section headings: Syne at 24–32px, 1.2 line height.
- Projects use divided rows with project facts, a description, a direct action, and a thumbnail where actual artwork exists. Do not repeat project names inside placeholder preview panels. Filters use compact labeled controls.
- Blog entries use two columns of divided excerpts on desktop, one on phones. Article prose sits at 65ch without an inset card consuming mobile reading width.
- Project case studies use the same page title and shell. Product artwork keeps its original accent; content headings and body text stay smaller than the introduction.
