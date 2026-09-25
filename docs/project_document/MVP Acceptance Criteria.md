# MVP Acceptance Criteria

## 1. MVP Definition

The MVP is considered complete only when a new user can:

```text
Create account
    ↓
Set up business
    ↓
Create customer
    ↓
Create project
    ↓
Add products/services
    ↓
Build project estimate
    ↓
Generate quotation
    ↓
Preview quotation
    ↓
Generate/download PDF
    ↓
Create shareable quotation
    ↓
Client opens quotation
    ↓
Client accepts or rejects
    ↓
Business owner sees updated status
```

Every step must work with persisted backend data.

A visually complete screen without working persistence, validation, authorization, or error handling does **not** satisfy MVP acceptance.

---

# 2. Authentication Acceptance Criteria

## AC-AUTH-001 — User Registration

**Given** the user is not authenticated  
**When** they submit valid registration details  
**Then** a user account must be created successfully.

Required:

- Name
- Email
- Password

The system must reject:

- Invalid email
- Missing required fields
- Invalid password
- Password confirmation mismatch
- Duplicate email

---

## AC-AUTH-002 — User Login

**Given** a registered user  
**When** they submit valid credentials  
**Then** they must be authenticated and redirected to the application.

**When** invalid credentials are supplied:

- Authentication must fail.
- A clear error must be shown.
- No protected application data may be exposed.

---

## AC-AUTH-003 — Session Persistence

**Given** an authenticated user  
**When** they refresh the browser  
**Then** the user must remain authenticated if the session is still valid.

The application must not incorrectly redirect the user to login after a normal page refresh.

---

## AC-AUTH-004 — Logout

**Given** an authenticated user  
**When** they select Logout  
**Then**:

- The session must be invalidated.
- The user must be redirected to the login page.
- Protected APIs must no longer be accessible using the invalidated session.

---

## AC-AUTH-005 — Password Recovery

**Given** a user has forgotten their password  
**When** they request password recovery  
**Then** the system must provide a secure password-reset flow.

The system must not expose whether an arbitrary email address belongs to an account.

---

## AC-AUTH-006 — Protected Routes

The following routes must require authentication:

```text
/dashboard
/customers
/projects
/products
/services
/quotations
/settings
```

Unauthenticated access must redirect to authentication.

Public quotation routes must remain accessible without authentication.

---

# 3. Authorization Acceptance Criteria

## AC-AUTHZ-001 — Business Data Isolation

A user must only be able to access data belonging to their own business/workspace.

Example:

```text
User A → Business A → Customer A
User B → Business B → Customer B
```

User A must never be able to retrieve, modify, or delete Customer B.

This must be enforced by the backend.

Frontend route protection alone is insufficient.

---

## AC-AUTHZ-002 — Direct API Access

If a user manually changes an API resource ID, the API must return an authorization error rather than another business's data.

Example:

```text
GET /quotations/{another-business-quotation-id}
```

must not return the quotation.

---

## AC-AUTHZ-003 — Ownership on Create

When creating:

- Customer
- Project
- Product
- Service
- Quotation

the backend must derive ownership from the authenticated session rather than trusting a client-supplied `userId` or `businessId`.

---

# 4. Business Setup Acceptance Criteria

## AC-BIZ-001 — Business Creation

After registration, the user must be able to create/configure their business profile.

Required:

- Business name

Optional:

- Logo
- Email
- Phone
- Address
- Website
- Tax information
- Currency

---

## AC-BIZ-002 — Business Data Persistence

Business settings must persist after:

- Page refresh
- Logout/login
- Browser restart

---

## AC-BIZ-003 — Default Quotation Settings

The user must be able to configure:

- Default currency
- Default quotation validity
- Default terms
- Default notes

These defaults should automatically populate new quotations where applicable.

---

# 5. Customer Acceptance Criteria

## AC-CUSTOMER-001 — Create Customer

The user must be able to create a customer with:

- Name
- Company
- Email
- Phone
- Address
- Tax information
- Notes

Only required fields should block creation.

---

## AC-CUSTOMER-002 — Customer List

The customer list must display:

- Customer name
- Company
- Email
- Number of projects/quotations where applicable
- Status

The user must be able to search customers.

---

## AC-CUSTOMER-003 — Customer Detail

Opening a customer must show:

- Customer information
- Projects
- Quotations
- Relevant activity

---

## AC-CUSTOMER-004 — Customer Editing

The user must be able to update customer information.

Existing quotations must retain historical customer information where required rather than unexpectedly changing historical documents.

---

# 6. Project Acceptance Criteria

## AC-PROJECT-001 — Create Project

The user must be able to create a project containing:

- Project name
- Customer
- Description
- Start date
- Expected completion date
- Status
- Notes

---

## AC-PROJECT-002 — Customer Association

Every project must belong to a customer.

A project cannot reference a customer belonging to another business.

---

## AC-PROJECT-003 — Project List

The project list must support:

- Search
- Status filtering
- Customer filtering
- Sorting
- Project detail navigation

---

## AC-PROJECT-004 — Project Status

The system must support at least:

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

Status transitions must be controlled rather than allowing arbitrary values from the frontend.

---

# 7. Product & Service Acceptance Criteria

## AC-CATALOG-001 — Create Service

A service must support:

- Name
- Description
- Pricing model
- Default rate
- Unit
- Tax
- Active/inactive state

---

## AC-CATALOG-002 — Pricing Models

The estimate builder must support:

```text
Fixed
Hourly
Daily
Quantity
Percentage
```

---

## AC-CATALOG-003 — Service Reuse

A saved service must be selectable when creating multiple quotations.

Changing the current service's default rate must not silently modify historical quotation amounts.

---

# 8. Estimate Builder Acceptance Criteria

This is the core MVP feature.

## AC-ESTIMATE-001 — Create Estimate

The user must be able to create an estimate for a project.

---

## AC-ESTIMATE-002 — Add Line Items

The user must be able to:

- Add item
- Select product/service
- Enter quantity
- Enter rate
- Change rate
- Remove item
- Reorder items if supported by UI

---

## AC-ESTIMATE-003 — Fixed Pricing

For fixed pricing:

```text
Quantity × Rate = Amount
```

Example:

```text
1 × ₹50,000 = ₹50,000
```

---

## AC-ESTIMATE-004 — Hourly Pricing

For hourly pricing:

```text
Hours × Hourly Rate = Amount
```

Example:

```text
40 × ₹2,000 = ₹80,000
```

---

## AC-ESTIMATE-005 — Quantity Pricing

For quantity-based services:

```text
Quantity × Rate = Amount
```

---

## AC-ESTIMATE-006 — Daily Pricing

For daily pricing:

```text
Days × Daily Rate = Amount
```

---

## AC-ESTIMATE-007 — Percentage Pricing

Percentage-based items must calculate against the defined calculation base.

Example:

```text
Project subtotal = ₹4,00,000

Project management = 10%

Amount = ₹40,000
```

Circular calculations must not be possible.

---

# 9. Calculation Acceptance Criteria

## AC-CALC-001 — Subtotal

The subtotal must equal the sum of all valid line-item amounts.

```text
Subtotal = Σ line item amounts
```

---

## AC-CALC-002 — Discount

The system must support:

- Fixed discount
- Percentage discount

The calculation order must be deterministic.

Recommended:

```text
Line Items
    ↓
Subtotal
    ↓
Discount
    ↓
Taxable Amount
    ↓
Tax
    ↓
Total
```

---

## AC-CALC-003 — Tax

Tax must be calculated using the configured tax rate.

Example:

```text
Subtotal       ₹1,00,000
Discount        ₹10,000
Taxable         ₹90,000
Tax 18%         ₹16,200
Total          ₹1,06,200
```

---

## AC-CALC-004 — Total Consistency

The total shown in:

- Estimate builder
- Quotation preview
- Quotation detail
- PDF

must be identical.

The backend must be the source of truth for persisted quotation totals.

---

## AC-CALC-005 — Invalid Values

The system must reject:

- Negative quantity
- Negative rate
- Invalid tax rate
- Invalid discount
- NaN values
- Infinite values

---

# 10. Scope Acceptance Criteria

## AC-SCOPE-001 — Project Overview

The quotation must support a project overview/description.

---

## AC-SCOPE-002 — Deliverables

The user must be able to define deliverables.

Example:

```text
- Responsive website
- CMS integration
- Analytics
- SEO setup
```

---

## AC-SCOPE-003 — Included Items

The user must be able to explicitly define what is included.

---

## AC-SCOPE-004 — Excluded Items

The user must be able to explicitly define what is not included.

---

## AC-SCOPE-005 — Assumptions

The user must be able to define assumptions/dependencies.

---

## AC-SCOPE-006 — Revision Policy

The quotation must support revision-policy text.

---

# 11. Timeline Acceptance Criteria

## AC-TIMELINE-001 — Milestones

The user must be able to add project milestones.

Each milestone should support:

- Name
- Description
- Start date or relative period
- End date or relative period

---

## AC-TIMELINE-002 — Quotation Display

Configured milestones must appear in the quotation preview and PDF.

---

# 12. Quotation Acceptance Criteria

## AC-QUOTE-001 — Create Draft

The user must be able to save an incomplete quotation as a draft.

---

## AC-QUOTE-002 — Required Data

A quotation cannot be finalized unless required information exists:

- Customer
- Project
- Quote number
- Issue date
- Validity
- At least one line item
- Valid total

---

## AC-QUOTE-003 — Quote Number

Every finalized quotation must have a unique quote number within the business.

Example:

```text
QT-2026-001
QT-2026-002
QT-2026-003
```

---

## AC-QUOTE-004 — Validity

The quotation must support:

- Issue date
- Valid-until date

The system should prevent an invalid validity range.

---

## AC-QUOTE-005 — Status

Quotation status must support:

```text
Draft
Sent
Viewed
Accepted
Rejected
Expired
Archived
```

---

# 13. Quotation Preview Acceptance Criteria

## AC-PREVIEW-001 — Complete Preview

The quotation preview must contain:

- Business information
- Customer information
- Quote number
- Date
- Validity
- Project information
- Line items
- Subtotal
- Discount
- Tax
- Total
- Scope
- Deliverables
- Timeline
- Assumptions
- Terms

---

## AC-PREVIEW-002 — Preview Accuracy

Preview values must match persisted quotation data.

No calculation should be independently reimplemented in the preview layer.

---

# 14. PDF Acceptance Criteria

## AC-PDF-001 — Generate PDF

The user must be able to generate a PDF from a valid quotation.

---

## AC-PDF-002 — PDF Completeness

The PDF must contain the same commercial information shown in the quotation preview.

---

## AC-PDF-003 — PDF Calculation Accuracy

The PDF total must exactly match the persisted quotation total.

---

## AC-PDF-004 — PDF Layout

The PDF must:

- Have no clipped content
- Have no overlapping elements
- Handle long project names
- Handle long customer names
- Handle long line-item descriptions
- Handle multi-page quotations
- Keep totals readable
- Keep terms readable

---

## AC-PDF-005 — Branding

The PDF must use configured:

- Business name
- Logo
- Contact information
- Brand styling where supported

---

# 15. Public Quotation Acceptance Criteria

## AC-PUBLIC-001 — Public URL

The user must be able to generate a secure public quotation URL.

---

## AC-PUBLIC-002 — No Authentication Required

A client must be able to open the quotation URL without creating an account.

---

## AC-PUBLIC-003 — Secure Access

The public URL must use a secure non-guessable token.

Internal database IDs must not be sufficient to access arbitrary quotations.

---

## AC-PUBLIC-004 — Public Data Isolation

The public page must expose only information intentionally included in the quotation.

It must never expose:

- Internal IDs
- Internal business data
- Authentication information
- Private notes
- Other customer information
- Internal audit information

---

# 16. Client View Acceptance Criteria

## AC-CLIENT-001 — View Quotation

The client must be able to view:

- Business
- Project
- Scope
- Deliverables
- Timeline
- Cost
- Terms

---

## AC-CLIENT-002 — Responsive Client View

The public quotation must work on:

- Desktop
- Tablet
- Mobile

---

## AC-CLIENT-003 — PDF Download

The client must be able to download the quotation PDF if enabled by the business.

---

# 17. Client Acceptance / Rejection

## AC-CLIENT-004 — Accept

The client must be able to accept an active quotation.

On acceptance:

```text
Quotation status → Accepted
```

The system must record:

- Timestamp
- Quotation version
- Client name if provided
- Optional comment

---

## AC-CLIENT-005 — Reject

The client must be able to reject an active quotation.

The system must record:

- Timestamp
- Reason/comment if provided
- Quotation version

Status:

```text
Quotation status → Rejected
```

---

## AC-CLIENT-006 — Prevent Invalid Actions

A client must not be able to accept an expired or archived quotation.

Likewise, an already accepted quotation should not silently become rejected through another public request.

---

# 18. Quotation Activity Acceptance Criteria

## AC-ACTIVITY-001 — Activity Tracking

The system must record important quotation events:

```text
Created
Updated
Sent
Viewed
Accepted
Rejected
Expired
```

---

## AC-ACTIVITY-002 — Activity Ownership

Activity must be associated with the correct quotation and business.

---

## AC-ACTIVITY-003 — Immutable History

Important historical activity records must not be casually overwritten when quotation information changes.

---

# 19. Dashboard Acceptance Criteria

## AC-DASH-001 — KPI Accuracy

Dashboard values must be calculated from persisted quotation data.

At minimum:

- Total quotations
- Pending quotations
- Accepted quotations
- Quoted value
- Accepted value

---

## AC-DASH-002 — Status Pipeline

The dashboard must show quotation counts by status.

---

## AC-DASH-003 — Recent Quotations

The dashboard must display recently created/updated quotations.

---

## AC-DASH-004 — Empty State

A newly registered user with no quotations must see a useful empty state rather than broken charts or meaningless zero-data visualizations.

---

# 20. Error Handling Acceptance Criteria

Every major workflow must provide:

### Loading state

```text
Loading...
```

### Empty state

```text
No quotations yet
Create your first quotation
```

### Error state

```text
Something went wrong.
Try again.
```

### Validation state

Errors must appear close to the relevant input.

---

# 21. Responsive Acceptance Criteria

## AC-RESP-001

Core workflows must function at:

```text
Desktop
Tablet
Mobile
```

---

## AC-RESP-002

There must be no unintended horizontal scrolling on supported mobile/tablet layouts.

---

## AC-RESP-003

The following workflows must remain usable on mobile:

- Login
- Customer creation
- Project creation
- Quotation viewing
- Quotation preview
- Public quotation

The estimate builder may use an optimized mobile interaction model rather than simply shrinking the desktop layout.

---

# 22. Accessibility Acceptance Criteria

The MVP must satisfy baseline accessibility requirements.

Required:

- Keyboard navigation
- Visible focus states
- Proper form labels
- Accessible buttons
- Accessible dialogs
- Accessible tables
- Meaningful error messages
- Sufficient color contrast

Automated accessibility testing should be included in the Playwright test suite for the core routes.

---

# 23. Security Acceptance Criteria

Before MVP release:

- No secrets in frontend source.
- No credentials stored in localStorage unless explicitly justified by the chosen auth architecture.
- Backend authorization implemented.
- Business data isolated.
- Public quotation tokens are non-guessable.
- Password reset tokens are secure and expire.
- Authentication endpoints are protected against basic abuse/rate-limit requirements.
- User input is validated server-side.
- API responses do not expose sensitive internal fields.

---

# 24. Data Integrity Acceptance Criteria

## AC-DATA-001

Deleting/deactivating a product or service must not alter historical quotations.

---

## AC-DATA-002

Changing a customer's current information must not unexpectedly rewrite historical quotation snapshots.

---

## AC-DATA-003

Historical quotation totals must remain stable.

---

## AC-DATA-004

Quotation calculations must be reproducible from persisted quotation data.

---

# 25. Testing Acceptance Criteria

The MVP must have automated tests for critical business logic.

## Unit tests

At minimum:

- Fixed pricing
- Hourly pricing
- Daily pricing
- Quantity pricing
- Percentage pricing
- Discount
- Tax
- Total calculation
- Invalid values

## Integration/API tests

At minimum:

- Registration
- Login
- Logout
- Protected route
- Authorization
- Customer creation
- Project creation
- Quotation creation
- Quotation retrieval
- Public quotation access
- Accept quotation
- Reject quotation

## End-to-end tests

At minimum:

### E2E-001 — New user workflow

```text
Register
→ Business setup
→ Dashboard
```

### E2E-002 — Create quotation

```text
Login
→ Customer
→ Project
→ Estimate
→ Quotation
→ Save
```

### E2E-003 — Generate PDF

```text
Quotation
→ Preview
→ Generate PDF
→ Verify successful output
```

### E2E-004 — Client workflow

```text
Generate public URL
→ Open without authentication
→ View quotation
→ Accept
→ Owner sees Accepted
```

### E2E-005 — Authorization

```text
User A
→ Attempt User B resource
→ Access denied
```

---

# 26. MVP Definition of Done

The MVP is **not complete** if only the frontend screens exist.

The MVP is complete when all of the following are true:

### Authentication

- [ ] Registration works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Password recovery works.
- [ ] Sessions persist correctly.
- [ ] Protected routes work.
- [ ] Unauthorized API access is rejected.

### Business

- [ ] Business profile can be created.
- [ ] Business settings persist.
- [ ] Business data is isolated.

### Customers

- [ ] Customer CRUD works.
- [ ] Customer search works.
- [ ] Customer ownership is enforced.

### Projects

- [ ] Project CRUD works.
- [ ] Projects belong to customers.
- [ ] Project ownership is enforced.

### Catalog

- [ ] Products/services can be created.
- [ ] Pricing models work.
- [ ] Catalog items can be reused.
- [ ] Historical quotations remain unchanged when catalog data changes.

### Estimate

- [ ] Line items work.
- [ ] Fixed pricing works.
- [ ] Hourly pricing works.
- [ ] Daily pricing works.
- [ ] Quantity pricing works.
- [ ] Percentage pricing works.
- [ ] Discount works.
- [ ] Tax works.
- [ ] Total calculation is correct.
- [ ] Invalid values are rejected.

### Quotation

- [ ] Draft quotation works.
- [ ] Quote number is unique.
- [ ] Status lifecycle works.
- [ ] Scope works.
- [ ] Deliverables work.
- [ ] Assumptions work.
- [ ] Timeline works.
- [ ] Terms work.
- [ ] Preview matches saved data.

### PDF

- [ ] PDF generation works.
- [ ] PDF contains all required information.
- [ ] PDF calculations match backend totals.
- [ ] Multi-page quotations render correctly.
- [ ] Long content does not break layout.

### Client

- [ ] Public quotation URL works.
- [ ] Client does not need an account.
- [ ] Client can view quotation.
- [ ] Client can download PDF.
- [ ] Client can accept.
- [ ] Client can reject.
- [ ] Owner sees updated status.

### Dashboard

- [ ] KPIs are accurate.
- [ ] Status pipeline works.
- [ ] Recent quotations work.
- [ ] Empty state works.

### Quality

- [ ] Responsive layouts work.
- [ ] Accessibility baseline passes.
- [ ] Critical Playwright tests pass.
- [ ] No critical console errors.
- [ ] No critical API errors.
- [ ] No cross-business data leakage.
- [ ] No known critical security issues.

---

# 27. MVP Release Gate

The MVP should not be released if any of these conditions exist:

1. Users can access another business's data.
2. Authentication can be bypassed.
3. Quotation totals are incorrect.
4. PDF totals differ from application totals.
5. Client can modify quotation pricing.
6. Client can access private/internal information.
7. Accepted/rejected quotations can be silently changed.
8. Public quotation tokens are predictable.
9. Core quotation creation fails on mobile.
10. Critical end-to-end tests fail.

---

# 28. MVP Success Scenario

The final acceptance test should be executable from a clean environment.

### Business owner

```text
1. Open application
2. Create account
3. Configure business
4. Create customer: "ABC Technologies"
5. Create project: "Website Development"
6. Add:
   - UI/UX Design
   - Frontend Development
   - Backend Development
   - Testing
7. Configure quantities/rates
8. Add scope
9. Add deliverables
10. Add timeline
11. Add terms
12. Review calculation
13. Save quotation
14. Generate PDF
15. Generate public link
```

### Client

```text
16. Open public link
17. Review quotation
18. Review scope
19. Review pricing
20. Download PDF
21. Accept quotation
```

### Business owner

```text
22. Return to application
23. Open quotation
24. See status = Accepted
25. See acceptance timestamp
26. See client response
27. See quotation in dashboard analytics
```

If this complete scenario works reliably, the core MVP is functionally complete.

---

# 29. Explicit MVP Boundary

The following should **not delay MVP release**:

```text
❌ Payment collection
❌ Payment gateway
❌ Accounting
❌ Bank integration
❌ Team collaboration
❌ Advanced roles
❌ AI
❌ WhatsApp integration
❌ CRM integration
❌ Advanced automations
❌ Advanced GST/e-invoicing
❌ Full project management
```

The MVP is specifically:

```text
AUTHENTICATE
     ↓
SET UP BUSINESS
     ↓
MANAGE CLIENT
     ↓
CREATE PROJECT
     ↓
ESTIMATE COST
     ↓
CREATE QUOTATION
     ↓
GENERATE PDF
     ↓
SHARE
     ↓
CLIENT REVIEWS
     ↓
ACCEPT / REJECT
     ↓
TRACK RESULT
```

That is the complete product loop for the first release.