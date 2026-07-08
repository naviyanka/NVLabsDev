import { test, expect } from '@playwright/test';
import { generateToken, loginAndGoToSettings } from './helpers/auth';


test.describe('Tier 3: Cross-Feature Combinations', () => {

  test('3.1: Cyberpunk Neon theme and Matrix terminal theme co-existence', async ({ page }) => {
    await loginAndGoToSettings(page);
    
    // Select Cyberpunk Neon
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    // Select Matrix terminal theme
    await page.locator('button[title="Matrix"]').click();
    
    // Assert both attributes are set on document element
    await expect(page.locator('html')).toHaveAttribute('data-theme', /cyberpunk|cyberpunk-neon/);
    await expect(page.locator('html')).toHaveAttribute('data-terminal-theme', 'matrix');
  });

  test('3.2: Cyberpunk Neon, Compact UI Density, and Animations Disabled combo', async ({ page }) => {
    await loginAndGoToSettings(page);
    
    // Select Cyberpunk Neon
    await page.click('button:has-text("Cyberpunk Neon")', { timeout: 2000 });
    
    // Select Compact UI Density
    await page.selectOption('select:near(label:has-text("UI Density")), select', 'compact');
    
    // Toggle Enable Animations off
    const checkbox = page.locator('button:has-text("Enable Animations"), label:has-text("Enable Animations") + button');
    await checkbox.click();
    
    // Reload to verify DB settings persist all three
    await page.reload();
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', /cyberpunk|cyberpunk-neon/);
    const densityVal = await page.locator('select').first().inputValue();
    expect(densityVal).toBe('compact');
    
    const animationsVal = await page.evaluate(() => localStorage.getItem('nexus-animations'));
    expect(animationsVal).toBe('false');
  });

});
