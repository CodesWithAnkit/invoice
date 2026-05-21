# Code Standards: Invoice System

## TypeScript Best Practices
- **Strict Typing**: Avoid using `any` at all costs. Define and import interfaces and types for all entities, models, and function signatures.
- **Location of Types**: Declare core entities in modules (e.g. `src/modules/invoice/invoice.types.ts`). Avoid scattered type declarations in components.
- **Zod for Validation**: Use `zod` schemas for incoming request payloads and complicated form state schemas. Maintain alignment between Zod schemas and TypeScript interfaces.

---

## React Component Patterns
- **Functional Components**: Write pure functional components using modern React patterns (e.g. hooks, context).
- **Client vs. Server Components**:
  - Keep client components minimal. Mark files with `"use client"` only when they manage state, use local storage, browser APIs, or React hooks.
  - Server components are the default for layouts and static display components.
- **Hook Dependencies**: Always list correct variables in dependency arrays for hooks like `useCallback`, `useMemo`, and `useEffect` to prevent infinite renders or stale closures.
- **Reusable Form Elements**: Build form inputs as modular blocks inside `src/components/form/` or similar folders, using Radix/Shadcn primitives.

---

## Styling & Tailwind CSS Conventions
- **Tailwind CSS v4**: Build styles around Tailwind's utility class names. Leverage CSS custom properties configured in `@import "tailwindcss"` and `src/app/globals.css`.
- **CSS Variables**: Customize colors, borders, and rounded corners by overriding Shadcn HSL color values (e.g. `var(--primary)`, `var(--muted-foreground)`).
- **Responsive Classes**: Always design mobile-first. Use tailwind breakpoints (`sm:`, `md:`, `lg:`) to control responsiveness rather than arbitrary media query blocks.
- **Separation of Print CSS**: Keep print-specific styles separate. Utilize the custom `.no-print` classes to hide interface wrappers, sidebars, and control buttons on A4 paper printing.

---

## Error Handling & Feedback
- **Try/Catch Blocks**: Wrap all asynchronous operations, API calls, and local storage read/writes in try-catch statements.
- **User Notifications**:
  - Import `toast` from `sonner` to display success, error, warning, or loading states.
  - Never use standard browser `alert()` or `confirm()` boxes.
- **Server API Responses**:
  - Always return consistent JSON payloads from Route Handlers: `{ success: true, data }` or `{ error: "Error message details" }`.
  - Send correct HTTP status codes (e.g. 200 for OK, 400 for bad request payloads, 401 for unauthorized, 500 for server failures).
