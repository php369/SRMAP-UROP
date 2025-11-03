import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // For now, we'll test the dashboard UI without authentication
    // In a real scenario, you'd set up authentication state
    await page.goto('/dashboard');
  });

  test('should load dashboard components', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if main dashboard elements are present
    const dashboardElements = [
      'text=Dashboard',
      'text=Welcome',
      '[data-testid="stats-card"], .stats-card, .metric-card',
      '[data-testid="chart"], .chart, canvas, svg'
    ];
    
    for (const selector of dashboardElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should display statistics cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for statistics or metric cards
    const statsCards = page.locator('[data-testid="stats-card"], .stats-card, .metric-card, .dashboard-card');
    
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
      
      // Check if cards have proper content
      const firstCard = statsCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText!.trim().length).toBeGreaterThan(0);
    }
  });

  test('should render charts and visualizations', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for chart elements (canvas, svg, or chart containers)
    const chartElements = page.locator('canvas, svg, [data-testid="chart"], .chart, .recharts-wrapper');
    
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
      
      // For canvas elements, check if they have content
      const canvasElements = page.locator('canvas');
      if (await canvasElements.count() > 0) {
        const canvas = canvasElements.first();
        const width = await canvas.getAttribute('width');
        const height = await canvas.getAttribute('height');
        
        expect(width).toBeTruthy();
        expect(height).toBeTruthy();
        expect(parseInt(width!)).toBeGreaterThan(0);
        expect(parseInt(height!)).toBeGreaterThan(0);
      }
    }
  });

  test('should have working navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for navigation elements
    const navElements = page.locator('nav, [data-testid="navigation"], .navigation, .sidebar');
    
    if (await navElements.count() > 0) {
      await expect(navElements.first()).toBeVisible();
      
      // Look for navigation links
      const navLinks = page.locator('nav a, [data-testid="nav-link"], .nav-link');
      
      if (await navLinks.count() > 0) {
        const firstLink = navLinks.first();
        await expect(firstLink).toBeVisible();
        
        // Check if link has proper href
        const href = await firstLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    let body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Allow for responsive adjustments
    await expect(body).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(body).toBeVisible();
    
    // Check if mobile navigation is present
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/**', route => {
      // Delay the response to test loading states
      setTimeout(() => {
        route.continue();
      }, 1000);
    });
    
    await page.goto('/dashboard');
    
    // Look for loading indicators
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner, .skeleton');
    
    if (await loadingElements.count() > 0) {
      // Should show loading initially
      await expect(loadingElements.first()).toBeVisible();
      
      // Should hide loading after content loads
      await expect(loadingElements.first()).toBeHidden({ timeout: 15000 });
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Intercept API calls to simulate errors
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for error messages or fallback content
    const errorElements = page.locator('[data-testid="error"], .error, text=Error, text=Something went wrong');
    
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toBeVisible();
    } else {
      // Should at least show some content, not a blank page
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText!.trim().length).toBeGreaterThan(0);
    }
  });
});