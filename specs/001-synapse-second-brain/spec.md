# Feature Specification: Synapse Second-Brain App

**Feature Branch**: `001-synapse-second-brain`  
**Created**: 2026-02-01  
**Status**: Draft  
**Input**: User description: "I am building a modern \"Second-Brain\" type app called Synapse. I want it to look sleek, something that would stand out. There should be a sidebar with menu items for: 1.Tracking exercise workouts and meals (what I eat) plus tracking my weight over time. 2.Meditations for different meditation routines. 3.Daily Journal to make daily journal entries. 4.Todos to track daily, weekly and monthly todos. There should be an authentication page before being able to access the app."

## Clarifications

### Session 2026-02-02

- Q: What data storage/sync model should the app use? → A: Cloud sync.
- Q: Which authentication method should the app use initially? → A: Email + password.
- Q: What type of meditation routines should the app support? → A: Both predefined and user-created routines.
- Q: How should sync conflicts be resolved? → A: Last-write-wins (timestamp-based).
- Q: What user roles and sharing should be supported? → A: Single user role only.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Secure Access & App Shell (Priority: P1)

As a user, I want to authenticate before entering the app so my personal data is protected and I can see the main navigation.

**Why this priority**: Secure access and a consistent navigation shell are prerequisites for all other experiences.

**Independent Test**: Can be fully tested by visiting the app unauthenticated, completing sign-in, and confirming the sidebar navigation appears.

**Acceptance Scenarios**:

1. **Given** I am not signed in, **When** I open the app, **Then** I am routed to an authentication page.
2. **Given** I enter valid credentials, **When** I sign in, **Then** I reach the main app shell with the sidebar menu items visible.

---

### User Story 2 - Daily Journal Entries (Priority: P2)

As a user, I want to create and review daily journal entries with tags, location, and optional weather so I can capture context for later search.

**Why this priority**: Journaling is a core second-brain use case that delivers immediate value after authentication.

**Independent Test**: Can be tested by creating a journal entry with tags and verifying the location auto-fills, then confirming it appears in the journal list.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I create a journal entry with a date and content, **Then** it is saved and visible in my journal timeline.
2. **Given** I create a journal entry, **When** location is available, **Then** the entry auto-saves the location and optional weather data.

---

### User Story 3 - Todos by Cadence (Priority: P3)

As a user, I want to create daily, weekly, and monthly todos with rich metadata (project, tags, priority, and state) so I can organize and execute work effectively.

**Why this priority**: Task tracking is a primary productivity need and should be independently usable.

**Independent Test**: Can be tested by creating a todo with a project, tags, priority, and state, plus a sub-step, then verifying it appears in list and kanban views.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I add todos with daily, weekly, and monthly cadences, **Then** each todo appears in the correct cadence view.
2. **Given** I create or edit a todo, **When** I set title, description, project, tags, priority, and state, **Then** those fields are saved and displayed.
3. **Given** a complex todo, **When** I add sub-steps, **Then** the sub-steps are saved and shown under the parent todo.
4. **Given** I switch between list, grid, and kanban views, **When** I open the Todos section, **Then** the tasks render in the selected view.

---

### User Story 4 - Fitness & Nutrition Tracking (Priority: P4)

As a user, I want to log weight/biometrics, workouts, and meals with targets and visualizations so I can track health progress and trends.

**Why this priority**: Health tracking is a core module but can be delivered after journaling and todos.

**Independent Test**: Can be tested by logging weight with a timestamp, setting a goal weight, logging a workout and meal, and confirming charts and daily calorie progress update.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I log a workout, a meal, and a weight entry, **Then** each entry is saved and visible with its date/time.
2. **Given** I log multiple weight entries, **When** I view the Weight over Time chart, **Then** a line graph shows weekly trends.
3. **Given** I set a goal weight, **When** I view the weight summary, **Then** a Remaining to Goal value is shown.
4. **Given** I log a strength workout, **When** I add sets, reps, and weight per exercise, **Then** those details are saved and visible.
5. **Given** I set a recurring workout reminder, **When** the scheduled time occurs, **Then** I receive a notification.
6. **Given** I log meals with calorie estimates, **When** I view today’s nutrition summary, **Then** a progress bar shows calories consumed vs daily target.

---

### User Story 5 - Meditation Routines (Priority: P5)

As a user, I want to define, schedule, and complete meditation routines so I can build a consistent mindfulness practice.

**Why this priority**: Meditation is valuable but can follow the foundational productivity features.

**Independent Test**: Can be tested by creating a routine with a link, mood tag, and duration, scheduling reminders, completing a session, and viewing the history log.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I create a routine with title, description, link, mood tags, and duration, **Then** it is saved in my routine library.
2. **Given** I set a reminder schedule, **When** a scheduled time occurs, **Then** I receive a notification.
3. **Given** I have a scheduled routine and have not completed it, **When** the scheduled window passes, **Then** I receive a gentle nudge.
4. **Given** I complete a routine, **When** I mark it as completed, **Then** it appears in my history log with date, routine title, and post-meditation mood rating.

---

### User Story 6 - People Visit Tracking (Priority: P6)

As a user, I want to track visits to people with status and reminders so I can maintain regular contact.

**Why this priority**: Visit tracking is important but can follow the core productivity and health features.

**Independent Test**: Can be tested by creating a person, logging a visit with notes and follow-up date, and confirming status and reminders update.

**Acceptance Scenarios**:

1. **Given** I add a person, **When** I log a visit with date/time, companions, notes, and follow-up date, **Then** the visit is saved and visible in the person’s history.
2. **Given** I log a visit, **When** I view the person’s status, **Then** it is green until 6 months after the visit, yellow after 6 months, and red after 12 months.
3. **Given** a person is 7 days away from turning yellow or red, **When** that threshold approaches, **Then** I receive a reminder notification.
4. **Given** I edit or delete a visit, **When** I save the changes, **Then** the status and reminder schedule update accordingly.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when a user enters invalid credentials repeatedly?
- How does the system handle empty or missing content for a journal entry or meal log?
- What happens if location or weather data is unavailable when saving a journal entry?
- What happens if a user tries to create a todo with an invalid cadence?
- What happens if a user leaves project unset or uses an invalid project name?
- What happens if a user enters an invalid state or priority?
- How does the system handle very long titles, descriptions, or many tags?
- What happens if a user enters non-numeric or negative values for weight or calories?
- What happens when a daily calorie target is not set?
- What happens if a reminder is scheduled in the past or conflicts with another reminder?
- What happens if a routine is missing a valid external link?
- What happens if a routine duration is invalid or missing?
- What happens if multiple reminders are set for the same routine cadence?
- What happens if a person has no recorded visits yet?
- What happens if a visit is logged in the future?
- What happens if a follow-up date is before the visit date?
- How does the system display weight trends when only a single data point exists?

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The system MUST require authentication before any app content is accessible.
- **FR-002**: The system MUST provide an authentication page for sign-in and a way to sign out.
- **FR-002a**: The system MUST support email-and-password authentication for initial release.
- **FR-003**: The main app shell MUST include a sidebar with menu items for Health Tracking (with sub-menu for Workouts, Meals and Weight), Meditations, Daily Journal, and Todos.
- **FR-004**: Users MUST be able to create, view, edit, and delete daily journal entries with a date, text content, and tags.
- **FR-004a**: Journal entries MUST automatically capture location when available.
- **FR-004b**: Journal entries SHOULD automatically capture weather when available.
- **FR-005**: Users MUST be able to create and complete todos with a cadence of daily, weekly, or monthly.
- **FR-005a**: Todos MUST include a title and MAY include a description.
- **FR-005b**: Todos MUST be assignable to a project (e.g., Work, Health, Synapse Dev).
- **FR-005c**: Todos MUST support tags (e.g., #urgent, #waiting) for filtering across projects.
- **FR-005d**: Todos MAY include an optional due date.
- **FR-005e**: Todos MUST support a state lifecycle (e.g., new, in progress, blocked, done).
- **FR-005f**: Todos MUST support a 4-tier priority system.
- **FR-005g**: Todos MUST support sub-steps for breaking down complex tasks.
- **FR-005h**: Users MUST be able to view todos in list, grid, and kanban styles.
- **FR-006**: Users MUST be able to log workouts and meals with a date and basic details.
- **FR-006a**: Weight entries MUST include a numeric value in lbs and a date/time stamp.
- **FR-006b**: The system MUST display a Weight over Time line graph with weekly trends.
- **FR-006c**: Users MUST be able to set a goal weight and see Remaining to Goal.
- **FR-006d**: Workout logs MUST include date, type (e.g., strength, cardio, yoga), and duration.
- **FR-006e**: Strength workouts MUST allow recording sets, reps, and weight per exercise.
- **FR-006f**: Users MUST be able to set recurring workout reminders.
- **FR-006g**: Meal logs MUST include description and time of day.
- **FR-006h**: Meal logs MUST allow an estimated calorie count.
- **FR-006i**: Users MUST be able to set a daily calorie target and view a progress bar of consumed vs target.
- **FR-007**: Users MUST be able to record weight entries and view weight history over time.
- **FR-008**: Users MUST be able to use predefined routines and create/manage their own routine library.
- **FR-008a**: Each routine MUST include a title, description, and external link URL.
- **FR-008b**: Routines MUST support mood-fit tags (e.g., Anxious, Low Energy, Focused, Pre-Sleep).
- **FR-008c**: Routines MUST include a duration label.
- **FR-008d**: Users MUST be able to set recurring reminder schedules (daily, weekly, or custom cadence).
- **FR-008e**: The system MUST send a gentle nudge when a scheduled session is missed.
- **FR-008f**: Users MUST be able to mark a session as completed.
- **FR-008g**: The system MUST record a completion log with date, routine title, and post-meditation mood rating.
- **FR-015**: Users MUST be able to create and manage a list of people to visit.
- **FR-015a**: Each person MUST store name and visit history (date/time, companions, notes, follow-up date).
- **FR-015b**: Companions MUST be stored as free-text names.
- **FR-015c**: The system MUST calculate a visit status: green (0–<6 months), yellow (6–<12 months), red (≥12 months) since last visit.
- **FR-015d**: The system MUST send reminders 7 days before a person would transition to yellow or red.
- **FR-015e**: Users MUST be able to edit and delete visit entries and have statuses/reminders update.
- **FR-009**: The system MUST keep all user data private to the authenticated user.
- **FR-010**: The user interface MUST present a sleek, visually distinctive design with consistent styling across sections.
- **FR-011**: The system MUST preserve user data between sessions.
- **FR-012**: The system MUST sync user data across devices via cloud storage.
- **FR-013**: Sync conflicts MUST resolve using last-write-wins based on timestamps.
- **FR-014**: The system MUST support a single-user account model with no sharing in initial scope.

### Key Entities _(include if feature involves data)_

- **User**: Authenticated person using the app; owns all personal data.
- **JournalEntry**: A dated text entry created by a user with tags and optional location/weather metadata.
- **TodoItem**: A task with title, description, cadence (daily/weekly/monthly), project, tags, optional due date, status, priority, and sub-steps.
- **Project**: A user-defined grouping for todos (e.g., Work, Health, Synapse Dev).
- **WorkoutLog**: A dated record of exercise activity with type, duration, and optional exercise details.
- **WorkoutExercise**: An exercise entry with sets, reps, and weight for strength workouts.
- **MealLog**: A dated record of meals with description, time of day, and calorie estimate.
- **WeightEntry**: A dated numeric weight record in lbs with time-of-day timestamp for trend tracking.
- **GoalWeight**: A target weight value used to calculate remaining progress.
- **WorkoutReminder**: A recurring reminder schedule for workouts.
- **DailyCalorieTarget**: A daily calorie goal used for progress calculations.
- **MeditationRoutine**: A routine with title, description, link URL, mood tags, and duration label.
- **MeditationSchedule**: A recurring reminder schedule (daily, weekly, or custom cadence).
- **MeditationSession**: A dated completion record for a routine with post-meditation mood rating.
- **Person**: An individual to visit, with name and visit history.
- **Visit**: A dated visit record with companions (free-text), notes, and optional follow-up date.

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 95% of users can sign in and reach the app shell in under 60 seconds on first attempt.
- **SC-002**: Users can create a journal entry, a todo, or a weight entry in under 2 minutes per item.
- **SC-003**: 90% of users can complete at least one meditation routine and see it recorded without assistance.
- **SC-004**: 90% of users rate the interface as "sleek and visually distinctive" in a post-task survey.

## Assumptions

- Authentication uses a standard email-and-password flow for initial scope.
- The app is intended for personal use with a single primary user per account.
- Data is retained until the user deletes it.
- Dates are interpreted in the user’s local timezone.
- Cloud sync is available.
- Meditation routines include both predefined and user-created entries.
- Sharing between users is out of scope for initial release.
