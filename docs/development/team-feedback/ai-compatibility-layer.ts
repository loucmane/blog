// AI Assistant Compatibility Layer
interface AIAssistantAdapter {
  formatContext(context: AIContext): string;
  parseResponse(response: string): ParsedResponse;
  getOptimalPrompt(task: Task): string;
}

class ClaudeAdapter implements AIAssistantAdapter {
  formatContext(context: AIContext): string {
    // Claude-optimized context format
    return `
<context>
<working_files>
${context.codebase.workingFiles.map(f => `<file path="${f}">${this.getFileContent(f)}</file>`).join('\n')}
</working_files>

<recent_decisions>
${context.dialogue.keyDecisions.map(d => `- ${d.summary}: ${d.rationale}`).join('\n')}
</recent_decisions>

<current_task>${context.session.task}</current_task>
</context>

Based on the above context, continue development where the last session left off.
`;
  }

  getOptimalPrompt(task: Task): string {
    // Claude performs better with structured prompts
    return `
Analyze the current state and ${task.action}.

Structure your response as:
1. UNDERSTANDING: Confirm what was done previously
2. APPROACH: Explain your solution strategy  
3. IMPLEMENTATION: Provide the code changes
4. VERIFICATION: How to test the changes
`;
  }
}

class GPT4Adapter implements AIAssistantAdapter {
  formatContext(context: AIContext): string {
    // GPT-4 optimized format (more conversational)
    return `
You're continuing a development session. Here's what happened:

Previous developer worked on: ${context.session.task}
They modified these files: ${context.codebase.workingFiles.join(', ')}

Key decisions made:
${context.dialogue.keyDecisions.map(d => `• ${d.summary}`).join('\n')}

The code currently looks like this:
${this.formatCodeBlocks(context)}

Please continue from where they left off.
`;
  }
}

// Token-efficient context compression
class ContextCompressor {
  async compressForAI(
    context: AIContext, 
    maxTokens: number = 8000
  ): Promise<CompressedContext> {
    const prioritizer = new ContentPrioritizer();
    
    // Rank content by relevance
    const rankedContent = await prioritizer.rank({
      recentChanges: { weight: 0.3, content: context.codebase.recentChanges },
      activeCode: { weight: 0.4, content: context.codebase.workingFiles },
      decisions: { weight: 0.2, content: context.dialogue.keyDecisions },
      errors: { weight: 0.1, content: this.getRecentErrors(context) }
    });

    // Fit within token limit while preserving critical info
    return this.fitToTokenLimit(rankedContent, maxTokens);
  }

  private async fitToTokenLimit(
    content: RankedContent, 
    limit: number
  ): Promise<CompressedContext> {
    let tokens = 0;
    const included: any[] = [];

    for (const item of content) {
      const itemTokens = await this.estimateTokens(item);
      if (tokens + itemTokens <= limit) {
        included.push(item);
        tokens += itemTokens;
      } else {
        // Try to compress this item
        const compressed = await this.compressItem(item, limit - tokens);
        if (compressed) {
          included.push(compressed);
          break;
        }
      }
    }

    return { content: included, tokenCount: tokens };
  }
}