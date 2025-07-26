# Common Workflows - End to End

This document shows complete workflows from start to finish, demonstrating how multiple handlers chain together to accomplish real development tasks.

## 1. Building a New Feature

### Scenario: Add User Authentication to an App

```mermaid
graph TD
    A[User: "I want to work on user authentication"] -->|start-new-work| B[Create work folder]
    B --> C[Initialize tracking files]
    C -->|create-todos| D[Break down into tasks]
    D --> E[Show task list]
    E -->|User selects first task| F[Research auth patterns]
    F -->|search-code| G[Find existing patterns]
    G -->|create-component| H[Create auth service]
    H -->|create-test-checkpoint| I[Add auth tests]
    I -->|validate-changes| J[Verify implementation]
    J -->|commit-changes| K[Save progress]
```

**Full Conversation Flow:**

```
User: "I want to work on user authentication"
Claude: Creating work folder: 20250725-user-authentication-ACTIVE/
        Initializing tracking files...
        What aspects of authentication do you want to implement?

User: "Login, logout, and session management"
Claude: Breaking this down into tasks:
        1. Create auth service structure
        2. Implement login functionality  
        3. Implement logout functionality
        4. Add session management
        5. Create auth UI components
        6. Add auth tests
        7. Integrate with existing app

User: "Let's start with the auth service"
Claude: [Creates service structure following patterns]
        Created: src/services/auth.service.js
        Added methods: login(), logout(), getSession()

User: "Add the login implementation"
Claude: [Implements login with API calls]
        Added login logic with:
        - Input validation
        - API communication
        - Token storage
        - Error handling

User: "Test that it works"
Claude: [Creates and runs tests]
        ✅ All auth service tests passing
        Ready to move to the next task

User: "Great, commit this"
Claude: Committing with message: "feat: add auth service with login implementation"
        ✅ Changes committed
```

## 2. Fixing a Production Bug

### Scenario: Users Can't Submit Forms

```mermaid
graph TD
    A[User: "The submit button isn't working"] -->|fix-bug| B[Load bug-fix-template]
    B -->|gather-evidence| C[Reproduce issue]
    C -->|search-code| D[Find submit handler]
    D -->|debug-issue| E[Identify root cause]
    E -->|edit-file| F[Implement fix]
    F -->|validate-changes| G[Test fix works]
    G -->|commit-changes| H[Deploy fix]
```

**Full Conversation Flow:**

```
User: "Users report the submit button on the contact form isn't working"
Claude: Starting bug fix process. First, I need to reproduce the issue.
        Let me find the contact form...

Claude: Found ContactForm component at src/components/ContactForm.jsx
        Reading the submit handler...

User: "It works fine locally but fails in production"
Claude: This suggests an environment-specific issue. Let me check:
        1. API endpoint configuration
        2. CORS settings
        3. Environment variables

Claude: Found it! The production API_URL env variable is missing the /api prefix
        Current: https://example.com
        Should be: https://example.com/api

User: "That makes sense! Fix it"
Claude: Updating the environment configuration...
        Fixed in .env.production
        Also adding validation to prevent this in the future

User: "Test that the fix works"
Claude: Created test to verify API URL configuration
        ✅ Test passes with correct URL
        ❌ Test fails with missing /api (as expected)

User: "Perfect, commit and let's deploy"
Claude: Committing with message: "fix: add missing /api prefix to production API_URL"
```

## 3. Code Review Workflow

### Scenario: Review Changes Before PR

```mermaid
graph TD
    A[User: "Review my changes"] -->|check-status| B[Show git diff]
    B -->|code-review| C[Load review template]
    C --> D[Check logic/correctness]
    D --> E[Check performance]
    E --> F[Check security]
    F --> G[Check style/patterns]
    G --> H[Provide feedback]
    H -->|User fixes issues| I[Re-review]
    I -->|commit-changes| J[Ready for PR]
```

**Full Conversation Flow:**

```
User: "Review my changes before I create a PR"
Claude: Let me check what you've changed...
        
        Found changes in 4 files:
        - src/api/users.js
        - src/components/UserList.jsx
        - src/utils/validation.js
        - tests/users.test.js

        Starting comprehensive review...

## Code Review Results

### ✅ Logic & Correctness
- User CRUD operations implemented correctly
- Proper error handling in place
- Edge cases handled (empty data, malformed input)

### ⚠️ Performance Concerns
- UserList re-renders on every state change
- Consider memoizing getUserData function
- API calls could be batched

### 🔒 Security Issues
- User input not sanitized before database query
- API keys visible in client-side code
- Missing authentication on DELETE endpoint

### 📝 Style & Patterns
- Inconsistent naming: userId vs user_id
- Missing PropTypes in UserList component
- Console.logs left in production code

User: "Fix the security issues first"
Claude: Addressing security issues:
        1. Adding input sanitization
        2. Moving API keys to environment variables
        3. Adding auth middleware to DELETE endpoint

        [Makes changes]
        ✅ Security issues resolved

User: "Now optimize the performance"
Claude: Implementing performance improvements:
        1. Adding React.memo to UserList
        2. Memoizing getUserData with useCallback
        3. Implementing request batching

        ✅ Performance optimized

User: "Great, review again"
Claude: Re-reviewing changes...
        ✅ All issues addressed
        Code is now ready for PR
```

## 4. Understanding Legacy Code

### Scenario: Need to Modify Complex Legacy System

```mermaid
graph TD
    A[User: "How does the payment system work?"] -->|explain-code| B[Find payment code]
    B -->|find-symbol| C[Locate main functions]
    C -->|find-references| D[Trace usage]
    D -->|analyze-code| E[Map flow]
    E --> F[Create documentation]
    F -->|User: ready to modify| G[Plan changes]
```

**Full Conversation Flow:**

```
User: "I need to modify the payment system but don't understand how it works"
Claude: Let me analyze the payment system for you...

        Found main payment files:
        - src/payment/processor.js
        - src/payment/gateway.js
        - src/payment/validation.js

        Reading the entry point...

## Payment System Overview

The payment flow works as follows:

1. **Entry Point**: `processPayment()` in processor.js:42
   - Receives payment data from checkout
   - Validates card information

2. **Validation**: `validatePayment()` in validation.js:15
   - Checks card number format
   - Verifies expiry date
   - Validates CVV

3. **Gateway Communication**: `chargeCard()` in gateway.js:78
   - Connects to Stripe API
   - Handles 3D Secure if required
   - Returns transaction result

4. **Response Handling**: Back in processor.js:67
   - Updates order status
   - Sends confirmation email
   - Logs transaction

User: "Where does it handle failed payments?"
Claude: Failed payments are handled in multiple places:

        1. gateway.js:95 - Network/API failures
           ```javascript
           catch (error) {
             if (error.code === 'card_declined') {
               return handleDecline(error);
             }
             throw new PaymentGatewayError(error);
           }
           ```

        2. processor.js:73 - Business logic failures
           - Insufficient funds
           - Fraud detection
           - Invalid payment method

User: "I need to add support for PayPal"
Claude: Based on the current architecture, here's how to add PayPal:

        1. Create new file: src/payment/paypal-gateway.js
        2. Implement same interface as gateway.js
        3. Add PayPal case to processor.js switch statement
        4. Update validation.js for PayPal-specific rules

        Want me to start implementing this?
```

## 5. Performance Optimization Workflow

### Scenario: Application Running Slowly

```mermaid
graph TD
    A[User: "The app is slow"] -->|debug-issue| B[Identify bottlenecks]
    B -->|measure-complexity| C[Analyze code complexity]
    C -->|check-dependencies| D[Review dependencies]
    D -->|optimize-code| E[Implement optimizations]
    E -->|validate-changes| F[Measure improvements]
    F -->|commit-changes| G[Deploy optimizations]
```

**Full Conversation Flow:**

```
User: "The dashboard is loading very slowly"
Claude: Let me analyze the performance issues...

        Starting performance investigation:
        1. Checking component render times
        2. Analyzing API calls
        3. Reviewing data processing

## Performance Analysis Results

### 🔴 Critical Issues Found:

1. **Unnecessary Re-renders**: Dashboard.jsx:45
   - Re-rendering on every state update
   - Child components not memoized

2. **Multiple API Calls**: api/dashboard.js:23
   - Making 15 separate API calls
   - Could be batched into 2-3 calls

3. **Heavy Computation**: utils/calculations.js:67
   - Recalculating on every render
   - No caching of results

User: "Fix the API calls first"
Claude: Implementing API batching...

        Before: 15 separate calls (3.2s total)
        After: 3 batched calls (0.8s total)
        
        Changes made:
        - Created getDashboardData() batch endpoint
        - Grouped related data fetches
        - Added parallel processing

User: "Now fix the re-rendering"
Claude: Optimizing component rendering...

        Applied optimizations:
        1. Added React.memo to 6 child components
        2. Implemented useMemo for expensive calculations
        3. Used useCallback for event handlers
        
        Result: Reduced renders from 47 to 3 on typical interaction

User: "What's the overall improvement?"
Claude: Performance improvements summary:
        
        Initial load time: 4.8s → 1.2s (75% faster)
        Interaction delay: 400ms → 50ms (87% faster)
        Memory usage: 45MB → 28MB (38% reduction)
        
        ✅ Dashboard is now significantly faster!
```

## 6. Test-Driven Development Workflow

### Scenario: Building Feature with TDD

```mermaid
graph TD
    A[User: "Create user profile feature with TDD"] -->|create-test-checkpoint| B[Write failing tests]
    B -->|run-tests| C[Verify tests fail]
    C -->|create-component| D[Implement minimal code]
    D -->|run-tests| E[Make tests pass]
    E -->|refactor-code| F[Improve implementation]
    F -->|run-tests| G[Ensure still passing]
    G -->|commit-changes| H[Save progress]
```

**Full Conversation Flow:**

```
User: "Let's build a user profile component using TDD"
Claude: Starting TDD workflow. First, I'll write the tests...

        Creating: tests/UserProfile.test.jsx
        
        Test cases:
        1. Renders user information
        2. Handles missing data gracefully
        3. Shows edit button for own profile
        4. Hides edit button for other profiles
        5. Updates on user data change

User: "Run the tests"
Claude: Running tests...
        
        ❌ All 5 tests failing (expected - component doesn't exist yet)

User: "Now create minimal implementation"
Claude: Creating minimal UserProfile component...

        Created: src/components/UserProfile.jsx
        - Basic structure
        - Renders user data
        - Conditional edit button

        Running tests again...
        ✅ 3/5 tests passing
        ❌ Missing data handling failing
        ❌ Update on change failing

User: "Fix the failing tests"
Claude: Adding missing functionality...

        1. Added null checks for missing data
        2. Implemented useEffect for data updates
        
        Running tests...
        ✅ All 5 tests passing!

User: "Refactor to make it cleaner"
Claude: Refactoring while keeping tests green...

        Improvements:
        1. Extracted UserAvatar subcomponent
        2. Created useUserProfile custom hook
        3. Added proper PropTypes
        4. Improved styling structure
        
        Running tests...
        ✅ Still all passing!

User: "Great, add integration tests and commit"
Claude: Adding integration tests...
        
        New tests:
        - Profile loads from API
        - Edit mode works correctly
        - Save updates user data
        
        ✅ All tests passing
        
        Committing: "feat: add UserProfile component with full test coverage"
```

## Key Workflow Patterns

### 1. **Investigation → Implementation → Validation**
Most workflows follow this pattern:
- First understand (search, explain, analyze)
- Then implement (create, edit, refactor)
- Finally validate (test, review, commit)

### 2. **Incremental Progress**
- Break large tasks into small steps
- Validate each step before proceeding
- Commit working code frequently

### 3. **Context Building**
- Start broad, then narrow focus
- Gather evidence before making changes
- Document decisions and findings

### 4. **Systematic Approach**
- Use templates for consistency
- Follow established patterns
- Maintain tracking throughout

## Tips for Smooth Workflows

1. **Set Clear Goals**
   - State what you want to achieve
   - Define success criteria
   - Identify constraints

2. **Provide Context**
   - Mention related files
   - Explain business requirements
   - Share previous decisions

3. **Iterate and Refine**
   - Start simple, enhance gradually
   - Test frequently
   - Refactor when stable

4. **Track Progress**
   - Use Claude's work tracking
   - Commit meaningful checkpoints
   - Document important findings

These workflows show how Claude's handlers work together to accomplish real development tasks efficiently and systematically.