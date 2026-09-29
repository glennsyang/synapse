---
name: Synapse
description: A one-page-a-day planner on grid paper, bound in indigo cloth, each domain written in its own pen.
colors:
  cover-indigo: 'oklch(0.34 0.08 263)'
  cover-indigo-deep: 'oklch(0.28 0.07 263)'
  cover-thread: 'oklch(0.93 0.025 255)'
  cover-thread-muted: 'oklch(0.74 0.05 258)'
  grid-paper: 'oklch(0.978 0.004 170)'
  grid-line: 'oklch(0.88 0.02 235 / 0.5)'
  rule-hairline: 'oklch(0.84 0.014 240)'
  rule-strong: 'oklch(0.3 0.012 250)'
  ink: 'oklch(0.24 0.014 255)'
  ink-muted: 'oklch(0.47 0.016 250)'
  sheet-card: 'oklch(0.99 0.003 170)'
  wash-muted: 'oklch(0.95 0.007 220)'
  input-stroke: 'oklch(0.8 0.014 240)'
  focus-ring: 'oklch(0.45 0.13 263)'
  destructive-red: 'oklch(0.55 0.2 27)'
  pen-brand-aizome: 'oklch(0.42 0.11 263)'
  pen-journal-ink-blue: 'oklch(0.48 0.17 258)'
  pen-fitness-green: 'oklch(0.52 0.13 155)'
  pen-tasks-vermilion: 'oklch(0.6 0.19 38)'
  pen-mind-violet: 'oklch(0.5 0.16 300)'
  pen-people-magenta: 'oklch(0.56 0.19 350)'
  pen-warn-amber: 'oklch(0.66 0.15 70)'
typography:
  display:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '7.5rem'
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: '-0.04em'
    fontFeature: 'tnum'
  headline:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '2.25rem'
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  title:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 900
    lineHeight: 1.4
    letterSpacing: '-0.025em'
  reading:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '3rem'
    fontWeight: 900
    lineHeight: 1
    fontFeature: 'tnum'
  body:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  prose:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.33
  running-head:
    fontFamily: 'Zen Kaku Gothic New, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 900
    letterSpacing: '0.16em'
rounded:
  hairline: '1px'
  sm: '2px'
  md: '3px'
spacing:
  grid: '14px'
  row: '44px'
  gutter: '40px'
  section: '48px'
  sheet-x-mobile: '16px'
  sheet-x-desktop: '32px'
  binding: '10px'
components:
  button-ink:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.grid-paper}'
    rounded: '{rounded.md}'
    typography: '{typography.label}'
    height: '36px'
    padding: '0 14px'
  button-pen:
    backgroundColor: '{colors.pen-tasks-vermilion}'
    textColor: '{colors.grid-paper}'
    rounded: '{rounded.md}'
    height: '36px'
    padding: '0 14px'
  button-outline:
    backgroundColor: '{colors.sheet-card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '36px'
    padding: '0 14px'
  button-ghost-hover:
    backgroundColor: '{colors.wash-muted}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
  washi-tag:
    textColor: '{colors.ink}'
    rounded: '{rounded.hairline}'
    padding: '1px 8px'
    typography: '{typography.label}'
  index-tab-active:
    backgroundColor: '{colors.grid-paper}'
    textColor: '{colors.pen-journal-ink-blue}'
    rounded: '{rounded.md}'
    height: '44px'
  pen-check:
    rounded: '{rounded.sm}'
    size: '28px'
  sheet-card:
    backgroundColor: '{colors.sheet-card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '16px'
  input:
    backgroundColor: '{colors.sheet-card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '32px'
    padding: '4px 10px'
---

# Design System: Synapse

## Overview

**Creative North Star: "The Daybook"**

Synapse is a one-page-a-day planner. Every screen is a single sheet of cool grid paper bound into an indigo cloth cover; each life domain writes in its own pen colour and owns an index tab that comes off the sheet's edge. The dashboard is today's page: a huge day numeral, a Monday-first week strip, an agenda to tick, and a margin of readings in pen.

Density is a working planner's, not a dashboard's. Content sits directly on the grid, organised by ruled headings and hairline rows instead of boxed cards; numbers are written large in the domain's pen and labelled plainly beside them. One stationery gothic face carries everything, with weight (900 against 400) doing the hierarchy. The paper is flat; only things that float above the page (menus, popovers, dialogs) cast a shadow. Motion is ink being drawn: strokes appear, paper never bounces.

The build rejects the category default it was written against: the shadcn card grid, the dark sidebar, the gradient greeting, the rounded stat tile.

**Key Characteristics:**

- Grid paper ground (14px 1px grid) on every sheet, framed by indigo cloth.
- One pen per domain, applied as numerals, marks, index tabs, ticks and low-strength washi tints.
- Ruled section headings (text on a strong hairline) instead of card containers.
- Near-square geometry: 1-3px corners everywhere.
- Zen Kaku Gothic New throughout; huge heavy tabular numerals.
- Flat paper; shadows only on floating layers.
- Ink-drawing motion: 160-220ms ease-out, stroke-dashoffset for ticks.

## Colors

A cool, quiet paper-and-ink neutral set inside an indigo cover, with six saturated pens that each belong to exactly one domain. All values are OKLCH in `src/app.css`; the light values above are normative, and dark mode swaps the same roles (slate board paper, chalk-grey grid, lifted pens) as recorded in the sidecar.

### Primary

- **Aizome Cover Indigo** (cover-indigo): the cloth binding. Body background behind the sheet, the desktop frame around it, the mobile bottom tab strip, the splash and auth screens. Its deeper step (cover-indigo-deep) is the hover on cover-borne controls; cover-thread and cover-thread-muted are the text written on the cloth.
- **Aizome Pen** (pen-brand-aizome): the dashboard's own pen. Today's weekday, the ringed date in the week strip, text selection (22% tint) and the input caret.

### Secondary (the domain pens)

- **Ink Blue** (pen-journal-ink-blue): journal. Margin dates, location washi, blockquote rule.
- **Vermilion** (pen-tasks-vermilion): tasks and the daily agenda. Agenda ticks, progress bar, strike-through decoration, task actions.
- **Leaf Green** (pen-fitness-green): fitness, and positive deltas / "goal met" wherever they appear.
- **Violet** (pen-mind-violet): meditation, and scheduled follow-ups in visits.
- **Magenta** (pen-people-magenta): visits and people.
- **Amber** (pen-warn-amber): warnings and "overdue" states only; not a domain.

### Neutral

- **Cool Grid Paper** (grid-paper): the sheet itself; never cream.
- **Grid Line** (grid-line): the 1px blue-grey grid drawn at 14px on the paper.
- **Sheet White** (sheet-card): the rare contained surface (cards, forms, dialogs) laid on the grid.
- **Ink** (ink): body text, headings, the filled primary button.
- **Faded Ink** (ink-muted): secondary text, meta lines, inactive week days.
- **Rule Hairline** (rule-hairline): row dividers, card rings, default borders.
- **Strong Rule** (rule-strong): the line under a ruled heading; the planner's section line.
- **Muted Wash** (wash-muted): hover wash on rows and ghost buttons.
- **Destructive Red** (destructive-red): negative deltas, critical states, delete.

### Named Rules

**The One Pen Per Domain Rule.** Each domain writes in exactly one pen, set once as `--pen` on its container and read by every mark inside it. A pen never appears on another domain's content except as a semantic state (green = positive/met, amber = warning).

**The Pen At Strength Or As Washi Rule.** A pen is either full strength on small, meaningful marks (numerals, squares, ticks, tab faces, link text) or a 8-15% tint behind a washi strip. It is never a large solid field on the paper.

**The Cloth Frames, Paper Holds Rule.** Indigo cloth is only the binding around the sheet. Content never sits on the cover except on the closed-planner screens (splash, auth), where one sheet is laid on it.

## Typography

**Display Font:** Zen Kaku Gothic New (with ui-sans-serif, system-ui)
**Body Font:** Zen Kaku Gothic New (same family)

**Character:** A single Japanese stationery gothic at four weights (400, 500, 700, 900). Heaviness is the voice: black-weight numerals and headings over a plain, calm reading weight, like a Hobonichi page printed in one face. `--font-display` is an alias of the same family.

### Hierarchy

- **Display** (900, 7.5rem desktop / 5.5rem mobile, line-height 0.8, -0.04em, tabular): the day numeral on today's page. Journal margin dates use the same treatment at 3-3.75rem.
- **Headline** (900, 2.25rem desktop / 1.875rem mobile, 1.15, -0.02em): page titles, always led by a 12px square of the section's pen (the page-title utility).
- **Title** (900, 1.125-1.5rem, tight tracking): ruled section headings; 1.5rem for the two primary dashboard columns, 1.125rem for the rest, led by a 10px pen square.
- **Reading** (900, 2.25-3rem, line-height 1, tabular): pen-coloured counts in the margin of readings and fitness readings, labelled by a bold 1rem line beside or under.
- **Body** (400, 0.875rem, list rows at 0.95rem): lists, registers, meta.
- **Prose** (400, 15px, line-height 28px, max 68ch): journal entries.
- **Label** (700, 0.75rem): washi strips, inline links with an arrow, week-strip letters, meta. Column heads of a register and minor list headings (for example "Due soon") may be uppercase with 0.12-0.14em tracking.
- **Running head** (900, 0.75rem, 0.16em, uppercase): the Synapse wordmark in the running head; 0.3em on the cover screens.

### Named Rules

**The One Face Rule.** Zen Kaku Gothic New is the only family. Hierarchy comes from weight and size, never from a second display face.

**The Numeral Leads Rule.** When a figure matters, it is written large, black-weight and tabular in its pen, with its label in plain type beside it; the label never outranks the number. All `time` elements and numeric columns are tabular.

## Layout

The app shell is a flex row: on desktop a 6.5rem cover rail holds the index tabs (sticky, starting 4rem down), and the sheet fills the rest with a 10px band of cover showing on top, right and bottom (3px corners). The sheet opens with a 44px running head (wordmark, breadcrumb trail on detail pages, today's date, theme toggle, account), then the main area at 32px/28px padding (16px/20px on mobile). Pages centre within max-width 80rem.

Pages stack sections at 48px; two-column bands use a 40px gutter. The dashboard splits roughly 57/43 (1.35fr / 1fr) into agenda and the margin of readings, the margin separated by a hairline left rule rather than a box. Rows are at least 44px tall (40px for secondary lists) and divided by hairlines; empty states are dashed hairline bands. Registers (visits, meditation routines) are ruled tables: a 2px ink top or bottom line, then one hairline per entry, collapsing to two-line rows on mobile.

On mobile the rail disappears and the index tabs become a fixed six-column bottom strip on the cover (admin moves to the account menu); the sheet runs edge to edge with an 80px bottom pad to clear it.

### Named Rules

**The Ruled Line Rule.** Sections are divided by a heading set on a strong hairline, and entries by rule-hairline rows. Reach for a contained card only when the content is a form, a dialog, or a genuinely separate object.

## Elevation & Depth

Paper is flat. The shadow scale is rewritten so `shadow-2xs/xs/sm` resolve to none; nothing on the sheet casts a shadow, and depth on the page comes from the paper sitting inside the cover and from hairline rings. Only floating layers (menus, popovers, tooltips, dialogs, toasts) lift, using diffuse, negatively spread indigo-tinted shadows.

### Shadow Vocabulary

- **Float low** (`box-shadow: 0 6px 18px -10px oklch(0.2 0.03 260 / 0.35)`): menus, popovers, tooltips.
- **Float mid** (`box-shadow: 0 14px 34px -14px oklch(0.2 0.03 260 / 0.4)`): sheets and larger panels.
- **Float high** (`box-shadow: 0 22px 48px -18px oklch(0.2 0.03 260 / 0.45)`): modal dialogs.

### Named Rules

**The Paper Lies Flat Rule.** Nothing written on the sheet has a drop shadow. If it needs separation, give it a hairline.

## Shapes

Near-square stationery geometry. The radius token is 3px and the whole Tailwind radius scale is clamped around it (sm 2px, md/lg 3px, xl 4px, 3xl 5px), so even library defaults stay sheet-like. Washi strips and badges use 1px; pen checks, pen squares and tab triggers use 2px; sheets, cards, buttons, inputs and index tabs use 3px. Index tabs round only on the side away from the sheet (left on the desktop rail, bottom on mobile) so they read as cut from it.

Circles are reserved for three things: the "S" monogram seal, the ring around today in the week strip, and small status dots. Everything else is a rectangle.

## Components

### Buttons

Ink-filled or pen-outlined rectangles, bold and slightly tracked.

- **Shape:** gently squared (3px), 36px tall, 14px horizontal padding; 700 weight, wide tracking.
- **Ink (primary):** ink fill, paper text. The default action on any page.
- **Pen:** the section's pen as fill (for example "New Task" in vermilion, "Add Person" in magenta) for the page's single creation action.
- **Outline:** sheet-white fill with a 35% ink stroke; stroke darkens to 60% and fill washes on hover. On the cover it becomes a thread-coloured outline on transparent.
- **Ghost:** no fill; muted wash on hover. Used for icon actions in rows.
- **Press / Focus:** 1px downward nudge on active; 3px ring in the focus colour.

### Washi tags

Flat strips of tape: pen at 10-15% behind ink or pen text, 1px corners, 12px/500-700, 1px by 8px padding. Used for deltas ("+12% vs last week"), locations, weather, priorities. No border, no pill.

### Cards / Containers

- **Corner Style:** 3px.
- **Background:** sheet-white.
- **Shadow Strategy:** none (see Elevation).
- **Border:** a 1px rule-hairline ring; a content section may add a 2px top edge in its pen.
- **Internal Padding:** 16px, 24px on desktop for content sections.
- **Headings inside:** ruled title, 900 weight.

### Inputs / Fields

- **Style:** 1px input-stroke border, transparent fill, 3px corners, 32px tall; aizome caret.
- **Focus:** border shifts to the focus colour plus a 3px ring at 50%.
- **Error / Disabled:** destructive border and ring; disabled at 50% opacity.

### Navigation

- **Index tabs (desktop):** tabs sized to their label (icon + short name, 0.72rem/700) hanging off the sheet edge from the cover rail. Inactive tabs are the pen mixed 88% with cover indigo, white text; hover goes full pen and grows 6px. The active tab is paper-coloured with pen text and fuses into the sheet by overlapping it 1px.
- **Mobile tabs:** a six-column strip on the cover at the bottom; each tab has a 3px pen top edge, thread text. The active tab hangs from the sheet in paper with pen text.
- **Running head:** 44px bar with a hairline bottom, faded 12px text, the wordmark with its circled "S" seal, a pen-coloured section crumb on detail pages, the date, and the account controls.
- **In-page tabs:** a secondary-wash track with a hairline ring; the active trigger is sheet-white with a hairline border.

### Pen Check (signature component)

A ruled square ticked by a drawn stroke. A 17px, 2px-cornered square with a 1.5px ink border at 55% sits in a 28px hit area over a native checkbox. On check, the border takes the row's pen and an SVG tick draws itself via stroke-dashoffset (220ms, cubic-bezier(0.16, 1, 0.3, 1), 60ms delay), stroke 2.6, round caps. The ticked row's label fades to muted and is struck through in the pen at 70%. Ticks are optimistic: the stroke draws the moment the box is clicked. Reduced motion removes the transition.

### Day Header

Today's page opens with the display numeral, the weekday in aizome over month and greeting, a Monday-first week strip with today ringed at 1.5px, and any amber warning strip, all set on a strong rule.

## Do's and Don'ts

### Do:

- **Do** put every app screen on the grid-paper sheet inside the indigo cover, with the running head at the top.
- **Do** declare a section's pen once as `--pen: oklch(var(--color-<pen>))` and let marks, ticks, squares and links read it.
- **Do** lead page titles with the 12px pen square and section headings with the 10px square, set on a strong rule.
- **Do** write key figures as black-weight tabular numerals in the domain pen, labelled in plain type.
- **Do** separate entries with hairline rows (min 44px) and use dashed hairline bands for empty states.
- **Do** keep corners at 1-3px, and use circles only for the monogram, today's ring and status dots.
- **Do** animate as ink: 150-220ms ease-out on colour and stroke, stroke-dashoffset for ticks, fades of 160ms.

### Don't:

- **Don't** put drop shadows on anything written on the sheet; shadows belong only to floating layers.
- **Don't** wrap dashboard readings or list sections in rounded stat tiles or card grids; rule them instead.
- **Don't** use a pen for another domain's content, or fill a large area of paper with a solid pen.
- **Don't** add a second typeface for headings or text, or a gradient greeting.
- **Don't** make pill-shaped buttons, tags or containers.
- **Don't** set a small tracked uppercase label or ID above a heading as a kicker; small uppercase is for register column heads, minor list headings and the wordmark.
- **Don't** let paper bounce: no spring, overshoot or scale-up motion on sheet content.
