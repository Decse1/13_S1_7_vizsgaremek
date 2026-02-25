import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Sidebar and Navigation Menu E2E Tests', function () {
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
    await driver.get('http://localhost:5173/bejelentkezes');
    await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
    
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/bejelentkezes')) {
      await driver.get('http://localhost:5173/bejelentkezes');
    }
    
    await driver.sleep(300);
  });

  it('navigates through all available sidebar menu items, profile menu, and logo', async () => {
    console.log('Step 1: Logging in...');
    
    // Login first
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
      until.urlIs('http://localhost:5173/kezdolap'),
      10000
    );
    console.log('✓ Login successful');

    // Wait a bit for the page to fully load
    await driver.sleep(500);

    // Define all possible sidebar menu items with their data-test attributes and expected routes
    const sidebarMenuItems = [
      { name: 'Kezdőlap', dataTest: 'sb-menu-home', route: '/kezdolap' },
      { name: 'Áruház', dataTest: 'sb-menu-store', route: '/store', optional: true },
      { name: 'Raktárkezelés', dataTest: 'sb-menu-warehouse', route: '/raktar', optional: true },
      { name: 'Partnerségek', dataTest: 'sb-menu-partnerships', route: '/partnersegek' },
      { name: 'Beérkezett rendelések', dataTest: 'sb-menu-receivedorders', route: '/rendelesek/beerkezett', optional: true },
      { name: 'Leadott rendelések', dataTest: 'sb-menu-sentorders', route: '/rendelesek/leadott', optional: true },
      { name: 'Cégem', dataTest: 'sb-menu-companyinfo', route: '/ceginfo' },
      { name: 'Kosár', dataTest: 'sb-menu-cart', route: '/kosar', optional: true },
    ];

    console.log('Step 2: Testing sidebar menu items...');
    
    // Get current window size to determine if we're in mobile view
    const windowSize = await driver.manage().window().getSize();
    const isMobileView = windowSize.width < 992; // Bootstrap's lg breakpoint

    for (const menuItem of sidebarMenuItems) {
      try {
        console.log(`\nTesting menu item: ${menuItem.name}`);
        
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
            console.log(`  ⊘ ${menuItem.name} - Not available (permission required)`);
            
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
        console.log(`  → Clicked ${menuItem.name}`);

        // Wait for navigation
        await driver.wait(
          until.urlContains(menuItem.route),
          5000
        );

        // Verify we're on the correct page
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(
          currentUrl.includes(menuItem.route),
          `Should navigate to ${menuItem.route}, but got ${currentUrl}`
        );
        console.log(`  ✓ ${menuItem.name} - Navigation successful (${currentUrl})`);

        // Wait a bit for the page to load
        await driver.sleep(500);

      } catch (error) {
        if (menuItem.optional) {
          console.log(`  ⊘ ${menuItem.name} - Not available or error: ${error.message}`);
        } else {
          console.error(`  ✗ ${menuItem.name} - Failed: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\nStep 3: Testing profile menu...');
    
    // Open profile menu - use the name variant (desktop) or pfp variant (mobile)
    let profileMenuButton;
    const profileMenuButtons = await driver.findElements(By.css('[data-test="pf-menu-open-name"]'));
    if (profileMenuButtons.length > 0 && await profileMenuButtons[0].isDisplayed()) {
      profileMenuButton = profileMenuButtons[0];
      console.log('  Using desktop profile menu');
    } else {
      profileMenuButton = await driver.findElement(By.css('[data-test="pf-menu-open-pfp"]'));
      console.log('  Using mobile profile menu');
    }

    await profileMenuButton.click();
    await driver.sleep(300); // Wait for dropdown animation
    console.log('  ✓ Profile menu opened');

    // Click on 'Profiladatok'
    const profileInfoLink = await driver.wait(
      until.elementLocated(By.css('[data-test="pf-menu-pfinfo"]')),
      5000
    );
    await profileInfoLink.click();
    console.log('  → Clicked Profiladatok');

    // Wait for navigation to /userinfo
    await driver.wait(
      until.urlContains('/userinfo'),
      5000
    );

    const userInfoUrl = await driver.getCurrentUrl();
    assert.ok(
      userInfoUrl.includes('/userinfo'),
      'Should navigate to /userinfo'
    );
    console.log('  ✓ Profiladatok - Navigation successful');

    // Wait a bit for the page to load
    await driver.sleep(500);

    console.log('\nStep 4: Testing logo navigation...');
    
    // Click on the RÉKA logo
    const logoLink = await driver.findElement(By.css('[data-test="logo-home"]'));
    await logoLink.click();
    console.log('  → Clicked RÉKA logo');

    // Wait for navigation - should go to / which redirects to /kezdolap when logged in
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/kezdolap') || url === 'http://localhost:5173/';
    }, 5000);

    const finalUrl = await driver.getCurrentUrl();
    assert.ok(
      finalUrl.includes('/kezdolap') || finalUrl === 'http://localhost:5173/',
      `Logo should navigate to home, but got ${finalUrl}`
    );
    console.log('  ✓ Logo navigation successful - Redirected to home page');

    console.log('\n✅ All navigation tests completed successfully!');
  });

  it('verifies sidebar opens and closes on mobile view', async () => {
    console.log('Testing sidebar toggle functionality...');
    
    // Login first
    const usernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await usernameInput.sendKeys('Kovács Péter');
    await passwordInput.sendKeys('pwd123');
    await loginButton.click();

    await driver.wait(
      until.urlIs('http://localhost:5173/kezdolap'),
      10000
    );

    // Resize to mobile view
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(300);

    // Find hamburger menu button
    const hamburgerButton = await driver.findElement(By.css('[data-test="sb-menu-open"]'));
    assert.ok(await hamburgerButton.isDisplayed(), 'Hamburger menu should be visible on mobile');

    // Open sidebar
    await hamburgerButton.click();
    await driver.sleep(300);

    // Check if sidebar is visible
    const sidebar = await driver.findElement(By.css('[data-test="sb-menu"]'));
    const sidebarClass = await sidebar.getAttribute('class');
    assert.ok(sidebarClass.includes('show'), 'Sidebar should have "show" class when open');
    console.log('✓ Sidebar opened successfully');

    // Close sidebar by clicking overlay
    const overlay = await driver.findElement(By.css('.overlay'));
    await overlay.click();
    await driver.sleep(300);

    // Check if sidebar is hidden
    const sidebarClassAfterClose = await sidebar.getAttribute('class');
    assert.ok(!sidebarClassAfterClose.includes('show'), 'Sidebar should not have "show" class when closed');
    console.log('✓ Sidebar closed successfully');

    // Restore window size
    await driver.manage().window().setRect({ width: 1280, height: 720 });
  });
});
