# Tasks: doctor-json-output

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Implementation

- [x] T001 Keep default text report path unchanged when no `-f` flag is passed per FR-001
- [x] T002 Add `-f, --format <fmt>` option to the doctor command in `src/cli.ts`; when `fmt` is `json`, print `JSON.stringify(report, null, 2)` to stdout per FR-002 / SC-001
- [x] T003 Set `process.exitCode = EXIT_CODES.GENERIC_ERROR` when `report.issues.length > 0`, else 0 per FR-003 / SC-002
- [x] T004 Reject unknown format values with a usage error (exit code 2) per spec edge case
- [x] T005 Add unit tests in `src/doctor.test.ts` (JSON shape) and `src/cli.test.ts` (`-f json` end-to-end parse) — implemented as a dedicated `src/cli-doctor.test.ts` (4 tests) to keep cli.test.ts's file-wide mocks isolated

## Phase 2: Convergence

- [x] T006 Add `-f, --format <fmt>` option to `opencli doctor`; `json` prints the full `DoctorReport` via `JSON.stringify(report, null, 2)` per FR-002 / SC-001 (missing)
- [x] T007 Set `process.exitCode = EXIT_CODES.GENERIC_ERROR` when `report.issues.length > 0` (0 otherwise) in the doctor action per FR-003 / SC-002 (missing)
