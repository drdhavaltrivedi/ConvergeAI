import { Request, Response } from 'express';
import { GHLService } from '../services/ghl.service';

const ghlService = new GHLService();

export class VapiWebhookController {
  /**
   * Main webhook route capturing Vapi call updates, tool executes, and end-of-call briefs.
   */
  async handleVapiWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const messageType = payload.message?.type;

      console.log(`[VAPI WEBHOOK] Received webhook callback. Event Type: ${messageType || 'Unknown'}`);

      if (!messageType) {
        res.status(400).json({ error: 'Missing message.type payload descriptor' });
        return;
      }

      switch (messageType) {
        case 'end-of-call-report':
          await this.processEndOfCallReport(payload, res);
          break;

        case 'function-call':
          await this.processAssistantFunctionCall(payload, res);
          break;

        default:
          console.log(`[VAPI WEBHOOK] Unhandled event: ${messageType}. Skipping processing.`);
          res.status(200).json({ status: 'ignored' });
          break;
      }
    } catch (error: any) {
      console.error('[VAPI WEBHOOK ERROR] handleVapiWebhook failed:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Processes transcripts, costs, summaries, and transfers outcomes to GoHighLevel contacts.
   */
  private async processEndOfCallReport(payload: any, res: Response): Promise<void> {
    const callData = payload.message?.call;
    const customerPhone = callData?.customer?.number;
    const transcript = callData?.transcript;
    const summary = callData?.analysis?.summary || 'No summary generated.';
    const appointmentBooked = callData?.analysis?.structuredData?.appointmentBooked || false;
    const callCost = callData?.cost || 0;
    const callDuration = callData?.duration || 0;

    console.log(`[VAPI END OF CALL] Phone: ${customerPhone}. Duration: ${callDuration}s. Cost: $${callCost}. Booked: ${appointmentBooked}`);

    if (!customerPhone) {
      res.status(400).json({ error: 'Missing customer phone number in call report' });
      return;
    }

    try {
      // Step 1: Query or initialize contact record in CRM
      const contact = await ghlService.createOrUpdateContact({
        firstName: 'Voice Call Lead',
        phone: customerPhone
      });

      // Step 2: Log complete voice summary, duration metrics, and transcript as CRM contact notes
      const notesBlock = `
=== VAPI.AI VOICE RECEPTIONAL CALL SUMMARY ===
* Call Status: COMPLETED
* Duration: ${Math.round(callDuration)} seconds
* Calculated Cost: $${callCost.toFixed(2)}
* Appointment Booked: ${appointmentBooked ? 'YES' : 'NO'}

* AI Executive Summary:
${summary}

* Full Call Transcript:
${transcript || 'No transcript text available.'}
==============================================
      `;

      await ghlService.addNoteToContact(contact.id, notesBlock);

      // Step 3: Transition GHL CRM Opportunity Stage depending on outcome
      if (appointmentBooked) {
        console.log(`[PIPELINE UPDATE] Call outcome: BOOKED. Relocating GHL opportunity...`);
        // Move to "Appointment Confirmed" pipeline stage (MOCK IDs)
        await ghlService.updatePipelineStage(contact.id, 'sales_pipeline_01', 'stage_appointment_confirmed', 2000);
      } else {
        console.log(`[PIPELINE UPDATE] Call outcome: COMPLETED (No booking). Moving to nurture...`);
        // Move to "Nurture / Follow-up Needed" pipeline stage
        await ghlService.updatePipelineStage(contact.id, 'sales_pipeline_01', 'stage_voice_follow_up', 1000);
      }

      res.status(200).json({ status: 'success', contactId: contact.id, loggedNote: true });
    } catch (error: any) {
      console.error('[VAPI WEBHOOK ERROR] processEndOfCallReport failed:', error);
      res.status(500).json({ error: error.message || 'CRM sync failed' });
    }
  }

  /**
   * Handles interactive live functions (e.g. checking calendars and locking slots) called by the Vapi.ai assistant mid-call.
   */
  private async processAssistantFunctionCall(payload: any, res: Response): Promise<void> {
    const functionCall = payload.message?.functionCall;
    const functionName = functionCall?.name;
    const parameters = functionCall?.parameters;
    const customerPhone = payload.message?.call?.customer?.number;

    console.log(`[VAPI FUNCTION CALL] Mid-call event triggered: "${functionName}" with params:`, parameters);

    try {
      if (functionName === 'bookAppointment') {
        const { date, time } = parameters;
        
        console.log(`[VAPI FUNCTION CALL] Booking slot: ${date} at ${time} for client phone ${customerPhone}`);

        // Perform calendar lookup & booking in GHL CRM
        const contact = await ghlService.createOrUpdateContact({
          firstName: 'Voice Call Lead',
          phone: customerPhone
        });

        // Parse date/time strings into an ISO start format
        const targetISOStart = `${date}T${time}:00Z`;
        const bookingSuccess = await ghlService.bookCalendarAppointment(
          contact.id,
          'calendar_default_subaccount',
          targetISOStart
        );

        if (bookingSuccess) {
          res.status(201).json({
            results: {
              success: true,
              message: `Appointment successfully booked for ${date} at ${time}. Confirmation SMS sent.`
            }
          });
        } else {
          res.status(400).json({
            results: {
              success: false,
              message: 'Target slot is no longer available. Please select another time.'
            }
          });
        }
      } else {
        // Unknown assistant tool call requested
        res.status(404).json({ error: `Function ${functionName} not recognized` });
      }
    } catch (error: any) {
      console.error('[VAPI WEBHOOK ERROR] processAssistantFunctionCall failed:', error);
      res.status(500).json({ error: error.message || 'Function execution error' });
    }
  }
}
