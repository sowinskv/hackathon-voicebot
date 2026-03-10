import { EventEmitter } from 'events';
import { Flow } from '../db';
import { StateManager } from './state-manager';
import { SlotFiller } from './slot-filler';
import { transcribeAudio } from '../integrations/stt';
import { synthesizeSpeech } from '../integrations/tts';
import { generateResponse } from '../integrations/llm';
import { checkSafetyGuardrails } from '../safety/guardrails';
import { RateLimiter } from '../safety/limiter';
import { saveTranscript, updateSessionStatus, updateSessionCollectedData } from '../db';
import { CostTracker } from '../utils/cost-tracker';

export class ConversationEngine extends EventEmitter {
  private sessionId: string;
  private flow: Flow;
  private stateManager: StateManager;
  private slotFiller: SlotFiller;
  private rateLimiter: RateLimiter;
  private costTracker: CostTracker;
  private audioResponseCallback: (audioData: Buffer) => Promise<void>;
  private isActive: boolean = false;
  private startTime: Date;

  constructor(
    sessionId: string,
    flow: Flow,
    audioResponseCallback: (audioData: Buffer) => Promise<void>
  ) {
    super();
    this.sessionId = sessionId;
    this.flow = flow;
    this.audioResponseCallback = audioResponseCallback;
    this.stateManager = new StateManager(sessionId, flow);
    this.slotFiller = new SlotFiller(flow);
    this.rateLimiter = new RateLimiter(sessionId);
    this.costTracker = new CostTracker(sessionId);
    this.startTime = new Date();
  }

  async start(): Promise<void> {
    this.isActive = true;
    console.log(`Starting conversation for session ${this.sessionId}`);

    // Generate and send greeting
    const greeting = await this.generateGreeting();
    await this.sendBotMessage(greeting);

    await updateSessionStatus(this.sessionId, 'active');
  }

  private async generateGreeting(): Promise<string> {
    const context = {
      flow: this.flow,
      isGreeting: true,
    };

    const greeting = await generateResponse(
      '',
      this.flow.system_prompt,
      [],
      context
    );

    this.costTracker.trackLLMCall('gemini-2.5-flash', 0, greeting.length);

    return greeting;
  }

  async processUserAudio(audioBuffer: Buffer): Promise<void> {
    if (!this.isActive) return;

    try {
      // Check rate limits
      if (!this.rateLimiter.checkLimit()) {
        console.warn('Rate limit exceeded for session', this.sessionId);
        await this.handleRateLimitExceeded();
        return;
      }

      // Check time limit (10 minutes)
      const elapsed = Date.now() - this.startTime.getTime();
      if (elapsed > 10 * 60 * 1000) {
        console.warn('Time limit exceeded for session', this.sessionId);
        await this.handleTimeLimitExceeded();
        return;
      }

      // Transcribe audio
      const userText = await transcribeAudio(audioBuffer);
      console.log(`User said: ${userText}`);

      this.costTracker.trackSTTCall('azure-whisper', audioBuffer.length);

      // Save user transcript
      await saveTranscript({
        session_id: this.sessionId,
        speaker: 'user',
        text: userText,
        timestamp: new Date(),
      });

      // Process user input
      await this.processUserInput(userText);
    } catch (error) {
      console.error('Error processing user audio:', error);
      await this.sendBotMessage("I'm sorry, I didn't catch that. Could you please repeat?");
    }
  }

  private async processUserInput(userText: string): Promise<void> {
    // Add to conversation history
    this.stateManager.addUserMessage(userText);

    // Check safety guardrails
    const safetyCheck = checkSafetyGuardrails(userText);
    if (!safetyCheck.safe) {
      console.warn('Safety check failed:', safetyCheck.reason);
      await this.handleUnsafeContent(safetyCheck.reason);
      return;
    }

    // Check for escalation request
    if (this.detectEscalationRequest(userText)) {
      await this.handleEscalation();
      return;
    }

    // Extract and validate slots
    const extractedSlots = await this.slotFiller.extractSlots(
      userText,
      this.stateManager.getCollectedData(),
      this.stateManager.getConversationHistory()
    );

    // Update state with extracted slots
    for (const [slotName, value] of Object.entries(extractedSlots)) {
      this.stateManager.setSlot(slotName, value);
    }

    // Save collected data
    await updateSessionCollectedData(
      this.sessionId,
      this.stateManager.getCollectedData()
    );

    // Check if all required slots are filled
    if (this.stateManager.isComplete()) {
      await this.handleConversationComplete();
      return;
    }

    // Generate next response
    const nextSlot = this.slotFiller.getNextMissingSlot(
      this.stateManager.getCollectedData()
    );

    const response = await this.generateContextualResponse(nextSlot);
    await this.sendBotMessage(response);
  }

  private async generateContextualResponse(nextSlot: string | null): Promise<string> {
    const conversationHistory = this.stateManager.getConversationHistory();
    const collectedData = this.stateManager.getCollectedData();

    const context = {
      flow: this.flow,
      collectedData,
      nextSlot,
      conversationHistory: conversationHistory.slice(-10), // Last 10 messages
    };

    const response = await generateResponse(
      conversationHistory[conversationHistory.length - 1]?.content || '',
      this.flow.system_prompt,
      conversationHistory.slice(0, -1),
      context
    );

    this.costTracker.trackLLMCall(
      'gemini-2.5-flash',
      JSON.stringify(conversationHistory).length,
      response.length
    );

    return response;
  }

  private async sendBotMessage(text: string): Promise<void> {
    console.log(`Bot says: ${text}`);

    // Add to conversation history
    this.stateManager.addBotMessage(text);

    // Save bot transcript
    await saveTranscript({
      session_id: this.sessionId,
      speaker: 'bot',
      text,
      timestamp: new Date(),
    });

    // Convert to speech
    const audioData = await synthesizeSpeech(text);
    this.costTracker.trackTTSCall('elevenlabs', text.length);

    // Send audio to LiveKit
    await this.audioResponseCallback(audioData);
  }

  private detectEscalationRequest(text: string): boolean {
    const escalationPatterns = [
      /connect.*consultant/i,
      /speak.*human/i,
      /talk.*person/i,
      /transfer.*agent/i,
      /need.*help/i,
      /representative/i,
    ];

    return escalationPatterns.some(pattern => pattern.test(text));
  }

  private async handleEscalation(): Promise<void> {
    console.log('Escalation requested');
    await updateSessionStatus(this.sessionId, 'escalated', {
      reason: 'user_requested',
      collectedData: this.stateManager.getCollectedData(),
    });

    await this.sendBotMessage(
      "I understand you'd like to speak with a consultant. Let me connect you with someone who can help. Please hold for a moment."
    );

    this.emit('escalation');
    await this.end();
  }

  private async handleConversationComplete(): Promise<void> {
    console.log('Conversation complete, all slots filled');
    await updateSessionStatus(this.sessionId, 'completed', {
      collectedData: this.stateManager.getCollectedData(),
      costs: this.costTracker.getSummary(),
    });

    await this.sendBotMessage(
      "Thank you! I have all the information I need. A consultant will contact you shortly to discuss your requirements."
    );

    this.emit('complete');
    await this.end();
  }

  private async handleUnsafeContent(reason: string): Promise<void> {
    console.warn('Unsafe content detected:', reason);
    await this.sendBotMessage(
      "I apologize, but I need to keep our conversation professional. Could we please continue with your request?"
    );
  }

  private async handleRateLimitExceeded(): Promise<void> {
    await updateSessionStatus(this.sessionId, 'rate_limited');
    await this.sendBotMessage(
      "I'm sorry, but there have been too many requests. Please try again in a few moments."
    );
    await this.end();
  }

  private async handleTimeLimitExceeded(): Promise<void> {
    await updateSessionStatus(this.sessionId, 'timeout', {
      collectedData: this.stateManager.getCollectedData(),
    });
    await this.sendBotMessage(
      "I apologize, but our conversation time has expired. A consultant will reach out to you to continue."
    );
    await this.end();
  }

  async end(): Promise<void> {
    this.isActive = false;
    console.log(`Ending conversation for session ${this.sessionId}`);
    console.log('Cost summary:', this.costTracker.getSummary());
    this.emit('end');
  }
}
