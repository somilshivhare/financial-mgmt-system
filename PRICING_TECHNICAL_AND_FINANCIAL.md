# NB Aurum Solutions — Technical & Financial Pricing Description

This document describes how NB Aurum Solutions charges for its offerings from both a **technical** (platform subscription, billing system, usage) and **financial** (collections consultancy, cost structure, ROI) perspective. It is intended for internal reference, sales, and client proposals.

---

## 1. Overview

NB Aurum Solutions offers two distinct but complementary ways of engagement:

| Layer | What It Is | How We Charge |
|-------|------------|----------------|
| **Platform (SaaS)** | Web-based tool for receivables, POs, invoices, payments, collections, and MIS | Monthly subscription by plan (Trial, Starter, Growth, Enterprise) in INR |
| **Collections & Consultancy** | On-ground liaison, payment realization, dispute management, and compliance support | **Outcome-based:** "No Collection, No Fee" — payment only upon successful recovery |

---

## 2. Technical Pricing (Platform Subscription)

### 2.1 Plan Structure and Pricing (INR)

| Plan | Price (INR/month) | Billing Cycle | Notes |
|------|-------------------|---------------|--------|
| **Trial** | ₹0 | Monthly | Evaluate the platform with core modules |
| **Starter** | ₹4,999 | Monthly | For small teams managing receivables and collections |
| **Growth** | ₹14,999 | Monthly | For growing organizations; featured plan |
| **Enterprise** | Custom | As agreed | Collections consultancy + platform for large deployments |

*Source: Backend `subscriptionController.js` (`PLAN_PRICE_INR`) and public Pricing page.*

### 2.2 How Subscription Is Applied (Technical)

- **Billing cycle:** Fixed as **monthly**. Next billing date is computed as current date + 30 days for display purposes.
- **Trial:** When status is `trial` and `ends_at` is set, the UI shows "trial days remaining." No charge until the customer upgrades or trial ends.
- **Upgrade/downgrade:** User can switch plan (e.g. Trial → Starter → Growth). Change is stored in `subscriptions`; subscription history records the transition (from plan, to plan, date, amount).
- **Cancellation:** Setting status to `canceled` stops recurring billing; history records the cancellation. No proration logic is described in the current codebase; custom/Enterprise may be handled offline.
- **Enterprise:** No fixed platform price in the system; amount is "Custom." Commercial terms are defined in a separate proposal/contract.

### 2.3 What Each Plan Includes (Capabilities)

| Capability | Trial | Starter | Growth | Enterprise |
|------------|--------|---------|--------|------------|
| **Users** | 3 | 10 | 30 | Unlimited |
| **Core modules** (Master Data, PO, Invoice, Payments) | ✓ | ✓ | ✓ | ✓ |
| **Collections planning & MIS** | Basic | Full | Advanced | Advanced + consultancy |
| **Security & RBAC** | Standard | Standard | Extended roles | Custom roles & SSO |
| **Support** | Email | Email | Priority | Dedicated success |

- **Trial:** Up to 3 users, Master Data, PO, Invoice, Payments, basic collections & dashboards, email support.
- **Starter:** Up to 10 users, full platform modules, collections planning & reporting, MIS & aging analysis.
- **Growth:** Up to 30 users, advanced workflows & approvals, priority support, dedicated liaison support options.
- **Enterprise:** Unlimited users, custom security & SSO, performance-based collection engagement, dedicated success & SLAs.

### 2.4 Usage and Billing Data (Technical)

- **Usage:** The dashboard can expose subscription usage (e.g. users, storage) per account via `getSubscriptionUsage`.
- **Invoicing:** Subscription-related invoices can be generated; a placeholder PDF download exists for "invoice" by ID. Actual invoice generation may be extended or handled externally.
- **Payment recording:** The platform has a payments module for **customer receivables** (invoices, payments), which is separate from **our** subscription billing. Our subscription revenue is tracked via plan, status, and subscription history (plan changes, cancellations, amounts).

### 2.5 Summary: How We Charge for the Platform (Technical)

- **Recurring:** Monthly subscription in INR per plan (Trial = ₹0, Starter = ₹4,999, Growth = ₹14,999, Enterprise = Custom).
- **When:** Billing cycle is monthly; exact charge date and payment method (e.g. PG, bank transfer) can be defined in contract or payment integration.
- **What we track:** Plan name, status (trial / active / past_due / canceled), optional seats, start/end dates, and subscription history for audits and support.

---

## 3. Financial Pricing (Collections & Consultancy)

### 3.1 Core Principle: No Collection, No Fee

- **Zero upfront cost** for the collections/consultancy engagement.
- **Outcome-based pricing:** We are paid when we **successfully recover** payment for the client.
- **No success ⇒ no fee** for that recovery. This aligns our incentive with the client’s and reduces adoption risk.

### 3.2 How This Translates into Cost for the Client

- **Variable, not fixed:** Client does not pay salaries, benefits, office space, or travel for an in-house collection team for this work. They pay a **success fee** (or agreed percentage/fee structure) on amounts we recover.
- **Fee structure:** The exact success fee (e.g. % of recovered amount or tiered rates) is defined in the engagement letter or contract. The marketing message is "payment only upon successful recovery."
- **Typical financial impact:** In sectors like Solar and Power, delayed collections have a high cost of capital. Example: ₹5 Crores stuck with a DISCOM for an extra 6 months at 10% cost of capital ≈ ₹25 Lakhs in interest/working capital cost. Our "Pole-to-Pole" approach aims to reduce collection cycles by ~30–45%, often saving enough to exceed our success fee — making the engagement cashflow positive from the client’s perspective.

### 3.3 In-House vs. NB Aurum: Cost Comparison (Financial View)

| Dimension | In-House Team | NB Aurum Solutions |
|-----------|----------------|---------------------|
| **Cost structure** | High fixed costs: salaries, benefits, office, travel | Variable: performance-based, No Collection No Fee |
| **Expertise** | Generalists (accounting); limited on-ground liaison | Specialists in PSU/utility protocols and processes |
| **Scalability** | Slow and costly to scale for project surges | Scale across states and volume without proportional fixed cost |
| **Recovery rate** | Often 60–70% with manual follow-ups | 90–100% with expert liaison and tracking |
| **DSO** | Often 120+ days | Target 60–90 days (accelerated realization) |
| **Bad debt risk** | Higher (files can age in routine workflows) | Lower (persistent tracking, fewer write-offs) |
| **Legal/arbitration** | Higher if disputes are not mediated | Lower; pre-legal mediation resolves many disputes |

This comparison supports the **financial logic** of outsourcing: conversion of fixed cost to variable, higher recovery and lower DSO, reduced bad debt and legal cost.

### 3.4 What the Client Pays For (Financial Summary)

1. **Platform (optional):** Monthly subscription (₹0 / ₹4,999 / ₹14,999 or Custom) if they use our SaaS for receivables, POs, invoices, payments, and MIS.
2. **Collections & consultancy:** Success-based fee on recovered amounts as per contract — **no recovery, no fee** for that component. No retainer or upfront fee is required for the outcome-based engagement.

---

## 4. Combined View: How We Are Charging for Cost

| Cost element | Who bears it | How we charge / how it works |
|--------------|--------------|------------------------------|
| **Platform (SaaS)** | Client (subscriber) | Monthly INR by plan (Trial / Starter / Growth / Enterprise). Billed every 30 days; tracked in subscription system. |
| **Collections & liaison** | Client (only on success) | Success fee on recovered amounts. No Collection, No Fee; zero upfront. |
| **Enterprise / custom** | Client | Custom contract: platform + engagement (e.g. SLAs, dedicated success, performance-based engagement). |
| **Support** | Included in plan | Email (Trial/Starter), Priority (Growth), Dedicated (Enterprise). No separate support charge in standard plans. |

---

## 5. References

- **Backend:** `server/src/controllers/subscriptionController.js` (plan prices, billing cycle, upgrade/cancel, history).
- **Backend:** `server/src/services/subscriptionService.js` (subscription CRUD, plans, billing bundle).
- **Frontend:** `client/src/pages/Pricing.jsx` (public tiers, comparison table, FAQ).
- **Marketing:** About and Home pages (No Collection No Fee, in-house vs outsourced, time-value of money, recovery rates).

---

*Document version: 1.0 — Technical and financial pricing description for NB Aurum Solutions.*
