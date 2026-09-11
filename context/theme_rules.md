# Permanent Dark/Light Mode Development Rules

The application now treats Light Mode and Dark Mode as a **first-class project requirement**.

These rules apply to **all future development**, including new features, pages, components, bug fixes, refactoring, UI changes, and third-party integrations.

Do not treat theme support as a completed feature that can be ignored after implementation.

---

## 1. Every New UI Must Support Both Themes

Any new UI component or page MUST work correctly in Light Mode and Dark Mode. A component is not considered complete if it only works visually in Light Mode.

---

## 2. Use Semantic Theme Tokens

New UI code MUST use the project's semantic theme tokens wherever a semantic token exists.

Prefer `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-popover`, `text-popover-foreground`, `bg-primary`, `text-primary-foreground` over hardcoded color utilities.

---

## 3. Prohibited Hardcoded Theme Colors

Do NOT introduce hardcoded theme-dependent colors such as `bg-white`, `bg-black`, `text-white`, `text-black`, `text-gray-*`, `bg-gray-*`, `bg-slate-*`, `border-gray-*`, `border-slate-*` when the value represents a semantic UI role.

---

## 4. Exceptions Are Allowed Only When Intentional

Hardcoded colors may be used when they represent a deliberate non-theme-dependent value (e.g., brand colors, product colors, data viz). Do not use "brand color" as an excuse for arbitrary hardcoded colors.

---

## 5. No Theme-Specific Page Hacks

Do not implement dark mode by adding random page-level overrides (e.g., `dark:bg-slate-950`). Prefer changing the underlying CSS token so every consuming component receives the correct theme automatically.

---

## 6. Shared Components Must Be Theme-Aware

Any component under areas such as `src/components/`, `src/components/ui/`, `src/components/layout/` must support both themes.

---

## 7. New Components Require Theme Testing

When adding a new significant component, add or update Playwright coverage when appropriate to verify Light Mode, Dark Mode, and interactive states (Hover, Focus, Active, Disabled).

---

## 8. Theme Toggle Must Remain Global

Do not create separate theme toggles for individual pages. There must be one canonical theme-management mechanism.

---

## 9. Never Introduce a Second Theme System

Do not introduce another theme context, another color-token system, or component-specific theme persistence.

---

## 10. Theme Persistence Must Never Be Broken

Future changes must preserve theme persistence across navigation and page reloads.

---

## 11. New States Must Support Both Themes

Every new UI state (Hover, Loading, Success, Error, etc.) must be reviewed in both themes.

---

## 12. Forms & Tables Must Support Both Themes

Every new form control and table must verify background, text, borders, hover states, selection, and error states in both themes. Do not introduce a table with a fixed white background.

---

## 13. Modals, Charts, Icons, and SVGs

- Modals: Verify overlay, background, border, text, and inputs.
- Charts: Verify axis labels, grid lines, and data colors. Prefer centralized chart theme configuration.
- Icons/SVGs: Prefer `currentColor` or theme-aware styling. Avoid hardcoded `fill` or `stroke`.

---

## 14. Accessibility & Responsive

- Accessibility: A component that passes accessibility in Light Mode but fails in Dark Mode is broken.
- Responsive: Responsive behavior and theme behavior must work together. Do not fix a responsive issue by breaking dark mode.

---

## 15. Code Review & Pre-Commit Protection

Every UI change should verify both themes, semantic token usage, and interactive states. Add automated checks that detect newly introduced prohibited hardcoded theme colors where practical.

---

## 16. Definition of Theme-Safe Code

Code is considered theme-safe only when:
✓ Light & Dark Mode works
✓ Semantic tokens are used
✓ Interactive & Focus states work
✓ Accessibility & Responsive behavior is preserved
✓ No unnecessary hardcoded theme colors exist
✓ Shared components do not introduce regressions

---

## 17. Rule for AI Coding Agents

Any AI coding agent working on this repository must follow these rules. Before modifying UI:
1. Inspect the existing theme system.
2. Reuse existing semantic tokens.
3. Reuse existing theme-aware components.
4. Avoid introducing hardcoded theme colors.
5. Verify Light Mode and Dark Mode.
6. Run relevant Playwright tests.

---

## Final Principle
The project should follow this hierarchy:
Design System → Semantic Theme Tokens → Shared UI Components → Application Layouts → Pages → Feature-specific UI.
Theme decisions should be made as high in this hierarchy as possible.
