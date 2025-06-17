# Content Sensitivity Testing Suite

## Overview
Comprehensive testing framework for validating the three-tier content sensitivity system and trauma-informed content presentation in the Animal Protection Foundation blog.

## Content Classification Tests

### 1. Level Classification Validation

#### Test: Content Level Detection
```javascript
// test/content-sensitivity/classification.test.js
import { classifyContent } from '@/lib/content-sensitivity';
import { ContentLevel } from '@/types/content';

describe('Content Classification', () => {
  describe('Level 1 - Hope & Progress', () => {
    const level1Examples = [
      {
        title: 'Luna Finds Her Forever Home',
        content: 'After months of rehabilitation, Luna the rescue dog...',
        images: ['luna-happy.jpg', 'luna-playing.jpg']
      },
      {
        title: 'Volunteer Spotlight: Making a Difference',
        content: 'Meet Sarah, who has dedicated her weekends to...',
        images: ['volunteer-sarah.jpg']
      }
    ];

    level1Examples.forEach((example, index) => {
      test(`correctly classifies hope story ${index + 1}`, () => {
        const result = classifyContent(example);
        
        expect(result.level).toBe(ContentLevel.HOPE_PROGRESS);
        expect(result.requiresWarning).toBe(false);
        expect(result.ageRestriction).toBeUndefined();
      });
    });
  });

  describe('Level 2 - Medical & Rescue', () => {
    const level2Examples = [
      {
        title: 'Emergency Surgery Saves Injured Cat',
        content: 'WARNING: Medical procedures. Whiskers required emergency...',
        images: ['whiskers-surgery.jpg', 'whiskers-recovery.jpg'],
        tags: ['medical', 'surgery', 'recovery']
      },
      {
        title: 'Rescue Operation in Factory Farm',
        content: 'Our team conducted a rescue operation...',
        images: ['rescue-operation.jpg'],
        tags: ['rescue', 'distress']
      }
    ];

    level2Examples.forEach((example, index) => {
      test(`correctly classifies medical/rescue content ${index + 1}`, () => {
        const result = classifyContent(example);
        
        expect(result.level).toBe(ContentLevel.MEDICAL_RESCUE);
        expect(result.requiresWarning).toBe(true);
        expect(result.ageRestriction).toBe(13);
        expect(result.warnings).toEqual(
          expect.arrayContaining(['medical procedures', 'animal distress'])
        );
      });
    });
  });

  describe('Level 3 - Crisis & Emergency', () => {
    const level3Examples = [
      {
        title: 'URGENT: Mass Rescue Needed',
        content: 'SEVERE WARNING: Graphic content. Investigation reveals...',
        images: ['investigation-evidence.jpg'],
        tags: ['crisis', 'abuse', 'emergency']
      }
    ];

    level3Examples.forEach((example, index) => {
      test(`correctly classifies crisis content ${index + 1}`, () => {
        const result = classifyContent(example);
        
        expect(result.level).toBe(ContentLevel.CRISIS_EMERGENCY);
        expect(result.requiresWarning).toBe(true);
        expect(result.ageRestriction).toBe(18);
        expect(result.allowSharing).toBe(false);
      });
    });
  });
});
```

### 2. Content Warning Display Tests

#### Test: Progressive Disclosure Implementation
```javascript
// test/content-sensitivity/progressive-disclosure.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentGate } from '@/components/ContentGate';

describe('Progressive Disclosure', () => {
  const sensitiveContent = {
    level: 2,
    warnings: ['medical procedures', 'animal distress'],
    content: 'Sensitive content here...',
    images: ['sensitive-image.jpg']
  };

  test('Level 2 content shows blurred preview', () => {
    render(<ContentGate {...sensitiveContent} />);
    
    const preview = screen.getByTestId('content-preview');
    expect(preview).toHaveClass('blur-md');
    expect(screen.getByText('Content Warning')).toBeVisible();
  });

  test('Level 3 content shows no preview', () => {
    const level3Content = { ...sensitiveContent, level: 3 };
    render(<ContentGate {...level3Content} />);
    
    expect(screen.queryByTestId('content-preview')).not.toBeInTheDocument();
    expect(screen.getByText('Severe Content Warning')).toBeVisible();
  });

  test('requires multiple clicks to reveal content', async () => {
    const user = userEvent.setup();
    render(<ContentGate {...sensitiveContent} />);
    
    // First click - show detailed warning
    await user.click(screen.getByText('View Content Warning'));
    expect(screen.getByText('This content contains:')).toBeVisible();
    expect(screen.getByText('medical procedures')).toBeVisible();
    
    // Second click - reveal content
    await user.click(screen.getByText('I understand, show content'));
    await waitFor(() => {
      expect(screen.getByText('Sensitive content here...')).toBeVisible();
    });
  });

  test('escape key returns to warning state', async () => {
    const user = userEvent.setup();
    render(<ContentGate {...sensitiveContent} />);
    
    // Reveal content
    await user.click(screen.getByText('View Content Warning'));
    await user.click(screen.getByText('I understand, show content'));
    
    // Press escape
    await user.keyboard('{Escape}');
    
    expect(screen.queryByText('Sensitive content here...')).not.toBeVisible();
    expect(screen.getByText('Content Warning')).toBeVisible();
  });
});
```

### 3. Age Verification Tests

#### Test: Age Restriction Enforcement
```javascript
// test/content-sensitivity/age-verification.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgeGate } from '@/components/AgeGate';

describe('Age Verification', () => {
  beforeEach(() => {
    // Clear any stored age verification
    localStorage.clear();
    sessionStorage.clear();
  });

  test('Level 2 content requires 13+ verification', async () => {
    const user = userEvent.setup();
    render(<AgeGate requiredAge={13} />);
    
    expect(screen.getByText('Age Verification Required')).toBeVisible();
    expect(screen.getByText('You must be 13 or older')).toBeVisible();
    
    // Test underage rejection
    await user.type(screen.getByLabelText('Birth Year'), '2015');
    await user.click(screen.getByText('Verify Age'));
    
    expect(screen.getByText('Sorry, you must be 13 or older')).toBeVisible();
  });

  test('Level 3 content requires 18+ verification', async () => {
    const user = userEvent.setup();
    render(<AgeGate requiredAge={18} />);
    
    expect(screen.getByText('You must be 18 or older')).toBeVisible();
    
    // Test successful verification
    await user.type(screen.getByLabelText('Birth Year'), '2000');
    await user.click(screen.getByText('Verify Age'));
    
    expect(screen.queryByText('Age Verification Required')).not.toBeInTheDocument();
  });

  test('remembers age verification for session', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AgeGate requiredAge={13} />);
    
    // Verify age
    await user.type(screen.getByLabelText('Birth Year'), '2000');
    await user.click(screen.getByText('Verify Age'));
    
    // Remount component
    rerender(<AgeGate requiredAge={13} />);
    
    // Should not show age gate again
    expect(screen.queryByText('Age Verification Required')).not.toBeInTheDocument();
  });
});
```

### 4. User Preference Tests

#### Test: Content Preference Management
```javascript
// test/content-sensitivity/user-preferences.test.js
import { renderHook, act } from '@testing-library/react';
import { useContentPreferences } from '@/hooks/useContentPreferences';

describe('User Content Preferences', () => {
  test('default preferences are restrictive', () => {
    const { result } = renderHook(() => useContentPreferences());
    
    expect(result.current.preferences).toEqual({
      showLevel2Content: false,
      showLevel3Content: false,
      autoBlurImages: true,
      rememberChoices: false
    });
  });

  test('can update individual preferences', () => {
    const { result } = renderHook(() => useContentPreferences());
    
    act(() => {
      result.current.updatePreference('showLevel2Content', true);
    });
    
    expect(result.current.preferences.showLevel2Content).toBe(true);
    expect(result.current.preferences.showLevel3Content).toBe(false);
  });

  test('preferences persist across sessions when enabled', () => {
    const { result, rerender } = renderHook(() => useContentPreferences());
    
    act(() => {
      result.current.updatePreference('rememberChoices', true);
      result.current.updatePreference('showLevel2Content', true);
    });
    
    // Simulate new session
    rerender();
    
    expect(result.current.preferences.showLevel2Content).toBe(true);
    expect(result.current.preferences.rememberChoices).toBe(true);
  });

  test('respects system preferences for motion', () => {
    // Mock reduced motion preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
    
    const { result } = renderHook(() => useContentPreferences());
    
    expect(result.current.preferences.reduceMotion).toBe(true);
  });
});
```

### 5. Content Sharing Restrictions

#### Test: Share Control Implementation
```javascript
// test/content-sensitivity/share-controls.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareControls } from '@/components/ShareControls';

describe('Content Sharing Restrictions', () => {
  test('Level 1 content allows all sharing options', () => {
    render(<ShareControls contentLevel={1} />);
    
    expect(screen.getByLabelText('Share on Facebook')).toBeEnabled();
    expect(screen.getByLabelText('Share on Twitter')).toBeEnabled();
    expect(screen.getByLabelText('Copy link')).toBeEnabled();
    expect(screen.getByLabelText('Email')).toBeEnabled();
  });

  test('Level 2 content shows sharing warning', async () => {
    const user = userEvent.setup();
    render(<ShareControls contentLevel={2} />);
    
    await user.click(screen.getByLabelText('Share on Facebook'));
    
    expect(screen.getByText('Content Warning')).toBeVisible();
    expect(screen.getByText('This content contains sensitive material')).toBeVisible();
  });

  test('Level 3 content restricts public sharing', () => {
    render(<ShareControls contentLevel={3} />);
    
    expect(screen.queryByLabelText('Share on Facebook')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Share on Twitter')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copy link')).toBeEnabled();
    expect(screen.getByLabelText('Email')).toBeEnabled();
    expect(screen.getByText('Public sharing disabled for sensitive content')).toBeVisible();
  });

  test('tracks sharing attempts for analytics', async () => {
    const trackShare = jest.fn();
    const user = userEvent.setup();
    
    render(<ShareControls contentLevel={2} onShare={trackShare} />);
    
    await user.click(screen.getByLabelText('Copy link'));
    
    expect(trackShare).toHaveBeenCalledWith({
      method: 'copy-link',
      contentLevel: 2,
      timestamp: expect.any(Date)
    });
  });
});
```

### 6. Emergency Response Testing

#### Test: Crisis Content Handling
```javascript
// test/content-sensitivity/emergency-response.test.js
import { render, screen } from '@testing-library/react';
import { EmergencyContent } from '@/components/EmergencyContent';

describe('Emergency Response Protocol', () => {
  const emergencyPost = {
    title: 'URGENT: Animals Need Immediate Help',
    content: 'Crisis situation requiring immediate action...',
    helplineNumbers: [
      { region: 'US', number: '1-800-ANIMALS' },
      { region: 'UK', number: '0800-HELP-NOW' }
    ],
    actionItems: [
      'Donate to emergency fund',
      'Share with local authorities',
      'Volunteer for rescue operations'
    ]
  };

  test('displays crisis helpline prominently', () => {
    render(<EmergencyContent {...emergencyPost} />);
    
    const helplineSection = screen.getByRole('region', { name: 'Crisis Support' });
    expect(helplineSection).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('24/7 Crisis Helpline')).toBeVisible();
  });

  test('provides clear action items', () => {
    render(<EmergencyContent {...emergencyPost} />);
    
    const actionList = screen.getByRole('list', { name: 'How You Can Help' });
    const items = within(actionList).getAllByRole('listitem');
    
    expect(items).toHaveLength(3);
    items.forEach(item => {
      expect(item.querySelector('a, button')).toBeInTheDocument();
    });
  });

  test('includes follow-up hope message', () => {
    render(<EmergencyContent {...emergencyPost} />);
    
    expect(screen.getByText(/Together, we can make a difference/i)).toBeVisible();
  });

  test('emergency exit button is always visible', () => {
    render(<EmergencyContent {...emergencyPost} />);
    
    const exitButton = screen.getByRole('button', { name: 'Leave this page' });
    expect(exitButton).toBeVisible();
    expect(exitButton).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
  });
});
```

## Integration Tests

### Content Flow Integration
```javascript
// test/content-sensitivity/integration.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogPost } from '@/pages/blog/[slug]';

describe('Content Sensitivity Integration', () => {
  test('full content flow for Level 2 post', async () => {
    const user = userEvent.setup();
    const level2Post = {
      slug: 'rescue-operation',
      title: 'Recent Rescue Operation',
      classification: 2,
      warnings: ['medical procedures'],
      ageRestriction: 13,
      content: 'Details of the rescue...',
      sensitiveImages: ['rescue-1.jpg', 'rescue-2.jpg']
    };

    render(<BlogPost post={level2Post} />);
    
    // 1. Age verification
    await user.type(screen.getByLabelText('Birth Year'), '2000');
    await user.click(screen.getByText('Verify Age'));
    
    // 2. Content warning
    expect(screen.getByText('Content Warning')).toBeVisible();
    await user.click(screen.getByText('View Content Warning'));
    
    // 3. Detailed warning
    expect(screen.getByText('medical procedures')).toBeVisible();
    await user.click(screen.getByText('I understand, show content'));
    
    // 4. Content revealed
    await waitFor(() => {
      expect(screen.getByText('Details of the rescue...')).toBeVisible();
    });
    
    // 5. Share restrictions
    await user.click(screen.getByText('Share'));
    expect(screen.getByText('This content contains sensitive material')).toBeVisible();
  });
});
```

## Performance Impact Tests

### Content Loading Performance
```javascript
// test/content-sensitivity/performance.test.js
import { measureRenderTime } from '@/test-utils/performance';

describe('Content Sensitivity Performance', () => {
  test('blurred images load faster than full resolution', async () => {
    const blurredTime = await measureRenderTime(
      <ContentGate level={2} showBlurred={true} />
    );
    
    const fullTime = await measureRenderTime(
      <ContentGate level={2} showBlurred={false} />
    );
    
    expect(blurredTime).toBeLessThan(fullTime * 0.5);
  });

  test('progressive disclosure does not block main thread', async () => {
    const { mainThreadBlocking } = await measurePerformance(() => {
      render(<ContentGate level={3} />);
    });
    
    expect(mainThreadBlocking).toBeLessThan(50); // 50ms max blocking
  });
});
```

## Accessibility Integration

### Content Warning Accessibility
```javascript
// test/content-sensitivity/warning-accessibility.test.js
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('Content Warning Accessibility', () => {
  test('warnings meet WCAG standards', async () => {
    const { container } = render(
      <ContentGate level={2} warnings={['medical procedures']} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('warnings are announced to screen readers', () => {
    render(<ContentGate level={2} warnings={['medical procedures']} />);
    
    const warning = screen.getByRole('alert');
    expect(warning).toHaveAttribute('aria-live', 'assertive');
    expect(warning).toHaveTextContent('Content Warning');
  });
});
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/test/setupContentSensitivity.js'],
  testMatch: ['**/test/content-sensitivity/**/*.test.js'],
  collectCoverageFrom: [
    'lib/content-sensitivity/**/*.{js,jsx,ts,tsx}',
    'components/content/**/*.{js,jsx,ts,tsx}'
  ]
};
```

### Test Setup
```javascript
// test/setupContentSensitivity.js
import '@testing-library/jest-dom';

// Mock IntersectionObserver for blur effects
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock content classification API
jest.mock('@/lib/content-classification', () => ({
  classifyContent: jest.fn((content) => {
    if (content.tags?.includes('crisis')) return { level: 3 };
    if (content.tags?.includes('medical')) return { level: 2 };
    return { level: 1 };
  })
}));
```

## Next Steps
1. Implement automated content classification
2. Add ML-based sensitivity detection
3. Create content moderation dashboard
4. Set up A/B testing for warning effectiveness
5. Establish content review workflow