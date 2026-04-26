import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import { join } from 'path';
import { BASE_URL, buildUrl } from './config.js';

describe('Regisztráció E2E-tesztek', function () {
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
        try {
          const fs = await import('fs');
          if (fs.existsSync(firefoxPath)) {
            options.setBinary(firefoxPath);
            console.log('Firefox megtalálva itt:', firefoxPath);
            break;
          }
        } catch (error) {
          // Continue to next path
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
    
    // Wait a bit for the page to stabilize
    await driver.sleep(500);
    
    // If we got redirected to /kezdolap, go back to /bejelentkezes
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/kezdolap')) {
      await driver.get(buildUrl('/bejelentkezes'));
      await driver.sleep(300);
    }
  });

  it('új cég és felhasználó sikeres regisztrálása', async () => {
    // Wait for the login page to load
    await driver.wait(
      until.elementLocated(By.css('[data-test="login-form"]')),
      10000
    );

    // Click "Hozzáférés kérése a RÉKA-rendszerhez" link
    const registrationLink = await driver.findElement(By.css('a[href="/regisztracio"]'));
    await registrationLink.click();

    // Wait for redirect to registration page
    await driver.wait(
      until.urlContains('/regisztracio'),
      10000
    );

    // Wait for registration form to be visible
    const registrationForm = await driver.wait(
      until.elementLocated(By.css('[data-test="registration-form"]')),
      10000
    );

    assert.ok(registrationForm, 'A regisztrációs űrlapnak meg kell jelennie');

    // Fill in company information
    const companyNameInput = await driver.findElement(By.css('[data-test="company-name-input"]'));
    await companyNameInput.sendKeys('Teszt Kft.');

    const companyAddressInput = await driver.findElement(By.css('[data-test="company-address-input"]'));
    await companyAddressInput.sendKeys('1095 Budapest, Soroksári út 2.');

    const taxNumberHuInput = await driver.findElement(By.css('[data-test="tax-number-hu-input"]'));
    await taxNumberHuInput.sendKeys('55667788999');

    const taxNumberEuInput = await driver.findElement(By.css('[data-test="tax-number-eu-input"]'));
    await taxNumberEuInput.sendKeys('HU55667788999');

    const companyPhoneInput = await driver.findElement(By.css('[data-test="company-phone-input"]'));
    await companyPhoneInput.sendKeys('+361474279');

    const companyEmailInput = await driver.findElement(By.css('[data-test="company-email-input"]'));
    await companyEmailInput.sendKeys('teszt@teszt.hu');

    const bankAccountInput = await driver.findElement(By.css('[data-test="bank-account-input"]'));
    await bankAccountInput.sendKeys('11700002-76327127-14236732');

    const rendelesMintaInput = await driver.findElement(By.css('[data-test="rendeles-minta-input"]'));
    await rendelesMintaInput.sendKeys('TSZT-0000');

    // Fill in user information
    const usernameInput = await driver.findElement(By.css('[data-test="username-input"]'));
    await usernameInput.sendKeys('Teszt János');

    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    await passwordInput.sendKeys('pwd123');

    const siteAddressInput = await driver.findElement(By.css('[data-test="site-address-input"]'));
    await siteAddressInput.sendKeys('1095 Budapest, Soroksári út 21.');

    const userPhoneInput = await driver.findElement(By.css('[data-test="user-phone-input"]'));
    await userPhoneInput.sendKeys('+36308372698');

    // Accept terms and conditions
    const termsCheckbox = await driver.findElement(By.css('[data-test="terms-checkbox"]'));
    await termsCheckbox.click();

    // Submit the registration form
    const submitButton = await driver.findElement(By.css('[data-test="submit-button"]'));
    
    // Scroll the button into view to avoid being obscured by Vue DevTools
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', submitButton);
    await driver.sleep(300); // Wait for scroll to complete
    
    await submitButton.click();

    // Wait for success message
    const successAlert = await driver.wait(
      until.elementLocated(By.css('[data-test="success-alert"]')),
      15000
    );

    assert.ok(successAlert, 'A sikeres regisztrációs üzenetnek meg kell jelennie');

    const successMessage = await driver.findElement(By.css('[data-test="success-message"]'));
    const successText = await successMessage.getText();

    assert.ok(successText.includes('Sikeres regisztráció'), 'A sikeres regisztrációs üzenetnek kell megerősítenie a regisztrációt');

    // Wait for redirect to login page (with 3 second delay as per code)
    await driver.wait(
      until.urlContains('/bejelentkezes'),
      5000
    );

    // Verify we're on the login page
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/bejelentkezes'), 'Bejelentkezési oldalra kell irányítania a regisztráció után');

    // Now log in with the newly created account
    const loginUsernameInput = await driver.wait(
      until.elementLocated(By.css('[data-test="username-input"]')),
      10000
    );
    const loginPasswordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    const loginButton = await driver.findElement(By.css('[data-test="login-button"]'));

    await loginUsernameInput.sendKeys('Teszt János');
    await loginPasswordInput.sendKeys('pwd123');
    await loginButton.click();

    // Wait for redirect to home page
    await driver.wait(
      until.urlIs(buildUrl('/kezdolap')),
      10000
    );

    // Verify we're on the home page
    const homeUrl = await driver.getCurrentUrl();
    assert.strictEqual(homeUrl, buildUrl('/kezdolap'), 'Kezdőlapra kell irányítania a bejelentkezés után');

    // Navigate to company info page
    // Try to find the sidebar menu item directly (visible on desktop)
    // If not visible, click hamburger menu first (mobile view)
    try {
      const cegInfoLink = await driver.findElement(By.css('[data-test="sb-menu-companyinfo"]'));
      
      // Check if element is displayed (desktop view)
      const isDisplayed = await cegInfoLink.isDisplayed();
      if (!isDisplayed) {
        // Mobile view - click hamburger to open sidebar
        const hamburgerButton = await driver.findElement(By.css('.btn.d-lg-none'));
        await hamburgerButton.click();
        await driver.sleep(500); // Wait for sidebar animation
      }
      
      await cegInfoLink.click();
    } catch (error) {
      console.error('Hiba a céginformáció linkre kattintás során:', error);
      throw error;
    }

    // Wait for redirect to company info page
    await driver.wait(
      until.urlContains('/ceginfo'),
      10000
    );

    // Verify we're on the company info page
    const companyInfoUrl = await driver.getCurrentUrl();
    assert.ok(companyInfoUrl.includes('/ceginfo'), 'A céginformációs oldalra kell irányítania');

    // Verify company information is displayed
    const pageContent = await driver.findElement(By.css('.content')).getText();
    assert.ok(pageContent.includes('Teszt Kft.'), 'A cég nevének meg kell jelennie');
    assert.ok(pageContent.includes('55667788999'), 'Az adószámnak meg kell jelennie');
  });

  it('sikertelen regisztráció egy már létező adószámmal', async () => {
    // Wait for the login page to load
    await driver.wait(
      until.elementLocated(By.css('[data-test="login-form"]')),
      10000
    );

    // Click "Hozzáférés kérése a RÉKA-rendszerhez" link
    const registrationLink = await driver.findElement(By.css('a[href="/regisztracio"]'));
    await registrationLink.click();

    // Wait for redirect to registration page
    await driver.wait(
      until.urlContains('/regisztracio'),
      10000
    );

    // Wait for registration form to be visible
    const registrationForm = await driver.wait(
      until.elementLocated(By.css('[data-test="registration-form"]')),
      10000
    );

    assert.ok(registrationForm, 'A regisztrációs űrlapnak meg kell jelennie');

    // Fill in company information with existing tax number
    const companyNameInput = await driver.findElement(By.css('[data-test="company-name-input"]'));
    await companyNameInput.sendKeys('Teszt Kft.');

    const companyAddressInput = await driver.findElement(By.css('[data-test="company-address-input"]'));
    await companyAddressInput.sendKeys('1095 Budapest, Soroksári út 2.');

    const taxNumberHuInput = await driver.findElement(By.css('[data-test="tax-number-hu-input"]'));
    await taxNumberHuInput.sendKeys('12121212-12');

    const taxNumberEuInput = await driver.findElement(By.css('[data-test="tax-number-eu-input"]'));
    await taxNumberEuInput.sendKeys('HU12121212-12');

    const companyPhoneInput = await driver.findElement(By.css('[data-test="company-phone-input"]'));
    await companyPhoneInput.sendKeys('+361474279');

    const companyEmailInput = await driver.findElement(By.css('[data-test="company-email-input"]'));
    await companyEmailInput.sendKeys('teszt@teszt.hu');

    const bankAccountInput = await driver.findElement(By.css('[data-test="bank-account-input"]'));
    await bankAccountInput.sendKeys('11700002-76327127-14236732');

    const rendelesMintaInput = await driver.findElement(By.css('[data-test="rendeles-minta-input"]'));
    await rendelesMintaInput.sendKeys('TSZT-0000');

    // Fill in user information
    const usernameInput = await driver.findElement(By.css('[data-test="username-input"]'));
    await usernameInput.sendKeys('Teszt János');

    const passwordInput = await driver.findElement(By.css('[data-test="password-input"]'));
    await passwordInput.sendKeys('pwd123');

    const siteAddressInput = await driver.findElement(By.css('[data-test="site-address-input"]'));
    await siteAddressInput.sendKeys('1095 Budapest, Soroksári út 21.');

    const userPhoneInput = await driver.findElement(By.css('[data-test="user-phone-input"]'));
    await userPhoneInput.sendKeys('+36308372698');

    // Accept terms and conditions
    const termsCheckbox = await driver.findElement(By.css('[data-test="terms-checkbox"]'));
    await termsCheckbox.click();

    // Submit the registration form
    const submitButton = await driver.findElement(By.css('[data-test="submit-button"]'));
    
    // Scroll the button into view to avoid being obscured by Vue DevTools
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', submitButton);
    await driver.sleep(300); // Wait for scroll to complete
    
    await submitButton.click();

    // Wait for error message
    const errorAlert = await driver.wait(
      until.elementLocated(By.css('[data-test="error-alert"]')),
      15000
    );

    assert.ok(errorAlert, 'A hibaüzenetnek meg kell jelennie');

    const errorMessage = await driver.findElement(By.css('[data-test="error-message"]'));
    const errorText = await errorMessage.getText();

    assert.ok(errorText.length > 0, 'A hibaüzenet nem lehet üres');
    
    // Verify we're still on the registration page
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/regisztracio'), 'A regisztrációs oldalon kell maradnia hiba esetén');
  });
});
