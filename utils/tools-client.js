// utils/tools-client.js
import { tool } from 'ai';
import { z } from 'zod';
import { format } from 'date-fns';
// These definitions only include metadata.
// Notice: There is no `execute` function here.
export const authorizeCalendarAccess = tool({
  description: 'Authorize access to Google Calendar. (This tool requires you to authenticate first.)',
  parameters: z.object({})
});
export const createCalendarEvent = tool({
  description: 'Creates a new calendar event using the Google Calendar API.',
  parameters: z.object({
    summary: z.string().default('New Event').describe('Title of the event'),
    startTime: z
      .string()
      .default(format(new Date(), 'yyyy-MM-dd HH:mm'))
      .describe("Start time in the format 'yyyy-MM-dd HH:mm'"),
    endTime: z
      .string()
      .default(format(new Date(), 'yyyy-MM-dd HH:mm'))
      .describe("End time in the format 'yyyy-MM-dd HH:mm'")
  })
});
export const tools = {
  authorizeCalendarAccess,
  createCalendarEvent
};
