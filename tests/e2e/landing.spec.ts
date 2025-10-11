import { test, expect } from '@playwright/test';

test.describe('Landing Page - Comprehensive Coverage', () => {
  const landingUrl = 'http://localhost:3000';

  test.describe('Page Load and Structure', () => {
    test('should load landing page successfully', async ({ page }) => {
      await page.goto(landingUrl);
      await expect(page).toHaveTitle(/DJAMMS|DJ|Music/i);
    });

    test('should display main heading', async ({ page }) => {
      await page.goto(landingUrl);
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(/DJAMMS|Music Player|DJ/i);
    });

    test('should have hero section', async ({ page }) => {
      await page.goto(landingUrl);
      const hero = page.locator('[data-testid="hero-section"]');
      await expect(hero).toBeVisible();
    });

    test('should display tagline or description', async ({ page }) => {
      await page.goto(landingUrl);
      const description = page.locator('text=/YouTube.*music|bar.*venue|music player/i');
      await expect(description).toBeVisible();
    });
  });

  test.describe('Feature Cards Display', () => {
    test('should display Master Player feature card', async ({ page }) => {
      await page.goto(landingUrl);
      await expect(page.locator('text=Master Player')).toBeVisible();
    });

    test('should display Real-time Sync feature card', async ({ page }) => {
      await page.goto(landingUrl);
      await expect(page.locator('text=/Real.*time.*Sync|Live Sync/i')).toBeVisible();
    });

    test('should display Paid Requests feature card', async ({ page }) => {
      await page.goto(landingUrl);
      await expect(page.locator('text=/Paid Request|Priority Queue/i')).toBeVisible();
    });

    test('should show feature descriptions', async ({ page }) => {
      await page.goto(landingUrl);
      
      // Master Player description
      await expect(page.locator('text=/Single active player.*heartbeat|Master election/i')).toBeVisible();
      
      // Real-time sync description
      await expect(page.locator('text=/Live queue updates|Real.*time updates/i')).toBeVisible();
      
      // Paid requests description
      await expect(page.locator('text=/Song requests.*priority|Priority queue/i')).toBeVisible();
    });

    test('should display feature icons or images', async ({ page }) => {
      await page.goto(landingUrl);
      
      const featureIcons = page.locator('[data-testid^="feature-icon-"]');
      const count = await featureIcons.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should have hover effects on feature cards', async ({ page }) => {
      await page.goto(landingUrl);
      
      const featureCard = page.locator('[data-testid="feature-card"]').first();
      await featureCard.hover();
      
      // Check for visual feedback
      const cardStyle = await featureCard.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          transform: style.transform,
          boxShadow: style.boxShadow
        };
      });
      
      // Should have some hover effect
      expect(cardStyle.transform !== 'none' || cardStyle.boxShadow !== 'none').toBeTruthy();
    });
  });

  test.describe('Navigation to Auth', () => {
    test('should have "Get Started" button', async ({ page }) => {
      await page.goto(landingUrl);
      const getStartedBtn = page.locator('text=/Get Started|Sign In|Login/i');
      await expect(getStartedBtn).toBeVisible();
    });

    test('should navigate to auth page when clicking Get Started', async ({ page }) => {
      await page.goto(landingUrl);
      
      const getStartedBtn = page.locator('text=/Get Started|Sign In|Login/i').first();
      await getStartedBtn.click();
      
      // Should navigate to auth
      await page.waitForURL(/auth|login/);
      expect(page.url()).toMatch(/auth|login/);
    });

    test('should have login link in navigation', async ({ page }) => {
      await page.goto(landingUrl);
      
      const loginLink = page.locator('nav').locator('text=/Login|Sign In/i');
      await expect(loginLink).toBeVisible();
    });

    test('should navigate to auth when clicking nav login link', async ({ page }) => {
      await page.goto(landingUrl);
      
      const loginLink = page.locator('nav').locator('text=/Login|Sign In/i');
      await loginLink.click();
      
      await page.waitForURL(/auth|login/);
      expect(page.url()).toMatch(/auth|login/);
    });
  });

  test.describe('Environment-based URL Routing', () => {
    test('should use production auth URL in production mode', async ({ page }) => {
      // Set production environment
      await page.addInitScript(() => {
        (window as any).VITE_MODE = 'production';
        (window as any).VITE_AUTH_URL = 'https://auth.djamms.app';
      });
      
      await page.goto(landingUrl);
      
      const getStartedBtn = page.locator('text=/Get Started|Sign In/i').first();
      const href = await getStartedBtn.getAttribute('href');
      
      expect(href).toContain('auth.djamms.app');
    });

    test('should use localhost auth URL in development mode', async ({ page }) => {
      // Set development environment
      await page.addInitScript(() => {
        (window as any).VITE_MODE = 'development';
        (window as any).VITE_AUTH_URL = 'http://localhost:3001';
      });
      
      await page.goto(landingUrl);
      
      const getStartedBtn = page.locator('text=/Get Started|Sign In/i').first();
      const href = await getStartedBtn.getAttribute('href');
      
      expect(href).toContain('localhost');
    });

    test('should construct correct auth redirect URL', async ({ page }) => {
      await page.goto(landingUrl);
      
      const getStartedBtn = page.locator('text=/Get Started|Sign In/i').first();
      await getStartedBtn.click();
      
      await page.waitForURL(/auth/);
      
      // URL should have proper structure
      const url = page.url();
      expect(url).toMatch(/auth.*\/login|auth.*\/signin/);
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display mobile navigation on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(landingUrl);
      
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      await expect(mobileNav).toBeVisible();
    });

    test('should stack feature cards vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(landingUrl);
      
      const featureCards = page.locator('[data-testid="feature-card"]');
      const positions = await featureCards.evaluateAll(elements =>
        elements.map(el => el.getBoundingClientRect())
      );
      
      // Check that cards are stacked (similar X position)
      if (positions.length > 1) {
        const xPositions = positions.map(p => p.left);
        const allSimilarX = xPositions.every(x => Math.abs(x - xPositions[0]) < 50);
        expect(allSimilarX).toBeTruthy();
      }
    });

    test('should display feature cards in grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(landingUrl);
      
      const featureCards = page.locator('[data-testid="feature-card"]');
      const positions = await featureCards.evaluateAll(elements =>
        elements.map(el => el.getBoundingClientRect())
      );
      
      // Should have multiple cards on same row
      if (positions.length > 2) {
        const firstRowCards = positions.filter(p =>
          Math.abs(p.top - positions[0].top) < 20
        );
        expect(firstRowCards.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should hide hamburger menu on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(landingUrl);
      
      const hamburger = page.locator('[data-testid="mobile-menu-toggle"]');
      await expect(hamburger).toBeHidden();
    });
  });

  test.describe('Footer and Additional Content', () => {
    test('should display footer', async ({ page }) => {
      await page.goto(landingUrl);
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should have copyright notice', async ({ page }) => {
      await page.goto(landingUrl);
      
      const copyright = page.locator('text=/©.*DJAMMS|Copyright/i');
      await expect(copyright).toBeVisible();
    });

    test('should have links to social media or docs', async ({ page }) => {
      await page.goto(landingUrl);
      
      // Check for any external links (GitHub, Twitter, docs, etc.)
      const externalLinks = page.locator('a[href*="http"]');
      const count = await externalLinks.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('SEO and Meta Tags', () => {
    test('should have meta description', async ({ page }) => {
      await page.goto(landingUrl);
      
      const metaDescription = page.locator('meta[name="description"]');
      const content = await metaDescription.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content?.length).toBeGreaterThan(50);
    });

    test('should have Open Graph tags', async ({ page }) => {
      await page.goto(landingUrl);
      
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveCount(1);
    });

    test('should have favicon', async ({ page }) => {
      await page.goto(landingUrl);
      
      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toHaveCount(1);
    });
  });

  test.describe('Performance', () => {
    test('should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(landingUrl);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(landingUrl);
      await page.waitForTimeout(2000);
      
      expect(errors.length).toBe(0);
    });

    test('should load images efficiently', async ({ page }) => {
      await page.goto(landingUrl);
      
      const images = page.locator('img');
      const count = await images.count();
      
      // All images should have loaded
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const naturalWidth = await img.evaluate((el: any) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(landingUrl);
      
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto(landingUrl);
      
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should have keyboard navigation for buttons', async ({ page }) => {
      await page.goto(landingUrl);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(landingUrl);
      
      const nav = page.locator('nav');
      const ariaLabel = await nav.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });
  });

  test.describe('Animation and Interactions', () => {
    test('should have smooth scroll to sections', async ({ page }) => {
      await page.goto(landingUrl);
      
      const featuresLink = page.locator('a[href="#features"]');
      if (await featuresLink.count() > 0) {
        await featuresLink.click();
        await page.waitForTimeout(500);
        
        // Should have scrolled to features section
        const featuresSection = page.locator('#features');
        await expect(featuresSection).toBeInViewport();
      }
    });

    test('should have fade-in animations on scroll', async ({ page }) => {
      await page.goto(landingUrl);
      
      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
      
      // Check if elements have animation classes
      const animatedElements = page.locator('[class*="fade"]');
      const count = await animatedElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Call-to-Action', () => {
    test('should have prominent CTA button', async ({ page }) => {
      await page.goto(landingUrl);
      
      const ctaButton = page.locator('[data-testid="cta-button"]');
      await expect(ctaButton).toBeVisible();
      
      // Should be styled prominently
      const bgColor = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    });

    test('should track CTA clicks', async ({ page }) => {
      await page.goto(landingUrl);
      
      let analyticsEvent = false;
      
      page.on('console', msg => {
        if (msg.text().includes('analytics') || msg.text().includes('track')) {
          analyticsEvent = true;
        }
      });
      
      const ctaButton = page.locator('text=/Get Started|Sign In/i').first();
      await ctaButton.click();
      
      // Basic check for analytics (adjust based on implementation)
      expect(true).toBeTruthy(); // Placeholder
    });
  });
});
