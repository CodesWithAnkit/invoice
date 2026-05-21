# AI Agent Entrypoint & Context System

Welcome! To keep this project structured, maintain perfect architectural consistency, and prevent AI drift, this repository enforces a **Six-File Context System**.

Before writing **any** code, executing commands, or making new plans, you **MUST** read and fully understand the six files inside the [context/](file:///Users/ankit_mac/workspace/self/invoice/context/) directory:

1. 📂 **[project_overview.md](file:///Users/ankit_mac/workspace/self/invoice/context/project_overview.md)**
   Defines the product's vision, core user flows, and explicitly outlines what is out of scope to avoid bloat.
2. 🗺️ **[architecture_context.md](file:///Users/ankit_mac/workspace/self/invoice/context/architecture_context.md)**
   Serves as the system blueprint: tech stack, directory layouts, data flows, and strict invariants (rules) that must never be broken.
3. 📐 **[code_standards.md](file:///Users/ankit_mac/workspace/self/invoice/context/code_standards.md)**
   Enforces coding standards across TypeScript typing, API handlers, and React conventions to maintain consistency.
4. ⚙️ **[ai_workflow_rules.md](file:///Users/ankit_mac/workspace/self/invoice/context/ai_workflow_rules.md)**
   Specifies rules of behavior for AI agents, detailing how to tackle tasks step-by-step and maintain discipline.
5. 🎨 **[ui_context.md](file:///Users/ankit_mac/workspace/self/invoice/context/ui_context.md)**
   Captures our theme, responsive layout standards, printing rules, and design tokens to ensure a coherent visual aesthetic.
6. 📈 **[progress_tracker.md](file:///Users/ankit_mac/workspace/self/invoice/context/progress_tracker.md)**
   The live ledger of our work: records current phases, in-progress tasks, completed work, and critical design decisions.

---

## Startup Procedure
Whenever you start a session or receive a new task:
1. Load and read the 6 files mentioned above.
2. Verify the current state from [progress_tracker.md](file:///Users/ankit_mac/workspace/self/invoice/context/progress_tracker.md).
3. Draft a precise execution plan inside the system's `task.md` or `implementation_plan.md` (if in planning mode).
4. Strictly follow the guidelines set out in [ai_workflow_rules.md](file:///Users/ankit_mac/workspace/self/invoice/context/ai_workflow_rules.md).
5. Upon completing a task, update the [progress_tracker.md](file:///Users/ankit_mac/workspace/self/invoice/context/progress_tracker.md) to log your progress for future sessions.
