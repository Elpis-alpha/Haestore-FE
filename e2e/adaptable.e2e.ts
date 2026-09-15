import { expect, test, type Page } from '@playwright/test';
import { ADMIN_EMAIL, signedIn } from './support';

/**
 * **The proof that the adaptable claim holds**, as the plan put it: an admin defines a fact
 * the shop has never had, binds it to a shelf, says it of one product — and a filter for it
 * appears on that shelf, with a count, and narrows the listing. Nobody deploys anything.
 *
 * The attribute's key carries the run's timestamp so the suite can run against the same
 * database twice, and it is archived at the end so repeated runs do not leave a row of
 * test filters on the shop.
 */

const stamp = Date.now().toString(36);
const label = `Thrown on a kick wheel ${stamp}`;
const key = `e2e_kick_wheel_${stamp}`.slice(0, 40);
let attributePath = '';

test.describe.serial('an attribute defined in the console becomes a filter', () => {
  test.afterAll(async ({ browser }) => {
    if (!attributePath) return;
    const { context, page } = await signedIn(browser, ADMIN_EMAIL, attributePath);
    const archive = page.getByRole('button', { name: 'Archive' });
    if (await archive.isVisible().catch(() => false)) await archive.click();
    await context.close();
  });

  test('define it, bind it, say it of a product, and filter by it', async ({ browser }) => {
    const { context, page } = await signedIn(browser, ADMIN_EMAIL, '/admin/catalog/attributes/new');

    // Define: a yes-or-no fact, offered as a filter.
    await page.getByLabel('Label', { exact: true }).fill(label);
    await page.getByLabel('Key', { exact: true }).fill(key);
    await page
      .getByRole('radiogroup', { name: 'Kind' })
      .getByRole('radio', { name: /Yes or no/ })
      .click();
    const filterable = page.getByRole('switch', { name: 'Offer it as a filter' });
    if ((await filterable.getAttribute('aria-checked')) !== 'true') await filterable.click();
    await page.getByRole('button', { name: 'Define attribute' }).click();
    await expect(page).toHaveURL(/\/admin\/catalog\/attributes\/[0-9a-f]{24}$/);
    attributePath = new URL(page.url()).pathname;

    // Bind it to Cups & mugs.
    const shelfId = await categoryId(page, 'ceramics/cups-mugs');
    await page.goto(`/admin/catalog/categories?id=${shelfId}`);
    await page.getByRole('combobox').filter({ hasText: 'Choose…' }).click();
    await page.getByRole('option', { name: new RegExp(`^${escape(label)} — `) }).click();
    await page.getByLabel('Group', { exact: true }).fill('The piece');
    await page.getByRole('button', { name: 'Bind', exact: true }).click();
    await expect(page.getByText(label).first()).toBeVisible();

    // Say it of the Everyday Mug.
    await page.goto('/admin/catalog/products?q=Everyday%20Mug');
    await page.getByRole('link', { name: 'Everyday Mug' }).first().click();
    await page.getByRole('group', { name: label }).getByRole('radio', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Save product' }).click();
    await expect(page.getByText('Product saved').first()).toBeVisible();

    // The shelf grows a filter for it. Settings reach the index on a debounce and the
    // product through the outbox, so the page is asked again until both have landed.
    await expect
      .poll(
        async () => {
          await page.goto('/shop/ceramics/cups-mugs');
          return page.getByRole('button', { name: label, exact: true }).isVisible();
        },
        { timeout: 90_000, intervals: [2_000] },
      )
      .toBe(true);

    const everything = await itemCount(page);
    const section = page.getByRole('button', { name: label, exact: true });
    if ((await section.getAttribute('aria-expanded')) !== 'true') await section.click();
    await page.getByRole('switch', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${key}=true`));
    await expect.poll(() => itemCount(page)).toBe(1);
    expect(everything).toBeGreaterThan(1);
    await expect(page.getByRole('link', { name: /Everyday Mug/ })).toBeVisible();
    await context.close();
  });
});

async function categoryId(page: Page, path: string): Promise<string> {
  const response = await page.request.get('/api/catalog/categories');
  const { data } = (await response.json()) as { data: { _id: string; path: string }[] };
  const found = data.find((category) => category.path === path);
  if (!found) throw new Error(`No shelf at ${path} — has the database been seeded?`);
  return found._id;
}

async function itemCount(page: Page): Promise<number> {
  const text = await page
    .getByText(/^\d+ items?$/)
    .first()
    .innerText();
  return Number.parseInt(text, 10);
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
