import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';
import { BASE_URL, buildUrl } from './config.js';

describe('Warehouse (Raktár) E2E Tests', function () {
  this.timeout(90000); // Increased timeout for complex operations
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
    // Clear cookies and storage
    await driver.manage().deleteAllCookies();
    await driver.get(buildUrl('/bejelentkezes'));
    await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
    
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/bejelentkezes')) {
      await driver.get(buildUrl('/bejelentkezes'));
    }
    
    await driver.sleep(300);
  });

  // Helper function to login
  async function login(username, password) {
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await usernameInput.sendKeys(username);
    await passwordInput.sendKeys(password);
    await loginButton.click();

    // Wait for redirect
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );
    
    await driver.sleep(500); // Wait for page to stabilize
  }

  // Helper function to navigate to Raktár
  async function navigateToWarehouse() {
    // Get current window size to determine if we're in mobile view
    const windowSize = await driver.manage().window().getSize();
    const isMobileView = windowSize.width < 992;

    // On mobile, open the sidebar first
    if (isMobileView) {
      const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
      await hamburgerButton.click();
      await driver.sleep(300); // Wait for sidebar animation
    }

    // Click on Raktár menu item
    const warehouseMenuItem = await driver.wait(
      until.elementLocated(By.css('[data-test="sb-menu-warehouse"]')),
      10000
    );
    await warehouseMenuItem.click();

    // Wait for navigation
    await driver.wait(
      until.urlContains('/raktar'),
      5000
    );

    await driver.sleep(500); // Wait for page to load
  }

  it('successfully adds a new product with all required data', async () => {
    console.log('Test: Add new product');
    
    // Login with user that has subscription and permissions
    await login('Kovács Péter', 'pwd123');
    console.log('✓ Logged in');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Navigated to Raktár');

    // Verify page loaded
    const pageTitle = await driver.findElement(By.css('[data-test="page-title"]'));
    const titleText = await pageTitle.getText();
    assert.strictEqual(titleText, 'Raktár', 'Page title should be "Raktár"');

    // Click on 'Új termék felvétele' button
    const addProductBtn = await driver.wait(
      until.elementLocated(By.css('[data-test="add-product-btn"]')),
      10000
    );
    await addProductBtn.click();
    console.log('✓ Clicked add product button');

    // Wait for modal to appear
    const addModal = await driver.wait(
      until.elementLocated(By.css('[data-test="add-product-modal"]')),
      10000
    );
    assert.ok(addModal, 'Add product modal should be visible');
    console.log('✓ Modal opened');

    // Fill in the form
    // Terméknév
    const nameInput = await driver.findElement(By.css('[data-test="add-product-name-input"]'));
    await nameInput.sendKeys('Tesztrúd');

    // Készlet
    const stockInput = await driver.findElement(By.css('[data-test="add-product-stock-input"]'));
    await stockInput.clear();
    await stockInput.sendKeys('60');

    // Cikkszám
    const cikkszamInput = await driver.findElement(By.css('[data-test="add-product-cikkszam-input"]'));
    await cikkszamInput.sendKeys('RUD-001');

    // Kiszerelés
    const kiszerelesInput = await driver.findElement(By.css('[data-test="add-product-kiszereles-input"]'));
    await kiszerelesInput.sendKeys('db');

    // Minimum vásárlási mennyiség
    const minVasInput = await driver.findElement(By.css('[data-test="add-product-min-quantity-input"]'));
    await minVasInput.clear();
    await minVasInput.sendKeys('1');

    // Leírás
    const leirasInput = await driver.findElement(By.css('[data-test="add-product-description-input"]'));
    await leirasInput.sendKeys('Ez egy tesztrúd');

    // Ár
    const arInput = await driver.findElement(By.css('[data-test="add-product-price-input"]'));
    await arInput.clear();
    await arInput.sendKeys('4000');

    // Kategória - select by visible text
    const categorySelect = await driver.findElement(By.css('[data-test="add-product-category-select"]'));
    await categorySelect.sendKeys('Irodaszer');

    // ÁFA kulcs
    const afaInput = await driver.findElement(By.css('[data-test="add-product-vat-input"]'));
    await afaInput.clear();
    await afaInput.sendKeys('27');

    console.log('✓ Form filled');

    // Click Save button
    const saveButton = await driver.findElement(By.css('[data-test="add-modal-save-btn"]'));
    await saveButton.click();
    console.log('✓ Clicked save button');

    // Wait for page refresh - the page reloads after successful save
    await driver.sleep(2000); // Give time for the reload

    // Wait for the page to load again
    await driver.wait(
      until.urlContains('/raktar'),
      10000
    );

    // Wait for products table to be visible
    await driver.wait(
      until.elementLocated(By.css('[data-test="products-table"]')),
      10000
    );

    console.log('✓ Page reloaded');

    // Verify the product appears in the table
    const tableBody = await driver.findElement(By.css('[data-test="products-table"] tbody'));
    const tableHTML = await tableBody.getAttribute('innerHTML');
    
    assert.ok(
      tableHTML.includes('Tesztrúd') || tableHTML.includes('RUD-001'),
      'New product should appear in the table'
    );
    console.log('✓ New product verified in table');

    console.log('✅ Test passed: Product added successfully');
  });

  it('shows subscription required warning for users without subscription', async () => {
    console.log('Test: Subscription required warning');
    
    // Login with user that does NOT have subscription
    // Note: You'll need to replace these credentials with actual test user without subscription
    await login('Molnár Zoltán', 'pwd123');
    console.log('✓ Logged in');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Navigated to Raktár');

    // Verify subscription warning is present
    const subscriptionWarning = await driver.wait(
      until.elementLocated(By.css('[data-test="subscription-required-warning"]')),
      10000
    );
    assert.ok(subscriptionWarning, 'Subscription required warning should be visible');
    
    const warningText = await subscriptionWarning.getText();
    assert.ok(warningText.length > 0, 'Warning message should not be empty');
    console.log('✓ Subscription warning verified');

    // Verify add button is NOT present
    const addButtons = await driver.findElements(By.css('[data-test="add-product-btn"]'));
    assert.strictEqual(addButtons.length, 0, 'Add product button should not be present without subscription');

    console.log('✅ Test passed: Subscription warning displayed correctly');
  });

  it('shows neither add button nor subscription warning for users without permissions', async () => {
    console.log('Test: No permissions - no buttons visible');
    
    // Login with user that has NO permissions to access warehouse features
    // Note: You'll need to replace these credentials with actual test user without permissions
    await login('osszeallit', 'pwd123');
    console.log('✓ Logged in');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Navigated to Raktár');

    // Verify neither add button nor subscription warning are present
    const addButtons = await driver.findElements(By.css('[data-test="add-product-btn"]'));
    assert.strictEqual(addButtons.length, 0, 'Add product button should not be present without permissions');
    console.log('✓ Add button not present');

    const subscriptionWarnings = await driver.findElements(By.css('[data-test="subscription-required-warning"]'));
    assert.strictEqual(subscriptionWarnings.length, 0, 'Subscription warning should not be present without permissions');
    console.log('✓ Subscription warning not present');

    console.log('✅ Test passed: No buttons visible for users without permissions');
  });

  it('hides Raktár menu option for users without access', async () => {
    console.log('Test: Raktár menu not visible without access');
    
    // Login with user that does NOT have access to Raktár at all
    // Note: You'll need to replace these credentials with actual test user without access
    await login('lead', 'pwd123');
    console.log('✓ Logged in');

    // Get current window size to determine if we're in mobile view
    const windowSize = await driver.manage().window().getSize();
    const isMobileView = windowSize.width < 992;

    // On mobile, open the sidebar first
    if (isMobileView) {
      const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
      await hamburgerButton.click();
      await driver.sleep(300); // Wait for sidebar animation
    }

    // Try to find Raktár menu item - it should NOT be present
    const warehouseMenuItems = await driver.findElements(By.css('[data-test="sb-menu-warehouse"]'));
    assert.strictEqual(warehouseMenuItems.length, 0, 'Raktár menu item should not be present for users without access');
    console.log('✓ Raktár menu item not found (as expected)');

    // Close sidebar on mobile if it was opened
    if (isMobileView) {
      const overlay = await driver.findElement(By.css('.overlay'));
      await overlay.click();
      await driver.sleep(300);
    }

    console.log('✅ Test passed: Raktár menu hidden for users without access');
  });

  it('tests mobile view sidebar interaction for warehouse page', async () => {
    console.log('Test: Mobile view sidebar interaction');
    
    // Login
    await login('Kovács Péter', 'pwd123');
    console.log('✓ Logged in');

    // Resize to mobile view
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(300);
    console.log('✓ Resized to mobile view');

    // Open sidebar with hamburger menu
    const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
    await hamburgerButton.click();
    await driver.sleep(300);
    console.log('✓ Sidebar opened');

    // Click on Raktár
    const warehouseMenuItem = await driver.wait(
      until.elementLocated(By.css('[data-test="sb-menu-warehouse"]')),
      10000
    );
    await warehouseMenuItem.click();

    // Wait for navigation
    await driver.wait(
      until.urlContains('/raktar'),
      5000
    );

    // Verify we're on the warehouse page
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/raktar'), 'Should navigate to warehouse page');
    console.log('✓ Navigated to Raktár on mobile');

    // Restore window size
    await driver.manage().window().setRect({ width: 1280, height: 720 });

    console.log('✅ Test passed: Mobile navigation works correctly');
  });
});

