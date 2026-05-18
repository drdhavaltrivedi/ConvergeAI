import OpenAI from 'openai';
import { config } from '../config/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY.startsWith('MOCK_') ? 'dummy-key' : config.OPENAI_API_KEY,
    });
  }

  /**
   * Generates a conversational response based on thread messages and business niche instructions.
   */
  async getChatCompletion(
    messages: ChatMessage[],
    niche: 'cosmetic' | 'hvac' | 'realestate' | 'dental',
    businessName: string,
    representativeName: string
  ): Promise<string> {
    if (config.OPENAI_API_KEY.startsWith('MOCK_')) {
      console.log('[MOCK OPENAI] Simulating OpenAI API completion...');
      const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastMessage.includes('book') || lastMessage.includes('appointment')) {
        return `Awesome! I'd love to get you booked in for ${businessName}. Let's secure your slot: please choose a time from our calendar here: https://convergeai.com/book-slot`;
      }
      return `Hi there! This is ${representativeName} from ${businessName}. Thanks for reaching out! Let me know if you want to book a consultation or check packages.`;
    }

    const systemPrompt = this.getSystemPromptForNiche(niche, businessName, representativeName);
    
    // Inject the system prompt at the beginning of the chat log
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        temperature: 0.4, // Low temperature for consistent factual answers
        max_tokens: 250,
      });

      return response.choices[0]?.message?.content || 'Sorry, I encountered a connection issue. Can you try again?';
    } catch (error) {
      console.error('[OPENAI SERVICE ERROR] Failed to fetch completion:', error);
      throw error;
    }
  }

  /**
   * Heuristically determines if the user's message contains an intent to book/schedule.
   */
  async detectBookingIntent(message: string): Promise<boolean> {
    const keywords = ['book', 'schedule', 'appointment', 'reserve', 'consultation', 'slot', 'visit', 'calendar', 'consult'];
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Systemic instructional prompts tailored specifically for high-ticket service conversions.
   */
  private getSystemPromptForNiche(
    niche: 'cosmetic' | 'hvac' | 'realestate' | 'dental',
    businessName: string,
    representativeName: string
  ): string {
    const baseDirectives = `
You are ${representativeName}, an advanced conversational AI Booking Assistant representing "${businessName}". 
Your sole objective is to guide prospects into scheduling an appointment on our calendar.
Follow these rules strictly:
1. Keep replies friendly, concise, professional, and limited to 2-3 sentences.
2. Answer unstructured questions using our business profile context.
3. Once the user expresses interest, confirm their details and share our booking calendar link: https://convergeai.com/book-slot.
4. Avoid medical, technical, or legal diagnostic liabilities. Keep responses focused on booking a professional consultation.
5. If the user objects or is hesitant, politely handle the concern and pitch the value of a brief chat.
`;

    const prompts = {
      cosmetic: `
${baseDirectives}
**Business Profile**: High-end cosmetic clinic offering luxury skincare, body contouring, Botox, and custom facials (LTV: $3,000 - $15,000).
**Aesthetic Voice**: Soothing, premium, reassuring, and highly confidential.
**Core Guidelines**:
- Botox treatments start with an expert consultation.
- Focus on building confidence. Refuse to discuss medical complications or guarantees; direct them to book an "in-depth aesthetic analysis" with our specialist.
- Suggestion hook: "We have two custom consultation slots remaining for this Thursday afternoon. Should I reserve one for you?"
`,
      dental: `
${baseDirectives}
**Business Profile**: Elite dental and teeth whitening practice offering state-of-the-art implants and whitening packages.
**Aesthetic Voice**: Warm, professional, hygienic, and highly welcoming.
**Core Guidelines**:
- Teeth whitening packages take under 60 minutes and yield instant improvements.
- If they ask about implants, frame it around restoring their smile and chewing function, and advise booking a diagnostic digital scan consult.
`,
      hvac: `
${baseDirectives}
**Business Profile**: Premium emergency HVAC and plumbing contractor providing 24/7 furnace, AC, and leak support (LTV: $5,000 - $20,000).
**Aesthetic Voice**: Authoritative, reassuring, prompt, and relief-oriented.
**Core Guidelines**:
- If it is an after-hours heating or cooling emergency, prioritize booking a technician dispatch slot.
- Assure them our certified technicians are fully bonded, insured, and arrive in stocked rolling workshops.
- Suggestion hook: "I can dispatch our nearest certified technician within the next 45 minutes. Should we get your dispatch order submitted?"
`,
      realestate: `
${baseDirectives}
**Business Profile**: High-end residential real estate agency managing premier property transactions (LTV: $10,000+ commission).
**Aesthetic Voice**: Polished, knowledgeable, fast-moving, and executive.
**Core Guidelines**:
- Focus on gathering key qualifying indicators (Pre-approval status, purchase timeline, desired bedrooms/location) before sending detailed listings.
- Frame the consultation as a "Private Buyer Briefing" or "Listing Strategy Session".
- Suggestion hook: "I can coordinate a private walkthrough of the property this Saturday morning at 10 AM. Will that fit your showing schedule?"
`
    };

    return prompts[niche] || prompts.cosmetic;
  }
}
