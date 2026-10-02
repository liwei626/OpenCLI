# Implementation Plan: doctor-json-output

**Branch**: `001-doctor-json-output` | **Spec**: [spec.md](./spec.md)

## Summary

Add structured output (`-f text|json`) and issue-driven exit codes to the
`opencli doctor` command, reusing the existing `DoctorReport` interface.

## Technical Decisions

- Reuse the existing `DoctorReport` interface in `src/doctor.ts` — no new data
  model; JSON mode is `JSON.stringify(report, null, 2)`.
- Register the flag in `src/cli.ts` on the doctor command (`.option('-f, --format <fmt>', …)`),
  mirroring how `list` already wires `-f json`.
- Exit code uses the shared `EXIT_CODES.GENERIC_ERROR` constant.
- Text renderer (`renderBrowserDoctorReport`) is untouched — zero regression
  risk for the default path.

## Affected Files

- `src/cli.ts` — doctor command: add `-f/--format` option, JSON emission path,
  exit-code logic
- `src/doctor.ts` — (only if a `DoctorReport` field needs sanitizing for JSON)
- `src/doctor.test.ts` — unit tests for JSON shape and exit-code semantics
- `src/cli.test.ts` — command-level test that `-f json` parses

## Phase 1: Implementation

Touch-points: `src/cli.ts` (doctor command action), `src/doctor.ts`,
`src/doctor.test.ts`, `src/cli.test.ts`.
