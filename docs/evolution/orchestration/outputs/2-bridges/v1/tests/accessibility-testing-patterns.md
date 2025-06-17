# Accessibility Testing Patterns

## Overview
Comprehensive testing patterns to ensure WCAG 2.1 AA compliance and trauma-informed accessibility for the Animal Protection Foundation blog.

## Testing Framework

### 1. Automated Accessibility Testing

#### Core Accessibility Audit
```javascript
// test/accessibility/wcag-compliance.test.js
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { routes } from '@/lib/routes';

expect.extend(toHaveNoViolations);

describe('WCAG 2.1 AA Compliance', () => {
  const criticalPages = [
    { Component: HomePage, name: 'Homepage' },
    { Component: BlogIndex, name: 'Blog Index' },
    { Component: BlogPost, name: 'Blog Post' },
    { Component: MockupGallery, name: 'Mockup Gallery' }
  ];

  criticalPages.forEach(({ Component, name }) => {
    test(`${name} has no accessibility violations`, async () => {
      const { container } = render(<Component />);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-unique': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});
```

#### Color Contrast Testing
```javascript
// test/accessibility/color-contrast.test.js
import { analyzeContrast } from '@/test-utils/contrast-analyzer';

describe('Color Contrast Compliance', () => {
  const themes = ['light', 'dark', 'warm', 'high-contrast'];
  
  themes.forEach(theme => {
    describe(`${theme} theme`, () => {
      test('Normal text meets 4.5:1 ratio', async () => {
        const results = await analyzeContrast(theme, 'normal');
        
        results.forEach(({ foreground, background, ratio }) => {
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
      });

      test('Large text meets 3:1 ratio', async () => {
        const results = await analyzeContrast(theme, 'large');
        
        results.forEach(({ ratio }) => {
          expect(ratio).toBeGreaterThanOrEqual(3);
        });
      });

      test('Interactive elements meet 3:1 ratio', async () => {
        const results = await analyzeContrast(theme, 'interactive');
        
        results.forEach(({ ratio }) => {
          expect(ratio).toBeGreaterThanOrEqual(3);
        });
      });
    });
  });
});
```

### 2. Keyboard Navigation Testing

#### Focus Management Tests
```javascript
// test/accessibility/keyboard-navigation.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Keyboard Navigation', () => {
  test('Tab order follows logical flow', async () => {
    const user = userEvent.setup();
    render(<AppLayout />);
    
    const expectedOrder = [
      'Skip to main content',
      'Site logo',
      'Main navigation',
      'Theme toggle',
      'Main content area',
      'Footer navigation'
    ];
    
    for (const label of expectedOrder) {
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toHaveAccessibleName(label);
    }
  });

  test('Modal traps focus correctly', async () => {
    const user = userEvent.setup();
    render(<Modal isOpen={true} />);
    
    const firstFocusable = screen.getByRole('button', { name: 'Close' });
    const lastFocusable = screen.getByRole('button', { name: 'Confirm' });
    
    // Tab from last to first
    lastFocusable.focus();
    await user.tab();
    expect(document.activeElement).toBe(firstFocusable);
    
    // Shift+Tab from first to last
    firstFocusable.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(lastFocusable);
  });

  test('Skip links work correctly', async () => {
    const user = userEvent.setup();
    render(<AppLayout />);
    
    await user.tab();
    const skipLink = screen.getByText('Skip to main content');
    await user.click(skipLink);
    
    expect(document.activeElement).toBe(
      document.getElementById('main-content')
    );
  });
});
```

#### Interactive Elements Testing
```javascript
// test/accessibility/interactive-elements.test.js
describe('Interactive Elements Accessibility', () => {
  test('Buttons have accessible names', () => {
    render(<ButtonCollection />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName();
      expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
    });
  });

  test('Form inputs have associated labels', () => {
    render(<ContactForm />);
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      const label = screen.getByLabelText(input.getAttribute('aria-label') || '');
      expect(label).toBeInTheDocument();
    });
  });

  test('Links have descriptive text', () => {
    render(<NavigationMenu />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.textContent).not.toMatch(/click here|read more/i);
      expect(link).toHaveAccessibleName();
    });
  });
});
```

### 3. Screen Reader Testing

#### ARIA Implementation Tests
```javascript
// test/accessibility/screen-reader.test.js
import { renderWithAnnouncements } from '@/test-utils/aria-live';

describe('Screen Reader Support', () => {
  test('Live regions announce updates', async () => {
    const { getAnnouncements } = renderWithAnnouncements(<NotificationSystem />);
    
    // Trigger notification
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      const announcements = getAnnouncements();
      expect(announcements).toContain('Changes saved successfully');
    });
  });

  test('Loading states are announced', async () => {
    const { getAnnouncements } = renderWithAnnouncements(<BlogPostLoader />);
    
    await waitFor(() => {
      const announcements = getAnnouncements();
      expect(announcements).toContain('Loading blog post');
      expect(announcements).toContain('Blog post loaded');
    });
  });

  test('Error messages are announced', async () => {
    const { getAnnouncements } = renderWithAnnouncements(<FormWithValidation />);
    
    // Submit invalid form
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      const announcements = getAnnouncements();
      expect(announcements).toContain('Please fix 2 errors');
    });
  });
});
```

#### Semantic Structure Tests
```javascript
// test/accessibility/semantic-structure.test.js
describe('Semantic HTML Structure', () => {
  test('Page has proper heading hierarchy', () => {
    render(<BlogPost />);
    
    const headings = screen.getAllByRole('heading');
    let lastLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      expect(level).toBeLessThanOrEqual(lastLevel + 1);
      lastLevel = level;
    });
  });

  test('Landmarks are properly labeled', () => {
    render(<AppLayout />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('Lists use semantic markup', () => {
    render(<BlogIndex />);
    
    const lists = screen.getAllByRole('list');
    lists.forEach(list => {
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
    });
  });
});
```

### 4. Trauma-Informed Accessibility Testing

#### Content Warning Tests
```javascript
// test/accessibility/content-warnings.test.js
describe('Content Warning Accessibility', () => {
  test('Warning is announced before sensitive content', async () => {
    const { getAnnouncements } = renderWithAnnouncements(
      <SensitiveContent level={2} />
    );
    
    await waitFor(() => {
      const announcements = getAnnouncements();
      expect(announcements).toContain('Content warning: This content contains images of medical procedures');
    });
  });

  test('Progressive disclosure is keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<ContentGate level={3} />);
    
    // Navigate to reveal button
    await user.tab();
    expect(screen.getByRole('button', { name: 'View content warning' })).toHaveFocus();
    
    // Activate with keyboard
    await user.keyboard('{Enter}');
    expect(screen.getByText('This content contains')).toBeVisible();
    
    // Continue to reveal content
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('sensitive-content')).toBeVisible();
  });

  test('Skip sensitive content option available', () => {
    render(<BlogPostWithSensitiveContent />);
    
    const skipButton = screen.getByRole('button', { 
      name: 'Skip to next section' 
    });
    expect(skipButton).toBeInTheDocument();
    expect(skipButton).toBeVisible();
  });
});
```

### 5. Responsive Accessibility Testing

#### Mobile Accessibility Tests
```javascript
// test/accessibility/mobile-accessibility.test.js
import { setViewport } from '@/test-utils/viewport';

describe('Mobile Accessibility', () => {
  beforeEach(() => {
    setViewport('mobile');
  });

  test('Touch targets meet minimum size', async () => {
    render(<MobileLayout />);
    
    const interactiveElements = screen.getAllByRole('button')
      .concat(screen.getAllByRole('link'));
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });

  test('Mobile menu is accessible', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);
    
    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    await user.click(menuButton);
    
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // Can close with escape
    await user.keyboard('{Escape}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('Zoom up to 200% without horizontal scroll', async () => {
    render(<AppLayout />);
    
    // Simulate 200% zoom
    document.documentElement.style.zoom = '2';
    
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
```

## Testing Utilities

### ARIA Live Region Monitor
```javascript
// test-utils/aria-live.js
export function renderWithAnnouncements(component) {
  const announcements = [];
  
  // Mock aria-live regions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const target = mutation.target;
        if (target.getAttribute('aria-live')) {
          announcements.push(target.textContent);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  const result = render(component);

  return {
    ...result,
    getAnnouncements: () => [...announcements]
  };
}
```

### Contrast Analyzer
```javascript
// test-utils/contrast-analyzer.js
import { rgb } from 'wcag-contrast';

export async function analyzeContrast(theme, textType) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:3000?theme=${theme}`);
  
  const elements = await page.evaluate((type) => {
    const selectors = {
      normal: 'p, span, div',
      large: 'h1, h2, h3',
      interactive: 'button, a, input'
    };
    
    return Array.from(document.querySelectorAll(selectors[type]))
      .map(el => {
        const styles = window.getComputedStyle(el);
        return {
          foreground: styles.color,
          background: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight
        };
      });
  }, textType);

  return elements.map(({ foreground, background }) => ({
    foreground,
    background,
    ratio: rgb(foreground, background)
  }));
}
```

## Manual Testing Checklist

### Screen Reader Testing Protocol
```markdown
## Screen Reader Testing Checklist

### NVDA (Windows)
- [ ] Navigate with arrow keys
- [ ] Use heading navigation (H key)
- [ ] Test landmark navigation
- [ ] Verify form labels are announced
- [ ] Check table navigation
- [ ] Test aria-live regions

### VoiceOver (macOS/iOS)
- [ ] Navigate with VO + arrow keys
- [ ] Use rotor for navigation
- [ ] Test gesture navigation (mobile)
- [ ] Verify image descriptions
- [ ] Check interactive element hints
- [ ] Test custom actions

### JAWS (Windows)
- [ ] Virtual cursor navigation
- [ ] Forms mode behavior
- [ ] List and table navigation
- [ ] Verify abbreviation expansion
- [ ] Test application mode regions
```

### Keyboard Navigation Protocol
```markdown
## Keyboard Navigation Checklist

### General Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab reverses direction
- [ ] No keyboard traps
- [ ] Focus indicators visible
- [ ] Skip links functional

### Component-Specific
- [ ] Modal: Focus trapped, Escape closes
- [ ] Menu: Arrow key navigation
- [ ] Tabs: Arrow keys switch tabs
- [ ] Accordion: Space/Enter toggles
- [ ] Carousel: Previous/Next keyboard controls
```

## Accessibility Testing Reports

### Report Template
```javascript
// test-reports/accessibility-report-template.js
export class AccessibilityReport {
  constructor() {
    this.results = {
      automated: {
        violations: [],
        passes: [],
        incomplete: []
      },
      manual: {
        keyboardNav: {},
        screenReader: {},
        colorContrast: {},
        responsive: {}
      },
      summary: {
        score: 0,
        criticalIssues: 0,
        recommendations: []
      }
    };
  }

  generateReport() {
    return {
      ...this.results,
      timestamp: new Date().toISOString(),
      compliance: {
        wcag21AA: this.calculateCompliance(),
        traumaInformed: this.assessTraumaInformed()
      }
    };
  }

  calculateCompliance() {
    const totalTests = this.getTotalTests();
    const passedTests = this.getPassedTests();
    return (passedTests / totalTests) * 100;
  }
}
```

## CI/CD Integration

### Accessibility Testing Pipeline
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Weekly full audit

jobs:
  a11y-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          pnpm install
          npx playwright install
          
      - name: Build application
        run: pnpm build
        
      - name: Run accessibility tests
        run: |
          pnpm test:a11y
          pnpm test:a11y:manual
          
      - name: Generate report
        run: pnpm a11y:report
        
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: test-results/accessibility/
          
      - name: Comment PR
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./test-results/accessibility/summary.json');
            const comment = `## ⚠️ Accessibility Issues Found
            
            **Critical Issues**: ${report.summary.criticalIssues}
            **Total Violations**: ${report.automated.violations.length}
            
            See the full report in the artifacts.`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Next Steps
1. Set up automated testing in CI/CD
2. Create accessibility dashboard
3. Implement monthly manual audits
4. Train team on accessibility testing
5. Establish accessibility champions program