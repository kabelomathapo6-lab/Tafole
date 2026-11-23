# Tafole: Implementation Plan

Build phase by phase. Every phase follows TDD (write the failing test, make it pass, refactor), is delivered through Issue → branch → PR → merge, and ends with something working on the live link.

**Workflow rules**
- Branch names: `feat/<issue-number>-short-name`. Small, clear commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- A PR must pass CI (lint, typecheck, tests, build) before merge and must reference its Issue (`Closes #n`).
- UI must match the Stitch designs in `docs/designs/` on mobile and desktop.
- Permissions are enforced in Postgres RLS, with tests that prove a user cannot read or write another restaurant's data.

## Phase 0: Foundation
**Goal:** a deployed, empty app with CI green.
- Scaffold Next.js + TypeScript + Tailwind; ESLint, Prettier, Vitest, Playwright.
- GitHub Actions CI (lint, typecheck, test, build) on every PR.
- Supabase project, environment variables, Vercel deploy, branch protection on `main`.
- Design tokens (colours, type, spacing) taken from the Stitch designs; shared UI primitives (button, card, input, chip).
- **Done when:** live URL loads, CI passes on a PR.

## Phase 1: Auth, roles and database
**Goal:** staff can log in; data is protected.
- Schema and migrations: `restaurants`, `staff_profiles`, `tables`, `menu_categories`, `menu_items`, `table_sessions`, `orders`, `order_items`, `service_requests`.
- Supabase Auth for staff (email + password); anonymous sessions for guests.
- RLS policies per role (guest, waiter, kitchen, manager) scoped by restaurant.
- Login page, role-based routing and route guards.
- RLS tests covering cross-restaurant and cross-role access.
- Seed script with a real demo restaurant and test accounts for each role.
- **Done when:** each role logs in and lands on the right screen; RLS tests pass.

## Phase 2: Manager console (M5)
**Goal:** a restaurant can set itself up with real data.
- Menu categories and items CRUD with photo upload and sold-out toggle.
- Tables CRUD and QR code generation/printing per table.
- Staff invite, role assignment and removal.
- **Done when:** a manager builds a full menu and tables and prints QR codes on the live link.

## Phase 3: Guest ordering (M1)
**Goal:** a guest scans a QR and orders.
- QR route resolves restaurant and table and creates a table session.
- Menu browsing, cart, notes, order submission; order status screen.
- Realtime subscription for status updates.
- **Done when:** a phone scan places an order that is stored and visible in the database.

## Phase 4: Kitchen and waiter (M3, M4)
**Goal:** staff handle orders in real time.
- Kitchen display: new, preparing, ready; realtime updates.
- Waiter table view: status per table, confirm/edit/cancel order, mark served.
- **Done when:** order flows guest → waiter → kitchen → guest status, end to end, live.

## Phase 5: Service requests (M2)
**Goal:** guests call the waiter or ask for the bill.
- Call waiter and request bill with dedupe of open requests.
- Waiter request list sorted by wait time; acknowledge and resolve; guest sees acknowledgement.
- **Done when:** request flow works end to end with response-time timestamps stored.

## Phase 6: Analytics, polish and hardening
**Goal:** looks and feels like a real startup product.
- Manager dashboard: orders per day, median response time, busiest hours.
- Empty, loading and error states; responsive pass on all screens; accessibility pass.
- PWA manifest and icons; performance pass.
- E2E test of the full order flow in Playwright.
- **Done when:** every screen matches Stitch designs at mobile and desktop widths.

## Phase 7: Launch and submission
- Real data loaded for pilot restaurant (or realistic demo restaurant).
- README completed: live link, Stitch link, test logins, screenshots, architecture diagram, local run and test instructions, known issues.
- Final check against the capstone checklist: login, 2+ roles, hosted DB with backend rules, Must features live, CI, Issues → PRs.

## Dependency order
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Phases 2 and 3 can overlap once Phase 1 is merged.
