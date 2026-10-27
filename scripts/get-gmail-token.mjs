// One-time helper: signs in to Google and prints a refresh token for the contact form.
// Asks only for the `gmail.send` scope (send mail; it can't read or delete anything).
//
// Usage (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in .env.local, see docs/email-setup.md):
//   node --env-file=.env.local scripts/get-gmail-token.mjs

import { createServer } from 'node:http';

const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local first.');
  process.exit(1);
}

const PORT = 53682;
const redirectUri = `http://127.0.0.1:${PORT}`;
const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
    prompt: 'consent',
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', redirectUri);
  const code = url.searchParams.get('code');
  if (!code) {
    res.end(url.searchParams.get('error') ?? 'Waiting for Google…');
    return;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await tokenRes.json();

  if (!data.refresh_token) {
    res.end('No refresh token came back. See the terminal.');
    console.error('\nGoogle answered:', data);
  } else {
    res.end('Done! Go back to the terminal. You can close this tab.');
    console.log('\nAdd this line to .env.local (and to Netlify / Docker env):\n');
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);
  }
  server.close();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this link, sign in with the Gmail account that should send the mail, and allow access:\n');
  console.log(authUrl, '\n');
});
