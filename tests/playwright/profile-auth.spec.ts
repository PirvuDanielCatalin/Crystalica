import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const OTHER_USER = 'danielcatalinpirvu';

// Authenticated tests - run with storage state
test.describe('Profile Authentication & Actions', () => {
  test.describe.configure({ retries: 0 });

  let currentUsername = '';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    currentUsername = await page.evaluate(
      () => window.__crystalicaClerk?.user?.username || '',
    );
  });

  test('other profile: follow button is actually VISIBLE', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(currentUsername.toLowerCase() === OTHER_USER, 'Logged in as the viewed user');

    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    // wait until the client script decides to show it
    await expect(followBtn).toBeVisible({ timeout: 15000 });
  });

  test('own profile: follow button is actually HIDDEN', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(!currentUsername, 'No authenticated user');

    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => window.__crystalicaClerk?.user?.username !== undefined,
      { timeout: 15000 },
    );
    await page.waitForTimeout(800);

    await expect(page.locator('[data-follow-btn]')).toBeHidden();
  });

  test('own profile: Community and Settings tabs are visible', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(!currentUsername, 'No authenticated user');

    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => window.__crystalicaClerk?.user?.username !== undefined,
      { timeout: 15000 },
    );
    await page.waitForTimeout(800);

    await expect(page.locator('[data-nav-tab="community"]')).toBeVisible();
    await expect(page.locator('[data-nav-tab="settings"]')).toBeVisible();
  });

  test('other profile: only Portfolio tab is visible', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await expect(page.locator('[data-nav-tab="portfolio"]')).toBeVisible();
    await expect(page.locator('[data-nav-tab="community"]')).toBeHidden();
    await expect(page.locator('[data-nav-tab="settings"]')).toBeHidden();
  });

  test('other profile: move/remove actions are NOT visible', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
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

  test('other profile: hovering a crystal does not reveal move/remove', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const firstCard = page.locator('.portfolio-item').first();
    await firstCard.hover();
    await page.waitForTimeout(400);

    const actions = page.locator('.portfolio-item-actions-owner').first();
    await expect(actions).toBeHidden();
  });

  test('own profile: Portfolio tab is active and visible', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(!currentUsername, 'No authenticated user');

    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await expect(page.locator('[data-nav-tab="portfolio"]')).toHaveClass(/portfolio-nav-active/);
    await expect(page.locator('[data-tab="portfolio"]')).toBeVisible();
  });

  test('own profile: move/remove actions ARE visible', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(!currentUsername, 'No authenticated user');

    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => window.__crystalicaClerk?.user?.username !== undefined,
      { timeout: 15000 },
    );
    await page.waitForTimeout(800);

    const actions = page.locator('.portfolio-item-actions-owner');
    const count = await actions.count();
    if (count === 0) {
      test.skip(true, 'Own profile has no crystals');
      return;
    }
    await expect(actions.first()).toBeVisible();
  });

  test('other profile: follow toggle works', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(currentUsername.toLowerCase() === OTHER_USER, 'Logged in as the viewed user');

    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).toBeVisible({ timeout: 15000 });

    const initialState = await followBtn.getAttribute('class');
    const isInitiallyFollowing = initialState?.includes('is-following');

    if (!isInitiallyFollowing) {
      await followBtn.click();
      await expect(followBtn).toHaveClass(/is-following/);
      await expect(followBtn.locator('.follow-btn-text')).toHaveText('Deja urmăresc');
    } else {
      await expect(followBtn).toHaveClass(/is-following/);
      await expect(followBtn.locator('.follow-btn-text')).toHaveText('Deja urmăresc');
    }
  });

  test('other profile: following hover shows "Nu mai urmări"', async ({ page }) => {
      test.skip(test.info().project.name !== "chromium-auth", "Requires authenticated project");
    test.skip(currentUsername.toLowerCase() === OTHER_USER, 'Logged in as the viewed user');

    await page.goto(`${BASE_URL}/@${OTHER_USER}`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).toBeVisible({ timeout: 15000 });

    if (!(await followBtn.getAttribute('class'))?.includes('is-following')) {
      await followBtn.click();
      await expect(followBtn).toHaveClass(/is-following/);
    }

    await followBtn.hover();
    await expect(followBtn.locator('.follow-btn-text')).toHaveText('Nu mai urmări');
    await expect(followBtn).toHaveCSS('border-color', 'rgb(0, 0, 0)');
  });
});
