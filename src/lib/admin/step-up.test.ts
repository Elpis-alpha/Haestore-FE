import { describe, expect, it, vi } from 'vitest';
import { AdminError, StepUpCanceled, isStepUpRequired, withStepUp } from './step-up';

const stepUp = () => new AdminError(403, 'STEP_UP_REQUIRED', 'Confirm it is you.');

describe('withStepUp', () => {
  it('runs the action once when no step-up is needed', async () => {
    const action = vi.fn().mockResolvedValue('shipped');
    const confirm = vi.fn();

    await expect(withStepUp(action, confirm)).resolves.toBe('shipped');
    expect(action).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks for a code and retries the same action once the code is verified', async () => {
    const action = vi.fn().mockRejectedValueOnce(stepUp()).mockResolvedValueOnce('canceled');
    const confirm = vi.fn().mockResolvedValue(true);

    await expect(withStepUp(action, confirm)).resolves.toBe('canceled');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('stops, without retrying, when the person closes the dialog', async () => {
    const action = vi.fn().mockRejectedValue(stepUp());
    const confirm = vi.fn().mockResolvedValue(false);

    await expect(withStepUp(action, confirm)).rejects.toBeInstanceOf(StepUpCanceled);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('retries only once, so a second demand for a code surfaces instead of looping', async () => {
    const action = vi.fn().mockRejectedValue(stepUp());
    const confirm = vi.fn().mockResolvedValue(true);

    await expect(withStepUp(action, confirm)).rejects.toSatisfy(isStepUpRequired);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('never asks for a code for any other refusal', async () => {
    for (const error of [
      new AdminError(403, 'FORBIDDEN', 'No.'),
      new AdminError(409, 'CONFLICT', 'Already shipped.'),
      new Error('offline'),
    ]) {
      const confirm = vi.fn();
      await expect(withStepUp(() => Promise.reject(error), confirm)).rejects.toBe(error);
      expect(confirm).not.toHaveBeenCalled();
    }
  });
});
