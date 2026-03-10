import {
  FlowNode,
  BranchConfig,
  BranchCondition,
  BranchDetectionResult,
  SessionContext,
} from '../../../shared-types/src';

/**
 * Service for detecting which branch to take based on user input
 * Uses keyword matching for MVP, can be upgraded to ML-based detection
 */
export class BranchDetectionService {
  /**
   * Detect which branch to take based on user input
   */
  async detectBranch(
    node: FlowNode,
    userInput: string,
    sessionContext: Partial<SessionContext>
  ): Promise<BranchDetectionResult> {
    const branches = node.data.branches || [];

    if (branches.length === 0) {
      return {
        selected_branch: null,
        confidence: 0,
        action: 'reprompt',
      };
    }

    // Score each branch
    const scores = await Promise.all(
      branches.map(async (branch) => {
        const score = await this.evaluateBranch(branch, userInput);
        return {
          branch_id: branch.id,
          score: score.confidence,
          branch,
        };
      })
    );

    // Sort by confidence (highest first)
    scores.sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];
    const secondBest = scores[1];

    // High confidence - clear winner
    if (bestMatch.score > 0.8) {
      return {
        selected_branch: bestMatch.branch_id,
        confidence: bestMatch.score,
        action: 'proceed',
        branch_scores: scores.map(({ branch_id, score }) => ({ branch_id, score })),
      };
    }

    // Medium confidence - but significantly better than others
    if (bestMatch.score > 0.5 && (!secondBest || bestMatch.score - secondBest.score > 0.3)) {
      return {
        selected_branch: bestMatch.branch_id,
        confidence: bestMatch.score,
        action: 'proceed',
        branch_scores: scores.map(({ branch_id, score }) => ({ branch_id, score })),
      };
    }

    // Ambiguous - need clarification
    if (bestMatch.score > 0.3) {
      const topBranches = scores.filter(s => s.score > 0.3).slice(0, 3);
      return {
        selected_branch: null,
        confidence: bestMatch.score,
        action: 'clarify',
        clarification_prompt: this.generateClarificationPrompt(topBranches.map(s => s.branch)),
        branch_scores: scores.map(({ branch_id, score }) => ({ branch_id, score })),
      };
    }

    // Low confidence - re-prompt
    return {
      selected_branch: null,
      confidence: bestMatch.score,
      action: 'reprompt',
      branch_scores: scores.map(({ branch_id, score }) => ({ branch_id, score })),
    };
  }

  /**
   * Evaluate a single branch against user input
   * Returns confidence score (0-1)
   */
  private async evaluateBranch(
    branch: BranchConfig,
    userInput: string
  ): Promise<{ confidence: number }> {
    const conditions = branch.conditions;

    if (conditions.length === 0) {
      return { confidence: 0 };
    }

    const userInputLower = userInput.toLowerCase();
    let totalScore = 0;
    let conditionsEvaluated = 0;

    for (const condition of conditions) {
      const score = this.evaluateCondition(condition, userInputLower);

      // Handle logic operators
      if (condition.logic === 'or') {
        // For OR logic, if any condition matches well, boost the score
        totalScore = Math.max(totalScore, score);
      } else {
        // Default to AND logic - all conditions must match
        totalScore += score;
      }

      conditionsEvaluated++;
    }

    // Average score across conditions (for AND logic)
    // For OR logic, we already took the max
    const finalScore = conditions.some(c => c.logic === 'or')
      ? totalScore
      : totalScore / conditionsEvaluated;

    return { confidence: Math.min(finalScore, 1.0) };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: BranchCondition, userInputLower: string): number {
    const { operator, value } = condition;

    switch (operator) {
      case 'contains': {
        // Split by pipe for OR matching of keywords
        const keywords = String(value).toLowerCase().split('|').map(k => k.trim());
        const matches = keywords.filter(keyword => userInputLower.includes(keyword));
        return matches.length / keywords.length;
      }

      case 'not_contains': {
        const keywords = String(value).toLowerCase().split('|').map(k => k.trim());
        const matches = keywords.filter(keyword => !userInputLower.includes(keyword));
        return matches.length / keywords.length;
      }

      case 'equals': {
        const valueLower = String(value).toLowerCase();
        return userInputLower === valueLower ? 1.0 : 0.0;
      }

      case 'not_equals': {
        const valueLower = String(value).toLowerCase();
        return userInputLower !== valueLower ? 1.0 : 0.0;
      }

      default:
        return 0;
    }
  }

  /**
   * Generate a clarification prompt when multiple branches match
   */
  private generateClarificationPrompt(branches: BranchConfig[]): string {
    if (branches.length === 0) {
      return "I'm not sure I understand. Could you please clarify what you need help with?";
    }

    const branchNames = branches.map(b => b.name).join(', or ');
    return `I want to make sure I help you with the right thing. Are you asking about ${branchNames}?`;
  }

  /**
   * Find a branch by ID in the branches array
   */
  findBranchById(branches: BranchConfig[], branchId: string): BranchConfig | null {
    for (const branch of branches) {
      if (branch.id === branchId) {
        return branch;
      }
      // Check nested branches
      if (branch.sub_branches) {
        const found = this.findBranchById(branch.sub_branches, branchId);
        if (found) return found;
      }
    }
    return null;
  }
}
