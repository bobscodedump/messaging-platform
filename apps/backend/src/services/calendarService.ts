import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

// Initialize Google Calendar API
const calendar = google.calendar('v3');

export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
    }>;
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

export interface CreateEventParams {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
    attendees?: string[]; // Array of email addresses
    sendNotifications?: boolean;
}

export class CalendarService {
    private auth;
    private calendarId: string;

    constructor(accessToken: string, calendarId: string) {
        this.auth = new google.auth.OAuth2();
        this.auth.setCredentials({ access_token: accessToken });
        this.calendarId = calendarId;
    }

    /**
     * List events from the calendar
     */
    async listEvents(
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 50
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const response = await calendar.events.list({
                auth: this.auth,
                calendarId: this.calendarId,
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error listing calendar events:', error);
            throw new Error('Failed to fetch calendar events');
        }
    }

    /**
     * Get a single event by ID
     */
    async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
        try {
            const response = await calendar.events.get({
                auth: this.auth,
                calendarId: this.calendarId,
                eventId: eventId,
            });

            return response.data;
        } catch (error) {
            console.error('Error getting calendar event:', error);
            throw new Error('Failed to fetch calendar event');
        }
    }

    /**
     * Create a new calendar event
     */
    async createEvent(params: CreateEventParams): Promise<calendar_v3.Schema$Event> {
        try {
            const event: calendar_v3.Schema$Event = {
                summary: params.summary,
                description: params.description,
                location: params.location,
                start: {
                    dateTime: params.startDateTime,
                    timeZone: params.timeZone || 'Asia/Singapore',
                },
                end: {
                    dateTime: params.endDateTime,
                    timeZone: params.timeZone || 'Asia/Singapore',
                },
                attendees: params.attendees?.map((email) => ({ email })),
                reminders: {
                    useDefault: true,
                },
            };

            const response = await calendar.events.insert({
                auth: this.auth,
                calendarId: this.calendarId,
                requestBody: event,
                sendUpdates: params.sendNotifications ? 'all' : 'none',
            });

            return response.data;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw new Error('Failed to create calendar event');
        }
    }

    /**
     * Update an existing calendar event
     */
    async updateEvent(
        eventId: string,
        params: Partial<CreateEventParams>
    ): Promise<calendar_v3.Schema$Event> {
        try {
            // First get the existing event
            const existingEvent = await this.getEvent(eventId);

            // Merge with updates
            const updatedEvent: calendar_v3.Schema$Event = {
                ...existingEvent,
                summary: params.summary || existingEvent.summary,
                description: params.description !== undefined ? params.description : existingEvent.description,
                location: params.location !== undefined ? params.location : existingEvent.location,
            };

            if (params.startDateTime) {
                updatedEvent.start = {
                    dateTime: params.startDateTime,
                    timeZone: params.timeZone || 'Asia/Singapore',
                };
            }

            if (params.endDateTime) {
                updatedEvent.end = {
                    dateTime: params.endDateTime,
                    timeZone: params.timeZone || 'Asia/Singapore',
                };
            }

            if (params.attendees) {
                updatedEvent.attendees = params.attendees.map((email) => ({ email }));
            }

            const response = await calendar.events.update({
                auth: this.auth,
                calendarId: this.calendarId,
                eventId: eventId,
                requestBody: updatedEvent,
                sendUpdates: params.sendNotifications ? 'all' : 'none',
            });

            return response.data;
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw new Error('Failed to update calendar event');
        }
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(eventId: string, sendNotifications: boolean = false): Promise<void> {
        try {
            await calendar.events.delete({
                auth: this.auth,
                calendarId: this.calendarId,
                eventId: eventId,
                sendUpdates: sendNotifications ? 'all' : 'none',
            });
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw new Error('Failed to delete calendar event');
        }
    }

    /**
     * Quick add event using natural language
     */
    async quickAddEvent(text: string): Promise<calendar_v3.Schema$Event> {
        try {
            const response = await calendar.events.quickAdd({
                auth: this.auth,
                calendarId: this.calendarId,
                text: text,
            });

            return response.data;
        } catch (error) {
            console.error('Error quick adding calendar event:', error);
            throw new Error('Failed to quick add calendar event');
        }
    }
}

/**
 * Helper function to create CalendarService instance
 */
export function createCalendarService(
    accessToken: string,
    calendarId: string
): CalendarService {
    return new CalendarService(accessToken, calendarId);
}
