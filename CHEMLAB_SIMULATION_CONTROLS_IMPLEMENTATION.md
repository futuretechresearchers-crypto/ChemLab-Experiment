# CHEMLAB Simulation Controls — implementation proposal

## Schema status

`public.simulation_controls` was not found in the current source tree, and no approved production schema or authenticated role model is present. `CHEMLAB_SIMULATION_CONTROLS_MIGRATION.sql` is a proposal only and has not been executed.

## Inspected current implementation

- `src/lib/supabase.ts` is the sole browser-safe Supabase client.
- `src/components/ChemLabSimulator.tsx` is the active simulator.
- `src/App.tsx` contains a local-only teacher view but no auth or role source.
- No simulation profile service, page, controls table, Quick Combine control, or reusable hint-control component exists.
- The active simulator currently uses a 45-second timer, CSS atom motion, staged reaction feedback, and an inline octet panel.

## Proposed files after schema approval

- `src/types/simulationControl.ts` — shared profile type and safe default values.
- `src/lib/simulationControls.ts` — reads, CRUD, and a transactional/RPC-backed activation operation using the existing Supabase client.
- `src/components/teacher/SimulationControls.tsx` — profile list and editor.
- `src/hooks/useSimulationControl.ts` — resilient active-profile loading with defaults.
- `src/components/ChemLabSimulator.tsx` — consume the resolved profile only; chemistry engine remains unchanged.

## Active-profile behavior

Activation must be one database transaction or an approved RPC function: clear the current active row and activate the target row atomically. The partial unique index in the proposal protects the at-most-one-active invariant.

## Simulator mapping

| Profile field | Existing simulator integration point |
| --- | --- |
| `workspace_size` | Responsive visual workspace dimensions only; preserve chemistry coordinates. |
| `timer_duration` | Existing countdown initialization/reset behavior. |
| `atom_speed` | Existing orbital/visual animation timing only. |
| `collision_detection` | Existing physical boundary behavior, if a concrete boundary layer is introduced; never reaction validation. |
| `quick_combine_default` | Initial student-controlled Quick Combine UI state. |
| `show_hints` | Optional compatible-element guidance only; never validation/error feedback. |

Safe fallback when profile loading fails or no active row exists: workspace `4`, timer `15`, collision detection `true`, Quick Combine `false`, atom speed `1`, hints `true`.

## RLS requirement

The project currently has no canonical teacher/admin identity field or auth provider usage. The proposal enables RLS and permits authenticated users to read only active profiles. No write policy is supplied because inventing a role predicate would be unsafe. An approved role source is required before enabling teacher/admin profile CRUD.

## No changes made

No source component, chemistry engine, Supabase client, package file, environment file, or database was modified. No SQL was executed.

## Required approval before implementation

1. Approve and apply the proposed schema after reviewing it in Supabase.
2. Provide or approve the canonical teacher/admin role source for RLS.
3. Approve the activation RPC/transaction strategy.

After those decisions, implement the service, teacher controls page, and active-profile simulator integration, then run build and interaction tests.
