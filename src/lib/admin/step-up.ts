/**
 * Step-up, from the console's side.
 *
 * The API answers a destructive admin action with 403 `STEP_UP_REQUIRED` when the session's
 * last verified code is more than twelve hours old — and, deliberately, not with a 401,
 * because the session is fine and whatever the person was doing must survive. So the
 * console's job is: notice that one answer, ask for a fresh code without leaving the page,
 * and send the original request again.
 *
 * This file is that loop and nothing else, so it can be tested as a loop.
 */

export class AdminError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

/** The person closed the code dialog. Not a failure to report, only to stop on. */
export class StepUpCanceled extends Error {
  constructor() {
    super('Step-up was canceled.');
    this.name = 'StepUpCanceled';
  }
}

export function isStepUpRequired(error: unknown): boolean {
  return error instanceof AdminError && error.status === 403 && error.code === 'STEP_UP_REQUIRED';
}

/**
 * Runs `action`; if the API wants a fresh code, gets one and runs it **exactly once more**.
 *
 * Once, not until it works. A second `STEP_UP_REQUIRED` immediately after a code was
 * verified means something is wrong — a clock, a session that was replaced mid-flight — and
 * looping would put the person back in front of the code dialog forever. It surfaces as an
 * ordinary error instead.
 */
export async function withStepUp<T>(
  action: () => Promise<T>,
  confirmIdentity: () => Promise<boolean>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (!isStepUpRequired(error)) throw error;
    if (!(await confirmIdentity())) throw new StepUpCanceled();
    return action();
  }
}
