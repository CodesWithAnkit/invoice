# 0001 · Business Onboarding

**Status**: Assumed
**Date**: 2026-09-26
**Authorized by**: Antigravity, during /develop

## Owed decision
The specific layout and routing strategy for the onboarding flow wasn't specced out, nor the exact fields saved.

## Assumption built on
Build an onboarding page at `/onboarding` that users hit after sign-up (or login without business info). It will present a form for business name (required), email, phone, address, website, tax ID, and currency. Users can skip to dashboard if they provide a name. Will save via `PATCH /api/business`. We will also create a basic GET/PATCH `/api/business` route to update the `businesses` table. Logo upload to a private bucket is also assumed via Supabase storage.

## Code area
`src/app/onboarding/page.tsx`
`src/app/api/business/route.ts`

## Requirements
AC-BIZ-001, AC-BIZ-002: After the first sign-in with no business: onboarding step with business name (required), then optional logo, email, phone, address, website, tax ID and currency, with Skip (PRD §13). Field layout from `form/BusinessDetails.tsx`. `GET/PATCH /api/business`; logo upload to a private bucket.

## Ratify
This decision was recorded by /develop, not deliberated. Run `/architect Business Onboarding`
to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.
