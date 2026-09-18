# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The author, using the app for personal use. One primary user controlling their own
household finances (income, expenses, accounts, and credit-card invoices). No
secondary audiences defined.

## Product Purpose

A personal finance management web app to record and understand money movement:
transactions (income/expense) across accounts, dynamic categories, and credit-card
invoices with closing/due dates and partial payments. Success means the user can
see, at a glance, where money goes each month and keep credit-card obligations
correctly tracked.

## Positioning

Undecided. The strongest candidate mechanism is first-class credit-card invoice
handling (invoice as its own entity with period, closing, due date, and partial
payment), but no positioning has been committed. A planned feature — monthly
budgeting by category with limits and progress (see `NEXT.md`) — may also become a
pillar. Treat both as open, not decided.

## Operating Context

- Language of the product and its UI is Brazilian Portuguese (pt-BR); currency is
  BRL.
- Operates on a monthly rhythm: cash-flow overview per month, and credit cards that
  run on a billing period defined by a closing day and a due day (e.g. closes on the
  10th, due on the 17th).
- Uses a browser on desktop and mobile (responsive, offline-cached).

## Capabilities and Constraints

- **Stack** (existing codebase): NestJS + MongoDB backend; React 18 + TypeScript +
  Vite + TailwindCSS frontend. Deployed via docker-compose (Mongo, backend, frontend
  behind nginx).
- **Auth**: register/login with JWT in httpOnly cookies, plus a refresh flow.
  Multi-user auth exists but data is **not yet scoped per user** — effectively
  single-user for now (open decision: whether to add multi-tenancy later).
- **Entities/domains**: users, categories (income/expense, icon, active), accounts
  (checking / credit_card, with `creditLimit`, `closingDay`, `dueDay`), transactions
  (income/expense, paid/unpaid, with `isReversal`, `isFixed`, `isPayment`,
  `sortOrder`), invoices (open/closed/overdue/paid/partially_paid, period-based
  `startDate`/`closingDate`/`dueDate`, `totalAmount`/`paidAmount`), and a ledger of
  create/update/delete/reversal operations.
- **Credit-card invoice rules** (from `invoices.md`): a purchase belongs to the
  invoice whose period contains its date; invoices are created on demand
  (get-or-create); closing consolidates totals; paying an invoice creates a
  movement from a checking account and updates `paidAmount`/status (partial payment
  supported).
- **Offline**: the frontend caches GET responses in localStorage and serves them
  when offline, with an offline banner.

## Brand Commitments

The name "Vero Finc" is provisional, not a locked brand. No binding brand assets,
voice, or identity constraints have been established.

## Evidence on Hand

None — no real testimonials, customers, benchmarks, or case studies. Future work
must not fabricate any of these. The only domain reference is `invoices.md`, a
design note on credit-card invoice modeling.

## Product Principles

- Treat credit-card billing as a real period (closing and due dates), not a month
  label.
- Prefer a reliable financial history over recomputing on read: consolidate invoice
  totals at closing and record payments explicitly.
- Keep the interface calm and legible so the user can read their month at a glance.
- Remain honest about scope: single-user, provisional brand, positioning still open.

## Accessibility & Inclusion

No product-specific requirements established. UI is responsive (desktop and
mobile) and uses a high-contrast light theme with an offline fallback.
