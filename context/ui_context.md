# UI Context: Design & Layout Rules

## Design System & Theme
We utilize a curated, high-contrast dark/light theme designed to highlight administrative actions while maintaining perfect print fidelity for documents:
- **Dashboard UI**: Dark mode-oriented, modern slate design (`#1e293b` for bars, cards).
- **Invoice Editor Page**: Vibrant accents (Amber for save actions, Blue/Green for prints/exports).
- **Invoice Preview/Print Sheet**: Pure, standard white backdrop with dark high-contrast typography, mimicking actual paper.

---

## Tailwind CSS v4 & HSL Variables
Colors are mapped to global custom properties to enable instant system-wide adjustments:
- `--background`: Base page backdrop (`0 0% 100%` on light, `224 71% 4%` on dark)
- `--foreground`: Text color (`222.2 47.4% 11.2%` on light, `213 31% 91%` on dark)
- `--primary`: Accent colors for buttons/selections (`221.2 83.2% 53.3%` - elegant royal blue)
- `--muted-foreground`: Subtitle details (`215.4 16.3% 46.9%`)
- `--border`: Custom light gray grid lines (`214.3 31.8% 91.4%`)
- `--radius`: Border radius constant (`0.5rem`)

---

## Typography
- **Primary Typeface**: Geist (Sans-serif Vercel font family) for UI labels, numbers, and inputs.
- **Weights**:
  - Regular (`400`) for form inputs and table entries.
  - Medium (`500`) for labels and table headings.
  - Bold (`700`) for totals, company brand titles, and section headers.

---

## Responsive Layout Guidelines
1. **Desktop View (> 768px)**:
   - Double-column split screen.
   - Left side: Invoice form details (Business details, Customer cards, Bank info, Item table).
   - Right side (sticky): Real-time A4 preview sheet.
2. **Mobile View (< 768px)**:
   - Collapse layout into a single, vertical scroll block.
   - **Table Transformation**: Standard tables are hidden (`.desktop-items`). Invoices render each item as a full-width `.item-card` with flex rows containing item parameters (Quantity, Price, Totals) to avoid horizontal squishing.

---

## Strict Print Invariants
- **Paper Constraints**: The print output is styled precisely to fit standard **A4 portrait page** dimensions (`size: A4`, `margin: 0`).
- **Media Controls**: Every screen control, button bar, dashboard link, and editor form wrapper must be enclosed or marked with the `.no-print` helper class.
- **Maximum Item Rule**: The A4 preview holds up to 15 standard line items comfortably on a single page before overflow. Restrict item counts or handle pagination gracefully.
