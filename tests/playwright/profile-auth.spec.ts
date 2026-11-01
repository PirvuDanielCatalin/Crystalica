import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

// Authenticated tests - run with storage state
test.describe('Profile Authentication & Actions', () => {
  test.describe.configure({ retries: 0 });
  
  let currentUsername = '';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Get the current authenticated username
    currentUsername = await page.evaluate(() => window.__crystalicaClerk?.user?.username || '');
    console.log('Current authenticated user:', currentUsername);
  });

  test('Authenticated user: follow button visible on @danielcatalinpirvu profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    // Wait for the follow button to be visible (not hidden)
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-follow-btn]');
      return btn && !btn.hasAttribute('hidden');
    }, { timeout: 15000 });
    await page.waitForTimeout(500);

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).not.toHaveAttribute('hidden');
  });

  test('Authenticated user: follow button hidden on own profile', async ({ page }) => {
    if (!currentUsername) {
      test.skip('No authenticated user');
      return;
    }
    
    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');

    // Wait for profile page to initialize and Clerk user to be loaded
    await page.waitForFunction(() => window.__crystalicaClerk?.user?.username !== undefined, { timeout: 15000 });
    await page.waitForTimeout(500);

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).toHaveAttribute('hidden');
  });

  test('Authenticated user: Community/Settings tabs hidden on own profile', async ({ page }) => {
    if (!currentUsername) {
      test.skip('No authenticated user');
      return;
    }
    
    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');

    // Wait for profile page to initialize
    await page.waitForFunction(() => window.__crystalicaClerk?.user?.username !== undefined, { timeout: 15000 });
    await page.waitForTimeout(500);

    const communityTab = page.locator('[data-nav-tab="community"]');
    const settingsTab = page.locator('[data-nav-tab="settings"]');

    await expect(communityTab).toHaveAttribute('hidden');
    await expect(settingsTab).toHaveAttribute('hidden');
  });

  test('Authenticated user: only Portfolio tab visible on other profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(500);

    const visibleTabs = page.locator('[data-nav-tab]:not([hidden])');
    await expect(visibleTabs).toHaveCount(1);
    await expect(visibleTabs.first()).toHaveAttribute('data-nav-tab', 'portfolio');
  });

  test('Authenticated user: move/remove actions NOT visible on other profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(500);

    const actionButtons = page.locator('.portfolio-item-actions-owner:not([hidden])');
    await expect(actionButtons).toHaveCount(0);
  });

  test('Authenticated user: Portfolio tab works on own profile', async ({ page }) => {
    if (!currentUsername) {
      test.skip('No authenticated user');
      return;
    }
    
    await page.goto(`${BASE_URL}/@${currentUsername}`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(500);

    const portfolioTab = page.locator('[data-nav-tab="portfolio"]');
    await expect(portfolioTab).toHaveClass(/portfolio-nav-active/);

    const portfolioContent = page.locator('[data-tab="portfolio"]');
    await expect(portfolioContent).not.toBeHidden();
  });

  test('Authenticated user: follow toggle works', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const followBtn = page.locator('[data-follow-btn]');
    const initialState = await followBtn.getAttribute('class');
    const isInitiallyFollowing = initialState?.includes('is-following');
    
    if (!isInitiallyFollowing) {
      // Not following - click to follow
      await followBtn.click();
      await page.waitForTimeout(2000);
      await expect(followBtn).toHaveClass(/is-following/);
      await expect(followBtn.locator('.follow-btn-text')).toHaveText('Deja urmăresc');
    } else {
      // Already following - verify state
      await expect(followBtn).toHaveClass(/is-following/);
      await expect(followBtn.locator('.follow-btn-text')).toHaveText('Deja urmăresc');
    }
  });

  test('Authenticated user: following hover shows "Nu mai urmări"', async ({ page }) => {
    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const followBtn = page.locator('[data-follow-btn]');
    
    // Ensure user is following (click if not)
    const currentState = await followBtn.getAttribute('class');
    const isFollowing = currentState?.includes('is-following');
    
    if (!isFollowing) {
      await followBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.waitForTimeout(500);

    await followBtn.hover();
    await page.waitForTimeout(300);

    await expect(followBtn.locator('.follow-btn-text')).toHaveText('Nu mai urmări');
    await expect(followBtn).toHaveCSS('border-color', 'rgb(0, 0, 0)');
  });
});