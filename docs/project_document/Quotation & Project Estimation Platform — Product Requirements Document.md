# Quotation & Project Estimation Platform
## Product Requirements Document — PRD

**Version:** 1.0  
**Date:** September 2026  
**Product Stage:** UI foundation completed; application functionality and backend product architecture to be implemented  
**Primary Goal:** Build a professional quotation and project cost-estimation platform for freelancers, agencies, consultants, and service businesses.

---

# 1. Product Definition

## 1.1 Product Vision

The product enables businesses to create professional project quotations and cost estimates, present project scope clearly to clients, share quotations digitally, and track the quotation lifecycle.

The product is **not a payment platform**.

It calculates and communicates project costs but does not currently:

- Collect payments
- Process card/UPI payments
- Manage payment transactions
- Reconcile bank payments
- Send payment receipts
- Manage accounts receivable

The core product workflow is:

```text
Authenticate
    ↓
Business Profile
    ↓
Customer
    ↓
Project
    ↓
Services / Products
    ↓
Estimate
    ↓
Scope + Deliverables + Timeline
    ↓
Quotation
    ↓
Generate PDF / Share
    ↓
Client Views
    ↓
Accept / Reject
```

---

# 2. Product Goals

## Primary goals

1. Provide secure user authentication.
2. Ensure every user's business data is isolated.
3. Allow users to manage customers.
4. Allow users to manage products and services.
5. Allow users to create projects.
6. Allow users to estimate project costs.
7. Generate professional quotations.
8. Generate downloadable PDF quotations.
9. Provide shareable quotation links.
10. Allow clients to review quotations.
11. Allow clients to accept or reject quotations.
12. Track quotation lifecycle.
13. Provide useful business-level quotation analytics.
14. Make quotation creation significantly faster through templates and reusable services.

## Secondary goals

- Responsive experience across desktop, tablet, and mobile.
- Strong light/dark mode support.
- Consistent design system.
- Reusable component architecture.
- Accessibility.
- Clear empty/loading/error states.
- Strong auditability.

---

# 3. Non-Goals

The following are explicitly outside the current product scope.

## Payments

No:

- Payment gateway
- UPI payment
- Card payment
- Bank payment
- Payment intent
- Payment transaction
- Payment webhook
- Payment reconciliation
- Payment receipt

## Accounting

No:

- General ledger
- Accounts receivable
- Accounts payable
- Bank reconciliation
- Tax filing
- Full accounting system

## Project management

The product may contain project information and milestones, but it is not currently a full project-management platform.

No:

- Kanban project management
- Task management
- Time tracking
- Team task assignment
- Sprint management

These can be considered future extensions.

---

# 4. Target Users

## 4.1 Freelancer

Examples:

- Web developer
- Designer
- Consultant
- Marketing freelancer
- Software developer

Primary needs:

- Quickly create estimates
- Reuse services
- Generate professional PDFs
- Share quotations
- Track accepted/rejected proposals

---

## 4.2 Agency

Examples:

- Web development agency
- Digital marketing agency
- Design agency
- Software consultancy

Primary needs:

- Multiple clients
- Multiple projects
- Service catalog
- Reusable quotation templates
- Structured project scope
- Professional proposals

---

## 4.3 Small service business

Examples:

- IT services
- Marketing services
- Consulting
- Interior design
- Event services

Primary needs:

- Customer management
- Product/service catalog
- Project estimates
- Professional quotations
- Quote tracking

---

# 5. Product Information Architecture

The main application navigation should evolve toward:

```text
Dashboard
Customers
Projects
Quotations
Products & Services
Templates
Settings
```

Potential future navigation:

```text
Analytics
Team
Automations
```

These should not be added until the core workflow requires them.

---

# 6. Authentication — P0

Authentication is the first functional milestone.

The current application does not have an authentication system, so all business functionality must eventually sit behind an authenticated application boundary.

## 6.1 Authentication requirements

The system should support:

- Sign up
- Sign in
- Sign out
- Forgot password
- Reset password
- Session persistence
- Session expiration
- Protected routes
- Authentication state restoration
- Unauthorized access handling

Future support can include:

- Google authentication
- Microsoft authentication
- MFA

These are not required for the first authentication release unless implementation architecture makes them trivial.

---

# 7. Authentication UX

## 7.1 Sign-up

Fields:

- Full name
- Email
- Password
- Confirm password

Optional during onboarding:

- Business name

Validation:

- Valid email
- Password minimum requirements
- Matching confirmation
- Duplicate account handling

Success:

```text
Account Created
      ↓
Business Setup
      ↓
Dashboard
```

---

# 8. Sign-in

Fields:

- Email
- Password

Actions:

- Sign in
- Forgot password
- Create account

States:

- Loading
- Invalid credentials
- Account not verified, if verification is implemented
- Account disabled
- Network error

---

# 9. Password Recovery

Flow:

```text
Forgot Password
      ↓
Enter Email
      ↓
Reset Link
      ↓
New Password
      ↓
Sign In
```

The UI must not reveal whether an arbitrary email address belongs to an account.

---

# 10. Protected Application

Every application route containing business data must require authentication.

Example:

```text
/public/quote/:token
```

may remain publicly accessible.

But:

```text
/dashboard
/customers
/projects
/quotations
/products
/settings
```

must require authentication.

Unauthenticated users should be redirected to:

```text
/login
```

Authenticated users should not be sent back to login unnecessarily.

---

# 11. User and Business Model

Authentication should not be treated as just a login screen.

The underlying model should establish ownership.

Recommended initial structure:

```text
User
 │
 └── Business
       │
       ├── Customers
       ├── Projects
       ├── Products
       ├── Services
       ├── Quotations
       ├── Templates
       └── Settings
```

Recommended relationship:

```text
User
  1
  │
  │ owns
  ▼
Business
  1
  │
  ├── many Customers
  ├── many Projects
  ├── many Quotations
  ├── many Products
  ├── many Services
  └── many Templates
```

This is preferable to attaching every record directly to a user if the product may later support teams/business workspaces.

---

# 12. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What data are you allowed to access?

Every API request involving private business data must enforce ownership.

For example:

```text
GET /quotations/:id
```

must not simply check:

```text
Is user authenticated?
```

It must check:

```text
Is user authenticated?
        +
Does quotation belong to user's business?
```

The backend must never rely solely on frontend route protection.

---

# 13. Business Onboarding

After registration:

```text
Sign Up
   ↓
Business Setup
   ↓
Dashboard
```

Business setup fields:

- Business name
- Logo
- Email
- Phone
- Address
- Website
- Tax/GST information
- Default currency
- Default quotation validity
- Default terms

The user should be able to skip optional fields and complete them later.

---

# 14. Dashboard — P1

The dashboard should represent quotation activity rather than payment activity.

## KPI cards

### Total quotations

Number of quotations created.

### Quoted value

Total value of active/relevant quotations.

### Accepted value

Total value of accepted quotations.

### Pending quotations

Quotations awaiting client response.

### Acceptance rate

```text
Accepted quotations
------------------- × 100
Eligible quotations
```

The exact denominator should be defined consistently and documented in analytics logic.

---

# 15. Dashboard Charts

Initial dashboard analytics:

### Quotation pipeline

```text
Draft
Sent
Viewed
Accepted
Rejected
Expired
```

### Monthly quotation value

Shows the total quoted amount by month.

### Accepted quotation value

Shows the value of accepted quotations by month.

### Recent quotations

Display:

- Quote number
- Customer
- Project
- Amount
- Status
- Created date

---

# 16. Customer Management — P1

Customers represent the client organization/person receiving quotations.

## Customer fields

- Customer name
- Company
- Email
- Phone
- Address
- Tax/GST information
- Notes

## Customer actions

- Create
- View
- Edit
- Archive
- Search
- Filter
- Sort

Customer detail should show:

```text
Customer
  │
  ├── Contact information
  ├── Projects
  ├── Quotations
  └── Activity
```

---

# 17. Project Management — P1

Projects are a major domain object.

A project connects:

```text
Customer
   +
Scope
   +
Services
   +
Pricing
   +
Timeline
   =
Quotation
```

## Project fields

- Project name
- Customer
- Description
- Start date
- Expected completion date
- Status
- Notes

Statuses:

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

---

# 18. Products & Services — P1

The existing Products functionality should evolve into a broader catalog.

Categories:

```text
Products
Services
Packages
```

## Service fields

- Name
- Description
- Pricing model
- Default rate
- Unit
- Tax
- Active/inactive

Pricing models:

```text
Fixed
Hourly
Daily
Quantity
Percentage
```

Example:

```text
Frontend Development
Pricing: Hourly
Rate: ₹2,000
Unit: Hour
```

---

# 19. Estimate Builder — Core Product Feature

This becomes the central feature.

The user should be able to create a quotation from a project.

Example:

```text
Project
Website Development

Customer
ABC Technologies
```

Then add line items.

| Item | Qty | Rate | Amount |
|---|---:|---:|---:|
| UI/UX Design | 40 hrs | ₹1,800 | ₹72,000 |
| Frontend Development | 80 hrs | ₹2,000 | ₹1,60,000 |
| Backend Development | 60 hrs | ₹2,200 | ₹1,32,000 |
| QA Testing | 20 hrs | ₹1,200 | ₹24,000 |

Calculation:

```text
Subtotal
- Discount
+ Tax
----------------
Estimated Total
```

All calculations should be deterministic and performed using backend-safe numeric logic.

The frontend should not be the source of truth for quotation totals.

---

# 20. Pricing Models

Each line item must support:

## Fixed

```text
1 × ₹80,000
```

## Hourly

```text
40 × ₹2,000
```

## Daily

```text
5 × ₹12,000
```

## Quantity

```text
10 × ₹5,000
```

## Percentage

Example:

```text
Project Management
10% of project subtotal
```

Percentage items require special calculation rules and must not create circular calculations.

---

# 21. Discounts

Support:

- Fixed discount
- Percentage discount

Example:

```text
Subtotal       ₹4,00,000
Discount 10%   -₹40,000
Tax             ₹64,800
-----------------------
Total          ₹4,24,800
```

The calculation order must be defined centrally.

Recommended:

```text
Line items
   ↓
Subtotal
   ↓
Discount
   ↓
Taxable amount
   ↓
Tax
   ↓
Total
```

---

# 22. Tax

Tax should be configurable.

Initial version:

- Tax name
- Tax percentage

For India-oriented users, future support can include:

- CGST
- SGST
- IGST
- HSN/SAC
- Place of supply

Do not make GST complexity a blocker for the first release.

---

# 23. Scope of Work

Every professional quotation should support a scope section.

Sections:

### Overview

What is being proposed.

### Deliverables

What the client receives.

### Included

What is part of the quoted price.

### Not included

What is explicitly outside the scope.

### Assumptions

Dependencies required from the client.

### Revision policy

Number of revisions included.

---

# 24. Project Timeline

Allow the user to define milestones.

Example:

```text
Discovery
Week 1

Design
Weeks 2–3

Development
Weeks 4–8

Testing
Weeks 9–10

Deployment
Week 11
```

Timeline should be informational and appear in the quotation.

It does not become a project-management system.

---

# 25. Terms & Conditions

Terms should be structured rather than displayed as a huge block of text.

Possible sections:

- Project terms
- Scope changes
- Client responsibilities
- Revision policy
- Timeline assumptions
- Quote validity
- Cancellation terms
- Confidentiality
- Intellectual property

Users should be able to configure default terms in Settings.

Individual quotations should be able to override defaults.

---

# 26. Quotation Entity

Recommended conceptual model:

```text
Quotation
 ├── id
 ├── businessId
 ├── projectId
 ├── customerId
 ├── quoteNumber
 ├── title
 ├── issueDate
 ├── validUntil
 ├── currency
 ├── subtotal
 ├── discount
 ├── tax
 ├── total
 ├── status
 ├── notes
 ├── terms
 ├── createdAt
 └── updatedAt
```

Related:

```text
QuotationItem
QuotationMilestone
QuotationScope
QuotationActivity
QuotationTemplate
```

---

# 27. Quotation Status Lifecycle

The primary lifecycle:

```text
Draft
  ↓
Sent
  ↓
Viewed
  ↓
Accepted
```

Alternative outcomes:

```text
Viewed → Rejected

Sent → Expired

Draft → Archived
```

Status transitions should be controlled.

For example:

```text
Accepted → Draft
```

should not be allowed casually.

If the user needs to modify an accepted quotation, the system should create a revision or require explicit reopening.

---

# 28. Quotation Versioning

This is important.

If a quotation changes after being shared, the original quotation should not silently change.

Example:

```text
QT-1024
Version 1
₹4,00,000

Client requests changes

QT-1024
Version 2
₹4,50,000
```

The system should preserve previous versions.

This creates a reliable history.

---

# 29. PDF Generation

The application should generate a professional PDF containing:

- Company branding
- Quote number
- Date
- Validity
- Customer details
- Project details
- Cost breakdown
- Scope
- Deliverables
- Timeline
- Assumptions
- Terms
- Total

The PDF should visually match the application's design system.

The existing invoice design work can become the foundation for this.

---

# 30. Shareable Quotation

Each quotation should optionally generate a secure public URL.

Example concept:

```text
/public/quote/{secure-token}
```

The token must not expose internal database IDs unnecessarily.

The public page should display:

```text
Company
Project
Scope
Deliverables
Timeline
Cost
Terms
```

Actions:

```text
Download PDF
Accept
Reject
```

No payment action.

---

# 31. Client Acceptance

When the client accepts:

```text
Quotation
   ↓
Accept
   ↓
Confirmation
   ↓
Quotation status = Accepted
```

The system should record:

- Timestamp
- Quotation version
- Client-provided name
- Optional comment

Future versions may introduce stronger electronic-signature functionality, but that is not required initially.

---

# 32. Client Rejection

The client can reject a quotation.

Optional rejection reason:

```text
Price too high
Scope mismatch
Timeline issue
Project postponed
Other
```

The client can provide a comment.

The business owner sees the rejection activity.

---

# 33. Quote Activity Timeline

Each quotation should have an activity history:

```text
Created
↓
Updated
↓
Sent
↓
Viewed
↓
Viewed again
↓
Accepted
```

Example:

```text
25 Sep 2026 · 10:15
Quotation created

25 Sep 2026 · 10:30
Quotation sent

26 Sep 2026 · 09:12
Client viewed quotation

27 Sep 2026 · 14:40
Client accepted quotation
```

---

# 34. Templates

Users should eventually create reusable quotation templates.

A template can contain:

- Default scope
- Default deliverables
- Default terms
- Default services
- Default milestones
- Default pricing

Example:

```text
Website Development
Mobile App Development
SEO Services
Marketing Retainer
UI/UX Design
Consulting
```

Creating a new quotation from a template should significantly reduce data entry.

---

# 35. Duplicate Functionality

Users should be able to:

- Duplicate quotation
- Duplicate project
- Duplicate template

This is particularly important for agencies with recurring project types.

---

# 36. Settings

Settings should contain:

## Business

- Business name
- Logo
- Address
- Contact information
- Website
- Tax details

## Quotation

- Default validity
- Default currency
- Default terms
- Default notes
- Numbering format

## Appearance

- Light/dark mode
- Brand colors
- Invoice/quotation theme

## Account

- Name
- Email
- Password
- Sign out

---

# 37. Security Requirements

Security must be designed into the system from the beginning.

Required:

- Password hashing through the chosen authentication provider/system
- Secure sessions/tokens
- Protected API routes
- Authorization checks
- Business-level data isolation
- Secure password reset
- Rate limiting on authentication endpoints
- Input validation
- Server-side authorization
- Secure public quotation tokens
- Audit logging for important actions

Never trust:

- User IDs supplied by the frontend
- Business IDs supplied by the frontend
- Client-side quotation totals
- Client-side authorization decisions

---

# 38. Responsive Requirements

The existing responsive work should continue as a product requirement.

Supported experiences:

```text
Desktop
Tablet
Mobile
```

Mobile should prioritize:

- Dashboard
- Customers
- Projects
- Quotations
- Quote preview
- Basic editing

Complex estimate-builder interactions can be optimized specifically for tablet/desktop rather than forcing every interaction into a tiny mobile UI.

---

# 39. Accessibility

Continue the accessibility work already started.

Requirements:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Accessible forms
- Proper labels
- Error messages
- Contrast compliance
- Screen-reader-friendly tables
- Accessible dialogs
- Accessible dropdowns

Accessibility should be tested automatically with Playwright + axe where appropriate.

---

# 40. Design System

The existing design foundations should become the shared visual system.

Continue centralizing:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Form controls
- Buttons
- Cards
- Tables
- Empty states
- Modals
- Toasts
- Status badges

Avoid introducing one-off styling for individual pages.

---

# 41. Error & Edge Cases

The product must explicitly handle:

### Authentication

- Invalid credentials
- Expired session
- Reset token expired
- Duplicate account

### Customer

- Duplicate customer
- Missing required information

### Project

- Customer deleted/archived
- Empty project

### Quotation

- Empty quotation
- Negative quantity
- Invalid rate
- Invalid discount
- Invalid tax
- Expired quotation
- Deleted service
- Deleted customer
- Duplicate quote number
- Concurrent edits

### Public quotation

- Invalid token
- Expired link
- Deleted quotation
- Rejected quotation
- Already accepted quotation

---

# 42. API Architecture

The backend should be organized around domains rather than one large generic API.

Conceptual modules:

```text
Auth
Business
Customers
Projects
Products
Services
Quotations
Templates
Public Quotations
Settings
Analytics
```

Example endpoints:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password

GET    /customers
POST   /customers
GET    /customers/:id
PATCH  /customers/:id

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id

GET    /services
POST   /services

GET    /quotations
POST   /quotations
GET    /quotations/:id
PATCH  /quotations/:id
POST   /quotations/:id/send
POST   /quotations/:id/duplicate

GET    /public/quotations/:token
POST   /public/quotations/:token/accept
POST   /public/quotations/:token/reject
```

Exact endpoint naming can change based on the backend framework and existing codebase.

---

# 43. Recommended Implementation Order

## Phase 0 — Architecture preparation

Before implementing features:

- Establish backend authentication strategy.
- Establish User model.
- Establish Business model.
- Establish ownership strategy.
- Establish API authorization middleware/guards.
- Establish error handling.
- Establish validation.
- Establish database migration strategy.
- Establish environment configuration.

---

## Phase 1 — Authentication

Build:

1. Sign up
2. Sign in
3. Sign out
4. Forgot password
5. Reset password
6. Session persistence
7. Protected routes
8. Auth state restoration
9. Unauthorized handling

**Exit criteria:** A user can securely create an account, authenticate, refresh the application, sign out, and access only authenticated application areas.

---

## Phase 2 — Business onboarding

Build:

1. Business profile
2. Business settings
3. Logo
4. Contact information
5. Currency
6. Default quotation settings

**Exit criteria:** Every authenticated user has an identifiable business/workspace and business-owned data.

---

## Phase 3 — Core data

Build:

1. Customers
2. Products
3. Services
4. Projects

**Exit criteria:** A user can create a customer, create a project, and configure reusable services/products.

---

## Phase 4 — Estimate Builder

Build:

1. Add line items
2. Pricing models
3. Quantity/rate calculation
4. Discounts
5. Tax
6. Subtotal
7. Total
8. Notes
9. Scope
10. Deliverables
11. Assumptions
12. Timeline

**Exit criteria:** A complete quotation can be constructed accurately.

---

## Phase 5 — Quotation

Build:

1. Quote number
2. Quote status
3. Validity
4. Preview
5. Save draft
6. Edit
7. Duplicate
8. PDF generation
9. Versioning

**Exit criteria:** A professional quotation can be generated and downloaded.

---

## Phase 6 — Client workflow

Build:

1. Public quotation URL
2. Public quotation page
3. View tracking
4. Accept
5. Reject
6. Client comment
7. Activity history

**Exit criteria:** A client can review a quotation and formally accept/reject it without authentication or payment.

---

## Phase 7 — Analytics

Build:

1. Quotation counts
2. Quoted value
3. Accepted value
4. Pending value
5. Acceptance rate
6. Monthly trends
7. Recent quotations

**Exit criteria:** Dashboard provides useful quotation/business insights.

---

## Phase 8 — Productivity

Build:

1. Templates
2. Packages
3. Duplicate workflows
4. Saved services
5. Default terms
6. Reusable scopes

**Exit criteria:** Repeated quotation creation becomes substantially faster.

---

## Phase 9 — AI

Only after the deterministic quotation workflow is reliable.

Potential features:

1. AI scope generation
2. AI deliverable suggestions
3. AI assumption generation
4. AI quotation drafting
5. AI estimate assistance

AI must assist the user rather than silently invent commercial commitments.

---

# 44. MVP Definition

The MVP should **not** include everything in this document.

The actual MVP should be:

```text
Authentication
      ↓
Business Setup
      ↓
Customer
      ↓
Project
      ↓
Products / Services
      ↓
Estimate Builder
      ↓
Quotation
      ↓
PDF
```

Then:

```text
Public Quote
      ↓
Client View
      ↓
Accept / Reject
```

That is enough for a genuinely usable first product.

---

# 45. MVP Success Criteria

The product should pass this complete scenario:

```text
1. User creates account
        ↓
2. User sets up business
        ↓
3. User creates customer
        ↓
4. User creates project
        ↓
5. User selects services
        ↓
6. User creates estimate
        ↓
7. User adds scope
        ↓
8. User adds timeline
        ↓
9. System calculates total
        ↓
10. User previews quotation
        ↓
11. User generates PDF
        ↓
12. User creates public link
        ↓
13. Client opens link
        ↓
14. Client reviews quotation
        ↓
15. Client accepts/rejects
        ↓
16. Owner sees updated status
```

If this works reliably, you have the core product.

---

# 46. Future Roadmap

After MVP:

### V1

- Templates
- Packages
- Advanced analytics
- Quote versioning
- Better client experience

### V2

- AI quotation assistant
- AI scope generation
- Advanced branding
- Multiple businesses/workspaces
- Team members
- Roles/permissions

### V3

Potential integrations:

- CRM
- Email
- WhatsApp
- Cloud storage
- E-signature providers
- Accounting systems

Payment collection remains optional and should only be considered if the product strategy changes.

---

# 47. Product North Star

The product should optimize for one metric:

> **How quickly can a business turn a project requirement into a clear, professional, client-ready quotation?**

The ideal workflow should feel like:

```text
Client
  ↓
5-minute setup
  ↓
Select services
  ↓
Adjust quantities/rates
  ↓
Add scope
  ↓
Generate quotation
  ↓
Share
```

Not:

```text
Fill 30 fields
→ navigate 8 screens
→ manually calculate everything
→ format document
→ export
→ send manually
```

The product's value is **speed + clarity + professionalism**.

---

# 48. Final Product Roadmap

```text
                    FOUNDATION
                         │
                         ▼
                 ┌──────────────┐
                 │ Authentication│
                 └──────┬───────┘
                        ▼
                 Business Setup
                        │
                        ▼
              ┌───────────────────┐
              │ Core Data          │
              │ Customers          │
              │ Projects           │
              │ Products/Services  │
              └─────────┬─────────┘
                        ▼
                 Estimate Builder
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
       Pricing        Scope         Timeline
          │             │              │
          └─────────────┼──────────────┘
                        ▼
                   Quotation
                        │
                ┌───────┼────────┐
                ▼       ▼        ▼
               PDF    Share    Preview
                        │
                        ▼
                  Client Review
                   │          │
                   ▼          ▼
                Accept      Reject
                   │
                   ▼
                 Analytics
                   │
                   ▼
                Templates
                   │
                   ▼
                    AI
```

# 49. Immediate Next Steps

Given the current state of the project, I would **not start implementing Projects or the Estimate Builder yet**.

The next implementation sequence should be:

### Step 1
Finalize authentication architecture.

### Step 2
Implement User + Business/workspace ownership.

### Step 3
Protect all existing application routes.

### Step 4
Connect existing Customers/Products/Settings to authenticated business data.

### Step 5
Add Projects.

### Step 6
Build Estimate Builder.

### Step 7
Convert the existing invoice-detail UI into the quotation-detail experience.

### Step 8
Build quotation PDF generation.

### Step 9
Build public client quotation view.

### Step 10
Build Accept/Reject workflow.

This order prevents a major architectural mistake: **building a large amount of business functionality first and then trying to retrofit authentication, ownership, authorization, and multi-user data isolation afterward.**

The current UI work you've already completed—design foundations, typography, color tokens, components, dashboard, customers, products, invoice screens, responsive layouts, mobile views, dark mode, and edge cases—should now be treated as the **presentation layer foundation**. The next stage is to connect that foundation to a proper domain model and secure application architecture.