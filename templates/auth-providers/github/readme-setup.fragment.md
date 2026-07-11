### GitHub

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Authorization callback URL** (exact):
   ```
   http://localhost:3000/api/auth/callback/github
   ```
3. Copy the client ID/secret into `apps/api/.env` (`GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET`).
