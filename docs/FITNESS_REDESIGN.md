## Plan: Fitness Analytics Dashboard Redesign

Replace the current tabbed utility page with a one-page fitness dashboard centered on momentum, trends, recovery, and habit visibility rather than CRUD-first sections. Keep the existing workouts, weight, meals, and reminders data model, but reorganize the experience into a narrative dashboard with a distinct Clean Recovery Journal identity that feels restorative, intelligent, and personal rather than like a standard app control surface.

**Steps**
1. Reframe the information architecture around overview-first analytics rather than data type separation. Remove primary reliance on tabs for desktop and structure the page as a scrollable dashboard with anchored sections: hero summary, trend band, workouts, weight, nutrition, and habit/reminder system. Keep optional segmented controls only for mobile compression or local section filtering.
2. Build a high-signal hero section that answers the user’s immediate questions in one glance: Am I on track, how did this week compare to last week, what needs attention today, and what changed recently. Include 4-6 KPI cards for workout frequency, active streak, weight delta, calories vs target, and next scheduled reminder.
3. Introduce a visual “trend band” beneath the hero that becomes the emotional centerpiece of the page. Recommended centerpiece: a combined weekly activity strip showing workout volume, weight trend direction, and meal consistency in parallel lanes. This should be the memorable element of the page.
4. Convert each domain into an analytics block instead of a standalone management tab. Workouts becomes volume, consistency, distribution by type, and recent best sessions. Weight becomes trend, rate of change, distance to goal, and adherence confidence. Meals becomes calorie target adherence, consistency over time, and recent intake patterns rather than a raw list first.
5. Push data entry actions into a persistent action rail instead of section headers everywhere. Use one compact command cluster for Log workout, Log weight, Log meal, Set goal, and Create reminder. On desktop this can sit in the upper-right hero area or a sticky side rail; on mobile it can collapse into a floating action menu.
6. Demote raw entries into secondary surfaces. Replace long recent-entry lists with a compact mixed recent activity feed that shows the latest workouts, weights, and meals together in chronological order. On desktop, show the last 5-7 items inline as a quiet timeline card near the lower half of the page, with a secondary “View all activity” action that opens a sheet or drawer for full history and filters. On mobile, collapse the feed more aggressively and use a bottom sheet for deeper history so the main page stays calm and digestible. Editing and deletion should remain available, but mostly in the expanded history surface rather than the inline preview. The inline feed can support a subtle quick-edit affordance on hover or row tap for the newest items, while destructive actions should live behind an overflow menu or within the full history panel to keep the main dashboard visually calm. The dashboard should emphasize insights first, logs second.
7. Add cross-domain insight cards that make the page feel smarter: examples include “Most consistent workout day,” “Average weekly weight change,” “3-day calorie drift,” “Missed reminder risk,” and “Momentum score.” These can be derived from current data without changing the backend model.
8. Give the page a distinct visual direction that intentionally diverges from the broader app. Recommended direction: Clean Recovery Journal. Use softer structure, restrained contrast, tactile spacing, an off-white or mist background, moss or sage greens, muted clay accents, and typography that feels composed and reflective rather than aggressive.
9. Design the layout as asymmetrical rather than evenly carded. Use one large featured analytics panel, a staggered KPI grid, and thinner support cards. Avoid a symmetrical four-tab/four-card pattern because it reads like CRUD software rather than a performance dashboard.
10. Introduce purposeful motion sparingly: KPI numbers can fade/slide in, chart bands can reveal gently left-to-right, and hover states can subtly deepen panel contrast. Avoid generic floating glass effects or excessive animation.
11. Define consistent row behavior for each item type in the recent activity system. Workout rows should show type, duration, date/time, and a concise summary of exercises or notes when available; primary row tap/click opens details or inline expansion, with icon-only actions for view details, edit, and delete. Weight rows should show measured weight, delta vs previous entry when available, and date/time; primary row tap/click opens details, with icon-only actions for edit and delete. Meal rows should show meal label or description, calorie estimate, time of day, and date; primary row tap/click opens details, with icon-only actions for edit and delete. If reminders are ever included in the mixed feed, they should be visually separated as system events rather than body metrics.
12. Use icon-only action buttons for all row controls in both the inline activity preview and expanded history surface. Every icon-only control must include a tooltip with explicit language, for example “View workout details,” “Edit weight entry,” or “Delete meal entry.” In the inline preview, keep actions visually recessed until hover or focus on desktop and reveal them in a clean trailing action cluster on tap/focus for mobile. In the expanded history sheet, actions can remain persistently visible at row end because that surface is operational by design.
13. For shadcn-svelte interactions, use tooltip-wrapped icon buttons with the child snippet trigger pattern so each control remains a single accessible tab stop and does not create nested focus targets.
14. Preserve existing component logic where useful but expect UI restructuring. Existing workout and weight chart logic can be reused as data engines, but should likely be wrapped in new dashboard modules with redesigned framing, labels, and supporting insight summaries.
15. Validate the redesign against two device modes. Desktop should feel like a composed wellness analytics journal; mobile should feel like a compact daily check-in with stacked sections, soft hierarchy, and a sticky action affordance.

**Relevant files**
- /Users/glennsheppard/Development/Personal/synapse/src/routes/(app)/fitness/+page.svelte — primary page structure to replace tabs-first layout with one-page dashboard sections.
- /Users/glennsheppard/Development/Personal/synapse/src/routes/(app)/fitness/+page.server.ts — keep as data source, potentially extend with dashboard-ready aggregates if needed.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/analytics/WorkoutStatsBar.svelte — reusable logic source for workout KPIs, but likely needs visual redesign.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/analytics/WorkoutFrequencyChart.svelte — candidate for a redesigned featured trend panel.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/WeightChart.svelte — candidate for a slimmer trend card with supporting goal and pace insights.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/CalorieProgress.svelte — reusable base for nutrition adherence visualization.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/dialogs/CreateReminderDialog.svelte — likely stays functionally the same, but should be moved into a unified action cluster.

**Chart Strategy**
1. Use one featured composite trend visualization near the top of the page as the emotional anchor. Recommended form: a multi-lane weekly momentum chart, with workouts shown as vertical activity bars, weight shown as a soft line trend over time, and calorie adherence shown as subtle daily under/over target markers. This avoids forcing the user to mentally combine three isolated charts.
2. In the workouts section, use a frequency and distribution chart. Recommended form: stacked weekly bar chart by workout type for the last 6 to 8 weeks so the user can see both consistency and training mix.
3. In the weight section, use a clean line chart with a goal reference line. Secondary annotation can call out trend direction, pace, and recent inflection points rather than adding another separate chart.
4. In the nutrition section, use a compact adherence chart instead of a large calorie-only graph. Recommended form: a 7-day or 14-day bar or dot-based target adherence view that shows whether the user stayed near, above, or below target without turning the section into a spreadsheet.
5. Avoid pie charts for this page because they will make the dashboard feel generic and are weaker for trend reading. Avoid too many separate charts because the page will become fragmented and cognitively noisy.
6. Keep the total chart count disciplined. Recommendation: one hero composite chart, one workout chart, one weight chart, and one compact nutrition chart. Everything else should be KPI cards, insight cards, or compact stat rails.

**Page Blueprint**
1. Hero Header: page title, short recovery-oriented subheading, unified action cluster for log and goal actions.
2. Daily Status Band: 4 to 6 KPI cards for weekly sessions, streak, weight trend, calorie adherence, momentum score, and next reminder.
3. Momentum Panel: one large composite chart with a short interpretation sentence beneath it, such as whether the week looks steady, inconsistent, or trending back on track.
4. Workouts Section: section header, 2 to 3 workout insight cards, stacked frequency chart, compact best or latest workout callout.
5. Weight Section: section header, current vs goal mini stat rail, line chart, pace-to-goal insight card, recent trend annotation.
6. Nutrition Section: section header, calorie target summary, compact adherence chart, one or two insight cards such as average over/under target and most consistent meal period.
7. Habits and Reminders Section: smaller supporting section with reminder summary, consistency cues, and create/manage reminder action.
8. Recent Activity Panel: mixed chronological preview of latest workouts, weights, and meals with subdued inline controls and a prominent view-all action.
9. Full Activity History Surface: expanded sheet or drawer with filters, grouped dates, and persistent icon-only action buttons with tooltips.

**Component Breakdown**
1. FitnessDashboardHeader: title, subtitle, unified action cluster.
2. FitnessStatusCard: reusable KPI card for hero metrics and mini trends.
3. FitnessMomentumPanel: large top-of-page composite chart wrapper with interpretation text.
4. WorkoutInsightsSection: workout KPI cards plus workout distribution chart.
5. WeightInsightsSection: weight stat rail plus weight trend chart and goal context.
6. NutritionInsightsSection: calorie summary plus adherence chart and supporting insights.
7. ReminderSummarySection: compact reminder and consistency block.
8. RecentActivityPreview: mixed activity list used inline on the dashboard.
9. ActivityHistorySheet: full history surface with filters and grouped rows.
10. ActivityHistoryRow: shared row shell that handles timestamp, icon area, primary click behavior, and trailing actions.
11. WorkoutActivityRowDetails: workout-specific summary content within the shared row shell.
12. WeightActivityRowDetails: weight-specific summary content within the shared row shell.
13. MealActivityRowDetails: meal-specific summary content within the shared row shell.
14. IconActionButtonWithTooltip: shared icon-only action control using shadcn-svelte tooltip trigger child snippet pattern.
15. Optional FitnessSectionShell: shared wrapper for section headings, descriptions, and trailing utility controls if repeated patterns emerge.

- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/dialogs/LogWorkoutDialog.svelte — same functional role, new placement strategy.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/dialogs/LogWeightDialog.svelte — same functional role, new placement strategy.
- /Users/glennsheppard/Development/Personal/synapse/src/lib/components/fitness/dialogs/LogMealDialog.svelte — same functional role, new placement strategy.

**Verification**
1. Confirm the page can be understood without tabs on desktop: hero KPIs, major trends, and primary actions should all be visible before deep scrolling.
2. Confirm each domain still has a clear surface for both insight and action: workouts, weight, meals, reminders.
3. Confirm recent-entry management remains available but no longer dominates the first screen.
4. Validate mobile hierarchy: hero summary first, actions second, major trend third, then stacked domain sections.
5. Run Svelte autofix and project checks only when implementation begins, since this plan is design-only.

**Decisions**
- Include: one-page dashboard concept, new information architecture, visual direction, KPI strategy, section hierarchy, action placement, and styling language.
- Exclude for now: backend schema changes, new analytics persistence tables, ML-like recommendations, and any redesign that mimics existing dashboard pages elsewhere in the app.
- Recommendation: remove tabs as the primary navigation on desktop. If needed, keep small segmented controls inside sections or a compact mobile-only switcher.
- Recommendation: treat reminders as a supporting habit system card cluster, not a full top-level tab unless usage data proves otherwise.

**Further Considerations**
1. Preferred styling direction: Clean Recovery Journal. Alternative A: editorial sport-science dashboard. Alternative B: luxury performance lab.
2. Featured centerpiece recommendation: a unified momentum strip combining workout cadence, weight trend, and calorie adherence instead of three isolated charts.
3. If implementation starts, create 2-3 visual composition options first before coding the final layout so the page does not collapse back into standard card-grid SaaS design.