import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const OTHER_USER = 'danielcatalinpirvu';

// Unauthenticated tests - run without storage state
test.describe('Profile - Unauthenticated', () => {
  test.describe.configure({ retries: 0, projects: ['chromium-unauth'] });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('unauthenticated: follow button is hidden on another profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await expect(page.locator('[data-follow-btn]')).toBeHidden();
  });

  test('unauthenticated: move/remove actions are hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const actions = page.locator('.portfolio-item-actions-owner');
    const count = await actions.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(actions.nth(i)).toBeHidden();
    }
  });

  test('unauthenticated: Community/Settings tabs are hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await expect(page.locator('[data-nav-tab="community"]')).toBeHidden();
    await expect(page.locator('[data-nav-tab="settings"]')).toBeHidden();
    await expect(page.locator('[data-nav-tab="portfolio"]')).toBeVisible();
  });

  test('unauthenticated: header shows portfolio, wishlist, following and follower stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-portfolio-count]').first()).toBeVisible();
    await expect(page.locator('[data-wishlist-count]').first()).toBeVisible();
    await expect(page.locator('[data-following-count]').first()).toBeVisible();
    await expect(page.locator('[data-followers-count]').first()).toBeVisible();
  });
});
