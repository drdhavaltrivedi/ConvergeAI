import { Request, Response } from 'express';
import { GHLService } from '../services/ghl.service';
import { OpenAIService, ChatMessage } from '../services/openai.service';
import { VapiService } from '../services/vapi.service';

const ghlService = new GHLService();
const openaiService = new OpenAIService();
const vapiService = new VapiService();

// In-memory conversation state tracer (In production, replace with Redis or MongoDB)
const chatSessions: Record<string, ChatMessage[]> = {};

export class GHLWebhookController {
  /**
   * Captures unanswered phone call events from GoHighLevel workflows.
   */
  async handleMissedCall(req: Request, res: Response): Promise<void> {
    try {
      const { phone, firstName, businessName, tier, niche } = req.body;

      if (!phone) {
        res.status(400).json({ error: 'Missing parameter: phone' });
        return;
      }

      const activeNiche = niche || 'cosmetic';
      const activeTier = tier || 'tier2'; // Defaulting to Tier 2 (Conversational SMS)
      const bizName = businessName || 'Our Clinic';

      console.log(`[GHL WEBHOOK] Captured Missed Call event. Lead: ${firstName || 'Guest'} (${phone}). Tier: ${activeTier}`);

      // Step 1: Guarantee the contact is enrolled in the GHL sub-account CRM
      const contact = await ghlService.createOrUpdateContact({
        firstName: firstName || 'Missed Call Lead',
        phone,
        companyName: bizName
      });

      await ghlService.addNoteToContact(contact.id, `[System Notice] Captured Missed Call. Instantiating automation for Tier: ${activeTier}`);

      // Step 2: Route actions depending on subscription tier
      if (activeTier === 'tier3') {
        // TIER 3: Trigger instantaneous voice receptionist callback
        const customGreeting = activeNiche === 'hvac' 
          ? vapiService.generateHvacGreeting(bizName)
          : vapiService.generateClinicGreeting(bizName, firstName);

        console.log(`[TIER 3] Dispatching Voice Receptionist call-back to ${phone}...`);
        const call = await vapiService.triggerOutboundCall({
          customerPhoneNumber: phone,
          customGreeting
        });

        await ghlService.addNoteToContact(contact.id, `[Vapi Voice Dispatch] Triggered Outbound Call ID: ${call.id}`);
        res.status(200).json({ message: 'Vapi Call-back Dispatched', callId: call.id });
      } else {
        // TIER 1 & 2: Initiate automated conversational text-back response
        const defaultText = `Hey, sorry we missed your call. We are currently helping another client. How can we help you book your slot today?`;
        
        console.log(`[TIER 1/2] Sending initial text-back to ${phone}...`);
        // Initializing conversation log
        chatSessions[phone] = [
          { role: 'assistant', content: defaultText }
        ];

        // In a live GHL instance, we call GHL's messaging send API or let GHL workflow handle the initial SMS.
        await ghlService.addNoteToContact(contact.id, `[SMS Text-back Initiated] Sent: "${defaultText}"`);
        res.status(200).json({ message: 'SMS Text-back initiated', sms: defaultText });
      }
    } catch (error: any) {
      console.error('[GHL WEBHOOK ERROR] handleMissedCall failed:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Captures incoming client text responses to guide them into booking calendar slots.
   */
  async handleIncomingSMS(req: Request, res: Response): Promise<void> {
    try {
      const { phone, message, firstName, businessName, representativeName, niche } = req.body;

      if (!phone || !message) {
        res.status(400).json({ error: 'Missing parameters: phone and message' });
        return;
      }

      const activeNiche = niche || 'cosmetic';
      const bizName = businessName || 'Aesthetic Spa';
      const repName = representativeName || 'Sarah';

      console.log(`[GHL WEBHOOK] Incoming SMS from ${phone}: "${message}"`);

      // Initialize session thread if empty
      if (!chatSessions[phone]) {
        chatSessions[phone] = [];
      }

      // Append user's incoming message
      chatSessions[phone].push({ role: 'user', content: message });

      // Run OpenAI to determine response
      const responseText = await openaiService.getChatCompletion(
        chatSessions[phone],
        activeNiche,
        bizName,
        repName
      );

      // Append assistant's drafted reply to local session
      chatSessions[phone].push({ role: 'assistant', content: responseText });

      // Detect if user has booking intent (triggers pipeline updates)
      const wantsToBook = await openaiService.detectBookingIntent(message);
      if (wantsToBook) {
        console.log(`[INTENT DETECTED] Lead ${phone} wants to book. Moving pipeline to booking stage...`);
        // Fetch contact ID first
        const contact = await ghlService.createOrUpdateContact({
          firstName: firstName || 'Lead',
          phone,
          companyName: bizName
        });
        
        // Move to 'Booking Requested' opportunity pipeline stage (MOCK IDs used here)
        await ghlService.updatePipelineStage(contact.id, 'sales_pipeline_01', 'stage_booking_requested', 1500);
        await ghlService.addNoteToContact(contact.id, `[System Notice] Lead intent matching identified: Booking Intent. Pipeline Updated.`);
      }

      // Respond back to webhook caller
      console.log(`[GHL WEBHOOK] Synthesized response text: "${responseText}"`);
      res.status(200).json({ reply: responseText, bookingIntent: wantsToBook });
    } catch (error: any) {
      console.error('[GHL WEBHOOK ERROR] handleIncomingSMS failed:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Captures customer web form submissions to dynamically establish lead profiles.
   */
  async handleWebFormSubmit(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, phone, email, businessName } = req.body;

      if (!phone || !firstName) {
        res.status(400).json({ error: 'Missing parameters: phone and firstName' });
        return;
      }

      console.log(`[GHL WEBHOOK] Form submitted by ${firstName} ${lastName || ''} (${phone})`);

      const contact = await ghlService.createOrUpdateContact({
        firstName,
        lastName,
        phone,
        email,
        companyName: businessName || 'Local Prospect'
      });

      // Move to initial "New Lead Inflow" pipeline stage
      await ghlService.updatePipelineStage(contact.id, 'sales_pipeline_01', 'stage_new_lead', 1000);
      await ghlService.addNoteToContact(contact.id, `[Form Submission] New lead profile created via website form capture.`);

      res.status(200).json({ message: 'Form Webhook processed successfully', contactId: contact.id });
    } catch (error: any) {
      console.error('[GHL WEBHOOK ERROR] handleWebFormSubmit failed:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
}
