# Tafole Hospitality Design Specification Summary

**System Version:** 1.0.0  
**Brand Identity:** Tafole Hospitality OS  
**Typography:** Plus Jakarta Sans  
**Target Environments:** Mobile (iOS/Android responsive web), Tablet (Landscape 10.2"+), Desktop (1440px+)  
**Primary Aesthetic:** Modern, warm, tactile hospitality operating system. Warm off-white canvas, deep forest green primary, terracotta accent, soft elevation, high-contrast readable type, touch-ergonomic targets (min 48–56px).

---

## 1. Brand Tokens & Design System

### 1.1 Color Palette
- **Canvas / Background (`surface`):** `#fbf9f5` (Warm off-white linen)
- **Container / Card Elevated (`surface-container-lowest` / `-low`):** `#ffffff` to `#f5f3ef`
- **Container Borders / Dividers (`outline-variant`):** `#e6e2da` / `#dbdad6`
- **Primary Brand (`primary`):** `#1e3f20` (Deep Forest Evergreen)
- **Primary On / Contrast (`on-primary`):** `#ffffff`
- **Accent / Alert / Action (`terracotta`):** `#b85d38` / `#a24926` (Warm terracotta clay)
- **Status Semantic Tokens:**
  - **Available / Online / Ready:** Emerald Green (`#2e7d32` / `#e8f5e9`)
  - **In Progress / Preparing / Active:** Amber Gold (`#d97706` / `#fef3c7`)
  - **Waiting / Bill Requested / Action Required:** Terracotta / Rust (`#b85d38` / `#fee2e2`)
  - **Empty / Inactive / Disabled:** Muted Neutral (`#78716c` / `#f5f5f4`)

### 1.2 Typography & Hierarchy
- **Font Family:** `Plus Jakarta Sans`, sans-serif (Google Fonts)
- **Display Headings:** SemiBold / Bold (700), tight tracking (`-0.02em`)
- **Body & Labels:** Regular (400), Medium (500), SemiBold (600)
- **Numeric & Data Values:** Tabular figures for timers, table numbers, currency, and quantities.

### 1.3 Shapes, Spacing & Elevation
- **Border Radius:**
  - Badges & Chips: `rounded-full` (9999px)
  - Cards & Modal Sheets: `rounded-2xl` (16px) or `rounded-3xl` (24px)
  - Interactive Buttons & Inputs: `rounded-xl` (12px) to `rounded-2xl` (16px)
- **Touch Ergonomics:**
  - Handheld mobile buttons: Minimum 48px to 54px touch height
  - KDS bump buttons: Minimum 56px to 64px for fast grease-resistant kitchen tapping
  - Keypad touch cells: 64px × 64px minimum with generous gutter

---

## 2. Screen & Architecture Specifications

### Screen 1: Guest Menu (`Table 7`) — Mobile
- **Context:** Scanned via dynamic table QR code. Zero-friction onboarding (no account required).
- **Key Components:**
  - Persistent location header: Restaurant name ("Tafole Hearth & Kitchen") + Table badge (`Table 7`).
  - Horizontal sticky category chip scroll (*All Day*, *Starters*, *Wood-Fired Mains*, *Sides*, *Beverages*, *Wine*).
  - High-appeal menu item cards: Photo thumbnail, title, dietary tags (V, GF), pricing (`ZAR / $`), concise description, and instant "+ Add" floating tap trigger.
  - Sticky bottom cart bar: Item count bubble, total sum preview, and direct CTA to checkout.

### Screen 2: Guest Cart & Live Order Status — Mobile
- **Context:** Post-order tracking & guest self-service during the dining experience.
- **Key Components:**
  - Itemized order breakdown with quantity steppers (`- 1 +`) and kitchen notes input field.
  - Three-tier animated status stepper:
    1. *Order Received* (timestamped)
    2. *Preparing in Hearth Kitchen* (live estimate)
    3. *Ready for Service*
  - Persistent floating guest assistance buttons:
    - **"Call Waiter"** (triggers instantaneous floor alert)
    - **"Request Bill"** (prompts cash / card / split calculation)

### Screen 3: Waiter Floor View — Mobile & Tablet
- **Context:** Waitstaff terminal for proactive table turns and alert triage.
- **Key Components:**
  - Color-coded table grid matrix:
    - *Green*: Available / Seated
    - *Amber*: Order Placed / Kitchen Cooking
    - *Terracotta*: Attention Needed / Water Call / Bill Requested
  - Open requests queue sorted strictly by wait time (e.g. `Table 7 • Bill Request • 01:42s ago`).
  - Slide-out bottom sheet / detail panel showing table covers, running tab total, course sequencing, and instant table transfer options.

### Screen 4: Kitchen Display System (KDS) — Tablet Landscape
- **Context:** Back-of-house kitchen display mounted above prep lines and hearth stations.
- **Key Components:**
  - High-visibility Kanban swimlanes:
    - **Column 1: New Orders**
    - **Column 2: Preparing / In Oven**
    - **Column 3: Ready for Pass**
  - High-contrast ticket cards grouped by table number, server name, course tag (*Starters first* vs *Main*), and elapsed color-shifting ticket timers (<8m Green, 8–15m Amber, >15m Terracotta Alert).
  - Giant tactile "Bump" & "Send to Pass" touch targets.

### Screen 5: Manager Menu Editor — Desktop
- **Context:** Administrative catalog, availability management, and pricing adjustments.
- **Key Components:**
  - Dual-pane layout: Left category hierarchy tree & tag filters; center searchable item table.
  - Live status quick-switches: "Sold Out / In Stock" toggle for instant 86ing across guest menus.
  - Slide-over edit drawer: Multi-currency price configuration, recipe modifiers, allergen checkboxes, and imagery uploader.

### Screen 6: Manager Tables & QR Generator — Desktop
- **Context:** Dining room setup, capacity planning, and QR asset generation.
- **Key Components:**
  - Table configuration inventory: Table name/number, area (Main Dining, Courtyard, Patio, Bar), and seat capacity.
  - Automated Vector QR generation with instant SVG/PDF print exporter, custom table badge print templates, and download bundles.

### Screen 7: Manager Operations Dashboard — Desktop
- **Context:** Real-time shift telemetry, analytics, and operational health metrics.
- **Key Components:**
  - Top KPI cards: Daily Gross Covers, Total Revenue, Median Ticket Prep Time, Average Waiter Response Time (< 2m 15s).
  - Peak hour rush volume area graph (11:00 to 23:00 timeline curve).
  - Live on-duty roster widget displaying active floor leads, waitstaff load, and active table assignments.

### Screen 8: Staff Authentication Terminal — Desktop & Mobile
- **Context:** Fast shift clock-in, floor station lock/unlock, and security enforcement.
- **Key Components:**
  - Dual-mode segmented switcher: **Email & Password** vs **Quick PIN**.
  - Ergonomic 3×4 numeric pad with high-visibility PIN progress dots.
  - Fail-safe security states: Error banner, remaining attempt warnings, and rate-limited countdown lockout (`Terminal Locked 00:24`).
  - Contactless / NFC Staff Badge quick-tap RFID reader prompt.
  - Fast profile switcher chips for on-shift handovers.

---

## 3. Implementation & Frontend Guidelines

1. **Responsive Breakpoints:**
   - Mobile: 375px – 430px (Fluid flex columns, fixed bottom bars, safe-area padding `pb-safe`).
   - Tablet: 768px – 1180px (2-column split layouts, horizontal scroll rails, enlarged buttons).
   - Desktop: 1280px – 1920px (Sticky sidebar navigation, data grids, modal/drawer surfaces).

2. **Styling Framework:**
   - Designed natively for **Tailwind CSS**.
   - Custom utility variables mapped directly to `#1e3f20` (`primary`), `#fbf9f5` (`surface`), and `#b85d38` (`accent`).
   - Font loading: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`

3. **Accessibility (a11y):**
   - High text-to-background contrast ratios exceeding WCAG AA standards (4.5:1 minimum on all critical text).
   - Clear visual focus rings (`ring-2 ring-primary`) on all interactive inputs and buttons.
   - Screen-reader tags for live KDS timers and order status updates.