### Google

Because of the same-origin proxy, the OAuth callback points at the **frontend
origin** (`WEB_URL`), not the API port.

1. Go to **Google Cloud Console → APIs &amp; Services → Credentials**.
2. Create an **OAuth client ID** → application type **Web application**.
3. Authorized redirect URI (exact):
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   In production use `https://your-domain.com/api/auth/callback/google`.
4. Copy the client ID/secret into `apps/api/.env` (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`).
