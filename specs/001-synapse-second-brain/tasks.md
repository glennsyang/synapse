# Tasks: Synapse Second-Brain App

**Input**: Design documents from `/specs/001-synapse-second-brain/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks grouped by user story (US1-US6) to enable independent implementation and testing.

**Tests**: Not explicitly requested in spec - focusing on implementation tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- All paths are absolute from repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Bootstrap SvelteKit project with dependencies

- [x] T001 Initialize SvelteKit project with TypeScript at repository root
- [x] T002 [P] Install core dependencies: svelte@^5.0.0, @sveltejs/kit@^2.0.0, better-auth@^1.0.0, drizzle-orm@^0.29.0, better-sqlite3@^12.5.0
- [x] T003 [P] Install form/validation dependencies: sveltekit-superforms@^2.0.0, zod@^4.3.5
- [x] T004 [P] Install UI dependencies: shadcn-svelte, tailwindcss@^4.1.18, @tanstack/svelte-table@^8.10.0, @lucide/svelte@^0.561.0
- [x] T005 [P] Install email dependency: resend@^6.7.0
- [x] T006 [P] Install dev dependencies: vitest@^4.0.0, eslint@^9.39.2, prettier@^3.3.0, lefthook@^2.0.0, lint-staged@^16.0.0, drizzle-kit@^0.31.8
- [x] T007 Configure Tailwind CSS in tailwind.config.js
- [x] T008 Configure Vite in vite.config.ts with Svelte 5 plugin
- [x] T009 [P] Configure ESLint in eslint.config.js for TypeScript and Svelte
- [x] T010 [P] Configure Prettier in .prettierrc
- [x] T011 Configure Lefthook in lefthook.yml with pre-commit hooks
- [x] T012 Configure lint-staged in package.json for auto-fixing on commit
- [x] T013 Create .env.example with BETTER_AUTH_SECRET, RESEND_API_KEY, DATABASE_URL
- [x] T014 Create .gitignore to exclude node_modules, .env, data/, .svelte-kit/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T015 Create Drizzle config in drizzle.config.ts pointing to data/synapse.db
- [x] T016 Define better-auth tables in src/lib/server/db/schema.ts (user, session, account, verification) per data-model.md
- [x] T017 Define email_notifications table in src/lib/server/db/schema.ts with UUID primary key
- [x] T018 Initialize Drizzle client in src/lib/server/db/index.ts with better-sqlite3 driver
- [x] T019 Configure better-auth in src/lib/server/auth.ts with Drizzle adapter, email/password provider, Resend integration
- [x] T020 Create better-auth client in src/lib/client/auth.ts for client-side auth actions
- [x] T021 Implement hooks.server.ts with better-auth session middleware
- [x] T022 Create Resend email templates in src/lib/server/email/verify.ts (verification email)
- [x] T023 Create Resend email templates in src/lib/server/email/reset.ts (password reset email)
- [x] T024 Generate initial database migration with `drizzle-kit generate:sqlite`
- [x] T025 Apply database migration with `drizzle-kit push:sqlite`
- [x] T026 Create base layout in src/routes/+layout.svelte with global styles
- [x] T027 Create app.html with viewport meta and base HTML structure
- [x] T028 Create health check endpoint in src/routes/api/healthz/+server.ts
- [x] T029 [P] Create base Shadcn UI components in src/lib/components/ui/ (Button, Input, Card, etc.)
- [x] T030 Create error handling utility in src/lib/utils/errors.ts
- [x] T031 [P] Create logger utility in src/lib/utils/logger.ts with request ID tracking

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Access & App Shell (Priority: P1) 🎯 MVP

**Goal**: Authentication with email/password, email verification, and main app navigation shell

**Independent Test**: Visit app unauthenticated → redirected to login → sign up → verify email → see sidebar with menu items

### Implementation for User Story 1

- [x] T032 [P] [US1] Create auth route group layout in src/routes/(auth)/+layout.svelte
- [x] T033 [P] [US1] Create register page in src/routes/(auth)/register/+page.svelte with email/name/password form
- [x] T034 [US1] Create register form action in src/routes/(auth)/register/+page.server.ts using Superforms + Zod
- [x] T035 [P] [US1] Create login page in src/routes/(auth)/sign-in/+page.svelte with email/password form
- [x] T036 [US1] Create login form action in src/routes/(auth)/sign-in/+page.server.ts using better-auth client
- [x] T037 [P] [US1] Create verify-email callback page in src/routes/(auth)/verify-email/+page.server.ts
- [x] T038 [P] [US1] Create forgot-password page in src/routes/(auth)/forgot-password/+page.svelte
- [x] T039 [US1] Create forgot-password action in src/routes/(auth)/forgot-password/+page.server.ts
- [x] T040 [P] [US1] Create reset-password page in src/routes/(auth)/reset-password/+page.svelte
- [x] T041 [US1] Create reset-password action in src/routes/(auth)/reset-password/+page.server.ts
- [x] T042 [US1] Create protected app layout in src/routes/(app)/+layout.svelte with sidebar navigation
- [x] T043 [US1] Create protected layout guard in src/routes/(app)/+layout.server.ts (redirect if not authenticated)
- [x] T044 [P] [US1] Create Sidebar component in src/lib/components/app/Sidebar.svelte with menu items
- [x] T045 [P] [US1] Create Header component in src/lib/components/app/Header.svelte with user menu and logout
- [x] T046 [US1] Implement logout action using better-auth client in Header component
- [x] T047 [US1] Create dashboard/home page in src/routes/(app)/+page.svelte with welcome message
- [x] T048 [P] [US1] Style authentication pages with Tailwind CSS for sleek appearance

**Checkpoint**: User Story 1 complete - users can sign up, verify email, log in, see sidebar, log out

---

## Phase 4: User Story 2 - Daily Journal Entries (Priority: P2)

**Goal**: Create, view, edit, delete journal entries with tags, location, weather

**Independent Test**: Create journal entry with tags → verify location auto-fills → see entry in timeline → edit entry → delete entry

### Implementation for User Story 2

- [x] T049 [P] [US2] Define journalEntries table in src/lib/server/db/schema.ts with UUID keys per data-model.md
- [x] T050 [US2] Generate and apply migration for journalEntries table
- [x] T051 [P] [US2] Create Zod schema for journal entry in src/lib/schemas/journal.ts (date, content, tags, location, weather)
- [x] T052 [US2] Create journal list page in src/routes/(app)/journal/+page.svelte with timeline view
- [x] T053 [US2] Create journal list loader in src/routes/(app)/journal/+page.server.ts (load entries with filters)
- [x] T054 [P] [US2] Create JournalEntryCard component in src/lib/components/journal/JournalEntryCard.svelte
- [x] T055 [P] [US2] Create new entry page in src/routes/(app)/journal/new/+page.svelte with form
- [x] T056 [US2] Create new entry action in src/routes/(app)/journal/new/+page.server.ts using Superforms
- [x] T057 [P] [US2] Create edit entry page in src/routes/(app)/journal/[id]/edit/+page.svelte
- [x] T058 [US2] Create edit entry loader and action in src/routes/(app)/journal/[id]/edit/+page.server.ts
- [x] T059 [P] [US2] Create delete entry action in journal pages
- [x] T060 [P] [US2] Implement location auto-capture using browser geolocation API in journal form
- [ ] T061 [P] [US2] Implement weather API integration (optional) in src/lib/server/weather.ts
- [x] T062 [P] [US2] Create tag input component in src/lib/components/journal/TagInput.svelte
- [x] T063 [P] [US2] Add filter UI for tags, date range in journal list page
- [x] T064 [US2] Implement filter logic in journal loader (by tag, date range)

**Checkpoint**: User Story 2 complete - journal entries fully functional with metadata

---

## Phase 5: User Story 3 - Todos by Cadence (Priority: P3)

**Goal**: Create daily/weekly/monthly todos with projects, tags, priority, state, sub-steps; view in list/grid/kanban

**Independent Test**: Create todo with project, tags, priority, state, sub-steps → see in list view → switch to kanban → see in correct column → update state → verify moves

### Implementation for User Story 3

- [x] T065 [P] [US3] Define projects table in src/lib/server/db/schema.ts with UUID keys
- [x] T066 [P] [US3] Define todoItems table in src/lib/server/db/schema.ts with UUID keys, project FK
- [x] T067 [US3] Generate and apply migration for projects and todoItems tables
- [x] T068 [P] [US3] Create Zod schema for project in src/lib/schemas/project.ts
- [x] T069 [P] [US3] Create Zod schema for todo item in src/lib/schemas/todo.ts (title, description, cadence, project, tags, priority, state, sub_steps, due_date)
- [x] T070 [US3] Create todos page in src/routes/(app)/todos/+page.svelte with view selector (list/grid/kanban)
- [x] T071 [US3] Create todos loader in src/routes/(app)/todos/+page.server.ts (load todos + projects by cadence filter)
- [x] T072 [P] [US3] Create TodoListView component in src/lib/components/todos/TodoListView.svelte with TanStack Table
- [x] T073 [P] [US3] Create TodoGridView component in src/lib/components/todos/TodoGridView.svelte
- [x] T074 [P] [US3] Create TodoKanbanView component in src/lib/components/todos/TodoKanbanView.svelte with columns by state
- [x] T075 [P] [US3] Create TodoCard component in src/lib/components/todos/TodoCard.svelte showing all metadata
- [x] T076 [P] [US3] Create new todo modal/page in src/routes/(app)/todos/new/+page.svelte
- [x] T077 [US3] Create new todo action in src/routes/(app)/todos/new/+page.server.ts
- [x] T078 [P] [US3] Create edit todo page in src/routes/(app)/todos/[id]/edit/+page.svelte
- [x] T079 [US3] Create edit todo action in src/routes/(app)/todos/[id]/edit/+page.server.ts
- [x] T080 [P] [US3] Create delete todo action
- [x] T081 [P] [US3] Create project management page in src/routes/(app)/todos/projects/+page.svelte
- [x] T082 [US3] Create project CRUD actions in src/routes/(app)/todos/projects/+page.server.ts
- [x] T083 [P] [US3] Create SubStepsInput component in src/lib/components/todos/SubStepsInput.svelte for adding/editing sub-steps
- [x] T084 [P] [US3] Implement priority selector UI (1-4 tier)
- [x] T085 [P] [US3] Implement state selector UI (new, in_progress, blocked, done)
- [x] T086 [P] [US3] Implement cadence filter tabs (daily, weekly, monthly)
- [x] T087 [US3] Implement drag-and-drop state change in kanban view (update todo state on drop)

**Checkpoint**: User Story 3 complete - todos fully functional with all views and metadata

---

## Phase 6: User Story 4 - Fitness & Nutrition Tracking (Priority: P4)

**Goal**: Log weight, workouts (with exercises), meals; set goals/targets; view charts; schedule reminders

**Independent Test**: Log weight → set goal weight → log workout with exercises → log meal → view weight chart → see calorie progress → set workout reminder

### Implementation for User Story 4

- [x] T088 [P] [US4] Define weightEntries table in src/lib/server/db/schema.ts with UUID keys
- [x] T089 [P] [US4] Define goalWeights table in src/lib/server/db/schema.ts
- [x] T090 [P] [US4] Define workoutLogs table in src/lib/server/db/schema.ts
- [x] T091 [P] [US4] Define workoutExercises table in src/lib/server/db/schema.ts with workout FK
- [x] T092 [P] [US4] Define mealLogs table in src/lib/server/db/schema.ts
- [x] T093 [P] [US4] Define dailyCalorieTargets table in src/lib/server/db/schema.ts
- [x] T094 [P] [US4] Define workoutReminders table in src/lib/server/db/schema.ts
- [x] T095 [US4] Generate and apply migration for fitness tables
- [x] T096 [P] [US4] Create Zod schemas for weight, workout, meal, goals in src/lib/schemas/fitness.ts
- [x] T097 [US4] Create fitness page in src/routes/(app)/fitness/+page.svelte with tabs (Weight, Workouts, Meals)
- [x] T098 [US4] Create fitness loader in src/routes/(app)/fitness/+page.server.ts
- [x] T099 [P] [US4] Create weight tab in src/routes/(app)/fitness/weight/+page.svelte with log form and chart
- [x] T100 [US4] Create weight CRUD actions in src/routes/(app)/fitness/weight/+page.server.ts
- [x] T101 [P] [US4] Create WeightChart component in src/lib/components/fitness/WeightChart.svelte using Chart.js (line graph, weekly trends)
- [x] T102 [P] [US4] Create goal weight form in weight page
- [x] T103 [US4] Create goal weight action in weight page server
- [x] T104 [P] [US4] Display "Remaining to Goal" calculation in weight page
- [x] T105 [P] [US4] Create workouts tab in src/routes/(app)/fitness/workouts/+page.svelte with workout list
- [x] T106 [US4] Create workouts loader in src/routes/(app)/fitness/workouts/+page.server.ts
- [x] T107 [P] [US4] Create new workout page in src/routes/(app)/fitness/workouts/new/+page.svelte
- [x] T108 [US4] Create new workout action (workout type, date, time, duration, notes)
- [x] T109 [P] [US4] Create ExerciseInput component in src/lib/components/fitness/ExerciseInput.svelte for strength workouts (exercise name, sets, reps, weight)
- [x] T110 [US4] Save workout exercises in workoutExercises table
- [x] T111 [P] [US4] Create workout detail/edit page showing exercises
- [x] T112 [P] [US4] Create meals tab in src/routes/(app)/fitness/meals/+page.svelte with meal log list
- [x] T113 [US4] Create meals loader in src/routes/(app)/fitness/meals/+page.server.ts
- [x] T114 [P] [US4] Create new meal form (date, time_of_day, description, calories_estimate)
- [x] T115 [US4] Create meal CRUD actions
- [x] T116 [P] [US4] Create daily calorie target form
- [x] T117 [US4] Create calorie target action
- [x] T118 [P] [US4] Create CalorieProgress component showing progress bar (consumed vs target)
- [x] T119 [US4] Calculate daily total calories from meal logs
- [x] T120 [P] [US4] Create workout reminders page in src/routes/(app)/fitness/reminders/+page.svelte
- [x] T121 [US4] Create reminder CRUD actions (workout_type, cadence, days_of_week, time, enabled)
- [x] T122 [US4] Implement workout reminder email worker in src/lib/server/email/workout-reminder.ts using Resend
- [x] T123 [US4] Create cron/scheduled task to check reminders and send emails (log in email_notifications table)

**Checkpoint**: User Story 4 complete - fitness tracking with goals, charts, and reminders

---

## Phase 7: User Story 5 - Meditation Routines (Priority: P5)

**Goal**: Create/use meditation routines, schedule reminders, complete sessions, view history

**Independent Test**: Create routine with mood tags → schedule reminder → complete session with mood rating → see in history

### Implementation for User Story 5

- [x] T124 [P] [US5] Define meditationRoutines table in src/lib/server/db/schema.ts with UUID keys
- [x] T125 [P] [US5] Define meditationSchedules table in src/lib/server/db/schema.ts with routine FK
- [x] T126 [P] [US5] Define meditationSessions table in src/lib/server/db/schema.ts with routine FK
- [x] T127 [US5] Generate and apply migration for meditation tables
- [x] T128 [P] [US5] Create Zod schemas for routine, schedule, session in src/lib/schemas/meditation.ts
- [x] T129 [US5] Create meditation page in src/routes/(app)/meditation/+page.svelte with tabs (Routines, History)
- [x] T130 [US5] Create meditation loader in src/routes/(app)/meditation/+page.server.ts (load routines, sessions)
- [x] T131 [P] [US5] Create RoutineLibrary component (integrated in main meditation page)
- [x] T132 [P] [US5] Create new routine page in src/routes/(app)/meditation/routines/new/+page.svelte (title, description, link_url, duration, mood_tags)
- [x] T133 [US5] Create routine CRUD actions
- [x] T134 [P] [US5] Create seed script in scripts/seed-meditation.js to insert predefined routines with UUID IDs
- [x] T135 [US5] Run seed script to populate predefined routines
- [x] T136 [P] [US5] Create schedule reminder form in routine detail page (cadence, days_of_week, time, enabled)
- [x] T137 [US5] Create schedule CRUD actions in src/routes/(app)/meditation/routines/[id]/+page.server.ts
- [x] T138 [US5] Implement meditation reminder email worker in src/lib/server/email/meditation-reminder.ts using Resend
- [x] T139 [US5] Create cron/scheduled task to check meditation schedules and send emails (log in email_notifications table)
- [x] T140 [P] [US5] Create complete session modal/page (routine selection, completion timestamp, mood_rating 1-5, notes)
- [x] T141 [US5] Create session completion action saving to meditationSessions table
- [x] T142 [P] [US5] Create SessionHistory component (integrated in main meditation page)
- [x] T143 [P] [US5] Implement mood tag filter (Anxious, Low Energy, Focused, Pre-Sleep, General)

**Checkpoint**: User Story 5 complete - meditation routines, scheduling, and tracking

---

## Phase 8: User Story 6 - People Visit Tracking (Priority: P6)

**Goal**: Track people, log visits with companions/notes/follow-up, see status (green/yellow/red), get reminders

**Independent Test**: Add person → log visit with companions and follow-up date → verify status is green → wait (or manipulate date) → see status change to yellow → get reminder notification

### Implementation for User Story 6

- [x] T144 [P] [US6] Define people table in src/lib/server/db/schema.ts with UUID keys
- [x] T145 [P] [US6] Define visits table in src/lib/server/db/schema.ts with person FK, UUID keys
- [x] T146 [US6] Generate and apply migration for people and visits tables
- [x] T147 [P] [US6] Create Zod schemas for person, visit in src/lib/schemas/visits.ts
- [x] T148 [US6] Create visits page in src/routes/(app)/visits/+page.svelte with people list and status indicators
- [x] T149 [US6] Create visits loader in src/routes/(app)/visits/+page.server.ts (load people with last visit date, calculate status)
- [x] T150 [P] [US6] Create PersonCard component in src/lib/components/visits/PersonCard.svelte showing name, status (green/yellow/red), last visit (integrated inline in main page)
- [x] T151 [P] [US6] Implement visit status calculation logic in src/lib/utils/visit-status.ts (green: <6mo, yellow: 6-12mo, red: ≥12mo)
- [x] T152 [P] [US6] Create new person page in src/routes/(app)/visits/people/new/+page.svelte
- [x] T153 [US6] Create person CRUD actions
- [x] T154 [P] [US6] Create person detail page in src/routes/(app)/visits/[id]/+page.svelte showing visit history
- [x] T155 [US6] Create person detail loader loading visits for person
- [x] T156 [P] [US6] Create new visit form (date, time, companions array, notes, follow_up_date)
- [x] T157 [US6] Create visit CRUD actions in person detail page
- [x] T158 [P] [US6] Create VisitHistory component in src/lib/components/visits/VisitHistory.svelte showing timeline of visits (integrated inline)
- [x] T159 [US6] Implement visit reminder email worker in src/lib/server/email/visit-warning.ts using Resend
- [x] T160 [US6] Create cron/scheduled task to check people 7 days before status change and send reminders (log in email_notifications table)
- [x] T161 [US6] Update status indicators when visits are added/edited/deleted

**Checkpoint**: User Story 6 complete - visit tracking with status and reminders

---

## Dependencies & Parallel Execution

### Parallel Opportunities

**Setup Phase**: T002-T006 (dependency installation), T009-T010 (linting config) can run in parallel

**Foundational Phase**: T016-T017 (schema definitions), T022-T023 (email templates), T029 (UI components), T031 (logger) can run in parallel after T018 completes

**User Stories**: After Phase 2 completes, ALL user story phases (3-8) can be implemented in parallel by different developers since each story is independent

**Within Each Story**: Tasks marked [P] can run in parallel (e.g., UI components, schemas, page creation)

### Critical Path

1. T001 → T015 → T018 → T019 → T024-T025 (database setup)
2. T021 (auth middleware) → T032-T048 (US1 authentication)
3. After US1: All other user stories can proceed independently

### Story Completion Order for MVP

**Recommended**: US1 → US2 → US3 → US4 → US5 → US6

**Minimum MVP**: Complete only US1 (authentication + app shell) for basic access

**Extended MVP**: US1 + US2 (journal) provides useful second-brain functionality

**Full MVP**: US1 + US2 + US3 (todos) covers core productivity needs

---

## Implementation Strategy

1. **Start with Phase 1-2** to establish foundation
2. **Implement US1 first** (authentication required for everything)
3. **Then implement US2-US6 in priority order** OR in parallel if multiple developers
4. **Each user story is a deployable increment** - can ship after completing any story
5. **Phase 9 adds polish** - can be done incrementally alongside stories

## Task Count Summary

- **Phase 1 (Setup)**: 14 tasks
- **Phase 2 (Foundational)**: 17 tasks (BLOCKING)
- **Phase 3 (US1 - Auth & Shell)**: 17 tasks
- **Phase 4 (US2 - Journal)**: 16 tasks
- **Phase 5 (US3 - Todos)**: 23 tasks
- **Phase 6 (US4 - Fitness)**: 36 tasks
- **Phase 7 (US5 - Meditation)**: 20 tasks
- **Phase 8 (US6 - Visits)**: 18 tasks
- **Phase 9 (Polish)**: 22 tasks

**Total**: 183 tasks

**Parallel Opportunities**: ~60 tasks can run in parallel (marked with [P])

**MVP Scope** (US1 only): 48 tasks (Setup + Foundational + US1)

**Extended MVP** (US1 + US2): 64 tasks

**Core MVP** (US1 + US2 + US3): 87 tasks
