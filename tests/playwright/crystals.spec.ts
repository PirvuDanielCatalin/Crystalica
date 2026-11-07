import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('Crystals Listing & Detail', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/cristale`);
    await page.waitForLoadState('networkidle');
  });

  test('crystals listing page loads with heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Toate Cristalele/);
    await expect(page.locator('h1')).toContainText('Toate Cristalele');
  });

  test('crystals listing shows crystal count', async ({ page }) => {
    await expect(page.locator('text=cristale, organizate alfabetic')).toBeVisible();
  });

  test('crystals listing has A-Z navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'A' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Z' })).toBeVisible();
  });

  test('crystals listing shows at least one crystal card', async ({ page }) => {
    const cards = page.locator('.az-grid a, [data-crystal-card], .crystal-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a crystal navigates to its detail page', async ({ page }) => {
    const firstCard = page.locator('.az-grid a, [data-crystal-card], .crystal-card').first();
    const cardCount = await page.locator('.az-grid a, [data-crystal-card], .crystal-card').count();
    if (cardCount === 0) {
      test.skip(true, 'No crystal cards found on listing page');
      return;
    }
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page.url()).toContain('/cristale/');
  });

  test('crystal detail page shows crystal name', async ({ page }) => {
    // Navigate to a known crystal slug
    await page.goto(`${BASE_URL}/cristale/ametist`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Ametist');
  });

  test('crystal detail page has navigation arrows', async ({ page }) => {
    await page.goto(`${BASE_URL}/cristale/ametist`);
    await page.waitForLoadState('networkidle');
    const prevBtn = page.locator('.crystal-nav-prev, [aria-label="Cristalul anterior"]');
    const nextBtn = page.locator('.crystal-nav-next, [aria-label="Cristalul următor"]');
    // At least one should exist (first crystal has next, last has prev, middle has both)
    const hasPrev = await prevBtn.count() > 0;
    const hasNext = await nextBtn.count() > 0;
    expect(hasPrev || hasNext).toBe(true);
  });

  test('scroll-to-top button appears on cristale page when scrolled', async ({ page }) => {
    const btn = page.locator('#scroll-to-top');
    // Initially hidden
    await expect(btn).toBeHidden();

    // Scroll down past 300px
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Button should become visible
    await expect(btn).toBeVisible();

    // Button should be positioned on the left
    const box = await btn.boundingBox();
    if (box) {
      expect(box.x).toBeLessThan(page.viewportSize()!.width / 2);
    }
  });

  test('scroll-to-top button scrolls to top when clicked', async ({ page }) => {
    const btn = page.locator('#scroll-to-top');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await expect(btn).toBeVisible();

    // Click to scroll to top
    await btn.click();
    await page.waitForTimeout(500);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});
