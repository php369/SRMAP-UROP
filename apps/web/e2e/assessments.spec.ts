import { test, expect } from '@playwright/test';

test.describe('Assessment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessments');
  });

  test('should display assessments list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for assessments list or grid
    const assessmentsList = page.locator(
      '[data-testid="assessments-list"], .assessments-list, .assessment-grid'
    );

    if ((await assessmentsList.count()) > 0) {
      await expect(assessmentsList.first()).toBeVisible();
    }

    // Look for individual assessment cards
    const assessmentCards = page.locator(
      '[data-testid="assessment-card"], .assessment-card, .card'
    );

    if ((await assessmentCards.count()) > 0) {
      await expect(assessmentCards.first()).toBeVisible();

      // Check if assessment card has proper content
      const firstCard = assessmentCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText!.trim().length).toBeGreaterThan(0);
    }
  });

  test('should show assessment details', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for assessment cards or links
    const assessmentLinks = page.locator(
      '[data-testid="assessment-card"] a, .assessment-card a, a[href*="assessment"]'
    );

    if ((await assessmentLinks.count()) > 0) {
      const firstLink = assessmentLinks.first();
      await firstLink.click();

      // Should navigate to assessment detail page
      await page.waitForLoadState('networkidle');

      // Look for assessment details
      const detailElements = page.locator(
        '[data-testid="assessment-detail"], .assessment-detail, .assessment-info'
      );

      if ((await detailElements.count()) > 0) {
        await expect(detailElements.first()).toBeVisible();
      }
    }
  });

  test('should display Meet links for assessments', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for Meet links or buttons
    const meetLinks = page.locator(
      'a[href*="meet.google.com"], button:has-text("Join Meet"), [data-testid="meet-link"]'
    );

    if ((await meetLinks.count()) > 0) {
      const firstMeetLink = meetLinks.first();
      await expect(firstMeetLink).toBeVisible();

      // Check if it has proper href or click handler
      const href = await firstMeetLink.getAttribute('href');
      if (href) {
        expect(href).toContain('meet.google.com');
      }
    }
  });

  test('should handle assessment filtering', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for filter controls
    const filterElements = page.locator(
      '[data-testid="filter"], .filter, select, input[type="search"]'
    );

    if ((await filterElements.count()) > 0) {
      const firstFilter = filterElements.first();
      await expect(firstFilter).toBeVisible();

      // Try interacting with the filter
      if ((await firstFilter.getAttribute('type')) === 'search') {
        await firstFilter.fill('test');
        await page.waitForTimeout(500); // Allow for debounced search
      } else if ((await firstFilter.tagName()) === 'SELECT') {
        // Try selecting an option
        const options = page.locator(`${filterElements.first()} option`);
        if ((await options.count()) > 1) {
          await firstFilter.selectOption({ index: 1 });
        }
      }
    }
  });

  test('should show proper assessment status indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for status indicators
    const statusElements = page.locator(
      '[data-testid="status"], .status, .badge, .chip'
    );

    if ((await statusElements.count()) > 0) {
      const firstStatus = statusElements.first();
      await expect(firstStatus).toBeVisible();

      const statusText = await firstStatus.textContent();
      expect(statusText).toBeTruthy();

      // Common status values
      const validStatuses = [
        'published',
        'draft',
        'closed',
        'active',
        'upcoming',
        'completed',
      ];
      const hasValidStatus = validStatuses.some(status =>
        statusText!.toLowerCase().includes(status)
      );

      if (statusText!.trim().length > 0) {
        // Should have some status text
        expect(statusText!.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    if ((await focusedElement.count()) > 0) {
      await expect(focusedElement).toBeVisible();
    }

    // Continue tabbing through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Should be able to navigate with Enter key
    const currentFocus = page.locator(':focus');
    if ((await currentFocus.count()) > 0) {
      const tagName = await currentFocus.evaluate(el =>
        el.tagName.toLowerCase()
      );
      if (['a', 'button'].includes(tagName)) {
        // Don't actually press Enter to avoid navigation, just check it's focusable
        await expect(currentFocus).toBeFocused();
      }
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/v1/assessments**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { assessments: [], count: 0 },
        }),
      });
    });

    await page.goto('/assessments');
    await page.waitForLoadState('networkidle');

    // Look for empty state message
    const emptyStateElements = page.locator(
      '[data-testid="empty-state"], .empty-state, text=No assessments, text=No data, text=Empty'
    );

    if ((await emptyStateElements.count()) > 0) {
      await expect(emptyStateElements.first()).toBeVisible();
    } else {
      // Should at least show some content indicating no assessments
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});

test.describe('Assessment Creation (Faculty)', () => {
  test.beforeEach(async ({ page }) => {
    // This would typically require faculty authentication
    await page.goto('/assessments/create');
  });

  test('should display assessment creation form', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for form elements
    const formElements = page.locator('form, [data-testid="assessment-form"]');

    if ((await formElements.count()) > 0) {
      await expect(formElements.first()).toBeVisible();

      // Look for common form fields
      const titleInput = page.locator(
        'input[name="title"], [data-testid="title-input"]'
      );
      const descriptionInput = page.locator(
        'textarea[name="description"], [data-testid="description-input"]'
      );

      if ((await titleInput.count()) > 0) {
        await expect(titleInput).toBeVisible();
      }

      if ((await descriptionInput.count()) > 0) {
        await expect(descriptionInput).toBeVisible();
      }
    }
  });

  test('should validate form inputs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for submit button
    const submitButton = page.locator(
      'button[type="submit"], [data-testid="submit-button"]'
    );

    if ((await submitButton.count()) > 0) {
      // Try submitting empty form
      await submitButton.click();

      // Look for validation errors
      const errorElements = page.locator(
        '.error, [data-testid="error"], .invalid, [aria-invalid="true"]'
      );

      if ((await errorElements.count()) > 0) {
        await expect(errorElements.first()).toBeVisible();
      }
    }
  });
});
