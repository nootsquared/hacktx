/**
 * This is a one-time use script to generate a Google OAuth2 refresh token.
 * * Instructions:
 * 1. Make sure you have your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from your Google Cloud Console project.
 * 2. Add 'http://localhost:3000/oauth2callback' as an "Authorized redirect URI" in your Google Cloud credentials page.
 * 3. Fill in the 'YOUR_CLIENT_ID' and 'YOUR_CLIENT_SECRET' placeholders below.
 * 4. Run this script from your terminal: `node scripts/getRefreshToken.js`
 * 5. The script will print a URL. Copy and paste it into your browser.
 * 6. Sign in with your Google account and grant the requested permissions (for Calendar and Gmail).
 * 7. You will be redirected to a blank page (this is expected). Copy the ENTIRE URL from your browser's address bar.
 * 8. Paste the full URL back into the terminal where the script is waiting.
 * 9. The script will extract the authorization code and exchange it for a refresh token.
 * 10. Copy the printed refresh token and paste it into your `.env.local` file.
 */

const { google } = require('googleapis');
const readline = require('readline');

// --- IMPORTANT: Fill these in with your credentials ---
const GOOGLE_CLIENT_ID = "140285542739-2h5llbljiccokbg7qgfa2t6nhfs41nkb.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// The permissions your agent needs
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
];

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID' || GOOGLE_CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
    console.error('Please fill in your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the script.');
    process.exit(1);
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' is required to get a refresh token
    scope: SCOPES,
    prompt: 'consent', // Ensures you get a refresh token every time
  });

  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);

  rl.question('\nEnter the full URL you were redirected to after authorization: ', async (url) => {
    rl.close();
    try {
      // Extract the 'code' from the URL
      const urlParams = new URL(url).searchParams;
      const code = urlParams.get('code');

      if (!code) {
        console.error('Could not find authorization code in the URL.');
        return;
      }
      
      console.log(`\nReceived authorization code: ${code.substring(0, 20)}...`);

      // Exchange the code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      if (tokens.refresh_token) {
        console.log('\nSUCCESS! Here is your refresh token:');
        console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token); // Print in green
        console.log('\nCopy this token and paste it into your .env.local file for the GOOGLE_REFRESH_TOKEN variable.');
      } else {
        console.error('\nError: A refresh token was not provided by Google. This can happen if you have already authorized this app.');
        console.log('To fix this, go to your Google Account settings (https://myaccount.google.com/permissions) and remove access for your app, then run this script again.');
      }
    } catch (e) {
      console.error('Error getting refresh token:', e.message);
    }
  });
}

main().catch(console.error);
