# UI Context

## Theme

Dark only. No light mode. The visual language is an atmospheric deep-space technical workspace — rich slate-blue backgrounds, distinct elevated layers, and high-contrast vibrant accents for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `slate-*`.

| Role             | CSS Variable         | Hex / Value                |
| ---------------- | -------------------- | -------------------------- |
| Page background  | --bg-base            | #06080C                    |
| Surface          | --bg-surface         | #0D121A                    |
| Elevated surface | --bg-elevated        | #151C26                    |
| Subtle surface   | --bg-subtle          | #1C2532                    |
| Default border   | --border-default     | #253040                    |
| Subtle border    | --border-subtle      | #324054                    |
| Primary text     | --text-primary       | #f8fafc                    |
| Secondary text   | --text-secondary     | #cbd5e1                    |
| Muted text       | --text-muted         | #94a3b8                    |
| Faint text       | --text-faint         | #475569                    |
| Brand accent     | --accent-primary     | #ff6b4a (coral)            |
| Brand dim        | --accent-primary-dim | "rgba(255, 107, 74, 0.15)" |
| AI accent        | --accent-ai          | #10b981 (mint)             |
| AI text          | --accent-ai-text     | #34d399                    |
| Error            | --state-error        | #ef4444                    |
| Success          | --state-success      | #10b981                    |
| Warning          | --state-warning      | #f59e0b                    |

Tailwind utility names map to these variables. Use `bg-base` `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Typography

| Role      | Font           | CSS Variable       |
| --------- | -------------- | ------------------ |
| UI text   | Inter          | `--font-inter`     |
| Code/mono | JetBrains Mono | `--font-jetbrains` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Inter with `antialiased`.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers. The radius is sharper to give a more precise, structured software feel.

| Context           | Class        |
| ----------------- | ------------ |
| Inline / small UI | `rounded-md` |
| Cards / panels    | `rounded-lg` |
| Modal / overlay   | `rounded-xl` |

## Canvas

### Node Color Palette

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character               |
| --------- | ---------- | ----------------------- |
| #1A202C   | #E2E8F0    | Slate neutral (default) |
| #0F2942   | #38BDF8    | Ocean Blue              |
| #281A38   | #C084FC    | Amethyst                |
| #3B1D16   | #FB923C    | Amber                   |
| #3F1519   | #F87171    | Crimson                 |
| #3A142A   | #F472B6    | Magenta                 |
| #0C2E21   | #4ADE80    | Emerald                 |
| #0B2A30   | #2DD4BF    | Cyan                    |

Default node color: `#1A202C` with `#E2E8F0` text.

### Edge Style

Straight-line paths with angled corners (orthogonal routing) and a minimal triangle arrow marker. Default edge color: `#94a3b8`. Stroke width is standard (1.5px) — creating a rigid, architectural feel for the workflow.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small vibrant coral (`#ff6b4a`) square handles, hidden by default, revealed on node hover. Appear at all four sides of a node.

### Canvas Background

React Flow `<Background>` component. Canvas sits on the base background color (#06080C) utilizing a dotted matrix pattern set to the subtle border color (#324054).

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `src/components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. Use the new-york style in shadcn for sharper borders.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars: floating overlay with dark semi-transparent background and subtle border.
- Modals and dialogs: centered overlay, `rounded-xl`, dark background with backdrop blur.
- Navbar: top bar with dark background and bottom border.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
