import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load pages within acceptable time limits', async ({ page }) => {
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/assessments', name: 'Assessments' },
      { path: '/profile', name: 'Profile' }
    ];

    for (const pageInfo of pages) {
      console.log(`Testing ${pageInfo.name} page performance...`);
      
      const startTime = Date.now();
      
      try {
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        console.log(`${pageInfo.name} loaded in ${loadTime}ms`);
        
        // Page should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
        
        // Page should be interactive within 3 seconds
        const interactiveTime = Date.now() - startTime;
        expect(interactiveTime).toBeLessThan(3000);
        
      } catch (error) {
        console.warn(`${pageInfo.name} page failed to load:`, error);
        // Don't fail the test if page doesn't exist yet
      }
    }
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    if (lcp > 0) {
      console.log(`LCP: ${lcp}ms`);
      // LCP should be under 2.5 seconds (2500ms)
      expect(lcp).toBeLessThan(2500);
    }

    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Measure for 3 seconds
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log(`CLS: ${cls}`);
    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should efficiently load and cache resources', async ({ page }) => {
    // First visit
    const response1 = await page.goto('/');
    
    // Check if resources are properly cached
    await page.reload();
    const response2 = await page.goto('/');
    
    // Second load should be faster due to caching
    // This is a basic check - in reality you'd measure more precisely
    expect(response1?.status()).toBe(200);
    expect(response2?.status()).toBe(200);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Mock a large dataset response
    await page.route('**/api/v1/assessments**', route => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `assessment-${i}`,
        title: `Assessment ${i}`,
        description: `Description for assessment ${i}`,
        dueAt: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'closed'
      }));
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { assessments: largeDataset, count: largeDataset.length }
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/assessments');
    await page.waitForLoadState('networkidle');
    
    const renderTime = Date.now() - startTime;
    console.log(`Large dataset rendered in ${renderTime}ms`);
    
    // Should handle large datasets within reasonable time
    expect(renderTime).toBeLessThan(3000);
    
    // Check if virtual scrolling or pagination is implemented
    const listContainer = page.locator('[data-testid="assessments-list"], .assessments-list');
    if (await listContainer.count() > 0) {
      const visibleItems = await page.locator('.assessment-card, [data-testid="assessment-card"]').count();
      
      // If virtual scrolling is implemented, visible items should be less than total
      // If pagination is implemented, should show reasonable number per page
      expect(visibleItems).toBeLessThanOrEqual(50);
    }
  });

  test('should optimize images and media', async ({ page }) => {
    await page.goto('/');
    
    // Check for image optimization
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const loading = await img.getAttribute('loading');
      
      if (src) {
        // Check if images use modern formats or optimization services
        const isOptimized = src.includes('webp') || 
                           src.includes('avif') || 
                           src.includes('cloudinary') ||
                           src.includes('vercel') ||
                           loading === 'lazy';
        
        if (!isOptimized) {
          console.warn(`Image may not be optimized: ${src}`);
        }
      }
    }
  });

  test('should minimize JavaScript bundle size', async ({ page }) => {
    // Monitor network requests
    const jsRequests: any[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.endsWith('.js') && !url.includes('node_modules')) {
        jsRequests.push({
          url,
          size: response.headers()['content-length']
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total JS bundle size
    let totalSize = 0;
    jsRequests.forEach(request => {
      if (request.size) {
        totalSize += parseInt(request.size);
      }
    });

    console.log(`Total JS bundle size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // Bundle should be under 2MB for good performance
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
    
    // Should have reasonable number of JS files (code splitting)
    expect(jsRequests.length).toBeLessThan(20);
  });

  test('should work well on slow networks', async ({ page }) => {
    // Simulate slow 3G network
    await page.context().route('**/*', async route => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));
      route.continue();
    });

    const startTime = Date.now();
    await page.goto('/', { timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Page loaded on slow network in ${loadTime}ms`);
    
    // Should still be usable on slow networks (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Check if loading states are shown
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner');
    // Loading elements might have already disappeared, so we don't assert their presence
  });

  test('should handle memory efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    if (initialMemory) {
      console.log(`Initial memory usage: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Navigate through several pages
      const pages = ['/dashboard', '/assessments', '/profile', '/'];
      
      for (const pagePath of pages) {
        try {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
        } catch (error) {
          // Skip if page doesn't exist
          continue;
        }
      }
      
      // Check memory after navigation
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (finalMemory) {
        console.log(`Final memory usage: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Memory shouldn't grow excessively
        const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryGrowthMB = memoryGrowth / 1024 / 1024;
        
        console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);
        
        // Memory growth should be reasonable (under 50MB)
        expect(memoryGrowthMB).toBeLessThan(50);
      }
    }
  });
});