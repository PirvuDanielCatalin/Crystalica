import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('Homepage', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('homepage loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Crystalica/);
    await expect(page.locator('h1')).toContainText('Crystalica');
  });

  test('homepage shows "Explorează Cristalele" button linking to /cristale', async ({ page }) => {
    const exploreBtn = page.getByRole('link', { name: /Explorează Cristalele/ });
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveAttribute('href', '/cristale');
  });

  test('homepage has search bar', async ({ page }) => {
    await expect(page.getByPlaceholder(/caut|search|cristal/i)).toBeVisible();
  });

  test('homepage has Botpress chatbot scripts loaded', async ({ page }) => {
    const botpressInject = page.locator('script[src*="cdn.botpress.cloud"]');
    const botpressClient = page.locator('script[src*="files.bpcontent.cloud"]');
    await expect(botpressInject).toBeVisible();
    await expect(botpressClient).toBeVisible();
  });

  test('clicking "Explorează Cristalele" navigates to crystals listing', async ({ page }) => {
    await page.getByRole('link', { name: /Explorează Cristalele/ }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE_URL}/cristale`);
    await expect(page.locator('h1')).toContainText('Toate Cristalele');
  });
});
