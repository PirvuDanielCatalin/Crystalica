import { test as setup, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const STORAGE_STATE = 'tests/playwright/.auth/user.json';

async function login(page, email, password) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  await page.click('[data-auth-sign-in], button:has-text("Conectare")');
  await page.waitForTimeout(1000);
  await page.waitForSelector('.cl-form', { timeout: 15000 });
  await page.locator('.cl-form input[name="identifier"]').fill(email);
  await page.locator('.cl-form input[name="identifier"]').press('Enter');
  await page.waitForTimeout(1000);
  await page.waitForSelector('.cl-form input[name="password"]', { timeout: 10000 });
  await page.locator('.cl-form input[name="password"]').fill(password);
  await page.locator('.cl-form input[name="password"]').press('Enter');
  await page.waitForFunction(() => window.__crystalicaClerk?.user !== null, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

setup('authenticate as @test', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  await page.click('[data-auth-sign-in], button:has-text("Conectare")');
  await page.waitForTimeout(1000);
  await page.waitForSelector('.cl-form', { timeout: 15000 });
  await page.locator('.cl-form input[name="identifier"]').fill('danut_pirvu2008@yahoo.com');
  await page.locator('.cl-form input[name="identifier"]').press('Enter');
  await page.waitForTimeout(1000);
  await page.waitForSelector('.cl-form input[name="password"]', { timeout: 10000 });
  await page.locator('.cl-form input[name="password"]').fill('SmecherSmecher!132');
  await page.locator('.cl-form input[name="password"]').press('Enter');
  await page.waitForFunction(() => window.__crystalicaClerk?.user !== null, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify we're logged in
  const user = await page.evaluate(() => window.__crystalicaClerk?.user);
  console.log('User:', user?.username);
  if (user?.username !== 'test') {
    throw new Error('Login failed');
  }

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE });
  console.log('Storage state saved to', STORAGE_STATE);
});