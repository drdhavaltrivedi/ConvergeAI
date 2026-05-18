import { config } from '../config/env';

export interface VapiCallParameters {
  customerPhoneNumber: string;
  assistantId?: string;
  customGreeting?: string;
  clientTwilioNumber?: string;
}

export interface VapiCallResponse {
  id: string;
  status: string;
  customerNumber: string;
}

export class VapiService {
  private apiKey: string;
  private defaultAssistantId: string;

  constructor() {
    this.apiKey = config.VAPI_API_KEY;
    this.defaultAssistantId = config.VAPI_ASSISTANT_ID;
  }

  /**
   * Dispatches a live voice call-back to a lead who recently missed an inbound attempt.
   */
  async triggerOutboundCall(params: VapiCallParameters): Promise<VapiCallResponse> {
    const assistantId = params.assistantId || this.defaultAssistantId;

    if (this.apiKey.startsWith('MOCK_')) {
      console.log(`[MOCK VAPI] Dispatching Voice Call-back to ${params.customerPhoneNumber}...`);
      console.log(`[MOCK VAPI] Connecting Vapi Assistant: ${assistantId}`);
      if (params.customGreeting) {
        console.log(`[MOCK VAPI] Greeting override active: "${params.customGreeting}"`);
      }
      return {
        id: `vapi_call_${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'queued',
        customerNumber: params.customerPhoneNumber
      };
    }

    try {
      // Direct integration with the Vapi.ai /call/phone endpoint
      const response = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistantId,
          customer: {
            number: params.customerPhoneNumber,
          },
          phoneNumber: {
            // Incorporating BYOT twilio configuration if provided, falling back to vapi managed lines
            number: params.clientTwilioNumber || undefined,
          },
          assistantOverrides: params.customGreeting ? {
            firstMessage: params.customGreeting
          } : undefined
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vapi Outbound Trigger failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      return {
        id: data.id,
        status: data.status,
        customerNumber: data.customer?.number || params.customerPhoneNumber
      };
    } catch (error) {
      console.error('[VAPI SERVICE ERROR] Failed to dispatch voice agent:', error);
      throw error;
    }
  }

  /**
   * Generates custom opening remarks to build rapport immediately.
   */
  generateClinicGreeting(businessName: string, firstName?: string): string {
    const greetingName = firstName ? ` ${firstName}` : '';
    return `Hey${greetingName}! This is Sarah, the AI coordinator for ${businessName}. I noticed we just missed a call from you a few seconds ago and wanted to ring you right back. Are you looking to book a consultation slot today, or did you have a quick question?`;
  }

  /**
   * Generates emergency contractor dispatch opening remarks.
   */
  generateHvacGreeting(businessName: string): string {
    return `Hi, thanks for calling ${businessName} emergency dispatch. I noticed we missed your ring. If you are experiencing a heating, cooling, or plumbing emergency, I can secure a certified technician and dispatch them to your address immediately. Are you needing urgent technician dispatch, or is this a standard system check?`;
  }
}
