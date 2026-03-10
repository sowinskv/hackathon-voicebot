/**
 * Track API usage and costs for the voicebot session
 */

interface CostConfig {
  stt: {
    azure_whisper: number; // Cost per second
  };
  tts: {
    elevenlabs: number; // Cost per character
  };
  llm: {
    gemini_2_5_flash_input: number; // Cost per 1M tokens
    gemini_2_5_flash_output: number; // Cost per 1M tokens
  };
}

// Approximate pricing (update with actual prices)
const DEFAULT_COSTS: CostConfig = {
  stt: {
    azure_whisper: 0.0001, // $0.006 per minute = $0.0001 per second
  },
  tts: {
    elevenlabs: 0.00003, // Approximately $0.30 per 1M characters
  },
  llm: {
    gemini_2_5_flash_input: 0.075, // $0.075 per 1M tokens
    gemini_2_5_flash_output: 0.30, // $0.30 per 1M tokens
  },
};

interface UsageMetrics {
  stt: {
    calls: number;
    totalSeconds: number;
    cost: number;
  };
  tts: {
    calls: number;
    totalCharacters: number;
    cost: number;
  };
  llm: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  total: {
    calls: number;
    cost: number;
  };
}

export class CostTracker {
  private sessionId: string;
  private costs: CostConfig;
  private metrics: UsageMetrics;
  private startTime: Date;

  constructor(sessionId: string, customCosts?: Partial<CostConfig>) {
    this.sessionId = sessionId;
    this.costs = { ...DEFAULT_COSTS, ...customCosts };
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): UsageMetrics {
    return {
      stt: {
        calls: 0,
        totalSeconds: 0,
        cost: 0,
      },
      tts: {
        calls: 0,
        totalCharacters: 0,
        cost: 0,
      },
      llm: {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      },
      total: {
        calls: 0,
        cost: 0,
      },
    };
  }

  /**
   * Track STT API call
   */
  trackSTTCall(provider: 'azure-whisper', audioLengthBytes: number): void {
    // Estimate duration from audio length (assuming 16-bit PCM, 16kHz)
    // 16kHz * 2 bytes = 32000 bytes per second
    const estimatedSeconds = audioLengthBytes / 32000;

    const cost = estimatedSeconds * this.costs.stt.azure_whisper;

    this.metrics.stt.calls++;
    this.metrics.stt.totalSeconds += estimatedSeconds;
    this.metrics.stt.cost += cost;
    this.metrics.total.calls++;
    this.metrics.total.cost += cost;

    console.log(`STT Call: ${estimatedSeconds.toFixed(2)}s, Cost: $${cost.toFixed(6)}`);
  }

  /**
   * Track TTS API call
   */
  trackTTSCall(provider: 'elevenlabs', characterCount: number): void {
    const cost = characterCount * this.costs.tts.elevenlabs;

    this.metrics.tts.calls++;
    this.metrics.tts.totalCharacters += characterCount;
    this.metrics.tts.cost += cost;
    this.metrics.total.calls++;
    this.metrics.total.cost += cost;

    console.log(`TTS Call: ${characterCount} chars, Cost: $${cost.toFixed(6)}`);
  }

  /**
   * Track LLM API call
   */
  trackLLMCall(
    model: 'gemini-2.5-flash',
    inputTokens: number,
    outputTokens: number
  ): void {
    // Estimate tokens from character count (rough: 1 token ≈ 4 characters)
    const estimatedInputTokens = typeof inputTokens === 'number' ? inputTokens : Math.ceil(inputTokens / 4);
    const estimatedOutputTokens = typeof outputTokens === 'number' ? outputTokens : Math.ceil(outputTokens / 4);

    const inputCost = (estimatedInputTokens / 1000000) * this.costs.llm.gemini_2_5_flash_input;
    const outputCost = (estimatedOutputTokens / 1000000) * this.costs.llm.gemini_2_5_flash_output;
    const totalLLMCost = inputCost + outputCost;

    this.metrics.llm.calls++;
    this.metrics.llm.inputTokens += estimatedInputTokens;
    this.metrics.llm.outputTokens += estimatedOutputTokens;
    this.metrics.llm.inputCost += inputCost;
    this.metrics.llm.outputCost += outputCost;
    this.metrics.llm.totalCost += totalLLMCost;
    this.metrics.total.calls++;
    this.metrics.total.cost += totalLLMCost;

    console.log(
      `LLM Call: ${estimatedInputTokens} in / ${estimatedOutputTokens} out, Cost: $${totalLLMCost.toFixed(6)}`
    );
  }

  /**
   * Get current cost summary
   */
  getSummary(): {
    sessionId: string;
    duration: number;
    metrics: UsageMetrics;
    costPerMinute: number;
  } {
    const duration = Date.now() - this.startTime.getTime();
    const minutes = duration / 60000;
    const costPerMinute = minutes > 0 ? this.metrics.total.cost / minutes : 0;

    return {
      sessionId: this.sessionId,
      duration,
      metrics: this.metrics,
      costPerMinute,
    };
  }

  /**
   * Get detailed breakdown
   */
  getDetailedBreakdown(): {
    stt: { calls: number; seconds: number; cost: number; percentage: number };
    tts: { calls: number; characters: number; cost: number; percentage: number };
    llm: {
      calls: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
      percentage: number;
    };
    total: { cost: number; calls: number };
  } {
    const totalCost = this.metrics.total.cost || 0.000001; // Avoid division by zero

    return {
      stt: {
        calls: this.metrics.stt.calls,
        seconds: this.metrics.stt.totalSeconds,
        cost: this.metrics.stt.cost,
        percentage: (this.metrics.stt.cost / totalCost) * 100,
      },
      tts: {
        calls: this.metrics.tts.calls,
        characters: this.metrics.tts.totalCharacters,
        cost: this.metrics.tts.cost,
        percentage: (this.metrics.tts.cost / totalCost) * 100,
      },
      llm: {
        calls: this.metrics.llm.calls,
        inputTokens: this.metrics.llm.inputTokens,
        outputTokens: this.metrics.llm.outputTokens,
        cost: this.metrics.llm.totalCost,
        percentage: (this.metrics.llm.totalCost / totalCost) * 100,
      },
      total: {
        cost: this.metrics.total.cost,
        calls: this.metrics.total.calls,
      },
    };
  }

  /**
   * Log cost summary to console
   */
  logSummary(): void {
    const summary = this.getSummary();
    const breakdown = this.getDetailedBreakdown();

    console.log('\n========== Cost Summary ==========');
    console.log(`Session: ${this.sessionId}`);
    console.log(`Duration: ${(summary.duration / 60000).toFixed(2)} minutes`);
    console.log(`\nSTT (${breakdown.stt.percentage.toFixed(1)}%):`);
    console.log(`  - Calls: ${breakdown.stt.calls}`);
    console.log(`  - Seconds: ${breakdown.stt.seconds.toFixed(2)}`);
    console.log(`  - Cost: $${breakdown.stt.cost.toFixed(6)}`);
    console.log(`\nTTS (${breakdown.tts.percentage.toFixed(1)}%):`);
    console.log(`  - Calls: ${breakdown.tts.calls}`);
    console.log(`  - Characters: ${breakdown.tts.characters}`);
    console.log(`  - Cost: $${breakdown.tts.cost.toFixed(6)}`);
    console.log(`\nLLM (${breakdown.llm.percentage.toFixed(1)}%):`);
    console.log(`  - Calls: ${breakdown.llm.calls}`);
    console.log(`  - Input tokens: ${breakdown.llm.inputTokens}`);
    console.log(`  - Output tokens: ${breakdown.llm.outputTokens}`);
    console.log(`  - Cost: $${breakdown.llm.cost.toFixed(6)}`);
    console.log(`\nTotal Cost: $${breakdown.total.cost.toFixed(6)}`);
    console.log(`Cost per minute: $${summary.costPerMinute.toFixed(6)}`);
    console.log('==================================\n');
  }

  /**
   * Check if cost threshold exceeded
   */
  checkCostThreshold(thresholdDollars: number): boolean {
    return this.metrics.total.cost >= thresholdDollars;
  }

  /**
   * Estimate remaining cost based on average
   */
  estimateRemainingCost(remainingMinutes: number): number {
    const summary = this.getSummary();
    return summary.costPerMinute * remainingMinutes;
  }
}

/**
 * Aggregate cost tracking across multiple sessions
 */
export class AggregateCostTracker {
  private sessions: Map<string, CostTracker> = new Map();

  addSession(sessionId: string, tracker: CostTracker): void {
    this.sessions.set(sessionId, tracker);
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getTotalCost(): number {
    let total = 0;
    for (const tracker of this.sessions.values()) {
      total += tracker.getSummary().metrics.total.cost;
    }
    return total;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getAverageCostPerSession(): number {
    const count = this.getSessionCount();
    return count > 0 ? this.getTotalCost() / count : 0;
  }
}
