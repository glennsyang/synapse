# UI Redesign Plan: Bold & Vibrant Synapse

**Version**: 1.0  
**Date**: February 9, 2026  
**Status**: Ready for Implementation

## Overview

Transform Synapse from a generic card-heavy interface into a colorful, personality-driven second-brain app with distinctive typography. This redesign embraces vibrant colors throughout, reduces card dependency, adds visual hierarchy with expressive fonts, enhances data visualization, and fully leverages shadcn-svelte's component library.

### Design Direction

- **Style**: Bold & Vibrant - Colorful, energetic, personality-driven
- **Scope**: Moderate changes - Clear improvements, recognizable evolution
- **Typography**: Custom fonts (Lexend + Inter) for distinctive personality
- **Components**: Exclusively shadcn-svelte UI elements

### Key Design Principles

1. **Distinctive Typography**: Lexend (display/headings) + Inter (body) for hierarchy and personality
2. **Color as Identity**: Vibrant palette derived from nav icons throughout the design system
3. **Hierarchy over Uniformity**: Mix of cards, sections, backgrounds for visual interest
4. **Data-Rich**: Surface insights, progress, and trends prominently
5. **Smooth Interactions**: Skeletons, micro-animations, enhanced shadcn components

---

## Implementation Steps

### 1. Typography System

**Files**: `src/app.css`, `tailwind.config.js`, `src/app.html`

#### Font Selection

- **Display Font**: [Lexend](https://fonts.google.com/specimen/Lexend) - Modern, geometric, high-impact for headings
- **Body Font**: [Inter](https://rsms.me/inter/) - Clean, readable, professional for body text

#### Configuration Changes

**tailwind.config.js**:

```js
fontFamily: {
  display: ['Lexend', 'system-ui', 'sans-serif'],
  sans: ['Inter', 'system-ui', 'sans-serif']
}
```

**app.html**: Add Google Fonts preconnect and stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
	href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;600;700;800&display=swap"
	rel="stylesheet"
/>
```

#### Type Scale Expansion

- Add larger sizes: `text-4xl`, `text-5xl` for hero text
- Add smaller size: `text-xs` for captions and metadata
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- Line heights: `leading-tight` for display text, `leading-relaxed` for body

#### Usage Guidelines

- **Display font (Lexend)**: All headings (h1-h6), page titles, stat numbers, branding, CTAs
- **Body font (Inter)**: Body text, descriptions, labels, form inputs, navigation items

---

### 2. Color System Redesign

**Files**: `src/app.css`, `tailwind.config.js`

#### Semantic Color Tokens

Map existing nav icon colors to semantic design tokens:

| Section    | Color  | Usage                               |
| ---------- | ------ | ----------------------------------- |
| Dashboard  | Teal   | Primary accent, main CTAs           |
| Journal    | Blue   | Secondary accent, journal features  |
| Fitness    | Green  | Success states, health metrics      |
| Meditation | Purple | Info states, mindfulness features   |
| Todos      | Orange | Warning states, priority indicators |
| Visits     | Pink   | Accent state, location features     |

#### New CSS Custom Properties

**app.css additions**:

```css
--primary: teal-600;
--secondary: blue-600;
--success: green-600;
--warning: orange-600;
--info: purple-600;
--accent: pink-600;
```

#### Gradient Utilities

Add Tailwind gradient classes:

- `bg-gradient-to-br from-teal-500 to-blue-600`
- `bg-gradient-to-r from-purple-500 to-pink-500`

#### Alpha Utilities

For subtle backgrounds:

- `bg-teal-500/10` - 10% opacity tint
- `bg-blue-500/5` - 5% opacity wash

#### Dark Mode Adjustments

- Lighten background from heavy blue-gray to neutral charcoal
- Reduce saturation slightly in dark mode for eye comfort
- Maintain WCAG AA contrast standards

---

### 3. Install Additional shadcn-svelte Components

**Commands to run**:

```bash
npx shadcn-svelte@latest add breadcrumb
npx shadcn-svelte@latest add carousel
npx shadcn-svelte@latest add accordion
npx shadcn-svelte@latest add alert-dialog
npx shadcn-svelte@latest add collapsible
npx shadcn-svelte@latest add scroll-area
npx shadcn-svelte@latest add drawer
```

**New component locations**: `/src/lib/components/ui/{component-name}/`

---

### 4. Navigation & Layout Transformation

#### AppSidebar Component

**File**: `src/lib/components/app/AppSidebar.svelte`

**Changes**:

- Apply display font to "Synapse" branding: `font-display font-extrabold`
- Gradient background:
  - Light: `bg-gradient-to-b from-teal-50 via-white to-blue-50`
  - Dark: `bg-gradient-to-b from-teal-950/20 to-blue-950/20`
- Remove `grayscale` filter from avatar - show user photos in color
- Active navigation state:
  - 4px colored left border matching section
  - Background tint: `bg-{section-color}-500/10`
- Icon backgrounds: Subtle colored circles (32x32px) on hover

#### NavMain Component

**File**: `src/lib/components/app/NavMain.svelte`

**Changes**:

- Apply section colors as hover/active backgrounds with smooth transitions
- Typography: Use `font-medium` for nav items (upgrade from regular)
- Icon animation: Scale transform on hover (`hover:scale-110 transition-transform`)
- Active state indicator using route matching + colored accent

#### SiteHeader Component

**File**: `src/lib/components/app/SiteHeader.svelte`

**Changes**:

- Page title: Display font at larger size (`font-display text-2xl font-bold`)
- Add Breadcrumb component for detail pages:
  - Example: Journal > Entry Title
  - Example: Fitness > Workouts > Workout Name
- Colored accent bar (3px height) under header matching active section
- Sync indicator: Pulse animation with section color
- Add Button Group for view toggles where applicable (List/Grid/Kanban)

---

### 5. Dashboard Overhaul

**File**: `src/routes/(app)/dashboard/+page.svelte`

#### Hero Section

- Large welcome message: `font-display text-4xl md:text-5xl font-bold`
- Text: "Welcome back, {user.name}"
- Optional: Gradient text effect on "Synapse" keyword
- At-a-glance stats without heavy cards (clean, minimal design)

#### Quick Stats Row

- Use Progress component with vibrant section colors
- Metrics:
  - Todo completion percentage (orange/warning color)
  - Journal entry streak (blue/secondary color)
  - Meditation minutes this week (purple/info color)
- Create `StatCard.svelte` component with:
  - Icon background (colored circle)
  - Large number (display font)
  - Trend indicator (↑↓)
  - Label text

#### Feature Navigation

**Option A - Carousel**:

- Use Carousel component showcasing each feature
- Swipeable on mobile
- Gradient hover states

**Option B - Enhanced Grid**:

- 2x3 grid (responsive)
- Cards with colored icon backgrounds
- Gradient on hover matching section color
- Use Aspect Ratio component for consistent proportions

#### Data Visualization

- **Activity Chart**: Chart component showing weekly/monthly trends
  - Journal entries per day
  - Todos completed
  - Meditation sessions
- **Calendar Heatmap**: Calendar component displaying activity across all features
  - Color intensity based on activity level
  - Clickable to navigate to that day's data

#### Recent Activity Section

- Scroll Area component for recent items from each section
- Accordion for collapsible section views
- Color-coded items by section

---

### 6. Layout Patterns & Visual Hierarchy

#### New Reusable Components

Create in `/src/lib/components/app/`:

**SectionHeader.svelte**:

```svelte
- Display font for heading - Colored accent bar (4px, section color) - Actions row (buttons aligned
right) - Breadcrumb integration for detail pages
```

**ContentSection.svelte**:

```svelte
- Subtle background tint instead of card - Flexible padding and spacing - Optional colored left
border - No heavy shadows
```

**StatCard.svelte**:

```svelte
- Lightweight card or borderless - Icon with colored background circle - Large number (display font,
text-3xl) - Trend indicator (+12% ↑) - Label (muted text)
```

**FeatureCard.svelte**:

```svelte
- Bordered card (subtle) - Gradient hover effect (section color) - Large colored icon background -
Display font for title - Description with muted color - CTA button
```

#### Page Updates

##### Journal Page

**File**: `src/routes/(app)/journal/+page.svelte`

- Move filters to Collapsible component (or Drawer on mobile)
- Entry cards with colored left accent (4px teal border)
- Add Calendar component for date-based entry view toggle
- Reduce card shadow prominence
- Typography: Display font for entry titles

##### Todos Page

**File**: `src/routes/(app)/todos/+page.svelte`

- Priority colors more prominent via Badge component
- Use Accordion for category grouping in list view
- Reduce card boxing in grid view - use subtle backgrounds
- Colored dots for priority (larger, more visible)
- Kanban: Column headers with colored underlines

##### Fitness Page

**File**: `src/routes/(app)/fitness/+page.svelte`

- Tab headers: Display font with colored underlines
- Multiple Chart components:
  - Weight trend over time
  - Calorie tracking progress
  - Workout frequency
- Use Collapsible for form sections to reduce clutter
- Stat cards for quick metrics (calories today, workouts this week)

##### Meditation Page

**File**: `src/routes/(app)/meditation/+page.svelte`

- Routine cards with mood-colored gradient backgrounds
- Carousel component for routine selection (swipeable)
- Add Chart for mood distribution pie/donut chart
- Calendar component for streak tracking
- Softer, calmer color treatments (purple/lavender tints)

##### Visits Page

**File**: `src/routes/(app)/visits/+page.svelte`

- Status colors from design system (replace inline CSS)
- Breadcrumb for location hierarchy (Country > City > Place)
- Timeline view option using Scroll Area
- Visit cards with colored status indicators

---

### 7. Data Visualization Enhancement

#### Chart Expansion

**Fitness**:

- Weight trend (line chart)
- Calorie tracking (bar chart)
- Workout frequency (area chart)
- Progress towards goals (radial/gauge chart)

**Journal**:

- Entries per week/month (bar chart)
- Mood tracking over time (line chart) - if mood data exists
- Writing streaks (calendar heatmap)

**Todos**:

- Completion rate over time (line chart)
- Overdue trends (stacked bar)
- Priority distribution (donut chart)

**Meditation**:

- Minutes logged per week (area chart)
- Mood distribution (pie chart)
- Streak calendar (heatmap)
- Session count over time (bar chart)

#### Calendar Component Usage

- **Dashboard**: Activity heatmap across all features
- **Journal**: Entry calendar with intensity based on word count
- **Meditation**: Session calendar showing daily practice
- **Fitness**: Workout calendar

#### Trend Indicators

Add to all metric displays:

- Directional arrows (↑↓)
- Color coding (green = positive, red = negative, based on context)
- Percentage change from previous period
- Small sparkline charts for inline trends

---

### 8. Loading Pattern Replacement

#### Remove Full-Screen Spinner

**File**: `src/routes/(app)/+layout.svelte`

Remove:

```svelte
{#if navigating.to}
	<LoadingSpinner fullScreen={true} size="lg" />
{/if}
```

Replace with page-level skeletons (per-page implementation)

#### Create Page-Specific Skeleton Components

**Files**: Create in `/src/lib/components/skeletons/`

**DashboardSkeleton.svelte**:

- Hero section skeleton with display font sizing
- Stat cards with colored accent shimmers
- Chart placeholder skeletons
- Calendar grid skeleton

**PageSkeleton.svelte** (generic):

- Header skeleton (breadcrumb area)
- Content area skeleton
- Customizable via props

**CardSkeleton.svelte**:

- Matches FeatureCard dimensions
- Animated shimmer with section color tint

#### Implementation Pattern

Each page component:

```svelte
{#await data.promise}
	<DashboardSkeleton />
{:then result}
	<!-- Actual content -->
{/await}
```

#### Page Transitions

Add Svelte page transitions for smooth navigation:

```svelte
<div in:fade={{ duration: 200 }} out:fade={{ duration: 100 }}>
	<!-- Page content -->
</div>
```

---

### 9. Component Polish & Micro-interactions

#### Button Enhancements

- Add gradient variants: `variant="gradient"` with section colors
- Ghost variant with colored hover states
- Icon buttons with colored backgrounds on hover

#### Badge Component

- Section-colored badges:
  - Journal entries: teal background
  - Todos: orange/blue based on priority
  - Fitness: green for health metrics
  - Meditation: purple for mood tags
  - Visits: pink for location tags

#### Alert Component

- Replace inline error text (`<p class="text-red-600">`) with Alert component
- Colored left border matching severity (red = error, orange = warning, blue = info)
- Icons for each alert type

#### Alert Dialog

- Replace custom `ConfirmDialog.svelte` wrapper with shadcn Alert Dialog
- Maintain existing functionality, cleaner implementation
- Colored action buttons (destructive = gradient red)

#### Empty States

- Colored icon backgrounds (large, centered)
- Display font for empty state headlines
- Descriptive text with muted color
- Action button with gradient or colored variant
- Illustrations or large icons (Lucide icons)

#### Command Palette

- Add global keyboard shortcut (⌘K / Ctrl+K)
- Use Command component for quick navigation
- Categories by section with colored indicators
- Recent items at top
- Search across journal entries, todos, visits

#### Toast Notifications (Sonner)

- Colored icons matching action type
- Display font for toast titles
- Success: green, Error: red, Info: blue, Warning: orange
- Action buttons within toasts

---

### 10. Responsive Refinements

#### Mobile Navigation

- Use Drawer component for filters/actions (bottom sheet pattern)
- Button Group for compact view toggles
- Collapsible sections for long forms

#### Mobile Dashboard

- Vertical stat cards stack on mobile
- Carousel for feature navigation (swipeable)
- Tabs for switching between stats/activity/recent

#### Typography Scaling

- Responsive type scale using Tailwind responsive prefixes:
  - Hero: `text-3xl md:text-4xl lg:text-5xl`
  - Page titles: `text-2xl md:text-3xl`
  - Body: `text-base md:text-lg`
- Maintain line-height for readability: `leading-tight` for headings, `leading-relaxed` for body

#### Touch Targets

- Maintain minimum 44x44px for all interactive elements
- Colorful visual feedback on touch (not just hover)
- Larger button padding on mobile

---

## Verification Checklist

### Typography

- [ ] Lexend font loads properly for all headings
- [ ] Inter font loads for all body text
- [ ] No FOUT (flash of unstyled text) - proper fallbacks work
- [ ] Font weights varied appropriately (not all bold)
- [ ] Hierarchy clear: Display sizes (5xl → 4xl → 3xl → 2xl) used correctly
- [ ] Line heights comfortable for reading
- [ ] Responsive type scaling works on mobile

### Color System

- [ ] Vibrant colors applied throughout interface
- [ ] Each section has consistent color identity
- [ ] Gradients used strategically (not overwhelming)
- [ ] Alpha backgrounds provide subtle tints
- [ ] Dark mode colors meet WCAG AA contrast standards
- [ ] No hardcoded colors - all use design tokens
- [ ] Chart colors match broader palette

### Navigation & Layout

- [ ] Sidebar gradient background renders correctly
- [ ] Avatar shows in color (grayscale removed)
- [ ] Active nav states obvious with colored accents
- [ ] Breadcrumbs appear on detail pages
- [ ] Header accent bar matches active section
- [ ] Sync indicator pulses with color
- [ ] Icon backgrounds animated on hover

### Components

- [ ] All 7 new shadcn components installed successfully
- [ ] Breadcrumb works on detail pages
- [ ] Carousel swipes smoothly on mobile
- [ ] Accordion sections expand/collapse properly
- [ ] Alert Dialog replaces old ConfirmDialog
- [ ] Collapsible sections function correctly
- [ ] Scroll Area handles long lists
- [ ] Drawer opens from bottom on mobile

### Loading States

- [ ] Full-screen spinner removed from layout
- [ ] Page-specific skeletons implemented
- [ ] Skeleton animations include colored accents
- [ ] Page transitions smooth (fade in/out)
- [ ] No layout shifts during loading

### Data Visualization

- [ ] Charts display in all relevant sections (Fitness, Dashboard, etc.)
- [ ] Calendar heatmaps show activity
- [ ] Trend indicators (↑↓) with colors
- [ ] Progress components use section colors
- [ ] All data visualizations accessible (proper labels, ARIA)

### Mobile Experience

- [ ] Fonts scale properly on small screens
- [ ] Drawer component works for filters
- [ ] Carousel swipeable on touch devices
- [ ] Touch targets minimum 44x44px
- [ ] Colors help section orientation
- [ ] No horizontal scrolling

### Performance

- [ ] Font loading optimized (preconnect, font-display: swap)
- [ ] No cumulative layout shift (CLS)
- [ ] Page transitions don't block interaction
- [ ] Images/assets optimized
- [ ] No performance regression vs. current implementation

### Accessibility

- [ ] Color not sole indicator (icons, text labels present)
- [ ] Text contrast meets WCAG AA standards
- [ ] Semantic HTML maintained
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announcements for dynamic content
- [ ] Focus indicators visible and colored

---

## Design Decisions

### Font Selection

- **Chosen**: Lexend (display) + Inter (body)
- **Rationale**: Lexend provides modern, geometric impact for headings without being overly stylized. Inter is highly legible and pairs perfectly for body text. Both are Google Fonts for easy integration.

### Font Loading Strategy

- **Method**: Google Fonts with preconnect
- **Fallback**: system-ui maintains layout if fonts fail to load
- **Display**: `font-display: swap` prevents invisible text

### Component Strategy

- **New Components**: 7 shadcn additions (Breadcrumb, Carousel, Accordion, Alert Dialog, Collapsible, Scroll Area, Drawer)
- **Rationale**: Use shadcn exclusively - no custom implementations where shadcn equivalent exists
- **Migration**: Replace ConfirmDialog with Alert Dialog, add Breadcrumb where navigation context needed

### Color Application

- **Section Colors**: Each app area uses nav icon color as primary accent
- **Gradients**: Strategic use - buttons, hover states, hero sections, sidebar background
- **Avoidance**: Not overwhelming page backgrounds with gradients

### Card Usage

- **Philosophy**: Mix of cards with other containers
- **Alternatives**: ContentSection (subtle backgrounds), borderless stat displays, Accordion grouping
- **When to use cards**: Feature highlights, complex content items, isolated actions

### Loading UX

- **Skeleton Preference**: Per-page skeletons instead of blocking full-screen spinner
- **Rationale**: Better perceived performance, maintains layout, less jarring
- **Implementation**: Page-level loading states, not global

### Typography Hierarchy

- **Display Font Priority**: Headings, page titles, stat numbers, branding, CTA buttons
- **Body Font Priority**: Paragraphs, descriptions, labels, form inputs
- **Avoidance**: Don't use display font for body text (readability)

### Command Palette

- **Implementation**: Global keyboard shortcut (⌘K)
- **Usage**: Quick navigation, search across content
- **Component**: Use existing Command component from shadcn

---

## Implementation Order

Recommended sequence for development:

1. **Phase 1: Foundation**
   - Typography system (fonts, config)
   - Color system redesign
   - Install new shadcn components

2. **Phase 2: Navigation**
   - AppSidebar redesign
   - NavMain enhancements
   - SiteHeader with breadcrumbs

3. **Phase 3: Core Components**
   - Create SectionHeader, ContentSection, StatCard, FeatureCard
   - Update Button, Badge, Alert components
   - Implement skeletons

4. **Phase 4: Dashboard**
   - Hero section
   - Quick stats
   - Feature navigation
   - Data visualization

5. **Phase 5: Feature Pages**
   - Journal page
   - Todos page
   - Fitness page
   - Meditation page
   - Visits page

6. **Phase 6: Polish**
   - Page transitions
   - Micro-interactions
   - Command palette
   - Empty states
   - Mobile refinements

7. **Phase 7: Testing**
   - Cross-browser testing
   - Mobile device testing
   - Accessibility audit
   - Performance profiling

---

## Resources

### Fonts

- [Lexend on Google Fonts](https://fonts.google.com/specimen/Lexend)
- [Inter on Google Fonts](https://fonts.google.com/specimen/Inter)

### shadcn-svelte Documentation

- [Components Overview](https://www.shadcn-svelte.com/docs/components)
- [Installation Guide](https://www.shadcn-svelte.com/docs/installation)

### Design Tools

- [Color Contrast Checker](https://contrast-ratio.com/)
- [OKLCH Color Picker](https://oklch.com/)

### Inspiration

- Modern SaaS dashboards
- Wellness app aesthetics
- Personal productivity tools

---

## Notes

- All changes maintain existing functionality - purely visual/UX improvements
- Database schema unchanged
- API endpoints unchanged
- Authentication flow unchanged
- Existing tests should continue passing (may need visual regression tests)

---

**Status**: ✅ Ready for Implementation  
**Next Step**: Begin Phase 1 (Foundation)
