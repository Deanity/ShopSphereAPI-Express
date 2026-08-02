# VoiceBox Dev Docs Edition

Bold, opinionated, terminal-brutalist. Adapted from VoiceBox (editorial) for API reference documentation.

## Overview

This is VoiceBox's DNA stark black-and-white, one aggressive red accent, zero border-radius, borders doing all the structural work retargeted from magazine article layouts to API endpoint references. The oversized-headline energy becomes oversized endpoint paths; the "red as scalpel" rule becomes "red is reserved for destructive operations." Density shifts from long-form prose to scannable technical rows: method badges, monospace paths, parameter tables, and request/response code blocks. Every rule below either **carries over unchanged** from VoiceBox or is **new**, added because docs need structure editorial content didn't.

## Colors

### Brand Palette *(unchanged)*

| Token     | Hex       | Role                                       |
|-----------|-----------|----------------------------------------------|
| Primary   | `#0A0A0A` | Black headings, primary UI, dominant tone   |
| Secondary | `#EF4444` | Red reserved for destructive actions only   |
| Tertiary  | `#FAFAFA` | White backgrounds, inverse text             |

### Surface Palette *(unchanged)*

| Token          | Hex       | Role                                |
|----------------|-----------|---------------------------------------|
| Background     | `#FAFAFA` | Page background                        |
| Surface        | `#F5F5F5` | Sidebar, code block background         |
| Surface Raised | `#E5E5E5` | Hover states, active row highlight     |

### Content Palette *(unchanged)*

| Token          | Hex       | Role                                |
|----------------|-----------|-----------------------------------------|
| Text Primary   | `#0A0A0A` | Headings, endpoint paths, body          |
| Text Secondary | `#525252` | Descriptions, param types                |
| Text Tertiary  | `#A3A3A3` | Placeholders, disabled, optional-param hint |

### Border Palette *(unchanged)*

| Token         | Hex       |
|---------------|-----------|
| Border Subtle | `#E5E5E5` |
| Border Medium | `#D4D4D4` |
| Border Strong | `#0A0A0A` |

### Method Colors *(new reuses existing semantic tokens, mapped to HTTP verbs)*

Rather than invent a new palette, HTTP methods borrow VoiceBox's existing semantic meaning so the "one accent color = one meaning" rule holds for code, not just prose:

| Method | Token       | Hex       | Rationale                                  |
|--------|-------------|-----------|----------------------------------------------|
| GET    | Primary     | `#0A0A0A` | Reads data neutral, the default tone       |
| POST   | Success     | `#16A34A` | Creates something new                        |
| PATCH  | Warning     | `#CA8A04` | Modifies existing state                      |
| PUT    | Warning     | `#CA8A04` | Same class of mutation as PATCH              |
| DELETE | Secondary   | `#EF4444` | Destructive this is *exactly* what VoiceBox reserves red for |

This is the one deliberate reinterpretation of a VoiceBox rule: "red used once per viewport" becomes "red used only on DELETE," which is the same restraint principle applied to a docs page instead of an article page.

### Semantic Colors *(unchanged)*

| Token   | Hex       |
|---------|-----------|
| Success | `#16A34A` |
| Warning | `#CA8A04` |
| Error   | `#EF4444` |
| Info    | `#0A0A0A` |

## Typography

### Font Stack *(unchanged already docs-ready)*

| Role             | Font                                                        |
|------------------|-------------------------------------------------------------|
| Display/Headings | Archivo Black, Impact, 'Arial Black', sans-serif            |
| UI/Body          | Work Sans, -apple-system, 'Segoe UI', Helvetica, sans-serif |
| Mono/Code        | Space Mono, 'Courier New', Consolas, monospace              |

VoiceBox already ships a mono role for "inline code, embeds" that's the whole reason this system ports to docs so cleanly. Endpoint paths, parameter names, and code blocks all use it.

### Type Scale

| Level          | Font          | Size   | Weight | Line Height | Letter Spacing | Usage                              |
|----------------|---------------|--------|--------|-------------|----------------|-------------------------------------|
| Display        | Archivo Black | 40px   | 400    | 1.05        | -0.03em        | Page title ("ShopSphere API Reference") *(scaled down from 56px a docs page has a nav bar competing for space, an article hero doesn't)* |
| Headline       | Archivo Black | 28px   | 400    | 1.1         | -0.02em        | Section group titles ("Catalog & Categories") |
| Subhead        | Archivo Black | 18px   | 400    | 1.2         | -0.01em        | Endpoint summary title                |
| Body Large     | Work Sans     | 18px   | 400    | 1.6         | 0              | Endpoint description lede             |
| Body           | Work Sans     | 16px   | 400    | 1.7         | 0              | Default prose, param descriptions     |
| Body Small     | Work Sans     | 14px   | 400    | 1.6         | 0              | Sidebar nav links, table rows         |
| Caption        | Work Sans     | 12px   | 500    | 1.5         | 0.01em         | Response status notes, field hints    |
| Overline       | Work Sans     | 11px   | 700    | 1.4         | 0.12em         | "Phase 1" / "Admin only" group labels |
| Endpoint Path  | Space Mono    | 16px   | 400    | 1.4         | 0              | `*(new)*` `/api/v1/products/:slug` always mono, never wraps mid-segment |
| Code           | Space Mono    | 14px   | 400    | 1.6         | 0              | Request/response bodies, curl samples |

## Spacing & Radius *(unchanged)*

Base unit 8px, scale 4/8/16/24/32/48/64/96. All corners `0px` except the full-round avatar token (unused in docs no author avatars here). Sharp edges remain mandatory; a param table with rounded cells would break the system's own logic.

## Shadows *(unchanged)*

Still fully flat. Hierarchy comes from borders and weight, never elevation. Focus ring and the red underline convention both carry over as-is.

## Components

### Method Badge *(new)*

- Font: Space Mono, 12px, weight 700, uppercase
- Padding: 4px 10px
- Border: `2px solid` color per Method Colors table above
- Background: white; text = same color as border
- Radius: 0px
- Exception: DELETE badge fills solid `#EF4444` with white text the one filled badge on the page, matching "red is a scalpel"

### Endpoint Row *(new the sidebar/list unit)*

- Layout: Method Badge + monospace path, single line
- Padding: 10px 16px
- Border-bottom: `1px solid #E5E5E5`
- Hover: background `#F5F5F5`
- Active/current: background `#0A0A0A`, path text `#FAFAFA`, badge keeps its own color for contrast

### Endpoint Detail Card *(new the expanded reference block)*

- Border: `2px solid #0A0A0A` (reuses the Elevated Card's top-accent idea, but the accent bar is the Method Badge itself, not a red stripe red stays reserved for DELETE)
- Padding: 24px
- Header row: Method Badge + path (Endpoint Path style) + one-line description below in Body Small, `#525252`

### Tabs Request / Response / Try it *(new)*

- Reuses VoiceBox's "Red Underline" special token exactly as documented: active tab gets `3px solid #EF4444` bottom border
- Inactive tab text: `#A3A3A3`; active tab text: `#0A0A0A`
- Font: Work Sans, 13px, weight 700, uppercase, letter-spacing 0.04em

### Code Block *(new)*

- Background: `#F5F5F5` (Surface token, reused)
- Border: `2px solid #0A0A0A`
- Padding: 16px
- Font: Space Mono, 14px
- No syntax-highlight color confetti keep it monochrome; if a status code needs emphasis inside a response block, wrap only that token in a Status Chip (below), not inline color

### Param Table *(new)*

- Row border-bottom: `1px solid #E5E5E5` (List Item convention, reused)
- Param name cell: Space Mono, 13px, `#0A0A0A`
- Type cell: Work Sans, 13px, `#525252`
- Required marker: overline-style red asterisk the only other place red appears besides DELETE, since a missing required param is itself a "destructive" mistake

### Status Chip *(carried over from VoiceBox's Status Chip, unchanged)*

- 2xx: `background #F0FDF4, text #16A34A, border 2px solid #16A34A`
- 4xx: `background #FEFCE8, text #CA8A04, border 2px solid #CA8A04`
- 5xx: `background #FEF2F2, text #EF4444, border 2px solid #EF4444`

### Sidebar Nav *(new)*

- Width: 260px, `border-right: 2px solid #0A0A0A`
- Group label: Overline style, padding 16px 16px 8px
- Contains stacked Endpoint Rows

### Buttons, Inputs, Chips, Lists, Checkboxes, Radios, Tooltips

All unchanged from the original VoiceBox spec a "Try it" panel's submit button is just the Primary button; a search box over the endpoint list is just the Text Input.

## Do's and Don'ts

1. **Do** keep every endpoint path in Space Mono never let Work Sans render a route.
2. **Don't** color-code methods with an arbitrary rainbow the five method colors above are the only ones; don't add a sixth for a custom verb.
3. **Do** treat DELETE's solid-red badge as the one filled, attention-grabbing element per screen same restraint rule as VoiceBox's original red-underline guidance.
4. **Don't** use red anywhere except DELETE badges and required-param asterisks.
5. **Do** use the Overline style for group labels ("Admin-Only Endpoints") it's doing the same job as VoiceBox's article rubrics.
6. **Don't** add syntax-highlighting colors inside code blocks; monochrome mono type keeps the brutalist flatness intact.
7. **Do** keep sidebar and detail-card borders at `2px solid #0A0A0A` minimum thin 1px is reserved for list-row dividers only.
8. **Don't** round any corner, anywhere, for any reason.