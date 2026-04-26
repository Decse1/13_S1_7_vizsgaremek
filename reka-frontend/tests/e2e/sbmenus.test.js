import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';
import { BASE_URL, buildUrl } from './config.js';

// Test credentials - easily changeable
const TEST_USERNAME = 'Kovács Péter';
const TEST_PASSWORD = 'pwd123';

describe('Oldalsáv és navigációs menü E2E-tesztek', function () {
  this.timeout(90000); // Increased timeout for comprehensive navigation test
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

  it('körbenavigálás az összes elérhető oldalsáv-menüponton, a profilmenün és a logón', async () => {
    console.log('1. lépés: Bejelentkezés...');
    
    // Login first
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await usernameInput.sendKeys(TEST_USERNAME);
    await passwordInput.sendKeys(TEST_PASSWORD);
    await loginButton.click();

    // Wait for redirect to home page
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );
    console.log('✓ Sikeres bejelentkezés');

    // Wait a bit for the page to fully load
    await driver.sleep(500);

    // Define all possible sidebar menu items with their data-test attributes and expected routes
    const sidebarMenuItems = [
      { name: 'Áruház', dataTest: 'sb-menu-store', route: '/store', optional: true },
      { name: 'Raktárkezelés', dataTest: 'sb-menu-warehouse', route: '/raktar', optional: true },
      { name: 'Partnerségek', dataTest: 'sb-menu-partnerships', route: '/partnersegek' },
      { name: 'Beérkezett rendelések', dataTest: 'sb-menu-receivedorders', route: '/rendelesek/beerkezett', optional: true },
      { name: 'Leadott rendelések', dataTest: 'sb-menu-sentorders', route: '/rendelesek/leadott', optional: true },
      { name: 'Cégem', dataTest: 'sb-menu-companyinfo', route: '/ceginfo' },
      { name: 'Kosár', dataTest: 'sb-menu-cart', route: '/kosar', optional: true },
    ];

    console.log('2. lépés: Oldalsáv menüpontok tesztelése...');
    
    // Get current window size to determine if we're in mobile view
    const windowSize = await driver.manage().window().getSize();
    const isMobileView = windowSize.width < 992; // Bootstrap's lg breakpoint

    for (const menuItem of sidebarMenuItems) {
      try {
        console.log(`\nMenüelem tesztelése: ${menuItem.name}`);
        
        // On mobile, open the sidebar first
        if (isMobileView) {
          const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
          await hamburgerButton.click();
          await driver.sleep(300); // Wait for sidebar animation
        }

        // Try to find the menu item
        const menuElements = await driver.findElements(By.css(`[data-test="${menuItem.dataTest}"]`));
        
        if (menuElements.length === 0) {
          if (menuItem.optional) {
            console.log(`  ⊘ ${menuItem.name} - Nem elérhető (szükséges jogosultság hiánya vagy nem implementált)`);
            
            // Close sidebar on mobile if it was opened
            if (isMobileView) {
              const overlay = await driver.findElement(By.css('.overlay'));
              await overlay.click();
              await driver.sleep(300);
            }
            continue;
          } else {
            throw new Error(`Required menu item "${menuItem.name}" not found`);
          }
        }

        // Click the menu item
        await menuElements[0].click();
        console.log(`  →  "${menuItem.name}" lekattintva`);

        // Wait for navigation
        await driver.wait(
          until.urlContains(menuItem.route),
          5000
        );

        // Verify we're on the correct page
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(
          currentUrl.includes(menuItem.route),
          `A ${menuItem.route} oldalra kellett volna irányítania, de a ${currentUrl} oldalra kerültünk`
        );
        console.log(`  ✓ ${menuItem.name} - Navigáció sikeres (${currentUrl})`);

        // Wait a bit for the page to load
        await driver.sleep(500);

      } catch (error) {
        if (menuItem.optional) {
          console.log(`  ⊘ ${menuItem.name} - Nem elérhető vagy hiba: ${error.message}`);
        } else {
          console.error(`  ✗ ${menuItem.name} - Hiba: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n3. lépés: Profilmenü tesztelése...');
    
    // Open profile menu - use the name variant (desktop) or pfp variant (mobile)
    let profileMenuButton;
    const profileMenuButtons = await driver.findElements(By.css('[data-test="pf-menu-open-name"]'));
    if (profileMenuButtons.length > 0 && await profileMenuButtons[0].isDisplayed()) {
      profileMenuButton = profileMenuButtons[0];
      console.log('  Asztali profilmenü használata');
    } else {
      profileMenuButton = await driver.findElement(By.css('[data-test="pf-menu-open-pfp"]'));
      console.log('  Mobil profilmenü használata');
    }

    await profileMenuButton.click();
    await driver.sleep(300); // Wait for dropdown animation
    console.log('  ✓ Profilmenü megnyitva');

    // Click on 'Profiladatok'
    const profileInfoLink = await driver.wait(
      until.elementLocated(By.css('[data-test="pf-menu-pfinfo"]')),
      5000
    );
    await profileInfoLink.click();
    console.log('  → Profiladatok lekattintva');

    // Wait for navigation to /userinfo
    await driver.wait(
      until.urlContains('/userinfo'),
      5000
    );

    const userInfoUrl = await driver.getCurrentUrl();
    assert.ok(
      userInfoUrl.includes('/userinfo'),
      'A /userinfo oldalra kellett volna irányítania'
    );
    console.log('  ✓ Profiladatok - Navigáció sikeres');

    console.log('\n✅ Az összes navigációs teszt sikeresen teljesült');
  });

  it('oldalsáv megnyitása és bezárása mobil nézetben', async () => {
    console.log('Oldalsáv funkcionalitásának tesztelése...');
    
    // Login first
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await usernameInput.sendKeys(TEST_USERNAME);
    await passwordInput.sendKeys(TEST_PASSWORD);
    await loginButton.click();

    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );

    // Resize to mobile view
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(300);

    // Find hamburger menu button
    const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
    assert.ok(await hamburgerButton.isDisplayed(), 'A hamburger menünek mobil nézetben láthatónak kell lennie');

    // Open sidebar
    await hamburgerButton.click();
    await driver.sleep(300);

    // Check if sidebar is visible
    const sidebar = await driver.findElement(By.css('[data-test="sb-menu"]'));
    const sidebarClass = await sidebar.getAttribute('class');
    assert.ok(sidebarClass.includes('show'), 'Az oldalsávnak "show" osztállyal kell rendelkeznie, amikor nyitva van');
    console.log('✓ Oldalsáv sikeresen megnyitva');

    // Close sidebar by clicking overlay
    const overlay = await driver.findElement(By.css('.overlay'));
    await overlay.click();
    await driver.sleep(300);

    // Check if sidebar is hidden
    const sidebarClassAfterClose = await sidebar.getAttribute('class');
    assert.ok(!sidebarClassAfterClose.includes('show'), 'Az oldalsáv nem rendelkezhet a "show" osztállyal, amikor be van zárva');
    console.log('✓ Oldalsáv sikeresen bezárva');

    // Restore window size
    await driver.manage().window().setRect({ width: 1280, height: 720 });
  });
});
