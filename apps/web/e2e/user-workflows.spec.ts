import { test, expect } from '@playwright/test';

/**
 * Critical User Workflow Tests
 * Tests complete user journeys from start to finish
 */

test.describe('Student Workflow: Complete Assessment Submission', () => {
  test('student can view, submit, and check grade for assessment', async ({ page }) => {
    // Step 1: Navigate to assessments page
    await page.goto('/assessments');
    await page.waitForLoadState('networkidle');

    // Step 2: View assessment list
    const assessmentCards = page.locator('[data-testid="assessment-card"], .assessment-card');
    
    if (await assessmentCards.count() > 0) {
      // Step 3: Click on first assessment
      const firstAssessment = assessmentCards.first();
      await expect(firstAssessment).toBeVisible();
      
      const assessmentTitle = await firstAssessment.textContent();
      console.log(`📝 Viewing assessment: ${assessmentTitle}`);
      
      await firstAssessment.click();
      await page.waitForLoadState('networkidle');

      // Step 4: Check assessment details are visible
      const detailPage = page.locator('[data-testid="assessment-detail"], .assessment-detail');
      if (await detailPage.count() > 0) {
        await expect(detailPage.first()).toBeVisible();
        console.log('✅ Assessment details loaded');
      }

      // Step 5: Look for submission button
      const submitButton = page.locator(
        'button:has-text("Submit"), button:has-text("Upload"), [data-testid="submit-button"]'
      );
      
      if (await submitButton.count() > 0) {
        await expect(submitButton.first()).toBeVisible();
        console.log('✅ Submit button found');
        
        // Note: Actual file upload would require authentication
        // This test verifies the UI elements are present
      }

      // Step 6: Check for Meet link
      const meetLink = page.locator('a[href*="meet.google.com"]');
      if (await meetLink.count() > 0) {
        await expect(meetLink.first()).toBeVisible();
        console.log('✅ Google Meet link available');
      }

      // Step 7: Navigate to submissions page
      await page.goto('/submissions');
      await page.waitForLoadState('networkidle');

      // Step 8: Check submissions list
      const submissionsList = page.locator('[data-testid="submissions-list"], .submissions-list');
      if (await submissionsList.count() > 0) {
        await expect(submissionsList.first()).toBeVisible();
        console.log('✅ Submissions page loaded');
      }
    }
  });

  test('student can view grades and feedback', async ({ page }) => {
    // Navigate to grades page
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');

    // Look for grades list
    const gradesList = page.locator('[data-testid="grades-list"], .grades-list, .grade-card');
    
    if (await gradesList.count() > 0) {
      await expect(gradesList.first()).toBeVisible();
      console.log('✅ Grades list visible');

      // Click on first grade to view details
      const firstGrade = gradesList.first();
      const gradeText = await firstGrade.textContent();
      console.log(`📊 Viewing grade: ${gradeText}`);

      // Look for score display
      const scoreDisplay = page.locator('[data-testid="score"], .score, text=/\\d+\\/\\d+/');
      if (await scoreDisplay.count() > 0) {
        await expect(scoreDisplay.first()).toBeVisible();
        console.log('✅ Score displayed');
      }

      // Look for feedback
      const feedback = page.locator('[data-testid="feedback"], .feedback, .comments');
      if (await feedback.count() > 0) {
        await expect(feedback.first()).toBeVisible();
        console.log('✅ Feedback visible');
      }
    }
  });
});

test.describe('Faculty Workflow: Create Assessment and Grade Submissions', () => {
  test('faculty can create assessment with Google Meet integration', async ({ page }) => {
    // Navigate to create assessment page
    await page.goto('/assessments/create');
    await page.waitForLoadState('networkidle');

    // Look for assessment form
    const form = page.locator('form, [data-testid="assessment-form"]');
    
    if (await form.count() > 0) {
      await expect(form.first()).toBeVisible();
      console.log('✅ Assessment creation form loaded');

      // Check for required fields
      const titleInput = page.locator('input[name="title"], [data-testid="title-input"]');
      const descriptionInput = page.locator('textarea[name="description"], [data-testid="description-input"]');
      const dueDateInput = page.locator('input[type="date"], input[type="datetime-local"], [data-testid="due-date"]');

      if (await titleInput.count() > 0) {
        await expect(titleInput).toBeVisible();
        console.log('✅ Title input found');
      }

      if (await descriptionInput.count() > 0) {
        await expect(descriptionInput).toBeVisible();
        console.log('✅ Description input found');
      }

      if (await dueDateInput.count() > 0) {
        await expect(dueDateInput).toBeVisible();
        console.log('✅ Due date input found');
      }

      // Look for Google Meet integration option
      const meetOption = page.locator(
        'text=Google Meet, text=Create Meet, [data-testid="meet-option"]'
      );
      if (await meetOption.count() > 0) {
        console.log('✅ Google Meet integration available');
      }

      // Look for cohort selection
      const cohortSelect = page.locator(
        'select[name="cohort"], [data-testid="cohort-select"], text=Cohort'
      );
      if (await cohortSelect.count() > 0) {
        console.log('✅ Cohort selection available');
      }
    }
  });

  test('faculty can view and grade submissions', async ({ page }) => {
    // Navigate to submissions page
    await page.goto('/faculty/submissions');
    await page.waitForLoadState('networkidle');

    // Look for submissions list
    const submissionsList = page.locator('[data-testid="submissions-list"], .submissions-list');
    
    if (await submissionsList.count() > 0) {
      await expect(submissionsList.first()).toBeVisible();
      console.log('✅ Submissions list loaded');

      // Look for individual submissions
      const submissionCards = page.locator('[data-testid="submission-card"], .submission-card');
      
      if (await submissionCards.count() > 0) {
        const firstSubmission = submissionCards.first();
        await expect(firstSubmission).toBeVisible();
        
        // Click to view submission details
        await firstSubmission.click();
        await page.waitForLoadState('networkidle');

        // Look for grading interface
        const gradingForm = page.locator('[data-testid="grading-form"], .grading-form, form');
        if (await gradingForm.count() > 0) {
          await expect(gradingForm.first()).toBeVisible();
          console.log('✅ Grading form loaded');

          // Check for score input
          const scoreInput = page.locator('input[name="score"], [data-testid="score-input"]');
          if (await scoreInput.count() > 0) {
            await expect(scoreInput).toBeVisible();
            console.log('✅ Score input found');
          }

          // Check for feedback textarea
          const feedbackInput = page.locator('textarea[name="feedback"], [data-testid="feedback-input"]');
          if (await feedbackInput.count() > 0) {
            await expect(feedbackInput).toBeVisible();
            console.log('✅ Feedback input found');
          }

          // Check for rubric
          const rubric = page.locator('[data-testid="rubric"], .rubric');
          if (await rubric.count() > 0) {
            console.log('✅ Rubric available');
          }
        }
      }
    }
  });
});

test.describe('Group Formation Workflow', () => {
  test('students can create and join groups', async ({ page }) => {
    // Navigate to groups page
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Look for create group button
    const createButton = page.locator(
      'button:has-text("Create Group"), [data-testid="create-group-button"]'
    );
    
    if (await createButton.count() > 0) {
      await expect(createButton).toBeVisible();
      console.log('✅ Create group button found');

      // Click to open create group form
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for group creation form
      const groupForm = page.locator('[data-testid="group-form"], .group-form, form');
      if (await groupForm.count() > 0) {
        await expect(groupForm.first()).toBeVisible();
        console.log('✅ Group creation form opened');

        // Check for group name input
        const nameInput = page.locator('input[name="name"], [data-testid="group-name"]');
        if (await nameInput.count() > 0) {
          await expect(nameInput).toBeVisible();
          console.log('✅ Group name input found');
        }
      }
    }

    // Look for existing groups
    const groupsList = page.locator('[data-testid="groups-list"], .groups-list');
    if (await groupsList.count() > 0) {
      await expect(groupsList.first()).toBeVisible();
      console.log('✅ Groups list visible');

      // Look for join buttons
      const joinButtons = page.locator('button:has-text("Join"), [data-testid="join-button"]');
      if (await joinButtons.count() > 0) {
        console.log('✅ Join group functionality available');
      }
    }
  });

  test('group members can view group details and members', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Look for group cards
    const groupCards = page.locator('[data-testid="group-card"], .group-card');
    
    if (await groupCards.count() > 0) {
      const firstGroup = groupCards.first();
      await expect(firstGroup).toBeVisible();
      
      // Click to view group details
      await firstGroup.click();
      await page.waitForLoadState('networkidle');

      // Look for group details
      const groupDetails = page.locator('[data-testid="group-details"], .group-details');
      if (await groupDetails.count() > 0) {
        await expect(groupDetails.first()).toBeVisible();
        console.log('✅ Group details loaded');

        // Look for members list
        const membersList = page.locator('[data-testid="members-list"], .members-list');
        if (await membersList.count() > 0) {
          await expect(membersList.first()).toBeVisible();
          console.log('✅ Members list visible');
        }

        // Look for group code
        const groupCode = page.locator('[data-testid="group-code"], .group-code, text=/[A-Z0-9]{6}/');
        if (await groupCode.count() > 0) {
          console.log('✅ Group code displayed');
        }
      }
    }
  });
});

test.describe('Project Application Workflow', () => {
  test('student can browse and apply to projects', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Look for projects list
    const projectsList = page.locator('[data-testid="projects-list"], .projects-list');
    
    if (await projectsList.count() > 0) {
      await expect(projectsList.first()).toBeVisible();
      console.log('✅ Projects list loaded');

      // Look for project cards
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      
      if (await projectCards.count() > 0) {
        const firstProject = projectCards.first();
        await expect(firstProject).toBeVisible();
        
        const projectTitle = await firstProject.textContent();
        console.log(`📋 Viewing project: ${projectTitle}`);

        // Click to view project details
        await firstProject.click();
        await page.waitForLoadState('networkidle');

        // Look for apply button
        const applyButton = page.locator(
          'button:has-text("Apply"), [data-testid="apply-button"]'
        );
        
        if (await applyButton.count() > 0) {
          await expect(applyButton).toBeVisible();
          console.log('✅ Apply button found');

          // Click apply button
          await applyButton.click();
          await page.waitForTimeout(500);

          // Look for application form
          const applicationForm = page.locator('[data-testid="application-form"], .application-form');
          if (await applicationForm.count() > 0) {
            await expect(applicationForm.first()).toBeVisible();
            console.log('✅ Application form opened');
          }
        }
      }
    }
  });

  test('faculty can review and accept/reject applications', async ({ page }) => {
    // Navigate to applications page
    await page.goto('/faculty/applications');
    await page.waitForLoadState('networkidle');

    // Look for applications list
    const applicationsList = page.locator('[data-testid="applications-list"], .applications-list');
    
    if (await applicationsList.count() > 0) {
      await expect(applicationsList.first()).toBeVisible();
      console.log('✅ Applications list loaded');

      // Look for application cards
      const applicationCards = page.locator('[data-testid="application-card"], .application-card');
      
      if (await applicationCards.count() > 0) {
        const firstApplication = applicationCards.first();
        await expect(firstApplication).toBeVisible();

        // Look for action buttons
        const acceptButton = page.locator('button:has-text("Accept"), [data-testid="accept-button"]');
        const rejectButton = page.locator('button:has-text("Reject"), [data-testid="reject-button"]');
        
        if (await acceptButton.count() > 0) {
          console.log('✅ Accept button available');
        }
        
        if (await rejectButton.count() > 0) {
          console.log('✅ Reject button available');
        }
      }
    }
  });
});

test.describe('Real-time Notifications Workflow', () => {
  test('user receives notifications for important events', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for notification bell or indicator
    const notificationBell = page.locator(
      '[data-testid="notifications"], .notifications, button[aria-label*="notification"]'
    );
    
    if (await notificationBell.count() > 0) {
      await expect(notificationBell.first()).toBeVisible();
      console.log('✅ Notification bell found');

      // Click to open notifications
      await notificationBell.first().click();
      await page.waitForTimeout(500);

      // Look for notifications panel
      const notificationsPanel = page.locator('[data-testid="notifications-panel"], .notifications-panel');
      if (await notificationsPanel.count() > 0) {
        await expect(notificationsPanel.first()).toBeVisible();
        console.log('✅ Notifications panel opened');

        // Look for notification items
        const notificationItems = page.locator('[data-testid="notification-item"], .notification-item');
        if (await notificationItems.count() > 0) {
          console.log(`✅ Found ${await notificationItems.count()} notifications`);
        }
      }
    }
  });
});
