# AI Agent Entrypoint & Context System

## Project Context
This is an existing production codebase for a high-fidelity, high-speed Invoice & Quote Generator & Manager. It supports freelancers and small businesses with A4 print layout, digital signatures, AI-assisted PDF parsing, and a Supabase dashboard.

## Repository Structure
- `src/app`: Next.js Pages & API Route Handlers
- `src/components`: React components
- `src/hooks`: React Custom Hooks (e.g. `useInvoice.ts`)
- `src/lib`: Core utilities
- `src/modules`: Business logic & schemas
- `docs/`: Architecture and specific implementations
- `docs/specs/`: Feature specifications and plans

## Existing Codebase Rule
This is an existing production codebase.

Do not implement requested functionality as if building a new application.

Before creating a new component, service, utility, hook, API pattern, state-management pattern, or architectural abstraction:
1. Search the repository for an existing equivalent.
2. Inspect how similar functionality is implemented.
3. Reuse existing patterns where appropriate.
4. Extend existing abstractions before creating new ones.
5. Only introduce a new pattern when the existing architecture cannot reasonably support the requirement.
6. Document why the existing pattern was insufficient.

## Architecture Rules
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Tailwind Animate
- **Database / Backend**: Supabase
- **AI Processing**: Google Generative AI
- **No External Store Libraries**: Do not introduce Redux, Zustand, Recoil, or MobX. The hook `useInvoice.ts` provides a custom singleton listener model.
- **No Database schema drift**: Use API route handlers instead of direct client DB access. Ensure compatibility with `customers`, `invoices`, and `invoice_items` schemas.

## Frontend Rules
- Keep client components minimal. Mark files with `"use client"` only when they manage state, use local storage, browser APIs, or React hooks.
- Build form inputs as modular blocks using Radix/Shadcn primitives.
- **Strict Print Invariants**: The A4 printing engine and export PDF functionality must never be broken. Do NOT change export PDF (layout, styles, components) without explicit request. Pure UI controls must use `.no-print`.
- **Theme & UI Rules (Permanent Dark/Light Mode)**: Every new UI must support both themes. Use **Semantic Theme Tokens** (e.g. `bg-background`, `text-foreground`). Hardcoded colors are prohibited unless intentional. Shared components must be theme-aware.
- Use Geist Sans for UI, Geist Mono for tabular values.

## Backend Rules
- All mutations must go through API route handlers (`src/app/api/...`) or React Server Actions.
- Return consistent JSON payloads: `{ success: true, data }` or `{ error: "Error message details" }`.
- Wrap all async operations, API calls, and local storage read/writes in try-catch statements.
- The browser should not hold private tokens (e.g. Supabase service roles, Gemini keys) or call the LLM directly.

## Database Rules
- Schema mutations go through `/api/invoices/save`.
- Preserve transactional data flow for insertions and updates.

## Testing Rules
- Use existing Playwright setup for UI changes.
- Use existing accessibility and responsive tests.
- Do not claim tests passed unless they were actually executed.

## Security Rules
- Keep private tokens private.
- Authorization and Data constraints must be validated server-side.

## AI Workflow Rules
We use a disciplined AI-assisted development workflow combining JSMastery skills and TypeSafe principles:
1. `scope` -> `audit` -> `architect` -> `develop` -> `check` -> `test` -> `document` -> `sync`.
2. For bugs use `debug`.
3. Stop and use `architect` when major architectural, load-bearing decisions are unmade.
4. Explicitly identify Unknowns, Assumptions, Risks, and Evidence (TypeSafe principles) before implementing non-trivial features.
5. Never silently guess load-bearing decisions. Ask for evidence or product decisions.
6. The AI is not the designer. Reproduce visual references exactly. 

## Decision Hierarchy
When making technical decisions, prefer evidence in this order:
1. Existing specification
2. Existing architecture
3. Existing implementation
4. Existing tests
5. Official documentation
6. Runtime behavior
7. Controlled experiment
8. Explicit user decision
9. Explicitly recorded assumption

## Verification Rules
- Run `npm run build` when routes or server code changes.
- Verify happy path, empty states, invalid inputs in browser.
- Verify print styles manually or verify CSS logic.
- Check Supabase state.
- Check regression impact: Existing behavior + New behavior.

## Completion Criteria
A task is complete only when:
[ ] Scope understood
[ ] Existing implementation audited
[ ] Existing patterns identified
[ ] Reusable components identified
[ ] Assumptions identified
[ ] Important assumptions validated
[ ] Specification created/updated if necessary
[ ] Implementation completed
[ ] Acceptance criteria verified
[ ] Regression impact checked
[ ] Tests added/updated
[ ] Tests actually executed
[ ] Runtime behavior verified where necessary
[ ] Accessibility checked where applicable
[ ] Responsive behavior checked where applicable
[ ] Security reviewed where applicable
[ ] Documentation updated
[ ] Project context synchronized
