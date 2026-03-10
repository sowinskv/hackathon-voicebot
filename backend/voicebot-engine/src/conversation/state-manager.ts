import { Flow, FlowSlot } from '../db';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class StateManager {
  private sessionId: string;
  private flow: Flow;
  private collectedData: Record<string, any> = {};
  private conversationHistory: ConversationMessage[] = [];
  private slotStatuses: Map<string, 'empty' | 'partial' | 'complete'> = new Map();

  constructor(sessionId: string, flow: Flow) {
    this.sessionId = sessionId;
    this.flow = flow;

    // Initialize slot statuses
    for (const slot of flow.slots) {
      this.slotStatuses.set(slot.name, 'empty');
    }
  }

  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });
  }

  addBotMessage(content: string): void {
    this.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
  }

  setSlot(slotName: string, value: any): void {
    const slot = this.flow.slots.find(s => s.name === slotName);
    if (!slot) {
      console.warn(`Unknown slot: ${slotName}`);
      return;
    }

    // Validate slot value
    if (this.validateSlot(slot, value)) {
      this.collectedData[slotName] = value;
      this.slotStatuses.set(slotName, 'complete');
      console.log(`Slot filled: ${slotName} = ${JSON.stringify(value)}`);
    } else {
      console.warn(`Invalid value for slot ${slotName}: ${value}`);
      this.slotStatuses.set(slotName, 'partial');
    }
  }

  private validateSlot(slot: FlowSlot, value: any): boolean {
    if (!value) return false;

    // Type validation
    switch (slot.type) {
      case 'string':
        if (typeof value !== 'string') return false;
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) return false;
        break;
      case 'date':
        if (isNaN(Date.parse(value))) return false;
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return false;
        break;
      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
        if (!phoneRegex.test(value)) return false;
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') return false;
        break;
    }

    // Custom validation regex if provided
    if (slot.validation) {
      try {
        const regex = new RegExp(slot.validation);
        if (!regex.test(String(value))) return false;
      } catch (error) {
        console.error(`Invalid validation regex for slot ${slot.name}:`, error);
      }
    }

    return true;
  }

  getSlotStatus(slotName: string): 'empty' | 'partial' | 'complete' {
    return this.slotStatuses.get(slotName) || 'empty';
  }

  getCollectedData(): Record<string, any> {
    return { ...this.collectedData };
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  isComplete(): boolean {
    // Check if all required slots are filled
    for (const slot of this.flow.slots) {
      if (slot.required && !this.collectedData[slot.name]) {
        return false;
      }
    }
    return true;
  }

  getMissingRequiredSlots(): FlowSlot[] {
    return this.flow.slots.filter(
      slot => slot.required && !this.collectedData[slot.name]
    );
  }

  getCompletionPercentage(): number {
    const totalRequired = this.flow.slots.filter(s => s.required).length;
    if (totalRequired === 0) return 100;

    const filled = this.flow.slots.filter(
      s => s.required && this.collectedData[s.name]
    ).length;

    return Math.round((filled / totalRequired) * 100);
  }

  getSessionState(): {
    sessionId: string;
    flowId: string;
    completionPercentage: number;
    collectedData: Record<string, any>;
    missingSlots: string[];
    conversationLength: number;
  } {
    return {
      sessionId: this.sessionId,
      flowId: this.flow.id,
      completionPercentage: this.getCompletionPercentage(),
      collectedData: this.getCollectedData(),
      missingSlots: this.getMissingRequiredSlots().map(s => s.name),
      conversationLength: this.conversationHistory.length,
    };
  }
}
