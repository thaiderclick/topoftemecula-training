# V2 Training App TODO

## Phase 1: Full-Stack Upgrade & Infrastructure
- [x] Upgrade project from static to web-db-user full-stack
- [x] Install new dependencies (tRPC, drizzle, mysql2, etc.)
- [x] Fix package.json scripts for full-stack dev/build/start
- [x] Update database schema with roleplay_attempts and training_progress tables
- [x] Push schema migrations to database
- [x] Build AI Roleplay backend tRPC procedures (owner chat + evaluator)

## Phase 2: AI Roleplay Simulator (P0)
- [x] Persona picker UI (5 personas: busy, skeptical_google, friendly_curious, gatekeeper, hostile)
- [x] Live chat interface with AI responses
- [x] Scene-end detection on [SCENE COMPLETE] token
- [x] Evaluator call after scene ends (structured JSON scorecard)
- [x] Scorecard UI: pass/retry, 6 sub-scores, compliance flags in red, coaching points
- [x] Retry button and attempt counter
- [x] Wire roleplay page into App.tsx routing

## Phase 3: Safety Branching Scenarios (P1)
- [x] Build 6 branching scenarios (aggressive owner, followed to car, back office, cash offer, phone while driving, unsafe location)
- [x] Each scenario: correct path + wrong branches with explanations
- [x] Mark as unskippable gate before final test
- [x] Wire safety page into App.tsx routing
- [x] Mark safetyCompleted on server when all scenarios passed

## Phase 4: Active Recall & Content (P1)
- [x] Add active recall slides with reveal-on-click to Day 1 and Day 2
- [x] Add Gatekeeper Playbook module to Day 2
- [x] Day 2 pricing ladder fix (removed $29/$49/$79 pricing, replaced with hand-off-to-Tim framing)
- [x] Content Capture Checklist slide added to Day 3

## Phase 5: Gating, Final Test, Debrief (P4)
- [x] Soft-gate Day 2 to unlock after Day 1 assignment completion
- [x] Soft-gate Day 3 to unlock after Day 2 assignment completion
- [x] Safety Scenarios gate before Final Test
- [x] Final Readiness Test with 10/10 required to pass
- [x] Retry logic for Final Test (unlimited retries)
- [x] Shift 1 Debrief form (unlocked after passing Final Test)

## Phase 6: Navigation & Polish
- [x] Update App.tsx with all new routes (roleplay, safety)
- [x] Update sidebar navigation with all sections (modules, safety, roleplay, final test, debrief)
- [x] Server-side progress sync via tRPC
- [x] Mobile-responsive layout throughout
- [x] Sign-in gate on all protected pages
- [x] 12 Vitest tests passing (training progress + roleplay + auth)

## Phase 7: Vercel Deployment
- [x] Migrate database from MySQL to PostgreSQL (Supabase-compatible)
- [x] Replace Manus OAuth with simple shared password gate
- [x] Create PasswordGate component with name + password form
- [x] Update server auth routes (POST /api/auth/login, POST /api/auth/logout)
- [x] Strip all Manus-specific env vars from the app
- [x] Configure vercel.json for full-stack Express + Vite deployment
- [x] 14 Vitest tests passing after auth migration
- [x] Production build verified (dist/public + api/server.js)
- [x] Push to GitHub to trigger Vercel deployment
