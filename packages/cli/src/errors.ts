// A predictable, user-facing error. Anything thrown as a CliError is rendered
// as a clean message (+ optional actionable hint) with a non-zero exit — never
// a raw stack trace. Unexpected errors stay plain Error and are treated as
// bugs (see index.ts).
export class CliError extends Error {
  readonly hint?: string;

  constructor(message: string, hint?: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'CliError';
    this.hint = hint;
  }
}

export function isCliError(err: unknown): err is CliError {
  return err instanceof CliError;
}

// Thrown when the user aborts a prompt (Ctrl-C). Treated as a clean, non-error
// exit by the top-level handler.
export class CancelError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'CancelError';
  }
}

export function isCancelError(err: unknown): err is CancelError {
  return err instanceof CancelError;
}
