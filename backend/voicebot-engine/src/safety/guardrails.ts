/**
 * Safety guardrails for conversation content
 */

interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  category?: string;
}

// Profanity and inappropriate content detection
const PROFANITY_PATTERNS = [
  /\b(f+u+c+k|s+h+i+t|b+i+t+c+h|a+s+s+h+o+l+e|d+a+m+n)\b/gi,
  /\b(crap|hell|bastard)\b/gi,
];

// Prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions|rules|prompts)/gi,
  /system\s*:\s*you\s+are/gi,
  /forget\s+(everything|all|instructions)/gi,
  /new\s+instructions?\s*:/gi,
  /(act|behave|pretend)\s+as\s+if/gi,
  /disregard\s+(previous|all|above)/gi,
];

// Off-topic detection patterns
const OFF_TOPIC_PATTERNS = [
  /tell\s+me\s+(a\s+)?(joke|story)/gi,
  /what('s|\s+is)\s+the\s+weather/gi,
  /sing\s+a\s+song/gi,
  /write\s+(me\s+)?(a\s+)?(poem|code|program)/gi,
];

// Personal information requests (potential security risk)
const PERSONAL_INFO_PATTERNS = [
  /what('s|\s+is)\s+your\s+(password|credit\s+card|ssn|social\s+security)/gi,
  /tell\s+me\s+your\s+(password|credentials|login)/gi,
];

/**
 * Check if user input passes safety guardrails
 */
export function checkSafetyGuardrails(userInput: string): SafetyCheckResult {
  if (!userInput || typeof userInput !== 'string') {
    return { safe: true };
  }

  const input = userInput.toLowerCase();

  // Check for profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        reason: 'Inappropriate language detected',
        category: 'profanity',
      };
    }
  }

  // Check for prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        reason: 'Prompt injection attempt detected',
        category: 'prompt_injection',
      };
    }
  }

  // Check for personal information requests
  for (const pattern of PERSONAL_INFO_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        reason: 'Inappropriate personal information request',
        category: 'personal_info_request',
      };
    }
  }

  // Check for off-topic content (warning, not blocking)
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(input)) {
      console.warn('Off-topic content detected:', input);
      // Don't block, just log - LLM can handle redirecting
    }
  }

  return { safe: true };
}

/**
 * Sanitize bot response before sending
 */
export function sanitizeBotResponse(response: string): string {
  if (!response) return '';

  let sanitized = response;

  // Remove any potential HTML/script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  // Remove any markdown code blocks that might contain sensitive info
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '');

  // Remove potential system prompts that leaked
  sanitized = sanitized.replace(/System\s*:\s*.*$/gim, '');

  // Limit length to prevent excessive responses
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 997) + '...';
  }

  return sanitized.trim();
}

/**
 * Check if message contains PII (Personal Identifiable Information)
 */
export function detectPII(text: string): {
  hasPII: boolean;
  types: string[];
} {
  const types: string[] = [];

  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    types.push('email');
  }

  // Phone number
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
    types.push('phone');
  }

  // Credit card (simplified)
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    types.push('credit_card');
  }

  // SSN (US)
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    types.push('ssn');
  }

  return {
    hasPII: types.length > 0,
    types,
  };
}

/**
 * Rate limit check per user/session
 */
export class SafetyRateLimiter {
  private violations: Map<string, number[]> = new Map();
  private readonly maxViolations = 3;
  private readonly windowMs = 60000; // 1 minute

  recordViolation(sessionId: string): void {
    const now = Date.now();
    const violations = this.violations.get(sessionId) || [];

    // Remove old violations outside the window
    const recentViolations = violations.filter(time => now - time < this.windowMs);
    recentViolations.push(now);

    this.violations.set(sessionId, recentViolations);
  }

  isBlocked(sessionId: string): boolean {
    const now = Date.now();
    const violations = this.violations.get(sessionId) || [];

    // Count violations within the window
    const recentViolations = violations.filter(time => now - time < this.windowMs);

    return recentViolations.length >= this.maxViolations;
  }

  reset(sessionId: string): void {
    this.violations.delete(sessionId);
  }
}

/**
 * Content moderation using keyword scoring
 */
export function moderateContent(text: string): {
  score: number; // 0 (safe) to 1 (unsafe)
  flagged: boolean;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Check profanity (0.3 weight)
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      score += 0.3;
      reasons.push('profanity');
      break;
    }
  }

  // Check prompt injection (0.5 weight)
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      score += 0.5;
      reasons.push('prompt_injection');
      break;
    }
  }

  // Check personal info requests (0.4 weight)
  for (const pattern of PERSONAL_INFO_PATTERNS) {
    if (pattern.test(text)) {
      score += 0.4;
      reasons.push('personal_info_request');
      break;
    }
  }

  // Cap score at 1.0
  score = Math.min(score, 1.0);

  return {
    score,
    flagged: score >= 0.5,
    reasons,
  };
}
