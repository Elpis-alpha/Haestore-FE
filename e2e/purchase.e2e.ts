import { expect, test, type Page } from '@playwright/test';
import { ADMIN_EMAIL, freshEmail, remember, signIn, signedIn } from './support';

/**
 * The whole purchase, as the plan describes it, against the seeded shop:
 *
 *   filter a shelf → a product → the bag, as a guest → sign in, and the guest bag merges
 *   into the one the account already had → pay with a Stripe test card → the order is in
 *   the account → the console packs, ships and delivers it → the customer reviews it.
 *
 * **Nothing forwards Stripe's webhooks while this runs.** The order is marked paid by the
 * return page asking Stripe what happened (`reconcile`), which is the fallback the plan asked
 * to be proven — if it did not work, the order would stay "awaiting payment" and the test
 * would fail at the confirmation.
 */

const customer = freshEmail('buyer');
let orderNumber = '';

test.describe.serial('a purchase, end to end', () => {
  test('a returning customer’s bag and a guest bag become one, and it is paid for', async ({
    browser,
  }) => {
    // Earlier: the customer signs in and leaves a mug in their bag.
    const earlier = await signedIn(browser, customer, '/product/everyday-mug');
    await addToBag(earlier.page);
    await earlier.context.close();

    // Today, signed out: they find a coffee through the filters and add it.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/shop/coffee-tea/coffee');
    await expect(page.getByRole('heading', { level: 1, name: 'Coffee' })).toBeVisible();

    const everything = await itemCount(page);
    await openFilter(page, 'Roast');
    await page.getByRole('checkbox', { name: /^Light/ }).click();
    await expect(page).toHaveURL(/roast=light/);
    await expect.poll(() => itemCount(page)).toBeLessThan(everything);

    await page
      .getByRole('link', { name: /Guji Natural/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Guji Natural' })).toBeVisible();
    await expect(page.getByText(/^Photo by .+ on Unsplash$/)).toBeVisible();
    await addToBag(page);

    // Signing in, in the guest's own browser, merges the two bags and says so. This is the
    // one sign-in a stored session cannot stand in for.
    await signIn(page, customer, '/cart');
    await remember(customer, context);
    await expect(page.getByRole('heading', { name: 'We combined your bags' })).toBeVisible();
    await page.getByRole('button', { name: 'Looks right' }).click();
    await expect(page.getByText('Everyday Mug').first()).toBeVisible();
    await expect(page.getByText('Guji Natural').first()).toBeVisible();

    // Paying, with no webhook in sight.
    await page.goto('/checkout');
    // Checkout asks every customer for a receipt address, signed in or not.
    await page.getByLabel('Email', { exact: true }).fill(customer);
    await page.getByLabel('Full name').fill('Ada Tester');
    await page.getByLabel('Address', { exact: true }).fill('1 Test Street');
    await page.getByLabel('Town or city').fill('York');
    await page.getByLabel('Postcode (optional)').fill('YO1 7HT');
    await page.getByLabel('Country').fill('GB');
    await page.getByRole('button', { name: 'Pay by card' }).click();

    await payWithTestCard(page);

    await expect(page.getByText('Thank you — your order is confirmed.')).toBeVisible({
      timeout: 60_000,
    });
    const confirmation = await page
      .getByText(/Order HAE-/)
      .first()
      .innerText();
    orderNumber = /HAE-[0-9A-Z]{8}/.exec(confirmation)![0];

    await page.getByRole('link', { name: 'Your orders' }).click();
    await expect(page.getByText(orderNumber).first()).toBeVisible();
    await context.close();
  });

  test('the console packs, ships and delivers it', async ({ browser }) => {
    test.skip(!orderNumber, 'needs the order from the previous test');
    const { context, page } = await signedIn(
      browser,
      ADMIN_EMAIL,
      `/admin/orders?q=${orderNumber}`,
    );

    await page.getByRole('link', { name: orderNumber }).first().click();
    for (const [action, done] of [
      ['Start packing', 'Marked as packing'],
      ['Mark shipped', 'Marked as shipped'],
      ['Mark delivered', 'Marked as delivered'],
    ] as const) {
      await page.getByRole('button', { name: action }).click();
      await expect(page.getByText(done).first()).toBeVisible();
    }
    await context.close();
  });

  test('the customer reviews what arrived', async ({ browser }) => {
    test.skip(!orderNumber, 'needs the order from the previous tests');
    const { context, page } = await signedIn(browser, customer, `/account/orders/${orderNumber}`);

    await page.getByRole('link', { name: 'Review it' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: /^5 stars/ }).click();
    await dialog.getByLabel('Headline (optional)').fill('Arrived and was lovely');
    await dialog.getByLabel('Review (optional)').fill('Written by the end-to-end suite.');
    await dialog.getByRole('button', { name: 'Publish review' }).click();
    // Closed, and staying closed: the page used to reopen it at once as "Edit your review".
    await expect(page).not.toHaveURL(/write=/);
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Arrived and was lovely')).toBeVisible();

    await page.goto('/account/reviews');
    await expect(page.getByText('Arrived and was lovely')).toBeVisible();
    await context.close();
  });
});

async function addToBag(page: Page): Promise<void> {
  const add = page.getByRole('button', { name: 'Add to bag' });
  await expect(add).toBeEnabled();
  await add.click();
  // The drawer opening is the confirmation.
  await expect(page.getByRole('heading', { name: 'Your bag' })).toBeVisible();
  await page.keyboard.press('Escape');
}

/** A filter's section of the panel, opened if it is closed; a closed one is not in the tree. */
async function openFilter(page: Page, name: string): Promise<void> {
  const trigger = page.getByRole('button', { name, exact: true });
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
}

async function itemCount(page: Page): Promise<number> {
  const text = await page
    .getByText(/^\d+ items?$/)
    .first()
    .innerText();
  return Number.parseInt(text, 10);
}

/**
 * Stripe's Payment Element lives in iframes Stripe owns, so its fields are found by the
 * placeholders Stripe renders. 4242 4242 4242 4242 succeeds without a challenge.
 */
async function payWithTestCard(page: Page): Promise<void> {
  const frame = page.frameLocator('iframe[title="Secure payment input frame"]').first();
  await frame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242', { timeout: 60_000 });
  await frame.getByPlaceholder(/MM \/ YY/).fill('12 / 34');
  await frame.getByPlaceholder('CVC').fill('123');
  const postcode = frame.getByLabel(/postal code|ZIP|postcode/i);
  if (await postcode.isVisible().catch(() => false)) await postcode.fill('YO1 7HT');
  await page.getByRole('button', { name: 'Pay now' }).click();
}
