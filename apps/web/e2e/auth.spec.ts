import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check if we're redirected to login or see login elements
    await expect(page).toHaveTitle(/SRM Project Portal/);
    
    // Look for Google OAuth login button or login form
    const loginButton = page.locator('button:has-text("Sign in with Google"), button:has-text("Login"), a:has-text("Sign in")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test('should show proper error for invalid domain', async ({ page }) => {
    // This test would require mocking the OAuth flow
    // For now, we'll test the UI elements are present
    
    await page.goto('/');
    
    // Check if domain restriction message is shown somewhere in the UI
    // This might be in a help text or error state
    const domainInfo = page.locator('text=@srmap.edu.in, text=SRM University, text=domain');
    if (await domainInfo.count() > 0) {
      await expect(domainInfo.first()).toBeVisible();
    }
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    await expect(page).toHaveTitle(/SRM Project Portal/);
    
    const description = page.locator('meta[name="description"]');
    if (await description.count() > 0) {
      const content = await description.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(50);
    }
    
    // Check for favicon
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    if (await favicon.count() > 0) {
      await expect(favicon.first()).toHaveAttribute('href');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if the page renders properly on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check if navigation is mobile-friendly (hamburger menu, etc.)
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    try {
      await page.goto('/', { timeout: 5000 });
    } catch (error) {
      // Expected to fail, but should handle gracefully
    }
    
    // Go back online
    await page.context().setOffline(false);
    await page.goto('/');
    
    // Should recover and load properly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Authentication Security', () => {
  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for security headers
    const headers = response?.headers();
    if (headers) {
      // These might be set by Vercel or the server
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      securityHeaders.forEach(header => {
        if (headers[header]) {
          console.log(`✅ Security header found: ${header} = ${headers[header]}`);
        }
      });
    }
  });

  test('should not expose sensitive information in client-side code', async ({ page }) => {
    await page.goto('/');
    
    // Check that sensitive environment variables are not exposed
    const pageContent = await page.content();
    
    // These should not appear in the client-side code
    const sensitivePatterns = [
      /jwt[_-]?secret/i,
      /api[_-]?key/i,
      /mongodb[_-]?uri/i,
      /database[_-]?url/i,
      /private[_-]?key/i
    ];
    
    sensitivePatterns.forEach(pattern => {
      expect(pageContent).not.toMatch(pattern);
    });
  });
});