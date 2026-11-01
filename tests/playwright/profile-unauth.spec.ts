import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

// Unauthenticated tests - run without storage state
test.describe('Profile - Unauthenticated', () => {
  test.describe.configure({ retries: 0, projects: ['chromium-unauth'] });
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Unauthenticated user: follow button hidden on other profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).toHaveAttribute('hidden');
  });

  test('Unauthenticated user: move/remove actions hidden on other profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const actionButtons = page.locator('.portfolio-item-actions-owner:not([hidden])');
    await expect(actionButtons).toHaveCount(0);
  });

  test('Unauthenticated user: Community/Settings tabs hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const communityTab = page.locator('[data-nav-tab="community"]');
    const settingsTab = page.locator('[data-nav-tab="settings"]');

    await expect(communityTab).toHaveAttribute('hidden');
    await expect(settingsTab).toHaveAttribute('hidden');
  });
});