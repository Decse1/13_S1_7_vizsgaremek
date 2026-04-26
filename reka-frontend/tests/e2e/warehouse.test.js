import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';
import { BASE_URL, buildUrl } from './config.js';

describe('Raktár E2E-tesztek', function () {
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
          console.log('Firefox megtalálva itt:', firefoxPath);
          options.setBinary(firefoxPath);
          break;
        }
      }

      console.log('Firefox elindítása folyamatban...');
      
      driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
      
      console.log('Firefox sikeresen elindítva!');
    } catch (error) {
      console.error('Hiba a Firefox elindítása során:', error.message);
      console.error('Hiba verem:', error.stack);
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

  it('új termék sikeres felvétele az összes szükséges adattal', async () => {
    console.log('Teszt: Új termék felvétele');
    
    // Login with user that has subscription and permissions
    await login('Kovács Péter', 'pwd123');
    console.log('✓ Bejelentkezve');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Raktárra navigálva');

    // Verify page loaded
    const pageTitle = await driver.findElement(By.css('[data-test="page-title"]'));
    const titleText = await pageTitle.getText();
    assert.strictEqual(titleText, 'Raktár', 'Az oldal címének "Raktár"-nak kell lennie');

    // Click on 'Új termék felvétele' button
    const addProductBtn = await driver.wait(
      until.elementLocated(By.css('[data-test="add-product-btn"]')),
      10000
    );
    await addProductBtn.click();
    console.log('✓ Új termék hozzáadása gomb lekattintva');

    // Wait for modal to appear
    const addModal = await driver.wait(
      until.elementLocated(By.css('[data-test="add-product-modal"]')),
      10000
    );
    assert.ok(addModal, 'Új termék hozzáadása ablakának meg kell jelennie');
    console.log('✓ Ablak megnyitva');

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

    // Kategória - add form input
    const categorySelect = await driver.findElement(By.css('[data-test="add-product-category-input"]'));
    await categorySelect.sendKeys('Irodaszer');

    // ÁFA kulcs
    const afaInput = await driver.findElement(By.css('[data-test="add-product-vat-input"]'));
    await afaInput.clear();
    await afaInput.sendKeys('27');

    console.log('✓ Űrlap kitöltve');

    // Click Save button
    const saveButton = await driver.findElement(By.css('[data-test="add-modal-save-btn"]'));
    await saveButton.click();
    console.log('✓ Mentés gomb lekattintva');

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

    console.log('✓ Oldal újratöltve');

    // Verify the product appears in the table
    const tableBody = await driver.findElement(By.css('[data-test="products-table"] tbody'));
    const tableHTML = await tableBody.getAttribute('innerHTML');
    
    assert.ok(
      tableHTML.includes('Tesztrúd') || tableHTML.includes('RUD-001'),
      'Az új terméknek meg kell jelennie a táblázatban'
    );
    console.log('✓ Az új termék megjelent a táblázatban');

    console.log('✅ Teszt teljesítve: A termék sikeresen hozzáadásra került');
  });

  it('előfizetés szükséges figyelmeztetés megjelenítése előfizetéssel nem rendelkező felhasználók részére', async () => {
    console.log('Teszt: Előfizetés szükséges figyelmeztetés megjelenítése');
    
    // Login with user that does NOT have subscription
    // Note: You'll need to replace these credentials with actual test user without subscription
    await login('Molnár Zoltán', 'pwd123');
    console.log('✓ Bejelentkezve');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Raktárra navigálva');

    // Verify subscription warning is present
    const subscriptionWarning = await driver.wait(
      until.elementLocated(By.css('[data-test="subscription-required-warning"]')),
      10000
    );
    assert.ok(subscriptionWarning, 'Előfizetés szükséges figyelmeztetésnek láthatónak kell lennie');
    
    const warningText = await subscriptionWarning.getText();
    assert.ok(warningText.length > 0, 'Az figyelmeztető üzenet nem lehet üres');
    console.log('✓ Előfizetési figyelmeztetés megjelenítve');

    // Verify add button is NOT present
    const addButtons = await driver.findElements(By.css('[data-test="add-product-btn"]'));
    assert.strictEqual(addButtons.length, 0, 'Az új termék hozzáadása gomb nem lehet látható előfizetés nélkül');

    console.log('✅ Teszt teljesítve: Előfizetési figyelmeztetés helyesen jelenik meg');
  });

  it('nem jelenik meg semmilyen gomb vagy figyelmezetés megfelelő engedéllyel nem rendelkező felhasználóknak', async () => {
    console.log('Teszt: Nincs engedély - nem látható "Új termék hozzáadása" gomb');
    
    // Login with user that has NO permissions to access warehouse features
    // Note: You'll need to replace these credentials with actual test user without permissions
    await login('osszeallit', 'pwd123');
    console.log('✓ Bejelentkezve');

    // Navigate to warehouse
    await navigateToWarehouse();
    console.log('✓ Raktárra navigálva');

    // Verify neither add button nor subscription warning are present
    const addButtons = await driver.findElements(By.css('[data-test="add-product-btn"]'));
    assert.strictEqual(addButtons.length, 0, 'Az új termék hozzáadása gomb nem lehet látható engedély nélkül');
    console.log('✓ Új termék hozzáadása gomb nem látható');

    const subscriptionWarnings = await driver.findElements(By.css('[data-test="subscription-required-warning"]'));
    assert.strictEqual(subscriptionWarnings.length, 0, 'Az előfizetés szükséges figyelmeztetés nem lehet látható engedély nélkül');
    console.log('✓ Előfizetési figyelmeztetés nem látható');

    console.log('✅ Teszt teljesítve: Nem látható "Új termék hozzáadása" gomb engedéllyel nem rendelkező felhasználók számára');
  });

  it('Raktár menü elrejtése megfelelő engedéllyel nem rendelkező felhasználók számára', async () => {
    console.log('Teszt: Raktár menü nem látható engedély nélküli felhasználók számára');
    
    // Login with user that does NOT have access to Raktár at all
    // Note: You'll need to replace these credentials with actual test user without access
    await login('lead', 'pwd123');
    console.log('✓ Bejelentkezve');

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
    assert.strictEqual(warehouseMenuItems.length, 0, 'A raktár menüelem nem lehet látható a szükséges engedély nélkül');
    console.log('✓ Raktár menüelem nem látható');

    // Close sidebar on mobile if it was opened
    if (isMobileView) {
      const overlay = await driver.findElement(By.css('.overlay'));
      await overlay.click();
      await driver.sleep(300);
    }

    console.log('✅ Teszt teljesítve: Raktár menü elrejtve engedély nélküli felhasználók számára');
  });

  it('oldalsáv interakció tesztelése a raktár oldalára mobilos nézeten', async () => {
    console.log('Teszt: Mobilos nézet oldalsáv interakció');
    
    // Login
    await login('Kovács Péter', 'pwd123');
    console.log('✓ Bejelentkezve');

    // Resize to mobile view
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(300);
    console.log('✓ Mobilos nézetre átméretezve');

    // Open sidebar with hamburger menu
    const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
    await hamburgerButton.click();
    await driver.sleep(300);
    console.log('✓ Oldalsáv megnyitva');

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
    assert.ok(currentUrl.includes('/raktar'), 'A raktár oldalára kell navigálnia');
    console.log('✓ Raktárra navigálva mobil nézetben');

    // Restore window size
    await driver.manage().window().setRect({ width: 1280, height: 720 });

    console.log('✅ Teszt teljesítve: A mobilos navigáció helyesen működik');
  });
});

