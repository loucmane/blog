# How to Use Infinite Command for TaskMaster Tasks

## Overview
The `/infinite` command can generate multiple iterations of components or features, perfect for exploring different approaches to TaskMaster tasks while maintaining our established patterns.

## Example: Layout Components Task

### 1. Create a Specification File
First, create a detailed spec that defines:
- Core requirements (must-haves)
- Innovation dimensions (what can vary)
- Quality standards
- File structure

Example: `/specs/layout-components-spec.md`

### 2. Run the Infinite Command

```bash
# Generate 5 different layout component iterations
/infinite spec_file=/home/loucmane/dev/javascript/MomsBlog/blog/specs/layout-components-spec.md output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/components/layout-iterations count=5

# Generate unlimited iterations (until context limit)
/infinite spec_file=/home/loucmane/dev/javascript/MomsBlog/blog/specs/layout-components-spec.md output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/components/layout-iterations count=infinite
```

### 3. What Happens
The command will:
1. Analyze the specification deeply
2. Check existing iterations in the output directory
3. Deploy multiple Sub Agents in parallel
4. Each agent generates a unique iteration
5. All iterations follow core requirements but explore different dimensions

### 4. Benefits for TaskMaster Tasks

#### Rapid Prototyping
- Generate 5-10 different approaches to a component
- Test with stakeholders quickly
- Pick the best elements from each

#### Design Exploration
- Explore different visual styles
- Try various interaction patterns
- Test different architectures

#### Team Collaboration
- Show multiple options to the team
- A/B test different approaches
- Combine best features from iterations

## Creating Specs for Other Tasks

### MDX Processing Pipeline (Task 5)
```markdown
# MDX Pipeline Iteration Specification

## Core Requirements
- Support for frontmatter
- Custom component mapping
- Syntax highlighting
- Content validation

## Innovation Dimensions
1. Plugin architectures
2. Performance optimization strategies
3. Error handling approaches
4. Caching mechanisms
5. Preview generation methods
```

### Content Classification System (Task 10)
```markdown
# Content Classification Iteration Specification

## Core Requirements
- Three-tier sensitivity system
- Progressive disclosure
- Age verification
- User preferences

## Innovation Dimensions
1. UI/UX approaches for warnings
2. Classification algorithms
3. Storage strategies
4. Animation patterns
5. Mobile-specific solutions
```

## Best Practices

### 1. Spec File Structure
```markdown
# [Component/Feature] Iteration Specification

## Purpose
Clear description of what we're generating

## Core Requirements
Non-negotiable features every iteration must have

## Innovation Dimensions
What can vary between iterations

## Quality Standards
Performance, accessibility, code standards

## Evolution Pattern
How iterations should progress

## Output Requirements
File structure and deliverables
```

### 2. Output Directory Organization
```
components/
├── layout-iterations/
│   ├── iteration-1/
│   ├── iteration-2/
│   ├── iteration-3/
│   └── selected/  # Best parts combined
```

### 3. Selection Process
After generation:
1. Review all iterations
2. Test each for performance/accessibility
3. Gather team feedback
4. Combine best elements
5. Create final implementation

### 4. Integration with TaskMaster

```bash
# 1. Update task to in-progress
mcp__taskmaster-ai__set_task_status --id 7 --status in-progress

# 2. Generate iterations
/infinite spec_file=... output_dir=... count=5

# 3. Review and select best approach
# 4. Implement selected version
# 5. Update task to completed

mcp__taskmaster-ai__set_task_status --id 7 --status done
```

## Advanced Usage

### Conditional Specs
Create specs that adapt based on existing iterations:
- "If iteration 1-3 focus on style, iteration 4+ focus on performance"
- "Later iterations should combine successful elements"

### Collaborative Generation
Use multiple specs for different aspects:
1. Visual design iterations
2. Architecture iterations
3. Performance optimization iterations
4. Combine best from each category

### Testing Integration
Include test generation in specs:
- Each iteration includes its own tests
- Automated performance benchmarks
- Accessibility validation

## Examples of Innovation Dimensions

### Visual/Design
- Color usage patterns
- Spacing and density
- Typography hierarchies
- Icon styles and placement
- Animation timing and easing

### Technical/Architecture
- State management approaches
- Prop drilling vs context
- Composition patterns
- Performance optimizations
- Bundle splitting strategies

### UX/Interaction
- Navigation patterns
- Form interactions
- Loading states
- Error handling
- Mobile gestures

### Content/Information
- Information architecture
- Content prioritization
- Progressive disclosure
- Help text strategies
- Onboarding patterns

## Tips for Success

1. **Start with Clear Specs**: The better your specification, the better the iterations
2. **Use Parallel Generation**: Let Sub Agents work simultaneously for speed
3. **Review Early**: Check first few iterations to adjust spec if needed
4. **Document Decisions**: Keep notes on why certain approaches were selected
5. **Test Everything**: Each iteration should be production-ready
6. **Combine Wisely**: Cherry-pick the best features from each iteration

This approach turns the infinite command into a powerful tool for exploring design spaces while maintaining quality and consistency!