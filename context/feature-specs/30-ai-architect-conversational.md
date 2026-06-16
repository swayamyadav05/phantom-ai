# Feature 28 — Conversational AI Architect (discuss / query / tweak)

Make the **AI Architect** tab a real conversation with Phantom AI. Today every
message in that tab triggers a full from-scratch design generation
(`POST /api/ai/design` → `design-agent`, schema requires ≥1 action). So you cannot
ask a question, get an explanation, or make a small change — every turn rebuilds a
whole diagram, which is also why "every project looks the same".

After this feature the AI Architect tab supports three kinds of turns:

1. **Design** — empty canvas or "design X from scratch": full generation (today's
   behavior, preserved).
2. **Tweak** — "make it handle 1M users", "add a cache", "this is vague, tighten
   it": **incremental** edits to the existing nodes/edges, not a rebuild.
3. **Discuss / query** — "why a message queue?", "is this scalable?": a concise
   text answer, **no** canvas change.

The **Chat** tab is unchanged — it stays human-to-human room collaboration
([spec 25](25-sidebar-chat-feed.md)).

## Root cause being addressed

`current-issues.md` issue 2: the AI surface (AI Architect) can only full-generate,
so discussing or tweaking is impossible and outputs feel repetitive. (Issue 2's
empty-edge-labels and issue 1's sidebar-default-open are already fixed separately and
are **not** part of this feature.)

## Surface separation (prerequisite)

Today both tabs read/write the same `ai-chat` feed
([ai-sidebar.tsx:418](../../src/components/editor/ai-sidebar.tsx) and
[:821](../../src/components/editor/ai-sidebar.tsx)), so AI prompts/replies bleed into
the human collaboration chat.

- Add `AI_ARCHITECT_FEED_ID = "ai-architect"` in `types/tasks.ts`.
- `AiArchitectTab` reads/writes `ai-architect`; the human Chat tab keeps `ai-chat`.
- Reuse the existing `AiChatMessage` schema/guard for both feeds (same shape).
- Lift feed creation to a single owner mounted once at the sidebar root
  (`useEnsureAiFeeds()`), so each feed is created exactly once per session — this
  also removes the duplicate-`createFeed` race behind the `Feed mutation timeout`
  (issue 1b) where both tabs created `ai-chat` on mount.

## Implementation

### 1. Conversational plan — `src/lib/ai/architect-plan.ts` (new)

- Reuse `designActionSchema` from `design-plan.ts` (do not duplicate the action
  union).
- `architectPlanSchema = z.object({ reply: z.string(), actions: z.array(designActionSchema).default([]) })`.
  Empty `actions` ⇒ discuss/query turn; non-empty ⇒ design/tweak turn. Intent is
  decided by the model, not a separate classifier.
- `ARCHITECT_SYSTEM_PROMPT`: conversational variant of `DESIGN_AGENT_SYSTEM_PROMPT`
  that:
  - is told it is mid-conversation on an existing (possibly empty) canvas, with the
    recent turns + current nodes/edges supplied as context;
  - always produces a short, friendly `reply`;
  - emits `actions` only when the user wants to create or change the design, and for
    tweaks prefers the **smallest** incremental edit set (extend/refine — never wipe
    and rebuild unless asked);
  - reuses the same shape/color/layout/label rules by importing the shared constants
    (keeps the edge-label fix and palette consistent).

### 2. Conversational task — `src/trigger/architect-agent.ts` (new)

- `architectAgentTask` (id `architect-agent`), payload
  `{ prompt, roomId, history }` (history = recent `ai-architect` turns, ~last 10).
- Reuse the design agent's canvas read + apply logic. **Refactor first:** extract
  `describeCanvas`, `buildNodeFromAction`, `buildEdgeFromAction`,
  `actionTargetCursor`, and the per-action `mutateFlow` + presence-lead loop out of
  `design-agent.ts` into `src/lib/ai/canvas-apply.ts`, and have **both** tasks call
  it. The design agent's external behavior must not change.
- `generateText({ output: Output.object({ schema: architectPlanSchema }) })`,
  apply `actions` (if any) through the shared apply loop.
- Run metadata: `reply` (string), `status`, `appliedActions`, `summary` (= reply for
  back-compat with the sidebar's completion read).

### 3. API route — `src/app/api/ai/architect/route.ts` (new, Node runtime)

- Mirror `src/app/api/ai/design/route.ts` (auth → resolve project → authorize →
  trigger → persist `TaskRun` → return `{ runId, publicToken }`).
- Validate `{ prompt, roomId, projectId, history? }`.
- (Optional cleanup: `/api/ai/design` can remain as the explicit "from scratch"
  entry, or be folded in later — out of scope here.)

### 4. Wire the AI Architect tab — `src/components/editor/ai-sidebar.tsx`

- `AiArchitectTab` posts the user message to `ai-architect`, builds `history` from
  current entries (~last 10), calls `POST /api/ai/architect`, stores
  `{ runId, publicToken }`, and mounts the existing `ActiveRunSubscriber`.
- On completion, read `metadata.reply` and post it to `ai-architect` as
  `role: "assistant"`, `sender: "Phantom AI"`; clear `activeRun`.
- Keep the existing busy/disabled + inline-error + status-strip patterns. Canvas
  updates stay 100% Liveblocks-driven (the sidebar never touches nodes/edges).

## Scope limits

- Do **not** change the human Chat tab behavior.
- Do **not** change canvas node/edge rendering or the editor navbar layout.
- Keep all realtime traffic on Liveblocks feeds + Trigger.dev realtime.
- Reuse the design agent's action vocabulary and canvas-apply logic; refactor to
  share, don't fork.

## Check when done

- Asking a question in AI Architect returns a text-only reply, no canvas change.
- "Make it handle 1M users" on a populated canvas applies incremental edits + posts a
  summary; it does not wipe/rebuild.
- "Design an e-commerce backend" on an empty canvas still does a full generation.
- AI conversation no longer appears in the human Chat tab (separate feeds).
- Each feed is created once (no `Feed mutation timeout` from duplicate creates).
- Input disabled while a run is active; errors surface inline.
- `npm run build` passes; no TypeScript errors.

## Open questions

- Should `/api/ai/design` (full-generate) be kept as a separate explicit entry, or
  fully replaced by the conversational route? (Default: keep both for now.)
- Tweak undo granularity — accept current per-mutation Liveblocks history, or group a
  tweak into one history step? (Default: accept current.)
- History window (10 turns) — revisit if replies lose context or token cost grows.
