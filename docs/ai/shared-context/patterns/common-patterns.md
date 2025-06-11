# Common Development Patterns

## React Patterns

### Custom Hook Pattern
```typescript
// Pattern: Encapsulate stateful logic in custom hooks
function useContentWarning(level: 1 | 2 | 3) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isBlurred, setIsBlurred] = useState(level > 1);

  const accept = useCallback(() => {
    setIsAccepted(true);
    setIsBlurred(false);
    // Track acceptance for analytics
    trackEvent('content_warning_accepted', { level });
  }, [level]);

  return { isAccepted, isBlurred, accept };
}

// Usage
function SensitiveContent({ content, level }) {
  const { isBlurred, accept } = useContentWarning(level);
  
  return (
    <div className={isBlurred ? 'blur-xl' : ''}>
      {/* Content */}
    </div>
  );
}
```

### Compound Component Pattern
```typescript
// Pattern: Related components that work together
interface CardContextValue {
  variant: 'default' | 'emergency' | 'success';
}

const CardContext = createContext<CardContextValue | null>(null);

function Card({ children, variant = 'default' }) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn('rounded-lg border', variantStyles[variant])}>
        {children}
      </div>
    </CardContext.Provider>
  );
}

function CardHeader({ children }) {
  const context = useContext(CardContext);
  return <div className="p-4 border-b">{children}</div>;
}

// Usage
<Card variant="emergency">
  <CardHeader>Urgent: Animals Need Help</CardHeader>
  <CardBody>...</CardBody>
</Card>
```

### Render Props Pattern
```typescript
// Pattern: Share code between components using a prop whose value is a function
interface TrackVisibilityProps {
  children: (isVisible: boolean) => React.ReactNode;
}

function TrackVisibility({ children }: TrackVisibilityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });

  return <div ref={ref}>{children(isVisible)}</div>;
}

// Usage
<TrackVisibility>
  {(isVisible) => (
    <ImpactCounter
      count={isVisible ? targetCount : 0}
      animate={isVisible}
    />
  )}
</TrackVisibility>
```

## State Management Patterns

### Reducer Pattern for Complex State
```typescript
// Pattern: Use reducers for complex state logic
interface DonationState {
  amount: number;
  frequency: 'once' | 'monthly';
  isProcessing: boolean;
  error: string | null;
}

type DonationAction =
  | { type: 'SET_AMOUNT'; amount: number }
  | { type: 'SET_FREQUENCY'; frequency: 'once' | 'monthly' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function donationReducer(state: DonationState, action: DonationAction): DonationState {
  switch (action.type) {
    case 'SET_AMOUNT':
      return { ...state, amount: action.amount, error: null };
    case 'SUBMIT_START':
      return { ...state, isProcessing: true, error: null };
    case 'SUBMIT_ERROR':
      return { ...state, isProcessing: false, error: action.error };
    default:
      return state;
  }
}
```

### Context Pattern for Cross-Cutting Concerns
```typescript
// Pattern: Use context for truly global state
interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification) => {
    const id = generateId();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration ?? 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationDisplay notifications={notifications} />
    </NotificationContext.Provider>
  );
}
```

## Data Fetching Patterns

### SWR Pattern for Data Fetching
```typescript
// Pattern: Use SWR for data fetching with caching
function useBlogPosts(category?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    category ? `/api/posts?category=${category}` : '/api/posts',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    posts: data?.posts ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
```

### Optimistic Updates Pattern
```typescript
// Pattern: Update UI optimistically while request is in flight
async function toggleLike(postId: string) {
  // Optimistically update UI
  mutate(
    `/api/posts/${postId}`,
    (currentData) => ({
      ...currentData,
      isLiked: !currentData.isLiked,
      likeCount: currentData.isLiked 
        ? currentData.likeCount - 1 
        : currentData.likeCount + 1,
    }),
    false // Don't revalidate yet
  );

  try {
    // Make actual request
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    // Revalidate to ensure consistency
    mutate(`/api/posts/${postId}`);
  } catch (error) {
    // Revert on error
    mutate(`/api/posts/${postId}`);
    throw error;
  }
}
```

## Error Handling Patterns

### Error Boundary Pattern
```typescript
// Pattern: Graceful error handling at component tree level
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo);
    trackError(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Result Pattern for Error Handling
```typescript
// Pattern: Explicit error handling without exceptions
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchDonationStats(): Promise<Result<DonationStats>> {
  try {
    const response = await fetch('/api/donations/stats');
    if (!response.ok) {
      return {
        success: false,
        error: new Error(`HTTP ${response.status}`),
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Usage
const result = await fetchDonationStats();
if (result.success) {
  displayStats(result.data);
} else {
  showError(result.error.message);
}
```

## Performance Patterns

### Debounce Pattern
```typescript
// Pattern: Limit function execution rate
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage: Search with debounce
function SearchPosts() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { posts } = useBlogPosts(debouncedSearch);
  
  return <input onChange={(e) => setSearch(e.target.value)} />;
}
```

### Virtual List Pattern
```typescript
// Pattern: Render only visible items in long lists
function VirtualList<T>({ items, itemHeight, renderItem }: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    if (!containerRef.current) return { start: 0, end: 0 };
    
    const containerHeight = containerRef.current.clientHeight;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
    
    return { start, end };
  }, [scrollTop, itemHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div style={{ transform: `translateY(${visibleRange.start * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Form Patterns

### Controlled Form Pattern with Zod
```typescript
// Pattern: Type-safe forms with validation
const donationSchema = z.object({
  amount: z.number().min(1).max(10000),
  email: z.string().email(),
  frequency: z.enum(['once', 'monthly']),
  anonymous: z.boolean().default(false),
});

type DonationForm = z.infer<typeof donationSchema>;

function DonationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 50,
      frequency: 'once',
      anonymous: false,
    },
  });

  const onSubmit = async (data: DonationForm) => {
    try {
      await processDonation(data);
      showSuccess('Thank you for your donation!');
    } catch (error) {
      showError('Failed to process donation');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Accessibility Patterns

### Focus Management Pattern
```typescript
// Pattern: Manage focus for accessibility
function Modal({ isOpen, onClose, children }) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocus.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      // Restore focus
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  // Trap focus within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Add Tab trap logic here
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
```

### Announcement Pattern
```typescript
// Pattern: Announce changes to screen readers
function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    // Force re-render to ensure announcement is read
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return {
    announcement,
    announce,
    Announcer: () => (
      <>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
        <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </>
    ),
  };
}
```

## Testing Patterns

### Test Data Factory Pattern
```typescript
// Pattern: Consistent test data generation
const createTestPost = (overrides?: Partial<BlogPost>): BlogPost => ({
  id: 'test-post-1',
  title: 'Test Post',
  content: 'Test content',
  author: 'Test Author',
  classification: 1,
  publishedAt: new Date('2024-01-01'),
  ...overrides,
});

// Usage in tests
it('should display sensitive content warning', () => {
  const post = createTestPost({ classification: 3 });
  render(<BlogPost post={post} />);
  expect(screen.getByText(/sensitive content/i)).toBeInTheDocument();
});
```

### Custom Render Pattern
```typescript
// Pattern: Wrap components with providers for testing
function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    ...renderOptions
  }: RenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <NotificationProvider>
          <RouterContext.Provider value={mockRouter}>
            {children}
          </RouterContext.Provider>
        </NotificationProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Usage
renderWithProviders(<DonationForm />);
```