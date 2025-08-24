import { test, expect } from '@playwright/test';

test.describe('BetterAI Smoke Tests', () => {
  
  test('should load landing page and navigate to leaderboard', async ({ page }) => {
    // Navigate to home page (unauthenticated - should show landing page)
    await page.goto('/');
    
    // Check if we're on the landing page (unauthenticated view)
    await expect(page.getByTestId('better-definition-1')).toBeVisible();
    await expect(page.getByText('What is BetterAI?')).toBeVisible();
    
    // Click on the leaderboard link from landing page
    await page.getByTestId('landing-leaderboard-link').click();
    
    // Should navigate to leaderboard page
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.getByText('AI Leaderboard')).toBeVisible();
  });

  test('authenticated user can see dashboard and predictions', async ({ page }) => {
    // This test uses the authenticated state from global setup
    
    // Navigate to home page (authenticated - should show dashboard)
    await page.goto('/');
    
    // Should see the authenticated home page with predictions
    await expect(page.getByTestId('home-page-header')).toBeVisible();
    await expect(page.getByText('Today\'s Top AI Market Predictions')).toBeVisible();
    
    // Should see predictions section
    await expect(page.getByTestId('predictions-section')).toBeVisible();
    
    // Wait for predictions to load and check if any prediction items exist
    await page.waitForSelector('[data-testid="predictions-list"]', { timeout: 10000 });
    
    // Check if there are prediction items (at least check the structure exists)
    const predictionsList = page.getByTestId('predictions-list');
    await expect(predictionsList).toBeVisible();
  });

  test('can navigate to AI leaderboard from header', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Click on AI Leaderboard in main navigation
    await page.getByTestId('nav-leaderboard').click();
    
    // Should navigate to leaderboard page
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.getByText('AI Leaderboard')).toBeVisible();
  });

  test('can navigate between main pages using header navigation', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Navigate to About page
    await page.getByTestId('nav-about').click();
    await expect(page).toHaveURL(/\/about/);
    
    // Navigate to Docs page
    await page.getByTestId('nav-docs').click();
    await expect(page).toHaveURL(/\/docs/);
    
    // Navigate back to Home
    await page.getByTestId('nav-home').click();
    await expect(page).toHaveURL(/^\//); // Exact home URL
  });

  test('can click on a prediction item', async ({ page }) => {
    // Navigate to authenticated home page
    await page.goto('/');
    
    // Wait for predictions to load
    await page.waitForSelector('[data-testid="predictions-list"]', { timeout: 10000 });
    
    // Look for the first prediction item
    const firstPrediction = page.locator('[data-testid^="prediction-item-"]').first();
    
    if (await firstPrediction.count() > 0) {
      // Click on the first prediction
      await firstPrediction.click();
      
      // Should navigate to a prediction detail page
      await expect(page).toHaveURL(/\/prediction\/.+/);
    } else {
      // If no predictions exist, just verify the structure is in place
      console.log('No predictions found, but structure is correct');
      await expect(page.getByTestId('predictions-list')).toBeVisible();
    }
  });

  test('main navigation is visible and functional', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Check that main navigation is visible
    await expect(page.getByTestId('main-navigation')).toBeVisible();
    
    // Check all navigation links are present
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('nav-leaderboard')).toBeVisible();
    await expect(page.getByTestId('nav-about')).toBeVisible();
    await expect(page.getByTestId('nav-docs')).toBeVisible();
  });

  test('page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that no critical JavaScript errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('net::ERR_') && // Ignore network errors
      !error.includes('404') // Ignore 404s
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});