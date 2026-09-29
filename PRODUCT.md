# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner plus a small number of invited people (family/friends). Accounts exist for each person; an admin view exists for the owner. Portfolio value is a side benefit, not the primary audience.

Use is split evenly between phone (quick check-ins: log a workout or meal, tick a task, jot a journal entry, record a visit) and desktop (sitting down to review the week, write longer entries, plan tasks).

## Product Purpose

One private place to run a personal life: daily planning and personal tracking without juggling separate apps. Success is that the owner opens it daily and logging something takes seconds.

## Positioning

A single, personal life-management app that spans domains other tools split apart — tasks, journal, fitness (workouts, weight, meals), meditation, and visit/relationship tracking — tied together by a daily agenda and email digests.

## Operating Context

- Daily agenda and dashboard summarize the day across domains.
- Email digests (daily agenda, tasks due today, visit warnings) pull the user back in.
- Visits track people and how long since last contact, with reminder/recency cues.
- Meditation has routines and logged sessions.
- Tasks are kanban-style with priorities and due dates.

## Capabilities and Constraints

- SvelteKit + Svelte 5 runes, Tailwind v4, bits-ui (shadcn-svelte style) components, layerchart for charts, superforms + Zod.
- Better Auth email + password; routes: sign-in, forgot/reset password, verify email, sign-out.
- App routes: dashboard, tasks, journal, fitness, meditation, visits, profile, admin.
- Light and dark mode both supported (pre-paint nonce'd script; strict CSP).
- Deployed on fly.io with adapter-node.

## Brand Commitments

Name: Synapse. No other binding brand assets, voice rules, or logo commitments recorded.

## Evidence on Hand

Real user data only in production. No testimonials, metrics, or marketing claims exist; do not invent any.

## Product Principles

1. Logging is the core loop: any entry should be reachable and savable in seconds on a phone.
2. One day, many domains: the daily view connects tasks, body, mind, and people rather than siloing them.
3. Private by default: this is a personal space for a few trusted people, not a social product.
4. Desktop earns depth: planning and reflection get room to breathe on large screens.
