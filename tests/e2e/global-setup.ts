import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Setting up E2E test authentication...');

  try {
    // Hit the test login endpoint to get authentication token
    const response = await page.goto(`${baseURL}/api/test-login`, { 
      waitUntil: 'networkidle' 
    });

    if (!response || !response.ok()) {
      throw new Error(`Test login failed: ${response?.status()}`);
    }

    // Get the authentication token from the response
    const loginData = await response.json();
    if (!loginData.success || !loginData.token) {
      throw new Error('Test login response missing token');
    }

    // Store the token in localStorage for the client-side tests
    await page.addInitScript((token) => {
      localStorage.setItem('e2e-test-token', token);
    }, loginData.token);

    // Go to home page to establish app context with authentication
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    // Save the storage state (cookies, localStorage, etc.) for reuse in tests
    await page.context().storageState({ path: storageState as string });

    console.log('E2E test authentication setup complete');
  } catch (error) {
    console.error('Failed to setup E2E authentication:', error);
    throw error;
  } finally {
    await browser.close();
  }
}