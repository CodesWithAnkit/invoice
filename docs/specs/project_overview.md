# Project Overview: Invoice & Quote Generator

## Big Picture
This application is a high-fidelity, high-speed **Invoice & Quote Generator & Manager** designed specifically for freelancers, consultants, and small businesses. It allows users to dynamically construct, style, sign, and print A4 invoices or quotes, parse existing PDFs to pre-fill invoices using AI, and save all data into a secure dashboard backed by Supabase.

---

## Key Personas & Target Users
- **Freelancers & Solopreneurs**: Need an elegant, fast tool to generate and print invoice PDFs with custom fields (Aadhaar, Phone), signature integration, and bank details.
- **Consultants & Agencies**: Require quote generation options that easily convert into invoices.
- **Small Businesses**: Need to track clients, manage services/products, and record generated invoices in a central dashboard.

---

## Core User Flows
1. **Invoice/Quote Editor**:
   - Live double-column layout: interactive editor form on the left, high-fidelity print preview on the right.
   - Dynamic item listing with automated quantity-to-price recalculations.
   - Bank details and digital signature canvas fields.
   - Custom customer fields (e.g., Aadhaar/Phone fields).
   - High-fidelity PDF generation via optimized A4 printing.
2. **AI-Assisted Invoice Generation**:
   - Uploading previous invoice/bill PDFs to automatically parse items, business names, tax details, and totals.
   - Generating standard item lines using LLM assistance (Gemini Pro) to fill in pricing, description, and tax classifications.
3. **Management Dashboard**:
   - View saved invoices, revenue stats, active customers, and product items.
   - Re-open saved invoice drafts to edit or re-download.

---

## In-Scope vs. Out-of-Scope

### In-Scope (Core Focus)
- **High-fidelity A4 Print Layout**: Invoices must render beautifully in print mode and on screen.
- **Digital Signatures**: Capturing freehand signatures and storing them securely.
- **Indian Tax Support (GST)**: Explicit support for standard SGST and CGST breakdowns (totaling 18% or custom %).
- **AI PDF Parsing & Autocompletion**: Extracting text from uploaded invoice PDFs to pre-populate form state.
- **Offline Draft Saving**: Caching current editor state in `localStorage` so users never lose progress on refresh.
- **Dashboard Database Syncing**: Storing customer profiles, invoices, and product catalogs in Supabase.

### Out-of-Scope (Explicitly Avoid)
- **Double-Entry Accounting / Bookkeeping**: Do not implement full ledger sheets, balance sheets, or tax filing forms.
- **Online Payment Gateways**: Do not build integrations for Stripe, PayPal, Razorpay, or credit card collection directly in the editor.
- **Payroll/HR Systems**: Tracking hours, employee salaries, or payroll runs is completely out of scope.
- **Inventory/Warehouse Management**: Real-time stock counts, multi-warehouse shipments, or SKU barcode tracking.
