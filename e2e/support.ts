import {
  expect,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

/**
 * What every flow needs: a way in, read the way a person reads their mail.
 *
 * Codes come from the API's development outbox (`/api/dev/outbox`), which exists only
 * outside production and only holds mail when `MAIL_DRIVER=console`. Reading it through the
 * storefront's own `/api` rewrite means the suite needs one address, not two.
 *
 * **The sign-in throttle is real here, and the suite lives within it.** Codes are limited to
 * one a minute and five an hour per address, and twenty an hour per IP, and a withheld
 * request answers exactly like a sent one (AUTH.md). So each address signs in once per run
 * and the session is reused; a second real sign-in — the one the bag merge needs — waits out
 * the minute as a person would; and a code withheld by the hourly limit fails with the limit
 * named, rather than as a code that never came.
 */

export const ADMIN_EMAIL = 'keeper@haestore.test';
const RESEND_COOLDOWN_MS = 60_000;

/** An address nobody has used, so each run is a new customer. `.test` never resolves. */
export function freshEmail(label: string): string {
  return `e2e.${label}.${Date.now().toString(36)}@example.test`;
}

/** As `back-end/src/mail/dev-outbox.ts` records it: newest first, stamped `sentAt`. */
type OutboxEntry = { to: string; subject: string; sentAt: string };

async function newestTo(request: APIRequestContext, email: string) {
  const response = await request.get('/api/dev/outbox');
  expect(response.ok(), 'GET /api/dev/outbox — is the API running outside production?').toBe(true);
  const { data } = (await response.json()) as { data: OutboxEntry[] };
  return data.find((entry) => entry.to === email);
}

async function codeSentSince(
  request: APIRequestContext,
  email: string,
  since: number,
  waitMs: number,
): Promise<string | null> {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    const entry = await newestTo(request, email);
    if (entry && Date.parse(entry.sentAt) >= since - 1_000) {
      return /\b(\d{6})\b/.exec(entry.subject)?.[1] ?? null;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

/**
 * Signs in through the real door: the form, the code, the six boxes. Ends wherever the
 * sign-in page sends a person, which is the `next` it was opened with.
 */
export async function signIn(page: Page, email: string, next = '/account'): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const requestedAt = Date.now();
    await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send me a code' }).click();
    const boxes = page.getByRole('group', { name: 'Six-digit code' });
    await expect(boxes).toBeVisible();

    const code = await codeSentSince(page.request, email, requestedAt, 8_000);
    if (code) {
      // Six single-digit boxes that advance as they fill and submit on the sixth, so the
      // code is typed rather than filled — which is also how a person enters it.
      await boxes.getByRole('textbox').first().click();
      await page.keyboard.type(code, { delay: 40 });
      await expect(page).not.toHaveURL(/\/sign-in/);
      return;
    }

    const last = await newestTo(page.request, email);
    const sinceLast = last ? Date.now() - Date.parse(last.sentAt) : Number.POSITIVE_INFINITY;
    if (attempt === 2 || sinceLast > RESEND_COOLDOWN_MS + 2_000) break;
    await page.waitForTimeout(RESEND_COOLDOWN_MS + 2_000 - sinceLast);
  }

  throw new Error(
    `No sign-in code reached ${email}. Past the one-minute cooldown, that is the hourly limit ` +
      '(five requests per address, twenty per IP), which withholds codes silently by design. ' +
      'Wait for the hour, or clear the otp:rl:* keys in Redis.',
  );
}

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;
const sessions = new Map<string, StorageState>();

/**
 * A context signed in as this address. The first call signs in; later calls in the same run
 * reuse the session it made, which is what keeps a run inside the throttle.
 */
export async function signedIn(
  browser: Browser,
  email: string,
  next: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const state = sessions.get(email);
  const context = await browser.newContext(state ? { storageState: state } : {});
  const page = await context.newPage();
  if (state) await page.goto(next);
  else await signIn(page, email, next);
  sessions.set(email, await context.storageState());
  return { context, page };
}

/** Keeps a context's session for later `signedIn` calls, after a sign-in made some other way. */
export async function remember(email: string, context: BrowserContext): Promise<void> {
  sessions.set(email, await context.storageState());
}
