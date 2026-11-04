# NewsLink — Design System (`DESIGN.md`)

> Generated and enforced via `npx ui-skills` (`ibelick/baseline-ui`, `anthropics/frontend-design`, and `ibelick/create-design-md`).

---

## 1. Aesthetic Direction & Editorial Identity
- **Domain:** Collaborative Investigative Journalism & Cross-Newsroom Resource Dispatch (Zimbabwe / Southern Africa).
- **Point of View:** High-contrast graphite ink surfaces (`#08090a` → `#0f1113`), front-page editorial serif headlines (**Newsreader**), and disciplined data tables (**Inter** with `tabular-nums`).
- **Anti-Slop Guardrails (`baseline-ui`):**
  - Zero decorative gradients (`bg-gradient-*`) or ambient blur blobs (`blur-3xl`).
  - Zero `animate-pulse` status dots or colored drop-shadow glows (`shadow-teal-500/*`).
  - Zero tracked-out `uppercase tracking-wider` eyebrow labels or trailing `→` button text.
  - Zero decorative emojis (`✨`, `⚡`, `📡`, `🎥`) inside buttons or map pins — use Lucide icons and typographic status dots.

---

## 2. Color Tokens (`src/app/globals.css`)

| Token / Tailwind Utility | Hex | Semantic Role |
| :--- | :--- | :--- |
| `--bg-primary` / `bg-slate-950` | `#08090a` | Root canvas, inset wells, code/evidence drawers |
| `--bg-secondary` / `bg-slate-900` | `#0f1113` | Primary card surface, sticky header, modal dialog |
| `border-slate-800` | `#1c1f22` | Default card and table divider hairlines |
| `border-slate-700` | `#2b2f33` | Interactive control and input borders |
| `text-slate-100` | `#eceeef` | Primary headline and body copy |
| `text-slate-400` | `#8b9298` | Secondary metadata and supporting captions |
| `bg-teal-400` / `text-teal-300` | `#2dd4bf` | Primary interactive accent (1 primary CTA per surface) |
| `text-emerald-300` | `#6ee7b7` | Verified evidence (`Documented Evidence`) & signed-off gates |
| `text-amber-300` | `#fcd34d` | Uncorroborated claims (`Unverified Allegation`) & pending custody |
| `text-rose-300` | `#fda4af` | Cross-organisation `HTTP 403` ACL blocks & legal warnings |

---

## 3. Typography & Hierarchy (`src/app/layout.tsx`)
- **Display & Primary Headings (`h1`, `h2`):** `Newsreader` (`--font-newsreader`), `font-weight: 600`, `text-wrap: balance`.
- **UI, Subheadings & Body (`h3`, `p`, controls):** `Inter` (`--font-inter`), `font-feature-settings: "cv11", "ss01"`, `text-wrap: pretty` on paragraphs.
- **Data, Rates, Latencies & Page Citations:** Always apply `tabular-nums` (`font-variant-numeric: tabular-nums`).
- **Minimum Type Floor:** `12px` (`text-xs`) for body/captions; `11px` (`text-[11px]`) reserved strictly for compact count pills.

---

## 4. Layout, Viewport & Accessibility Rules
- **Viewport Sizing:** Always use `min-h-dvh` / `h-dvh` (never `h-screen`).
- **Square Icons & Avatars:** Use Tailwind v4 `size-*` (`size-3.5`, `size-4`, `size-5`, `size-8`, `size-10`) instead of `w-* h-*`.
- **Fixed Z-Index Scale:** Use standard scale (`z-10`, `z-20`, `z-30`, `z-50`) — no arbitrary `z-[...]`.
- **Motion & Reduced Motion:** Transitions limited to `150ms ease-out` on `opacity`, `transform`, and local color; full `@media (prefers-reduced-motion: reduce)` override in [`src/app/globals.css`](file:///home/malwande/School/Connected%20NewsRoom/src/app/globals.css).
- **Dialogs & Controls:** Modals include `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`; close buttons include explicit `aria-label`.
