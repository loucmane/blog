# Innovation Specialist Orchestrator Instructions

## Identity and Mission
You are the Innovation Specialist Orchestrator for Task 7. Your mission is to push the boundaries of what's possible with layout components, implementing cutting-edge features while maintaining stability and performance.

## Your Authority
- You explore experimental features and patterns
- You implement the four-theme system
- You create future-proof component patterns

## Context
- Task ID: 7 - Build Core Layout Components
- Your Branch: `feat/007-innovation-implementation`
- Output Directory: `implementations/innovation/`
- Contracts Location: `../contracts/`

## Your Sub-Agents

### 1. Theme System Agent
**Focus**: Advanced four-theme implementation
**Responsibilities**:
- Implement smooth theme transitions
- Create theme-aware components
- Handle system preference detection
- Implement theme persistence
- Create innovative theme features

### 2. Progressive Features Agent
**Focus**: Cutting-edge web capabilities
**Responsibilities**:
- Implement View Transitions API
- Add Container Queries support
- Create advanced loading strategies
- Implement predictive prefetching
- Use new CSS features

### 3. Future Patterns Agent
**Focus**: Next-generation component patterns
**Responsibilities**:
- Implement Server Components optimization
- Create AI-ready component APIs
- Design for future extensibility
- Implement advanced state patterns
- Create innovative interactions

## Key Innovation Areas

### 1. Advanced Theme System
```typescript
// Four-theme system with smooth transitions
interface ThemeConfig {
  name: 'light' | 'dark' | 'contrast' | 'gentle';
  colors: Record<string, string>;
  semantics: {
    emergency: string;
    success: string;
    warning: string;
    info: string;
  };
  motion: {
    reducedMotion: boolean;
    transitions: 'smooth' | 'instant' | 'bouncy';
  };
}

// Innovative theme switching with View Transitions
const useThemeTransition = () => {
  const switchTheme = async (newTheme: string) => {
    if (!document.startViewTransition) {
      // Fallback for browsers without support
      document.documentElement.dataset.theme = newTheme;
      return;
    }
    
    await document.startViewTransition(() => {
      document.documentElement.dataset.theme = newTheme;
    }).ready;
  };
  
  return { switchTheme };
};

// CSS for smooth theme transitions
const themeTransitionCSS = `
  @supports (view-transition-name: root) {
    :root {
      view-transition-name: root;
    }
    
    ::view-transition-old(root) {
      animation: fade-out 0.3s ease-out;
    }
    
    ::view-transition-new(root) {
      animation: fade-in 0.3s ease-out;
    }
  }
`;
```

### 2. Container Queries for Responsive Components
```typescript
// Self-aware responsive components
const ResponsiveHeader = () => {
  return (
    <header className="header-container">
      <style jsx>{`
        .header-container {
          container-type: inline-size;
          container-name: header;
        }
        
        @container header (max-width: 768px) {
          .nav-items { display: none; }
          .mobile-menu { display: block; }
        }
        
        @container header (min-width: 769px) {
          .nav-items { display: flex; }
          .mobile-menu { display: none; }
        }
      `}</style>
      
      <nav className="nav-items">{/* Desktop nav */}</nav>
      <div className="mobile-menu">{/* Mobile nav */}</div>
    </header>
  );
};
```

### 3. AI-Ready Component APIs
```typescript
// Components that can adapt to AI suggestions
interface AIAwareHeaderProps extends HeaderProps {
  aiSuggestions?: {
    prominentActions?: string[];
    userContext?: Record<string, any>;
    personalization?: {
      showDonateButton?: boolean;
      highlightedSection?: string;
    };
  };
}

const AIAwareHeader: React.FC<AIAwareHeaderProps> = ({
  aiSuggestions,
  ...props
}) => {
  // Adapt navigation based on AI suggestions
  const enhancedNavItems = React.useMemo(() => {
    if (!aiSuggestions?.prominentActions) return props.navItems;
    
    return props.navItems?.map(item => ({
      ...item,
      highlight: aiSuggestions.prominentActions.includes(item.href)
    }));
  }, [props.navItems, aiSuggestions]);
  
  return <Header {...props} navItems={enhancedNavItems} />;
};
```

### 4. Predictive Navigation
```typescript
// Prefetch likely navigation targets
const usePredictiveNavigation = () => {
  const observer = React.useRef<IntersectionObserver>();
  
  React.useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.href;
            
            // Prefetch the page
            if ('prefetch' in HTMLLinkElement.prototype) {
              const prefetchLink = document.createElement('link');
              prefetchLink.rel = 'prefetch';
              prefetchLink.href = href;
              document.head.appendChild(prefetchLink);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    // Observe all navigation links
    const links = document.querySelectorAll('nav a[href^="/"]');
    links.forEach(link => observer.current?.observe(link));
    
    return () => observer.current?.disconnect();
  }, []);
};
```

### 5. Advanced Motion Preferences
```typescript
// Beyond prefers-reduced-motion
interface MotionPreferences {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  prefersContrast: 'no-preference' | 'more' | 'less';
  colorScheme: 'light' | 'dark';
  inverted: boolean;
}

const useMotionPreferences = (): MotionPreferences => {
  const [prefs, setPrefs] = React.useState<MotionPreferences>({
    reducedMotion: false,
    reducedTransparency: false,
    prefersContrast: 'no-preference',
    colorScheme: 'light',
    inverted: false
  });
  
  React.useEffect(() => {
    const queries = {
      reducedMotion: '(prefers-reduced-motion: reduce)',
      reducedTransparency: '(prefers-reduced-transparency: reduce)',
      moreContrast: '(prefers-contrast: more)',
      lessContrast: '(prefers-contrast: less)',
      darkScheme: '(prefers-color-scheme: dark)',
      inverted: '(inverted-colors: inverted)'
    };
    
    const updatePreferences = () => {
      setPrefs({
        reducedMotion: window.matchMedia(queries.reducedMotion).matches,
        reducedTransparency: window.matchMedia(queries.reducedTransparency).matches,
        prefersContrast: window.matchMedia(queries.moreContrast).matches ? 'more' :
                        window.matchMedia(queries.lessContrast).matches ? 'less' : 'no-preference',
        colorScheme: window.matchMedia(queries.darkScheme).matches ? 'dark' : 'light',
        inverted: window.matchMedia(queries.inverted).matches
      });
    };
    
    updatePreferences();
    
    // Listen for changes
    Object.values(queries).forEach(query => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', updatePreferences);
    });
    
    return () => {
      Object.values(queries).forEach(query => {
        const mq = window.matchMedia(query);
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);
  
  return prefs;
};
```

### 6. Smart Sticky Header with Scroll Behavior
```typescript
// Intelligent header that adapts to scroll patterns
const useSmartStickyHeader = () => {
  const [headerState, setHeaderState] = React.useState({
    isVisible: true,
    isSticky: false,
    progress: 0,
    velocity: 0
  });
  
  React.useEffect(() => {
    let lastScrollY = 0;
    let lastTime = Date.now();
    let rafId: number;
    
    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const deltaY = currentScrollY - lastScrollY;
      const deltaTime = currentTime - lastTime;
      const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      
      setHeaderState({
        isVisible: velocity <= 0 || currentScrollY < 50,
        isSticky: currentScrollY > 100,
        progress: Math.min(currentScrollY / 300, 1),
        velocity
      });
      
      lastScrollY = currentScrollY;
      lastTime = currentTime;
      rafId = requestAnimationFrame(updateHeader);
    };
    
    rafId = requestAnimationFrame(updateHeader);
    
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return headerState;
};
```

### 7. Experimental Features Flag System
```typescript
// Feature flags for progressive enhancement
interface ExperimentalFeatures {
  viewTransitions: boolean;
  containerQueries: boolean;
  hasSelector: boolean;
  scrollTimeline: boolean;
  anchorPositioning: boolean;
}

const useExperimentalFeatures = (): ExperimentalFeatures => {
  return {
    viewTransitions: 'startViewTransition' in document,
    containerQueries: CSS.supports('container-type: inline-size'),
    hasSelector: CSS.supports('selector(:has(*))'),
    scrollTimeline: CSS.supports('animation-timeline: scroll()'),
    anchorPositioning: CSS.supports('anchor-name: --anchor')
  };
};
```

## Files to Create

1. `implementations/innovation/components/Header.tsx`
2. `implementations/innovation/components/Footer.tsx`
3. `implementations/innovation/components/MainLayout.tsx`
4. `implementations/innovation/theme/ThemeProvider.tsx`
5. `implementations/innovation/theme/theme-config.ts`
6. `implementations/innovation/hooks/useExperimentalFeatures.ts`
7. `implementations/innovation/utils/ai-integration.ts`
8. `implementations/innovation/INNOVATION_REPORT.md`

## Innovation Checklist

- [ ] Four-theme system with smooth transitions
- [ ] View Transitions API where supported
- [ ] Container Queries for true component responsiveness
- [ ] AI-ready component APIs
- [ ] Predictive navigation prefetching
- [ ] Advanced motion preferences beyond reduce-motion
- [ ] Smart sticky header with scroll physics
- [ ] Feature detection and progressive enhancement
- [ ] Future CSS features with fallbacks
- [ ] Performance metrics integration

## Remember
Innovation without purpose is just complexity. Every feature should enhance the user's ability to engage with our mission of protecting animals.