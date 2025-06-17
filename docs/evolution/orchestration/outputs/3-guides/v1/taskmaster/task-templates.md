# TaskMaster Task Templates

## Overview
Pre-configured task templates for common Mom's Blog workflows, designed to integrate seamlessly with TaskMaster AI.

## Task Template Structure

```json
{
  "taskTemplate": {
    "title": "Template Name",
    "category": "feature|performance|content|maintenance",
    "estimatedTime": "30m-2h",
    "complexity": "low|medium|high",
    "dependencies": [],
    "subtasks": []
  }
}
```

## 1. Feature Addition Templates

### Add New Blog Component
```json
{
  "title": "Add {ComponentName} to Blog",
  "category": "feature",
  "estimatedTime": "1-2h",
  "complexity": "medium",
  "subtasks": [
    {
      "title": "Design component interface",
      "estimatedTime": "20m",
      "checklist": [
        "Define props interface",
        "Create TypeScript types",
        "Document component API"
      ]
    },
    {
      "title": "Implement component logic",
      "estimatedTime": "40m",
      "checklist": [
        "Create component file",
        "Add React 19 features",
        "Implement accessibility"
      ]
    },
    {
      "title": "Style with Tailwind",
      "estimatedTime": "30m",
      "checklist": [
        "Apply design system tokens",
        "Test across themes",
        "Ensure responsive design"
      ]
    },
    {
      "title": "Add tests and documentation",
      "estimatedTime": "30m",
      "checklist": [
        "Write unit tests",
        "Update component registry",
        "Add usage examples"
      ]
    }
  ]
}
```

### Implement Content Feature
```json
{
  "title": "Add {FeatureName} Content System",
  "category": "feature",
  "estimatedTime": "2-4h",
  "complexity": "high",
  "subtasks": [
    {
      "title": "Design content schema",
      "estimatedTime": "30m"
    },
    {
      "title": "Create MDX components",
      "estimatedTime": "45m"
    },
    {
      "title": "Set up content pipeline",
      "estimatedTime": "45m"
    },
    {
      "title": "Add content management UI",
      "estimatedTime": "1h"
    },
    {
      "title": "Test and optimize",
      "estimatedTime": "30m"
    }
  ]
}
```

## 2. Performance Optimization Templates

### Optimize Component Performance
```json
{
  "title": "Optimize {ComponentName} Performance",
  "category": "performance",
  "estimatedTime": "1-2h",
  "complexity": "medium",
  "subtasks": [
    {
      "title": "Profile current performance",
      "estimatedTime": "20m",
      "tools": ["React DevTools", "Lighthouse"]
    },
    {
      "title": "Implement optimizations",
      "estimatedTime": "40m",
      "checklist": [
        "Add React.memo where appropriate",
        "Optimize re-renders with useMemo/useCallback",
        "Lazy load heavy components"
      ]
    },
    {
      "title": "Validate improvements",
      "estimatedTime": "20m",
      "metrics": {
        "targetLCP": "<2.5s",
        "targetFID": "<100ms",
        "targetCLS": "<0.1"
      }
    }
  ]
}
```

### Image Optimization Task
```json
{
  "title": "Optimize Blog Images",
  "category": "performance",
  "estimatedTime": "30m-1h",
  "complexity": "low",
  "subtasks": [
    {
      "title": "Audit current images",
      "estimatedTime": "15m"
    },
    {
      "title": "Implement next/image",
      "estimatedTime": "20m"
    },
    {
      "title": "Configure image optimization",
      "estimatedTime": "15m"
    },
    {
      "title": "Test loading performance",
      "estimatedTime": "10m"
    }
  ]
}
```

## 3. Content Management Templates

### Create New Blog Post
```json
{
  "title": "Write and Publish {PostTitle}",
  "category": "content",
  "estimatedTime": "1-3h",
  "complexity": "low",
  "subtasks": [
    {
      "title": "Draft content in MDX",
      "estimatedTime": "1h"
    },
    {
      "title": "Add metadata and frontmatter",
      "estimatedTime": "10m"
    },
    {
      "title": "Optimize images and media",
      "estimatedTime": "20m"
    },
    {
      "title": "Apply content sensitivity review",
      "estimatedTime": "15m"
    },
    {
      "title": "Preview and publish",
      "estimatedTime": "15m"
    }
  ]
}
```

### Bulk Content Migration
```json
{
  "title": "Migrate {ContentType} Content",
  "category": "content",
  "estimatedTime": "2-4h",
  "complexity": "high",
  "dependencies": ["backup-current-content"],
  "subtasks": [
    {
      "title": "Export existing content",
      "estimatedTime": "30m"
    },
    {
      "title": "Transform content format",
      "estimatedTime": "1h"
    },
    {
      "title": "Validate MDX syntax",
      "estimatedTime": "30m"
    },
    {
      "title": "Import to new system",
      "estimatedTime": "45m"
    },
    {
      "title": "Verify all links and media",
      "estimatedTime": "45m"
    }
  ]
}
```

## 4. Maintenance Templates

### Fix Theme Issue
```json
{
  "title": "Fix {ThemeName} Theme Issue",
  "category": "maintenance",
  "estimatedTime": "30m-1h",
  "complexity": "medium",
  "subtasks": [
    {
      "title": "Reproduce issue across themes",
      "estimatedTime": "10m"
    },
    {
      "title": "Identify CSS/Tailwind conflicts",
      "estimatedTime": "15m"
    },
    {
      "title": "Apply theme-aware fixes",
      "estimatedTime": "20m"
    },
    {
      "title": "Test all four themes",
      "estimatedTime": "15m"
    }
  ]
}
```

### Dependency Update
```json
{
  "title": "Update {PackageName} Dependency",
  "category": "maintenance",
  "estimatedTime": "30m-2h",
  "complexity": "medium",
  "subtasks": [
    {
      "title": "Review breaking changes",
      "estimatedTime": "15m"
    },
    {
      "title": "Update package with pnpm",
      "estimatedTime": "5m"
    },
    {
      "title": "Fix compatibility issues",
      "estimatedTime": "30m"
    },
    {
      "title": "Run full test suite",
      "estimatedTime": "20m"
    },
    {
      "title": "Update documentation",
      "estimatedTime": "20m"
    }
  ]
}
```

## 5. Integration Instructions

### Using Templates with TaskMaster

1. **Initialize with Template**:
   ```bash
   # Copy template to TaskMaster
   taskmaster add-task --template "Add New Blog Component" \
     --replace "{ComponentName}" "AuthorBio"
   ```

2. **Bulk Task Creation**:
   ```javascript
   // Import templates for batch processing
   const templates = require('./task-templates.json');
   const featureTasks = templates.filter(t => t.category === 'feature');
   ```

3. **Time Estimation**:
   ```javascript
   // Calculate total project time
   const totalHours = tasks.reduce((sum, task) => {
     const [min, max] = task.estimatedTime.match(/\d+/g);
     return sum + (parseInt(min) + parseInt(max)) / 2;
   }, 0);
   ```

### Customizing Templates

1. **Add Project-Specific Steps**:
   ```json
   {
     "subtasks": [
       ...defaultSubtasks,
       {
         "title": "Update animal shelter gallery",
         "estimatedTime": "20m",
         "projectSpecific": true
       }
     ]
   }
   ```

2. **Adjust Time Estimates**:
   - Multiply by 1.5x for first-time tasks
   - Reduce by 0.7x for repeated tasks
   - Add buffer for complex integrations

3. **Link Dependencies**:
   ```json
   {
     "dependencies": [
       "setup-development-environment",
       "install-shadcn-components",
       "configure-themes"
     ]
   }
   ```

## Template Categories

### By Complexity
- **Low (30m-1h)**: Simple fixes, content updates, minor styling
- **Medium (1-2h)**: Component creation, performance optimization
- **High (2-4h)**: System integration, major features, migrations

### By Frequency
- **Daily**: Content creation, minor fixes
- **Weekly**: Component additions, performance checks
- **Monthly**: Dependency updates, major features
- **Quarterly**: Architecture changes, platform upgrades

## Best Practices

1. **Always Include**:
   - Clear subtask titles
   - Realistic time estimates
   - Success criteria/checklist
   - Required tools/dependencies

2. **Template Versioning**:
   - Track template effectiveness
   - Update based on actual completion times
   - Archive outdated templates

3. **Team Collaboration**:
   - Share successful templates
   - Document template modifications
   - Create team-specific variants