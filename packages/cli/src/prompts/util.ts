import { isCancel } from '@clack/prompts';
import { CancelError } from '../errors';

// Unwraps a @clack/prompts result, converting a cancellation (Ctrl-C) into a
// CancelError that the top-level handler turns into a clean exit.
export function unwrap<T>(value: T | symbol): T {
  if (isCancel(value)) {
    throw new CancelError();
  }
  return value as T;
}
