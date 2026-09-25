# Quotation & Project Estimation Platform
## Design System Specification

**Document Type:** Product Design System  
**Status:** MVP / Implementation Specification  
**Purpose:** Establish a scalable, reusable, accessible, responsive design system for the quotation and project-estimation platform.

---

# 1. Design System Overview

The platform already has a strong visual foundation, including:

- Light and dark themes
- Semantic color tokens
- Centralized typography
- Reusable UI components
- Responsive layouts
- Data tables
- Search and filtering
- Activity timelines
- Empty/loading/error states
- Accessibility testing
- Playwright visual and responsive testing

The objective of this design system is **not to redesign the existing interface**.

The objective is to:

1. Formalize the current approach.
2. Remove visual inconsistencies.
3. Make components reusable across the application.
4. Establish predictable responsive behavior.
5. Standardize accessibility.
6. Create reusable quotation/estimate patterns.
7. Keep Figma and code aligned.
8. Make future feature development faster.

The design system should evolve incrementally alongside product development.

---

# 2. Design Principles

## 2.1 Professional

The interface should feel appropriate for freelancers, agencies, consultants, and professional service businesses.

Visual characteristics:

- Clean
- Structured
- Trustworthy
- Minimal visual noise
- Clear hierarchy
- Strong typography
- Restrained use of color

---

## 2.2 Data First

Important business information should be immediately understandable.

Examples:

- Quote total
- Quote status
- Customer
- Project
- Estimate subtotal
- Tax
- Discount
- Validity
- Timeline

The UI should prioritize information hierarchy over decoration.

---

## 2.3 Reuse Before Creation

Before creating a new component:

1. Search the design system.
2. Check whether an existing component can solve the requirement.
3. Extend an existing component if appropriate.
4. Create a new component only when the pattern is genuinely different.

Avoid creating multiple visually similar components.

---

## 2.4 Responsive by Design

Responsive behavior must be intentionally designed.

The objective is not:

> Desktop UI → smaller desktop UI → mobile.

Instead:

> Desktop experience → tablet adaptation → mobile experience.

Complex interfaces such as Estimate Builder and quotation tables may need different interaction models on mobile.

---

## 2.5 Accessible by Default

Accessibility is part of component design, not a final QA step.

Every reusable component should consider:

- Keyboard navigation
- Focus states
- Screen readers
- Semantic HTML
- Labels
- Error messages
- Contrast
- Touch targets
- Reduced motion
- Disabled states

---

## 2.6 Theme Independent

Components must not depend on hardcoded visual colors.

Components should consume semantic tokens.

Example:

```tsx
color: var(--color-text-primary);
```

rather than:

```tsx
color: #111827;
```

This allows light/dark themes and future branding without rewriting components.

---

# 3. Design System Architecture

The system follows five layers:

```text
Design Tokens
      ↓
Primitive Components
      ↓
Composite Components
      ↓
Product Patterns
      ↓
Page Templates
      ↓
Product Screens
```

## Layer 1 — Tokens

Visual foundations:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Borders
- Motion
- Breakpoints
- Z-index

## Layer 2 — Primitive Components

Examples:

- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Badge
- IconButton
- Tooltip

## Layer 3 — Composite Components

Examples:

- SearchInput
- FilterBar
- FormField
- DateRangePicker
- DataTable
- Dialog
- Dropdown
- Toast
- Pagination

## Layer 4 — Product Patterns

Examples:

- Quote Status
- Estimate Line Item
- Quote Summary
- Customer Header
- Project Summary
- Activity Timeline
- Estimate Builder
- Quotation Preview

## Layer 5 — Page Templates

Examples:

- Dashboard
- Customer Detail
- Project Detail
- Quote Editor
- Quote Preview
- Settings

---

# 4. Design Tokens

Tokens are the single source of truth for visual decisions.

No product screen should introduce arbitrary visual values without a design-system reason.

---

# 5. Color System

The existing semantic-token approach should remain.

Colors should be categorized into semantic roles rather than component-specific colors.

## 5.1 Background Tokens

```text
background
background-subtle
background-muted
background-elevated
background-overlay
background-inverse
```

Usage:

- Application background
- Cards
- Panels
- Secondary sections
- Modals

---

## 5.2 Surface Tokens

```text
surface
surface-hover
surface-active
surface-selected
surface-disabled
surface-raised
```

Used for cards, dropdowns, tables, inputs and interactive surfaces.

---

## 5.3 Text Tokens

```text
text-primary
text-secondary
text-tertiary
text-muted
text-disabled
text-inverse
text-link
```

Hierarchy:

```text
Primary
  ↓
Secondary
  ↓
Tertiary
  ↓
Muted
```

---

## 5.4 Border Tokens

```text
border-default
border-subtle
border-strong
border-focus
border-error
border-success
border-warning
```

---

## 5.5 Status Tokens

Statuses must have consistent semantic meanings.

```text
success
success-subtle

warning
warning-subtle

error
error-subtle

info
info-subtle
```

These should be reused across:

- Badges
- Alerts
- Toasts
- Tables
- Timeline
- Quote status
- Project status

---

# 6. Business Status System

The quotation platform has important business statuses.

## Quotation

```text
Draft
Sent
Viewed
Accepted
Rejected
Expired
Archived
```

## Project

```text
Draft
Estimating
Quoted
Accepted
Rejected
Expired
Completed
Archived
```

Status colors must be consistent throughout the application.

For example:

```text
Draft       → Neutral
Sent        → Informational
Viewed      → Informational
Accepted    → Success
Rejected    → Error
Expired     → Warning
Archived    → Muted
```

The exact color values should come from semantic tokens.

---

# 7. Typography

Typography should provide clear information hierarchy.

## Recommended hierarchy

```text
Display
Heading 1
Heading 2
Heading 3
Heading 4
Body Large
Body
Body Small
Caption
Label
```

## Typography responsibilities

### Page title

Used once per primary page.

### Section heading

Separates major content groups.

### Body

Primary readable content.

### Label

Used for form controls and metadata.

### Caption

Supporting information.

---

# 8. Typography Rules

Avoid using font size alone to communicate importance.

Hierarchy should combine:

- Size
- Weight
- Color
- Spacing
- Position

Financial values may use stronger typography than surrounding metadata.

Example:

```text
Project Estimate

$12,450.00
Estimated project cost
```

The total receives stronger visual hierarchy.

---

# 9. Spacing System

Use a consistent spacing scale.

Example:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Common usage:

| Space | Typical Usage |
|---|---|
| 4px | Icon/text spacing |
| 8px | Tight component spacing |
| 12px | Input/content spacing |
| 16px | Standard component padding |
| 24px | Card/page section spacing |
| 32px | Major section spacing |
| 48px | Page-level separation |
| 64px+ | Large layout spacing |

Avoid arbitrary spacing values.

---

# 10. Border Radius

Use a limited radius scale.

```text
radius-sm
radius-md
radius-lg
radius-xl
radius-full
```

Recommended usage:

- Small controls → `sm`
- Inputs/buttons → `md`
- Cards → `lg`
- Larger surfaces → `xl`
- Pills/avatar → `full`

---

# 11. Elevation and Shadows

Keep elevation restrained.

Suggested hierarchy:

```text
shadow-none
shadow-sm
shadow-md
shadow-lg
```

Use elevation primarily for:

- Dropdowns
- Modals
- Popovers
- Floating panels
- Elevated cards

Avoid excessive shadows on ordinary content cards.

---

# 12. Iconography

Icons should communicate meaning rather than decoration.

Rules:

- Use one icon library consistently.
- Maintain consistent stroke weight.
- Do not mix visually incompatible icon styles.
- Icon-only buttons require accessible labels.
- Decorative icons should not be announced by screen readers.
- Icons should not replace text when meaning would become ambiguous.

---

# 13. Motion

Motion should communicate state changes.

Use motion for:

- Dialog appearance
- Dropdown opening
- Toast appearance
- Loading transitions
- Expand/collapse
- Navigation changes

Avoid:

- Decorative animations
- Excessive movement
- Long transitions
- Animation that delays interaction

Support:

```text
prefers-reduced-motion
```

---

# 14. Breakpoints

The system should support three primary experiences:

```text
Mobile
Tablet
Desktop
```

The exact breakpoint values should remain centralized in the implementation.

Components should define responsive behavior instead of relying entirely on global CSS.

---

# 15. Responsive Strategy

## Desktop

Prioritize:

- Multi-column layouts
- Full data tables
- Side navigation
- Dense estimate editing
- Detailed quotation preview

## Tablet

Prioritize:

- Reduced columns
- Adaptive side navigation
- Stacked secondary information
- Reduced horizontal density

## Mobile

Prioritize:

- Primary actions
- Essential information
- Stacked forms
- Card-based data
- Bottom sheets/drawers where appropriate
- Horizontal scrolling only when unavoidable

---

# 16. Mobile Data Tables

Tables should not simply overflow the viewport.

Possible strategies:

### Strategy A — Responsive columns

Hide lower-priority columns.

### Strategy B — Card transformation

Convert rows into cards.

### Strategy C — Horizontal scrolling

Use only where preserving table structure is important.

### Strategy D — Detail expansion

Show essential row information and expose secondary information through expansion.

The correct strategy should depend on the data.

---

# 17. Component Architecture

Components should be organized by responsibility.

Example:

```text
components/
├── primitives/
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Badge
│   └── IconButton
│
├── feedback/
│   ├── Alert
│   ├── Toast
│   ├── EmptyState
│   ├── LoadingState
│   └── ErrorState
│
├── navigation/
│   ├── Sidebar
│   ├── TopNavbar
│   ├── Breadcrumbs
│   └── Tabs
│
├── forms/
│   ├── FormField
│   ├── CurrencyInput
│   ├── PercentageInput
│   └── DateInput
│
├── data-display/
│   ├── DataTable
│   ├── StatusBadge
│   ├── ActivityTimeline
│   └── Pagination
│
└── quotation/
    ├── EstimateLineItem
    ├── EstimateBuilder
    ├── QuoteSummary
    ├── QuoteStatus
    └── QuotePreview
```

The exact folder structure may vary with the existing codebase.

The architectural principle is more important than the folder naming.

---

# 18. Primitive Components

The core primitive library should include:

- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Badge
- Avatar
- Tooltip
- Separator
- Label
- Card
- Tabs
- Dropdown
- Dialog
- Popover

Each component should support:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Error where applicable

---

# 19. Button System

Button hierarchy:

```text
Primary
Secondary
Tertiary
Destructive
Ghost
Icon
```

Primary action should be visually dominant.

Examples:

```text
Create Quote
Save Changes
Send Quote
```

Secondary:

```text
Cancel
Preview
Duplicate
```

Destructive:

```text
Delete
Archive
Reject
```

Buttons should support:

- Loading state
- Disabled state
- Icon
- Icon-only variant
- Full-width mobile variant where appropriate

---

# 20. Form System

All forms should use consistent:

```text
Label
Input
Help Text
Error Message
```

Structure:

```text
Field Label

[ Input ]

Supporting text

Error message
```

Validation should be:

- Immediate when appropriate
- Clear
- Specific
- Accessible

Avoid generic:

> Invalid value.

Prefer:

> Rate must be greater than or equal to 0.

---

# 21. Financial Input Components

Quotation creation requires specialized financial controls.

Required components:

### CurrencyInput

```text
₹ 25,000.00
```

### PercentageInput

```text
10%
```

### QuantityInput

```text
5
```

### RateInput

```text
₹ 1,500 / hour
```

These components should handle:

- Formatting
- Decimal precision
- Empty state
- Invalid values
- Min/max values
- Keyboard input
- Locale/currency formatting

---

# 22. DataTable

The existing generic `DataTable` should remain the foundation for tabular data.

It should support:

- Sorting
- Filtering
- Pagination
- Selection where required
- Loading
- Empty state
- Error state
- Responsive behavior
- Keyboard interaction

The component should remain generic.

Business-specific behavior should be implemented through wrappers.

Example:

```text
DataTable
   ↓
QuotationTable
   ↓
Quotation page
```

Not:

```text
DataTableWithEveryBusinessRule
```

---

# 23. Search and Filtering

The existing `SearchInput` and `FilterBar` should become standard application patterns.

Search should support:

- Clear action
- Loading state
- Keyboard accessibility
- Debouncing where required

Filters should:

- Be understandable
- Show active state
- Support clearing
- Preserve state where appropriate
- Become responsive on mobile

---

# 24. Feedback States

Every data-driven screen should support four primary states:

```text
Loading
Empty
Error
Success
```

These are not optional visual enhancements.

---

# 25. Loading State

Use:

- Skeletons for structured content
- Spinners for short actions
- Progress indicators for long-running operations

Avoid blank screens during loading.

---

# 26. Empty State

An empty state should explain:

1. What is empty.
2. Why it may be empty.
3. What the user can do next.

Example:

```text
No quotations yet

Create your first quotation to start estimating
and sharing project costs with clients.

[ Create Quotation ]
```

---

# 27. Error State

Errors should explain:

- What happened
- Whether the user can recover
- What action to take

Example:

```text
Unable to load quotations

Something went wrong while loading your quotations.

[ Try Again ]
```

---

# 28. Dialog and Confirmation System

Dialogs should be reserved for meaningful decisions.

Use for:

- Delete
- Archive
- Unsaved changes
- Important confirmation
- Destructive actions

Avoid dialogs for ordinary navigation.

Dialogs must support:

- Escape
- Focus trapping
- Keyboard navigation
- Accessible title
- Accessible description

---

# 29. Toast System

Toasts should communicate transient results.

Examples:

```text
Quotation saved
Customer created
Changes discarded
Quotation sent
```

Do not use toasts for critical information that must remain visible.

---

# 30. Activity Timeline

The Activity Timeline represents quotation history.

Events may include:

```text
Created
Updated
Sent
Viewed
Accepted
Rejected
Expired
```

Each event should contain:

- Event type
- Timestamp
- Actor when available
- Optional description

This component should remain reusable across:

- Quotations
- Customers
- Projects

---

# 31. Estimate Builder

The Estimate Builder is the most important domain-specific design pattern.

It should provide:

```text
Estimate Header
↓
Line Items
↓
Subtotal
↓
Discount
↓
Tax
↓
Total
↓
Scope
↓
Timeline
```

---

# 32. Estimate Line Item

Each line item should support:

```text
Service/Product
Description
Pricing Model
Quantity
Rate
Amount
Actions
```

Example:

```text
Website Development

Quantity: 1
Rate: ₹80,000
Amount: ₹80,000
```

The amount should be calculated rather than manually entered.

---

# 33. Estimate Builder Desktop Layout

Recommended structure:

```text
------------------------------------------------
Project / Customer
------------------------------------------------

Estimate Items

┌──────────────────────────────────────────────┐
│ Item │ Qty │ Rate │ Amount │ Actions         │
├──────────────────────────────────────────────┤
│ ...                                          │
└──────────────────────────────────────────────┘

                           Subtotal   ₹100,000
                           Discount   -₹10,000
                           Tax        ₹16,200
                           -------------------
                           Total      ₹106,200

[ Add Item ]

------------------------------------------------
Scope & Deliverables
------------------------------------------------

------------------------------------------------
Timeline
------------------------------------------------
```

---

# 34. Estimate Builder Mobile

Do not compress the desktop table into a tiny screen.

Instead use:

```text
Service
Website Development

Pricing
Hourly

Quantity
40 hours

Rate
₹2,000

Amount
₹80,000

[ Edit ]
[ Remove ]
```

The summary remains sticky or easily accessible.

---

# 35. Quote Summary

The Quote Summary should be reusable.

Structure:

```text
Subtotal
Discount
Tax
----------------
Total
```

The total should have strong visual hierarchy.

Optional:

```text
Estimated Project Cost
₹1,25,000
```

---

# 36. Quotation Preview

Quotation Preview should represent the client-facing document rather than the internal editor.

Sections:

1. Business branding
2. Quote information
3. Customer
4. Project
5. Scope
6. Deliverables
7. Estimate
8. Timeline
9. Assumptions
10. Terms
11. Total
12. Acceptance actions

The preview should closely match the generated PDF.

---

# 37. Quote Status Component

A reusable `QuoteStatus` component should be used everywhere.

Examples:

```text
Draft
Sent
Viewed
Accepted
Rejected
Expired
Archived
```

The component should provide:

- Semantic color
- Label
- Optional icon
- Accessible text

---

# 38. Customer Header Pattern

Customer detail pages should use a standardized header.

```text
Customer Name
Company
Email / Phone

[ Edit ] [ Create Quote ]
```

Supporting information can appear below.

---

# 39. Project Header Pattern

Project detail:

```text
Project Name
Customer
Status

[ Edit ] [ Create Quote ]
```

Then:

```text
Overview
Estimate
Quotations
Activity
```

---

# 40. Page Layout System

Standard application page:

```text
App Shell
   ↓
Page Header
   ↓
Page Actions
   ↓
Filters / Search
   ↓
Primary Content
```

Example:

```text
Quotations

Manage and track your project quotations.

                         [ Create Quotation ]

[ Search ] [ Status ] [ Date ]

------------------------------------------------
Quotation list
------------------------------------------------
```

---

# 41. Page Header Rules

Every major page should have:

- Page title
- Optional description
- Primary action
- Optional secondary actions

Avoid putting excessive actions into the header.

---

# 42. Navigation

Primary navigation:

```text
Dashboard
Customers
Projects
Quotations
Products & Services
Templates
Settings
```

Navigation should clearly communicate the user's current location.

Active navigation should use semantic tokens.

---

# 43. Application Shell

The application shell should provide:

```text
Sidebar
Top Navigation
Main Content
Responsive Mobile Navigation
```

The shell should remain independent from business-domain pages.

---

# 44. Dashboard Design Pattern

Dashboard should prioritize quotation activity.

Primary KPIs:

```text
Total Quotations
Quoted Value
Accepted Value
Pending Quotations
Acceptance Rate
```

Then:

```text
Quotation Pipeline
Quotation Value Trend
Recent Quotations
```

Every dashboard widget should support loading, empty and error states.

---

# 45. Settings Design Pattern

Settings should use grouped sections rather than one long form.

Example:

```text
Business
  Business Information
  Branding

Quotation
  Defaults
  Numbering
  Terms

Appearance
  Theme
  Brand Colors

Account
  Profile
  Security
```

---

# 46. Accessibility Standards

Target:

**WCAG 2.2 AA**

Minimum requirements:

- Keyboard navigation
- Visible focus
- Proper labels
- Semantic headings
- Accessible dialogs
- Accessible dropdowns
- Accessible tables
- Color contrast
- Error association
- Screen-reader-friendly status messages
- Minimum touch target sizes

Accessibility testing should use automated tooling such as axe alongside manual keyboard testing.

---

# 47. Component Accessibility Contract

Every reusable component should document:

```text
Keyboard behavior
Focus behavior
ARIA requirements
Screen reader behavior
Disabled behavior
Error behavior
```

Example:

### Dialog

Must support:

- Focus trap
- Escape
- Initial focus
- Return focus
- Accessible title
- Accessible description

---

# 48. Design System Documentation

Every reusable component should document:

## Purpose

What problem does the component solve?

## Usage

When should it be used?

## Variants

What variants exist?

## States

What states exist?

## Responsive Behavior

How does it behave on mobile/tablet/desktop?

## Accessibility

What accessibility requirements exist?

## Do

Recommended usage.

## Don't

Incorrect usage.

---

# 49. Figma Structure

Figma should mirror the code architecture.

Recommended structure:

```text
Design System

01 Foundations
   Colors
   Typography
   Spacing
   Radius
   Shadows
   Icons

02 Components
   Buttons
   Inputs
   Forms
   Feedback
   Navigation
   Data

03 Patterns
   Estimate Builder
   Quote Summary
   Customer Header
   Project Header
   Activity Timeline

04 Templates
   Dashboard
   Customer
   Project
   Quotation
   Settings

05 Screens
   Product UI
```

---

# 50. Figma and Code Alignment

A component should not exist only in Figma or only in code when it is intended to be reusable.

Where practical:

```text
Figma Component
      ↕
Code Component
```

Both should share:

- Naming
- Variants
- States
- Tokens
- Responsive rules

---

# 51. Design Token Governance

Before adding a new token ask:

1. Is an existing token suitable?
2. Is the new value genuinely semantically different?
3. Will multiple components use it?
4. Does it belong to the design system?

Avoid:

```text
--blue-17
--gray-23
--custom-padding-13
```

Prefer semantic naming:

```text
--color-text-primary
--color-surface-muted
--color-border-default
--spacing-md
```

---

# 52. Component Creation Rules

A new component is justified when:

- The pattern appears multiple times.
- The interaction is complex.
- Accessibility behavior must be standardized.
- Responsive behavior is non-trivial.
- The component represents a meaningful domain pattern.

Do not create components simply to split files.

---

# 53. Domain Component Rules

Domain components should be separated from generic components.

Generic:

```text
DataTable
Button
Dialog
Input
Badge
```

Domain:

```text
QuotationTable
EstimateBuilder
QuoteSummary
QuoteStatus
CustomerHeader
```

Domain components may compose generic components.

---

# 54. Theme Rules

Light and dark themes must both be treated as first-class experiences.

Every component should be checked in:

```text
Light
Dark
Hover
Focus
Disabled
Error
Success
```

Avoid component-specific dark-mode hacks.

Use semantic tokens.

---

# 55. Responsive Testing

Every major reusable component should be tested at:

```text
Mobile
Tablet
Desktop
```

Important scenarios:

- Long text
- Long customer names
- Large currency values
- Many line items
- Empty data
- Validation errors
- Multiple statuses
- Narrow screens

---

# 56. Visual Regression

Shared components should be covered by visual regression tests.

Priority components:

```text
Button
Input
Select
Dialog
DataTable
Badge
Toast
EmptyState
ErrorState
EstimateLineItem
QuoteSummary
QuotePreview
```

Theme coverage:

```text
Light
Dark
```

---

# 57. Playwright Design-System Tests

Tests should verify:

### Functional

- Interaction
- Validation
- Keyboard behavior

### Responsive

- No unintended horizontal overflow
- Correct stacking
- Correct mobile behavior

### Accessibility

- axe checks
- Focus behavior
- Accessible names
- Labels

### Visual

- Component screenshots
- Light/dark screenshots
- Important responsive breakpoints

---

# 58. Design-System Quality Gates

A component should not be considered production-ready until it passes:

```text
✓ Tokenized
✓ Responsive
✓ Accessible
✓ Light theme
✓ Dark theme
✓ Loading state where relevant
✓ Empty state where relevant
✓ Error state where relevant
✓ Keyboard interaction
✓ Visual regression
✓ Documentation
```

---

# 59. Design-System Violations

The following should be treated as design-system violations:

### Visual

- Hardcoded colors
- Random spacing
- Random border radius
- Inconsistent typography

### Components

- Duplicate components
- Copy-pasted UI patterns
- Business logic inside generic primitives

### Themes

- Light-only components
- Dark-mode hacks
- Hardcoded dark backgrounds

### Responsive

- Unintentional horizontal overflow
- Desktop-only interactions
- Tiny controls on mobile

### Accessibility

- Missing labels
- Missing focus states
- Inaccessible dialogs
- Color-only status communication

---

# 60. Development Workflow

Every new UI feature should follow:

```text
Requirement
    ↓
Check existing design system
    ↓
Reuse existing component
    ↓
If unavailable → extend component
    ↓
If genuinely new → create component
    ↓
Add/update tokens if required
    ↓
Implement feature
    ↓
Test states
    ↓
Test responsive behavior
    ↓
Test accessibility
    ↓
Visual regression
    ↓
Document reusable pattern
```

---

# 61. Definition of Done — Component

A reusable component is complete when:

- It uses design tokens.
- It has documented variants.
- It has documented states.
- It supports keyboard interaction where applicable.
- It works in light mode.
- It works in dark mode.
- It works on mobile/tablet/desktop.
- It has accessible labels and semantics.
- It handles long content.
- It has tests.
- It has visual regression coverage when appropriate.

---

# 62. Definition of Done — Product Pattern

A product pattern is complete when:

- It is based on existing primitives.
- Its purpose is documented.
- Its responsive behavior is defined.
- Its accessibility behavior is defined.
- Its business states are defined.
- It works in both themes.
- Its loading/empty/error states are defined.
- Its data behavior is documented.

---

# 63. MVP Design-System Scope

The MVP design system must include:

## Foundations

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Icons
- Breakpoints
- Motion

## Core Components

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Badge
- Dialog
- Dropdown
- Tooltip
- Card
- Tabs

## Application Components

- FormField
- SearchInput
- FilterBar
- DataTable
- Pagination
- Toast
- EmptyState
- LoadingState
- ErrorState
- ActivityTimeline
- StatusBadge

## Quotation Components

- CurrencyInput
- PercentageInput
- QuantityInput
- EstimateLineItem
- EstimateBuilder
- QuoteSummary
- QuoteStatus
- QuotePreview
- Timeline/Milestone
- ScopeSection

---

# 64. Implementation Roadmap

## Phase 1 — Audit

Review:

- Existing tokens
- SCSS
- Tailwind configuration
- Theme implementation
- Existing components
- Existing screens
- Figma
- Responsive behavior
- Accessibility implementation

Do not rewrite working components unnecessarily.

---

## Phase 2 — Token Consolidation

Formalize:

- Color tokens
- Typography
- Spacing
- Radius
- Shadows
- Breakpoints
- Motion

Remove duplicate definitions.

---

## Phase 3 — Primitive Standardization

Standardize:

- Buttons
- Inputs
- Selects
- Dialogs
- Badges
- Cards
- Navigation primitives

---

## Phase 4 — Application Components

Standardize:

- DataTable
- SearchInput
- FilterBar
- FormField
- EmptyState
- LoadingState
- ErrorState
- Toast
- ActivityTimeline

---

## Phase 5 — Quotation Patterns

Build:

- CurrencyInput
- PercentageInput
- EstimateLineItem
- EstimateBuilder
- QuoteSummary
- QuoteStatus
- QuotePreview
- Scope
- Timeline

---

## Phase 6 — Figma Alignment

Synchronize:

```text
Tokens
Components
Variants
Patterns
Templates
```

between Figma and implementation.

---

## Phase 7 — Quality Gates

Add:

- Accessibility tests
- Responsive tests
- Visual regression
- Theme tests
- Component documentation

---

# 65. Product Development Integration

The design system should **not** be completed as a separate six-month project.

It should evolve with product development.

For example:

### Authentication

Build:

```text
Input
PasswordInput
FormField
Button
Alert
```

### Customers

Build:

```text
DataTable
SearchInput
FilterBar
CustomerHeader
```

### Projects

Build:

```text
StatusBadge
Tabs
Timeline
ProjectHeader
```

### Estimate Builder

Build:

```text
CurrencyInput
PercentageInput
EstimateLineItem
EstimateBuilder
QuoteSummary
```

### Quotations

Build:

```text
QuoteStatus
QuotePreview
QuotationTable
```

This prevents unnecessary speculative components.

---

# 66. Design System Governance

Before merging UI work, developers should ask:

### Reuse

> Does an existing component solve this?

### Tokens

> Am I introducing a new visual value?

### Responsive

> What happens on mobile?

### Theme

> Does it work in light and dark?

### Accessibility

> Can a keyboard and screen reader user operate it?

### States

> What happens during loading, error and empty states?

### Reusability

> Will another feature need this pattern?

---

# 67. Design System Success Metrics

The design system should improve development rather than merely create documentation.

Measure:

- Percentage of screens using shared components
- Number of duplicate components
- Number of hardcoded visual values
- Accessibility violations
- Visual regression failures
- Time required to build common screens
- Percentage of components supporting dark mode
- Percentage of components with responsive behavior
- Percentage of reusable components with tests

---

# 68. Final Design-System Principles

The platform should follow these rules:

1. **Reuse before creating.**
2. **Tokens before hardcoded values.**
3. **Semantic names before visual names.**
4. **Accessibility is part of component design.**
5. **Responsive behavior must be intentional.**
6. **Light and dark themes are first-class.**
7. **Generic components stay generic.**
8. **Business patterns compose generic components.**
9. **Figma and code should remain aligned.**
10. **Do not over-engineer.**
11. **Build components when the product actually needs them.**
12. **Protect historical quotation data visually and functionally.**
13. **Financial information must have strong hierarchy and precision.**
14. **Every important screen must handle loading, empty and error states.**
15. **Visual consistency is a product-quality requirement, not decoration.**

---

# 69. Final Architecture

The target system is:

```text
                    DESIGN TOKENS
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Typography         Colors          Spacing
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                PRIMITIVE COMPONENTS
                         │
                         ↓
               COMPOSITE COMPONENTS
                         │
        ┌────────────────┼─────────────────┐
        ↓                ↓                 ↓
     Forms             Data            Feedback
        │                │                 │
        └────────────────┼─────────────────┘
                         ↓
                 PRODUCT PATTERNS
                         │
        ┌────────────────┼─────────────────┐
        ↓                ↓                 ↓
   Estimate Builder   Quote Preview   Customer/Project
        │                │                 │
        └────────────────┼─────────────────┘
                         ↓
                    PAGE TEMPLATES
                         │
                         ↓
                  PRODUCT SCREENS
```

The design system should remain **small, semantic, reusable, and product-driven**.

The current UI foundation is suitable. The next priority is to formalize and extend it around the actual quotation workflow rather than replacing the existing visual language.