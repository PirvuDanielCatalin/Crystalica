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
    await expect(page.locator('h1#hero-title')).toContainText('Crystalica');
  });

  test('homepage shows "Explorează Cristalele" button linking to /cristale', async ({ page }) => {
    const exploreBtn = page.getByRole('link', { name: /Explorează Cristalele/ });
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveAttribute('href', '/cristale');
  });

  test('homepage has Botpress chatbot scripts loaded', async ({ page }) => {
    // The inject.js is bundled by Astro; files.bpcontent.cloud is a standalone script tag
    const botpressClientCount = await page.locator('script[src*="files.bpcontent.cloud"]').count();
    expect(botpressClientCount).toBeGreaterThan(0);
  });

  test('clicking "Explorează Cristalele" navigates to crystals listing', async ({ page }) => {
    await page.getByRole('link', { name: /Explorează Cristalele/ }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE_URL}/cristale`);
    await expect(page.locator('h1').first()).toContainText('Toate Cristalele');
  });
});
