# Requires GitHub CLI: winget install GitHub.cli ; then: gh auth login
# Run from the repo root in PowerShell: .\scripts\create-issues.ps1

$issues = @(
  @{ t = "Phase 0: Scaffold Next.js, TypeScript, Tailwind, lint and test tooling"; b = "Set up the app, ESLint, Prettier, Vitest and Playwright.`n`nDone when: app runs locally with lint, typecheck, test and build scripts." },
  @{ t = "Phase 0: CI workflow (lint, typecheck, tests, build)"; b = "Add GitHub Actions workflow and branch protection on main.`n`nDone when: CI runs and passes on every PR." },
  @{ t = "Phase 0: Supabase project, env vars and Vercel deploy"; b = "Create hosted Supabase project and deploy to Vercel.`n`nDone when: live URL loads." },
  @{ t = "Phase 0: Design tokens and UI primitives from Stitch designs"; b = "Colours, type, spacing, button, card, input, chip.`n`nDone when: primitives match docs/designs." },
  @{ t = "Phase 1: Database schema and migrations"; b = "restaurants, staff_profiles, tables, menu_categories, menu_items, table_sessions, orders, order_items, service_requests." },
  @{ t = "Phase 1: Auth for staff and anonymous guest sessions"; b = "Supabase Auth email and password for staff; anonymous sessions for guests." },
  @{ t = "Phase 1: RLS policies and RLS tests"; b = "Policies per role scoped by restaurant, with tests proving cross-restaurant and cross-role access is blocked." },
  @{ t = "Phase 1: Login page, role-based routing and route guards"; b = "Each role lands on the correct screen after login." },
  @{ t = "Phase 1: Seed script with demo restaurant and test accounts"; b = "Real demo data and one account per role for the README." },
  @{ t = "Phase 2 (M5): Menu management (categories, items, photos, sold-out)"; b = "Manager CRUD for menu." },
  @{ t = "Phase 2 (M5): Tables and QR code generation"; b = "Manager creates tables and prints a QR per table." },
  @{ t = "Phase 2 (M5): Staff invite and role management"; b = "Manager invites, assigns roles and removes staff." },
  @{ t = "Phase 3 (M1): QR route and table session"; b = "Scan resolves restaurant and table and starts a session." },
  @{ t = "Phase 3 (M1): Guest menu, cart and order submission"; b = "Matches Stitch guest screens on mobile." },
  @{ t = "Phase 3 (M1): Guest order status with realtime updates"; b = "Live status tracker." },
  @{ t = "Phase 4 (M3): Kitchen display"; b = "New, preparing, ready columns with realtime updates; tablet landscape." },
  @{ t = "Phase 4 (M4): Waiter table view and order actions"; b = "Table statuses, confirm/edit/cancel order, mark served." },
  @{ t = "Phase 5 (M2): Call waiter and request bill"; b = "One tap, dedupe open requests, guest sees acknowledgement." },
  @{ t = "Phase 5 (M2): Waiter request list with response timestamps"; b = "Sorted by wait time; acknowledge and resolve." },
  @{ t = "Phase 6: Manager analytics dashboard"; b = "Orders per day, median response time, busiest hours." },
  @{ t = "Phase 6: Responsive, empty/loading/error states and accessibility pass"; b = "All screens match Stitch at mobile and desktop." },
  @{ t = "Phase 6: PWA manifest and icons"; b = "Installable from the browser." },
  @{ t = "Phase 6: Playwright E2E for the full order flow"; b = "Guest order to kitchen to served." },
  @{ t = "Phase 7: Final README, screenshots, architecture diagram and submission check"; b = "Complete README per capstone checklist." }
)

foreach ($i in $issues) {
  gh issue create --title $i.t --body $i.b
}
