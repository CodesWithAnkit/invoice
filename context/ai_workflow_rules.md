# AI Workflow Rules: Rules of Behavior

## Rule 1: Startup Protocol
Before writing any code, planning, or suggesting architectural modifications:
1. Locate and read the `agents.md` file in the project root.
2. Read the entire content of all files inside the `context/` folder.
3. Check the current status and phase inside `context/progress_tracker.md`.

---

## Rule 2: Laser Focus (One Feature at a Time)
- Do not make sweeping refactors across unrelated areas of the codebase.
- Tackle only the specific feature, bug, or improvement requested in the prompt.
- Do not add "extra" features or cleanups that are not requested, as this increases complexity and could break standard workflows.

---

## Rule 3: Keep the Ledger Active
- You must keep `context/progress_tracker.md` up-to-date.
- Whenever you finish a task, immediately edit `context/progress_tracker.md` to move items from "In Progress" to "Completed", update the active phase if it has changed, and document any significant architectural decisions.
- This ensures the next agent or the developer picking up the work gets full context in a single prompt.

---

## Rule 4: Safely Modify Print Code
- **High Invariant**: The A4 printing engine must never be broken.
- Do not add visual screen elements that block, break, or wrap within the print-optimized viewport.
- Any element that is purely for UI controls (e.g. Save, Print, Reset, Back to Dashboard) must explicitly include the `.no-print` helper class.
- Always verify print alignment by checking styles under `@page { size: A4 }` and print media queries.

---

## Rule 5: Verification & Safety Checks
- Always compile or test your edits. If you modify TypeScript definitions, make sure there are no compiler errors by checking your changes.
- Ensure that the application runs by running a verification step (e.g. running `npm run build` or the dev server to verify there are no syntax errors).
- Do not push changes that cause lint failures or type validation crashes.
