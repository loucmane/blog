# Multi-AI Collaboration: Code Review Prompts

## Use Case
Getting a second opinion on code quality, architecture decisions, and potential improvements from Gemini.

## Example Prompt Template

```
Review this [CODE/ARCHITECTURE] and provide insights on:

1. Code quality and best practices
2. Potential bugs or edge cases
3. Performance considerations
4. Security implications
5. Suggested improvements

Context: [PROJECT CONTEXT]
Constraints: [TECHNICAL CONSTRAINTS]

[CODE TO REVIEW]
```

## Real Examples

### Example 1: React Component Review
```
Review this donation form component for our animal welfare platform:

Focus areas:
1. Accessibility for global users
2. Performance on slow connections
3. Error handling robustness
4. Security of payment data
5. Code maintainability

Context: Used by field workers on 2G connections
Constraints: Must work offline, WCAG AA compliant

```typescript
export function DonationForm({ onSuccess }: DonationFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      
      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      alert('Donation failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Donate'}
      </button>
    </form>
  );
}
```
```

### Example 2: Architecture Review
```
Review our authentication architecture for security and scalability:

Current implementation:
1. JWT tokens stored in localStorage
2. Refresh tokens in httpOnly cookies
3. Token rotation every 15 minutes
4. Role-based permissions in token claims

Concerns:
- Supporting 10K+ concurrent users
- Preventing token theft
- Handling offline scenarios
- Multi-device sessions

Should we consider:
- Moving to session-based auth?
- Adding device fingerprinting?
- Implementing OAuth providers?
```

### Example 3: Performance Optimization Review
```
Review this data fetching pattern for performance:

```typescript
// Current implementation
export function AnimalList() {
  const [animals, setAnimals] = useState([]);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    fetch(`/api/animals?${new URLSearchParams(filters)}`)
      .then(res => res.json())
      .then(setAnimals);
  }, [filters]);
  
  return animals.map(animal => (
    <AnimalCard 
      key={animal.id} 
      {...animal}
      onUpdate={() => refetch()}
    />
  ));
}
```

Issues we're seeing:
- Unnecessary re-renders
- No caching
- Race conditions with rapid filter changes
- Memory leaks on unmount

What's the best approach to fix these?
```

## Advanced Review Scenarios

### Security Audit
```
Security review for our donation API:

```typescript
app.post('/api/donate', async (req, res) => {
  const { amount, cardToken, userId } = req.body;
  
  // Process payment
  const charge = await stripe.charges.create({
    amount: amount * 100,
    currency: 'usd',
    source: cardToken
  });
  
  // Record donation
  await db.donations.create({
    userId,
    amount,
    chargeId: charge.id
  });
  
  res.json({ success: true });
});
```

Please check for:
- Input validation gaps
- SQL injection risks
- Payment security issues
- Error handling
- Rate limiting needs
```

### Accessibility Review
```
Review this modal implementation for accessibility:

```jsx
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}
```

Requirements:
- Screen reader compatibility
- Keyboard navigation
- Focus management
- ARIA attributes
- Motion preferences
```

## Tips for Effective Reviews

### 1. Provide Context
- What's the component's purpose?
- Who are the users?
- What are the constraints?

### 2. Be Specific About Concerns
- Don't just ask "is this good?"
- Point out specific areas of concern
- Mention what you've already considered

### 3. Include Related Code
- Show interfaces and types
- Include usage examples
- Provide surrounding context

### 4. Ask for Alternatives
- "What's a better pattern for this?"
- "How would you structure this differently?"
- "What are industry best practices?"

## Following Up on Reviews

### When Gemini Suggests Changes
```
You suggested using React Query for data fetching.
Can you show me:
1. How to migrate from our current pattern
2. How to handle our offline requirements
3. How to maintain our current API
```

### When You Need Clarification
```
You mentioned "potential race condition" - can you:
1. Explain the exact scenario
2. Show how to reproduce it
3. Provide a concrete fix
```

### When Exploring Trade-offs
```
You suggested three approaches. Help me decide:
1. What's the complexity of each?
2. What are the performance implications?
3. Which fits our team's skill level?
```

Remember: Gemini excels at spotting patterns, suggesting best practices, and providing alternative approaches. Use it as a knowledgeable colleague for code reviews!