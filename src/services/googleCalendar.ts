import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { TokenStore, ITokenStore } from '../models/TokenStore';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Initialize Google Calendar API
const calendar = google.calendar('v3');

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
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
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

export interface CreateEventResponse {
  eventId: string;
  meetUrl?: string;
  htmlLink: string;
  status: string;
}

/**
 * Get or refresh OAuth2 client for faculty member
 * @param facultyId - Faculty member's user ID
 * @returns Authenticated OAuth2 client
 */
export async function getAuthenticatedClient(
  facultyId: string
): Promise<OAuth2Client> {
  try {
    // Find stored tokens for faculty
    const tokenStore = (await TokenStore.findOne({
      facultyId: new mongoose.Types.ObjectId(facultyId),
      provider: 'google',
    }).select('+accessToken +refreshToken')) as ITokenStore | null;

    if (!tokenStore) {
      throw new Error(
        'No Google tokens found for faculty. Please re-authenticate.'
      );
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: tokenStore.accessToken,
      refresh_token: tokenStore.refreshToken,
      expiry_date: tokenStore.expiresAt.getTime(),
    });

    // Check if token needs refresh
    if (tokenStore.expiresAt <= new Date()) {
      logger.info(`Refreshing expired token for faculty: ${facultyId}`);

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update stored tokens
        tokenStore.accessToken = credentials.access_token!;
        if (credentials.refresh_token) {
          tokenStore.refreshToken = credentials.refresh_token;
        }
        tokenStore.expiresAt = new Date(credentials.expiry_date!);
        await tokenStore.save();

        logger.info(`Token refreshed successfully for faculty: ${facultyId}`);
      } catch (refreshError) {
        logger.error(
          `Token refresh failed for faculty ${facultyId}:`,
          refreshError
        );
        throw new Error('Token refresh failed. Please re-authenticate.');
      }
    }

    return oauth2Client;
  } catch (error) {
    logger.error(
      `Failed to get authenticated client for faculty ${facultyId}:`,
      error
    );
    throw error;
  }
}

/**
 * Store OAuth tokens for faculty member
 * @param facultyId - Faculty member's user ID
 * @param tokens - OAuth tokens from Google
 */
export async function storeOAuthTokens(
  facultyId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
  }
): Promise<void> {
  try {
    const expiresAt = tokens.expiryDate
      ? new Date(tokens.expiryDate)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    await TokenStore.findOneAndUpdate(
      {
        facultyId: new mongoose.Types.ObjectId(facultyId),
        provider: 'google',
      },
      {
        facultyId: new mongoose.Types.ObjectId(facultyId),
        provider: 'google',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        expiresAt,
        scopes: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      },
      {
        upsert: true,
        new: true,
      }
    );

    logger.info(`OAuth tokens stored for faculty: ${facultyId}`);
  } catch (error) {
    logger.error(
      `Failed to store OAuth tokens for faculty ${facultyId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create a calendar event with Google Meet link
 * @param facultyId - Faculty member's user ID
 * @param eventData - Event details
 * @returns Created event information
 */
export async function createCalendarEvent(
  facultyId: string,
  eventData: CalendarEvent
): Promise<CreateEventResponse> {
  try {
    const auth = await getAuthenticatedClient(facultyId);

    // Generate unique request ID for Meet conference
    const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Prepare event with Meet conference
    const event: calendar_v3.Schema$Event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'Asia/Kolkata',
      },
      attendees: eventData.attendees?.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
      })),
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Create the event
    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1, // Required for Meet link generation
      sendUpdates: 'all', // Send invitations to attendees
    });

    if (!response.data) {
      throw new Error('No response data from Calendar API');
    }

    const createdEvent = response.data;
    const meetUrl = createdEvent.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    logger.info(
      `Calendar event created: ${createdEvent.id} with Meet URL: ${meetUrl}`
    );

    return {
      eventId: createdEvent.id!,
      meetUrl: meetUrl || undefined,
      htmlLink: createdEvent.htmlLink!,
      status: createdEvent.status!,
    };
  } catch (error) {
    logger.error(
      `Failed to create calendar event for faculty ${facultyId}:`,
      error
    );

    if (error instanceof Error) {
      if (error.message.includes('insufficient authentication scopes')) {
        throw new Error(
          'Insufficient permissions. Please re-authenticate with calendar access.'
        );
      }
      if (error.message.includes('Daily Limit Exceeded')) {
        throw new Error(
          'Google Calendar API quota exceeded. Please try again later.'
        );
      }
    }

    throw new Error(
      `Calendar event creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update an existing calendar event
 * @param facultyId - Faculty member's user ID
 * @param eventId - Google Calendar event ID
 * @param eventData - Updated event details
 * @returns Updated event information
 */
export async function updateCalendarEvent(
  facultyId: string,
  eventId: string,
  eventData: Partial<CalendarEvent>
): Promise<CreateEventResponse> {
  try {
    const auth = await getAuthenticatedClient(facultyId);

    // Prepare update data
    const updateData: calendar_v3.Schema$Event = {};

    if (eventData.summary) updateData.summary = eventData.summary;
    if (eventData.description) updateData.description = eventData.description;
    if (eventData.start) {
      updateData.start = {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'Asia/Kolkata',
      };
    }
    if (eventData.end) {
      updateData.end = {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'Asia/Kolkata',
      };
    }
    if (eventData.attendees) {
      updateData.attendees = eventData.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
      }));
    }

    // Update the event
    const response = await calendar.events.update({
      auth,
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
      sendUpdates: 'all',
    });

    if (!response.data) {
      throw new Error('No response data from Calendar API');
    }

    const updatedEvent = response.data;
    const meetUrl = updatedEvent.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    logger.info(`Calendar event updated: ${eventId}`);

    return {
      eventId: updatedEvent.id!,
      meetUrl: meetUrl || undefined,
      htmlLink: updatedEvent.htmlLink!,
      status: updatedEvent.status!,
    };
  } catch (error) {
    logger.error(
      `Failed to update calendar event ${eventId} for faculty ${facultyId}:`,
      error
    );
    throw new Error(
      `Calendar event update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a calendar event
 * @param facultyId - Faculty member's user ID
 * @param eventId - Google Calendar event ID
 */
export async function deleteCalendarEvent(
  facultyId: string,
  eventId: string
): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(facultyId);

    await calendar.events.delete({
      auth,
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all', // Notify attendees
    });

    logger.info(`Calendar event deleted: ${eventId}`);
  } catch (error) {
    logger.error(
      `Failed to delete calendar event ${eventId} for faculty ${facultyId}:`,
      error
    );

    // Don't throw error if event doesn't exist
    if (error instanceof Error && error.message.includes('Not Found')) {
      logger.warn(
        `Calendar event ${eventId} not found, may have been already deleted`
      );
      return;
    }

    throw new Error(
      `Calendar event deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get calendar event details
 * @param facultyId - Faculty member's user ID
 * @param eventId - Google Calendar event ID
 * @returns Event details
 */
export async function getCalendarEvent(
  facultyId: string,
  eventId: string
): Promise<calendar_v3.Schema$Event> {
  try {
    const auth = await getAuthenticatedClient(facultyId);

    const response = await calendar.events.get({
      auth,
      calendarId: 'primary',
      eventId,
    });

    if (!response.data) {
      throw new Error('Event not found');
    }

    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get calendar event ${eventId} for faculty ${facultyId}:`,
      error
    );
    throw new Error(
      `Failed to retrieve calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate Google OAuth URL for calendar access
 * @param facultyId - Faculty member's user ID
 * @param state - Optional state parameter
 * @returns Authorization URL
 */
export function generateCalendarAuthUrl(
  facultyId: string,
  state?: string
): string {
  const oauth2Client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    state: state || facultyId,
    prompt: 'consent', // Force consent to get refresh token
  });

  return authUrl;
}

/**
 * Check if faculty has valid calendar permissions
 * @param facultyId - Faculty member's user ID
 * @returns true if has valid permissions
 */
export async function hasCalendarPermissions(
  facultyId: string
): Promise<boolean> {
  try {
    const tokenStore = await TokenStore.findOne({
      facultyId: new mongoose.Types.ObjectId(facultyId),
      provider: 'google',
    });

    if (!tokenStore) {
      return false;
    }

    // Check if token includes calendar scope
    const hasCalendarScope = tokenStore.scopes.includes(
      'https://www.googleapis.com/auth/calendar.events'
    );

    // Check if token is not expired (with 5 minute buffer)
    const isNotExpired =
      tokenStore.expiresAt > new Date(Date.now() + 5 * 60 * 1000);

    return hasCalendarScope && isNotExpired;
  } catch (error) {
    logger.error(
      `Failed to check calendar permissions for faculty ${facultyId}:`,
      error
    );
    return false;
  }
}
