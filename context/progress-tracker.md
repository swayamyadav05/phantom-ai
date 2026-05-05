# Progress Tracker

Update this file whenever the current phase, active feature, or meaningful implementation state change.

## Current Phase

- In Progress

## Current Goal

- Ready for next feature.

## Completed

- **Feature 01: Design System** — shadcn/ui (base-nova preset) initialized with Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components added to `src/components/ui/`; `src/lib/utils.ts` with `cn()` created; lucide-react installed; globals.css rewritten with project dark theme CSS variables mapped via `@theme inline`; layout.tsx updated to Inter + JetBrains Mono fonts.

## In Progress

- None.

## Next Up

- [Add the next planned feature unit here]

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

- shadcn/ui v4.7.0 uses "base-nova" preset (the replacement for "new-york" style in the new CLI). Components are generated from @base-ui/react primitives.
- Tailwind v4 CSS-first config — no tailwind.config.js. All tokens defined in globals.css via `@theme inline`.
- Dark-only theme: all shadcn `--background`, `--foreground`, etc. are set in `:root` to dark values; no `.dark` class toggling needed.
- `dark:` variant classes on generated shadcn components are inert (class never applied) but harmless since `:root` already provides dark values.

## Session Notes

- Project uses Next.js 16.2.4 with Tailwind v4 (`@import "tailwindcss"` syntax, no tailwind.config.js).
- shadcn CLI v4.7.0 — `--style` flag removed; use `--preset` or `-d` for defaults.
- `npx shadcn@latest init -d` works non-interactively (uses next template + base-nova preset).
- `npx shadcn@latest add <components> --yes` adds components without prompts.
- Do not modify generated `src/components/ui/*` files.
