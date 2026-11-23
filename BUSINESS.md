# Tafole: Business Overview

> **Remove the waiting, not the waiter.**

## 1. The problem
Sit-down restaurants in South Africa lose money and goodwill in the gaps between a guest wanting something and a waiter noticing. Guests wait to be greeted, wait to order, wait for the bill, and spend much of the visit trying to catch someone's eye. Waiters are stretched across too many tables and run back and forth to the kitchen. Orders get written on paper, mis-heard or lost.

- **Who has it:** guests, waiters, kitchen staff and owners of independent and small-group restaurants.
- **How often:** every service, every table.
- **What it costs today:** slower table turnover, mis-keyed orders and comps, lower tips and reviews, and staff burnout. *(Pilot task: measure baseline order-to-table time and error rate with the pilot restaurant and record the numbers here.)*

## 2. The customer
- **User:** guests (no install, no account) and restaurant staff (waiter, kitchen, manager).
- **Payer:** the restaurant owner or manager, who is also the one who feels the cost of slow service.
- **Initial segment:** independent, owner-run restaurants with 10-40 tables, mostly in Gauteng, that have no integrated ordering system.

## 3. The solution (one sentence)
Tafole lets guests scan a QR code at their table to order, call their waiter or ask for the bill, while the kitchen sees orders live and the waiter stays in charge of the experience.

## 4. Impact and how we measure it
| Outcome | Metric | How measured |
|---|---|---|
| Less waiting | Median time from seating to first order; request-to-response time | Timestamps in the database |
| Fewer errors | Orders re-made or comped per 100 orders | Manager flags in the app |
| Better staff day | Tables a waiter can cover per shift | Orders and requests per waiter |
| Owner revenue | Table turnover and average spend | Dashboard, before vs. after pilot |

## 5. Business model
- **Subscription per restaurant, billed monthly, no commission on orders.**
  - Starter: 1 location, up to 15 tables, 3 staff logins (draft price: R599/month).
  - Standard: up to 40 tables, unlimited staff, analytics (draft price: R1,199/month).
  - Free 30-day pilot for the first restaurants.
- **Why flat, not commission:** restaurants already resent percentage fees. A predictable cost is an easy yes, and our margin comes from low infrastructure cost per restaurant.
- *(Draft prices to be validated with the pilot restaurant.)*

## 6. Go-to-market: first 100 restaurants
1. **Pilot (1-3):** one restaurant free for 30 days. Case study with before/after numbers.
2. **Direct outreach (10-30):** walk-ins and demos at independent restaurants in one Johannesburg area, using the case study.
3. **Referrals and community (30-60):** restaurant owner WhatsApp groups, hospitality associations and the pilot owner's network.
4. **Partnerships (60-100):** POS resellers and food-and-beverage suppliers who already visit restaurants.
5. **Content:** short videos of the "no waiting" experience for Instagram and TikTok.

## 7. Competition
| Alternative | Gap Tafole fills |
|---|---|
| Paper menus and shouting for the waiter (the status quo) | Zero visibility into waits; order errors |
| POS systems with ordering add-ons (e.g. Yoco, Lightspeed) | Built for payments and tills first; guest-side table experience is secondary |
| Global QR-ordering platforms | Priced and designed for chains and other markets |
| Waiter handheld devices | Speeds up waiters but does nothing for the guest waiting to be seen |

*(Verify current competitor offerings and pricing before final submission.)*

**Why Tafole:** it is designed around the waiter instead of replacing them, works as a PWA with no app install, is priced for independents, and is built for South African conditions: data-light and fast on mobile.

## 8. Why me
I work in business development, so I understand selling to business owners, and I'm training as a software engineer, so I can build and iterate on the product myself.

## 9. Day-one Must features
1. QR ordering at the table (guest, no install)
2. Call waiter / request bill
3. Live kitchen display
4. Waiter table view
5. Manager console (menu, tables, QR codes, staff)

See [`docs/PRD.md`](docs/PRD.md) for details.
