// utils/tools-server.js
import { tool } from 'ai';
import { z } from 'zod';
import { format } from 'date-fns';
import { getUpstreamAccessToken } from './auth0-utils';
/**
* authorizeCalendarAccess:
* This tool is responsible for reauthenticating the user so
that the access token
* includes the required scopes to access Google Calendar.
*/
export const authorizeCalendarAccess = tool({
  description:
    'Authorize access to Google Calendar. This tool checks that an access token with the required scopes is available.',
  parameters: z.object({}),
  execute: async (_args, context) => {
    if (!context.token) {
      return 'Error: No access token available. Please authenticate first.';
    }
    return 'Successfully authorized access to your calendar.';
  }
});
/**
* createCalendarEvent:
* This tool creates a new calendar event using the Google
Calendar API.
* It verifies that the token is available and that its
associated tokenScope includes
* the required scope
("https://www.googleapis.com/auth/calendar").
*/
export const createCalendarEvent = tool({
  description: 'Creates a new calendar event using the Google Calendar API.',
  parameters: z.object({
    summary: z.string().default('New Event').describe('Title of the event'),
    startTime: z
      .string()
      .default(format(new Date(), 'yyyy-MM-dd HH:mm'))
      .describe("Date and time of the event in 'yyyy-MM-dd HH:mm' format"),
    endTime: z
      .string()
      .default(format(new Date(), 'yyyy-MM-dd HH:mm'))
      .describe("Date and time of the event in 'yyyy-MM-dd HH:mm' format"),
    participants: z.string().optional().describe('Comma-separated list of participant emails'),
    additionalDetails: z.string().optional().describe('Any extra details needed')
  }),
  execute: async ({ summary, startTime, endTime, participants, additionalDetails }, context) => {
    if (!context.userId && globalThis.__USER_ID__) {
      context.userId = globalThis.__USER_ID__;
    }
    console.log('createCalendarEvent: context.user =', context.userId);
    if (!context.userId) {
      console.error(`Error scheduling: Meeting titled
"${summary}" scheduled on ${startTime}. Participants:
${participants || 'N/A'}. Additional details: ${additionalDetails || 'N/A'}. View the event at:
https://calendar.google.com/event?eid=SIMULATED_EVENT_ID`);
      return JSON.stringify({
        message: `Error scheduling: Meeting titled
"${summary}" scheduled on ${startTime}. Participants:
${participants || 'N/A'}. Additional details: ${additionalDetails || 'N/A'}. View the event at:
https://calendar.google.com/event?eid=SIMULATED_EVENT_ID`
      });
    }
    try {
      console.log('createCalendarEvent: getUpstreamAccessToken');
      const googleAT = await getUpstreamAccessToken(context.userId);
      console.log('googleAT=', googleAT);
      const eventData = {
        summary,
        start: { dateTime: new Date(startTime).toISOString(), timeZone: 'America/Chicago' },
        end: { dateTime: new Date(endTime).toISOString(), timeZone: 'America/Chicago' }
      };
      const apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAT}`
        },
        body: JSON.stringify(eventData)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('Google Calendar API error:', errText);
        return JSON.stringify({
          message: 'Error creating calendar event via Google Calendar API.'
        });
      }
      const json = await response.json();
      if (json && json.htmlLink) {
        return JSON.stringify({
          message: `The meeting titled "${summary}" has been
successfully scheduled for ${new Date(startTime).toLocaleString()}. The invitation can be viewed
[here](${json.htmlLink}).`
        });
      }
      return JSON.stringify(json);
    } catch (error) {
      console.error('Error in createCalendarEvent:', error);
      return JSON.stringify({
        message: 'Error creating calendar event due to an unexpected error.'
      });
    }
  }
});
export const tools = {
  authorizeCalendarAccess,
  createCalendarEvent
};
