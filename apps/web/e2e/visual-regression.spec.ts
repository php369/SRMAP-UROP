import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Captures screenshots and compares them to detect visual changes
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dashboard visual snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('assessments page visual snapshot', async ({ page }) => {
    await page.goto('/assessments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('assessments.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('projects page visual snapshot', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('projects.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('groups page visual snapshot', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('groups.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Component Visual Tests', () => {
  test('navigation component snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav, [data-testid="navigation"]').first();
    if (await nav.count() > 0) {
      await expect(nav).toHaveScreenshot('navigation.png');
    }
  });

  test('card components snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('[data-testid="stats-card"], .stats-card, .card').first();
    if (await cards.count() > 0) {
      await expect(cards).toHaveScreenshot('card-component.png');
    }
  });

  test('button variants snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button').first();
    if (await buttons.count() > 0) {
      await expect(buttons).toHaveScreenshot('button-component.png');
    }
  });
});

test.describe('Responsive Visual Tests', () => {
  test('mobile view snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('tablet view snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('desktop view snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Dark Mode Visual Tests', () => {
  test('dark mode homepage snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('dark mode dashboard snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('dashboard-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});

test.describe('Interactive State Visual Tests', () => {
  test('hover state snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await button.hover();
      await page.waitForTimeout(300);
      
      await expect(button).toHaveScreenshot('button-hover.png');
    }
  });

  test('focus state snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input').first();
    if (await input.count() > 0) {
      await input.focus();
      await page.waitForTimeout(300);
      
      await expect(input).toHaveScreenshot('input-focus.png');
    }
  });

  test('loading state snapshot', async ({ page }) => {
    // Intercept API calls to create loading state
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/dashboard');
    
    // Capture loading state
    const loadingElement = page.locator('[data-testid="loading"], .loading, .spinner').first();
    if (await loadingElement.count() > 0) {
      await expect(loadingElement).toHaveScreenshot('loading-state.png');
    }
  });

  test('error state snapshot', async ({ page }) => {
    // Intercept API calls to create error state
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const errorElement = page.locator('[data-testid="error"], .error').first();
    if (await errorElement.count() > 0) {
      await expect(errorElement).toHaveScreenshot('error-state.png');
    }
  });
});
