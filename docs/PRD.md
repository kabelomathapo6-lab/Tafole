# Tafole: Product Requirements Document (v1)

## 1. Overview
Tafole is a mobile-first web app (PWA) for sit-down restaurants. Guests order and call for service from their table; staff manage service in real time. Principle: **remove the waiting, not the waiter**.

## 2. Goals and non-goals
**Goals (v1):** cut guest waiting, reduce order errors, keep the waiter central, run live with a real restaurant.
**Non-goals (v1):** payments and splitting bills, delivery or takeaway, loyalty programmes, multi-location chains, native apps, inventory.

## 3. Users and roles
| Role | Auth | Can do |
|---|---|---|
| **Guest** | Anonymous session tied to a table via QR | View menu, place orders, call waiter, request bill, see order status |
| **Waiter** | Email + password | See assigned tables, confirm or edit orders, respond to calls, mark served |
| **Kitchen** | Email + password | See incoming orders, update status (preparing, ready) |
| **Manager** | Email + password | Everything above, plus manage menu, tables, QR codes, staff, view analytics |

Permissions are enforced on the backend with Supabase Row Level Security, not only in the UI. Staff can only access data for their own restaurant.

## 4. Must features and acceptance criteria

### M1. QR ordering at the table
- Scanning a table's QR opens that restaurant's menu with the table pre-selected, with no install or sign-up.
- Guest can add items with notes, review the cart and submit an order.
- Order appears for the waiter and kitchen within 2 seconds.
- Guest sees live order status.

### M2. Call waiter / request bill
- One-tap "Call waiter" and "Request bill" with an optional reason.
- Waiter sees the request on their table with elapsed time; guest sees "acknowledged" when handled.
- Repeated taps do not create duplicate open requests.

### M3. Live kitchen display
- Kitchen sees new orders in arrival order, grouped by table.
- Status updates (new, preparing, ready) reach the waiter and guest in real time.
- Works on a tablet in landscape.

### M4. Waiter table view
- Waiter sees a table list or map with status (empty, ordered, waiting for service, bill requested).
- Waiter can confirm, edit or cancel an order before it goes to the kitchen, and mark items served.
- Waiter sees open requests sorted by wait time.

### M5. Manager console
- Create and edit menu categories, items, prices and availability (mark sold out).
- Create tables and generate or print a QR code per table.
- Invite and remove staff and assign roles.
- Basic dashboard: orders per day, median response time, busiest hours.

## 5. Data model (high level)
`restaurants`, `staff_profiles` (user, restaurant, role), `tables`, `menu_categories`, `menu_items`, `orders`, `order_items`, `service_requests` (type: waiter or bill), `table_sessions`.

## 6. Non-functional requirements
- Mobile-first, responsive from 360px up to desktop; matches Stitch designs.
- Fast on mobile data: first load under 3 seconds on a mid-range phone.
- Realtime updates via Supabase Realtime.
- Accessibility: readable contrast, touch targets 44px+.
- Tests: unit and integration tests for core logic and permission rules; CI on every PR (lint, typecheck, tests, build).

## 7. Tech stack
Next.js, TypeScript, Tailwind, Supabase (Postgres, Auth, Realtime, Storage, RLS), Vitest and Playwright, GitHub Actions, deployed on Vercel.

## 8. Success metrics
- Median request response time and order-to-table time vs. pilot baseline.
- Orders re-made or comped per 100 orders.
- Staff and guest feedback during the pilot.

## 9. Risks
| Risk | Mitigation |
|---|---|
| Guests ignore QR and still call the waiter | Table cards, waiter prompt to guests; waiter flow works regardless |
| Unreliable restaurant Wi-Fi | Guests use mobile data; keep payloads small; show clear offline state |
| Scope too large for deadline | Payments and extras are out of scope; build M1-M5 end to end first |
