import { test, expect } from '@playwright/test';
import { generateToken } from './helpers/auth';


test.describe('Tier 4: Real-world Application Scenarios', () => {

  test('4.1: First-time admin onboarding and theme customization flow', async ({ page }) => {
    // 1. User logs in by injecting token
    const token = generateToken();
    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('nexus_token', jwt);
    }, token);

    // 2. Navigates to index/dashboard first
    await page.goto('/');
    await expect(page).toHaveTitle(/Dashboard/);

    // 3. Navigates to Global Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveText('Global Settings');

    // 4. Customizes General Settings
    // Select English locale (General is active by default)
    await page.selectOption('select:near(label:has-text("Language")), select', 'en-US');
    
    // Select Alerts landing page
    await page.selectOption('select:near(label:has-text("Default Landing Page")), select >> xpath=following-sibling::select', 'alerts');

    // 5. Customizes Appearance Settings
    await page.locator('aside button').getByText('Appearance').click();
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });

    // 6. Reloads page and verifies all customized settings are preserved
    await page.reload();
    
    // Check theme
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');
    
    // Go to General settings to check general preference persistence
    await page.locator('aside button').getByText('General').click();
    const landingPage = await page.locator('select').nth(1).inputValue();
    expect(landingPage).toBe('alerts');
  });

  test('4.2: Multitab synchronization and real-time theme persistence', async ({ context, page }) => {
    const token = generateToken();
    
    // Setup first page (Tab 1)
    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('nexus_token', jwt);
    }, token);
    await page.goto('/settings');
    await expect(page.locator('h1')).toHaveText('Global Settings');
    await page.locator('aside button').getByText('Appearance').click();

    // Setup second page (Tab 2) in the same browser context (shares localStorage)
    const page2 = await context.newPage();
    await page2.goto('/settings');
    await expect(page2.locator('h1')).toHaveText('Global Settings');

    // On Tab 1, select Cyberpunk Neon
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');

    // On Tab 2, verify theme synchronizes or matches Cyberpunk Neon
    // Since page2 is in the same context, it shares storage. A page reload or storage event updates it.
    await page2.reload();
    await expect(page2.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');
  });

});
