# CHEMLAB Deployment Audit

Audit date: 2026-10-01  
Audit mode: read-only analysis. The only artifact created was this audit report. No application source, deployment configuration, environment file, database, or Git state was changed.

## 1. Executive assessment

CHEMLAB is a functioning Vite, React, and TypeScript prototype with a polished local simulation experience and a small, deterministic reaction engine. It is not yet production-ready for a thesis deployment that requires authenticated student and teacher workflows, durable data, controlled administrative access, accurate simulation configuration, and reliable history.

Overall readiness score: 47 / 100

The immediate deployment risk is not that the static client will fail to build: it does build successfully. The risk is that the user-facing labels imply a complete learning platform while the implementation remains browser-local and does not enforce identity, permissions, persistence, or exact chemistry rules.

## 2. Scope and evidence

Reviewed project location: C:\laragon\www\chem

The audit inspected source files, package and Vite configuration, environment-variable names only, tests, generated build output, migration proposals, and repository metadata. Secret values were not read or printed.

Verification performed:

- npm.cmd test completed successfully: 7 tests in 1 test file passed.
- npm.cmd run build completed successfully.
- The production bundle was emitted successfully by Vite.
- No .git directory is present in the project root; no Git operation was performed.

## 3. Architecture overview

The deployed application is a client-side single-page React application:

    index.html
      -> src/main.tsx
      -> src/App.tsx
      -> active src/components/ChemLabSimulator.tsx
      -> src/engine/reactionEngine.ts and src/engine/lewisEngine.ts

App.tsx owns page switching and role switching with component state. The active screens are lab, quizzes, teacher, and profile. There is no route library, backend API layer, session provider, authentication guard, or server-side role validation.

The active simulator uses:

- src/components/ChemLabSimulator.tsx
- src/components/PeriodicTable.tsx
- src/components/OctetPanel.tsx
- src/components/CompoundVisual.tsx
- src/engine/reactionEngine.ts
- src/engine/lewisEngine.ts
- src/data/elementData.ts

There is also an alternative src/components/ChemSim.tsx and a chemsim/ReactionBook.tsx component. Neither is imported by the active application path, so they are currently dead or future-facing code rather than deployed functionality.

## 4. Major findings

### 4.1 Critical: authentication and authorization are absent

The UI can change its role from student to teacher through local React state. This is a presentation switch, not an authenticated session or permission boundary. Any visitor can select the teacher view in the browser.

Impact:

- Teacher administration is publicly reachable in the client.
- There is no student identity to associate with attempts, scores, or quiz activity.
- Role labels cannot be relied upon for access control.
- A thesis deployment cannot truthfully claim secure role-based access at this stage.

Required remediation:

1. Implement Supabase Auth or another authentication service.
2. Persist role data outside the browser and obtain it only after session validation.
3. Protect teacher-only data and mutations with database Row Level Security and server-verified authorization.
4. Make the UI role reflect the validated role rather than control it.

### 4.2 Critical: Supabase is configured but not integrated

src/lib/supabase.ts creates a Supabase client and validates that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are present. The module is not imported by the active application path.

The environment file contains the expected variable names, but no active source flow reads or writes application data through Supabase.

Impact:

- No real data persistence exists.
- Credentials being present creates an expectation of backend connectivity that the product does not fulfill.
- Deployment can appear configured while all feature data still disappears with browser storage or reload.

Required remediation:

- Add domain modules for auth, profiles, attempts, quiz content, controls, and simulation history.
- Introduce loading, error, and offline states.
- Verify RLS using an unauthenticated client and authenticated accounts with both roles.

### 4.3 Critical: teacher content and student state are browser-local

The teacher screen saves quiz text to localStorage. It is not associated with a teacher, class, student, database record, or server-side authorization. The active simulation stores its history in component state only.

Impact:

- Content is local to a single browser profile.
- Clearing browser storage erases teacher-created content.
- Students cannot receive shared assignments.
- Results cannot be audited or used for a thesis data set.

Required remediation:

- Store quiz, assignment, attempt, and result records in Supabase.
- Define ownership, visibility, class or section membership, and retention behavior.
- Save only validated, minimal event/result data needed for assessment.

### 4.4 Critical: reaction matching accepts invalid extra stoichiometry

reactionEngine.ts matches an input when each required atom count is present and the set of element symbols matches. It does not require input counts to equal the recipe counts.

For example, an H-H-H-O selection can satisfy the water definition because it includes at least two H and one O and has no additional element type. It may be treated as H2O even though one hydrogen is unaccounted for.

Impact:

- The simulator can display chemically misleading products.
- Results and score data would be unreliable if persisted.
- This contradicts an expectation of exact reactant consumption or controlled leftovers.

Required remediation:

1. Compare atom counts for exact equality when the mode expects one exact reaction.
2. If excess atoms are supported, explicitly calculate consumed atom IDs and leave the excess atoms unreacted.
3. Add tests for excess counts, duplicate products, partial matches, and multiple simultaneous candidate reactions.

### 4.5 High: simulation actions can race with scheduled phases

ChemLabSimulator schedules reaction phases with timeouts. The add action remains available during validation and animation, and it does not cancel the existing timeout chain. A late-added atom can therefore be included in a later state update even though the validation result was calculated from an earlier atom list.

Impact:

- The visual product can disagree with the validated reaction.
- A participant can create confusing or inconsistent simulation state.
- Timing-dependent bugs are likely during demonstrations.

Required remediation:

- Disable atom additions, removal, and re-analysis while a transaction is running, or implement a transaction ID and cancel stale callbacks.
- Use a reducer or explicit state machine with legal transitions.
- Store atom IDs used by the validated reaction and apply phase updates only to those IDs.

### 4.6 High: current simulation controls proposal is not active

The repository contains CHEMLAB_SIMULATION_CONTROLS_MIGRATION.sql and CHEMLAB_SIMULATION_CONTROLS_IMPLEMENTATION.md. They are proposals and are not connected to the live simulator. The simulator uses a local 45-second timer rather than an administrator-defined persisted setting.

The proposed migration enables RLS and supplies a student read policy, but the teacher policy remains commented out. It should not be treated as a finished production schema.

Impact:

- The claimed administrative control surface is not implemented.
- Time limits and feature flags cannot be reliably governed.
- A migration run unchanged could leave required management workflows blocked.

Required remediation:

- Finalize the schema, policies, roles, indexes, and validation.
- Build a teacher-only management UI.
- Load active controls from the backend before a session begins and record the effective control version with each attempt.

### 4.7 High: no error boundary, route fallback, or production observability

The application has no React error boundary, centralized error handling, health endpoint, client error reporting, or analytics/telemetry. Vite static hosting can serve the app, but no deployment configuration is supplied for host rewrites, security headers, cache strategy, or error monitoring.

Impact:

- Production failures will become blank or partially broken pages without actionable diagnostics.
- Direct-link and hosting behavior depends on the host's defaults.
- The thesis team has little evidence for debugging real user incidents.

Required remediation:

- Add an application error boundary and human-readable recovery UI.
- Add structured client error reporting with privacy controls.
- Document the chosen static host and include its routing/header configuration.

## 5. Frontend and UX assessment

Strengths:

- The active simulator has clear visual stages and a coherent interactive layout.
- The periodic table supports discovery, filtering, and selection.
- The product/compound visual improves the final result presentation.
- Styles are organized into dedicated simulation, modal, control, and compound visual sheets.

Risks:

- App.tsx combines navigation, role switching, teacher tools, profile display, and local storage behavior in one component.
- Page navigation is local state rather than URL navigation. Refresh, deep links, browser back/forward behavior, and shareable screen links are not supported.
- The teacher switch visually normalizes an unsafe capability model.
- The requestAnimationFrame loop updates React state roughly 30 times per second for orbital rotation. This may cause avoidable rendering work on lower-powered school devices.
- Source files are densely formatted, which slows review and increases merge and maintenance risk.
- OctetPanel retains a phase name not present in the active simulation state set, suggesting state nomenclature drift.

Recommended frontend direction:

- Adopt React Router with authenticated route guards.
- Split App.tsx into layout, navigation, auth/session, teacher, quiz, and profile modules.
- Centralize simulation transitions in a reducer/state machine.
- Prefer CSS animation or a canvas-managed frame loop for decorative motion rather than high-frequency React state updates.

## 6. Simulation and chemistry assessment

Current capability:

- The engine contains a local seed list of supported reactions.
- It detects a limited set of simple compounds and returns formula, name, bond type, polarity, description, and reaction metadata.
- Lewis structures are template-driven for known formulas.
- Tests cover water, lithium oxide, a missing-reactant candidate, an unsupported carbon/oxygen pair, CO2 polarity, nitrogen triple bond metadata, and empty input.

Limits that should be disclosed:

- This is a curated reaction recognizer, not a general chemistry simulation.
- It does not calculate molecular geometry, reaction energetics, kinetics, conservation balancing, charge, or arbitrary bonding graphs.
- Lewis structures are fixed templates, not a general-purpose Lewis-structure solver.
- Atom motion is staged UI animation, not physical collision or force simulation.
- Unsupported valid reactions are rejected unless entered into the seed catalog.

Recommended domain model:

    Element -> selected atom -> reaction candidate -> exact consumed atom IDs
      -> validated product -> visual phase sequence -> persisted attempt/result

The reaction engine should expose explicit values for consumed IDs, leftover IDs, reaction ID/version, validation diagnostics, and product rendering data. A separate domain layer should decide whether a partial match is permitted.

## 7. Data model and Supabase readiness

No active database schema exists in the application. The included SQL is limited to proposed simulation controls.

Minimum data entities for production:

- profiles: user ID, display fields, role, activation state
- sections or classes: teacher ownership and enrollment
- quizzes: author, content, status, schedule, audience
- quiz_items and quiz_attempts: questions, answers, scoring, timestamps
- simulation_controls: versioned policy values and effective period
- simulation_attempts: actor, control version, raw selected atoms, validation outcome, reaction ID, duration, score, timestamp
- audit_events: teacher administrative changes where required by the research protocol

RLS principles:

- Students can read their own profile, enrolled content, active controls, and their own attempts.
- Teachers can manage only their own classes and their class content.
- Teachers should not automatically gain access to all student data outside their classes.
- Privileged writes must be backed by database policy, not hidden UI buttons.
- Admin bootstrap and role assignment need a controlled process, preferably server-side or by protected database functions.

## 8. Security assessment

Positive observations:

- Environment files are ignored by .gitignore.
- No service-role key or obvious secret was found in application source during this audit.
- No raw HTML injection API usage was found in active source.
- No active code was found pointing to Laragon, PHP, MySQL, Base44, or a localhost backend.

Important caveats:

- A Supabase publishable/anon key is intended for a browser, but it is safe only when RLS and policies are correct. It must never be confused with a service-role key.
- Client-side role state is not authorization.
- localStorage is not a secure store for permissions, sensitive records, or authoritative academic data.
- There is no content security policy, security header configuration, CSRF approach for any future server endpoints, rate limiting, or abuse strategy.

Security actions before public release:

1. Verify all Supabase tables have RLS enabled.
2. Test policy behavior with anonymous, student, teacher, and administrator sessions.
3. Use no service-role secret in Vite variables or browser code.
4. Add CSP and standard security headers at the host.
5. Establish data-retention, consent, and privacy rules appropriate for student research data.

## 9. Performance and compatibility

Build output is moderate for a prototype: the JavaScript bundle is approximately 247 KB before transfer compression and the CSS bundle approximately 22 KB. The application has no image-heavy dependency in its active path.

Risks and opportunities:

- No lazy loading is used for secondary screens or larger visual features.
- Frequent React state updates for visual rotation may reduce responsiveness on older devices.
- The 118-element table and drag interactions should be tested on touch screens, common school laptops, and small mobile widths.
- There is no automated accessibility or cross-browser test coverage.

Recommendation:

- Profile the simulation on representative classroom hardware.
- Add responsive and keyboard tests before a mobile or lab deployment claim.
- Use route/component lazy loading after functional correctness is established.

## 10. Test and quality assessment

Current tests:

- 7 unit tests, all passing.
- Tests exercise only reaction engine behavior, not components, flows, persistence, access control, modal behavior, timer expiry, or user roles.

Build caveat:

The build command runs tsc --noEmit, but tsconfig.json enables noCheck. This suppresses normal TypeScript semantic checking, so a green build should not be interpreted as a full type-safety verification.

Required quality gates:

- Remove noCheck and resolve resulting type errors.
- Add component and interaction tests for selection, reset, timeout, invalid reaction, valid reaction, and race protection.
- Add end-to-end tests for student and teacher paths once auth is introduced.
- Add Supabase policy tests or a repeatable policy verification script.
- Add accessibility checks for keyboard operation, focus management, color contrast, and screen-reader labels.

## 11. Deployment configuration assessment

Current deployment assets:

- Vite build configuration exists.
- Vite development server is intentionally bound to localhost on port 5173.
- No host-specific deployment manifest was found.
- No CI workflow, Docker configuration, environment template, README, hosting guide, or deployment checklist was found.

The localhost setting applies to the Vite development server and does not itself block a static production deployment. However, the project needs a documented target host and configuration before it can be called deployment-ready.

Recommended hosting options:

- Vercel, Netlify, or Cloudflare Pages for a static Vite front end.
- Supabase for authentication and database functions/data.

Needed deployment artifacts:

- README with local setup, environment-variable names, build command, preview command, and deployment steps
- .env.example containing variable names only
- host rewrite/fallback rules if routing is introduced
- security headers and cache rules
- CI workflow running install, type check, test, and build
- release checklist with environment and RLS verification

## 12. Abandoned and duplicate implementation risks

The active product uses ChemLabSimulator.tsx. ChemSim.tsx provides another simulator approach and ReactionBook.tsx provides recipe UI, but neither is wired into the live application.

Keeping alternate implementations may be reasonable during exploration, but it creates ambiguity:

- Developers may patch a simulator that users never execute.
- Test coverage can accidentally target inactive behavior.
- The project’s stated product scope becomes harder to verify.

After preserving needed ideas, choose one canonical simulator architecture and either integrate or retire the unused path in a separately approved cleanup change.

## 13. Prioritized remediation plan

### Phase 0: pre-deployment truthfulness

- Add a prototype notice if the application will be shown before backend completion.
- Do not present teacher access, shared quizzes, history, or controls as deployed capabilities until they are real.
- Fix exact reaction count matching and animation race conditions.

### Phase 1: foundation

- Add authentication, profile roles, route guards, and backend-connected session state.
- Design and deploy the minimum Supabase schema and RLS policies.
- Add .env.example, setup documentation, and CI quality gates.
- Remove noCheck and restore meaningful TypeScript checking.

### Phase 2: academic workflows

- Implement teacher-controlled quizzes, sections, publishing, and student submissions.
- Persist versioned simulation controls and attempts.
- Add result history and role-limited reporting.

### Phase 3: hardening

- Add error boundaries, telemetry, accessibility review, responsive testing, and performance profiling.
- Test RLS and role boundaries under real hosted conditions.
- Document privacy, retention, consent, and operational support processes.

## 14. Release decision

Decision: not ready for a public or thesis-data-collection deployment.

Acceptable current use:

- Local demonstration
- UI and simulation prototype review
- Controlled presentation where it is clearly described as a client-side prototype

Not acceptable without remediation:

- Collecting student identity or research data
- Claiming secure teacher administration
- Shared classroom quizzes or student records
- Persisted simulation assessment
- Public deployment presented as a completed learning-management workflow

## 15. Positive progress to retain

The project has several strong foundations worth retaining:

- The Vite/React app builds cleanly.
- The simulator has an approachable visual narrative.
- The periodic table and compound result display create a compelling instructional interface.
- The reaction engine already has focused unit tests.
- Environment variables are separated from source and ignored by Git rules.
- The project is no longer coupled to the unrelated attendance/PHP stack.

The right next move is to preserve this front-end experience while putting the product claims on a secure, persistent, testable backend foundation.

## 16. Audit limitations

This report is based on static source review and local test/build verification. It did not connect to Supabase, inspect database state, deploy to a hosting provider, inspect production headers, run a browser automation suite, or evaluate real users. Those activities should be completed during the next approved implementation and staging phase.
