# Feature Specification: doctor-json-output

**Feature Branch**: `001-doctor-json-output`
**Created**: 2026-10-02

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Script-friendly doctor output (Priority: P1)

As an automation user / CI pipeline, I want `opencli doctor -f json` to emit a
machine-readable report so that scripts can branch on daemon/extension state
without parsing human text.

**Why this priority**: Agents and CI are first-class consumers of opencli;
today only the `list` command supports `-f json`.

**Independent Test**: Run `opencli doctor -f json`, pipe to `ConvertFrom-Json`,
assert `daemonRunning`, `extensionConnected` fields exist.

**Acceptance Scenarios**:

1. **Given** the browser bridge is healthy, **When** I run `opencli doctor -f json`,
   **Then** stdout is a single valid JSON object with all DoctorReport fields
   (cliVersion, daemonRunning, extensionConnected, connectivity, issues, …)
2. **Given** the daemon is stopped, **When** I run `opencli doctor -f json`,
   **Then** `daemonRunning` is `false` and `issues` contains a daemon entry

### User Story 2 - CI-gateable exit code (Priority: P2)

As a CI maintainer, I want `opencli doctor` to exit non-zero when issues are
found, so a job step can fail on unhealthy environments.

**Acceptance Scenarios**:

1. **Given** doctor finds at least one issue, **When** the command completes,
   **Then** process exit code is non-zero
2. **Given** doctor finds no issues, **When** the command completes,
   **Then** exit code is 0

## Edge Cases

- `-f json` combined with `-v` still emits pure JSON on stdout (verbose goes to stderr)
- Unknown format value (e.g. `-f yaml`) prints a usage error with exit code 2

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST print the existing human-readable doctor report by
  default (current behavior preserved).
- **FR-002**: System MUST accept `-f, --format <fmt>` on `opencli doctor` with
  at least `text` (default) and `json`; `json` MUST serialize the full
  `DoctorReport` object as pretty-printed JSON to stdout.
- **FR-003**: System MUST set a non-zero process exit code when `issues` is
  non-empty, and 0 otherwise (exit code semantics must match other commands'
  `EXIT_CODES.GENERIC_ERROR`).

### Success Criteria *(mandatory)*

- **SC-001**: `opencli doctor -f json | ConvertFrom-Json` succeeds and exposes
  boolean `daemonRunning` / `extensionConnected` fields.
- **SC-002**: A doctor run against a stopped daemon exits with code 1.
