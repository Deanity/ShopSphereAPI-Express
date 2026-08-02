# PRD — ShopSphere API Documentation Website

> Product Requirements Document for the static documentation site that accompanies the ShopSphere API backend.
> This is a **frontend-only** project (no framework, vanilla HTML/CSS/JS) served from `docs/web/` inside the main repo.

---

## 1. Project Overview

- **Name**        : ShopSphere API Docs
- **Description** : A static, single-page API reference website for the ShopSphere e-commerce backend. Developers and integrators use it to browse endpoints, read parameter contracts, and copy example request/response bodies.
- **Goal**        : Replace the README as the primary integration reference — scannable, visually structured, and fast to navigate without a local server.
- **Target Users**:
  - Frontend / mobile developers integrating with the API
  - Potential employers or collaborators reviewing the portfolio project
- **Version**     : v1.0.0
- **Status**      : Active Development

---

## 2. Tech Stack

| Layer       | Choice                          | Reason                                                        |
|-------------|----------------------------------|---------------------------------------------------------------|
| Markup      | Vanilla HTML5                    | No build step; static file works anywhere                    |
| Styling     | Vanilla CSS (custom properties)  | Full control over the brutalist token system in Design.md     |
| Behavior    | Vanilla JavaScript (ES modules)  | Sidebar active state, tab switching, copy-to-clipboard        |
| Fonts       | Google Fonts CDN                 | Archivo Black · Work Sans · Space Mono (all from Design.md)  |
| Hosting     | GitHub Pages / Vercel (static)   | Zero-config, free tier sufficient                            |
| No build    | —                                | No Webpack / Vite / Node required; open `index.html` locally |

> **Package manager**: None — this sub-project has no `package.json`.
> All assets (fonts, icons) are loaded from CDN or embedded inline.

---

## 3. File Structure

```
docs/
  web/                        <- root of the docs site
    index.html                <- single HTML file, all sections inline
    style.css                 <- all CSS, token-driven via custom properties
    script.js                 <- sidebar navigation, tab switching, copy button
    assets/
      favicon.svg             <- monochrome "SS" mark, no rounding
  Design.md                   <- design system reference (this repo)
  PRD.md                      <- this file
```

> Do **not** create sub-pages. All endpoint sections are anchor-linked sections
> inside a single `index.html`. This keeps navigation instant (no HTTP round-trip).

---

## 4. Design System — Token Map

Sourced directly from `Design.md`. Implemented as CSS custom properties in `:root`.

### Colors

```css
:root {
  /* Brand */
  --color-primary:    #0A0A0A;
  --color-secondary:  #EF4444;
  --color-tertiary:   #FAFAFA;

  /* Surfaces */
  --color-bg:         #FAFAFA;
  --color-surface:    #F5F5F5;
  --color-surface-raised: #E5E5E5;

  /* Text */
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #525252;
  --color-text-tertiary:  #A3A3A3;

  /* Borders */
  --border-subtle:  1px solid #E5E5E5;
  --border-medium:  1px solid #D4D4D4;
  --border-strong:  2px solid #0A0A0A;

  /* Method colors */
  --method-get:    #0A0A0A;
  --method-post:   #16A34A;
  --method-patch:  #CA8A04;
  --method-put:    #CA8A04;
  --method-delete: #EF4444;

  /* Semantic */
  --color-success: #16A34A;
  --color-warning: #CA8A04;
  --color-error:   #EF4444;
  --color-info:    #0A0A0A;
}
```

### Typography

```css
/* Families */
--font-display: 'Archivo Black', Impact, 'Arial Black', sans-serif;
--font-body:    'Work Sans', -apple-system, 'Segoe UI', Helvetica, sans-serif;
--font-mono:    'Space Mono', 'Courier New', Consolas, monospace;

/* Scale */
--text-display:   40px / 1.05  (Archivo Black, letter-spacing -0.03em)
--text-headline:  28px / 1.1   (Archivo Black, letter-spacing -0.02em)
--text-subhead:   18px / 1.2   (Archivo Black, letter-spacing -0.01em)
--text-body-lg:   18px / 1.6   (Work Sans)
--text-body:      16px / 1.7   (Work Sans)
--text-body-sm:   14px / 1.6   (Work Sans)
--text-caption:   12px / 1.5   (Work Sans, weight 500, letter-spacing 0.01em)
--text-overline:  11px / 1.4   (Work Sans, weight 700, letter-spacing 0.12em, uppercase)
--text-path:      16px / 1.4   (Space Mono) -- endpoint paths only
--text-code:      14px / 1.6   (Space Mono) -- request/response bodies
```

### Spacing

Base unit **8px**. Scale: `4 / 8 / 16 / 24 / 32 / 48 / 64 / 96`.

### Rules (non-negotiable)

- `border-radius: 0` everywhere — no exceptions
- No box-shadow — hierarchy via borders and weight only
- Red (`#EF4444`) used **only** for: DELETE badges · required-param asterisks · active tab underline
- Every endpoint path rendered in `Space Mono` — never `Work Sans`
- No syntax-highlight color inside code blocks — monochrome only

---

## 5. Page Layout

```
+------------------------------------------------------------------+
|  TOP NAV  "ShopSphere API"  [display] + version badge            |
|  border-bottom: var(--border-strong)                             |
+------------------+-----------------------------------------------+
|  SIDEBAR         |  MAIN CONTENT                                 |
|  260px           |  flex-1, max-width 860px, padding 32px        |
|  border-right:   |                                               |
|  var(--border-   |  [ Endpoint Detail Card ]                     |
|  strong)         |    ...                                        |
|                  |  [ Endpoint Detail Card ]                     |
|  [Group Label]   |                                               |
|  Endpoint Row    |                                               |
|  Endpoint Row    |                                               |
|  [Group Label]   |                                               |
|  Endpoint Row    |                                               |
+------------------+-----------------------------------------------+
```

### Top Nav

- Left: site title in `--text-headline` (Archivo Black, 28px) — no logo image
- Right: `v1.0.0` in overline style + optional search input (Text Input from VoiceBox spec)
- `border-bottom: var(--border-strong)`; background `--color-bg`
- Height: 56px; sticky on scroll

### Sidebar

- Width: 260px, fixed, full viewport height, overflow-y scroll
- `border-right: var(--border-strong)`
- Sections separated by Group Labels (Overline style)
- Each item: Endpoint Row component (Method Badge + path)
- Active row: background `#0A0A0A`, text `#FAFAFA`

### Main Content

- Single scrollable column of Endpoint Detail Cards
- Each card anchored by `id="method-path"` (e.g., `id="get-products"`)
- Clicking sidebar row scrolls to that anchor

---

## 6. Components

All components follow `Design.md` exactly. Implementation notes below.

### 6.1 Method Badge

```html
<span class="method-badge method-badge--get">GET</span>
<span class="method-badge method-badge--post">POST</span>
<span class="method-badge method-badge--patch">PATCH</span>
<span class="method-badge method-badge--delete">DELETE</span>
```

- CSS class drives the border/text color from method token variables
- `DELETE` only: `background-color: var(--method-delete); color: #fff`
- All others: `background: white; color = border color`
- Font: Space Mono 12px, weight 700, uppercase, letter-spacing 0.04em
- Padding: `4px 10px`, border: `2px solid`, radius: `0`

### 6.2 Endpoint Row (Sidebar)

```html
<a class="endpoint-row" href="#get-products">
  <span class="method-badge method-badge--get">GET</span>
  <code class="endpoint-row__path">/api/v1/products</code>
</a>
```

- Padding: `10px 16px`, border-bottom: `var(--border-subtle)`
- Hover: `background: var(--color-surface)`
- Active (JS `.is-active`): `background: var(--color-primary); color: var(--color-tertiary)`

### 6.3 Endpoint Detail Card

```html
<section class="endpoint-card" id="get-products">
  <header class="endpoint-card__header">
    <span class="method-badge method-badge--get">GET</span>
    <code class="endpoint-card__path">/api/v1/products</code>
    <p class="endpoint-card__desc">List all active products with filters and pagination.</p>
  </header>

  <div class="tabs">
    <button class="tab is-active">Request</button>
    <button class="tab">Response</button>
    <button class="tab">Try it</button>
  </div>

  <div class="tab-panel">
    <!-- Param Table + Code Block -->
  </div>
</section>
```

- Border: `var(--border-strong)` on all sides
- Padding: 24px
- `endpoint-card__path`: Space Mono 16px — never wraps mid-segment

### 6.4 Tabs

- Active tab: `border-bottom: 3px solid var(--color-secondary)` (red underline)
- Inactive tab text: `var(--color-text-tertiary)`; active: `var(--color-text-primary)`
- Font: Work Sans 13px, weight 700, uppercase, letter-spacing 0.04em
- No background fill on tabs — underline is the only indicator

### 6.5 Code Block

```html
<div class="code-block">
  <button class="code-block__copy">Copy</button>
  <pre><code>{ "page": 1, "limit": 20 }</code></pre>
</div>
```

- Background: `var(--color-surface)`, border: `var(--border-strong)`, padding: 16px
- Font: Space Mono 14px — monochrome only, no syntax highlight
- Copy button: top-right, Work Sans 12px, shows "Copied!" for 1.5s

### 6.6 Param Table

| Column      | Style                                             |
|-------------|---------------------------------------------------|
| Name        | Space Mono 13px, `var(--color-text-primary)`      |
| Type        | Work Sans 13px, `var(--color-text-secondary)`     |
| Required    | Red asterisk `*` in overline style                |
| Description | Work Sans 13px, `var(--color-text-secondary)`     |

- Row border-bottom: `var(--border-subtle)`
- No striped rows — borders do the separation

### 6.7 Status Chip

```html
<span class="status-chip status-chip--2xx">200 OK</span>
<span class="status-chip status-chip--4xx">401 Unauthorized</span>
<span class="status-chip status-chip--5xx">500 Internal</span>
```

- 2xx: `background #F0FDF4, color #16A34A, border 2px solid #16A34A`
- 4xx: `background #FEFCE8, color #CA8A04, border 2px solid #CA8A04`
- 5xx: `background #FEF2F2, color #EF4444, border 2px solid #EF4444`

### 6.8 Group Label (Sidebar)

```html
<p class="group-label">Authentication</p>
```

- Font: Work Sans 11px, weight 700, uppercase, letter-spacing 0.12em
- Color: `var(--color-text-tertiary)`
- Padding: `16px 16px 8px`

---

## 7. Endpoint Sections to Document

Sections follow the sidebar group structure. Each group = one `<section>` with a Group Label.

| #  | Group                | Endpoints to include                                                                 |
|----|----------------------|--------------------------------------------------------------------------------------|
| 1  | Authentication       | POST /auth/register · POST /auth/login · POST /auth/refresh-token · POST /auth/logout · POST /auth/forgot-password · POST /auth/reset-password |
| 2  | Users                | GET /users/me · PATCH /users/me · POST /users/me/addresses · PATCH /users/me/addresses/:id · DELETE /users/me/addresses/:id |
| 3  | Products             | GET /products · GET /products/:slug                                                  |
| 4  | Categories           | GET /categories · GET /categories/:slug                                              |
| 5  | Cart                 | GET /cart · POST /cart/items · PATCH /cart/items/:productId · DELETE /cart/items/:productId · DELETE /cart |
| 6  | Wishlist             | GET /wishlist · POST /wishlist/:productId · DELETE /wishlist/:productId              |
| 7  | Shipping             | GET /shipping/provinces · GET /shipping/cities · POST /shipping/cost                 |
| 8  | Checkout             | POST /checkout                                                                       |
| 9  | Orders               | GET /orders · GET /orders/:id · PATCH /orders/:id/cancel                             |
| 10 | Payments             | POST /payments/webhook (webhook-only, noted as internal)                             |
| 11 | Reviews              | POST /reviews · GET /products/:slug/reviews                                          |
| 12 | Notifications        | GET /notifications · PATCH /notifications/:id/read · PATCH /notifications/read-all  |
| 13 | Returns              | POST /returns · GET /returns/:id                                                     |
| 14 | Coupons (public)     | POST /coupons/validate                                                               |
| 15 | Admin — Products     | POST /admin/products · PATCH /admin/products/:id · DELETE /admin/products/:id        |
| 16 | Admin — Categories   | POST /admin/categories · PATCH /admin/categories/:id · DELETE /admin/categories/:id  |
| 17 | Admin — Orders       | GET /admin/orders · PATCH /admin/orders/:id/status                                   |
| 18 | Admin — Coupons      | POST /admin/coupons · PATCH /admin/coupons/:id · DELETE /admin/coupons/:id           |
| 19 | Admin — Returns      | GET /admin/returns · PATCH /admin/returns/:id/resolve                                |
| 20 | Admin — Stock        | PATCH /admin/stock/:productId                                                        |

> Admin group labels use the Overline style with an "Admin Only" prefix to make the access boundary obvious at a glance.

---

## 8. JavaScript Behavior

All JS runs without a framework. Only three responsibilities:

### 8.1 Sidebar Active State (Scroll-Spy)

```js
// IntersectionObserver watches each .endpoint-card
// When a card enters viewport, add .is-active to the matching sidebar .endpoint-row
// Remove .is-active from all others
const observer = new IntersectionObserver(onIntersect, { threshold: 0.2 });
document.querySelectorAll('.endpoint-card').forEach(el => observer.observe(el));
```

### 8.2 Tab Switching

```js
// On tab click:
// 1. Remove .is-active from all sibling tabs
// 2. Add .is-active to clicked tab
// 3. Hide all .tab-panel siblings
// 4. Show the corresponding panel (matched by index)
```

### 8.3 Copy to Clipboard

```js
// On .code-block__copy click:
// 1. Read textContent of sibling <code>
// 2. navigator.clipboard.writeText(text)
// 3. Change button label to "Copied!" for 1500ms, then restore
```

No external libraries. No jQuery. No fetch calls. Fully static.

---

## 9. Responsive Behavior

| Breakpoint   | Behavior                                                         |
|--------------|------------------------------------------------------------------|
| >= 1024px    | Full two-column layout: sidebar fixed + scrollable main content  |
| 768–1023px   | Sidebar collapses to hamburger menu, slides in on open           |
| < 768px      | Sidebar hidden by default, triggered by floating menu button     |

- Mobile sidebar: `position: fixed; transform: translateX(-100%);` toggled with JS
- All breakpoints use `border` transitions, never `box-shadow`

---

## 10. Performance and Accessibility

- All fonts loaded via `<link rel="preconnect">` + `<link rel="stylesheet">` from Google Fonts
- No images except the favicon SVG
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<header>`, `<article>` used correctly
- ARIA: sidebar `<nav aria-label="API endpoints">`, tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`
- Focus ring: 2px offset ring in `#0A0A0A` — never removed, only restyled
- Color contrast: all text combinations exceed WCAG AA

---

## 11. Features Tracker

```
# Done
- [x] PRD written
- [x] Design system defined (Design.md)

# In Progress — do not modify without confirmation
- [ ] index.html shell + layout structure
- [ ] style.css — token map + base reset

# Not Started
- [ ] Sidebar with all endpoint groups
- [ ] First endpoint detail card (GET /products)
- [ ] All remaining endpoint cards
- [ ] Tab switching JS
- [ ] Scroll-spy active state JS
- [ ] Copy-to-clipboard JS
- [ ] Responsive / mobile sidebar
- [ ] Favicon
- [ ] Final cross-browser QA
```

---

## 12. Do Not

```
# Structure
- Do not create additional HTML files — everything lives in index.html
- Do not add a JS framework (React, Vue, Alpine) — vanilla only
- Do not add a CSS framework (Tailwind, Bootstrap) — vanilla CSS only
- Do not add a build step without explicit confirmation

# Design Rules (from Design.md)
- Do not use border-radius anywhere
- Do not use box-shadow for any component
- Do not use red (#EF4444) outside: DELETE badges, required-param asterisks, active tab underline
- Do not render an endpoint path in Work Sans — Space Mono only
- Do not add syntax-highlight colors inside code blocks

# Content
- Do not document internal/private endpoints not listed in Section 7
- Do not add dummy or placeholder data — use real ShopSphere request/response shapes from GEMINI.md
```

---

## 13. Verification Checklist

Before calling v1.0.0 done, verify:

- [ ] Opens correctly by double-clicking `index.html` (no local server needed)
- [ ] All 20 endpoint groups are present in the sidebar
- [ ] Sidebar active state follows scroll position correctly
- [ ] Tabs switch without page reload
- [ ] Copy button works and resets after 1.5s
- [ ] DELETE badges are the only filled (solid red) badges on the page
- [ ] No border-radius visible anywhere
- [ ] All endpoint paths are in Space Mono
- [ ] Passes WCAG AA color contrast on primary text
- [ ] Renders correctly on Chrome, Firefox, Safari (latest)
- [ ] Mobile sidebar opens and closes cleanly
