# Contact form email setup

The contact form posts to `/api/contact`, which sends the message to your inbox through the **Gmail API** with the `gmail.send` scope. That scope can only send mail: it can't read, change or delete anything in the mailbox. (The full SMTP scope, `https://mail.google.com/`, would grant all of those.)

It's the same OAuth refresh-token approach as the Grand Debate portal, with the narrower API scope.

You need five values: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER`, and optionally `CONTACT_TO`.

> Use a **personal Gmail account** for sending. University Workspace accounts (like `nu.edu.pk`) often block third-party apps. `CONTACT_TO` can still be any address you like.

## 1. Google Cloud project
1. Go to https://console.cloud.google.com/ and create a project (e.g. "portfolio-contact").
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.

## 2. OAuth consent screen
1. **APIs & Services → OAuth consent screen** (called "Google Auth Platform" in newer consoles).
2. User type **External**, then fill in the app name and your email.
3. **Scopes / Data access** → add `https://www.googleapis.com/auth/gmail.send`.
4. **Audience / Test users** → add your Gmail address.
5. **Publish the app** (Publishing status → *In production*).
   While it's in *Testing*, Google expires refresh tokens after **7 days** and the form would stop working.
   You don't need Google's verification for your own account: when you sign in, you'll see "Google hasn't verified this app". Click **Advanced → Go to … (unsafe)**. It's your own app.

## 3. OAuth client
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Desktop app**. Create.
3. Copy the **Client ID** and **Client secret** into `.env.local` (copy `.env.example` first):
   ```
   GMAIL_CLIENT_ID=…apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=…
   GMAIL_SENDER=yourname@gmail.com
   CONTACT_TO=yourname@gmail.com
   ```

## 4. Get the refresh token
```bash
node --env-file=.env.local scripts/get-gmail-token.mjs
```
Open the link it prints, sign in with the **same Gmail as `GMAIL_SENDER`**, and allow. The terminal prints `GMAIL_REFRESH_TOKEN=…`; paste that line into `.env.local`.

## 5. Try it locally
`npm run dev`, then send yourself a message from the form. Without the `GMAIL_*` values, dev mode doesn't send anything: it prints the message in the terminal instead.

## 6. Production
- **Netlify:** Site configuration → Environment variables → add all five (scope: Functions). Redeploy.
- **Docker:** `docker run -p 8080:8080 --env-file .env.local ghcr.io/zidarc/portfolio`, then open http://localhost:8080.

## Keep it secret
`.env.local` is git-ignored. Never commit the client secret or refresh token or paste them anywhere public. If they leak, delete the OAuth client in Google Cloud (that revokes the token) and repeat steps 3–4.

## Spam protection (built in)
- A hidden "website" field that only bots fill in.
- Submissions faster than 3 seconds after the page loads are dropped.
- At most 5 messages per 10 minutes per IP. This is best-effort, since each serverless instance counts separately.

Bots get a fake "sent!" so they don't learn anything.
