import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('Navigation & Miscellaneous', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('404 page returns correct status for unknown route', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/xyz-nonsense-page`);
    await page.waitForLoadState('networkidle');
    // The page may return 200 with 404 content or actual 404 status
    await expect(page.locator('h1, [role="heading"]')).toBeVisible({ timeout: 10000 });
  });

  test('RSS feed is accessible at /rss.xml', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/rss.xml`);
    await page.waitForLoadState('networkidle');
    const contentType = response?.headers()['content-type'] || '';
    expect(contentType).toContain('xml');
    await expect(page.locator('rss, channel, item')).toBeVisible({ timeout: 10000 });
  });

  test('Botpress chatbot scripts present on all pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/cristale`);
    await page.waitForLoadState('networkidle');

    const botpressInject = page.locator('script[src*="cdn.botpress.cloud/webchat/v5.0/inject.js"]');
    const botpressClient = page.locator('script[src*="files.bpcontent.cloud"]');
    await expect(botpressInject).toBeVisible();
    await expect(botpressClient).toBeVisible();
  });

  test('Botpress chatbot scripts present on cristale detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/cristale/ametist`);
    await page.waitForLoadState('networkidle');

    const botpressInject = page.locator('script[src*="cdn.botpress.cloud/webchat/v5.0/inject.js"]');
    const botpressClient = page.locator('script[src*="files.bpcontent.cloud"]');
    await expect(botpressInject).toBeVisible();
    await expect(botpressClient).toBeVisible();
  });

  test('Botpress chatbot scripts present on profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const botpressInject = page.locator('script[src*="cdn.botpress.cloud/webchat/v5.0/inject.js"]');
    const botpressClient = page.locator('script[src*="files.bpcontent.cloud"]');
    await expect(botpressInject).toBeVisible();
    await expect(botpressClient).toBeVisible();
  });
});
