---
version: 1
slug: 'src-routes-app-layout-svelte'
primary_target: 'src/routes/(app)/+layout.svelte'
related_targets: ['src/routes/(splash)/+page.svelte', 'src/routes/(auth)/sign-in/+page.svelte']
---

# Surface brief: Synapse app (all routes)

Scope: whole-app redesign — splash, auth, app shell, dashboard, tasks, journal, fitness, meditation, visits, profile, admin. Mode: Operate (splash is a thin sign-in doorway, not a marketing page).
Audience/job: owner + a few invited people; quick phone check-ins and desktop planning/review sessions.
Must keep: light + dark mode toggle; every existing function, route, form and copy fact.
Must avoid: corporate/SaaS dashboard feel; sparse, precious, low-density layouts.
Build path: code-led (no image generation available).

## Direction contract

THESIS: Synapse is a one-page-a-day planner. Every screen is a sheet of grid paper, each domain writes in its own pen colour and owns an index tab, and the dashboard is today's page. It refuses the category default: shadcn card grid, dark sidebar, gradient greeting, rounded stat tiles.

OWN-WORLD: Light: cool grid paper (not cream), 1px grid at ~14px in a faint blue-grey, ink near-black; dark: slate board with chalk-grey grid. The sheet is bound in an indigo cloth cover (user-approved 2026-09-29): on desktop the cover shows only as a frame with index tabs, sized to their labels, coming off the sheet edge; brand, theme and account live in the running head. Pen colours per domain: journal ink-blue, tasks vermilion, fitness green, meditation violet, visits magenta; dashboard/brand writes in plain ink. Type: Zen Kaku Gothic New throughout (Japanese stationery gothic), huge heavy date numerals. Sheets have hairline edges, 2px corners, no drop shadows; tags are flat washi strips; checkboxes are ruled squares ticked by a drawn stroke; buttons are ink-filled or pen-outlined rectangles.

STORY: The owner opens Synapse and sees today's page: the date, the agenda to tick, the week's readings in the margin, people due for a visit. They tick, log, then flip a tab to go deeper into one domain.

FIRST VIEWPORT: Desktop dashboard: left index-tab rail (~76px) with each domain's coloured tab, active tab fused to the sheet. Sheet header: day numeral at ~120px, weekday/month stacked beside it, greeting under, week strip Mon–Sun with today ringed at right. Body on the grid: left ~60% Today agenda checklist with count "3/7"; right ~40% margin of Readings (workouts, meditation vs goal, tasks due, people to see) each in its pen colour. Charts and activity follow below as further ruled sections. Mobile: compact date header, agenda first, index tabs become a bottom tab strip.

FORM: Daybook (Hobonichi-style one-page-a-day planner), rank 1 on my ordered list (chosen as Impeccable's pick), seed key d4bcde02. Signature interaction: agenda ticks draw their check stroke in pen colour; motion grammar is ink drawing (stroke-dashoffset, 160–220ms ease-out), paper never bounces.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
