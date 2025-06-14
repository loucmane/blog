// context-manager.ts
interface AIContext {
  // Session metadata
  session: {
    id: string;
    startTime: Date;
    developer: string;
    assistant: 'claude' | 'gpt4' | 'copilot';
    task: string;
    parentSessionId?: string; // For linked sessions
  };

  // Code understanding
  codebase: {
    recentChanges: FileChange[];
    workingFiles: string[]; // Files actively being edited
    dependencies: DependencyGraph;
    testCoverage: CoverageReport;
    buildStatus: BuildInfo;
  };

  // Conversation context
  dialogue: {
    keyDecisions: Decision[];
    assumptions: Assumption[];
    questionsRaised: Question[];
    implementationNotes: Note[];
  };

  // Project state
  project: {
    activeIssues: Issue[];
    completedTasks: Task[];
    blockers: Blocker[];
    techDebt: TechDebtItem[];
  };
}

// Intelligent context summarization
class ContextSummarizer {
  async generateSummary(context: AIContext): Promise<ContextSummary> {
    return {
      // Executive summary for quick scanning
      tldr: this.generateTLDR(context),
      
      // Relevant code snippets with explanations
      codeContext: this.extractRelevantCode(context),
      
      // Visual representation of changes
      changeDiff: this.generateVisualDiff(context),
      
      // Priority items for next session
      nextSteps: this.prioritizeNextSteps(context),
      
      // Potential issues to watch
      warnings: this.analyzeRisks(context)
    };
  }

  private extractRelevantCode(context: AIContext): CodeContext[] {
    // Smart extraction of only the most relevant code
    // Based on: recent edits, high complexity, dependencies
    return context.codebase.workingFiles
      .map(file => ({
        path: file,
        relevantSections: this.findKeySection(file),
        explanation: this.explainChanges(file),
        dependencies: this.traceDependencies(file)
      }))
      .filter(ctx => ctx.relevantSections.length > 0);
  }
}

// Automated context collection
class ContextCollector {
  private gitClient: GitClient;
  private lspClient: LSPClient;
  private testRunner: TestRunner;

  async collectContext(): Promise<Partial<AIContext>> {
    const [gitInfo, codeInfo, testInfo] = await Promise.all([
      this.collectGitContext(),
      this.collectCodeContext(),
      this.collectTestContext()
    ]);

    return {
      codebase: {
        recentChanges: gitInfo.changes,
        workingFiles: codeInfo.openFiles,
        dependencies: codeInfo.dependencies,
        testCoverage: testInfo.coverage,
        buildStatus: testInfo.buildStatus
      }
    };
  }

  private async collectGitContext() {
    // Intelligent git analysis
    const changes = await this.gitClient.getRecentChanges({
      since: 'last-ai-session',
      includeContext: true, // Get surrounding code
      analyzeSemantic: true  // Understand what changed
    });

    return {
      changes: changes.map(change => ({
        ...change,
        impact: this.analyzeImpact(change),
        relatedFiles: this.findRelatedFiles(change)
      }))
    };
  }
}

// Enhanced SESSION.md generator with AI-optimized formatting
class SessionDocumentGenerator {
  async generateSessionDoc(context: AIContext): Promise<string> {
    const template = `# AI Development Session

## Quick Context (for AI Assistants)
\`\`\`yaml
session_id: ${context.session.id}
task: "${context.session.task}"
critical_context: |
  ${this.extractCriticalContext(context)}
working_on: [${context.codebase.workingFiles.join(', ')}]
last_error: ${this.getLastError(context)}
\`\`\`

## Human-Readable Summary
${this.generateHumanSummary(context)}

## Code State Snapshot
${this.generateCodeSnapshot(context)}

## Conversation Memory
${this.formatConversationHistory(context)}

## Next Session Should Start With
${this.generateStartScript(context)}
`;
    return template;
  }

  private generateCodeSnapshot(context: AIContext): string {
    // Include actual code snippets that matter
    return context.codebase.workingFiles
      .slice(0, 3) // Top 3 most relevant files
      .map(file => `
### ${file}
\`\`\`${this.getLanguage(file)}
${this.getRelevantSnippet(file, context)}
\`\`\`
${this.explainRecentChanges(file, context)}
`).join('\n');
  }

  private generateStartScript(context: AIContext): string {
    // Executable commands for quick start
    return `
\`\`\`bash
# Restore exact working state
git checkout ${context.session.id}-branch
code ${context.codebase.workingFiles.join(' ')}

# Run validation
npm test -- ${this.getRelevantTests(context).join(' ')}

# Check build
npm run build

# Resume at
cursor ${this.getLastEditLocation(context)}
\`\`\`
`;
  }
}