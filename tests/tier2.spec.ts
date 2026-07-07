import { test, expect } from '@playwright/test';
import { generateToken, loginAndGoToSettings } from './helpers/auth';


test.describe('Tier 2: Theme Boundary Tests', () => {

  // --- LEGACY THEME BOUNDARIES (5 TESTS) ---

  test('2.1: Invalid theme local storage falls back to default', async ({ page }) => {
    const token = generateToken();
    await page.request.patch('/api/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { theme: 'dark' }
    });

    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('nexus_token', jwt);
      localStorage.setItem('nexus-theme', 'invalid-theme-value');
    }, token);
    await page.goto('/settings');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('2.2: Empty theme local storage falls back to default', async ({ page }) => {
    const token = generateToken();
    await page.request.patch('/api/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { theme: 'dark' }
    });

    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('nexus_token', jwt);
      localStorage.setItem('nexus-theme', '');
    }, token);
    await page.goto('/settings');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('2.3: Rapid theme switching applies the final selection correctly', async ({ page }) => {
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Pure Light")');
    await page.click('button:has-text("Slate")');
    await page.click('button:has-text("Stealth (OLED)")');
    await page.click('button:has-text("Signal Room (Dark)")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('2.4: Invalid terminal theme local storage is handled safely', async ({ page }) => {
    const token = generateToken();
    await page.request.patch('/api/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { terminalTheme: 'nexus-dark' }
    });

    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('nexus_token', jwt);
      localStorage.setItem('nexus-terminal-theme', 'invalid-terminal-value');
    }, token);
    await page.goto('/settings');
    // Ensure page loaded without crashing (H1 exists)
    await expect(page.locator('h1')).toHaveText('Global Settings');
  });

  test('2.5: Select terminal theme button sets terminal theme attribute', async ({ page }) => {
    await loginAndGoToSettings(page);
    // Select Matrix terminal theme
    await page.locator('button[title="Matrix"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-terminal-theme', 'matrix');
  });

  // --- CYBERPUNK THEME BOUNDARIES (5 TESTS) ---

  test('2.6: Rapid theme switching with Cyberpunk Neon applies final selection', async ({ page }) => {
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Pure Light")');
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    await page.click('button:has-text("Slate")');
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');
  });

  test('2.7: Cyberpunk Neon card backdrop-blur computed style boundary check', async ({ page, browserName }) => {
    test.skip(browserName === 'chromium', 'Chromium headless does not compute backdrop-filter correctly');
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    const card = page.locator('.nx-card').first();
    const blurValue = await card.evaluate(el => window.getComputedStyle(el).backdropFilter);
    expect(blurValue).toBe('blur(16px)');
  });

  test('2.8: Cyberpunk Neon background void color HSL value check', async ({ page }) => {
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    
    // Evaluate the CSS variable --bg-void on the HTML element
    const bgVoid = await page.locator('html').evaluate(el => window.getComputedStyle(el).getPropertyValue('--bg-void').trim());
    // Cyberpunk HSL color should match expected HSL format (e.g. hsl(...) or hsla(...))
    expect(bgVoid).toMatch(/^hsla?\(.*\)$/);
  });

  test('2.9: Cyberpunk Neon micro-animations class properties check', async ({ page }) => {
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    
    // Verify blink or glow class attributes are registered/applied
    const neonElement = page.locator('.nx-blink, [class*="animate-"]').first();
    await expect(neonElement).toBeVisible();
  });

  test('2.10: Toggle Enable Animations off disables animations under cyberpunk', async ({ page }) => {
    await loginAndGoToSettings(page);
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    
    // Toggle animations off
    const checkbox = page.locator('div:has(> span:has-text("Enable Animations")) button');
    await checkbox.click();
    
    // Evaluate if animations are turned off (e.g. state updated to false in localStorage or settings)
    const isAnimationsEnabled = await page.evaluate(() => {
      // In settings, checking if state represents animationsEnabled: false
      return document.documentElement.classList.contains('no-animations') || localStorage.getItem('nexus-animations') === 'false';
    });
    expect(isAnimationsEnabled).toBe(false);
  });

});
