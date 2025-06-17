# Integration Test Suite

## Overview
Comprehensive integration testing framework that validates the interaction between all standards (performance, accessibility, content sensitivity) in the Animal Protection Foundation blog platform.

## Cross-Standard Integration Tests

### 1. Performance + Accessibility Integration

#### Test: Accessible Performance Optimization
```javascript
// test/integration/performance-accessibility.test.js
import { runLighthouse } from '@/test-utils/lighthouse';
import { axe } from 'jest-axe';
import { render } from '@testing-library/react';

describe('Performance-Accessibility Integration', () => {
  test('lazy-loaded images remain accessible', async () => {
    const { container } = render(<BlogPostWithImages />);
    
    // Check initial state
    const images = container.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).not.toBe('');
    });
    
    // Trigger lazy load
    await scrollToElement(images[0]);
    
    // Verify accessibility after load
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('code splitting preserves focus management', async () => {
    const { container } = render(<App />);
    
    // Navigate to dynamically loaded route
    const link = screen.getByRole('link', { name: 'Blog' });
    const initialFocus = document.activeElement;
    
    await userEvent.click(link);
    
    // Wait for route to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument();
    });
    
    // Verify focus is managed correctly
    expect(document.activeElement).not.toBe(initialFocus);
    expect(document.activeElement).toHaveAttribute('tabindex', '-1');
  });

  test('performance optimizations maintain ARIA states', async () => {
    const results = await runLighthouse('/blog', {
      onlyCategories: ['performance', 'accessibility']
    });
    
    // Both should be high
    expect(results.categories.performance.score).toBeGreaterThanOrEqual(0.98);
    expect(results.categories.accessibility.score).toBeGreaterThanOrEqual(0.98);
    
    // Check specific audits
    expect(results.audits['aria-valid-attr'].score).toBe(1);
    expect(results.audits['uses-responsive-images'].score).toBe(1);
  });
});
```

### 2. Content Sensitivity + Performance Integration

#### Test: Sensitive Content Loading Performance
```javascript
// test/integration/content-performance.test.js
import { measureWebVitals } from '@/test-utils/web-vitals';
import { render } from '@testing-library/react';

describe('Content Sensitivity Performance Impact', () => {
  test('progressive disclosure maintains performance targets', async () => {
    const vitals = await measureWebVitals('/blog/sensitive-rescue-story');
    
    // Despite content gates, performance should meet targets
    expect(vitals.lcp).toBeLessThan(1200);
    expect(vitals.cls).toBeLessThan(0.1);
    expect(vitals.fid).toBeLessThan(100);
  });

  test('blurred images reduce initial payload', async () => {
    const response = await fetch('/blog/medical-procedure-post');
    const html = await response.text();
    
    // Parse initial payload
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const blurredImages = doc.querySelectorAll('img[data-blur="true"]');
    const totalSize = Array.from(blurredImages).reduce((sum, img) => {
      return sum + parseInt(img.dataset.size || 0);
    }, 0);
    
    expect(totalSize).toBeLessThan(50 * 1024); // 50KB for all blur placeholders
  });

  test('multi-level content gates use efficient rendering', async () => {
    const { rerender } = render(<ContentGate level={3} />);
    
    // Measure re-renders during progressive disclosure
    let renderCount = 0;
    const CounterWrapper = ({ children }) => {
      renderCount++;
      return children;
    };
    
    rerender(
      <CounterWrapper>
        <ContentGate level={3} />
      </CounterWrapper>
    );
    
    // Click through gates
    await userEvent.click(screen.getByText('View Warning'));
    await userEvent.click(screen.getByText('Continue'));
    
    // Should minimize re-renders
    expect(renderCount).toBeLessThan(5);
  });
});
```

### 3. Content Sensitivity + Accessibility Integration

#### Test: Accessible Content Warnings
```javascript
// test/integration/content-accessibility.test.js
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('Content Warning Accessibility', () => {
  test('content gates are fully keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<BlogPostWithSensitiveContent level={2} />);
    
    // Tab through the warning flow
    await user.tab(); // Focus on warning
    expect(screen.getByRole('button', { name: 'View content warning' })).toHaveFocus();
    
    await user.keyboard('{Enter}');
    await user.tab(); // Focus on "I understand" button
    expect(screen.getByRole('button', { name: 'I understand, show content' })).toHaveFocus();
    
    // Escape should work at any point
    await user.keyboard('{Escape}');
    expect(screen.getByText('Content Warning')).toBeVisible();
  });

  test('screen readers announce content warnings appropriately', async () => {
    const { container, getAnnouncements } = renderWithAnnouncements(
      <SensitiveContentPost level={2} />
    );
    
    await waitFor(() => {
      const announcements = getAnnouncements();
      expect(announcements).toContain('Warning: This content contains medical procedures');
    });
    
    // Verify ARIA markup
    const warningRegion = screen.getByRole('alert');
    expect(warningRegion).toHaveAttribute('aria-live', 'assertive');
    
    // No accessibility violations
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('age verification is accessible', async () => {
    render(<AgeGate requiredAge={13} />);
    
    // Form should be properly labeled
    expect(screen.getByLabelText('Birth Year')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-required', 'true');
    
    // Error messages are announced
    await userEvent.type(screen.getByLabelText('Birth Year'), '2015');
    await userEvent.click(screen.getByText('Verify Age'));
    
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Sorry, you must be 13 or older');
  });
});
```

### 4. Full Stack Integration Tests

#### Test: End-to-End User Journey
```javascript
// test/integration/e2e-user-journey.test.js
import { chromium } from 'playwright';

describe('Full User Journey', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  test('complete flow: landing → blog → sensitive content → share', async () => {
    // Start timing
    const startTime = Date.now();
    
    // 1. Load homepage
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/Animal Protection Foundation/);
    
    // Verify performance on landing
    const homeMetrics = await page.evaluate(() => ({
      lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.renderTime,
      cls: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
    }));
    
    expect(homeMetrics.lcp).toBeLessThan(1200);
    expect(homeMetrics.cls).toBeLessThan(0.1);
    
    // 2. Navigate to blog with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('h1:has-text("Blog")');
    
    // 3. Select sensitive content post
    await page.click('article:has-text("Emergency Rescue Operation")');
    
    // 4. Handle age verification
    await page.fill('input[name="birthYear"]', '2000');
    await page.click('button:has-text("Verify Age")');
    
    // 5. Navigate content warning
    await page.click('button:has-text("View Content Warning")');
    await expect(page.locator('text=medical procedures')).toBeVisible();
    
    await page.click('button:has-text("I understand")');
    
    // 6. Verify content loads
    await expect(page.locator('article.blog-content')).toBeVisible();
    
    // 7. Test sharing restrictions
    await page.click('button:has-text("Share")');
    await expect(page.locator('text=Public sharing disabled')).toBeVisible();
    
    // Total journey time
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(10000); // 10s for entire flow
  });

  test('mobile journey with touch navigation', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000');
    
    // Open mobile menu
    await page.tap('button[aria-label="Open menu"]');
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    
    // Navigate to blog
    await page.tap('a:has-text("Blog")');
    
    // Verify touch targets
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
```

### 5. Theme Integration Tests

#### Test: Theme Switching Across All Standards
```javascript
// test/integration/theme-integration.test.js
describe('Theme Integration', () => {
  const themes = ['light', 'dark', 'warm', 'high-contrast'];

  themes.forEach(theme => {
    describe(`${theme} theme`, () => {
      beforeEach(async () => {
        await page.goto(`http://localhost:3000?theme=${theme}`);
      });

      test('maintains performance targets', async () => {
        const metrics = await page.metrics();
        expect(metrics.TaskDuration).toBeLessThan(100);
      });

      test('maintains accessibility standards', async () => {
        const violations = await injectAxe(page);
        expect(violations).toHaveLength(0);
      });

      test('content warnings remain visible', async () => {
        await page.goto(`http://localhost:3000/blog/sensitive-post?theme=${theme}`);
        
        const warningContrast = await page.evaluate(() => {
          const warning = document.querySelector('.content-warning');
          const styles = window.getComputedStyle(warning);
          return calculateContrast(styles.color, styles.backgroundColor);
        });
        
        expect(warningContrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
```

### 6. API Integration Tests

#### Test: Content Delivery Performance
```javascript
// test/integration/api-integration.test.js
import request from 'supertest';
import app from '@/app';

describe('API Integration', () => {
  test('content API respects sensitivity levels', async () => {
    const response = await request(app)
      .get('/api/posts')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    
    // Verify sensitive content is filtered
    response.body.posts.forEach(post => {
      if (post.classification >= 2) {
        expect(post.content).toBeUndefined();
        expect(post.preview).toBeDefined();
        expect(post.warnings).toBeDefined();
      }
    });
  });

  test('image API serves appropriate formats', async () => {
    const response = await request(app)
      .get('/api/images/rescue-dog.jpg')
      .set('Accept', 'image/webp,image/avif,image/*');
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/image\/(webp|avif)/);
    expect(response.headers['cache-control']).toContain('max-age=31536000');
  });

  test('performance headers are set correctly', async () => {
    const response = await request(app).get('/');
    
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
```

## System Integration Tests

### Platform Compatibility
```javascript
// test/integration/platform-compatibility.test.js
describe('Platform Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];
  
  browsers.forEach(browserType => {
    test(`works correctly in ${browserType}`, async () => {
      const browser = await playwright[browserType].launch();
      const page = await browser.newPage();
      
      await page.goto('http://localhost:3000');
      
      // Test core functionality
      await page.click('button[aria-label="Toggle theme"]');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      
      // Test content warnings
      await page.goto('http://localhost:3000/blog/sensitive-post');
      await expect(page.locator('.content-warning')).toBeVisible();
      
      await browser.close();
    });
  });
});
```

### Error Boundary Integration
```javascript
// test/integration/error-handling.test.js
describe('Error Handling Integration', () => {
  test('performance monitoring continues after errors', async () => {
    const page = await browser.newPage();
    
    // Inject error
    await page.goto('http://localhost:3000/trigger-error');
    
    // Verify error boundary caught it
    await expect(page.locator('text=Something went wrong')).toBeVisible();
    
    // Verify performance monitoring still works
    const metrics = await page.evaluate(() => 
      window.performance.getEntriesByType('measure')
    );
    
    expect(metrics.length).toBeGreaterThan(0);
  });

  test('accessibility maintained in error states', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/404');
    
    // Run accessibility check on error page
    const violations = await injectAxe(page);
    expect(violations).toHaveLength(0);
    
    // Verify keyboard navigation still works
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => 
      document.activeElement.tagName
    );
    expect(focusedElement).not.toBe('BODY');
  });
});
```

## Test Utilities

### Integration Test Helpers
```javascript
// test-utils/integration-helpers.js
export async function measureFullPageLoad(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const metrics = await page.goto(url).then(async () => {
    return await page.evaluate(() => ({
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      largestContentfulPaint: new Promise(resolve => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1].renderTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      })
    }));
  });
  
  await browser.close();
  return metrics;
}

export async function simulateSlowNetwork(page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 40 // 40ms
  });
}
```

## CI/CD Pipeline Integration

### Complete Test Suite
```yaml
# .github/workflows/integration-tests.yml
name: Integration Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          pnpm install
          npx playwright install --with-deps ${{ matrix.browser }}
          
      - name: Build application
        run: pnpm build
        
      - name: Start services
        run: |
          pnpm start &
          pnpm api:start &
          npx wait-on http://localhost:3000 http://localhost:3001
          
      - name: Run integration tests
        run: |
          pnpm test:integration --browser=${{ matrix.browser }}
        env:
          BROWSER: ${{ matrix.browser }}
          
      - name: Run performance integration tests
        run: pnpm test:integration:performance
        
      - name: Run accessibility integration tests  
        run: pnpm test:integration:accessibility
        
      - name: Run content sensitivity integration tests
        run: pnpm test:integration:content
        
      - name: Generate integration report
        if: always()
        run: pnpm integration:report
        
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-results-${{ matrix.browser }}
          path: |
            test-results/integration/
            coverage/integration/
            
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const results = require('./test-results/integration/summary.json');
            const comment = `## Integration Test Results
            
            **Browser**: ${{ matrix.browser }}
            **Total Tests**: ${results.total}
            **Passed**: ${results.passed}
            **Failed**: ${results.failed}
            
            ### Key Metrics
            - Performance + Accessibility: ${results.perfA11y}%
            - Content + Performance: ${results.contentPerf}%
            - Full Journey Success: ${results.e2eSuccess}%
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Monitoring Dashboard

### Integration Metrics
```javascript
// monitoring/integration-dashboard.js
export const integrationMetrics = {
  performance: {
    p95ResponseTime: 0,
    errorRate: 0,
    throughput: 0
  },
  accessibility: {
    violationCount: 0,
    wcagCompliance: 0,
    keyboardSuccess: 0
  },
  contentSensitivity: {
    warningEffectiveness: 0,
    shareCompliance: 0,
    ageVerificationSuccess: 0
  },
  crossCutting: {
    themePerformance: {},
    mobileUsability: 0,
    errorRecovery: 0
  }
};
```

## Next Steps
1. Set up continuous integration monitoring
2. Create integration test dashboard
3. Implement automated regression detection
4. Establish integration test review process
5. Create integration testing playbooks