import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('Navigation & Miscellaneous', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('404 page loads for unknown route', async ({ page }) => {
    await page.goto(`${BASE_URL}/xyz-nonsense-page`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('RSS feed is accessible at /rss.xml', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/rss.xml`);
    await page.waitForLoadState('networkidle');
    const contentType = response?.headers()['content-type'] || '';
    expect(contentType).toContain('xml');
    const body = await page.textContent('body') || '';
    expect(body).toContain('rss');
  });

  test('Botpress chatbot scripts present on homepage', async ({ page }) => {
    const botpressClientCount = await page.locator('script[src*="files.bpcontent.cloud"]').count();
    expect(botpressClientCount).toBeGreaterThan(0);
  });

  test('Botpress chatbot scripts present on cristale detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/cristale/ametist`);
    await page.waitForLoadState('networkidle');

    const botpressClientCount = await page.locator('script[src*="files.bpcontent.cloud"]').count();
    expect(botpressClientCount).toBeGreaterThan(0);
  });

  test('Botpress chatbot scripts present on profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const botpressClientCount = await page.locator('script[src*="files.bpcontent.cloud"]').count();
    expect(botpressClientCount).toBeGreaterThan(0);
  });
});
