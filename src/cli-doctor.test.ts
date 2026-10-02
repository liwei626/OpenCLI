import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetDaemonHealth,
  mockSendCommand,
  mockSetDaemonCommandTimeoutSeconds,
  mockFindShadowedUserAdapters,
} = vi.hoisted(() => ({
  mockGetDaemonHealth: vi.fn(),
  mockSendCommand: vi.fn(),
  mockSetDaemonCommandTimeoutSeconds: vi.fn(),
  mockFindShadowedUserAdapters: vi.fn(),
}));

vi.mock('./browser/daemon-transport.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./browser/daemon-transport.js')>();
  return {
    ...actual,
    getDaemonHealth: mockGetDaemonHealth,
  };
});

vi.mock('./browser/daemon-client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./browser/daemon-client.js')>();
  return {
    ...actual,
    sendCommand: mockSendCommand,
    setDaemonCommandTimeoutSeconds: mockSetDaemonCommandTimeoutSeconds,
  };
});

vi.mock('./adapter-shadow.js', async () => {
  const actual = await vi.importActual<typeof import('./adapter-shadow.js')>('./adapter-shadow.js');
  return {
    ...actual,
    findShadowedUserAdapters: mockFindShadowedUserAdapters,
  };
});

import { createProgram } from './cli.js';
import { EXIT_CODES } from './errors.js';
import { PKG_VERSION } from './version.js';

const stdoutSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

function healthyDaemon() {
  // extensionVersion major must match PKG_VERSION major (compat fallback) and
  // must be implausibly high so no cached "update available" entry can fire.
  mockGetDaemonHealth.mockResolvedValue({
    state: 'ready',
    status: {
      daemonVersion: PKG_VERSION,
      extensionVersion: '1.999.0',
      profiles: [],
    },
  });
}

function stoppedDaemon() {
  mockGetDaemonHealth.mockResolvedValue({ state: 'stopped', status: null });
}

async function runDoctor(args: string[]): Promise<void> {
  const program = createProgram('', '');
  await program.parseAsync(['node', 'opencli', 'doctor', ...args]);
}

describe('doctor command: --format json and exit codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy.mockClear();
    stderrSpy.mockClear();
    process.exitCode = undefined;
    mockFindShadowedUserAdapters.mockReturnValue([]);
    // Live connectivity probe succeeds by default (daemon stopped elsewhere).
    mockSendCommand.mockResolvedValue([]);
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('emits a parseable DoctorReport JSON and exits non-zero when issues exist (SC-001, SC-002)', async () => {
    stoppedDaemon();

    await runDoctor(['-f', 'json']);

    const parsed = JSON.parse(stdoutSpy.mock.calls.flat().join('\n'));
    expect(parsed.daemonRunning).toBe(false);
    expect(parsed.extensionConnected).toBe(false);
    expect(Array.isArray(parsed.issues)).toBe(true);
    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(process.exitCode).toBe(EXIT_CODES.GENERIC_ERROR);
    expect(mockGetDaemonHealth).toHaveBeenCalled();
  });

  it('keeps stdout pure JSON when combined with -v (verbose goes to stderr)', async () => {
    stoppedDaemon();

    await runDoctor(['-f', 'json', '-v']);

    // Throws if verbose noise leaked into stdout.
    const parsed = JSON.parse(stdoutSpy.mock.calls.flat().join('\n'));
    expect(parsed).toHaveProperty('issues');
  });

  it('exits 0 and emits text by default when the bridge is healthy (FR-001, FR-003)', async () => {
    healthyDaemon();

    await runDoctor([]);

    const output = stdoutSpy.mock.calls.flat().join('\n');
    expect(output).toContain('doctor');
    expect(output).not.toMatch(/^\s*\{/);
    expect(process.exitCode).toBe(EXIT_CODES.SUCCESS);
  });

  it('rejects unknown --format values with exit code 2 without running checks', async () => {
    await runDoctor(['-f', 'yaml']);

    expect(process.exitCode).toBe(EXIT_CODES.USAGE_ERROR);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid format "yaml"'));
    expect(mockGetDaemonHealth).not.toHaveBeenCalled();
  });
});
