import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';
import { BASE_URL, buildUrl } from './config.js';

describe('Login E2E Tests', function () {
  this.timeout(60000); // Increased timeout for slower machines
  let driver;

  before(async () => {
    try {
      const options = new firefox.Options();
      //options.headless(); // remove if you want visible browser
      
      // Try to set Firefox binary path (common locations on Windows)
      const possibleFirefoxPaths = [
        'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
        'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
        join(process.env.LOCALAPPDATA || '', 'Mozilla Firefox\\firefox.exe'),
        join(process.env.PROGRAMFILES || '', 'Mozilla Firefox\\firefox.exe'),
      ];
      
      // Check which Firefox path exists
      for (const firefoxPath of possibleFirefoxPaths) {
        if (existsSync(firefoxPath)) {
          console.log('Found Firefox at:', firefoxPath);
          options.setBinary(firefoxPath);
          break;
        }
      }

      console.log('Attempting to start Firefox...');
      
      // Don't specify geckodriver path, let selenium-webdriver find it via PATH
      driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
      
      console.log('Firefox started successfully!');
    } catch (error) {
      console.error('Failed to start Firefox:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    // Clear cookies first (works even without being on a page)
    await driver.manage().deleteAllCookies();
    
    // Navigate to login page
    await driver.get(buildUrl('/bejelentkezes'));
    
    // Clear storage after page loads (now safe to execute JS)
    await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
    
    // Check if we're still on the login page (not redirected)
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/bejelentkezes')) {
      // We were redirected (probably due to existing auth), reload the page
      await driver.get(buildUrl('/bejelentkezes'));
    }
    
    // Wait a bit for the page to stabilize
    await driver.sleep(300);
  });

  it('loads the login page', async () => {
    // Wait for the login form to be present
    const loginForm = await driver.wait(
      until.elementLocated(By.css('[data-test="login-form"]')),
      10000
    );

    assert.ok(loginForm, 'Login form should be present');

    // Verify all required elements are present
    const usernameInput = await driver.findElement(By.css('[data-test="username-input"]'));
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    assert.ok(usernameInput, 'Username input should be present');
    assert.ok(passwordInput, 'Password input should be present');
    assert.ok(loginButton, 'Login button should be present');
  });

  it('shows error message on invalid credentials', async () => {
    // Wait for username input to be visible
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    // Enter invalid credentials
    await usernameInput.sendKeys('invaliduser');
    await passwordInput.sendKeys('wrongpassword');

    // Click login button
    await loginButton.click();

    // Wait for error alert to appear
    const errorAlert = await driver.wait(
      until.elementLocated(By.css('[data-test="error-alert"]')),
      10000
    );

    assert.ok(errorAlert, 'Error alert should be displayed');

    // Verify error message is present
    const errorMessage = await driver.findElement(By.css('[data-test="error-message"]'));
    const errorText = await errorMessage.getText();

    assert.ok(errorText.length > 0, 'Error message should not be empty');
  });

  it('successfully logs in with valid credentials', async () => {
    // Wait for username input to be visible
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    // Enter valid credentials (replace with actual test credentials)
    await usernameInput.sendKeys('Kovács Péter');
    await passwordInput.sendKeys('pwd123');

    // Click login button
    await loginButton.click();

    // Wait for redirect to home page
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );

    // Verify we're on the home page
    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl, buildUrl('/kezdolap'), 'Should redirect to home page');
  });

  it('validates required fields', async () => {
    // Wait for login button to be visible
    const loginButton = await driver.wait(
      until.elementLocated(By.css('[data-test="login-button"]')),
      10000
    );

    // Try to submit without filling in fields
    await loginButton.click();

    // The form should not submit (HTML5 validation)
    // We should still be on the login page
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/bejelentkezes'), 'Should remain on login page when fields are empty');
  });

  it('can close error message', async () => {
    // Wait for username input to be visible
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    // Enter invalid credentials to trigger error
    await usernameInput.sendKeys('invaliduser');
    await passwordInput.sendKeys('wrongpassword');
    await loginButton.click();

    // Wait for error alert to appear
    await driver.wait(
      until.elementLocated(By.css('[data-test="error-alert"]')),
      10000
    );

    // Find and click the close button
    const closeButton = await driver.findElement(By.css('[data-test="error-alert"] .btn-close'));
    await closeButton.click();

    // Wait a bit for the animation to complete
    await driver.sleep(500);

    // Verify error is no longer visible
    const errorAlerts = await driver.findElements(By.css('[data-test="error-alert"]'));
    assert.strictEqual(errorAlerts.length, 0, 'Error alert should be closed');
  });

  it('redirects to home if already logged in', async () => {
    // First, log in with valid credentials
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await usernameInput.sendKeys('Kovács Péter');
    await passwordInput.sendKeys('pwd123');
    await loginButton.click();

    // Wait for redirect to home page
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );

    // Now try to visit login page again
    await driver.get(buildUrl('/bejelentkezes'));

    // Should be redirected back to home page
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );

    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl, buildUrl('/kezdolap'), 'Should redirect to home page if already logged in');
  });
});