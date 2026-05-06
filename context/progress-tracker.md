# Progress Tracker

Update this file whenever the current phase, active feature, or meaningful implementation state change.

## Current Phase

- In Progress

## Current Goal

- Feature 09 complete. Ready for next feature.

## Completed

- **Feature 01: Design System** — shadcn/ui (base-nova preset) initialized with Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components added to `src/components/ui/`; `src/lib/utils.ts` with `cn()` created; lucide-react installed; globals.css rewritten with project dark theme CSS variables mapped via `@theme inline`; layout.tsx updated to Inter + JetBrains Mono fonts.
- **Feature 02: Editor Chrome** — `src/components/editor/editor-navbar.tsx` (fixed navbar, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`, left/center/right sections, dark bg + bottom border); `src/components/editor/project-sidebar.tsx` (fixed overlay, slides in from left, My Projects/Shared tabs with empty states, New Project button); shadcn Dialog already available for future dialog patterns.
- **Feature 03: Authentication** — `@clerk/ui` installed; `src/proxy.ts` (protected-first `clerkMiddleware`, public routes from `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars); `ClerkProvider` with `dark` theme and CSS variable overrides wraps root layout; `/` redirects authenticated → `/editor`, unauthenticated → `/sign-in`; `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` with two-panel desktop layout (left: logo + tagline + feature list, right: Clerk form), form-only on mobile; `UserButton` in editor navbar right section.
- **Feature 04: Project Dialogs** — `src/types/project.ts` (Project interface + MOCK_PROJECTS); `src/hooks/use-project-dialogs.ts` (dialog/form/loading state, slug derivation); `src/context/project-actions.tsx` (ProjectActionsContext + useProjectActions hook); `src/components/editor/project-dialogs.tsx` (Create/Rename/Delete dialogs); editor home screen in `src/app/editor/page.tsx` (heading + description + New Project button); sidebar updated with project list, per-item rename/delete actions (owned only), mobile backdrop scrim; EditorShell wires context + dialogs.
- **Feature 05: Prisma Data Models** — `prisma/models/project.prisma` (Project model with ownerId/name/description/status enum DRAFT|ARCHIVED/canvasJsonPath/timestamps + indexes on ownerId and createdAt; ProjectCollaborator model with cascade-delete relation, unique on projectId+email, indexes on email and projectId+createdAt); `prisma/schema.prisma` updated (fixed output path typo, removed url field — datasource URL now owned by `prisma.config.ts`); `src/lib/prisma.ts` cached singleton branching on DATABASE_URL prefix (prisma+postgres:// → accelerateUrl, otherwise PrismaPg adapter); migration `20260506100955_init_project_models` applied; Prisma client generated to `src/app/generated/prisma`.
- **Feature 06: Project API Routes** — `src/app/api/projects/route.ts` (GET lists owner's projects ordered by createdAt desc; POST creates project with optional name defaulting to "Untitled Project"); `src/app/api/projects/[projectId]/route.ts` (PATCH renames project — owner-only, 400 on blank name; DELETE removes project — owner-only); all routes return 401 for unauthenticated requests, 403 for non-owner mutations; Clerk `auth()` used for identity; no UI wiring.
- **Feature 07: Wire Editor Home** — `src/lib/projects.ts` (server helper `getEditorProjects` fetches owned projects by userId and shared via ProjectCollaborator email lookup using `currentUser()`); `src/types/project.ts` (simplified to `{ id, name, isOwned }`, MOCK_PROJECTS removed); `src/hooks/use-project-actions.ts` (unified hook: create calls POST and navigates to new workspace, rename calls PATCH and refreshes, delete calls DELETE and redirects to /editor if active project else refreshes; create dialog generates short suffix for room ID preview); `src/app/editor/layout.tsx` (converted to async server component; fetches projects and passes to EditorShell); `src/components/editor/editor-shell.tsx` (now uses `useProjectActions`, accepts `ownedProjects`/`sharedProjects` props, passes to sidebar); `src/components/editor/project-sidebar.tsx` (accepts real project lists as props, MOCK_PROJECTS removed); `src/components/editor/project-dialogs.tsx` (typed against `useProjectActions`, create dialog shows "Room ID:" preview, rename dialog no longer requires slug); `src/components/editor/home-new-project-button.tsx` (new client component for the New Project button); `src/app/editor/page.tsx` (converted to server component).
- **Feature 08: Editor Workspace Shell** — dynamic route renamed `src/app/editor/[slug]` → `src/app/editor/[roomId]`; `src/lib/project-access.ts` (`getClerkIdentity` returns `{ userId, primaryEmail }` via `currentUser()`; `findProjectByRoomId` matches slug or id; `userCanAccessProject` checks owner or `ProjectCollaborator` row by primary email); `src/app/editor/[roomId]/page.tsx` (server component: redirects unauthenticated users to `/sign-in`, renders `AccessDenied` for missing or unauthorized projects, otherwise renders `WorkspaceCanvas`); `src/components/editor/access-denied.tsx` (centered layout, lock icon, message, link back to `/editor` via `buttonVariants`); `src/components/editor/workspace-canvas.tsx` (full-viewport canvas placeholder with dark `bg-base` and centered "Canvas coming soon" message); `src/components/editor/ai-sidebar.tsx` (right-side floating overlay slide-in, header + sparkles empty state); `src/components/editor/editor-navbar.tsx` (optional `workspace` prop swaps logo for project name in center and adds Share button + AI toggle on the right); `src/components/editor/editor-shell.tsx` (reads `roomId` from `useParams`, finds current project from owned/shared lists, manages AI sidebar open state, passes `workspace` to navbar, `currentProjectId` to sidebar, mounts `AiSidebar` only when in workspace); `src/components/editor/project-sidebar.tsx` (`ProjectItem` accepts `isActive` — active item gets `bg-accent-dim`, brand folder icon, primary text, `aria-current="page"`); `src/hooks/use-project-actions.ts` (delete-active match now reads `params?.roomId` and compares against both `slug` and `id`).
- **Feature 09: Share Dialog** — `src/app/api/projects/[projectId]/collaborators/route.ts` (GET lists collaborators enriched via Clerk `getUserList({ emailAddress })` with `{ email, name, avatarUrl }`, returns `{ collaborators, isOwner }`; POST invites by email — owner only, validates format, checks for duplicates, returns enriched record); `src/app/api/projects/[projectId]/collaborators/[email]/route.ts` (DELETE removes collaborator — owner only, decodes URI email param); `src/components/editor/share-dialog.tsx` (Dialog fetches collaborators on open; copy-link button copies project URL with 2 s "Copied!" feedback; owner invite form with inline error; collaborator list with `CollaboratorAvatar` showing Clerk image or initials fallback, per-row remove button for owners; collaborators see read-only list); `src/components/editor/editor-shell.tsx` (adds `isShareOpen` state, `onShare` now calls `setIsShareOpen(true)`, mounts `ShareDialog` when `currentProject` is set).

## In Progress

- None.


## Next Up

- [Add the next planned feature unit here, eg. Next Feature X (TBD) ]

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

[update as we go]

- shadcn/ui v4.7.0 uses "base-nova" preset (the replacement for "new-york" style in the new CLI). Components are generated from @base-ui/react primitives.
- Tailwind v4 CSS-first config — no tailwind.config.js. All tokens defined in globals.css via `@theme inline`.
- Dark-only theme: all shadcn `--background`, `--foreground`, etc. are set in `:root` to dark values; no `.dark` class toggling needed.
- `dark:` variant classes on generated shadcn components are inert (class never applied) but harmless since `:root` already provides dark values.

## Session Notes

[update as we go]

- Project uses Next.js 16.2.4 with Tailwind v4 (`@import "tailwindcss"` syntax, no tailwind.config.js).
- shadcn CLI v4.7.0 — `--style` flag removed; use `--preset` or `-d` for defaults.
- `npx shadcn@latest init -d` works non-interactively (uses next template + base-nova preset).
- `npx shadcn@latest add <components> --yes` adds components without prompts.
- Do not modify generated `src/components/ui/*` files.
