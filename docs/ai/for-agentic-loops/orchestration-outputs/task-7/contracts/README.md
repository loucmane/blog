# Task 7 Implementation Contracts

These contracts define the requirements for building core layout components (Header, Footer, MainLayout) for the Animal Protection Foundation website.

## Contract Files

### 1. `interface-contract.yaml`
Defines the component APIs and prop interfaces that all implementations must follow.

**Key Points:**
- Header component with sticky behavior, navigation, emergency banner support
- Footer with social links, trust signals, and multi-column layout
- MainLayout wrapper with semantic HTML and accessibility features
- All components use forwardRef and have proper TypeScript types
- Support for theme switching and responsive design

### 2. `behavior-contract.yaml`
Specifies the core functionality and behavioral requirements for each component.

**Key Points:**
- Mobile-first responsive behavior with breakpoint at md (768px)
- Keyboard navigation and focus management
- 44x44px minimum touch targets
- Sheet component for mobile navigation
- Smooth animations and transitions
- Performance targets (render < 50ms, menu open < 100ms)

### 3. `integration-contract.yaml`
Defines file structure, naming conventions, imports, and integration patterns.

**Key Points:**
- Files located in `packages/web/src/components/layout/`
- Specific import order and conventions
- Integration with shadcn/ui components (Sheet, Button)
- Theme integration using CSS variables
- Export patterns for tree-shaking
- Testing and documentation requirements

### 4. `constraints-contract.yaml`
Sets performance budgets, browser support, and compliance standards.

**Key Points:**
- Lighthouse scores >= 98 across all categories
- WCAG 2.1 AA accessibility compliance
- Bundle size limits (< 30KB total for layout components)
- Support for four themes (Light, Dark, High Contrast, Gentle)
- Browser support: Chrome 90+, Firefox 88+, Safari 14+
- Mobile-first with specific breakpoints

## Implementation Guidelines

### For All Agents

1. **Read All Contracts**: Each contract provides different perspectives on the requirements
2. **Maintain Compatibility**: Your implementation must work with other agents' code
3. **Follow Conventions**: Use the established patterns from the codebase
4. **Test Your Work**: Ensure your implementation meets the performance and accessibility standards

### Specialist Focus Areas

- **Performance Agent**: Focus on bundle size, render performance, code splitting
- **Architecture Agent**: Focus on component structure, reusability, maintainability
- **UX/DX Agent**: Focus on developer experience, intuitive APIs, documentation
- **Accessibility Agent**: Focus on WCAG compliance, keyboard navigation, screen readers
- **Innovation Agent**: Focus on creative solutions while maintaining compatibility

### Key Requirements Summary

1. **Components to Build**:
   - Header with desktop/mobile navigation
   - Footer with links and trust signals
   - MainLayout wrapper component

2. **Must Support**:
   - Four theme system
   - Mobile-first responsive design
   - 44x44px touch targets
   - Keyboard navigation
   - Screen reader compatibility

3. **Technical Requirements**:
   - React 19.1.0 with forwardRef
   - Next.js 15.3.3 App Router
   - TypeScript strict mode
   - Tailwind CSS with cn() utility

4. **Performance Targets**:
   - 98+ Lighthouse scores
   - < 30KB total bundle size
   - < 50ms initial render

## Contract Validation

Your implementation will be considered successful if it:
- Implements all required props and features from `interface-contract.yaml`
- Exhibits all behaviors specified in `behavior-contract.yaml`
- Follows the patterns in `integration-contract.yaml`
- Meets the standards in `constraints-contract.yaml`

Remember: These contracts enable diversity in implementation while ensuring compatibility. Be creative within the boundaries!