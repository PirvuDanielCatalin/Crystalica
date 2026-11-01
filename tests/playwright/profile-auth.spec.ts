import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

async function login(page, email, password) {
  // Click sign-in button in header
  await page.click('[data-auth-sign-in], button:has-text("Conectare")');
  await page.waitForTimeout(1000);

  // Wait for Clerk form to appear
  await page.waitForSelector('.cl-form', { timeout: 15000 });
  
  // Fill identifier (email or username)
  const emailInput = page.locator('.cl-form input[name="identifier"]').first();
  await emailInput.fill(email);
  
  // Submit to go to password step
  const identifierSubmitBtn = page.locator('.cl-form button:has-text("Continue"), .cl-form button:has-text("Continuă")').first();
  await identifierSubmitBtn.click();
  await page.waitForTimeout(500);
  
  // Fill password
  const passwordInput = page.locator('.cl-form input[name="password"]').first();
  await passwordInput.fill(password);
  
  // Submit password
  const passwordSubmitBtn = page.locator('.cl-form button[type="submit"]').first();
  await passwordSubmitBtn.click();
  
  // Wait for authentication
  await page.waitForFunction(() => window.__crystalicaClerk?.user !== null, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Profile Authentication & Actions', () => {
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

  test('Authenticated as @test: follow button visible on @danielcatalinpirvu profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).not.toHaveAttribute('hidden');
    await expect(followBtn.locator('.follow-btn-text')).toHaveText('Urmărește');
  });

  test('Authenticated as @test: follow button hover shows green with checkmark', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    const checkIcon = followBtn.locator('.follow-btn-check');

    await expect(checkIcon).toBeHidden();

    await followBtn.hover();
    await page.waitForTimeout(300);

    const bgColor = await followBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(34, 197, 94)');
    await expect(checkIcon).toBeVisible();
  });

  test('Authenticated as @test: click follow -> "Deja urmăresc" state', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await followBtn.click();
    await page.waitForTimeout(2000);

    await expect(followBtn.locator('.follow-btn-text')).toHaveText('Deja urmăresc');
    await expect(followBtn).toHaveClass(/is-following/);
  });

  test('Authenticated as @test: following hover shows "Nu mai urmări"', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');

    if (!(await followBtn.getAttribute('class').then(c => c?.includes('is-following')))) {
      await followBtn.click();
      await page.waitForTimeout(2000);
    }

    await followBtn.hover();
    await page.waitForTimeout(300);

    await expect(followBtn.locator('.follow-btn-text')).toHaveText('Nu mai urmări');
    await expect(followBtn).toHaveCSS('border-color', 'rgb(0, 0, 0)');
  });

  test('Authenticated as @test: follow button hidden on own profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const followBtn = page.locator('[data-follow-btn]');
    await expect(followBtn).toHaveAttribute('hidden');
  });

  test('Authenticated as @test: move/remove actions visible on own profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const actionButtons = page.locator('.portfolio-item-actions-owner:not([hidden])');
    await expect(actionButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('Authenticated as @test: Portfolio tab works on own profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const portfolioTab = page.locator('[data-nav-tab="portfolio"]');
    await expect(portfolioTab).toHaveClass(/portfolio-nav-active/);

    const portfolioContent = page.locator('[data-tab="portfolio"]');
    await expect(portfolioContent).not.toBeHidden();
  });

  test('Authenticated as @test: Community/Settings tabs hidden on own profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const communityTab = page.locator('[data-nav-tab="community"]');
    const settingsTab = page.locator('[data-nav-tab="settings"]');

    await expect(communityTab).toHaveAttribute('hidden');
    await expect(settingsTab).toHaveAttribute('hidden');
  });

  test('Authenticated as @test: click crystal card navigates to detail page', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const firstCrystal = page.locator('.portfolio-item-link').first();
    await expect(firstCrystal).toBeVisible({ timeout: 5000 });

    const href = await firstCrystal.getAttribute('href');
    await firstCrystal.click();
    await page.waitForURL(`**${href}`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/cristale/');
  });

  test('Authenticated as @test: move/remove actions NOT visible on other profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const actionButtons = page.locator('.portfolio-item-actions-owner:not([hidden])');
    await expect(actionButtons).toHaveCount(0);
  });

  test('Authenticated as @test: only Portfolio tab visible on other profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');

    const visibleTabs = page.locator('[data-nav-tab]:not([hidden])');
    await expect(visibleTabs).toHaveCount(1);
    await expect(visibleTabs.first()).toHaveAttribute('data-nav-tab', 'portfolio');
  });
});

test.describe('Follow/Unfollow in Following Grid', () => {
  test('Authenticated as @test: unfollow works from Following tab on own profile', async ({ page }) => {
    await login(page, 'test@example.com', 'SmecherSmecher!132');

    await page.goto(`${BASE_URL}/@danielcatalinpirvu`);
    await page.waitForLoadState('networkidle');
    const followBtn = page.locator('[data-follow-btn]');
    if (!(await followBtn.getAttribute('class').then(c => c?.includes('is-following')))) {
      await followBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.goto(`${BASE_URL}/@test`);
    await page.waitForLoadState('networkidle');

    const unfollowBtn = page.locator('[data-unfollow="danielcatalinpirvu"]');
    await expect(unfollowBtn).toBeVisible({ timeout: 5000 });

    await unfollowBtn.click();
    await page.waitForTimeout(1000);

    await expect(unfollowBtn).not.toBeVisible();
  });
});