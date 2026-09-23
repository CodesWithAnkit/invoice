### InvoiceDetail (View Details Page)

File: src/app/dashboard/invoices/[id]/page.tsx
Last updated: 2026-09-22

| Property         | Class           |
| ---------------- | --------------- |
| Background       | bg-card         |
| Border           | border border-border |
| Border radius    | rounded-xl      |
| Text — primary   | text-foreground |
| Text — secondary | text-muted-foreground |
| Spacing          | p-5             |
| Hover state      | hover:text-foreground (links) |
| Shadow           | shadow-sm (header) |
| Accent usage     | bg-primary (timeline dots) |

**Pattern notes:**
Dashboard cards here use `rounded-xl border border-border bg-card p-5`. This is the established pattern for layout blocks on dashboard pages. The sticky action header additionally uses `shadow-sm` and `z-30`.
