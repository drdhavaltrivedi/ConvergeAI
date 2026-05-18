import { config } from '../config/env';

export interface GHLContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  companyName?: string;
}

export interface GHLContactResponse {
  id: string;
  firstName: string;
  phone: string;
  status: string;
}

export class GHLService {
  private apiToken: string;
  private locationId: string;

  constructor() {
    this.apiToken = config.GHL_API_KEY;
    this.locationId = config.GHL_LOCATION_ID;
  }

  /**
   * Creates or updates a contact record inside the target GHL sub-account.
   */
  async createOrUpdateContact(input: GHLContactInput): Promise<GHLContactResponse> {
    if (this.apiToken.startsWith('MOCK_')) {
      console.log('[MOCK GHL] Creating contact record in sub-account CRM:', input);
      return {
        id: `ghl_con_${Math.floor(100000 + Math.random() * 900000)}`,
        firstName: input.firstName,
        phone: input.phone,
        status: 'mock_created'
      };
    }

    try {
      // In production, we call the official GHL Contacts API v2
      const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Version': '2021-04-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: input.firstName,
          lastName: input.lastName || '',
          email: input.email || '',
          phone: input.phone,
          locationId: this.locationId,
          companyName: input.companyName || ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL Create Contact Request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      return {
        id: data.contact.id,
        firstName: data.contact.firstName,
        phone: data.contact.phone,
        status: 'live_created'
      };
    } catch (error) {
      console.error('[GHL SERVICE ERROR] Failed to upsert contact:', error);
      throw error;
    }
  }

  /**
   * Adds intake notes, transcript summaries, or FAQs to a GHL contact record.
   */
  async addNoteToContact(contactId: string, noteContent: string): Promise<boolean> {
    if (this.apiToken.startsWith('MOCK_')) {
      console.log(`[MOCK GHL] Appending intake note to contact ${contactId}: "${noteContent}"`);
      return true;
    }

    try {
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Version': '2021-04-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: noteContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL Add Note failed: ${response.status} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('[GHL SERVICE ERROR] Failed to add contact note:', error);
      return false;
    }
  }

  /**
   * Updates pipeline staging to organize and monitor opportunities.
   */
  async updatePipelineStage(contactId: string, pipelineId: string, stageId: string, leadValue: number = 0): Promise<boolean> {
    if (this.apiToken.startsWith('MOCK_')) {
      console.log(`[MOCK GHL] Moving contact ${contactId} in pipeline ${pipelineId} to Stage: ${stageId} (Est Value: $${leadValue})`);
      return true;
    }

    try {
      const response = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Version': '2021-04-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          pipelineId,
          stageId,
          status: 'open',
          monetaryValue: leadValue,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL Update Opportunity failed: ${response.status} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('[GHL SERVICE ERROR] Failed to update pipeline opportunity:', error);
      return false;
    }
  }

  /**
   * Inserts calendar booking events directly to sub-account calendars.
   */
  async bookCalendarAppointment(
    contactId: string,
    calendarId: string,
    startTime: string,
    timezone: string = 'America/New_York'
  ): Promise<boolean> {
    if (this.apiToken.startsWith('MOCK_')) {
      console.log(`[MOCK GHL] Booking slot on GHL Calendar ${calendarId} for contact ${contactId} starting: ${startTime} (${timezone})`);
      return true;
    }

    try {
      const response = await fetch(`https://services.leadconnectorhq.com/calendars/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Version': '2021-04-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          calendarId,
          startTime,
          timezone,
          title: 'ConvergeAI Scheduled Appointment'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL Calendar booking failed: ${response.status} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('[GHL SERVICE ERROR] Failed to book appointment:', error);
      return false;
    }
  }
}
