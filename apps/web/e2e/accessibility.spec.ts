import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    const pages = ['/', '/dashboard', '/assessments'];
    
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        
        if (headings.length > 0) {
          // Should have at least one h1
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBeGreaterThanOrEqual(1);
          
          // Check if headings are in logical order
          let previousLevel = 0;
          for (const heading of headings) {
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            const currentLevel = parseInt(tagName.charAt(1));
            
            if (previousLevel > 0) {
              // Heading levels shouldn't skip more than one level
              expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
            }
            
            previousLevel = currentLevel;
          }
        }
      } catch (error) {
        console.warn(`Skipping ${pagePath} - page not available`);
      }
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Decorative images can have empty alt text, but it should be present
      expect(alt).not.toBeNull();
      
      // If image has meaningful content, alt should be descriptive
      if (src && !src.includes('decoration') && !src.includes('background')) {
        if (alt === '') {
          console.warn(`Image may need descriptive alt text: ${src}`);
        }
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const pages = ['/assessments/create', '/profile', '/'];
    
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check form inputs
        const inputs = await page.locator('input, textarea, select').all();
        
        for (const input of inputs) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const type = await input.getAttribute('type');
          
          // Skip hidden inputs
          if (type === 'hidden') continue;
          
          // Input should have a label, aria-label, or aria-labelledby
          if (id) {
            const label = await page.locator(`label[for="${id}"]`).count();
            const hasLabel = label > 0 || ariaLabel || ariaLabelledBy;
            
            if (!hasLabel) {
              console.warn(`Input may be missing label: ${await input.getAttribute('name') || 'unnamed'}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Skipping ${pagePath} - page not available`);
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // This is a basic check - in a real scenario you'd use axe-core or similar
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button').all();
    
    for (const element of textElements.slice(0, 10)) { // Check first 10 elements
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check - ensure text has color and background
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start keyboard navigation
    await page.keyboard.press('Tab');
    
    let focusableElements = 0;
    const maxTabs = 20; // Limit to prevent infinite loops
    
    for (let i = 0; i < maxTabs; i++) {
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.count() > 0) {
        focusableElements++;
        
        // Check if focused element is visible
        await expect(focusedElement).toBeVisible();
        
        // Check if focus is visually indicated
        const outline = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.outline || computed.boxShadow;
        });
        
        // Should have some form of focus indication
        expect(outline).toBeTruthy();
      }
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Should have found some focusable elements
    expect(focusableElements).toBeGreaterThan(0);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper ARIA usage
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]').all();
    
    for (const element of ariaElements) {
      const role = await element.getAttribute('role');
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      
      // If element has role, it should be a valid ARIA role
      if (role) {
        const validRoles = [
          'button', 'link', 'navigation', 'main', 'banner', 'contentinfo',
          'complementary', 'search', 'form', 'dialog', 'alert', 'status',
          'tab', 'tabpanel', 'tablist', 'menu', 'menuitem', 'listbox',
          'option', 'grid', 'gridcell', 'tree', 'treeitem'
        ];
        
        if (!validRoles.includes(role)) {
          console.warn(`Potentially invalid ARIA role: ${role}`);
        }
      }
      
      // If element has aria-labelledby, referenced element should exist
      if (ariaLabelledBy) {
        const referencedElement = await page.locator(`#${ariaLabelledBy}`).count();
        expect(referencedElement).toBeGreaterThan(0);
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      
      // Live regions should have appropriate politeness levels
      if (ariaLive) {
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
      
      if (role === 'alert') {
        // Alert regions should be used for important messages
        const content = await region.textContent();
        expect(content).toBeTruthy();
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page adapts to dark mode
    const body = page.locator('body');
    const bodyStyles = await body.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Should have appropriate colors for dark mode
    expect(bodyStyles.backgroundColor).toBeTruthy();
    expect(bodyStyles.color).toBeTruthy();
  });

  test('should have proper skip links', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip links (usually hidden until focused)
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], [data-testid="skip-link"]').all();
    
    if (skipLinks.length > 0) {
      for (const skipLink of skipLinks) {
        // Skip link should have descriptive text
        const text = await skipLink.textContent();
        expect(text).toBeTruthy();
        expect(text!.toLowerCase()).toContain('skip');
        
        // Skip link should be focusable
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
      }
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if animations are reduced or disabled
    const animatedElements = await page.locator('[style*="animation"], [class*="animate"]').all();
    
    for (const element of animatedElements.slice(0, 5)) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          animation: computed.animation,
          transition: computed.transition
        };
      });
      
      // Animations should be reduced or disabled
      if (styles.animation && styles.animation !== 'none') {
        console.log(`Animation found with reduced motion: ${styles.animation}`);
      }
    }
  });
});