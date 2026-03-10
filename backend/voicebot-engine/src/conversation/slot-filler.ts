import { Flow, FlowSlot } from '../db';
import { generateResponse } from '../integrations/llm';
import { ConversationMessage } from './state-manager';

export class SlotFiller {
  private flow: Flow;

  constructor(flow: Flow) {
    this.flow = flow;
  }

  async extractSlots(
    userInput: string,
    currentData: Record<string, any>,
    conversationHistory: ConversationMessage[]
  ): Promise<Record<string, any>> {
    const extractedSlots: Record<string, any> = {};

    // Build context for LLM extraction
    const slotsToExtract = this.flow.slots.filter(
      slot => !currentData[slot.name]
    );

    if (slotsToExtract.length === 0) {
      return extractedSlots;
    }

    // Use LLM to extract slot values from user input
    const extractionPrompt = this.buildExtractionPrompt(
      userInput,
      slotsToExtract,
      conversationHistory
    );

    try {
      const response = await generateResponse(
        extractionPrompt,
        'You are a data extraction assistant. Extract structured information from user messages.',
        [],
        { extractionMode: true }
      );

      // Parse LLM response (expected JSON format)
      const extracted = this.parseExtractionResponse(response);

      // Validate and add extracted slots
      for (const [slotName, value] of Object.entries(extracted)) {
        const slot = this.flow.slots.find(s => s.name === slotName);
        if (slot && value) {
          extractedSlots[slotName] = this.normalizeSlotValue(slot, value);
        }
      }
    } catch (error) {
      console.error('Error extracting slots:', error);
    }

    return extractedSlots;
  }

  private buildExtractionPrompt(
    userInput: string,
    slots: FlowSlot[],
    history: ConversationMessage[]
  ): string {
    const contextMessages = history.slice(-6); // Last 3 exchanges
    const context = contextMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const slotDescriptions = slots
      .map(
        slot =>
          `- ${slot.name} (${slot.type}): ${slot.description}${slot.required ? ' [REQUIRED]' : ''}`
      )
      .join('\n');

    return `Extract the following information from the user's message:

Slots to extract:
${slotDescriptions}

Conversation context:
${context}

User's latest message: "${userInput}"

Return a JSON object with the extracted values. Only include slots that you can confidently extract from the message. Use null for slots that are not mentioned.

Example format:
{
  "slot_name_1": "extracted value",
  "slot_name_2": null
}

JSON:`;
  }

  private parseExtractionResponse(response: string): Record<string, any> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return {};
    }
  }

  private normalizeSlotValue(slot: FlowSlot, value: any): any {
    if (!value) return null;

    switch (slot.type) {
      case 'string':
        return String(value).trim();

      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;

      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        } catch {
          return null;
        }

      case 'email':
        return String(value).trim().toLowerCase();

      case 'phone':
        // Normalize phone number (remove spaces, dashes)
        return String(value).replace(/[\s\-\(\)]/g, '');

      case 'boolean':
        if (typeof value === 'boolean') return value;
        const lower = String(value).toLowerCase();
        if (lower === 'true' || lower === 'yes' || lower === '1') return true;
        if (lower === 'false' || lower === 'no' || lower === '0') return false;
        return null;

      case 'array':
        return Array.isArray(value) ? value : [value];

      default:
        return value;
    }
  }

  getNextMissingSlot(currentData: Record<string, any>): string | null {
    // Return the next required slot that hasn't been filled
    for (const slot of this.flow.slots) {
      if (slot.required && !currentData[slot.name]) {
        return slot.name;
      }
    }

    // If all required slots are filled, return first optional missing slot
    for (const slot of this.flow.slots) {
      if (!slot.required && !currentData[slot.name]) {
        return slot.name;
      }
    }

    return null;
  }

  getSlotPrompt(slotName: string): string {
    const slot = this.flow.slots.find(s => s.name === slotName);
    if (!slot) return '';

    // Use custom prompt if provided, otherwise generate one
    if (slot.prompt) {
      return slot.prompt;
    }

    // Generate default prompt based on slot type and description
    return this.generateDefaultPrompt(slot);
  }

  private generateDefaultPrompt(slot: FlowSlot): string {
    const prompts: Record<string, string> = {
      string: `Could you please provide your ${slot.description}?`,
      number: `What is your ${slot.description}?`,
      date: `When is your ${slot.description}?`,
      email: `What's your email address?`,
      phone: `What's your phone number?`,
      boolean: `${slot.description}? (Yes or No)`,
      array: `Please list your ${slot.description}.`,
    };

    return prompts[slot.type] || `Please provide your ${slot.description}.`;
  }

  validateAllSlots(data: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const slot of this.flow.slots) {
      if (slot.required && !data[slot.name]) {
        errors.push(`Missing required field: ${slot.name}`);
        continue;
      }

      const value = data[slot.name];
      if (value && !this.validateSlotValue(slot, value)) {
        errors.push(`Invalid value for ${slot.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateSlotValue(slot: FlowSlot, value: any): boolean {
    // Same validation logic as in state-manager
    switch (slot.type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[\d\s\-\+\(\)]{7,}$/.test(value);
      case 'number':
        return !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }
}
