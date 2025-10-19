import { google } from 'googleapis';

// This is a crucial part: You need to set up OAuth2 correctly.
// In a real application, you'd have a full OAuth2 flow where the user logs in
// and you store their refresh token securely in a database.
// For this example, we're using the credentials from environment variables.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // This is your redirect URI, it must be registered in your Google Cloud Console
  'http://localhost:3000/api/auth/callback/google'
);

// Set the credentials from the refresh token. This allows you to get a new
// access token without user interaction.
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Adds an event to the primary Google Calendar.
 * @param {object} eventDetails - The details of the event.
 * @param {string} eventDetails.summary - The event title.
 * @param {string} eventDetails.description - The event description.
 * @param {string} eventDetails.location - The event location.
 * @param {string} eventDetails.startDateTime - The event start time in ISO format.
 * @param {string} eventDetails.endDateTime - The event end time in ISO format.
 * @returns {Promise<object>} The created event data from the API.
 */
export async function addEventToCalendar({ summary, description, location, startDateTime, endDateTime }) {
  try {
    const event = {
      summary,
      location,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Chicago', // It's good practice to specify a timezone
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Chicago',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Error adding event to calendar:', error.message);
    throw new Error('Failed to create calendar event.');
  }
}


/**
 * Sends an email using the user's Gmail account.
 * @param {object} emailDetails - The details of the email.
 * @param {string} emailDetails.to - The recipient's email address.
 * @param {string} emailDetails.subject - The email subject.
 * @param {string} emailDetails.body - The email body.
 * @returns {Promise<object>} The sent email data from the API.
 */
export async function sendEmail({ to, subject, body }) {
    try {
        const emailContent = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            body
        ].join('\n');

        // Emails need to be base64url encoded
        const encodedEmail = Buffer.from(emailContent).toString('base64url');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail,
            },
        });

        console.log('Email sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Failed to send email.');
    }
}

